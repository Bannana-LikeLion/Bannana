package com.bannana.backend.room.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import com.bannana.backend.room.entity.Participant;
import com.bannana.backend.room.entity.ParticipantRole;

public record ParticipantResponse(
	@JsonProperty("participant_id") Long participantId,
	@JsonProperty("nickname") String name,
	@JsonProperty("origin_text") String originText,
	@JsonProperty("origin_lat") Double originLat,
	@JsonProperty("origin_lng") Double originLng,
	@JsonProperty("role") ParticipantRole role
) {
	public static ParticipantResponse from(Participant participant) {
		return new ParticipantResponse(
			participant.getId(),
			participant.getName(),
			participant.getOriginText(),
			participant.getOriginLat(),
			participant.getOriginLng(),
			participant.getRole()
		);
	}
}
