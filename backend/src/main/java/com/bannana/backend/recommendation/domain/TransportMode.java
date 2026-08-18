package com.bannana.backend.recommendation.domain;

import java.util.Locale;

/**
 * 요청의 transport_mode. 현재 이동시간 계산은 ODsay 대중교통 경로검색만 사용하므로
 * TRANSIT 이외의 값도 전부 대중교통 기준으로 계산된다(경고 로그만 남김).
 */
public enum TransportMode {
    TRANSIT,
    CAR,
    WALK;

    public static TransportMode from(String raw) {
        if (raw == null || raw.isBlank()) {
            return TRANSIT;
        }
        return switch (raw.trim().toLowerCase(Locale.ROOT)) {
            case "car", "driving" -> CAR;
            case "walk", "walking" -> WALK;
            default -> TRANSIT;
        };
    }
}
