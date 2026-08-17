package com.bannana.recommendation.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** POST /recommendations 응답 본문. 프론트와 합의된 계약. */
public record RecommendationResponse(@JsonProperty("candidates") List<CandidateDto> candidates) {
}
