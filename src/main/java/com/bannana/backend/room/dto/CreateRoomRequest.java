package com.bannana.backend.room.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRoomRequest(
	@NotBlank String title,
	@NotNull LocalDate meetingDate,
	@NotNull LocalTime meetingTime,
	@NotBlank String transportMode,
	@NotEmpty List<@NotBlank String> placeTypes
) {
}
