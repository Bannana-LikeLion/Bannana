package com.bannana.backend.recommendation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Tmap 대중교통 경로안내(POST /transit/routes) 응답.
 *
 * <p>경로를 못 찾은 경우에도 HTTP 200으로 내려오고 {@code metaData} 대신 {@code result}에 사유가 담긴다.
 * 그래서 {@code result}를 반드시 함께 확인해야 한다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TmapPathResponse(MetaData metaData, Result result) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MetaData(Plan plan) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Plan(List<Itinerary> itineraries) {
    }

    /**
     * @param totalTime 총 소요시간(<b>초</b>). ODsay가 분이었던 것과 달라서 변환이 필요하다.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Itinerary(Integer totalTime) {
    }

    /**
     * 경로를 찾지 못한 사유.
     *
     * @param status 11 = 출발지·도착지 간 거리가 가까움. 그 외는 경로 없음/입력 오류 계열.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Result(Integer status, String message) {
    }
}
