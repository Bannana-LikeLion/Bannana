package com.bannana.backend.weather.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bannana.backend.weather.dto.WeatherResponse;
import com.bannana.backend.weather.service.WeatherService;

@RestController
@RequestMapping("/weather")
public class WeatherController {

	private final WeatherService weatherService;

	public WeatherController(WeatherService weatherService) {
		this.weatherService = weatherService;
	}

	@GetMapping
	public ResponseEntity<WeatherResponse> getWeather(
		@RequestParam Double lat,
		@RequestParam Double lng,
		@RequestParam String datetime
	) {
		return ResponseEntity.ok(weatherService.getWeather(lat, lng, datetime));
	}
}
