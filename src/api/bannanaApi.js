const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

/* =====================================================
   COMMON REQUEST
===================================================== */

async function request(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        ...options.headers,
      },
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    );

  let data = null;

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    data =
      await response.json();
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `API 요청에 실패했습니다. (${response.status})`;

    const error =
      new Error(message);

    error.status =
      response.status;

    error.data =
      data;

    throw error;
  }

  return data;
}

/* =====================================================
   1. ROOM CREATE

   POST /rooms
===================================================== */

export function createRoom({
  title,
  meetingDate,
  meetingTime,
  transportMode =
    "transit",
  placeTypes,
}) {
  return request(
    "/rooms",
    {
      method: "POST",

      body: JSON.stringify({
        title,
        meetingDate,
        meetingTime,
        transportMode,
        placeTypes,
      }),
    }
  );
}

/* =====================================================
   2. HOST REGISTER

   POST /rooms/{roomId}/host
===================================================== */

export function registerHost(
  roomId,
  {
    name,
    originText,
    originLat,
    originLng,
  }
) {
  return request(
    `/rooms/${roomId}/host`,
    {
      method: "POST",

      body: JSON.stringify({
        name,
        originText,
        originLat,
        originLng,
      }),
    }
  );
}

/* =====================================================
   3. PARTICIPANT REGISTER

   POST /rooms/{roomId}/participants
===================================================== */

export function registerParticipant(
  roomId,
  {
    name,
    originText,
    originLat,
    originLng,
  }
) {
  return request(
    `/rooms/${roomId}/participants`,
    {
      method: "POST",

      body: JSON.stringify({
        name,
        originText,
        originLat,
        originLng,
      }),
    }
  );
}

/* =====================================================
   4. PARTICIPANT ORIGIN UPDATE

   PATCH
   /rooms/{roomId}/participants/{participantId}
===================================================== */

export function updateParticipantOrigin(
  roomId,
  participantId,
  {
    originText,
    originLat,
    originLng,
  }
) {
  return request(
    `/rooms/${roomId}/participants/${participantId}`,
    {
      method: "PATCH",

      body: JSON.stringify({
        originText,
        originLat,
        originLng,
      }),
    }
  );
}

/* =====================================================
   5. ROOM STATUS

   GET /rooms/{roomId}/status
===================================================== */

export function getRoomStatus(
  roomId
) {
  return request(
    `/rooms/${roomId}/status`
  );
}

/* =====================================================
   6. RECOMMENDATION

   POST /recommendations
===================================================== */

export function getRecommendations({
  participants,
  placeTypes = [],
  datetime = null,
}) {
  return request(
    "/recommendations",
    {
      method: "POST",

      body: JSON.stringify({
        participants,

        place_types:
          placeTypes,

        datetime,
      }),
    }
  );
}

/* =====================================================
   7. NEARBY PLACES

   GET /places/nearby
===================================================== */

export function getNearbyPlaces({
  lat,
  lng,
  types = [],
}) {
  const typeText =
    Array.isArray(types)
      ? types.join(",")
      : types;

  const params =
    new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      types: typeText,
    });

  return request(
    `/places/nearby?${params.toString()}`
  );
}

/* =====================================================
   8. WEATHER

   GET /weather
===================================================== */

export function getWeather({
  lat,
  lng,
  datetime,
}) {
  const params =
    new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      datetime,
    });

  return request(
    `/weather?${params.toString()}`
  );
}

/* =====================================================
   9. FINAL PLACE

   POST /rooms/{roomId}/final-place
===================================================== */

export function saveFinalPlace(
  roomId,
  {
    placeName,
    lat,
    lng,
  }
) {
  return request(
    `/rooms/${roomId}/final-place`,
    {
      method: "POST",

      body: JSON.stringify({
        placeName,
        lat,
        lng,
      }),
    }
  );
}