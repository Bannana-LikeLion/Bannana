package com.bannana.backend.place.dto;

import com.bannana.backend.room.entity.PlaceType;

public record PlaceResponse(
	String id,
	String name,
	PlaceType type,
	String categoryName,
	String address,
	String roadAddress,
	Double lat,
	Double lng,
	Long distanceMeters,
	String phone,
	String placeUrl
) {
}
