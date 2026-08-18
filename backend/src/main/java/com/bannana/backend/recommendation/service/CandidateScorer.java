package com.bannana.backend.recommendation.service;

import com.bannana.backend.recommendation.domain.Participant;
import com.bannana.backend.recommendation.domain.ScoredCandidate;
import com.bannana.backend.recommendation.domain.Station;
import com.bannana.backend.recommendation.domain.TravelTimeMatrix;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** 처리 순서 4단계: 후보별 gap_minutes / 합계 계산과 상위 N개 선정. */
@Component
public class CandidateScorer {

    /**
     * 조회에 성공한 참여자들만으로 후보 점수를 만든다.
     *
     * @return 성공한 조합이 하나도 없으면 {@link Optional#empty()} — 해당 후보는 응답에서 빠진다.
     */
    public Optional<ScoredCandidate> score(Station station, List<Participant> participants, TravelTimeMatrix matrix) {
        // 병렬 조회 순서와 무관하게 응답이 일정하도록 참여자 입력 순서대로 다시 담는다.
        Map<String, Integer> travelTimes = new LinkedHashMap<>();
        int violations = 0;
        int total = 0;
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;

        for (Participant participant : participants) {
            Integer minutes = matrix.get(station, participant);
            if (minutes == null) {
                continue;
            }
            travelTimes.put(participant.nickname(), minutes);
            total += minutes;
            min = Math.min(min, minutes);
            max = Math.max(max, minutes);
            if (participant.exceedsLimit(minutes)) {
                violations++;
            }
        }

        if (travelTimes.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(new ScoredCandidate(station, travelTimes, max - min, total, violations));
    }

    /** gap_minutes 오름차순(+ max_travel_min soft 필터) 상위 topN. */
    public List<ScoredCandidate> topCandidates(List<ScoredCandidate> candidates, int topN) {
        return candidates.stream()
                .sorted(ScoredCandidate.ranking())
                .limit(topN)
                .toList();
    }
}
