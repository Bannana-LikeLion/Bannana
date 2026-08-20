package com.bannana.backend.recommendation.client;

import com.bannana.backend.recommendation.config.ExternalApiProperties;
import tools.jackson.databind.ObjectMapper;
import com.bannana.backend.recommendation.domain.GeoPoint;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

/**
 * Tmap 대중교통 경로안내 기반 이동시간 조회.
 *
 * <p>ODsay와 다른 점이 세 가지 있다.
 * <ul>
 *   <li>{@code totalTime}이 <b>초</b> 단위다 (ODsay는 분).</li>
 *   <li>경로를 못 찾으면 HTTP 200 + {@code result.status}로 사유가 내려온다.</li>
 *   <li>요청이 POST + JSON body이고 키는 {@code appKey} 헤더로 보낸다.</li>
 * </ul>
 */
public class TmapClient implements TravelTimeClient {

    private static final Logger log = LoggerFactory.getLogger(TmapClient.class);

    private static final String PATH = "/transit/routes";

    /** 받을 경로 수. 여러 개 중 가장 짧은 것을 쓴다. */
    private static final int ROUTE_COUNT = 10;

    /** 도보 약 4km/h. Tmap이 "거리가 가까움"을 돌려줄 때의 대체 추정에 쓴다. */
    private static final double WALKING_METERS_PER_MINUTE = 67d;

    /** 출발지·도착지 간 거리가 가까워 대중교통 경로가 없는 경우의 Tmap 상태 코드. */
    private static final int TOO_CLOSE_STATUS = 11;

    private static final int MAX_RETRIES = 3;
    private static final long BASE_BACKOFF_MILLIS = 500;

    /**
     * 호출 간 최소 간격. 후보 10곳 × 참여자 6명이면 60콜이 한꺼번에 나가서 429를 맞기 쉬운데,
     * 전역으로 간격을 두면 재시도보다 싸게 막힌다.
     */
    private static final long MIN_DISPATCH_INTERVAL_MILLIS = 150;

    private final RestClient restClient;
    private final ExternalApiProperties.Tmap properties;
    private final ObjectMapper objectMapper;

    private final Object paceLock = new Object();
    private long nextAllowedDispatchMillis = 0;

    public TmapClient(RestClient tmapRestClient, ExternalApiProperties properties, ObjectMapper objectMapper) {
        this.restClient = tmapRestClient;
        this.properties = properties.tmap();
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<Integer> travelMinutes(GeoPoint origin, GeoPoint destination) {
        if (!properties.hasAppKey()) {
            log.warn("TMAP_APP_KEY가 설정되지 않아 이동시간을 조회할 수 없습니다.");
            return Optional.empty();
        }

        // Tmap은 X가 경도, Y가 위도다.
        TmapRequest request = TmapRequest.of(
                origin.lng(), origin.lat(), destination.lng(), destination.lat(), ROUTE_COUNT);

        // 객체를 그대로 넘기면 Jackson이 스트리밍으로 써서 Transfer-Encoding: chunked로 나간다.
        // SK 오픈API 게이트웨이가 chunked 본문을 거부하는 경우가 있어 미리 직렬화해 Content-Length를 붙인다.
        byte[] payload;
        try {
            payload = objectMapper.writeValueAsString(request).getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Tmap 요청 직렬화 실패: {}", e.toString());
            return Optional.empty();
        }

        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            awaitDispatchSlot();
            try {
                TmapPathResponse response = restClient.post()
                        .uri(PATH)
                        .header("appKey", properties.appKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(payload)
                        .retrieve()
                        .body(TmapPathResponse.class);

                return extractMinutes(response, origin, destination);
            } catch (HttpClientErrorException.TooManyRequests e) {
                if (attempt == MAX_RETRIES) {
                    log.warn("Tmap 429 재시도 초과 ({},{} -> {},{})",
                            origin.lat(), origin.lng(), destination.lat(), destination.lng());
                    return Optional.empty();
                }
                sleepQuietly(jitteredBackoff(attempt));
            } catch (Exception e) {
                // 타임아웃, 4xx/5xx, 파싱 오류 등 — 이 조합만 버리고 나머지는 계속 간다.
                log.warn("Tmap 경로 조회 실패 ({},{} -> {},{}): {}",
                        origin.lat(), origin.lng(), destination.lat(), destination.lng(), e.toString());
                return Optional.empty();
            }
        }
        return Optional.empty();
    }

    private Optional<Integer> extractMinutes(TmapPathResponse response, GeoPoint origin, GeoPoint destination) {
        if (response == null) {
            log.warn("Tmap 응답 본문이 비어 있습니다.");
            return Optional.empty();
        }

        // 경로를 못 찾은 경우 HTTP 200이어도 metaData 대신 result가 온다.
        TmapPathResponse.Result result = response.result();
        if (result != null && result.status() != null) {
            if (result.status() == TOO_CLOSE_STATUS) {
                // 참여자가 후보 역 바로 옆인 경우다. 여기서 조합을 버리면 gap이 오히려 왜곡되므로
                // 직선거리 기반 도보 추정치로 대체한다.
                int walkMinutes = (int) Math.max(
                        1, Math.round(origin.distanceMeters(destination) / WALKING_METERS_PER_MINUTE));
                log.debug("Tmap 근거리 응답(status=11) — 도보 {}분으로 대체합니다.", walkMinutes);
                return Optional.of(walkMinutes);
            }
            log.warn("Tmap 경로 없음 status={} message={}", result.status(), result.message());
            return Optional.empty();
        }

        if (response.metaData() == null
                || response.metaData().plan() == null
                || response.metaData().plan().itineraries() == null
                || response.metaData().plan().itineraries().isEmpty()) {
            log.warn("Tmap 경로 결과가 없습니다 ({},{} -> {},{}).",
                    origin.lat(), origin.lng(), destination.lat(), destination.lng());
            return Optional.empty();
        }

        return response.metaData().plan().itineraries().stream()
                .map(TmapPathResponse.Itinerary::totalTime)
                .filter(Objects::nonNull)
                .filter(seconds -> seconds > 0)
                .min(Comparator.naturalOrder())
                // totalTime은 초 단위라 분으로 바꾼다. 0분이 나오지 않게 최소 1분으로 둔다.
                .map(seconds -> Math.max(1, (int) Math.round(seconds / 60.0)));
    }

    /** 전역 호출 간격을 지키기 위해 필요한 만큼 기다린다. */
    private void awaitDispatchSlot() {
        long waitMillis;
        synchronized (paceLock) {
            long now = System.currentTimeMillis();
            long earliest = Math.max(now, nextAllowedDispatchMillis);
            nextAllowedDispatchMillis = earliest + MIN_DISPATCH_INTERVAL_MILLIS;
            waitMillis = earliest - now;
        }
        if (waitMillis > 0) {
            sleepQuietly(waitMillis);
        }
    }

    private long jitteredBackoff(int attempt) {
        long base = BASE_BACKOFF_MILLIS * (1L << attempt);
        return base + ThreadLocalRandom.current().nextLong(base / 2);
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
