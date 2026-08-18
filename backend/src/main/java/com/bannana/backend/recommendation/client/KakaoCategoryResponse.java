package com.bannana.backend.recommendation.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** 카카오 로컬 카테고리 검색(category.json) 응답 중 필요한 부분만. */
public record KakaoCategoryResponse(@JsonProperty("documents") List<Document> documents) {

    /**
     * @param x 경도(문자열로 내려온다)
     * @param y 위도
     */
    public record Document(
            @JsonProperty("place_name") String placeName,
            @JsonProperty("x") String x,
            @JsonProperty("y") String y) {
    }
}
