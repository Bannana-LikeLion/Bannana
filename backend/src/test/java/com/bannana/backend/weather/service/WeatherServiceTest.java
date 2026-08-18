package com.bannana.backend.weather.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.bannana.backend.weather.client.KmaWeatherClient;
import com.bannana.backend.weather.client.dto.KmaWeatherApiResponse;
import com.bannana.backend.weather.dto.WeatherResponse;
import com.bannana.backend.weather.exception.WeatherBadRequestException;
import com.bannana.backend.weather.exception.WeatherForecastNotFoundException;
import com.bannana.backend.weather.model.WeatherCondition;
import com.bannana.backend.weather.util.WeatherGridConverter;

class WeatherServiceTest {

	private final ObjectMapper objectMapper = new ObjectMapper();
	private final WeatherGridConverter weatherGridConverter = new WeatherGridConverter();
	private KmaWeatherClient kmaWeatherClient;
	private WeatherService weatherService;

	@BeforeEach
	void setUp() {
		kmaWeatherClient = Mockito.mock(KmaWeatherClient.class);
		Clock clock = Clock.fixed(
			ZonedDateTime.of(2026, 8, 17, 15, 20, 0, 0, ZoneId.of("Asia/Seoul")).toInstant(),
			ZoneId.of("Asia/Seoul")
		);
		weatherService = new WeatherService(clock, weatherGridConverter, kmaWeatherClient);
	}

	@Test
	void getWeather_buildsResponseFromKmaPayload() throws Exception {
		KmaWeatherApiResponse apiResponse = readFixture("weather/kma-weather-response.json");
		when(kmaWeatherClient.getVilageFcst("20260817", "1400", 60, 127)).thenReturn(apiResponse);

		WeatherResponse response = weatherService.getWeather(37.5665, 126.9780, "2026-08-21T19:30");

		assertThat(response.condition()).isEqualTo(WeatherCondition.CLEAR);
		assertThat(response.conditionText()).isEqualTo("구름많음");
		assertThat(response.temperature()).isEqualTo(27.0);
		assertThat(response.precipitationProbability()).isEqualTo(20);
		assertThat(response.forecastDateTime().toString()).isEqualTo("2026-08-21T19:00");
	}

	@Test
	void getWeather_throwsWhenForecastTimeNotFound() {
		when(kmaWeatherClient.getVilageFcst("20260817", "1400", 60, 127))
			.thenReturn(new KmaWeatherApiResponse(
				new KmaWeatherApiResponse.Response(
					new KmaWeatherApiResponse.Header("00", "OK"),
					new KmaWeatherApiResponse.Body("JSON", new KmaWeatherApiResponse.Items(java.util.List.of()), 1, 1000, 0)
				)
			));

		assertThatThrownBy(() -> weatherService.getWeather(37.5665, 126.9780, "2026-08-21T19:30"))
			.isInstanceOf(WeatherForecastNotFoundException.class);
	}

	@Test
	void getWeather_throwsWhenLatMissing() {
		assertThatThrownBy(() -> weatherService.getWeather(null, 126.9780, "2026-08-21T19:00"))
			.isInstanceOf(WeatherBadRequestException.class);
	}

	private KmaWeatherApiResponse readFixture(String classpathLocation) throws Exception {
		try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(classpathLocation)) {
			if (inputStream == null) {
				throw new IllegalStateException("Missing fixture: " + classpathLocation);
			}
			String json = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
			return objectMapper.readValue(json, KmaWeatherApiResponse.class);
		}
	}
}
