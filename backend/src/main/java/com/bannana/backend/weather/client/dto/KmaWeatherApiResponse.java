package com.bannana.backend.weather.client.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KmaWeatherApiResponse(Response response) {

	public boolean isSuccessful() {
		return response != null && response.header != null && "00".equals(response.header.resultCode());
	}

	public String resultCode() {
		return response == null || response.header == null ? null : response.header.resultCode();
	}

	public String resultMsg() {
		return response == null || response.header == null ? null : response.header.resultMsg();
	}

	public List<Item> items() {
		if (response == null || response.body == null || response.body.items == null || response.body.items.item == null) {
			return List.of();
		}
		return response.body.items.item;
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Response(Header header, Body body) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Header(String resultCode, String resultMsg) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Body(String dataType, Items items, int pageNo, int numOfRows, int totalCount) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Items(
		@JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY) List<Item> item
	) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Item(
		String baseDate,
		String baseTime,
		String category,
		String fcstDate,
		String fcstTime,
		String fcstValue,
		Integer nx,
		Integer ny
	) {
	}
}
