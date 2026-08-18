package com.bannana.backend.recommendation.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class GeoPointTest {

    @Test
    @DisplayName("중심점은 좌표들의 단순 평균이다")
    void centroidIsSimpleAverage() {
        GeoPoint centroid = GeoPoint.centroid(List.of(
                new GeoPoint(37.0, 127.0),
                new GeoPoint(38.0, 127.0),
                new GeoPoint(37.5, 128.0)));

        assertThat(centroid.lat()).isCloseTo(37.5, org.assertj.core.data.Offset.offset(1e-9));
        assertThat(centroid.lng()).isCloseTo(127.3333333333, org.assertj.core.data.Offset.offset(1e-6));
    }

    @Test
    @DisplayName("좌표가 없으면 중심점을 만들 수 없다")
    void centroidRejectsEmpty() {
        assertThatThrownBy(() -> GeoPoint.centroid(List.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("강남역-잠실역 직선거리는 대략 6~8km")
    void distanceIsRoughlyCorrect() {
        GeoPoint gangnam = new GeoPoint(37.4979, 127.0276);
        GeoPoint jamsil = new GeoPoint(37.5133, 127.1000);

        assertThat(gangnam.distanceMeters(jamsil)).isBetween(6_000d, 8_000d);
    }

    @Test
    @DisplayName("위도 범위를 벗어나면 거부한다")
    void rejectsOutOfRangeLatitude() {
        assertThatThrownBy(() -> new GeoPoint(91.0, 127.0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
