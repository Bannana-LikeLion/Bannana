package com.bannana.recommendation.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ParticipantRequest(
        @NotBlank(message = "nickname은 필수입니다.")
        @JsonProperty("nickname") String nickname,

        @NotNull(message = "origin_lat은 필수입니다.")
        @DecimalMin(value = "-90.0", message = "origin_lat은 -90~90 범위여야 합니다.")
        @DecimalMax(value = "90.0", message = "origin_lat은 -90~90 범위여야 합니다.")
        @JsonProperty("origin_lat") Double originLat,

        @NotNull(message = "origin_lng는 필수입니다.")
        @DecimalMin(value = "-180.0", message = "origin_lng는 -180~180 범위여야 합니다.")
        @DecimalMax(value = "180.0", message = "origin_lng는 -180~180 범위여야 합니다.")
        @JsonProperty("origin_lng") Double originLng,

        @JsonProperty("transport_mode") String transportMode,

        @Positive(message = "max_travel_min은 양수여야 합니다.")
        @JsonProperty("max_travel_min") Integer maxTravelMin) {
}
