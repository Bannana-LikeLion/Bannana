package com.bannana.backend.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.bannana.backend.room.dto.ParticipantCreateRequest;
import com.bannana.backend.room.entity.PlaceType;
import com.bannana.backend.room.entity.Room;
import com.bannana.backend.room.entity.TransportMode;
import com.bannana.backend.room.exception.BadRequestException;
import com.bannana.backend.room.repository.ParticipantRepository;
import com.bannana.backend.room.repository.RoomRepository;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

	@Mock
	private RoomRepository roomRepository;

	@Mock
	private ParticipantRepository participantRepository;

	private RoomService roomService;

	@BeforeEach
	void setUp() {
		roomService = new RoomService(roomRepository, participantRepository, "http://localhost:5173/invite");
	}

	@Test
	void createParticipant_throwsWhenRoomIsFull() {
		Room room = new Room(
			"test room",
			LocalDate.of(2026, 8, 18),
			LocalTime.of(19, 0),
			TransportMode.TRANSIT,
			List.of(PlaceType.CAFE)
		);
		when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
		when(participantRepository.countByRoomId(1L)).thenReturn(6L);

		BadRequestException ex = assertThrows(BadRequestException.class, () ->
			roomService.createParticipant(1L, new ParticipantCreateRequest("name", "origin", null, null))
		);

		assertEquals("Participant limit exceeded. Maximum is 6.", ex.getMessage());
		verify(participantRepository, never()).save(any());
	}

	@Test
	void registerHost_throwsWhenRoomIsFull() {
		Room room = new Room(
			"test room",
			LocalDate.of(2026, 8, 18),
			LocalTime.of(19, 0),
			TransportMode.TRANSIT,
			List.of(PlaceType.CAFE)
		);
		when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
		when(participantRepository.countByRoomId(1L)).thenReturn(6L);

		BadRequestException ex = assertThrows(BadRequestException.class, () ->
			roomService.registerHost(1L, new ParticipantCreateRequest("name", "origin", null, null))
		);

		assertEquals("Participant limit exceeded. Maximum is 6.", ex.getMessage());
		verify(participantRepository, never()).save(any());
	}
}
