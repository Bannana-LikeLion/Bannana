// src/utils/roomStorage.js

const ROOM_DRAFT_KEY = "bannana-room-draft";

const defaultRoomDraft = {
  title: "토요일 모임",
  meetingDate: "2026-08-22",
  meetingTime: "15:00",

  hostName: "박지수",
  hostOrigin: "수원역",

  preferredCategories: [
    "CAFE",
    "RESTAURANT",
  ],
};

export function saveRoomDraft(data) {
  const current = getRoomDraft();

  const nextData = {
    ...current,
    ...data,
  };

  localStorage.setItem(
    ROOM_DRAFT_KEY,
    JSON.stringify(nextData)
  );

  return nextData;
}

export function getRoomDraft() {
  try {
    const saved =
      localStorage.getItem(ROOM_DRAFT_KEY);

    if (!saved) {
      return defaultRoomDraft;
    }

    return {
      ...defaultRoomDraft,
      ...JSON.parse(saved),
    };
  } catch (error) {
    console.error(
      "약속방 데이터 읽기 실패:",
      error
    );

    return defaultRoomDraft;
  }
}

export function clearRoomDraft() {
  localStorage.removeItem(
    ROOM_DRAFT_KEY
  );
}