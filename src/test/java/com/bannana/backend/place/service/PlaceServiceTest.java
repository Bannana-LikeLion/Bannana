package com.bannana.backend.place.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bannana.backend.place.client.KakaoLocalClient;
import com.bannana.backend.place.dto.KakaoPlaceSearchResponse;
import com.bannana.backend.place.dto.PlaceNearbyResponse;
import com.bannana.backend.place.exception.UnsupportedPlaceTypeException;

@ExtendWith(MockitoExtension.class)
class PlaceServiceTest {

	@Mock
	private KakaoLocalClient kakaoLocalClient;

	private PlaceService placeService;

	@BeforeEach
	void setUp() {
		placeService = new PlaceService(kakaoLocalClient);
	}

	@Test
	void getNearbyPlaces_mapsSupportedTypesToKakaoCategories() {
		when(kakaoLocalClient.searchNearby("CE7", 37.3248, 127.1240))
			.thenReturn(response(
				document("1", "Cafe", "Cafe category", "Cafe address", "Cafe road", "37.3248", "127.1240", "100", "010-0000-0001", "http://cafe")
			));
		when(kakaoLocalClient.searchNearby("FD6", 37.3248, 127.1240))
			.thenReturn(response(List.<KakaoPlaceSearchResponse.Document>of()));
		when(kakaoLocalClient.searchNearby("CT1", 37.3248, 127.1240))
			.thenReturn(response(List.<KakaoPlaceSearchResponse.Document>of()));

		placeService.getNearbyPlaces(37.3248, 127.1240, "CAFE,RESTAURANT,EXHIBITION");

		verify(kakaoLocalClient).searchNearby("CE7", 37.3248, 127.1240);
		verify(kakaoLocalClient).searchNearby("FD6", 37.3248, 127.1240);
		verify(kakaoLocalClient).searchNearby("CT1", 37.3248, 127.1240);
	}

	@Test
	void getNearbyPlaces_mergesDeduplicatesAndSortsByDistance() {
		when(kakaoLocalClient.searchNearby("CE7", 37.3248, 127.1240))
			.thenReturn(response(
				document("1", "Cafe A", "Cafe category", "Cafe address", "Cafe road", "37.3248", "127.1240", "300", "010-0000-0001", "http://cafe-a"),
				document("2", "Cafe B", "Cafe category", "Cafe address", "Cafe road", "37.3248", "127.1240", "100", "010-0000-0002", "http://cafe-b")
			));
		when(kakaoLocalClient.searchNearby("FD6", 37.3248, 127.1240))
			.thenReturn(response(
				document("1", "Cafe A duplicate", "Restaurant category", "Restaurant address", "Restaurant road", "37.3248", "127.1240", "300", "010-0000-0003", "http://cafe-a-dup"),
				document("3", "Restaurant A", "Restaurant category", "Restaurant address", "Restaurant road", "37.3248", "127.1240", "200", "010-0000-0004", "http://restaurant-a")
			));
		when(kakaoLocalClient.searchNearby("CT1", 37.3248, 127.1240))
			.thenReturn(response(List.<KakaoPlaceSearchResponse.Document>of()));

		PlaceNearbyResponse response = placeService.getNearbyPlaces(37.3248, 127.1240, "CAFE,RESTAURANT,EXHIBITION");

		assertThat(response.places()).extracting("id").containsExactly("2", "3", "1");
		assertThat(response.places()).extracting(place -> place.type().name()).containsExactly("CAFE", "RESTAURANT", "CAFE");
		assertThat(response.places()).extracting("distanceMeters").containsExactly(100L, 200L, 300L);
		assertThat(response.center().lat()).isEqualTo(37.3248);
		assertThat(response.center().lng()).isEqualTo(127.1240);
	}

	@Test
	void getNearbyPlaces_rejectsUnsupportedPlaceType() {
		assertThatThrownBy(() -> placeService.getNearbyPlaces(37.3248, 127.1240, "SHOPPING"))
			.isInstanceOf(UnsupportedPlaceTypeException.class)
			.hasMessage("Unsupported place type: SHOPPING");

		verifyNoInteractions(kakaoLocalClient);
	}

	@Test
	void getNearbyPlaces_rejectsOutOfRangeCoordinates() {
		assertThatThrownBy(() -> placeService.getNearbyPlaces(100.0, 127.1240, "CAFE"))
			.isInstanceOf(IllegalArgumentException.class)
			.hasMessage("lat must be between -90 and 90.");

		verifyNoInteractions(kakaoLocalClient);
	}

	@Test
	void getNearbyPlaces_rejectsBlankTypes() {
		assertThatThrownBy(() -> placeService.getNearbyPlaces(37.3248, 127.1240, "  "))
			.isInstanceOf(IllegalArgumentException.class)
			.hasMessage("types is required.");

		verifyNoInteractions(kakaoLocalClient);
	}

	private KakaoPlaceSearchResponse response(List<KakaoPlaceSearchResponse.Document> documents) {
		return new KakaoPlaceSearchResponse(documents);
	}

	private KakaoPlaceSearchResponse response(KakaoPlaceSearchResponse.Document... documents) {
		return new KakaoPlaceSearchResponse(List.of(documents));
	}

	private KakaoPlaceSearchResponse.Document document(
		String id,
		String placeName,
		String categoryName,
		String addressName,
		String roadAddressName,
		String lat,
		String lng,
		String distance,
		String phone,
		String placeUrl
	) {
		return new KakaoPlaceSearchResponse.Document(
			id,
			placeName,
			categoryName,
			addressName,
			roadAddressName,
			lat,
			lng,
			distance,
			phone,
			placeUrl
		);
	}
}
