package com.bannana.backend.weather.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.bannana.backend.weather.config.KmaWeatherProperties;

class KmaWeatherClientTest {

	@Test
	void buildRequestUri_doesNotDoubleEncodeServiceKey() {
		KmaWeatherProperties properties = new KmaWeatherProperties(
			"https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0",
			"ignored",
			1,
			1000,
			"JSON"
		);
		KmaWeatherClient client = new KmaWeatherClient(properties);

		String encodedKey = "abc%2Fdef%3D";
		String uri = client.buildRequestUri(encodedKey, "20260817", "2000", 60, 127).toString();

		assertThat(uri).contains("ServiceKey=abc%2Fdef%3D");
		assertThat(uri).doesNotContain("%252F");
		assertThat(uri).contains("pageNo=1");
		assertThat(uri).contains("numOfRows=1000");
		assertThat(uri).contains("dataType=JSON");
		assertThat(uri).contains("base_date=20260817");
		assertThat(uri).contains("base_time=2000");
		assertThat(uri).contains("nx=60");
		assertThat(uri).contains("ny=127");
	}
}
