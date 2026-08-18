package com.bannana.backend.room.exception;

public class RoomNotFoundException extends RuntimeException {
	public RoomNotFoundException(Long roomId) {
		super("Room not found: " + roomId);
	}
}
