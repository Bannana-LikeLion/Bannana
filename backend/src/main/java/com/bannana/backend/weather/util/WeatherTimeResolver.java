package com.bannana.backend.weather.util;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;

import com.bannana.backend.weather.exception.WeatherBadRequestException;

public final class WeatherTimeResolver {

	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	private static final List<LocalTime> PUBLISH_TIMES = List.of(
		LocalTime.of(2, 0),
		LocalTime.of(5, 0),
		LocalTime.of(8, 0),
		LocalTime.of(11, 0),
		LocalTime.of(14, 0),
		LocalTime.of(17, 0),
		LocalTime.of(20, 0),
		LocalTime.of(23, 0)
	);

	private WeatherTimeResolver() {
	}

	public static LocalDateTime normalizeRequestedDateTime(String datetime) {
		if (datetime == null || datetime.isBlank()) {
			throw new WeatherBadRequestException("datetime is required.");
		}

		try {
			return LocalDateTime.parse(datetime).withMinute(0).withSecond(0).withNano(0);
		} catch (DateTimeParseException ex) {
			throw new WeatherBadRequestException("Invalid datetime format. Use ISO format like 2026-08-21T19:00.");
		}
	}

	public static BaseForecastTime resolveBaseForecastTime(Clock clock) {
		LocalDateTime now = LocalDateTime.now(clock.withZone(KST));
		LocalTime currentTime = now.toLocalTime();
		LocalDate currentDate = now.toLocalDate();

		LocalTime selectedTime = null;
		for (LocalTime publishTime : PUBLISH_TIMES) {
			if (!publishTime.isAfter(currentTime)) {
				selectedTime = publishTime;
			}
		}

		if (selectedTime == null) {
			return new BaseForecastTime(currentDate.minusDays(1), LocalTime.of(23, 0));
		}

		return new BaseForecastTime(currentDate, selectedTime);
	}

	public record BaseForecastTime(LocalDate baseDate, LocalTime baseTime) {
		public String baseDateValue() {
			return baseDate.toString().replace("-", "");
		}

		public String baseTimeValue() {
			return String.format("%02d%02d", baseTime.getHour(), baseTime.getMinute());
		}
	}
}
