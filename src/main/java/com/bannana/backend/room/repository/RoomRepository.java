package com.bannana.backend.room.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bannana.backend.room.entity.Room;

public interface RoomRepository extends JpaRepository<Room, Long> {
}
