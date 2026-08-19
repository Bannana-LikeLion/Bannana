package com.bannana.backend.room.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bannana.backend.room.entity.Participant;
import com.bannana.backend.room.entity.ParticipantRole;

public interface ParticipantRepository extends JpaRepository<Participant, Long> {

	boolean existsByRoomIdAndRole(Long roomId, ParticipantRole role);

	Optional<Participant> findByIdAndRoomId(Long participantId, Long roomId);

	List<Participant> findAllByRoomIdAndRoleOrderBySubmittedAtAsc(Long roomId, ParticipantRole role);

	long countByRoomId(Long roomId);

	List<Participant> findAllByRoomIdOrderBySubmittedAtAsc(Long roomId);
}
