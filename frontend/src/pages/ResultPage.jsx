import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import WeatherMapEffect, {
  getSimpleWeather,
} from "../components/common/WeatherMapEffect";

import {
  getNearbyPlaces,
  getWeather,
  saveFinalPlace,
} from "../api/bannanaApi";

import "./ResultPage.css";

/* =====================================================
   BOTTOM SHEET
===================================================== */

const SHEET_SNAP_POINTS = [
  38,
  63,
  90,
];

const MIN_SHEET_HEIGHT = 38;
const MAX_SHEET_HEIGHT = 90;

/* =====================================================
   PARTICIPANT COLORS
===================================================== */

const PARTICIPANT_COLORS = [
  {
    color: "#7144df",
    textColor: "#ffffff",
    softColor: "#ede5ff",
  },

  {
    color: "#e87570",
    textColor: "#21190f",
    softColor: "#ffe0dd",
  },

  {
    color: "#f0c936",
    textColor: "#21190f",
    softColor: "#fff1b6",
  },

  {
    color: "#79cec5",
    textColor: "#21190f",
    softColor: "#dff4f1",
  },

  {
    color: "#84a9d8",
    textColor: "#21190f",
    softColor: "#e4eef9",
  },

  {
    color: "#d99ac5",
    textColor: "#21190f",
    softColor: "#f6e5f1",
  },
];

/* =====================================================
   CATEGORY
===================================================== */

const CATEGORY_LABELS = {
  CAFE: "카페",
  RESTAURANT: "식당",
  EXHIBITION: "전시",
  CULTURE: "전시",
  SHOPPING: "쇼핑",
  PARK: "공원",
};

const CATEGORY_ICONS = {
  CAFE: "☕",
  RESTAURANT: "🍽️",
  EXHIBITION: "🎨",
  CULTURE: "🎨",
  SHOPPING: "🛍️",
  PARK: "🌳",
};

/* =====================================================
   READ RECOMMENDATION
===================================================== */

function readRecommendation(
  roomId
) {
  try {
    const saved =
      sessionStorage.getItem(
        `bannana-recommendation-${roomId}`
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error(
      "추천 결과 읽기 실패:",
      error
    );

    return null;
  }
}

/* =====================================================
   NUMBER
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
   CATEGORY NORMALIZE
===================================================== */

function normalizePlaceType(
  value
) {
  const type =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    type === "CULTURE"
  ) {
    return "EXHIBITION";
  }

  return type;
}

/* =====================================================
   RESULT PAGE
===================================================== */

function ResultPage() {
  const navigate =
    useNavigate();

  const { roomId } =
    useParams();

  /* =====================================================
     DATA
  ===================================================== */

  const recommendationData =
    useMemo(
      () =>
        readRecommendation(
          roomId
        ),
      [roomId]
    );

  const candidate =
    recommendationData
      ?.candidates?.[0] ??
    null;

  const roomStatus =
    recommendationData
      ?.roomStatus ??
    null;

  /* =====================================================
     STATE
  ===================================================== */

  const [
    sheetHeight,
    setSheetHeight,
  ] = useState(38);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    sheetMode,
    setSheetMode,
  ] = useState("places");

  const [
    selectedPlaceId,
    setSelectedPlaceId,
  ] = useState(null);

  const [
    places,
    setPlaces,
  ] = useState([]);

  const [
    weather,
    setWeather,
  ] = useState(null);

  const [
    placeError,
    setPlaceError,
  ] = useState("");

  const [
    weatherError,
    setWeatherError,
  ] = useState("");

  const [
    isLoadingPlaces,
    setIsLoadingPlaces,
  ] = useState(true);

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);

  const [
    focusLocation,
    setFocusLocation,
  ] = useState(null);

  /* =====================================================
     REFS
  ===================================================== */

  const dragStartYRef =
    useRef(0);

  const dragStartHeightRef =
    useRef(38);

  const currentHeightRef =
    useRef(38);

  const isDraggingRef =
    useRef(false);

  const sheetScrollRef =
    useRef(null);

  /* =====================================================
     PARTICIPANTS
  ===================================================== */

  const participants =
    useMemo(() => {
      if (
        !recommendationData
          ?.participants
      ) {
        return [];
      }

      return recommendationData.participants
        .slice(0, 6)
        .map(
          (
            participant,
            index
          ) => {
            const lat =
              toFiniteNumber(
                participant.origin_lat
              );

            const lng =
              toFiniteNumber(
                participant.origin_lng
              );

            const travelTime =
              candidate
                ?.travel_times?.[
                  participant.nickname
                ];

            return {
              id:
                participant.participant_id ??
                index,

              nickname:
                participant.nickname,

              originText:
                participant.origin_text,

              originLat:
                lat,

              originLng:
                lng,

              role:
                participant.role,

              isHost:
                participant.role ===
                "HOST",

              travelTime:
                toFiniteNumber(
                  travelTime
                ),
            };
          }
        );
    }, [
      recommendationData,
      candidate,
    ]);

  /* =====================================================
     TRAVEL TIMES
  ===================================================== */

  const validTravelTimes =
    useMemo(
      () =>
        participants
          .map(
            (
              participant
            ) =>
              participant.travelTime
          )
          .filter(
            (
              value
            ) =>
              Number.isFinite(
                value
              )
          ),
      [participants]
    );

  const minTravelTime =
    validTravelTimes.length
      ? Math.min(
          ...validTravelTimes
        )
      : null;

  const maxTravelTime =
    validTravelTimes.length
      ? Math.max(
          ...validTravelTimes
        )
      : null;

  const calculatedGap =
    minTravelTime !== null &&
    maxTravelTime !== null
      ? maxTravelTime -
        minTravelTime
      : null;

  const gapMinutes =
    toFiniteNumber(
      candidate?.gap_minutes
    ) ??
    calculatedGap ??
    0;

  /* =====================================================
     MEETING DATE
  ===================================================== */

  const meetingDateTime =
    useMemo(() => {
      if (
        !roomStatus
          ?.meetingDate ||
        !roomStatus
          ?.meetingTime
      ) {
        return null;
      }

      return `${roomStatus.meetingDate}T${roomStatus.meetingTime}`;
    }, [roomStatus]);

  const meetingDateTimeText =
    useMemo(() => {
      if (
        !meetingDateTime
      ) {
        return "";
      }

      const date =
        new Date(
          meetingDateTime
        );

      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          month:
            "long",

          day:
            "numeric",

          weekday:
            "short",

          hour:
            "numeric",

          minute:
            "2-digit",

          hour12:
            true,
        }
      ).format(date);
    }, [meetingDateTime]);

  /* =====================================================
     PLACE TYPES
  ===================================================== */

  const placeTypes =
    useMemo(
      () =>
        (
          roomStatus
            ?.placeTypes ??
          []
        )
          .map(
            (
              type
            ) =>
              normalizePlaceType(
                type
              ).toLowerCase()
          )
          .filter(Boolean),
      [roomStatus]
    );

  /* =====================================================
     LOAD PLACES + WEATHER
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    if (!candidate) {
      return undefined;
    }

    const candidateLat =
      toFiniteNumber(
        candidate.lat
      );

    const candidateLng =
      toFiniteNumber(
        candidate.lng
      );

    if (
      candidateLat === null ||
      candidateLng === null
    ) {
      return undefined;
    }

    const loadData =
      async () => {
        /* ==========================================
           PLACES
        ========================================== */

        try {
          setIsLoadingPlaces(
            true
          );

          setPlaceError("");

          const response =
            await getNearbyPlaces({
              lat:
                candidateLat,

              lng:
                candidateLng,

              types:
                placeTypes,
            });

          if (!cancelled) {
            setPlaces(
              (
                response?.places ??
                []
              ).slice(
                0,
                5
              )
            );
          }
        } catch (error) {
          console.error(
            "주변 장소 조회 실패:",
            error
          );

          if (!cancelled) {
            setPlaces([]);

            setPlaceError(
              error.message ||
                "주변 장소를 불러오지 못했습니다."
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingPlaces(
              false
            );
          }
        }

        /* ==========================================
           WEATHER
        ========================================== */

        if (
          !meetingDateTime
        ) {
          return;
        }

        try {
          setWeatherError("");

          const response =
            await getWeather({
              lat:
                candidateLat,

              lng:
                candidateLng,

              datetime:
                meetingDateTime,
            });

          if (!cancelled) {
            setWeather(
              response
            );
          }
        } catch (error) {
          console.error(
            "날씨 조회 실패:",
            error
          );

          if (!cancelled) {
            setWeather(null);

            setWeatherError(
              error.message ||
                "날씨 정보를 불러오지 못했습니다."
            );
          }
        }
      };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    candidate,
    meetingDateTime,
    placeTypes,
  ]);

  /* =====================================================
     SIMPLE WEATHER

     ★ 맑음 / 비 / 눈만 사용
  ===================================================== */

  const simpleWeather =
    useMemo(
      () =>
        getSimpleWeather(
          weather
        ),
      [weather]
    );

  /* =====================================================
     MAP MARKERS
  ===================================================== */

  const mapMarkers =
    useMemo(() => {
      const markers = [];

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
                ?.trim()
                ?.charAt(0) ??
              "?",

            color:
              color.color,

            textColor:
              color.textColor,

            zIndex:
              100 +
              index,
          });
        }
      );

      const midpointLat =
        toFiniteNumber(
          candidate?.lat
        );

      const midpointLng =
        toFiniteNumber(
          candidate?.lng
        );

      if (
        midpointLat !== null &&
        midpointLng !== null
      ) {
        markers.push({
          id:
            "recommendation-midpoint",

          type:
            "midpoint",

          lat:
            midpointLat,

          lng:
            midpointLng,

          label:
            candidate.name,

          initial:
            "🍌",

          color:
            "#f4cf45",

          textColor:
            "#21190f",

          zIndex: 300,
        });
      }

      places
        .slice(0, 5)
        .forEach(
          (
            place,
            index
          ) => {
            const lat =
              toFiniteNumber(
                place.lat
              );

            const lng =
              toFiniteNumber(
                place.lng
              );

            if (
              lat === null ||
              lng === null
            ) {
              return;
            }

            markers.push({
              id:
                `place-${place.id}`,

              type:
                "place",

              lat,
              lng,

              label:
                place.name,

              initial:
                String(
                  index + 1
                ),

              color:
                "#ffffff",

              textColor:
                "#21190f",

              zIndex:
                200 +
                index,
            });
          }
        );

      return markers;
    }, [
      participants,
      candidate,
      places,
    ]);

  /* =====================================================
     RESULT REASON
  ===================================================== */

  const recommendationReason =
    useMemo(() => {
      if (!candidate) {
        return "";
      }

      if (
        validTravelTimes.length <
        2
      ) {
        return `${candidate.name}은 참여자들의 출발지와 대중교통 접근성을 기준으로 계산된 중간 후보예요.`;
      }

      if (
        gapMinutes <= 5
      ) {
        return `${candidate.name}은 참여자별 실제 대중교통 이동시간 차이가 ${gapMinutes}분으로 매우 작아, 현재 후보 중 이동 부담이 가장 고르게 분배되는 지역이에요.`;
      }

      if (
        gapMinutes <= 15
      ) {
        return `${candidate.name}은 참여자들의 실제 대중교통 이동시간을 비교했을 때 최대 차이가 ${gapMinutes}분으로, 비교적 균형 있게 이동할 수 있는 지역이에요.`;
      }

      return `${candidate.name}은 모든 참여자의 실제 대중교통 이동시간을 비교해 선정된 후보예요. 현재 참여자 간 최대 이동시간 차이는 ${gapMinutes}분이에요.`;
    }, [
      candidate,
      gapMinutes,
      validTravelTimes.length,
    ]);

  /* =====================================================
     PLACE REASON
  ===================================================== */

  const getPlaceReason =
    (
      place
    ) => {
      const type =
        normalizePlaceType(
          place.type ??
          place.category
        );

      const label =
        CATEGORY_LABELS[
          type
        ] ??
        "장소";

      const distance =
        toFiniteNumber(
          place.distanceMeters ??
          place.distanceM
        );

      if (
        simpleWeather.key ===
          "RAIN" &&
        [
          "CAFE",
          "RESTAURANT",
          "EXHIBITION",
          "SHOPPING",
        ].includes(
          type
        )
      ) {
        return `비가 예상되는 날씨와 선택한 ${label} 유형을 고려한 장소예요.${
          distance !== null
            ? ` ${candidate.name}에서 약 ${distance}m 거리라 이동하기에도 편리해요.`
            : ""
        }`;
      }

      if (
        simpleWeather.key ===
          "SNOW" &&
        [
          "CAFE",
          "RESTAURANT",
          "EXHIBITION",
          "SHOPPING",
        ].includes(
          type
        )
      ) {
        return `눈이 예상되는 날씨를 고려해 머물기 편한 ${label} 유형의 장소를 추천했어요.${
          distance !== null
            ? ` ${candidate.name}에서 약 ${distance}m 거리예요.`
            : ""
        }`;
      }

      if (
        distance !== null &&
        distance <= 300
      ) {
        return `${candidate.name}에서 약 ${distance}m 거리에 있고, 선택한 ${label} 유형에도 해당해 접근하기 편한 장소예요.`;
      }

      return `선택한 ${label} 유형에 해당하며, 공평하게 계산된 중간 지점 ${candidate.name} 주변에서 찾은 장소예요.${
        distance !== null
          ? ` 중간 지점과의 거리는 약 ${distance}m예요.`
          : ""
      }`;
    };

  /* =====================================================
     DRAG
  ===================================================== */

  const handleSheetPointerDown =
    (
      event
    ) => {
      isDraggingRef.current =
        true;

      setIsDragging(
        true
      );

      dragStartYRef.current =
        event.clientY;

      dragStartHeightRef.current =
        currentHeightRef.current;

      event.currentTarget
        .setPointerCapture(
          event.pointerId
        );
    };

  const handleSheetPointerMove =
    (
      event
    ) => {
      if (
        !isDraggingRef.current
      ) {
        return;
      }

      const movedPixels =
        dragStartYRef.current -
        event.clientY;

      const movedViewport =
        (
          movedPixels /
          window.innerHeight
        ) * 100;

      const nextHeight =
        dragStartHeightRef.current +
        movedViewport;

      const limitedHeight =
        Math.min(
          MAX_SHEET_HEIGHT,
          Math.max(
            MIN_SHEET_HEIGHT,
            nextHeight
          )
        );

      currentHeightRef.current =
        limitedHeight;

      setSheetHeight(
        limitedHeight
      );
    };

  const snapToNearestPoint =
    () => {
      const current =
        currentHeightRef.current;

      const nearest =
        SHEET_SNAP_POINTS.reduce(
          (
            closest,
            point
          ) => {
            const distance =
              Math.abs(
                current -
                point
              );

            const closestDistance =
              Math.abs(
                current -
                closest
              );

            return distance <
              closestDistance
              ? point
              : closest;
          },
          SHEET_SNAP_POINTS[0]
        );

      currentHeightRef.current =
        nearest;

      isDraggingRef.current =
        false;

      setIsDragging(
        false
      );

      setSheetHeight(
        nearest
      );
    };

  const handleSheetPointerUp =
    (
      event
    ) => {
      if (
        !isDraggingRef.current
      ) {
        return;
      }

      snapToNearestPoint();

      if (
        event.currentTarget
          .hasPointerCapture(
            event.pointerId
          )
      ) {
        event.currentTarget
          .releasePointerCapture(
            event.pointerId
          );
      }
    };

  const handleSheetPointerCancel =
    () => {
      snapToNearestPoint();
    };

  /* =====================================================
     MODE
  ===================================================== */

  const resetSheetScroll =
    () => {
      window.requestAnimationFrame(
        () => {
          sheetScrollRef.current
            ?.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });
        }
      );
    };

  const handleShowWeather =
    () => {
      setSheetMode(
        "weather"
      );

      currentHeightRef.current =
        90;

      setSheetHeight(
        90
      );

      resetSheetScroll();
    };

  const handleBackToPlaces =
    () => {
      setSheetMode(
        "places"
      );

      currentHeightRef.current =
        63;

      setSheetHeight(
        63
      );

      resetSheetScroll();
    };

  /* =====================================================
     PLACE CLICK
  ===================================================== */

  const handlePlaceClick = (
    place
  ) => {
    setSelectedPlaceId(
      place.id
    );

    const lat =
      toFiniteNumber(
        place.lat
      );

    const lng =
      toFiniteNumber(
        place.lng
      );

    if (
      lat !== null &&
      lng !== null
    ) {
      setFocusLocation({
        id:
          place.id,

        lat,
        lng,

        requestId:
          Date.now(),
      });
    }
  };

  /* =====================================================
     CONFIRM PLACE
  ===================================================== */

  const handleConfirmPlace =
    async () => {
      const selectedPlace =
        places.find(
          (
            place
          ) =>
            place.id ===
            selectedPlaceId
        );

      if (
        !selectedPlace ||
        isConfirming
      ) {
        return;
      }

      setIsConfirming(
        true
      );

      try {
        await saveFinalPlace(
          roomId,
          {
            placeName:
              selectedPlace.name,

            lat:
              Number(
                selectedPlace.lat
              ),

            lng:
              Number(
                selectedPlace.lng
              ),
          }
        );

        sessionStorage.setItem(
          `bannana-final-place-${roomId}`,
          JSON.stringify({
            ...selectedPlace,

            midpoint: {
              name:
                candidate.name,

              lat:
                candidate.lat,

              lng:
                candidate.lng,
            },

            gapMinutes,

            travelTimes:
              candidate.travel_times,

            weather,

            simpleWeather,
          })
        );

        navigate(
          `/room/${roomId}/confirmed`,
          {
            state: {
              selectedPlace,
              candidate,
              weather,
              participants,
            },
          }
        );
      } catch (error) {
        console.error(
          "최종 장소 저장 실패:",
          error
        );

        alert(
          error.message ||
            "최종 장소 저장에 실패했습니다."
        );
      } finally {
        setIsConfirming(
          false
        );
      }
    };

  /* =====================================================
     ERROR
  ===================================================== */

  if (!recommendationData) {
    return (
      <main className="result-state-page">
        <section className="result-state-card">
          <div className="result-state-icon">
            ⚠️
          </div>

          <h1>
            추천 결과를 찾을 수 없어요
          </h1>

          <p>
            중간 장소를 다시 계산해주세요.
          </p>

          <button
            type="button"
            className="result-state-primary"
            onClick={() =>
              navigate(
                `/room/${roomId}/loading`
              )
            }
          >
            다시 계산하기
          </button>
        </section>
      </main>
    );
  }

  if (!candidate) {
    return (
      <main className="result-state-page">
        <section className="result-state-card">
          <div className="result-state-icon">
            🗺️
          </div>

          <h1>
            추천 중간 지점이 없어요
          </h1>

          <p>
            참여자 출발지를 확인한 뒤 다시 계산해주세요.
          </p>

          <button
            type="button"
            className="result-state-primary"
            onClick={() =>
              navigate(
                `/room/${roomId}/status`
              )
            }
          >
            참여 현황으로
          </button>
        </section>
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main
      className={`result-page result-page--${simpleWeather.key.toLowerCase()}`}
    >
      {/* =================================================
          MAP
      ================================================= */}

      <section className="result-map">
        <div
          style={{
            position:
              "absolute",

            inset: 0,
          }}
        >
          <KakaoMap
            markers={
              mapMarkers
            }
            height="100%"
            level={6}
            focusLocation={
              focusLocation
            }
            focusLevel={3}
            emptyMessage="위치 정보를 표시할 수 없어요"
          />
        </div>

        {/* ★ 비 / 눈 효과 */}

        {weather && (
          <WeatherMapEffect
            mode={
              simpleWeather.key
            }
          />
        )}

        <button
          type="button"
          className="result-map-back"
          onClick={() =>
            navigate(-1)
          }
        >
          ←
        </button>

        {/* =============================================
            WEATHER BADGE
        ============================================= */}

        <button
          type="button"
          className="result-weather-badge"
          onClick={
            handleShowWeather
          }
        >
          <span className="result-weather-badge__icon">
            {weather
              ? simpleWeather.icon
              : "🌤️"}
          </span>

          <span>
            <strong>
              {weather
                ? simpleWeather.label
                : "날씨"}
            </strong>

            <small>
              {weather
                ? `강수 ${
                    weather.precipitationProbability ??
                    0
                  }%`
                : "정보 보기"}
            </small>
          </span>
        </button>

        {/* =============================================
            PARTICIPANT LEGEND
        ============================================= */}

        <div
          className={`result-map-participant-chips ${
            isDragging
              ? "result-map-participant-chips--dragging"
              : ""
          }`}
          style={{
            bottom:
              `calc(${sheetHeight}dvh + 10px)`,
          }}
        >
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

              return (
                <div
                  key={
                    participant.id
                  }
                  className="result-map-participant-chip"
                >
                  <span
                    className="result-participant-dot"
                    style={{
                      background:
                        color.color,
                    }}
                  />

                  {
                    participant.nickname
                  }

                  {participant.isHost &&
                    " (호스트)"}
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          SHEET
      ================================================= */}

      <section
        className={`result-sheet ${
          isDragging
            ? "result-sheet--dragging"
            : ""
        }`}
        style={{
          height:
            `${sheetHeight}dvh`,
        }}
      >
        <div
          className="result-sheet-drag-area"
          onPointerDown={
            handleSheetPointerDown
          }
          onPointerMove={
            handleSheetPointerMove
          }
          onPointerUp={
            handleSheetPointerUp
          }
          onPointerCancel={
            handleSheetPointerCancel
          }
        >
          <div className="result-sheet-handle" />
        </div>

        <div
          ref={
            sheetScrollRef
          }
          className="result-sheet-scroll"
        >
          {/* HEADER */}

          <header className="result-sheet-header">
            <div>
              <h1>
                {
                  candidate.name
                }
              </h1>

              <p>
                추천 중간 지점 · 이동시간 차이{" "}
                {
                  gapMinutes
                }
                분
              </p>
            </div>

            <div className="result-fairness-badge">
              차이{" "}
              {
                gapMinutes
              }
              분 🎉
            </div>
          </header>

          {/* TIMES */}

          <div className="result-travel-summary">
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

                return (
                  <div
                    key={
                      participant.id
                    }
                    className="result-travel-chip"
                  >
                    <span
                      className="result-participant-dot"
                      style={{
                        background:
                          color.color,
                      }}
                    />

                    {
                      participant.nickname
                    }{" "}

                    {participant.travelTime !==
                    null
                      ? `${participant.travelTime}분`
                      : "조회 실패"}
                  </div>
                );
              }
            )}
          </div>

          {/* =================================================
              PLACES
          ================================================= */}

          {sheetMode ===
            "places" && (
            <>
              <div className="result-place-heading">
                <h2>
                  추천 장소
                </h2>

                <button
                  type="button"
                  onClick={
                    handleShowWeather
                  }
                >
                  결과 이유 ›
                </button>
              </div>

              {isLoadingPlaces && (
                <div className="result-message">
                  주변 장소를 찾고 있어요...
                </div>
              )}

              {!isLoadingPlaces &&
                placeError && (
                  <div className="result-message result-message--error">
                    <strong>
                      주변 장소를 불러오지 못했어요.
                    </strong>

                    <p>
                      {
                        placeError
                      }
                    </p>
                  </div>
                )}

              {!isLoadingPlaces &&
                !placeError &&
                places.length ===
                  0 && (
                  <div className="result-message">
                    선택한 장소 유형의 주변 장소가 없어요.
                  </div>
                )}

              <div className="result-place-list">
                {places.map(
                  (
                    place
                  ) => {
                    const selected =
                      selectedPlaceId ===
                      place.id;

                    const type =
                      normalizePlaceType(
                        place.type ??
                        place.category
                      );

                    const distance =
                      toFiniteNumber(
                        place.distanceMeters ??
                        place.distanceM
                      );

                    return (
                      <article
                        key={
                          place.id
                        }
                        className={`result-place-card ${
                          selected
                            ? "result-place-card--selected"
                            : ""
                        }`}
                        onClick={() =>
                          handlePlaceClick(
                            place
                          )
                        }
                      >
                        <div className="result-place-main">
                          <div className="result-place-image">
                            {
                              CATEGORY_ICONS[
                                type
                              ] ??
                              "📍"
                            }
                          </div>

                          <div className="result-place-content">
                            <div className="result-place-name-row">
                              <h3>
                                {
                                  place.name
                                }
                              </h3>

                              {distance !==
                                null && (
                                <span>
                                  {
                                    distance
                                  }
                                  m
                                </span>
                              )}
                            </div>

                            <div className="result-place-tags">
                              <span>
                                {
                                  CATEGORY_LABELS[
                                    type
                                  ] ??
                                  "장소"
                                }
                              </span>

                              <span>
                                {
                                  candidate.name
                                }{" "}
                                인근
                              </span>
                            </div>

                            <p className="result-place-address">
                              {place.roadAddress ||
                                place.address ||
                                "주소 정보 없음"}
                            </p>

                            <div className="result-place-reason">
                              <span>
                                💡
                              </span>

                              <p>
                                {
                                  getPlaceReason(
                                    place
                                  )
                                }
                              </p>
                            </div>

                            <div className="result-place-times">
                              {participants.map(
                                (
                                  participant,
                                  index
                                ) => {
                                  const participantColor =
                                    PARTICIPANT_COLORS[
                                      index
                                    ] ??
                                    PARTICIPANT_COLORS[0];

                                  return (
                                    <span
                                      key={`${place.id}-${participant.id}`}
                                      className="result-place-time"
                                      style={{
                                        background:
                                          participantColor.softColor,
                                      }}
                                    >
                                      {
                                        participant.nickname
                                      }{" "}

                                      {participant.travelTime !==
                                      null
                                        ? `${participant.travelTime}분`
                                        : "-"}
                                    </span>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        </div>

                        {selected && (
                          <button
                            type="button"
                            className="result-select-place-button"
                            disabled={
                              isConfirming
                            }
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleConfirmPlace();
                            }}
                          >
                            {isConfirming
                              ? "저장 중..."
                              : "이 장소 선택하기 →"}
                          </button>
                        )}
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

          {/* =================================================
              RESULT REASON
          ================================================= */}

          {sheetMode ===
            "weather" && (
            <section className="result-weather-detail">
              <div className="result-weather-detail-header">
                <div>
                  <h2>
                    날씨 & 이동 정보
                  </h2>

                  <p>
                    약속 시간과 추천 지역 기준이에요
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleBackToPlaces
                  }
                >
                  추천 장소
                </button>
              </div>

              {/* WEATHER */}

              {weather ? (
                <article className="result-weather-info-card">
                  <span className="result-weather-info-icon">
                    {
                      simpleWeather.icon
                    }
                  </span>

                  <div className="result-reason-content">
                    <strong>
                      {
                        meetingDateTimeText
                      }
                      {" · "}
                      {
                        simpleWeather.label
                      }
                    </strong>

                    <p>
                      기온{" "}
                      {
                        weather.temperature
                      }
                      ℃ · 강수확률{" "}
                      {
                        weather.precipitationProbability ??
                        0
                      }
                      %
                    </p>
                  </div>
                </article>
              ) : (
                <article className="result-weather-info-card">
                  <span className="result-weather-info-icon">
                    🌤️
                  </span>

                  <div className="result-reason-content">
                    <strong>
                      날씨 정보를 불러오지 못했어요
                    </strong>

                    <p>
                      {weatherError ||
                        "현재 날씨 정보를 사용할 수 없습니다."}
                    </p>
                  </div>
                </article>
              )}

              {/* WHY */}

              <article className="result-reason-card result-reason-card--highlight">
                <span className="result-weather-reason-icon">
                  💡
                </span>

                <div className="result-reason-content">
                  <strong>
                    왜 이 지역을 추천했나요?
                  </strong>

                  <p>
                    {
                      recommendationReason
                    }
                  </p>

                  {validTravelTimes.length >=
                    2 &&
                    minTravelTime !==
                      null &&
                    maxTravelTime !==
                      null && (
                      <div className="result-fairness-formula">
                        <span>
                          최소{" "}
                          {
                            minTravelTime
                          }
                          분
                        </span>

                        <strong>
                          →
                        </strong>

                        <span>
                          최대{" "}
                          {
                            maxTravelTime
                          }
                          분
                        </span>

                        <strong>
                          =
                        </strong>

                        <b>
                          차이{" "}
                          {
                            gapMinutes
                          }
                          분
                        </b>
                      </div>
                    )}
                </div>
              </article>

              {/* BASIS */}

              <article className="result-reason-card">
                <span className="result-weather-reason-icon">
                  🚇
                </span>

                <div className="result-reason-content">
                  <strong>
                    어떤 기준으로 계산했나요?
                  </strong>

                  <p>
                    각 참여자의 출발지에서{" "}
                    <b>
                      {
                        candidate.name
                      }
                    </b>
                    까지 실제 대중교통 이동시간을 비교했어요.
                  </p>

                  <p className="result-reason-sub">
                    단순한 직선거리의 중간이 아니라 참여자들의 실제 이동 부담이 최대한 고르게 분배되는 후보를 우선 추천해요.
                  </p>
                </div>
              </article>

              {/* PEOPLE */}

              <div className="result-weather-travel-list">
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

                    return (
                      <article
                        key={
                          participant.id
                        }
                        className="result-weather-travel-card"
                      >
                        <div
                          className="result-weather-avatar"
                          style={{
                            background:
                              color.color,

                            color:
                              color.textColor,
                          }}
                        >
                          {participant.nickname
                            ?.trim()
                            ?.charAt(0) ??
                            "?"}
                        </div>

                        <div className="result-weather-person">
                          <strong>
                            {
                              participant.nickname
                            }

                            {participant.isHost &&
                              " (호스트)"}
                          </strong>

                          <span>
                            대중교통
                          </span>
                        </div>

                        <strong className="result-weather-minute">
                          {participant.travelTime !==
                          null
                            ? `${participant.travelTime}분`
                            : "-"}
                        </strong>
                      </article>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default ResultPage;