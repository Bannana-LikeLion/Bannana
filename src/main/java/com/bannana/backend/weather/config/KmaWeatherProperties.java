package com.bannana.backend.weather.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "weather.kma")
public record KmaWeatherProperties(
	String baseUrl,
	String serviceKey,
	int pageNo,
	int numOfRows,
	String dataType
) {
}
