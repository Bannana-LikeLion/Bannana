package com.bannana.backend.weather.exception;

public class WeatherExternalApiException extends RuntimeException {
	private final Integer httpStatus;
	private final String resultCode;
	private final String resultMsg;

	public WeatherExternalApiException(String message) {
		this(message, null, null, null, null);
	}

	public WeatherExternalApiException(String message, Throwable cause) {
		this(message, cause, null, null, null);
	}

	public WeatherExternalApiException(String message, Integer httpStatus, String resultCode, String resultMsg) {
		this(message, null, httpStatus, resultCode, resultMsg);
	}

	public WeatherExternalApiException(String message, Throwable cause, Integer httpStatus, String resultCode,
		String resultMsg) {
		super(message, cause);
		this.httpStatus = httpStatus;
		this.resultCode = resultCode;
		this.resultMsg = resultMsg;
	}

	public Integer getHttpStatus() {
		return httpStatus;
	}

	public String getResultCode() {
		return resultCode;
	}

	public String getResultMsg() {
		return resultMsg;
	}
}
