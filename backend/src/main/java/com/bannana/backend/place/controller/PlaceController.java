package com.bannana.backend.place.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bannana.backend.place.dto.PlaceNearbyResponse;
import com.bannana.backend.place.service.PlaceService;

@RestController
@RequestMapping("/places")
public class PlaceController {

	private final PlaceService placeService;

	public PlaceController(PlaceService placeService) {
		this.placeService = placeService;
	}

	@GetMapping("/nearby")
	public ResponseEntity<PlaceNearbyResponse> getNearbyPlaces(
		@RequestParam Double lat,
		@RequestParam Double lng,
		@RequestParam String types
	) {
		return ResponseEntity.ok(placeService.getNearbyPlaces(lat, lng, types));
	}
}
