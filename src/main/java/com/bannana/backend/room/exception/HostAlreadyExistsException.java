package com.bannana.backend.room.exception;

public class HostAlreadyExistsException extends RuntimeException {
	public HostAlreadyExistsException(Long roomId) {
		super("Host already exists in room: " + roomId);
	}
}
