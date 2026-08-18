package com.bannana.backend.room.dto;

import jakarta.validation.constraints.NotBlank;

public record ParticipantUpdateOriginRequest(
	@NotBlank String originText,
	Double originLat,
	Double originLng
) {
}
