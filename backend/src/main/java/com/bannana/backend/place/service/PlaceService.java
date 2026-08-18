package com.bannana.backend.place.service;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.bannana.backend.place.client.KakaoLocalClient;
import com.bannana.backend.place.dto.KakaoPlaceSearchResponse;
import com.bannana.backend.place.dto.PlaceNearbyResponse;
import com.bannana.backend.place.dto.PlaceResponse;
import com.bannana.backend.place.exception.UnsupportedPlaceTypeException;
import com.bannana.backend.room.entity.PlaceType;

@Service
public class PlaceService {

	private static final Set<PlaceType> SUPPORTED_PLACE_TYPES = EnumSet.of(
		PlaceType.CAFE,
		PlaceType.RESTAURANT,
		PlaceType.EXHIBITION
	);

	private final KakaoLocalClient kakaoLocalClient;

	public PlaceService(KakaoLocalClient kakaoLocalClient) {
		this.kakaoLocalClient = kakaoLocalClient;
	}

	public PlaceNearbyResponse getNearbyPlaces(Double lat, Double lng, String types) {
		validateCoordinates(lat, lng);
		List<PlaceType> requestedTypes = parseTypes(types);

		Map<String, PlaceResponse> placesById = new LinkedHashMap<>();
		for (PlaceType type : requestedTypes) {
			KakaoPlaceSearchResponse response = kakaoLocalClient.searchNearby(kakaoCategoryCode(type), lat, lng);
			for (KakaoPlaceSearchResponse.Document document : response.documents()) {
				PlaceResponse place = toPlaceResponse(document, type);
				placesById.putIfAbsent(place.id(), place);
			}
		}

		List<PlaceResponse> places = placesById.values()
			.stream()
			.sorted((left, right) -> Long.compare(left.distanceMeters(), right.distanceMeters()))
			.toList();

		return new PlaceNearbyResponse(new PlaceNearbyResponse.Center(lat, lng), places);
	}

	private void validateCoordinates(Double lat, Double lng) {
		if (lat == null) {
			throw new IllegalArgumentException("lat is required.");
		}
		if (lng == null) {
			throw new IllegalArgumentException("lng is required.");
		}
		if (lat < -90.0 || lat > 90.0) {
			throw new IllegalArgumentException("lat must be between -90 and 90.");
		}
		if (lng < -180.0 || lng > 180.0) {
			throw new IllegalArgumentException("lng must be between -180 and 180.");
		}
	}

	private List<PlaceType> parseTypes(String types) {
		if (!StringUtils.hasText(types)) {
			throw new IllegalArgumentException("types is required.");
		}

		List<PlaceType> requestedTypes = Arrays.stream(types.split(","))
			.map(String::trim)
			.filter(StringUtils::hasText)
			.map(this::parseSupportedPlaceType)
			.distinct()
			.toList();

		if (requestedTypes.isEmpty()) {
			throw new IllegalArgumentException("types is required.");
		}

		return requestedTypes;
	}

	private PlaceType parseSupportedPlaceType(String value) {
		PlaceType placeType = PlaceType.fromApiValue(value);
		if (!SUPPORTED_PLACE_TYPES.contains(placeType)) {
			throw new UnsupportedPlaceTypeException("Unsupported place type: " + value);
		}
		return placeType;
	}

	private String kakaoCategoryCode(PlaceType placeType) {
		return switch (placeType) {
			case CAFE -> "CE7";
			case RESTAURANT -> "FD6";
			case EXHIBITION -> "CT1";
			case SHOPPING, PARK -> throw new UnsupportedPlaceTypeException("Unsupported place type: " + placeType.name());
		};
	}

	private PlaceResponse toPlaceResponse(KakaoPlaceSearchResponse.Document document, PlaceType type) {
		return new PlaceResponse(
			requireText(document.id(), "id"),
			requireText(document.placeName(), "place_name"),
			type,
			requireText(document.categoryName(), "category_name"),
			document.addressName(),
			document.roadAddressName(),
			parseDouble(document.lat(), "y"),
			parseDouble(document.lng(), "x"),
			parseLong(document.distance(), "distance"),
			document.phone(),
			document.placeUrl()
		);
	}

	private String requireText(String value, String fieldName) {
		if (!StringUtils.hasText(value)) {
			throw new UnsupportedPlaceTypeException("Kakao Local API returned an invalid " + fieldName + " value.");
		}
		return value;
	}

	private Double parseDouble(String value, String fieldName) {
		try {
			return Double.parseDouble(requireText(value, fieldName));
		} catch (NumberFormatException ex) {
			throw new UnsupportedPlaceTypeException("Kakao Local API returned an invalid " + fieldName + " value.");
		}
	}

	private Long parseLong(String value, String fieldName) {
		try {
			return Long.parseLong(requireText(value, fieldName));
		} catch (NumberFormatException ex) {
			throw new UnsupportedPlaceTypeException("Kakao Local API returned an invalid " + fieldName + " value.");
		}
	}
}
