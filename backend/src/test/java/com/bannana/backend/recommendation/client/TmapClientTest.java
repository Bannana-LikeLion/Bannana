package com.bannana.backend.recommendation.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.bannana.backend.recommendation.config.ExternalApiProperties;
import com.bannana.backend.recommendation.domain.GeoPoint;
import java.util.Optional;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

class TmapClientTest {

    private static final GeoPoint ORIGIN = new GeoPoint(37.5665, 126.9780);
    private static final GeoPoint DESTINATION = new GeoPoint(37.5446, 127.0559);

    private MockRestServiceServer server;
    private TmapClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://apis.openapi.sk.com");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new TmapClient(builder.build(), properties("test-app-key"), new JsonMapper());
    }

    private static ExternalApiProperties properties(String appKey) {
        return new ExternalApiProperties(
                new ExternalApiProperties.Kakao(null, null, null, null),
                new ExternalApiProperties.Odsay(null, null, null, null),
                new ExternalApiProperties.Tmap(appKey, "https://apis.openapi.sk.com", null, null));
    }

    @Test
    @DisplayName("appKey 헤더와 함께 POST하고, startX/startY에 경도/위도를 순서대로 보낸다")
    void sendsAppKeyHeaderAndLngAsX() {
        server.expect(requestTo(Matchers.containsString("/transit/routes")))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("appKey", "test-app-key"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.startX").value("126.978"))   // 출발지 경도
                .andExpect(jsonPath("$.startY").value("37.5665"))   // 출발지 위도
                .andExpect(jsonPath("$.endX").value("127.0559"))    // 도착지 경도
                .andExpect(jsonPath("$.endY").value("37.5446"))     // 도착지 위도
                .andRespond(withSuccess("""
                        {"metaData": {"plan": {"itineraries": [{"totalTime": 2040}]}}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).contains(34);
        server.verify();
    }

    @Test
    @DisplayName("totalTime은 초 단위라 분으로 바꾸고, 여러 경로 중 가장 짧은 것을 고른다")
    void convertsSecondsToMinutesAndPicksShortest() {
        server.expect(requestTo(Matchers.containsString("/transit/routes")))
                .andRespond(withSuccess("""
                        {"metaData": {"plan": {"itineraries": [
                          {"totalTime": 2460},
                          {"totalTime": 2040},
                          {"totalTime": 3000}
                        ]}}}
                        """, MediaType.APPLICATION_JSON));

        // 2040초 = 34분
        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).contains(34);
    }

    @Test
    @DisplayName("출발지와 도착지가 가까우면(status=11) 도보 추정치로 대체한다")
    void fallsBackToWalkingWhenTooClose() {
        server.expect(requestTo(Matchers.containsString("/transit/routes")))
                .andRespond(withSuccess("""
                        {"result": {"status": 11, "message": "출발지와 도착지가 너무 가깝습니다."}}
                        """, MediaType.APPLICATION_JSON));

        // 약 400m 떨어진 지점 -> 도보 6분 남짓
        Optional<Integer> minutes = client.travelMinutes(ORIGIN, new GeoPoint(37.5700, 126.9780));

        assertThat(minutes).isPresent();
        assertThat(minutes.get()).isBetween(1, 15);
    }

    @Test
    @DisplayName("경로를 못 찾으면(status=11 외) HTTP 200이어도 실패로 처리한다")
    void treatsOtherResultStatusAsFailure() {
        server.expect(requestTo(Matchers.containsString("/transit/routes")))
                .andRespond(withSuccess("""
                        {"result": {"status": 14, "message": "경로를 찾을 수 없습니다."}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }

    @Test
    @DisplayName("경로 목록이 비어 있으면 실패로 처리한다")
    void treatsEmptyItinerariesAsFailure() {
        server.expect(requestTo(Matchers.containsString("/transit/routes")))
                .andRespond(withSuccess("""
                        {"metaData": {"plan": {"itineraries": []}}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }

    @Test
    @DisplayName("HTTP 5xx는 실패로 흡수하고 예외를 던지지 않는다")
    void absorbsServerErrors() {
        server.expect(requestTo(Matchers.containsString("/transit/routes")))
                .andRespond(withServerError());

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }

    @Test
    @DisplayName("appKey가 없으면 호출하지 않고 실패로 처리한다")
    void skipsCallWithoutAppKey() {
        TmapClient keyless = new TmapClient(RestClient.builder().build(), properties(""), new JsonMapper());

        assertThat(keyless.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }
}
