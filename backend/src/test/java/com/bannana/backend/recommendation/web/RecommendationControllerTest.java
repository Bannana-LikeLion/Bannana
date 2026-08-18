package com.bannana.backend.recommendation.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bannana.backend.recommendation.service.RecommendationService;
import com.bannana.backend.recommendation.service.RecommendationUnavailableException;
import com.bannana.backend.recommendation.web.dto.CandidateDto;
import com.bannana.backend.recommendation.web.dto.RecommendationResponse;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** 프론트와 합의된 요청/응답 스키마(snake_case 포함)를 고정하는 테스트. */
@WebMvcTest(RecommendationController.class)
class RecommendationControllerTest {

    private static final String VALID_BODY = """
            {
              "participants": [
                {"nickname": "김보경", "origin_lat": 37.5665, "origin_lng": 126.9780,
                 "transport_mode": "transit", "max_travel_min": 40}
              ],
              "place_types": ["cafe", "restaurant"],
              "datetime": "2026-08-14T19:00:00"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecommendationService recommendationService;

    @Test
    @DisplayName("성공 응답은 계약대로 candidates/travel_times/gap_minutes를 담는다")
    void returnsContractShape() throws Exception {
        Map<String, Integer> travelTimes = new LinkedHashMap<>();
        travelTimes.put("김보경", 34);
        travelTimes.put("송현석", 37);
        travelTimes.put("이지은", 39);

        when(recommendationService.recommend(any())).thenReturn(new RecommendationResponse(
                List.of(new CandidateDto("성수역", 37.5446, 127.0559, travelTimes, 5))));

        mockMvc.perform(post("/recommendations").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates[0].name").value("성수역"))
                .andExpect(jsonPath("$.candidates[0].lat").value(37.5446))
                .andExpect(jsonPath("$.candidates[0].lng").value(127.0559))
                .andExpect(jsonPath("$.candidates[0].travel_times.김보경").value(34))
                .andExpect(jsonPath("$.candidates[0].gap_minutes").value(5));
    }

    @Test
    @DisplayName("추천을 만들 수 없으면 502와 에러 메시지를 내려준다")
    void returnsBadGatewayWhenUnavailable() throws Exception {
        when(recommendationService.recommend(any()))
                .thenThrow(new RecommendationUnavailableException("모든 후보의 대중교통 이동시간 조회에 실패했습니다."));

        mockMvc.perform(post("/recommendations").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("recommendation_unavailable"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("participants가 비면 400")
    void rejectsEmptyParticipants() throws Exception {
        String body = """
                {"participants": [], "place_types": [], "datetime": "2026-08-14T19:00:00"}
                """;

        mockMvc.perform(post("/recommendations").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_request"));
    }

    @Test
    @DisplayName("좌표가 빠지면 400")
    void rejectsMissingCoordinates() throws Exception {
        String body = """
                {"participants": [{"nickname": "김보경", "transport_mode": "transit"}]}
                """;

        mockMvc.perform(post("/recommendations").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_request"));
    }
}
