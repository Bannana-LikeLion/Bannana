package com.bannana.backend.weather.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class WeatherGridConverterTest {

	private final WeatherGridConverter converter = new WeatherGridConverter();

	@Test
	void convert_seoulCoordinates() {
		WeatherGridConverter.GridPoint gridPoint = converter.convert(37.5665, 126.9780);

		assertThat(gridPoint.nx()).isEqualTo(60);
		assertThat(gridPoint.ny()).isEqualTo(127);
	}

	@Test
	void convert_gyeonggiCoordinates() {
		WeatherGridConverter.GridPoint gridPoint = converter.convert(37.2636, 127.0286);

		assertThat(gridPoint.nx()).isEqualTo(61);
		assertThat(gridPoint.ny()).isEqualTo(120);
	}
}
