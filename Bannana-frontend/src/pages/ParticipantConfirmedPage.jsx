import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import {
  getNearbyPlaces,
  getRoomStatus,
  getWeather,
} from "../api/bannanaApi";

import "./ParticipantConfirmedPage.css";

/* =====================================================
   PARTICIPANT COLORS
===================================================== */

const PARTICIPANT_COLORS = [
  {
    color: "#7144df",
    textColor: "#ffffff",
  },

  {
    color: "#e87570",
    textColor: "#21190f",
  },

  {
    color: "#f0c936",
    textColor: "#21190f",
  },

  {
    color: "#79cec5",
    textColor: "#21190f",
  },

  {
    color: "#84a9d8",
    textColor: "#21190f",
  },

  {
    color: "#d99ac5",
    textColor: "#21190f",
  },
];

/* =====================================================
   CATEGORY
===================================================== */

const CATEGORY_LABELS = {
  CAFE: "카페",

  RESTAURANT: "식당",

  EXHIBITION: "전시",

  SHOPPING: "쇼핑",

  PARK: "공원",
};

/* =====================================================
   WEATHER
===================================================== */

const WEATHER_META = {
  CLEAR: {
    icon: "☀️",
    label: "맑음",
  },

  CLOUDY: {
    icon: "🌥️",
    label: "구름많음",
  },

  RAIN: {
    icon: "🌧️",
    label: "비",
  },

  SNOW: {
    icon: "🌨️",
    label: "눈",
  },
};

/* =====================================================
   NUMBER

   null / undefined / 빈 문자열을
   0으로 변환하지 않도록 반드시 먼저 검사한다.
===================================================== */

function toFiniteNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

/* =====================================================
   CURRENT PARTICIPANT STORAGE
===================================================== */

function readCurrentParticipant(
  roomId
) {
  try {
    const saved =
      sessionStorage.getItem(
        `bannana-participant-${roomId}`
      );

    if (saved) {
      return JSON.parse(
        saved
      );
    }

    /*
      이전 저장 형식 호환
    */

    const legacy =
      sessionStorage.getItem(
        "bannana-current-participant"
      );

    if (legacy) {
      return JSON.parse(
        legacy
      );
    }
  } catch (error) {
    console.error(
      "현재 참여자 읽기 실패:",
      error
    );
  }

  return null;
}

/* =====================================================
   LOCAL TRAVEL TIME FALLBACK

   백엔드에서 travel_time이 아직
   내려오지 않을 경우,

   같은 브라우저에 추천 결과가 저장돼 있다면
   그 값을 임시로 사용할 수 있다.

   우선순위는 항상 백엔드 travel_time이 더 높다.
===================================================== */

function readSavedTravelTime(
  roomId,
  nickname
) {
  if (!nickname) {
    return null;
  }

  try {
    /* ==========================================
       1. FINAL PLACE STORAGE
    ========================================== */

    const finalPlaceSaved =
      sessionStorage.getItem(
        `bannana-final-place-${roomId}`
      );

    if (finalPlaceSaved) {
      const finalPlace =
        JSON.parse(
          finalPlaceSaved
        );

      const value =
        finalPlace
          ?.travelTimes?.[
            nickname
          ];

      const number =
        toFiniteNumber(
          value
        );

      if (number !== null) {
        return number;
      }
    }

    /* ==========================================
       2. RECOMMENDATION STORAGE
    ========================================== */

    const recommendationSaved =
      sessionStorage.getItem(
        `bannana-recommendation-${roomId}`
      );

    if (
      recommendationSaved
    ) {
      const recommendation =
        JSON.parse(
          recommendationSaved
        );

      const candidates =
        recommendation
          ?.candidates ?? [];

      for (
        const candidate of
        candidates
      ) {
        const value =
          candidate
            ?.travel_times?.[
              nickname
            ] ??
          candidate
            ?.travelTimes?.[
              nickname
            ];

        const number =
          toFiniteNumber(
            value
          );

        if (
          number !== null
        ) {
          return number;
        }
      }
    }
  } catch (error) {
    console.error(
      "저장된 이동시간 읽기 실패:",
      error
    );
  }

  return null;
}

/* =====================================================
   ICS TEXT
===================================================== */

function escapeICSText(
  text = ""
) {
  return String(text)
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /\n/g,
      "\\n"
    )
    .replace(
      /,/g,
      "\\,"
    )
    .replace(
      /;/g,
      "\\;"
    );
}

/* =====================================================
   DATE -> ICS
===================================================== */

function formatICSDate(
  date
) {
  return date
    .toISOString()
    .replace(
      /[-:]/g,
      ""
    )
    .replace(
      /\.\d{3}Z$/,
      "Z"
    );
}

/* =====================================================
   PARTICIPANT CONFIRMED PAGE
===================================================== */

function ParticipantConfirmedPage() {
  const navigate =
    useNavigate();

  /*
    App.jsx Route:

    /join/:inviteCode/confirmed

    현재 inviteCode 값이
    실질적인 roomId 역할을 한다.
  */

  const { inviteCode } =
    useParams();

  const roomId =
    inviteCode;

  /* =====================================================
     STATE
  ===================================================== */

  const [
    roomStatus,
    setRoomStatus,
  ] = useState(null);

  const [
    placeDetail,
    setPlaceDetail,
  ] = useState(null);

  const [
    weather,
    setWeather,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    calendarSaved,
    setCalendarSaved,
  ] = useState(false);

  /* =====================================================
     STORED PARTICIPANT
  ===================================================== */

  const storedParticipant =
    useMemo(
      () =>
        readCurrentParticipant(
          roomId
        ),
      [roomId]
    );

  /* =====================================================
     ROOM STATUS

     GET /rooms/{roomId}/status
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const loadRoom =
      async () => {
        try {
          setIsLoading(
            true
          );

          setError("");

          const response =
            await getRoomStatus(
              roomId
            );

          if (cancelled) {
            return;
          }

          setRoomStatus(
            response
          );
        } catch (
          roomError
        ) {
          console.error(
            "확정 약속 조회 실패:",
            roomError
          );

          if (!cancelled) {
            setError(
              roomError.message ||
                "약속 정보를 불러오지 못했습니다."
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(
              false
            );
          }
        }
      };

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  /* =====================================================
     PARTICIPANTS

     추후 백엔드에서 travel_time이 추가되면
     자동으로 사용할 수 있도록 한다.
  ===================================================== */

  const participants =
    useMemo(() => {
      if (!roomStatus) {
        return [];
      }

      const rawParticipants = [
        roomStatus.host,

        ...(roomStatus.participants ??
          []),
      ].filter(Boolean);

      return rawParticipants.map(
        (
          participant,
          index
        ) => {
          const travelTime =
            toFiniteNumber(
              participant.travel_time ??
                participant.travelTime ??
                participant.travel_minutes ??
                participant.travelMinutes
            );

          return {
            id:
              participant.participant_id ??
              participant.participantId ??
              participant.id ??
              index,

            nickname:
              participant.nickname ??
              participant.name ??
              `참여자 ${index + 1}`,

            originText:
              participant.origin_text ??
              participant.originText ??
              "",

            originLat:
              toFiniteNumber(
                participant.origin_lat ??
                  participant.originLat
              ),

            originLng:
              toFiniteNumber(
                participant.origin_lng ??
                  participant.originLng
              ),

            role:
              participant.role,

            isHost:
              participant.role ===
              "HOST",

            travelTime,
          };
        }
      );
    }, [roomStatus]);

  /* =====================================================
     CURRENT PARTICIPANT
  ===================================================== */

  const currentParticipant =
    useMemo(() => {
      if (
        participants.length ===
        0
      ) {
        return null;
      }

      const storedId =
        storedParticipant
          ?.participant_id ??
        storedParticipant
          ?.participantId ??
        storedParticipant
          ?.id;

      /* ==========================================
         1. ID
      ========================================== */

      if (
        storedId !== undefined &&
        storedId !== null
      ) {
        const byId =
          participants.find(
            (participant) =>
              String(
                participant.id
              ) ===
              String(
                storedId
              )
          );

        if (byId) {
          return byId;
        }
      }

      /* ==========================================
         2. NICKNAME
      ========================================== */

      if (
        storedParticipant
          ?.nickname
      ) {
        const matches =
          participants.filter(
            (participant) =>
              participant.nickname ===
              storedParticipant.nickname
          );

        /*
          동명이인이 한 명뿐이면 사용
        */

        if (
          matches.length ===
          1
        ) {
          return matches[0];
        }

        /*
          동명이인이 있으면
          출발지까지 비교
        */

        const storedOrigin =
          storedParticipant
            ?.originText ??
          storedParticipant
            ?.origin_text;

        if (storedOrigin) {
          const byOrigin =
            matches.find(
              (participant) =>
                participant.originText ===
                storedOrigin
            );

          if (byOrigin) {
            return byOrigin;
          }
        }
      }

      /* ==========================================
         FALLBACK

         호스트가 아닌 마지막 참여자
      ========================================== */

      const nonHosts =
        participants.filter(
          (participant) =>
            !participant.isHost
        );

      return (
        nonHosts[
          nonHosts.length - 1
        ] ??
        participants[0]
      );
    }, [
      participants,
      storedParticipant,
    ]);

  /* =====================================================
     CURRENT TRAVEL TIME

     우선순위

     1. Backend travel_time
     2. Join 저장 데이터
     3. Recommendation sessionStorage
  ===================================================== */

  const currentTravelTime =
    useMemo(() => {
      /* ==========================================
         1. BACKEND
      ========================================== */

      const backendValue =
        toFiniteNumber(
          currentParticipant
            ?.travelTime
        );

      if (
        backendValue !== null
      ) {
        return backendValue;
      }

      /* ==========================================
         2. CURRENT PARTICIPANT STORAGE
      ========================================== */

      const storedValue =
        toFiniteNumber(
          storedParticipant
            ?.travel_time ??
            storedParticipant
              ?.travelTime
        );

      if (
        storedValue !== null
      ) {
        return storedValue;
      }

      /* ==========================================
         3. RECOMMENDATION STORAGE
      ========================================== */

      return readSavedTravelTime(
        roomId,
        currentParticipant
          ?.nickname
      );
    }, [
      currentParticipant,
      storedParticipant,
      roomId,
    ]);

  /* =====================================================
     FINAL PLACE
  ===================================================== */

  const finalPlace =
    roomStatus?.finalPlace ??
    null;

  /* =====================================================
     PLACE DETAIL
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    if (!finalPlace) {
      return undefined;
    }

    const lat =
      toFiniteNumber(
        finalPlace.lat
      );

    const lng =
      toFiniteNumber(
        finalPlace.lng
      );

    if (
      lat === null ||
      lng === null
    ) {
      return undefined;
    }

    const loadPlaceDetail =
      async () => {
        try {
          const types =
            (
              roomStatus
                ?.placeTypes ??
              []
            ).map(
              (type) =>
                String(
                  type
                ).toLowerCase()
            );

          const response =
            await getNearbyPlaces({
              lat,
              lng,
              types,
            });

          if (cancelled) {
            return;
          }

          const places =
            response?.places ??
            [];

          const targetName =
            String(
              finalPlace.placeName ??
                ""
            )
              .replace(
                /\s/g,
                ""
              )
              .toLowerCase();

          const match =
            places.find(
              (place) =>
                String(
                  place.name ??
                    ""
                )
                  .replace(
                    /\s/g,
                    ""
                  )
                  .toLowerCase() ===
                targetName
            );

          if (match) {
            setPlaceDetail(
              match
            );
          }
        } catch (
          placeError
        ) {
          /*
            상세 장소 조회에 실패해도
            확정 페이지 전체는 유지한다.
          */

          console.error(
            "확정 장소 상세 조회 실패:",
            placeError
          );
        }
      };

    loadPlaceDetail();

    return () => {
      cancelled = true;
    };
  }, [
    finalPlace,
    roomStatus,
  ]);

  /* =====================================================
     SELECTED PLACE
  ===================================================== */

  const selectedPlace =
    useMemo(() => {
      if (!finalPlace) {
        return null;
      }

      return {
        id:
          placeDetail?.id ??
          "final-place",

        name:
          placeDetail?.name ??
          finalPlace.placeName ??
          "확정 장소",

        type:
          placeDetail?.type ??
          null,

        lat:
          toFiniteNumber(
            finalPlace.lat
          ),

        lng:
          toFiniteNumber(
            finalPlace.lng
          ),

        roadAddress:
          placeDetail
            ?.roadAddress ??
          placeDetail
            ?.road_address ??
          "",

        address:
          placeDetail?.address ??
          "",
      };
    }, [
      finalPlace,
      placeDetail,
    ]);

  /* =====================================================
     MEETING DATE
  ===================================================== */

  const meetingDate =
    useMemo(() => {
      if (
        !roomStatus
          ?.meetingDate ||
        !roomStatus
          ?.meetingTime
      ) {
        return null;
      }

      const date =
        new Date(
          `${roomStatus.meetingDate}T${roomStatus.meetingTime}`
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      return date;
    }, [roomStatus]);

  /* =====================================================
     MEETING DATE TEXT
  ===================================================== */

  const meetingDateText =
    useMemo(() => {
      if (!meetingDate) {
        return "-";
      }

      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          month: "long",
          day: "numeric",
          weekday: "short",
        }
      ).format(
        meetingDate
      );
    }, [meetingDate]);

  /* =====================================================
     MEETING TIME TEXT
  ===================================================== */

  const meetingTimeText =
    useMemo(() => {
      if (!meetingDate) {
        return "-";
      }

      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      ).format(
        meetingDate
      );
    }, [meetingDate]);

  /* =====================================================
     DEPARTURE TIME

     약속 시간 - 이동시간
  ===================================================== */

  const departureTimeText =
    useMemo(() => {
      if (
        !meetingDate ||
        currentTravelTime ===
          null
      ) {
        return null;
      }

      const departureDate =
        new Date(
          meetingDate.getTime() -
            currentTravelTime *
              60 *
              1000
        );

      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      ).format(
        departureDate
      );
    }, [
      meetingDate,
      currentTravelTime,
    ]);

  /* =====================================================
     WEATHER
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    if (
      !selectedPlace ||
      !meetingDate
    ) {
      return undefined;
    }

    if (
      selectedPlace.lat ===
        null ||
      selectedPlace.lng ===
        null
    ) {
      return undefined;
    }

    const loadWeather =
      async () => {
        try {
          const response =
            await getWeather({
              lat:
                selectedPlace.lat,

              lng:
                selectedPlace.lng,

              datetime:
                `${roomStatus.meetingDate}T${roomStatus.meetingTime}`,
            });

          if (!cancelled) {
            setWeather(
              response
            );
          }
        } catch (
          weatherError
        ) {
          console.error(
            "날씨 조회 실패:",
            weatherError
          );
        }
      };

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [
    selectedPlace,
    meetingDate,
    roomStatus,
  ]);

  /* =====================================================
     MAP MARKERS
  ===================================================== */

  const mapMarkers =
    useMemo(() => {
      const markers = [];

      /* ==========================================
         PARTICIPANTS
      ========================================== */

      participants.forEach(
        (
          participant,
          index
        ) => {
          if (
            participant.originLat ===
              null ||
            participant.originLng ===
              null
          ) {
            return;
          }

          const color =
            PARTICIPANT_COLORS[
              index
            ] ??
            PARTICIPANT_COLORS[0];

          markers.push({
            id:
              `participant-${participant.id}`,

            type:
              "participant",

            lat:
              participant.originLat,

            lng:
              participant.originLng,

            label:
              participant.nickname,

            initial:
              participant.nickname
                ?.charAt(0) ??
              "?",

            color:
              color.color,

            textColor:
              color.textColor,

            zIndex:
              100 + index,
          });
        }
      );

      /* ==========================================
         FINAL PLACE
      ========================================== */

      if (
        selectedPlace &&
        selectedPlace.lat !==
          null &&
        selectedPlace.lng !==
          null
      ) {
        markers.push({
          id:
            "final-place",

          type:
            "midpoint",

          lat:
            selectedPlace.lat,

          lng:
            selectedPlace.lng,

          label:
            selectedPlace.name,

          initial:
            "🍌",

          color:
            "#f4cf45",

          textColor:
            "#21190f",

          zIndex:
            200,
        });
      }

      return markers;
    }, [
      participants,
      selectedPlace,
    ]);

  /* =====================================================
     WEATHER UI
  ===================================================== */

  const weatherMeta =
    WEATHER_META[
      weather?.condition
    ] ??
    WEATHER_META.CLEAR;

  const weatherLabel =
    weather?.conditionText ??
    weatherMeta.label;

  /* =====================================================
     CALENDAR
  ===================================================== */

  const handleSaveCalendar =
    () => {
      if (
        !meetingDate ||
        !selectedPlace
      ) {
        alert(
          "약속 정보를 아직 불러오고 있습니다."
        );

        return;
      }

      try {
        const startDate =
          meetingDate;

        const endDate =
          new Date(
            startDate.getTime() +
              2 *
                60 *
                60 *
                1000
          );

        const now =
          new Date();

        const description = [
          "반나나에서 확정된 약속입니다.",

          `장소: ${selectedPlace.name}`,

          `날짜: ${meetingDateText}`,

          `시간: ${meetingTimeText}`,
        ];

        if (
          currentTravelTime !==
          null
        ) {
          description.push(
            `예상 이동시간: ${currentTravelTime}분`
          );
        }

        if (
          departureTimeText
        ) {
          description.push(
            `권장 출발시간: ${departureTimeText}`
          );
        }

        if (
          currentParticipant
            ?.originText
        ) {
          description.push(
            `출발지: ${currentParticipant.originText}`
          );
        }

        if (weather) {
          description.push(
            `날씨: ${weatherLabel}`
          );
        }

        const icsContent = [
          "BEGIN:VCALENDAR",

          "VERSION:2.0",

          "PRODID:-//BANNANA//Meeting//KO",

          "CALSCALE:GREGORIAN",

          "METHOD:PUBLISH",

          "BEGIN:VEVENT",

          `UID:${roomId}-${Date.now()}@bannana.app`,

          `DTSTAMP:${formatICSDate(
            now
          )}`,

          `DTSTART:${formatICSDate(
            startDate
          )}`,

          `DTEND:${formatICSDate(
            endDate
          )}`,

          `SUMMARY:${escapeICSText(
            roomStatus?.title ??
              "반나나 약속"
          )}`,

          `LOCATION:${escapeICSText(
            selectedPlace.name
          )}`,

          `DESCRIPTION:${escapeICSText(
            description.join(
              "\n"
            )
          )}`,

          "BEGIN:VALARM",

          "TRIGGER:-PT30M",

          "ACTION:DISPLAY",

          "DESCRIPTION:반나나 약속 30분 전이에요!",

          "END:VALARM",

          "END:VEVENT",

          "END:VCALENDAR",
        ].join("\r\n");

        const blob =
          new Blob(
            [icsContent],
            {
              type:
                "text/calendar;charset=utf-8",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href =
          url;

        link.download =
          "반나나_약속.ics";

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        window.setTimeout(
          () => {
            URL.revokeObjectURL(
              url
            );
          },
          1000
        );

        setCalendarSaved(
          true
        );

        window.setTimeout(
          () => {
            setCalendarSaved(
              false
            );
          },
          3500
        );
      } catch (
        calendarError
      ) {
        console.error(
          "캘린더 저장 실패:",
          calendarError
        );

        alert(
          "캘린더 파일을 만들지 못했습니다."
        );
      }
    };

  /* =====================================================
     SHARE
  ===================================================== */

  const handleShare =
    async () => {
      if (!selectedPlace) {
        return;
      }

      const url =
        `${window.location.origin}/join/${roomId}/confirmed`;

      const text =
        `${roomStatus?.title ?? "반나나 약속"}\n` +
        `📍 ${selectedPlace.name}\n` +
        `🗓️ ${meetingDateText} ${meetingTimeText}`;

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              "반나나 약속 장소 확정",

            text,

            url,
          });

          return;
        }

        await navigator.clipboard.writeText(
          `${text}\n${url}`
        );

        alert(
          "약속 정보가 복사됐어요!"
        );
      } catch (
        shareError
      ) {
        if (
          shareError?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "공유 실패:",
          shareError
        );
      }
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading) {
    return (
      <main className="participant-confirmed-state-page">
        <section className="participant-confirmed-state-card">
          <div className="participant-confirmed-spinner" />

          <h1>
            확정된 약속을
            불러오고 있어요
          </h1>
        </section>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error &&
    !roomStatus
  ) {
    return (
      <main className="participant-confirmed-state-page">
        <section className="participant-confirmed-state-card">
          <div className="participant-confirmed-state-icon">
            ⚠️
          </div>

          <h1>
            약속 정보를
            불러오지 못했어요
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            다시 불러오기
          </button>
        </section>
      </main>
    );
  }

  /* =====================================================
     NOT CONFIRMED
  ===================================================== */

  if (!selectedPlace) {
    return (
      <main className="participant-confirmed-state-page">
        <section className="participant-confirmed-state-card">
          <div className="participant-confirmed-state-icon">
            🍌
          </div>

          <h1>
            아직 장소를
            선택하고 있어요
          </h1>

          <p>
            호스트가 최종 장소를
            확정하면 확인할 수 있어요.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/join/${roomId}/waiting`
              )
            }
          >
            기다리기 화면으로
          </button>
        </section>
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="participant-confirmed-page app-container">
      {/* =================================================
          PROGRESS
      ================================================= */}

      <div className="participant-confirmed-progress">
        <div className="participant-confirmed-progress-bars">
          <span />
          <span />
          <span />
        </div>

        <strong>
          3/3
        </strong>
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="participant-confirmed-header">
        <h1>
          약속 장소 확정! 🎉
        </h1>

        <p>
          {roomStatus?.host
            ?.nickname ??
            roomStatus?.host
              ?.name ??
            "호스트"}
          님이 최종 장소를 결정했어요
        </p>
      </header>

      {/* =================================================
          MY TRAVEL GUIDE
      ================================================= */}

      <section className="participant-my-travel">
        <p className="participant-my-travel-title">
          {currentParticipant
            ?.nickname ??
            "참여자"}
          님의 이동 안내
        </p>

        <div className="participant-my-travel-top">
          {/* =============================================
              TRAVEL TIME
          ============================================= */}

          <div className="participant-my-travel-stat">
            <div className="participant-my-travel-value">
              {currentTravelTime !==
              null ? (
                <>
                  {
                    currentTravelTime
                  }

                  <span>
                    분
                  </span>
                </>
              ) : (
                <>
                  --

                  <span>
                    분
                  </span>
                </>
              )}
            </div>

            <span className="participant-my-travel-label">
              {currentTravelTime !==
              null
                ? "예상 이동시간"
                : "이동시간 확인 중"}
            </span>
          </div>

          {/* =============================================
              DEPARTURE TIME
          ============================================= */}

          <div className="participant-my-travel-stat participant-my-travel-stat--right">
            <strong className="participant-departure-time">
              {departureTimeText ??
                meetingTimeText}
            </strong>

            <span className="participant-my-travel-label">
              {departureTimeText
                ? "출발 권장"
                : "약속 시간"}
            </span>
          </div>
        </div>

        {/* ===============================================
            PROGRESS BAR
        =============================================== */}

        <div className="participant-travel-progress">
          <div
            style={{
              width:
                currentTravelTime !==
                null
                  ? `${Math.min(
                      100,
                      Math.max(
                        12,
                        (currentTravelTime /
                          60) *
                          100
                      )
                    )}%`
                  : "18%",
            }}
          />
        </div>

        {/* ===============================================
            ORIGIN
        =============================================== */}

        <div className="participant-origin-guide">
          <span className="participant-origin-guide__icon">
            📍
          </span>

          <div>
            <strong>
              {currentParticipant
                ?.originText ||
                "출발지"}
            </strong>

            <span>
              {departureTimeText
                ? `${departureTimeText}까지 출발하면 약속 시간에 맞출 수 있어요`
                : "출발지에서 약속 장소까지 이동시간을 확인하고 있어요"}
            </span>
          </div>
        </div>
      </section>

      {/* =================================================
          FINAL PLACE
      ================================================= */}

      <section className="participant-final-place">
        <h2>
          📍 약속 장소
        </h2>

        <div className="participant-final-place-main">
          <div className="participant-final-place-image">
            {selectedPlace.type ===
            "CAFE"
              ? "☕"
              : selectedPlace.type ===
                  "RESTAURANT"
                ? "🍽️"
                : "📍"}
          </div>

          <div className="participant-final-place-info">
            <h3>
              {
                selectedPlace.name
              }
            </h3>

            <div className="participant-final-place-tags">
              <span>
                {CATEGORY_LABELS[
                  selectedPlace.type
                ] ??
                  "확정 장소"}
              </span>

              <span className="participant-final-place-tag--indoor">
                최종 선택
              </span>
            </div>

            <p>
              📍{" "}
              {selectedPlace.roadAddress ||
                selectedPlace.address ||
                "호스트가 선택한 최종 약속 장소"}
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          MAP
      ================================================= */}

      <section className="participant-confirmed-map">
        <KakaoMap
          markers={
            mapMarkers
          }
          height="100%"
          level={5}
          emptyMessage="위치 정보를 불러올 수 없어요"
        />

        <div className="participant-map-fair-label">
          🍌 최종 약속 장소
        </div>
      </section>

      {/* =================================================
          PARTICIPANTS
      ================================================= */}

      <section className="participant-all-travel">
        <h2>
          👥 함께하는 참여자
        </h2>

        <p className="participant-all-description">
          총{" "}
          {
            participants.length
          }
          명이 함께해요
        </p>

        <div className="participant-all-travel-list">
          {participants.map(
            (
              participant,
              index
            ) => {
              const color =
                PARTICIPANT_COLORS[
                  index
                ] ??
                PARTICIPANT_COLORS[0];

              const isMe =
                currentParticipant &&
                participant.id ===
                  currentParticipant.id;

              return (
                <article
                  key={
                    participant.id
                  }
                  className="participant-all-travel-row"
                >
                  <div
                    className="participant-all-avatar"
                    style={{
                      backgroundColor:
                        color.color,

                      color:
                        color.textColor,
                    }}
                  >
                    {participant.nickname
                      ?.charAt(0) ??
                      "?"}
                  </div>

                  <div className="participant-all-person">
                    <strong>
                      {
                        participant.nickname
                      }

                      {participant.isHost &&
                        " (호스트)"}

                      {isMe &&
                        !participant.isHost &&
                        " (나)"}
                    </strong>

                    <span className="participant-all-origin">
                      {participant.originText ||
                        "출발지 등록 완료"}
                    </span>
                  </div>

                  <div className="participant-ready-badge">
                    참여 완료
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          DATE + WEATHER
      ================================================= */}

      <section className="participant-final-summary">
        <div className="participant-final-weather">
          <span className="participant-final-weather-icon">
            {weather
              ? weatherMeta.icon
              : "🌤️"}
          </span>

          <div>
            <strong>
              {weather
                ? weatherLabel
                : "날씨 확인 중"}
            </strong>

            {weather && (
              <small>
                강수{" "}
                {weather.precipitationProbability ??
                  0}
                %
              </small>
            )}
          </div>
        </div>

        <div className="participant-final-date">
          <strong>
            {
              meetingDateText
            }
          </strong>

          <span>
            {
              meetingTimeText
            }
            <br />

            {
              selectedPlace.name
            }
          </span>
        </div>
      </section>

      {/* =================================================
          CALENDAR SUCCESS
      ================================================= */}

      {calendarSaved && (
        <div className="participant-calendar-success">
          ✅ 캘린더 파일을 만들었어요! 파일을 열어 일정을 추가해주세요.
        </div>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      <section className="participant-confirmed-actions">
        <button
          type="button"
          className="participant-calendar-button"
          onClick={
            handleSaveCalendar
          }
        >
          🗓️ 내 캘린더에 저장하기
        </button>

        <button
          type="button"
          className="participant-share-button"
          onClick={
            handleShare
          }
        >
          🔗 친구에게 공유하기
        </button>
      </section>
    </main>
  );
}

export default ParticipantConfirmedPage;