package com.bannana.backend.recommendation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bannana.backend.recommendation.client.TravelTimeClient;
import com.bannana.backend.recommendation.domain.GeoPoint;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 이동시간 조회만 스텁으로 바꾸고 나머지(정적 역 목록 -> 병렬 조회 -> 점수화 -> JSON 직렬화)는 실제 빈으로 태우는
 * 성공 경로 검증. 프론트가 받게 될 응답 형태를 그대로 확인한다.
 */
@SpringBootTest(properties = {
        "bannana.recommendation.station-provider=static",
        "bannana.recommendation.max-candidates=8"
})
@AutoConfigureMockMvc
class RecommendationEndToEndTest {

    private static final String BODY = """
            {
              "participants": [
                {"nickname": "김보경", "origin_lat": 37.5665, "origin_lng": 126.9780,
                 "transport_mode": "transit", "max_travel_min": 60},
                {"nickname": "송현석", "origin_lat": 37.4979, "origin_lng": 127.0276,
                 "transport_mode": "transit", "max_travel_min": 60},
                {"nickname": "이지은", "origin_lat": 37.5445, "origin_lng": 127.0557,
                 "transport_mode": "transit", "max_travel_min": 60}
              ],
              "place_types": ["cafe", "restaurant"],
              "datetime": "2026-08-14T19:00:00"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TravelTimeClient travelTimeClient;

    @BeforeEach
    void stubTravelTimes() {
        // 출발지별로 고정값을 준다. 후보는 참여자 전원이 조회돼야 살아남는다.
        when(travelTimeClient.travelMinutes(any(), any())).thenReturn(Optional.of(30));
        when(travelTimeClient.travelMinutes(eq(new GeoPoint(37.4979, 127.0276)), any())).thenReturn(Optional.of(33));
        when(travelTimeClient.travelMinutes(eq(new GeoPoint(37.5445, 127.0557)), any())).thenReturn(Optional.of(36));
    }

    @Test
    @DisplayName("성공 경로: 후보 3곳과 계약대로의 필드가 내려온다")
    void returnsThreeCandidates() throws Exception {
        mockMvc.perform(post("/recommendations").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates").isArray())
                .andExpect(jsonPath("$.candidates.length()").value(3))
                .andExpect(jsonPath("$.candidates[0].name").isNotEmpty())
                .andExpect(jsonPath("$.candidates[0].lat").isNumber())
                .andExpect(jsonPath("$.candidates[0].lng").isNumber())
                .andExpect(jsonPath("$.candidates[0].gap_minutes").value(6))
                .andExpect(jsonPath("$.candidates[0].travel_times.김보경").value(30))
                .andExpect(jsonPath("$.candidates[0].travel_times.송현석").value(33))
                .andExpect(jsonPath("$.candidates[0].travel_times.이지은").value(36));
    }

    @Test
    @DisplayName("한 명이라도 조회에 실패한 후보는 응답에서 빠진다")
    void dropsCandidatesMissingAnyParticipant() throws Exception {
        // 송현석이 전 후보에서 실패하면 살아남는 후보가 하나도 없다.
        when(travelTimeClient.travelMinutes(eq(new GeoPoint(37.4979, 127.0276)), any()))
                .thenReturn(Optional.empty());

        mockMvc.perform(post("/recommendations").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("recommendation_unavailable"));
    }

    @Test
    @DisplayName("모든 조회가 실패하면 502")
    void returnsBadGatewayWhenEverythingFails() throws Exception {
        when(travelTimeClient.travelMinutes(any(), any())).thenReturn(Optional.empty());

        mockMvc.perform(post("/recommendations").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("recommendation_unavailable"));
    }
}
