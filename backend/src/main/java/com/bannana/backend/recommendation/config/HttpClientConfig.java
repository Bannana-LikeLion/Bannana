package com.bannana.backend.recommendation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.net.http.HttpClient;
import org.springframework.http.client.JdkClientHttpRequestFactory;
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

    /**
     * Tmap은 유일하게 POST + JSON body를 쓴다.
     *
     * <p>SimpleClientHttpRequestFactory로 보내면 본문이 {@code Transfer-Encoding: chunked}로 나가고
     * Content-Length가 붙지 않는데, SK 오픈API 게이트웨이가 이를 거부하는 경우가 있다.
     * JdkClientHttpRequestFactory는 본문을 버퍼링해 Content-Length를 붙여준다.
     */
    @Bean
    public RestClient tmapRestClient(ExternalApiProperties properties) {
        ExternalApiProperties.Tmap tmap = properties.tmap();

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(tmap.connectTimeout())
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(tmap.readTimeout());

        return RestClient.builder()
                .baseUrl(tmap.baseUrl())
                .defaultHeader("Accept", "application/json")
                .defaultHeader("Content-Type", "application/json")
                .requestFactory(factory)
                .build();
    }

    private SimpleClientHttpRequestFactory requestFactory(long connectMillis, long readMillis) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) connectMillis);
        factory.setReadTimeout((int) readMillis);
        return factory;
    }
}
