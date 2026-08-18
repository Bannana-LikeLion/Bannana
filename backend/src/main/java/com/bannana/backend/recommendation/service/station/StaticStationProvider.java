package com.bannana.backend.recommendation.service.station;

import com.bannana.backend.recommendation.domain.GeoPoint;
import com.bannana.backend.recommendation.domain.Station;
import java.util.Comparator;
import java.util.List;

/**
 * 정적 역 목록에서 중심점 최근접 N개를 고른다.
 * 카카오 키가 없거나 카카오 호출이 실패했을 때의 폴백이며, 테스트를 결정론적으로 만드는 용도이기도 하다.
 */
public class StaticStationProvider implements StationProvider {

    private final List<Station> catalog;

    public StaticStationProvider() {
        this(StationCatalog.stations());
    }

    public StaticStationProvider(List<Station> catalog) {
        this.catalog = List.copyOf(catalog);
    }

    @Override
    public List<Station> findCandidates(GeoPoint center, int minCount, int maxCount) {
        return catalog.stream()
                .sorted(Comparator.comparingDouble(station -> center.distanceMeters(station.location())))
                .limit(maxCount)
                .toList();
    }
}
