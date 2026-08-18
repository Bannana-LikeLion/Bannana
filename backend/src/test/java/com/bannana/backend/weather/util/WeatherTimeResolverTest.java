package com.bannana.backend.weather.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.junit.jupiter.api.Test;

class WeatherTimeResolverTest {

	@Test
	void normalizeRequestedDateTime_truncatesToHour() {
		assertThat(WeatherTimeResolver.normalizeRequestedDateTime("2026-08-21T19:30"))
			.isEqualTo("2026-08-21T19:00");
	}

	@Test
	void resolveBaseForecastTime_daytimeUsesLatestPublication() {
		Clock clock = Clock.fixed(
			ZonedDateTime.of(2026, 8, 17, 15, 20, 0, 0, ZoneId.of("Asia/Seoul")).toInstant(),
			ZoneId.of("Asia/Seoul")
		);

		WeatherTimeResolver.BaseForecastTime baseForecastTime = WeatherTimeResolver.resolveBaseForecastTime(clock);

		assertThat(baseForecastTime.baseDateValue()).isEqualTo("20260817");
		assertThat(baseForecastTime.baseTimeValue()).isEqualTo("1400");
	}

	@Test
	void resolveBaseForecastTime_earlyMorningUsesPreviousDay23() {
		Clock clock = Clock.fixed(
			Instant.parse("2026-08-16T16:30:00Z"),
			ZoneId.of("Asia/Seoul")
		);

		WeatherTimeResolver.BaseForecastTime baseForecastTime = WeatherTimeResolver.resolveBaseForecastTime(clock);

		assertThat(baseForecastTime.baseDateValue()).isEqualTo("20260816");
		assertThat(baseForecastTime.baseTimeValue()).isEqualTo("2300");
	}

	@Test
	void resolveBaseForecastTime_afterTwoAmUsesTwoAmSameDay() {
		Clock clock = Clock.fixed(
			ZonedDateTime.of(2026, 8, 17, 2, 10, 0, 0, ZoneId.of("Asia/Seoul")).toInstant(),
			ZoneId.of("Asia/Seoul")
		);

		WeatherTimeResolver.BaseForecastTime baseForecastTime = WeatherTimeResolver.resolveBaseForecastTime(clock);

		assertThat(baseForecastTime.baseDateValue()).isEqualTo("20260817");
		assertThat(baseForecastTime.baseTimeValue()).isEqualTo("0200");
	}

	@Test
	void resolveBaseForecastTime_eveningUses2000() {
		Clock clock = Clock.fixed(
			ZonedDateTime.of(2026, 8, 17, 20, 15, 0, 0, ZoneId.of("Asia/Seoul")).toInstant(),
			ZoneId.of("Asia/Seoul")
		);

		WeatherTimeResolver.BaseForecastTime baseForecastTime = WeatherTimeResolver.resolveBaseForecastTime(clock);

		assertThat(baseForecastTime.baseDateValue()).isEqualTo("20260817");
		assertThat(baseForecastTime.baseTimeValue()).isEqualTo("2000");
	}
}
