package com.bannana.backend.room.entity;

import java.util.Locale;

import com.bannana.backend.room.exception.BadRequestException;

public enum TransportMode {
	TRANSIT,
	CAR,
	WALK;

	public static TransportMode fromApiValue(String value) {
		if (value == null || value.isBlank()) {
			throw new BadRequestException("transportMode is required.");
		}

		String normalized = value.trim().toLowerCase(Locale.ROOT);
		return switch (normalized) {
			case "transit" -> TRANSIT;
			case "car" -> CAR;
			case "walk" -> WALK;
			default -> throw new BadRequestException("Unsupported transportMode: " + value);
		};
	}
}
