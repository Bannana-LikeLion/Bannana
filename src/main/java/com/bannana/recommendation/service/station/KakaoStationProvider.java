package com.bannana.recommendation.service.station;

import com.bannana.recommendation.client.KakaoLocalClient;
import com.bannana.recommendation.domain.GeoPoint;
import com.bannana.recommendation.domain.Station;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 카카오 로컬 카테고리 검색 기반 후보 선정.
 * 도심에서는 3km면 충분하지만 외곽에서는 역이 드물어서, minCount를 채울 때까지 반경을 넓혀 재시도한다.
 */
public class KakaoStationProvider implements StationProvider {

    private static final Logger log = LoggerFactory.getLogger(KakaoStationProvider.class);

    private final KakaoLocalClient kakaoLocalClient;
    private final List<Integer> searchRadii;

    public KakaoStationProvider(KakaoLocalClient kakaoLocalClient, List<Integer> searchRadii) {
        this.kakaoLocalClient = kakaoLocalClient;
        this.searchRadii = List.copyOf(searchRadii);
    }

    public boolean isConfigured() {
        return kakaoLocalClient.isConfigured();
    }

    @Override
    public List<Station> findCandidates(GeoPoint center, int minCount, int maxCount) {
        List<Station> best = List.of();

        for (int radius : searchRadii) {
            List<Station> found = kakaoLocalClient.searchSubwayStations(center, radius);
            if (found.size() > best.size()) {
                best = found;
            }
            if (best.size() >= minCount) {
                break;
            }
        }

        if (best.isEmpty()) {
            log.warn("카카오 검색으로 후보 역을 찾지 못했습니다 (center={},{}).", center.lat(), center.lng());
            return List.of();
        }

        // 이미 거리순으로 정렬돼 있으므로 앞에서부터 자른다.
        return best.size() > maxCount ? List.copyOf(best.subList(0, maxCount)) : best;
    }
}
