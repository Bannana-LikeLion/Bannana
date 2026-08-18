package com.bannana.backend.room.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import com.bannana.backend.room.entity.PlaceType;
import com.bannana.backend.room.entity.Room;
import com.bannana.backend.room.entity.RoomStatus;
import com.bannana.backend.room.entity.TransportMode;

public record RoomResponse(
	Long roomId,
	String title,
	LocalDate meetingDate,
	LocalTime meetingTime,
	TransportMode transportMode,
	List<PlaceType> placeTypes,
	RoomStatus status,
	LocalDateTime createdAt
) {
	public static RoomResponse from(Room room) {
		return new RoomResponse(
			room.getId(),
			room.getTitle(),
			room.getMeetingDate(),
			room.getMeetingTime(),
			room.getTransportMode(),
			room.getPlaceTypesAsList(),
			room.getStatus(),
			room.getCreatedAt()
		);
	}
}
