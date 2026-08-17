package com.bannana.recommendation.service;

import com.bannana.recommendation.client.OdsayClient;
import com.bannana.recommendation.config.RecommendationProperties;
import com.bannana.recommendation.domain.GeoPoint;
import com.bannana.recommendation.domain.Participant;
import com.bannana.recommendation.domain.ScoredCandidate;
import com.bannana.recommendation.domain.Station;
import com.bannana.recommendation.domain.TransportMode;
import com.bannana.recommendation.domain.TravelTimeMatrix;
import com.bannana.recommendation.service.station.StationProvider;
import com.bannana.recommendation.web.dto.CandidateDto;
import com.bannana.recommendation.web.dto.ParticipantRequest;
import com.bannana.recommendation.web.dto.RecommendationRequest;
import com.bannana.recommendation.web.dto.RecommendationResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * 명세의 처리 순서 1~4단계를 조립한다.
 *
 * <ol>
 *   <li>출발지 좌표의 단순 평균으로 중심점 계산</li>
 *   <li>중심점 주변 지하철역 후보 선정</li>
 *   <li>(후보 × 참여자) 대중교통 이동시간 조회 — 실패한 조합은 버리고 진행</li>
 *   <li>gap_minutes 기준 상위 3개 선정</li>
 * </ol>
 */
@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    /** 전체 ODsay 조회에 허용하는 총 시간. 넘기면 그때까지 모인 결과만으로 계산한다. */
    private static final Duration LOOKUP_BUDGET = Duration.ofSeconds(25);

    private final StationProvider stationProvider;
    private final OdsayClient odsayClient;
    private final CandidateScorer candidateScorer;
    private final RecommendationProperties properties;
    private final ExecutorService travelTimeExecutor;

    public RecommendationService(
            StationProvider stationProvider,
            OdsayClient odsayClient,
            CandidateScorer candidateScorer,
            RecommendationProperties properties,
            ExecutorService travelTimeExecutor) {
        this.stationProvider = stationProvider;
        this.odsayClient = odsayClient;
        this.candidateScorer = candidateScorer;
        this.properties = properties;
        this.travelTimeExecutor = travelTimeExecutor;
    }

    public RecommendationResponse recommend(RecommendationRequest request) {
        List<Participant> participants = toParticipants(request);

        GeoPoint center = GeoPoint.centroid(participants.stream().map(Participant::origin).toList());
        log.debug("참여자 {}명의 중심점: {},{}", participants.size(), center.lat(), center.lng());

        List<Station> stations =
                stationProvider.findCandidates(center, properties.minCandidates(), properties.maxCandidates());
        if (stations.isEmpty()) {
            throw new RecommendationUnavailableException("중심점 주변에서 후보 역을 찾지 못했습니다.");
        }

        TravelTimeMatrix matrix = lookupTravelTimes(stations, participants);

        List<ScoredCandidate> scored = new ArrayList<>();
        for (Station station : stations) {
            candidateScorer.score(station, participants, matrix).ifPresent(scored::add);
        }

        if (scored.isEmpty()) {
            throw new RecommendationUnavailableException(
                    "모든 후보의 대중교통 이동시간 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }

        List<ScoredCandidate> top = candidateScorer.topCandidates(scored, properties.topN());
        log.info("후보 {}곳 중 {}곳 점수화, 상위 {}곳 반환 (조회 성공 조합 {}/{})",
                stations.size(), scored.size(), top.size(), matrix.size(), stations.size() * participants.size());

        return new RecommendationResponse(top.stream().map(CandidateDto::from).toList());
    }

    /** 3단계: (후보 × 참여자) 조합을 병렬로 조회한다. 실패한 조합은 matrix에 담기지 않는다. */
    private TravelTimeMatrix lookupTravelTimes(List<Station> stations, List<Participant> participants) {
        TravelTimeMatrix matrix = new TravelTimeMatrix();
        List<CompletableFuture<Void>> futures = new ArrayList<>(stations.size() * participants.size());

        for (Station station : stations) {
            for (Participant participant : participants) {
                futures.add(CompletableFuture.runAsync(
                        () -> lookupOne(matrix, station, participant), travelTimeExecutor));
            }
        }

        CompletableFuture<Void> all = CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new));
        try {
            all.get(LOOKUP_BUDGET.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            // 전체를 실패시키지 않는다 — 지금까지 모인 조합만으로 계속 간다.
            log.warn("이동시간 조회가 {}초 예산을 초과했습니다. 완료된 조합만으로 계산합니다.", LOOKUP_BUDGET.toSeconds());
            futures.forEach(future -> future.cancel(true));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RecommendationUnavailableException("이동시간 조회가 중단되었습니다.");
        } catch (Exception e) {
            log.warn("이동시간 조회 중 예기치 못한 오류: {}", e.toString());
        }

        return matrix;
    }

    private void lookupOne(TravelTimeMatrix matrix, Station station, Participant participant) {
        try {
            Optional<Integer> minutes = odsayClient.travelMinutes(participant.origin(), station.location());
            minutes.ifPresent(value -> matrix.put(station, participant, value));
        } catch (RuntimeException e) {
            // OdsayClient가 이미 예외를 흡수하지만, 여기서 새는 예외가 allOf를 깨뜨리지 않도록 한 번 더 막는다.
            log.warn("이동시간 조회 실패 ({} <- {}): {}", station.name(), participant.nickname(), e.toString());
        }
    }

    private List<Participant> toParticipants(RecommendationRequest request) {
        Set<String> seen = new HashSet<>();
        List<Participant> participants = new ArrayList<>();

        for (ParticipantRequest raw : request.participants()) {
            if (!seen.add(raw.nickname())) {
                // travel_times가 닉네임 키라서 중복이 있으면 결과가 조용히 덮어써진다.
                throw new IllegalArgumentException("participants의 nickname은 서로 달라야 합니다: " + raw.nickname());
            }

            TransportMode mode = TransportMode.from(raw.transportMode());
            if (mode != TransportMode.TRANSIT) {
                log.info("{}의 transport_mode={}는 아직 지원하지 않아 대중교통 기준으로 계산합니다.",
                        raw.nickname(), raw.transportMode());
            }

            participants.add(new Participant(
                    raw.nickname(),
                    new GeoPoint(raw.originLat(), raw.originLng()),
                    mode,
                    raw.maxTravelMin()));
        }

        return participants;
    }
}
