package com.bannana.recommendation.service;

/**
 * 외부 데이터에 기대어 추천을 만들 수 없는 상태. 502로 응답한다.
 * (후보 역을 하나도 못 찾은 경우, 모든 후보의 이동시간 조회가 실패한 경우)
 */
public class RecommendationUnavailableException extends RuntimeException {

    public RecommendationUnavailableException(String message) {
        super(message);
    }
}
