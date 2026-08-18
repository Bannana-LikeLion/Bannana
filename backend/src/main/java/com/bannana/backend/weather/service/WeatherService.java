package com.bannana.backend.weather.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.bannana.backend.weather.client.KmaWeatherClient;
import com.bannana.backend.weather.client.dto.KmaWeatherApiResponse;
import com.bannana.backend.weather.dto.WeatherResponse;
import com.bannana.backend.weather.exception.WeatherBadRequestException;
import com.bannana.backend.weather.exception.WeatherExternalApiException;
import com.bannana.backend.weather.exception.WeatherForecastNotFoundException;
import com.bannana.backend.weather.model.WeatherCondition;
import com.bannana.backend.weather.util.WeatherGridConverter;
import com.bannana.backend.weather.util.WeatherTimeResolver;

@Service
public class WeatherService {

	private final Clock clock;
	private final WeatherGridConverter weatherGridConverter;
	private final KmaWeatherClient kmaWeatherClient;

	public WeatherService(Clock weatherClock, WeatherGridConverter weatherGridConverter,
		KmaWeatherClient kmaWeatherClient) {
		this.clock = weatherClock;
		this.weatherGridConverter = weatherGridConverter;
		this.kmaWeatherClient = kmaWeatherClient;
	}

	public WeatherResponse getWeather(Double lat, Double lng, String datetime) {
		validateCoordinates(lat, lng);

		LocalDateTime requestedDateTime = WeatherTimeResolver.normalizeRequestedDateTime(datetime);
		WeatherTimeResolver.BaseForecastTime baseForecastTime = WeatherTimeResolver.resolveBaseForecastTime(clock);
		WeatherGridConverter.GridPoint gridPoint = weatherGridConverter.convert(lat, lng);

		KmaWeatherApiResponse apiResponse = kmaWeatherClient.getVilageFcst(
			baseForecastTime.baseDateValue(),
			baseForecastTime.baseTimeValue(),
			gridPoint.nx(),
			gridPoint.ny()
		);

		if (!apiResponse.isSuccessful()) {
			throw new WeatherExternalApiException(
				"KMA weather API returned an error: " + apiResponse.resultCode() + " / " + apiResponse.resultMsg()
			);
		}

		Map<String, String> forecastValues = extractForecastValues(apiResponse.items(), requestedDateTime);

		String pty = forecastValues.get("PTY");
		String tmp = forecastValues.get("TMP");
		String pop = forecastValues.get("POP");
		String sky = forecastValues.get("SKY");

		if (pty == null || tmp == null || pop == null) {
			throw new WeatherForecastNotFoundException("Forecast data not found for " + requestedDateTime);
		}

		WeatherCondition condition = WeatherCondition.fromPty(pty);
		String conditionText = resolveConditionText(condition, sky);

		return new WeatherResponse(
			condition,
			conditionText,
			parseDouble(tmp, "TMP"),
			parseInt(pop, "POP"),
			requestedDateTime
		);
	}

	private void validateCoordinates(Double lat, Double lng) {
		if (lat == null) {
			throw new WeatherBadRequestException("lat is required.");
		}
		if (lng == null) {
			throw new WeatherBadRequestException("lng is required.");
		}
		if (lat < -90.0 || lat > 90.0) {
			throw new WeatherBadRequestException("lat must be between -90 and 90.");
		}
		if (lng < -180.0 || lng > 180.0) {
			throw new WeatherBadRequestException("lng must be between -180 and 180.");
		}
	}

	private Map<String, String> extractForecastValues(List<KmaWeatherApiResponse.Item> items,
		LocalDateTime requestedDateTime) {
		if (items == null || items.isEmpty()) {
			throw new WeatherForecastNotFoundException("Forecast data not found for " + requestedDateTime);
		}

		String fcstDate = requestedDateTime.toLocalDate().toString().replace("-", "");
		String fcstTime = String.format("%02d%02d", requestedDateTime.getHour(), requestedDateTime.getMinute());

		Map<String, String> values = items.stream()
			.filter(item -> fcstDate.equals(item.fcstDate()) && fcstTime.equals(item.fcstTime()))
			.collect(Collectors.toMap(
				KmaWeatherApiResponse.Item::category,
				KmaWeatherApiResponse.Item::fcstValue,
				(existing, replacement) -> replacement
			));

		return values;
	}

	private String resolveConditionText(WeatherCondition condition, String sky) {
		if (condition == WeatherCondition.RAIN) {
			return "비";
		}
		if (condition == WeatherCondition.SNOW) {
			return "눈";
		}

		if (sky == null) {
			return "맑음";
		}

		return switch (sky) {
			case "1" -> "맑음";
			case "3" -> "구름많음";
			case "4" -> "흐림";
			default -> "맑음";
		};
	}

	private double parseDouble(String value, String category) {
		try {
			return Double.parseDouble(value);
		} catch (NumberFormatException ex) {
			throw new WeatherExternalApiException("Invalid " + category + " value from KMA API: " + value, ex);
		}
	}

	private int parseInt(String value, String category) {
		try {
			return Integer.parseInt(value);
		} catch (NumberFormatException ex) {
			throw new WeatherExternalApiException("Invalid " + category + " value from KMA API: " + value, ex);
		}
	}
}
