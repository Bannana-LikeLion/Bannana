package com.bannana.backend.place.client;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;

import com.bannana.backend.place.config.KakaoLocalProperties;
import com.bannana.backend.place.dto.KakaoPlaceSearchResponse;
import com.bannana.backend.place.exception.PlaceExternalApiException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class KakaoLocalClient {

	private final HttpClient httpClient;
	private final ObjectMapper objectMapper;
	private final KakaoLocalProperties properties;

	@Autowired
	public KakaoLocalClient(HttpClient httpClient, KakaoLocalProperties properties) {
		this(httpClient, new ObjectMapper(), properties);
	}

	KakaoLocalClient(HttpClient httpClient, ObjectMapper objectMapper, KakaoLocalProperties properties) {
		this.httpClient = httpClient;
		this.objectMapper = objectMapper;
		this.properties = properties;
	}

	public KakaoPlaceSearchResponse searchNearby(String categoryGroupCode, double lat, double lng) {
		String restApiKey = properties.restApiKey();
		if (!StringUtils.hasText(restApiKey)) {
			throw new PlaceExternalApiException("Kakao REST API key is not configured.");
		}

		HttpRequest request = buildRequest(categoryGroupCode, restApiKey, lat, lng);

		try {
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
			int status = response.statusCode();
			String body = response.body();

			if (!HttpStatusCode.valueOf(status).is2xxSuccessful()) {
				throw new PlaceExternalApiException("Kakao Local API returned non-2xx status: " + status, status);
			}

			return objectMapper.readValue(body, KakaoPlaceSearchResponse.class);
		} catch (PlaceExternalApiException ex) {
			throw ex;
		} catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new PlaceExternalApiException("Failed to call Kakao Local API.", ex);
		} catch (Exception ex) {
			throw new PlaceExternalApiException("Failed to call Kakao Local API.", ex);
		}
	}

	HttpRequest buildRequest(String categoryGroupCode, String restApiKey, double lat, double lng) {
		return HttpRequest.newBuilder(buildRequestUri(categoryGroupCode, lat, lng))
			.timeout(Duration.ofSeconds(10))
			.header("Authorization", "KakaoAK " + restApiKey)
			.GET()
			.build();
	}

	URI buildRequestUri(String categoryGroupCode, double lat, double lng) {
		String query = "category_group_code=" + categoryGroupCode
			+ "&x=" + lng
			+ "&y=" + lat
			+ "&radius=" + properties.radius()
			+ "&size=" + properties.size()
			+ "&sort=distance";
		return URI.create("https://dapi.kakao.com/v2/local/search/category.json?" + query);
	}
}
