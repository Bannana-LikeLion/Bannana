package com.bannana.backend.room.dto;

import java.util.List;

import com.bannana.backend.room.entity.RoomStatus;

public record RoomStatusResponse(
	Long roomId,
	String title,
	RoomStatus status,
	ParticipantResponse host,
	List<ParticipantResponse> participants,
	long joinedCount
) {
}
