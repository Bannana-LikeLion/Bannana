package com.bannana.backend.place.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KakaoPlaceSearchResponse(
	@JsonProperty("documents") List<Document> documents
) {
	public List<Document> documents() {
		return documents == null ? List.of() : documents;
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Document(
		@JsonProperty("id") String id,
		@JsonProperty("place_name") String placeName,
		@JsonProperty("category_name") String categoryName,
		@JsonProperty("address_name") String addressName,
		@JsonProperty("road_address_name") String roadAddressName,
		@JsonProperty("y") String lat,
		@JsonProperty("x") String lng,
		@JsonProperty("distance") String distance,
		@JsonProperty("phone") String phone,
		@JsonProperty("place_url") String placeUrl
	) {
	}
}
