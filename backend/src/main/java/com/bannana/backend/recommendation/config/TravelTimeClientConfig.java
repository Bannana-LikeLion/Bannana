package com.bannana.backend.recommendation.config;

import com.bannana.backend.recommendation.client.OdsayClient;
import com.bannana.backend.recommendation.client.TmapClient;
import com.bannana.backend.recommendation.client.TravelTimeClient;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

/**
 * bannana.recommendation.travel-time-provider 값에 따라 이동시간 조회 백엔드를 고른다.
 *
 * <p>ODsay는 일일 호출 한도에 걸려 Tmap으로 갈아탔지만, 한도가 리셋되면 다시 쓸 수 있어서
 * 코드를 지우지 않고 설정으로 전환할 수 있게 남겨뒀다.
 */
@Configuration
public class TravelTimeClientConfig {

    private static final Logger log = LoggerFactory.getLogger(TravelTimeClientConfig.class);

    @Bean
    public TravelTimeClient travelTimeClient(
            @Qualifier("tmapRestClient") RestClient tmapRestClient,
            @Qualifier("odsayRestClient") RestClient odsayRestClient,
            ExternalApiProperties externalApiProperties,
            RecommendationProperties recommendationProperties,
            ObjectMapper objectMapper) {

        String provider = recommendationProperties.travelTimeProvider().trim().toLowerCase(Locale.ROOT);
        log.info("이동시간 조회 제공자: {}", provider);

        if ("odsay".equals(provider)) {
            return new OdsayClient(odsayRestClient, externalApiProperties);
        }
        return new TmapClient(tmapRestClient, externalApiProperties, objectMapper);
    }
}
