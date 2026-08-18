package com.bannana.backend.recommendation.web;

import com.bannana.backend.recommendation.service.RecommendationUnavailableException;
import com.bannana.backend.recommendation.web.dto.ErrorResponse;
import java.util.Locale;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 추천 API 전용 예외 처리. 패키지를 한정하고 우선순위를 최상위로 둬서,
 * room/weather/place를 담당하는 {@code GlobalExceptionHandler}와 겹치는 예외 타입
 * (검증 실패, 본문 파싱 실패 등)에 대해 /recommendations의 응답 계약이 그대로 유지되게 한다.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "com.bannana.backend.recommendation")
public class RecommendationExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RecommendationExceptionHandler.class);

    /** 외부 API에 기대어 후보를 만들 수 없는 경우 — 명세대로 502. */
    @ExceptionHandler(RecommendationUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleUnavailable(RecommendationUnavailableException e) {
        log.warn("추천 생성 실패: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ErrorResponse("recommendation_unavailable", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .distinct()
                .collect(Collectors.joining(" "));
        if (message.isBlank()) {
            message = "요청 형식이 올바르지 않습니다.";
        }
        return ResponseEntity.badRequest().body(new ErrorResponse("invalid_request", message));
    }

    /** 본문이 JSON이 아니거나 인코딩이 깨진 경우 등 — 서버 잘못이 아니므로 400. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(HttpMessageNotReadableException e) {
        log.warn("요청 본문을 읽지 못했습니다: {}", e.getMessage());
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("invalid_request", "요청 본문을 읽을 수 없습니다. UTF-8 JSON인지 확인해 주세요."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse("invalid_request", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        // 405, 404, 415 같은 스프링 표준 웹 예외는 자기 상태코드를 알고 있다.
        // 여기서 뭉뚱그려 500으로 내보내면 프론트가 원인을 구분할 수 없어서 상태코드를 살려준다.
        if (e instanceof org.springframework.web.ErrorResponse errorResponse) {
            HttpStatus status = HttpStatus.valueOf(errorResponse.getStatusCode().value());
            return ResponseEntity.status(status)
                    .body(new ErrorResponse(status.name().toLowerCase(Locale.ROOT), e.getMessage()));
        }

        log.error("처리되지 않은 오류", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("internal_error", "요청을 처리하지 못했습니다."));
    }
}
