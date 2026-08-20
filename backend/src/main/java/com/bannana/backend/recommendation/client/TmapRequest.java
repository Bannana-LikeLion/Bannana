package com.bannana.backend.recommendation.client;

/**
 * Tmap 대중교통 경로안내 요청 body.
 *
 * <p>X가 경도, Y가 위도다. 순서를 바꿔도 오류가 나지 않고 엉뚱한 경로가 나와서 발견이 늦으니 주의.
 *
 * @param count  받을 경로 수 (1~10)
 * @param lang   0 = 국문
 * @param format 응답 포맷
 */
public record TmapRequest(
        String startX,
        String startY,
        String endX,
        String endY,
        int count,
        int lang,
        String format) {

    public static TmapRequest of(double startLng, double startLat, double endLng, double endLat, int count) {
        return new TmapRequest(
                String.valueOf(startLng),
                String.valueOf(startLat),
                String.valueOf(endLng),
                String.valueOf(endLat),
                count,
                0,
                "json");
    }
}
