package com.bannana.backend.room.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bannana.backend.room.dto.CreateRoomRequest;
import com.bannana.backend.room.dto.HostRegistrationResponse;
import com.bannana.backend.room.dto.ParticipantCreateRequest;
import com.bannana.backend.room.dto.ParticipantResponse;
import com.bannana.backend.room.dto.ParticipantUpdateOriginRequest;
import com.bannana.backend.room.dto.RoomResponse;
import com.bannana.backend.room.dto.RoomStatusResponse;
import com.bannana.backend.room.entity.Participant;
import com.bannana.backend.room.entity.ParticipantRole;
import com.bannana.backend.room.entity.PlaceType;
import com.bannana.backend.room.entity.Room;
import com.bannana.backend.room.entity.RoomStatus;
import com.bannana.backend.room.entity.TransportMode;
import com.bannana.backend.room.exception.HostAlreadyExistsException;
import com.bannana.backend.room.exception.BadRequestException;
import com.bannana.backend.room.exception.ParticipantNotFoundException;
import com.bannana.backend.room.exception.RoomNotFoundException;
import com.bannana.backend.room.repository.ParticipantRepository;
import com.bannana.backend.room.repository.RoomRepository;
import com.bannana.backend.room.dto.FinalPlaceRequest;
import com.bannana.backend.recommendation.client.OdsayClient;
import com.bannana.backend.recommendation.domain.GeoPoint;

@Service
public class RoomService {

	private static final long MAX_PARTICIPANT_COUNT = 6L;

	private final RoomRepository roomRepository;
	private final ParticipantRepository participantRepository;
	private final String inviteBaseUrl;
	private final OdsayClient odsayClient;


	public RoomService(
		RoomRepository roomRepository,
		ParticipantRepository participantRepository,
		OdsayClient odsayClient,
		@Value("${app.invite-base-url:http://localhost:5173/invite}") String inviteBaseUrl
	) {
		this.roomRepository = roomRepository;
		this.participantRepository = participantRepository;
		this.odsayClient = odsayClient;
		this.inviteBaseUrl = inviteBaseUrl;
	}

	@Transactional
	public RoomResponse createRoom(CreateRoomRequest request) {
		Room room = new Room(
			request.title(),
			request.meetingDate(),
			request.meetingTime(),
			TransportMode.fromApiValue(request.transportMode()),
			request.placeTypes().stream()
				.map(PlaceType::fromApiValue)
				.toList()
		);

		Room saved = roomRepository.save(room);
		return RoomResponse.from(saved);
	}

	@Transactional
	public HostRegistrationResponse registerHost(Long roomId, ParticipantCreateRequest request) {
		Room room = findRoom(roomId);
		assertRoomCapacity(roomId);

		if (participantRepository.existsByRoomIdAndRole(roomId, ParticipantRole.HOST)) {
			throw new HostAlreadyExistsException(roomId);
		}

		Participant host = new Participant(
			room,
			request.name(),
			request.originText(),
			request.originLat(),
			request.originLng(),
			ParticipantRole.HOST
		);

		Participant saved = participantRepository.save(host);
		return new HostRegistrationResponse(saved.getId(), buildInviteUrl(roomId));
	}

	@Transactional
	public ParticipantResponse createParticipant(Long roomId, ParticipantCreateRequest request) {
		Room room = findRoom(roomId);
		assertRoomCapacity(roomId);

		Participant participant = new Participant(
			room,
			request.name(),
			request.originText(),
			request.originLat(),
			request.originLng(),
			ParticipantRole.PARTICIPANT
		);
		Participant saved = participantRepository.save(participant);
		return ParticipantResponse.from(saved);
	}

	@Transactional
	public ParticipantResponse updateParticipantOrigin(Long roomId, Long participantId,
		ParticipantUpdateOriginRequest request) {
		findRoom(roomId);

		Participant participant = participantRepository.findById(participantId)
			.orElseThrow(() -> new ParticipantNotFoundException(participantId));

		if (!participant.getRoom().getId().equals(roomId)) {
			throw new ParticipantNotFoundException(participantId);
		}

		participant.updateOrigin(request.originText(), request.originLat(), request.originLng());
		return ParticipantResponse.from(participant);
	}

	@Transactional(readOnly = true)
	public RoomStatusResponse getRoomStatus(Long roomId) {
		Room room = findRoom(roomId);

		List<Participant> hosts = participantRepository.findAllByRoomIdAndRoleOrderBySubmittedAtAsc(
			roomId,
			ParticipantRole.HOST
		);
		ParticipantResponse hostResponse = hosts.isEmpty() ? null : ParticipantResponse.from(hosts.getFirst());

		List<ParticipantResponse> participantResponses = participantRepository
			.findAllByRoomIdAndRoleOrderBySubmittedAtAsc(roomId, ParticipantRole.PARTICIPANT)
			.stream()
			.map(ParticipantResponse::from)
			.toList();

		long joinedCount = participantRepository.countByRoomId(roomId);

		RoomStatusResponse.FinalPlace finalPlace = room.getFinalPlaceName() == null
		? null
		: new RoomStatusResponse.FinalPlace(room.getFinalPlaceName(), room.getFinalPlaceLat(), room.getFinalPlaceLng());
		return new RoomStatusResponse(
			room.getId(),
			room.getTitle(),
			room.getMeetingDate(),
			room.getMeetingTime(),
			room.getPlaceTypesAsList(),
			room.getStatus(),
			hostResponse,
			participantResponses,
			joinedCount,
			finalPlace
		);
	}

	private Room findRoom(Long roomId) {
		return roomRepository.findById(roomId)
			.orElseThrow(() -> new RoomNotFoundException(roomId));
	}

	private String buildInviteUrl(Long roomId) {
		return inviteBaseUrl + "/" + roomId;
	}

	private void assertRoomCapacity(Long roomId) {
		if (participantRepository.countByRoomId(roomId) >= MAX_PARTICIPANT_COUNT) {
			throw new BadRequestException("Participant limit exceeded. Maximum is 6.");
		}
	}

	@Transactional
	public void setFinalPlace(Long roomId, FinalPlaceRequest request) {
	Room room = findRoom(roomId);
	room.markFinalPlace(request.placeName(), request.lat(), request.lng());
	roomRepository.save(room);

	GeoPoint destination = new GeoPoint(request.lat(), request.lng());
	List<Participant> all = participantRepository.findAllByRoomIdOrderBySubmittedAtAsc(roomId);
	for (Participant participant : all) {
		if (participant.getOriginLat() == null || participant.getOriginLng() == null) {
			continue;
		}
		GeoPoint origin = new GeoPoint(participant.getOriginLat(), participant.getOriginLng());
		odsayClient.travelMinutes(origin, destination)
			.ifPresent(participant::updateTravelMinutes);
		}
	}
}
