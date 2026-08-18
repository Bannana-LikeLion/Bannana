package com.bannana.backend.place.exception;

public class PlaceExternalApiException extends RuntimeException {

	private final Integer httpStatus;

	public PlaceExternalApiException(String message) {
		this(message, null, null);
	}

	public PlaceExternalApiException(String message, Throwable cause) {
		this(message, cause, null);
	}

	public PlaceExternalApiException(String message, Integer httpStatus) {
		this(message, null, httpStatus);
	}

	public PlaceExternalApiException(String message, Throwable cause, Integer httpStatus) {
		super(message, cause);
		this.httpStatus = httpStatus;
	}

	public Integer getHttpStatus() {
		return httpStatus;
	}
}
