package com.bannana.backend.weather.exception;

public class WeatherBadRequestException extends RuntimeException {
	public WeatherBadRequestException(String message) {
		super(message);
	}
}
