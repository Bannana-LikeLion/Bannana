package com.bannana.backend.room.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.bannana.backend.room.entity.PlaceType;
import com.bannana.backend.room.entity.RoomStatus;

public record RoomStatusResponse(
	Long roomId,
	String title,
	LocalDate meetingDate,
	LocalTime meetingTime,
	List<PlaceType> placeTypes,
	RoomStatus status,
	ParticipantResponse host,
	List<ParticipantResponse> participants,
	long joinedCount,
	FinalPlace finalPlace
) {
	public record FinalPlace(String placeName, Double lat, Double lng) {
	}
}