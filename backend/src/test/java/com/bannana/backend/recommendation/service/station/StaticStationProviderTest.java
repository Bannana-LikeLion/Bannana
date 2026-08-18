package com.bannana.backend.recommendation.service.station;

import static org.assertj.core.api.Assertions.assertThat;

import com.bannana.backend.recommendation.domain.GeoPoint;
import com.bannana.backend.recommendation.domain.Station;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class StaticStationProviderTest {

    private final StaticStationProvider provider = new StaticStationProvider();

    @Test
    @DisplayName("중심점에서 가까운 역부터 최대 개수만큼 돌려준다")
    void returnsNearestStations() {
        GeoPoint gangnam = new GeoPoint(37.4979, 127.0276);

        List<Station> candidates = provider.findCandidates(gangnam, 6, 8);

        assertThat(candidates).hasSize(8);
        assertThat(candidates.getFirst().name()).isEqualTo("강남역");
        // 가까운 순 정렬이 유지되는지 확인
        double previous = -1;
        for (Station station : candidates) {
            double distance = gangnam.distanceMeters(station.location());
            assertThat(distance).isGreaterThanOrEqualTo(previous);
            previous = distance;
        }
    }

    @Test
    @DisplayName("역 이름이 중복되지 않는다")
    void catalogHasNoDuplicateNames() {
        List<Station> all = provider.findCandidates(new GeoPoint(37.5, 127.0), 1, Integer.MAX_VALUE);

        assertThat(all).extracting(Station::name).doesNotHaveDuplicates();
    }
}
