package com.bannana.backend.room.dto;

import jakarta.validation.constraints.NotBlank;

public record ParticipantCreateRequest(
	@NotBlank String name,
	@NotBlank String originText,
	Double originLat,
	Double originLng
) {
}
