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
     * 후보 점수를 만든다.
     *
     * <p>참여자 전원의 이동시간이 모여야 후보로 인정한다. 한 명이라도 조회에 실패하면 그 사람만 빠진
     * 채로 gap을 계산하게 되는데, 그러면 실제보다 공평해 보이는 값이 나와 후보 순위가 왜곡된다.
     * 그래서 구멍이 있는 후보는 아예 제외한다.
     *
     * @return 조회에 실패한 참여자가 한 명이라도 있으면 {@link Optional#empty()} — 해당 후보는 응답에서 빠진다.
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

        if (travelTimes.size() < participants.size()) {
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
