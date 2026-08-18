package com.bannana.backend.room.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bannana.backend.room.dto.CreateRoomRequest;
import com.bannana.backend.room.dto.FinalPlaceRequest;
import com.bannana.backend.room.dto.HostRegistrationResponse;
import com.bannana.backend.room.dto.ParticipantCreateRequest;
import com.bannana.backend.room.dto.ParticipantResponse;
import com.bannana.backend.room.dto.ParticipantUpdateOriginRequest;
import com.bannana.backend.room.dto.RoomResponse;
import com.bannana.backend.room.dto.RoomStatusResponse;
import com.bannana.backend.room.service.RoomService;
import com.bannana.backend.room.dto.FinalPlaceRequest;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/rooms")
public class RoomController {

	private final RoomService roomService;

	public RoomController(RoomService roomService) {
		this.roomService = roomService;
	}

	@PostMapping
	public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request) {
		RoomResponse response = roomService.createRoom(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PostMapping("/{roomId}/host")
	public ResponseEntity<HostRegistrationResponse> registerHost(@PathVariable Long roomId,
		@Valid @RequestBody ParticipantCreateRequest request) {
		HostRegistrationResponse response = roomService.registerHost(roomId, request);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/{roomId}/participants")
	public ResponseEntity<ParticipantResponse> createParticipant(@PathVariable Long roomId,
		@Valid @RequestBody ParticipantCreateRequest request) {
		ParticipantResponse response = roomService.createParticipant(roomId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PatchMapping("/{roomId}/participants/{participantId}")
	public ResponseEntity<ParticipantResponse> updateParticipantOrigin(@PathVariable Long roomId,
		@PathVariable Long participantId, @Valid @RequestBody ParticipantUpdateOriginRequest request) {
		ParticipantResponse response = roomService.updateParticipantOrigin(roomId, participantId, request);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{roomId}/status")
	public ResponseEntity<RoomStatusResponse> getRoomStatus(@PathVariable Long roomId) {
		return ResponseEntity.ok(roomService.getRoomStatus(roomId));
	}

	@PostMapping("/{roomId}/final-place")
	public ResponseEntity<Void> setFinalPlace(@PathVariable Long roomId,
		@Valid @RequestBody FinalPlaceRequest request) {
		roomService.setFinalPlace(roomId, request);
		return ResponseEntity.ok().build();
	}
}
