package com.bannana.backend.recommendation.web;

import com.bannana.backend.recommendation.service.RecommendationService;
import com.bannana.backend.recommendation.web.dto.RecommendationRequest;
import com.bannana.backend.recommendation.web.dto.RecommendationResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** 이 서비스가 노출하는 유일한 엔드포인트. (방/날씨/장소는 별도 서비스 담당) */
@RestController
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping(path = "/recommendations",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public RecommendationResponse recommend(@Valid @RequestBody RecommendationRequest request) {
        return recommendationService.recommend(request);
    }
}
