package com.bannana.backend.place.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kakao.local")
public record KakaoLocalProperties(
	String restApiKey,
	int radius,
	int size
) {
}
