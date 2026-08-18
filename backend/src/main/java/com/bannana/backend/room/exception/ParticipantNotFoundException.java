package com.bannana.backend.room.exception;

public class ParticipantNotFoundException extends RuntimeException {
	public ParticipantNotFoundException(Long participantId) {
		super("Participant not found: " + participantId);
	}
}
