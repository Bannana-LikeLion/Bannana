package com.bannana.backend.recommendation.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class OdsayClientTest {

    private static final GeoPoint ORIGIN = new GeoPoint(37.5665, 126.9780);
    private static final GeoPoint DESTINATION = new GeoPoint(37.5446, 127.0559);

    private MockRestServiceServer server;
    private OdsayClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.odsay.com");
        server = MockRestServiceServer.bindTo(builder).build();
        ExternalApiProperties properties = new ExternalApiProperties(
                new ExternalApiProperties.Kakao(null, null, null, null),
                new ExternalApiProperties.Odsay("test-key", "https://api.odsay.com", null, null));
        client = new OdsayClient(builder.build(), properties);
    }

    @Test
    @DisplayName("SX/SY에 경도/위도를 순서대로 보내고 최단 경로 시간을 돌려준다")
    void sendsLngAsXAndReturnsShortestPath() {
        server.expect(requestTo(Matchers.containsString("/v1/api/searchPubTransPathT")))
                .andExpect(queryParam("SX", "126.978"))   // 출발지 경도
                .andExpect(queryParam("SY", "37.5665"))   // 출발지 위도
                .andExpect(queryParam("EX", "127.0559"))  // 도착지 경도
                .andExpect(queryParam("EY", "37.5446"))   // 도착지 위도
                .andRespond(withSuccess("""
                        {"result": {"path": [
                          {"info": {"totalTime": 41}},
                          {"info": {"totalTime": 34}}
                        ]}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).contains(34);
        server.verify();
    }

    @Test
    @DisplayName("ODsay가 본문에 error를 담아 200으로 응답하면 실패로 처리한다")
    void treatsErrorBodyAsFailure() {
        server.expect(requestTo(Matchers.containsString("searchPubTransPathT")))
                .andRespond(withSuccess("""
                        {"error": {"code": "-98", "msg": "일시적인 오류입니다."}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }

    @Test
    @DisplayName("출발지와 도착지가 너무 가까우면 도보 추정치로 대체한다")
    void fallsBackToWalkingWhenTooClose() {
        server.expect(requestTo(Matchers.containsString("searchPubTransPathT")))
                .andRespond(withSuccess("""
                        {"error": {"code": "-8", "msg": "출발지와 도착지가 너무 가깝습니다."}}
                        """, MediaType.APPLICATION_JSON));

        // 약 400m 떨어진 지점 -> 도보 6분 남짓
        Optional<Integer> minutes = client.travelMinutes(ORIGIN, new GeoPoint(37.5700, 126.9780));

        assertThat(minutes).isPresent();
        assertThat(minutes.get()).isBetween(1, 15);
    }

    @Test
    @DisplayName("HTTP 5xx는 실패로 흡수하고 예외를 던지지 않는다")
    void absorbsServerErrors() {
        server.expect(requestTo(Matchers.containsString("searchPubTransPathT")))
                .andRespond(withServerError());

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }

    @Test
    @DisplayName("경로 결과가 비어 있으면 실패로 처리한다")
    void treatsEmptyPathAsFailure() {
        server.expect(requestTo(Matchers.containsString("searchPubTransPathT")))
                .andRespond(withSuccess("""
                        {"result": {"path": []}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }

    @Test
    @DisplayName("API 키가 없으면 호출하지 않고 실패로 처리한다")
    void skipsCallWithoutApiKey() {
        ExternalApiProperties noKey = new ExternalApiProperties(
                new ExternalApiProperties.Kakao(null, null, null, null),
                new ExternalApiProperties.Odsay("", null, null, null));
        OdsayClient keyless = new OdsayClient(RestClient.builder().build(), noKey);

        assertThat(keyless.travelMinutes(ORIGIN, DESTINATION)).isEmpty();
    }
}
