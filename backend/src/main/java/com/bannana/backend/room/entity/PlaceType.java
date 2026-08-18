package com.bannana.backend.room.entity;

import java.util.Locale;

import com.bannana.backend.room.exception.BadRequestException;

public enum PlaceType {
	CAFE("카페"),
	RESTAURANT("식당"),
	EXHIBITION("전시"),
	SHOPPING("쇼핑"),
	PARK("공원");

	private final String apiValue;

	PlaceType(String apiValue) {
		this.apiValue = apiValue;
	}

	public String getApiValue() {
		return apiValue;
	}

	public static PlaceType fromApiValue(String value) {
		if (value == null || value.isBlank()) {
			throw new BadRequestException("placeType is required.");
		}

		String normalized = value.trim();
		for (PlaceType placeType : values()) {
			if (placeType.apiValue.equals(normalized) || placeType.name().equalsIgnoreCase(normalized)) {
				return placeType;
			}
		}

		String lower = normalized.toLowerCase(Locale.ROOT);
		return switch (lower) {
			case "카페" -> CAFE;
			case "식당" -> RESTAURANT;
			case "전시" -> EXHIBITION;
			case "쇼핑" -> SHOPPING;
			case "공원" -> PARK;
			default -> throw new BadRequestException("Unsupported placeType: " + value);
		};
	}
}
