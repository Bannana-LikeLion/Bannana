package com.bannana.backend.weather.model;

import com.bannana.backend.weather.exception.WeatherBadRequestException;

public enum WeatherCondition {
	CLEAR,
	RAIN,
	SNOW;

	public static WeatherCondition fromPty(String pty) {
		if (pty == null || pty.isBlank()) {
			throw new WeatherBadRequestException("PTY is required.");
		}

		return switch (pty) {
			case "0" -> CLEAR;
			case "1", "5" -> RAIN;
			case "2", "3", "6", "7" -> SNOW;
			default -> throw new WeatherBadRequestException("Unsupported PTY code: " + pty);
		};
	}
}
