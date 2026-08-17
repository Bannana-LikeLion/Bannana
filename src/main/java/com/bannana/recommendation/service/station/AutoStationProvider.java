package com.bannana.recommendation.service.station;

import com.bannana.recommendation.domain.GeoPoint;
import com.bannana.recommendation.domain.Station;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 하이브리드 후보 선정: 카카오 실시간 검색을 기본으로 쓰되,
 * 키가 없거나 결과가 minCount에 못 미치면 정적 목록으로 폴백한다.
 */
public class AutoStationProvider implements StationProvider {

    private static final Logger log = LoggerFactory.getLogger(AutoStationProvider.class);

    private final KakaoStationProvider kakaoProvider;
    private final StaticStationProvider staticProvider;

    public AutoStationProvider(KakaoStationProvider kakaoProvider, StaticStationProvider staticProvider) {
        this.kakaoProvider = kakaoProvider;
        this.staticProvider = staticProvider;
    }

    @Override
    public List<Station> findCandidates(GeoPoint center, int minCount, int maxCount) {
        if (!kakaoProvider.isConfigured()) {
            log.debug("KAKAO_API_KEY가 없어 정적 역 목록을 사용합니다.");
            return staticProvider.findCandidates(center, minCount, maxCount);
        }

        List<Station> stations = kakaoProvider.findCandidates(center, minCount, maxCount);
        if (stations.size() >= minCount) {
            return stations;
        }

        log.info("카카오 결과가 {}건뿐이라 정적 역 목록으로 폴백합니다.", stations.size());
        return staticProvider.findCandidates(center, minCount, maxCount);
    }
}
