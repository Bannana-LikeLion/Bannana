package com.bannana.backend.recommendation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * 외부 API별 RestClient. 타임아웃을 반드시 걸어둔다 —
 * ODsay 한 건이 매달리면 전체 추천 요청이 그만큼 늦어지기 때문이다.
 */
@Configuration
@EnableConfigurationProperties({ExternalApiProperties.class, RecommendationProperties.class})
public class HttpClientConfig {

    @Bean
    public RestClient kakaoRestClient(ExternalApiProperties properties) {
        ExternalApiProperties.Kakao kakao = properties.kakao();
        return RestClient.builder()
                .baseUrl(kakao.baseUrl())
                .requestFactory(requestFactory(kakao.connectTimeout().toMillis(), kakao.readTimeout().toMillis()))
                .build();
    }

    @Bean
    public RestClient odsayRestClient(ExternalApiProperties properties) {
        ExternalApiProperties.Odsay odsay = properties.odsay();
        return RestClient.builder()
                .baseUrl(odsay.baseUrl())
                .requestFactory(requestFactory(odsay.connectTimeout().toMillis(), odsay.readTimeout().toMillis()))
                .build();
    }

    private SimpleClientHttpRequestFactory requestFactory(long connectMillis, long readMillis) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) connectMillis);
        factory.setReadTimeout((int) readMillis);
        return factory;
    }
}
