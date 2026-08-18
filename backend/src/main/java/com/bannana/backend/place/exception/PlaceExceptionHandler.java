package com.bannana.backend.place.exception;

import java.time.LocalDateTime;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.bannana.backend.room.exception.ApiErrorResponse;

@RestControllerAdvice(basePackages = "com.bannana.backend.place")
public class PlaceExceptionHandler {

	@ExceptionHandler(UnsupportedPlaceTypeException.class)
	public ResponseEntity<ApiErrorResponse> handleUnsupportedPlaceType(UnsupportedPlaceTypeException ex,
		HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	@ExceptionHandler(PlaceExternalApiException.class)
	public ResponseEntity<ApiErrorResponse> handleExternalApi(PlaceExternalApiException ex, HttpServletRequest request) {
		return build(HttpStatus.BAD_GATEWAY, ex.getMessage(), request);
	}

	private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String message, HttpServletRequest request) {
		return ResponseEntity.status(status)
			.body(new ApiErrorResponse(
				status.value(),
				status.getReasonPhrase(),
				message,
				request.getRequestURI(),
				LocalDateTime.now()
			));
	}
}
