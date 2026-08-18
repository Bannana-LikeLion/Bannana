package com.bannana.backend.recommendation.domain;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * (후보 역 × 참여자) 이동시간 조회 결과. 조회에 실패한 조합은 아예 담기지 않으므로,
 * {@link #get}이 null을 돌려주면 그 조합만 제외하고 계산을 이어가면 된다.
 *
 * <p>여러 스레드가 동시에 채우므로 내부 저장소는 동시성 컬렉션을 쓴다.
 */
public final class TravelTimeMatrix {

    private record Key(String stationName, String nickname) {
    }

    private final Map<Key, Integer> minutesByCombination = new ConcurrentHashMap<>();

    public void put(Station station, Participant participant, int minutes) {
        minutesByCombination.put(key(station, participant), minutes);
    }

    /** @return 조회에 실패했거나 아직 없으면 null */
    public Integer get(Station station, Participant participant) {
        return minutesByCombination.get(key(station, participant));
    }

    public boolean isEmpty() {
        return minutesByCombination.isEmpty();
    }

    public int size() {
        return minutesByCombination.size();
    }

    private Key key(Station station, Participant participant) {
        return new Key(station.name(), participant.nickname());
    }
}
