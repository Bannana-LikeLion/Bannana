package com.bannana.backend.recommendation.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 외부 API 설정. 키는 application.yml에서 환경변수(KAKAO_API_KEY / ODSAY_API_KEY / TMAP_APP_KEY)로 바인딩된다.
 */
@ConfigurationProperties(prefix = "bannana.api")
public record ExternalApiProperties(Kakao kakao, Odsay odsay, Tmap tmap) {

    public record Kakao(String apiKey, String baseUrl, Duration connectTimeout, Duration readTimeout) {
        public Kakao {
            baseUrl = baseUrl == null ? "https://dapi.kakao.com" : baseUrl;
            connectTimeout = connectTimeout == null ? Duration.ofSeconds(3) : connectTimeout;
            readTimeout = readTimeout == null ? Duration.ofSeconds(5) : readTimeout;
        }

        public boolean hasApiKey() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    public record Odsay(String apiKey, String baseUrl, Duration connectTimeout, Duration readTimeout) {
        public Odsay {
            baseUrl = baseUrl == null ? "https://api.odsay.com" : baseUrl;
            connectTimeout = connectTimeout == null ? Duration.ofSeconds(3) : connectTimeout;
            readTimeout = readTimeout == null ? Duration.ofSeconds(6) : readTimeout;
        }

        public boolean hasApiKey() {
            return apiKey != null && !apiKey.isBlank();
        }
    }

    public record Tmap(String appKey, String baseUrl, Duration connectTimeout, Duration readTimeout) {
        public Tmap {
            baseUrl = baseUrl == null ? "https://apis.openapi.sk.com" : baseUrl;
            connectTimeout = connectTimeout == null ? Duration.ofSeconds(3) : connectTimeout;
            readTimeout = readTimeout == null ? Duration.ofSeconds(6) : readTimeout;
        }

        public boolean hasAppKey() {
            return appKey != null && !appKey.isBlank();
        }
    }
}