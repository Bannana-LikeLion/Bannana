package com.bannana.backend.recommendation.web.dto;

import com.bannana.backend.recommendation.domain.ScoredCandidate;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * @param travelTimes 닉네임 -> 이동시간(분). 참여자 전원이 조회된 후보만 응답에 담기므로 항상 전원이 들어있다.
 */
public record CandidateDto(
        @JsonProperty("name") String name,
        @JsonProperty("lat") double lat,
        @JsonProperty("lng") double lng,
        @JsonProperty("travel_times") Map<String, Integer> travelTimes,
        @JsonProperty("gap_minutes") int gapMinutes) {

    public static CandidateDto from(ScoredCandidate candidate) {
        return new CandidateDto(
                candidate.station().name(),
                candidate.station().location().lat(),
                candidate.station().location().lng(),
                new LinkedHashMap<>(candidate.travelTimes()),
                candidate.gapMinutes());
    }
}
