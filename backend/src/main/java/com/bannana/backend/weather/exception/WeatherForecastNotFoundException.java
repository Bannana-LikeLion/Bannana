package com.bannana.backend.weather.exception;

public class WeatherForecastNotFoundException extends RuntimeException {
	public WeatherForecastNotFoundException(String message) {
		super(message);
	}
}
