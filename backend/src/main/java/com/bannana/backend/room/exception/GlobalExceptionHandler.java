package com.bannana.backend.room.exception;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.bannana.backend.weather.exception.WeatherBadRequestException;
import com.bannana.backend.weather.exception.WeatherExternalApiException;
import com.bannana.backend.weather.exception.WeatherForecastNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(RoomNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleRoomNotFound(RoomNotFoundException ex, HttpServletRequest request) {
		return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
	}

	@ExceptionHandler(ParticipantNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleParticipantNotFound(ParticipantNotFoundException ex,
		HttpServletRequest request) {
		return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
	}

	@ExceptionHandler(HostAlreadyExistsException.class)
	public ResponseEntity<ApiErrorResponse> handleHostAlreadyExists(HostAlreadyExistsException ex,
		HttpServletRequest request) {
		return build(HttpStatus.CONFLICT, ex.getMessage(), request);
	}

	@ExceptionHandler(WeatherForecastNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleWeatherForecastNotFound(WeatherForecastNotFoundException ex,
		HttpServletRequest request) {
		return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
	}

	@ExceptionHandler(WeatherExternalApiException.class)
	public ResponseEntity<ApiErrorResponse> handleWeatherExternalApi(WeatherExternalApiException ex,
		HttpServletRequest request) {
		return build(HttpStatus.BAD_GATEWAY, ex.getMessage(), request);
	}

	@ExceptionHandler(WeatherBadRequestException.class)
	public ResponseEntity<ApiErrorResponse> handleWeatherBadRequest(WeatherBadRequestException ex,
		HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<ApiErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex,
		HttpServletRequest request) {
		String message = ex.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
			.collect(Collectors.joining(", "));
		return build(HttpStatus.BAD_REQUEST, message, request);
	}

	@ExceptionHandler({
		MissingServletRequestParameterException.class,
		HttpMessageNotReadableException.class,
		MethodArgumentTypeMismatchException.class,
		ConstraintViolationException.class,
		IllegalArgumentException.class
	})
	public ResponseEntity<ApiErrorResponse> handleBadPayload(Exception ex, HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
		return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error", request);
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
