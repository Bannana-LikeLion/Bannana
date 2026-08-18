package com.bannana.backend.room.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "rooms")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Room {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	@Column(name = "meeting_date", nullable = false)
	private LocalDate meetingDate;

	@Column(name = "meeting_time", nullable = false)
	private LocalTime meetingTime;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TransportMode transportMode;

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "room_place_types", joinColumns = @JoinColumn(name = "room_id"))
	@Enumerated(EnumType.STRING)
	@Column(name = "place_type", nullable = false)
	private Set<PlaceType> placeTypes = new LinkedHashSet<>();

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private RoomStatus status;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "final_place_name")
	private String finalPlaceName;

	@Column(name = "final_place_lat")
	private Double finalPlaceLat;

	@Column(name = "final_place_lng")
	private Double finalPlaceLng;

	public Room(String title, LocalDate meetingDate, LocalTime meetingTime, TransportMode transportMode,
		Collection<PlaceType> placeTypes) {
		this.title = title;
		this.meetingDate = meetingDate;
		this.meetingTime = meetingTime;
		this.transportMode = transportMode;
		this.placeTypes = new LinkedHashSet<>(placeTypes);
		this.status = RoomStatus.OPEN;
	}

	@PrePersist
	void prePersist() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
		if (status == null) {
			status = RoomStatus.OPEN;
		}
	}

	public List<PlaceType> getPlaceTypesAsList() {
		return new ArrayList<>(placeTypes);
	}

	public void markFinalPlace(String placeName, Double lat, Double lng) {
	this.finalPlaceName = placeName;
	this.finalPlaceLat = lat;
	this.finalPlaceLng = lng;
	}
}
