package com.bannana.backend.place.config;

import java.net.http.HttpClient;
import java.time.Duration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(KakaoLocalProperties.class)
public class KakaoLocalConfig {

	@Bean
	public HttpClient kakaoHttpClient() {
		return HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(10))
			.build();
	}
}
