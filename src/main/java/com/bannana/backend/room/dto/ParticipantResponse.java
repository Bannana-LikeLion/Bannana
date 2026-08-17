package com.bannana.backend.room.dto;

import com.bannana.backend.room.entity.Participant;
import com.bannana.backend.room.entity.ParticipantRole;

public record ParticipantResponse(
	Long participantId,
	String name,
	String originText,
	ParticipantRole role
) {
	public static ParticipantResponse from(Participant participant) {
		return new ParticipantResponse(
			participant.getId(),
			participant.getName(),
			participant.getOriginText(),
			participant.getRole()
		);
	}
}
