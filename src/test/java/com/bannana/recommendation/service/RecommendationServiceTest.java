package com.bannana.recommendation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.bannana.recommendation.client.OdsayClient;
import com.bannana.recommendation.config.RecommendationProperties;
import com.bannana.recommendation.domain.GeoPoint;
import com.bannana.recommendation.domain.Station;
import com.bannana.recommendation.service.station.StationProvider;
import com.bannana.recommendation.web.dto.CandidateDto;
import com.bannana.recommendation.web.dto.ParticipantRequest;
import com.bannana.recommendation.web.dto.RecommendationRequest;
import com.bannana.recommendation.web.dto.RecommendationResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RecommendationServiceTest {

    private static final Station SEONGSU = new Station("성수역", new GeoPoint(37.5446, 127.0559));
    private static final Station GANGNAM = new Station("강남역", new GeoPoint(37.4979, 127.0276));
    private static final Station JAMSIL = new Station("잠실역", new GeoPoint(37.5133, 127.1000));
    private static final Station HONGDAE = new Station("홍대입구역", new GeoPoint(37.5571, 126.9245));

    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final OdsayClient odsayClient = mock(OdsayClient.class);

    @AfterEach
    void tearDown() {
        executor.shutdownNow();
    }

    private RecommendationService serviceWith(List<Station> stations) {
        StationProvider stationProvider = (center, minCount, maxCount) -> stations;
        RecommendationProperties properties =
                new RecommendationProperties(1, 10, 3, List.of(3000), "static", 4);
        return new RecommendationService(stationProvider, odsayClient, new CandidateScorer(), properties, executor);
    }

    private static RecommendationRequest request() {
        return new RecommendationRequest(
                List.of(
                        new ParticipantRequest("김보경", 37.5665, 126.9780, "transit", 60),
                        new ParticipantRequest("송현석", 37.4979, 127.0276, "transit", 60),
                        new ParticipantRequest("이지은", 37.5445, 127.0557, "transit", 60)),
                List.of("cafe", "restaurant"),
                LocalDateTime.of(2026, 8, 14, 19, 0));
    }

    @Test
    @DisplayName("gap이 가장 작은 후보 3곳을 돌려준다")
    void returnsTopThreeByGap() {
        // 성수 gap=2, 강남 gap=10, 잠실 gap=30, 홍대 gap=4
        stubMinutes(SEONGSU, 30, 31, 32);
        stubMinutes(GANGNAM, 30, 35, 40);
        stubMinutes(JAMSIL, 20, 40, 50);
        stubMinutes(HONGDAE, 25, 27, 29);

        RecommendationResponse response = serviceWith(List.of(SEONGSU, GANGNAM, JAMSIL, HONGDAE)).recommend(request());

        assertThat(response.candidates()).extracting(CandidateDto::name)
                .containsExactly("성수역", "홍대입구역", "강남역");
        assertThat(response.candidates().getFirst().gapMinutes()).isEqualTo(2);
        assertThat(response.candidates().getFirst().travelTimes())
                .containsExactlyInAnyOrderEntriesOf(Map.of("김보경", 30, "송현석", 31, "이지은", 32));
    }

    @Test
    @DisplayName("일부 조합이 실패해도 나머지로 계산을 계속한다")
    void continuesWhenSomeLookupsFail() {
        stubMinutes(SEONGSU, 30, 31, 32);
        // 강남역은 두 번째 참여자만 실패
        when(odsayClient.travelMinutes(originOf(0), GANGNAM.location())).thenReturn(Optional.of(20));
        when(odsayClient.travelMinutes(originOf(1), GANGNAM.location())).thenReturn(Optional.empty());
        when(odsayClient.travelMinutes(originOf(2), GANGNAM.location())).thenReturn(Optional.of(21));

        RecommendationResponse response = serviceWith(List.of(SEONGSU, GANGNAM)).recommend(request());

        CandidateDto gangnam = response.candidates().stream()
                .filter(c -> c.name().equals("강남역"))
                .findFirst()
                .orElseThrow();

        assertThat(gangnam.travelTimes()).containsOnlyKeys("김보경", "이지은");
        assertThat(gangnam.gapMinutes()).isEqualTo(1);
        assertThat(response.candidates()).hasSize(2);
    }

    @Test
    @DisplayName("모든 후보 계산이 실패하면 502로 이어질 예외를 던진다")
    void throwsWhenEveryCandidateFails() {
        when(odsayClient.travelMinutes(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> serviceWith(List.of(SEONGSU, GANGNAM)).recommend(request()))
                .isInstanceOf(RecommendationUnavailableException.class)
                .hasMessageContaining("이동시간 조회에 실패");
    }

    @Test
    @DisplayName("후보 역을 찾지 못하면 502로 이어질 예외를 던진다")
    void throwsWhenNoStationFound() {
        assertThatThrownBy(() -> serviceWith(List.of()).recommend(request()))
                .isInstanceOf(RecommendationUnavailableException.class)
                .hasMessageContaining("후보 역");
    }

    @Test
    @DisplayName("닉네임이 중복되면 400으로 이어질 예외를 던진다")
    void rejectsDuplicateNicknames() {
        RecommendationRequest duplicated = new RecommendationRequest(
                List.of(
                        new ParticipantRequest("김보경", 37.5, 127.0, "transit", null),
                        new ParticipantRequest("김보경", 37.6, 127.1, "transit", null)),
                List.of(),
                null);

        assertThatThrownBy(() -> serviceWith(List.of(SEONGSU)).recommend(duplicated))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nickname");
    }

    private void stubMinutes(Station station, int first, int second, int third) {
        when(odsayClient.travelMinutes(originOf(0), station.location())).thenReturn(Optional.of(first));
        when(odsayClient.travelMinutes(originOf(1), station.location())).thenReturn(Optional.of(second));
        when(odsayClient.travelMinutes(originOf(2), station.location())).thenReturn(Optional.of(third));
    }

    private GeoPoint originOf(int index) {
        ParticipantRequest raw = request().participants().get(index);
        return new GeoPoint(raw.originLat(), raw.originLng());
    }
}
