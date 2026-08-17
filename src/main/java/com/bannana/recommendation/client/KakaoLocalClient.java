package com.bannana.recommendation.client;

import com.bannana.recommendation.config.ExternalApiProperties;
import com.bannana.recommendation.domain.GeoPoint;
import com.bannana.recommendation.domain.Station;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** 카카오 로컬 API로 중심점 주변 지하철역을 검색한다. */
@Component
public class KakaoLocalClient {

    private static final Logger log = LoggerFactory.getLogger(KakaoLocalClient.class);

    /** 카카오 카테고리 그룹 코드: 지하철역. */
    private static final String SUBWAY_CATEGORY = "SW8";

    /** 카카오 카테고리 검색의 페이지당 최대 건수. */
    private static final int MAX_PAGE_SIZE = 15;

    /** 카카오가 허용하는 최대 반경(m). */
    private static final int MAX_RADIUS_METERS = 20_000;

    private final RestClient restClient;
    private final ExternalApiProperties.Kakao properties;

    public KakaoLocalClient(RestClient kakaoRestClient, ExternalApiProperties properties) {
        this.restClient = kakaoRestClient;
        this.properties = properties.kakao();
    }

    public boolean isConfigured() {
        return properties.hasApiKey();
    }

    /**
     * 중심점 주변 지하철역을 가까운 순으로 조회한다. 실패하면 예외 대신 빈 목록을 돌려주고,
     * 호출부(AutoStationProvider)가 정적 리스트로 넘어가게 한다.
     */
    public List<Station> searchSubwayStations(GeoPoint center, int radiusMeters) {
        if (!isConfigured()) {
            return List.of();
        }

        int radius = Math.min(radiusMeters, MAX_RADIUS_METERS);
        try {
            KakaoCategoryResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v2/local/search/category.json")
                            .queryParam("category_group_code", SUBWAY_CATEGORY)
                            .queryParam("x", center.lng())
                            .queryParam("y", center.lat())
                            .queryParam("radius", radius)
                            .queryParam("size", MAX_PAGE_SIZE)
                            .queryParam("sort", "distance")
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + properties.apiKey())
                    .retrieve()
                    .body(KakaoCategoryResponse.class);

            return toStations(response);
        } catch (Exception e) {
            log.warn("카카오 지하철역 검색 실패 (radius={}m): {}", radius, e.toString());
            return List.of();
        }
    }

    private List<Station> toStations(KakaoCategoryResponse response) {
        if (response == null || response.documents() == null) {
            return List.of();
        }

        // 같은 역이 호선별로 여러 건 내려오므로 정규화한 이름으로 중복을 제거한다.
        // sort=distance라 먼저 온 것이 가장 가까운 좌표이니 첫 건을 남긴다.
        Map<String, Station> unique = new LinkedHashMap<>();
        for (KakaoCategoryResponse.Document document : response.documents()) {
            Station station = toStation(document);
            if (station != null) {
                unique.putIfAbsent(station.name(), station);
            }
        }
        return new ArrayList<>(unique.values());
    }

    private Station toStation(KakaoCategoryResponse.Document document) {
        if (document == null || document.placeName() == null || document.x() == null || document.y() == null) {
            return null;
        }
        try {
            GeoPoint location = new GeoPoint(Double.parseDouble(document.y()), Double.parseDouble(document.x()));
            return new Station(normalizeName(document.placeName()), location);
        } catch (RuntimeException e) {
            log.debug("카카오 문서 파싱 실패: {}", document);
            return null;
        }
    }

    /** "성수역 2호선" -> "성수역". 호선 표기를 떼어내 같은 역을 하나로 묶는다. */
    private String normalizeName(String placeName) {
        String name = placeName.trim();
        int space = name.indexOf(' ');
        if (space > 0) {
            name = name.substring(0, space);
        }
        return name.endsWith("역") ? name : name + "역";
    }
}
