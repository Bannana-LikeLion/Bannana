package com.bannana.recommendation.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.bannana.recommendation.domain.GeoPoint;
import com.bannana.recommendation.domain.Participant;
import com.bannana.recommendation.domain.ScoredCandidate;
import com.bannana.recommendation.domain.Station;
import com.bannana.recommendation.domain.TransportMode;
import com.bannana.recommendation.domain.TravelTimeMatrix;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CandidateScorerTest {

    private final CandidateScorer scorer = new CandidateScorer();

    private static Participant participant(String nickname, Integer maxTravelMin) {
        return new Participant(nickname, new GeoPoint(37.5, 127.0), TransportMode.TRANSIT, maxTravelMin);
    }

    private static Station station(String name) {
        return new Station(name, new GeoPoint(37.55, 127.05));
    }

    @Test
    @DisplayName("gap_minutes는 최대-최소 이동시간이고 travel_times는 참여자 입력 순서를 따른다")
    void computesGapAndKeepsParticipantOrder() {
        Station station = station("성수역");
        List<Participant> participants = List.of(participant("김보경", null), participant("송현석", null), participant("이지은", null));

        TravelTimeMatrix matrix = new TravelTimeMatrix();
        matrix.put(station, participants.get(2), 39);
        matrix.put(station, participants.get(0), 34);
        matrix.put(station, participants.get(1), 37);

        ScoredCandidate candidate = scorer.score(station, participants, matrix).orElseThrow();

        assertThat(candidate.gapMinutes()).isEqualTo(5);
        assertThat(candidate.totalMinutes()).isEqualTo(110);
        assertThat(candidate.travelTimes()).containsExactly(
                org.assertj.core.api.Assertions.entry("김보경", 34),
                org.assertj.core.api.Assertions.entry("송현석", 37),
                org.assertj.core.api.Assertions.entry("이지은", 39));
    }

    @Test
    @DisplayName("조회에 실패한 참여자는 빼고 나머지로 계산한다")
    void skipsFailedParticipants() {
        Station station = station("성수역");
        List<Participant> participants = List.of(participant("김보경", null), participant("송현석", null));

        TravelTimeMatrix matrix = new TravelTimeMatrix();
        matrix.put(station, participants.get(0), 30);

        ScoredCandidate candidate = scorer.score(station, participants, matrix).orElseThrow();

        assertThat(candidate.travelTimes()).containsOnlyKeys("김보경");
        assertThat(candidate.gapMinutes()).isZero();
    }

    @Test
    @DisplayName("모든 참여자 조회가 실패한 후보는 결과에서 빠진다")
    void dropsCandidateWithNoSuccessfulLookup() {
        Station station = station("성수역");
        List<Participant> participants = List.of(participant("김보경", null));

        Optional<ScoredCandidate> candidate = scorer.score(station, participants, new TravelTimeMatrix());

        assertThat(candidate).isEmpty();
    }

    @Test
    @DisplayName("gap이 작은 순으로 정렬하고 동률이면 합계가 작은 쪽이 앞선다")
    void ranksByGapThenTotal() {
        ScoredCandidate wideGap = new ScoredCandidate(station("A"), java.util.Map.of(), 20, 100, 0);
        ScoredCandidate tightBigTotal = new ScoredCandidate(station("B"), java.util.Map.of(), 5, 200, 0);
        ScoredCandidate tightSmallTotal = new ScoredCandidate(station("C"), java.util.Map.of(), 5, 120, 0);

        List<ScoredCandidate> top = scorer.topCandidates(List.of(wideGap, tightBigTotal, tightSmallTotal), 3);

        assertThat(top).extracting(c -> c.station().name()).containsExactly("C", "B", "A");
    }

    @Test
    @DisplayName("max_travel_min 초과 후보는 뒤로 밀리지만 상위 3개를 채우기 위해 남는다")
    void softFilterPushesViolatorsBackButKeepsThem() {
        ScoredCandidate violatorTightGap = new ScoredCandidate(station("초과"), java.util.Map.of(), 1, 100, 2);
        ScoredCandidate okWideGap = new ScoredCandidate(station("적합1"), java.util.Map.of(), 15, 100, 0);
        ScoredCandidate okWiderGap = new ScoredCandidate(station("적합2"), java.util.Map.of(), 18, 100, 0);

        List<ScoredCandidate> top = scorer.topCandidates(List.of(violatorTightGap, okWideGap, okWiderGap), 3);

        assertThat(top).extracting(c -> c.station().name()).containsExactly("적합1", "적합2", "초과");
    }

    @Test
    @DisplayName("max_travel_min을 넘긴 참여자 수를 센다")
    void countsViolations() {
        Station station = station("성수역");
        List<Participant> participants = List.of(participant("김보경", 40), participant("송현석", 30));

        TravelTimeMatrix matrix = new TravelTimeMatrix();
        matrix.put(station, participants.get(0), 35);
        matrix.put(station, participants.get(1), 35);

        ScoredCandidate candidate = scorer.score(station, participants, matrix).orElseThrow();

        assertThat(candidate.violationCount()).isEqualTo(1);
    }
}
