package com.bannana.backend.weather.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class WeatherConditionTest {

	@Test
	void fromPty_mapsAccordingToMvpRules() {
		assertThat(WeatherCondition.fromPty("0")).isEqualTo(WeatherCondition.CLEAR);
		assertThat(WeatherCondition.fromPty("1")).isEqualTo(WeatherCondition.RAIN);
		assertThat(WeatherCondition.fromPty("2")).isEqualTo(WeatherCondition.SNOW);
		assertThat(WeatherCondition.fromPty("3")).isEqualTo(WeatherCondition.SNOW);
		assertThat(WeatherCondition.fromPty("5")).isEqualTo(WeatherCondition.RAIN);
		assertThat(WeatherCondition.fromPty("6")).isEqualTo(WeatherCondition.SNOW);
		assertThat(WeatherCondition.fromPty("7")).isEqualTo(WeatherCondition.SNOW);
	}
}
