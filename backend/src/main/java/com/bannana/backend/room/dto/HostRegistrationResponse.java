package com.bannana.backend.room.dto;

public record HostRegistrationResponse(
	Long participantId,
	String inviteUrl
) {
}
