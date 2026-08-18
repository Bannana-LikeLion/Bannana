package com.bannana.backend.place.dto;

import java.util.List;

public record PlaceNearbyResponse(
	Center center,
	List<PlaceResponse> places
) {
	public record Center(
		Double lat,
		Double lng
	) {
	}
}
