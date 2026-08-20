package com.bannana.backend.recommendation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.bannana.backend.recommendation.client.TravelTimeClient;
import com.bannana.backend.recommendation.config.RecommendationProperties;
import com.bannana.backend.recommendation.domain.GeoPoint;
import com.bannana.backend.recommendation.domain.Station;
import com.bannana.backend.recommendation.service.station.StationProvider;
import com.bannana.backend.recommendation.web.dto.CandidateDto;
import com.bannana.backend.recommendation.web.dto.ParticipantRequest;
import com.bannana.backend.recommendation.web.dto.RecommendationRequest;
import com.bannana.backend.recommendation.web.dto.RecommendationResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RecommendationServiceTest {

    private static final Station SEONGSU = new Station("성수역", new GeoPoint(37.5446, 127.0559));
    private static final Station GANGNAM = new Station("강남역", new GeoPoint(37.4979, 127.0276));
    private static final Station JAMSIL = new Station("잠실역", new GeoPoint(37.5133, 127.1000));
    private static final Station HONGDAE = new Station("홍대입구역", new GeoPoint(37.5571, 126.9245));

    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final TravelTimeClient travelTimeClient = mock(TravelTimeClient.class);

    @AfterEach
    void tearDown() {
        executor.shutdownNow();
    }

    private RecommendationService serviceWith(List<Station> stations) {
        StationProvider stationProvider = (center, minCount, maxCount) -> stations;
        RecommendationProperties properties =
                new RecommendationProperties(1, 10, 3, List.of(3000), "static", "tmap", 4);
        return new RecommendationService(stationProvider, travelTimeClient, new CandidateScorer(), properties, executor);
    }

    private static RecommendationRequest request() {
        return new RecommendationRequest(
                List.of(
                        new ParticipantRequest("김보경", 37.5665, 126.9780, "transit", 60),
                        new ParticipantRequest("송현석", 37.4979, 127.0276, "transit", 60),
                        new ParticipantRequest("이지은", 37.5445, 127.0557, "transit", 60)),
                List.of("cafe", "restaurant"),
                LocalDateTime.of(2026, 8, 14, 19, 0));
    }

    @Test
    @DisplayName("gap이 가장 작은 후보 3곳을 돌려준다")
    void returnsTopThreeByGap() {
        // 성수 gap=2, 강남 gap=10, 잠실 gap=30, 홍대 gap=4
        stubMinutes(SEONGSU, 30, 31, 32);
        stubMinutes(GANGNAM, 30, 35, 40);
        stubMinutes(JAMSIL, 20, 40, 50);
        stubMinutes(HONGDAE, 25, 27, 29);

        RecommendationResponse response = serviceWith(List.of(SEONGSU, GANGNAM, JAMSIL, HONGDAE)).recommend(request());

        assertThat(response.candidates()).extracting(CandidateDto::name)
                .containsExactly("성수역", "홍대입구역", "강남역");
        assertThat(response.candidates().getFirst().gapMinutes()).isEqualTo(2);
        assertThat(response.candidates().getFirst().travelTimes())
                .containsExactlyInAnyOrderEntriesOf(Map.of("김보경", 30, "송현석", 31, "이지은", 32));
    }

    @Test
    @DisplayName("구멍 난 후보만 버리고 전원 조회된 후보로 응답을 만든다")
    void dropsIncompleteCandidateButKeepsGoing() {
        stubMinutes(SEONGSU, 30, 31, 32);
        // 강남역은 두 번째 참여자만 실패 -> 강남역 후보 자체가 빠진다
        when(travelTimeClient.travelMinutes(originOf(0), GANGNAM.location())).thenReturn(Optional.of(20));
        when(travelTimeClient.travelMinutes(originOf(1), GANGNAM.location())).thenReturn(Optional.empty());
        when(travelTimeClient.travelMinutes(originOf(2), GANGNAM.location())).thenReturn(Optional.of(21));

        RecommendationResponse response = serviceWith(List.of(SEONGSU, GANGNAM)).recommend(request());

        // 일부 조합이 실패해도 요청 전체가 실패하지는 않는다.
        assertThat(response.candidates()).extracting(CandidateDto::name).containsExactly("성수역");
        assertThat(response.candidates().getFirst().travelTimes())
                .containsOnlyKeys("김보경", "송현석", "이지은");
    }

    @Test
    @DisplayName("모든 후보 계산이 실패하면 502로 이어질 예외를 던진다")
    void throwsWhenEveryCandidateFails() {
        when(travelTimeClient.travelMinutes(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> serviceWith(List.of(SEONGSU, GANGNAM)).recommend(request()))
                .isInstanceOf(RecommendationUnavailableException.class)
                .hasMessageContaining("이동시간 조회에 실패");
    }

    @Test
    @DisplayName("후보 역을 찾지 못하면 502로 이어질 예외를 던진다")
    void throwsWhenNoStationFound() {
        assertThatThrownBy(() -> serviceWith(List.of()).recommend(request()))
                .isInstanceOf(RecommendationUnavailableException.class)
                .hasMessageContaining("후보 역");
    }

    @Test
    @DisplayName("닉네임이 중복되면 400으로 이어질 예외를 던진다")
    void rejectsDuplicateNicknames() {
        RecommendationRequest duplicated = new RecommendationRequest(
                List.of(
                        new ParticipantRequest("김보경", 37.5, 127.0, "transit", null),
                        new ParticipantRequest("김보경", 37.6, 127.1, "transit", null)),
                List.of(),
                null);

        assertThatThrownBy(() -> serviceWith(List.of(SEONGSU)).recommend(duplicated))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nickname");
    }

    private void stubMinutes(Station station, int first, int second, int third) {
        when(travelTimeClient.travelMinutes(originOf(0), station.location())).thenReturn(Optional.of(first));
        when(travelTimeClient.travelMinutes(originOf(1), station.location())).thenReturn(Optional.of(second));
        when(travelTimeClient.travelMinutes(originOf(2), station.location())).thenReturn(Optional.of(third));
    }

    private GeoPoint originOf(int index) {
        ParticipantRequest raw = request().participants().get(index);
        return new GeoPoint(raw.originLat(), raw.originLng());
    }
}
