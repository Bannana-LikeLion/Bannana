package com.bannana.backend.recommendation.domain;

/**
 * 요청 DTO에서 변환된 참여자.
 *
 * @param maxTravelMin 없으면 null. soft 필터에만 쓰이고 후보를 강제 탈락시키지는 않는다.
 */
public record Participant(String nickname, GeoPoint origin, TransportMode transportMode, Integer maxTravelMin) {

    public boolean exceedsLimit(int travelMinutes) {
        return maxTravelMin != null && travelMinutes > maxTravelMin;
    }
}
