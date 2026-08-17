package com.bannana.recommendation;

import static org.assertj.core.api.Assertions.assertThat;

import com.bannana.recommendation.config.RecommendationProperties;
import com.bannana.recommendation.service.RecommendationService;
import com.bannana.recommendation.service.station.AutoStationProvider;
import com.bannana.recommendation.service.station.StationProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BannanaRecommendationApplicationTests {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private StationProvider stationProvider;

    @Autowired
    private RecommendationProperties properties;

    @Test
    @DisplayName("API 키 없이도 컨텍스트가 뜨고 기본 설정이 바인딩된다")
    void contextLoads() {
        assertThat(recommendationService).isNotNull();
        assertThat(stationProvider).isInstanceOf(AutoStationProvider.class);
        assertThat(properties.minCandidates()).isEqualTo(6);
        assertThat(properties.maxCandidates()).isEqualTo(10);
        assertThat(properties.topN()).isEqualTo(3);
    }
}
