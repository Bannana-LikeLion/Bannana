package com.bannana.backend.room.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "participants")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Participant {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "room_id", nullable = false)
	private Room room;

	@Column(nullable = false)
	private String name;

	@Column(name = "origin_text", nullable = false)
	private String originText;

	@Column(name = "origin_lat")
	private Double originLat;

	@Column(name = "origin_lng")
	private Double originLng;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ParticipantRole role;

	@Column(nullable = false, updatable = false)
	private LocalDateTime submittedAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@Column(name = "travel_minutes")
	private Integer travelMinutes;

	public Participant(Room room, String name, String originText, Double originLat, Double originLng,
		ParticipantRole role) {
		this.room = room;
		this.name = name;
		this.originText = originText;
		this.originLat = originLat;
		this.originLng = originLng;
		this.role = role;
	}

	@PrePersist
	void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		if (submittedAt == null) {
			submittedAt = now;
		}
		updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		updatedAt = LocalDateTime.now();
	}

	public void updateOrigin(String originText, Double originLat, Double originLng) {
		this.originText = originText;
		this.originLat = originLat;
		this.originLng = originLng;
	}

	public void updateTravelMinutes(Integer travelMinutes) {
	this.travelMinutes = travelMinutes;
	}
}
