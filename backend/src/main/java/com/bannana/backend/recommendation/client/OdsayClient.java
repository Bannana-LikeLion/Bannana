package com.bannana.backend.recommendation.client;

import com.bannana.backend.recommendation.config.ExternalApiProperties;
import com.bannana.backend.recommendation.domain.GeoPoint;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;
import org.springframework.web.client.HttpClientErrorException;

/**
 * ODsay 대중교통 이동시간 조회.
 *
 * <p>이 클라이언트는 예외를 밖으로 던지지 않는다. 실패한 (참여자 × 후보) 조합만 빠지고 나머지 계산은
 * 계속돼야 하므로, 모든 실패를 {@link Optional#empty()}로 흡수하고 로그만 남긴다.
 */
@Component
public class OdsayClient {

    private static final Logger log = LoggerFactory.getLogger(OdsayClient.class);

    private static final String PATH = "/v1/api/searchPubTransPathT";

    /** 도보 약 4km/h. ODsay가 "너무 가까움"을 돌려줄 때의 대체 추정에 쓴다. */
    private static final double WALKING_METERS_PER_MINUTE = 67d;

    /** 출발지와 도착지가 너무 가까워 대중교통 경로가 없는 경우의 ODsay 오류 코드. */
    private static final Set<String> TOO_CLOSE_CODES = Set.of("-8", "3");

    private final RestClient restClient;
    private final ExternalApiProperties.Odsay properties;

    public OdsayClient(RestClient odsayRestClient, ExternalApiProperties properties) {
        this.restClient = odsayRestClient;
        this.properties = properties.odsay();
    }

    /**
     * 출발지 → 도착지 대중교통 소요시간(분).
     *
     * @return 조회 실패 시 {@link Optional#empty()} — 호출부는 해당 조합만 제외하고 진행한다.
     */
    private static final int MAX_RETRIES = 3;
    private static final long BASE_BACKOFF_MILLIS = 500;
    private static final long MIN_DISPATCH_INTERVAL_MILLIS = 150;

    private final Object paceLock = new Object();
    private volatile long nextAllowedDispatchMillis = 0;

    public Optional<Integer> travelMinutes(GeoPoint origin, GeoPoint destination) {
    if (!properties.hasApiKey()) {
        log.warn("ODSAY_API_KEY가 설정되지 않아 이동시간을 조회할 수 없습니다.");
        return Optional.empty();
    }

    for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        awaitDispatchSlot();
        try {
            OdsayPathResponse response = restClient.get()
                    .uri(buildUri(origin, destination))
                    .retrieve()
                    .body(OdsayPathResponse.class);

            return extractMinutes(response, origin, destination);
        } catch (HttpClientErrorException.TooManyRequests e) {
            if (attempt == MAX_RETRIES) {
                log.warn("ODsay 429 재시도 초과 ({},{} -> {},{})",
                        origin.lat(), origin.lng(), destination.lat(), destination.lng());
                return Optional.empty();
            }
            long backoff = jitteredBackoff(attempt);
            log.debug("ODsay 429, {}ms 후 재시도 ({}/{})", backoff, attempt + 1, MAX_RETRIES);
            sleepQuietly(backoff);
        } catch (Exception e) {
            log.warn("ODsay 경로 조회 실패 ({},{} -> {},{}): {}",
                    origin.lat(), origin.lng(), destination.lat(), destination.lng(), e.toString());
            return Optional.empty();
        }
    }
    return Optional.empty();
}

/** 이 메서드를 통과해야 실제 요청이 나간다 — 인스턴스 전체에서 최소 간격을 강제한다. */
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

/** 같은 순간에 여러 스레드가 동시에 재시도하지 않도록 무작위성을 섞는다. */
private long jitteredBackoff(int attempt) {
    long base = BASE_BACKOFF_MILLIS * (1L << attempt);
    long jitter = ThreadLocalRandom.current().nextLong(base / 2);
    return base + jitter;
}

private void sleepQuietly(long millis) {
    try {
        Thread.sleep(millis);
    } catch (InterruptedException ie) {
        Thread.currentThread().interrupt();
    }
}
    private Optional<Integer> extractMinutes(OdsayPathResponse response, GeoPoint origin, GeoPoint destination) {
        if (response == null) {
            log.warn("ODsay 응답 본문이 비어 있습니다.");
            return Optional.empty();
        }

        OdsayPathResponse.Error error = response.error();
        if (error != null) {
            if (isTooClose(error)) {
                // 참여자가 후보 역 바로 옆인 경우다. 여기서 조합을 버리면 gap이 오히려 왜곡되므로
                // 직선거리 기반 도보 추정치로 대체한다.
                int walkMinutes = (int) Math.max(1, Math.round(origin.distanceMeters(destination) / WALKING_METERS_PER_MINUTE));
                log.debug("ODsay 근거리 응답 — 도보 {}분으로 대체합니다.", walkMinutes);
                return Optional.of(walkMinutes);
            }
            log.warn("ODsay 오류 응답 code={} message={}", error.code(), error.text());
            return Optional.empty();
        }

        OdsayPathResponse.Result result = response.result();
        List<OdsayPathResponse.Path> paths = result == null ? null : result.path();
        if (paths == null || paths.isEmpty()) {
            log.warn("ODsay 경로 결과가 없습니다 ({},{} -> {},{}).",
                    origin.lat(), origin.lng(), destination.lat(), destination.lng());
            return Optional.empty();
        }

        return paths.stream()
                .map(OdsayPathResponse.Path::info)
                .filter(info -> info != null && info.totalTime() != null && info.totalTime() > 0)
                .map(OdsayPathResponse.Info::totalTime)
                .min(Comparator.naturalOrder());
    }

    private boolean isTooClose(OdsayPathResponse.Error error) {
        if (error.code() != null && TOO_CLOSE_CODES.contains(error.code().trim())) {
            return true;
        }
        String text = error.text();
        return text != null && text.contains("가까");
    }

    private URI buildUri(GeoPoint origin, GeoPoint destination) {
        // ODsay는 X가 경도, Y가 위도다. 순서를 바꾸면 엉뚱한 경로가 나오되 오류는 나지 않아 발견이 늦다.
        return UriComponentsBuilder.fromUriString(properties.baseUrl())
                .path(PATH)
                .queryParam("apiKey", UriUtils.encode(properties.apiKey(), StandardCharsets.UTF_8))
                .queryParam("SX", origin.lng())
                .queryParam("SY", origin.lat())
                .queryParam("EX", destination.lng())
                .queryParam("EY", destination.lat())
                .queryParam("OPT", 0)
                .build(true)
                .toUri();
    }
}
