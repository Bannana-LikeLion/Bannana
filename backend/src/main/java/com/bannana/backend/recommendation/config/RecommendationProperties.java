package com.bannana.backend.recommendation.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 추천 알고리즘 파라미터.
 *
 * @param minCandidates   후보 역 최소 개수 (명세: 6)
 * @param maxCandidates   후보 역 최대 개수 (명세: 10)
 * @param topN            응답에 담을 후보 수 (명세: 3)
 * @param searchRadii     Kakao 검색 반경(m). 앞에서부터 시도하며 minCandidates를 채우면 멈춘다.
 * @param stationProvider auto | kakao | static
 * @param concurrency     ODsay 동시 호출 수
 */
@ConfigurationProperties(prefix = "bannana.recommendation")
public record RecommendationProperties(
        int minCandidates,
        int maxCandidates,
        int topN,
        List<Integer> searchRadii,
        String stationProvider,
        int concurrency) {

    public RecommendationProperties {
        minCandidates = minCandidates <= 0 ? 6 : minCandidates;
        maxCandidates = maxCandidates <= 0 ? 10 : maxCandidates;
        topN = topN <= 0 ? 3 : topN;
        searchRadii = (searchRadii == null || searchRadii.isEmpty())
                ? List.of(3000, 5000, 10000, 20000)
                : List.copyOf(searchRadii);
        stationProvider = (stationProvider == null || stationProvider.isBlank()) ? "auto" : stationProvider;
        concurrency = concurrency <= 0 ? 8 : concurrency;

        if (maxCandidates < minCandidates) {
            throw new IllegalArgumentException(
                    "maxCandidates(%d)는 minCandidates(%d)보다 작을 수 없습니다.".formatted(maxCandidates, minCandidates));
        }
    }
}
