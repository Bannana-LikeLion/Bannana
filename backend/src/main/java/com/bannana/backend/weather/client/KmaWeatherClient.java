package com.bannana.backend.weather.client;

import java.net.URLEncoder;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.bannana.backend.weather.client.dto.KmaWeatherApiResponse;
import com.bannana.backend.weather.config.KmaWeatherProperties;
import com.bannana.backend.weather.exception.WeatherExternalApiException;

@Component
public class KmaWeatherClient {

	private final HttpClient httpClient;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final KmaWeatherProperties properties;

	public KmaWeatherClient(KmaWeatherProperties properties) {
		this.httpClient = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(10))
			.build();
		this.properties = properties;
	}

	public KmaWeatherApiResponse getVilageFcst(String baseDate, String baseTime, int nx, int ny) {
		String serviceKey = normalizeServiceKey(properties.serviceKey());
		if (!StringUtils.hasText(serviceKey)) {
			throw new WeatherExternalApiException("KMA service key is not configured.");
		}

		URI uri = buildRequestUri(serviceKey, baseDate, baseTime, nx, ny);

		try {
			HttpRequest request = HttpRequest.newBuilder(uri)
				.timeout(Duration.ofSeconds(10))
				.GET()
				.build();

			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
			int status = response.statusCode();
			String body = response.body();

			if (!HttpStatusCode.valueOf(status).is2xxSuccessful()) {
				throw createExternalApiException(status, body, "KMA weather API returned non-2xx status.");
			}

			KmaWeatherApiResponse parsed = parseJsonResponse(body);
			if (parsed == null) {
				KmaErrorInfo errorInfo = parseErrorInfo(body);
				if (errorInfo != null) {
					throw new WeatherExternalApiException(
						"KMA weather API returned an error.",
						status,
						errorInfo.resultCode(),
						errorInfo.resultMsg()
					);
				}
				throw new WeatherExternalApiException("KMA weather API returned an unparseable response.", status, null, null);
			}
			if (!parsed.isSuccessful()) {
				throw new WeatherExternalApiException(
					"KMA weather API returned an error.",
					status,
					parsed.resultCode(),
					parsed.resultMsg()
				);
			}
			return parsed;
		} catch (WeatherExternalApiException ex) {
			throw ex;
		} catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new WeatherExternalApiException("Failed to call KMA weather API.", ex);
		} catch (Exception ex) {
			throw new WeatherExternalApiException("Failed to call KMA weather API.", ex);
		}
	}

	URI buildRequestUri(String serviceKey, String baseDate, String baseTime, int nx, int ny) {
		String query = "ServiceKey=" + serviceKey
			+ "&pageNo=" + properties.pageNo()
			+ "&numOfRows=" + properties.numOfRows()
			+ "&dataType=" + properties.dataType()
			+ "&base_date=" + baseDate
			+ "&base_time=" + baseTime
			+ "&nx=" + nx
			+ "&ny=" + ny;

		String baseUrl = properties.baseUrl().endsWith("/")
			? properties.baseUrl().substring(0, properties.baseUrl().length() - 1)
			: properties.baseUrl();
		return URI.create(baseUrl + "/getVilageFcst?" + query);
	}

	private String normalizeServiceKey(String serviceKey) {
		if (!StringUtils.hasText(serviceKey)) {
			return null;
		}
		return serviceKey.contains("%")
			? serviceKey
			: URLEncoder.encode(serviceKey, StandardCharsets.UTF_8);
	}

	private KmaWeatherApiResponse parseJsonResponse(String body) {
		try {
			return objectMapper.readValue(body, KmaWeatherApiResponse.class);
		} catch (Exception ex) {
			return null;
		}
	}

	private WeatherExternalApiException createExternalApiException(int httpStatus, String body, String defaultMessage) {
		KmaErrorInfo errorInfo = parseErrorInfo(body);
		String message = defaultMessage;
		if (errorInfo != null) {
			message = defaultMessage
				+ " httpStatus=" + httpStatus
				+ ", resultCode=" + errorInfo.resultCode()
				+ ", resultMsg=" + errorInfo.resultMsg();
		} else {
			message = defaultMessage + " httpStatus=" + httpStatus;
		}
		return new WeatherExternalApiException(message, httpStatus,
			errorInfo == null ? null : errorInfo.resultCode(),
			errorInfo == null ? null : errorInfo.resultMsg());
	}

	private KmaErrorInfo parseErrorInfo(String body) {
		if (body == null || body.isBlank()) {
			return null;
		}

		String trimmed = body.trim();
		try {
			if (trimmed.startsWith("<")) {
				return parseXmlErrorInfo(trimmed);
			}

			JsonNode root = objectMapper.readTree(trimmed);
			JsonNode response = root.path("response");
			JsonNode header = response.path("header");
			if (!header.isMissingNode()) {
				String resultCode = header.path("resultCode").asText(null);
				String resultMsg = header.path("resultMsg").asText(null);
				if (StringUtils.hasText(resultCode) || StringUtils.hasText(resultMsg)) {
					return new KmaErrorInfo(resultCode, resultMsg);
				}
			}
		} catch (Exception ignored) {
			// Fall through to null.
		}
		return null;
	}

	private KmaErrorInfo parseXmlErrorInfo(String xml) {
		try {
			var factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
			var builder = factory.newDocumentBuilder();
			var document = builder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xml)));
			String resultCode = textContent(document, "resultCode");
			String resultMsg = textContent(document, "resultMsg");
			if (StringUtils.hasText(resultCode) || StringUtils.hasText(resultMsg)) {
				return new KmaErrorInfo(resultCode, resultMsg);
			}
		} catch (Exception ignored) {
			// Fall through to null.
		}
		return null;
	}

	private String textContent(org.w3c.dom.Document document, String tagName) {
		var nodes = document.getElementsByTagName(tagName);
		if (nodes == null || nodes.getLength() == 0 || nodes.item(0) == null) {
			return null;
		}
		return nodes.item(0).getTextContent();
	}

	private record KmaErrorInfo(String resultCode, String resultMsg) {
	}
}
