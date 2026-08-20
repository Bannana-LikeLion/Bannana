package com.bannana.backend.recommendation.domain;

import java.util.Comparator;
import java.util.Map;

/**
 * 이동시간 조회가 끝난 후보 하나.
 *
 * @param travelTimes    닉네임 -> 이동시간(분). 참여자 전원이 조회돼야 후보로 인정하므로 항상 전원이 들어있다.
 * @param gapMinutes     최대 - 최소 이동시간
 * @param totalMinutes   이동시간 합계
 * @param violationCount max_travel_min을 초과한 참여자 수 (soft 필터용)
 */
public record ScoredCandidate(
        Station station,
        Map<String, Integer> travelTimes,
        int gapMinutes,
        int totalMinutes,
        int violationCount) {

    /**
     * 정렬 기준. max_travel_min을 아무도 넘기지 않는 후보를 먼저 놓고(soft 필터),
     * 그 안에서는 명세대로 gap_minutes 오름차순, 동률이면 합계가 작은 쪽을 앞에 둔다.
     * 초과 후보도 뒤에 남아 있으므로 상위 3개는 가능한 한 항상 채워진다.
     */
    public static Comparator<ScoredCandidate> ranking() {
        return Comparator.comparing((ScoredCandidate c) -> c.violationCount() > 0)
                .thenComparingInt(ScoredCandidate::gapMinutes)
                .thenComparingInt(ScoredCandidate::totalMinutes)
                .thenComparing(c -> c.station().name());
    }
}
