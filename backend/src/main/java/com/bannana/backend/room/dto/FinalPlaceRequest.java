package com.bannana.backend.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FinalPlaceRequest(
	@NotBlank String placeName,
	@NotNull Double lat,
	@NotNull Double lng
) {
}