package com.bannana.backend.weather.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(KmaWeatherProperties.class)
public class WeatherConfig {

	@Bean
	public Clock weatherClock() {
		return Clock.system(ZoneId.of("Asia/Seoul"));
	}

	@Bean
	public RestClient weatherRestClient() {
		return RestClient.create();
	}
}
