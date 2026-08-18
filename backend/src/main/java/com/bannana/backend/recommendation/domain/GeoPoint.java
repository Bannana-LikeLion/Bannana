package com.bannana.backend.recommendation.domain;

import java.util.Collection;

/**
 * WGS84 좌표. 위도/경도 순서를 여기서만 다루고, 외부 API가 요구하는 순서(ODsay는 X=경도, Y=위도)로의
 * 변환도 이 타입을 거치게 해서 lat/lng 뒤바뀜 실수를 한 곳에 가둔다.
 */
public record GeoPoint(double lat, double lng) {

    private static final double EARTH_RADIUS_METERS = 6_371_000d;

    public GeoPoint {
        if (lat < -90 || lat > 90) {
            throw new IllegalArgumentException("위도는 -90~90 범위여야 합니다: " + lat);
        }
        if (lng < -180 || lng > 180) {
            throw new IllegalArgumentException("경도는 -180~180 범위여야 합니다: " + lng);
        }
    }

    /** 처리 순서 1단계: 출발지 좌표들의 단순 평균 중심점. */
    public static GeoPoint centroid(Collection<GeoPoint> points) {
        if (points == null || points.isEmpty()) {
            throw new IllegalArgumentException("중심점을 계산할 좌표가 없습니다.");
        }
        double latSum = 0;
        double lngSum = 0;
        for (GeoPoint p : points) {
            latSum += p.lat();
            lngSum += p.lng();
        }
        return new GeoPoint(latSum / points.size(), lngSum / points.size());
    }

    /** 두 지점 사이의 대권 거리(m). 후보 정렬과 도보시간 추정에 쓴다. */
    public double distanceMeters(GeoPoint other) {
        double lat1 = Math.toRadians(this.lat);
        double lat2 = Math.toRadians(other.lat);
        double dLat = lat2 - lat1;
        double dLng = Math.toRadians(other.lng - this.lng);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1d, Math.sqrt(a)));
    }
}
