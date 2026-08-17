package com.bannana.recommendation.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

/**
 * POST /recommendations 요청 본문. 프론트와 합의된 계약이라 필드명을 임의로 바꾸지 않는다.
 *
 * @param placeTypes 이 서비스에서는 사용하지 않는다(장소 검색은 별도 서비스 담당). 계약 유지를 위해 받기만 한다.
 * @param datetime   ODsay 대중교통 경로검색이 출발시각 파라미터를 받지 않아 현재 계산에 반영되지 않는다.
 */
public record RecommendationRequest(
        @NotEmpty(message = "participants는 최소 1명 이상이어야 합니다.")
        @Size(max = 20, message = "participants는 최대 20명까지 지원합니다.")
        @Valid
        @JsonProperty("participants") List<ParticipantRequest> participants,

        @JsonProperty("place_types") List<String> placeTypes,

        @JsonProperty("datetime") LocalDateTime datetime) {
}
