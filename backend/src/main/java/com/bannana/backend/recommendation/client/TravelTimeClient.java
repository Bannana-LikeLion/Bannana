package com.bannana.backend.recommendation.client;

import com.bannana.backend.recommendation.domain.GeoPoint;
import java.util.Optional;

/**
 * 대중교통 이동시간 조회 경계.
 *
 * <p>구현체는 <b>예외를 밖으로 던지지 않는다.</b> 실패한 (참여자 × 후보) 조합만 빠지고 나머지 계산은
 * 계속돼야 하므로, 타임아웃·4xx·5xx·파싱 오류를 전부 {@link Optional#empty()}로 흡수하고 로그만 남긴다.
 */
public interface TravelTimeClient {

    /**
     * 출발지 → 도착지 대중교통 소요시간(분).
     *
     * @return 조회에 실패하면 {@link Optional#empty()} — 호출부는 해당 조합만 제외하고 진행한다.
     */
    Optional<Integer> travelMinutes(GeoPoint origin, GeoPoint destination);
}
