package com.bannana.recommendation.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 오류 응답 본문. 성공 응답과 달리 프론트와 확정한 계약은 아니므로, 프론트에서 다른 형태를 원하면 맞춰 바꾸면 된다.
 */
public record ErrorResponse(
        @JsonProperty("error") String error,
        @JsonProperty("message") String message) {
}
