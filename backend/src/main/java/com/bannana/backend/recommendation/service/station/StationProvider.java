package com.bannana.backend.recommendation.service.station;

import com.bannana.backend.recommendation.domain.GeoPoint;
import com.bannana.backend.recommendation.domain.Station;
import java.util.List;

/** 처리 순서 2단계: 중심점 주변 후보 지하철역 선정. */
public interface StationProvider {

    /**
     * @param minCount 이만큼은 채우려고 시도한다(반경 확장 등). 보장은 아니다.
     * @param maxCount 최대 개수
     * @return 후보 역 목록. 비어 있으면 추천을 만들 수 없다.
     */
    List<Station> findCandidates(GeoPoint center, int minCount, int maxCount);
}
