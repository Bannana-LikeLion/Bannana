package com.bannana.backend.weather.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

import com.bannana.backend.weather.model.WeatherCondition;

public record WeatherResponse(
	WeatherCondition condition,
	String conditionText,
	double temperature,
	int precipitationProbability,
	@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm") LocalDateTime forecastDateTime
) {
}
