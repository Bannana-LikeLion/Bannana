package com.bannana.recommendation.config;

import com.bannana.recommendation.client.KakaoLocalClient;
import com.bannana.recommendation.service.station.AutoStationProvider;
import com.bannana.recommendation.service.station.KakaoStationProvider;
import com.bannana.recommendation.service.station.StaticStationProvider;
import com.bannana.recommendation.service.station.StationProvider;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** bannana.recommendation.station-provider 값에 따라 후보 역 선정 전략을 고른다. */
@Configuration
public class StationProviderConfig {

    private static final Logger log = LoggerFactory.getLogger(StationProviderConfig.class);

    @Bean
    public StationProvider stationProvider(KakaoLocalClient kakaoLocalClient, RecommendationProperties properties) {
        KakaoStationProvider kakao = new KakaoStationProvider(kakaoLocalClient, properties.searchRadii());
        StaticStationProvider staticProvider = new StaticStationProvider();

        String mode = properties.stationProvider().trim().toLowerCase(Locale.ROOT);
        log.info("후보 역 선정 방식: {}", mode);

        return switch (mode) {
            case "kakao" -> kakao;
            case "static" -> staticProvider;
            default -> new AutoStationProvider(kakao, staticProvider);
        };
    }
}
