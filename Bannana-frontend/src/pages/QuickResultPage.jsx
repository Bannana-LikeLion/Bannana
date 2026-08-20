import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import WeatherMapEffect, {
  getSimpleWeather,
} from "../components/common/WeatherMapEffect";

import {
  getNearbyPlaces,
  getWeather,
} from "../api/bannanaApi";

import "./ResultPage.css";

/* =====================================================
   STORAGE
===================================================== */

const QUICK_RECOMMENDATION_STORAGE_KEY =
  "bannana-quick-recommendation";

const QUICK_SELECTED_PLACE_KEY =
  "bannana-quick-selected-place";

/* =====================================================
   SHEET
===================================================== */

const SHEET_SNAP_POINTS = [
  38,
  63,
  90,
];

const MIN_SHEET_HEIGHT = 38;
const MAX_SHEET_HEIGHT = 90;

/* =====================================================
   COLORS
===================================================== */

const PARTICIPANT_COLORS = [
  {
    color: "#f0c936",
    textColor: "#21190f",
    softColor: "#fff1b6",
  },

  {
    color: "#e87570",
    textColor: "#21190f",
    softColor: "#ffe0dd",
  },

  {
    color: "#79cec5",
    textColor: "#21190f",
    softColor: "#dff4f1",
  },

  {
    color: "#7144df",
    textColor: "#ffffff",
    softColor: "#ede5ff",
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
   HELPERS
===================================================== */

function readRecommendation() {
  try {
    const saved =
      sessionStorage.getItem(
        QUICK_RECOMMENDATION_STORAGE_KEY
      );

    return saved
      ? JSON.parse(saved)
      : null;
  } catch (error) {
    console.error(
      "빠른 장소 추천 읽기 실패:",
      error
    );

    return null;
  }
}

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

function normalizePlaceType(
  value
) {
  const type =
    String(value ?? "")
      .trim()
      .toUpperCase();

  return type ===
    "CULTURE"
    ? "EXHIBITION"
    : type;
}

function getTravelTime(
  candidate,
  participant,
  index
) {
  const travelTimes =
    candidate?.travel_times;

  if (!travelTimes) {
    return null;
  }

  if (
    !Array.isArray(
      travelTimes
    )
  ) {
    const value =
      travelTimes[
        participant.nickname
      ];

    return toFiniteNumber(
      value?.minutes ??
      value?.travelTime ??
      value?.travel_time ??
      value
    );
  }

  const value =
    travelTimes[index];

  return toFiniteNumber(
    value?.minutes ??
    value?.travelTime ??
    value?.travel_time ??
    value
  );
}

/* =====================================================
   PAGE
===================================================== */

function QuickResultPage() {
  const navigate =
    useNavigate();

  const recommendationData =
    useMemo(
      () =>
        readRecommendation(),
      []
    );

  const candidate =
    recommendationData
      ?.candidates?.[0] ??
    null;

  const settings =
    recommendationData
      ?.settings ??
    null;

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
    focusLocation,
    setFocusLocation,
  ] = useState(null);

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
      const source =
        recommendationData
          ?.participants ??
        [];

      return source
        .slice(0, 6)
        .map(
          (
            participant,
            index
          ) => ({
            id:
              participant.id ??
              index,

            nickname:
              participant.nickname,

            originText:
              participant.originText,

            originLat:
              toFiniteNumber(
                participant.originLat
              ),

            originLng:
              toFiniteNumber(
                participant.originLng
              ),

            travelTime:
              getTravelTime(
                candidate,
                participant,
                index
              ),
          })
        );
    }, [
      recommendationData,
      candidate,
    ]);

  /* =====================================================
     TIMES
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
            Number.isFinite
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

  const gapMinutes =
    toFiniteNumber(
      candidate?.gap_minutes
    ) ??
    (
      minTravelTime !== null &&
      maxTravelTime !== null
        ? maxTravelTime -
          minTravelTime
        : 0
    );

  /* =====================================================
     DATETIME
  ===================================================== */

  const meetingDateTime =
    useMemo(() => {
      if (
        !settings
          ?.meetingDate ||
        !settings
          ?.meetingTime
      ) {
        return null;
      }

      const time =
        settings.meetingTime
          .length === 5
          ? `${settings.meetingTime}:00`
          : settings.meetingTime;

      return `${settings.meetingDate}T${time}`;
    }, [settings]);

  const meetingDateTimeText =
    useMemo(() => {
      if (
        !meetingDateTime
      ) {
        return "";
      }

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
      ).format(
        new Date(
          meetingDateTime
        )
      );
    }, [meetingDateTime]);

  const placeTypes =
    useMemo(
      () =>
        (
          settings
            ?.preferredCategories ??
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
      [settings]
    );

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    if (!candidate) {
      return undefined;
    }

    const lat =
      toFiniteNumber(
        candidate.lat
      );

    const lng =
      toFiniteNumber(
        candidate.lng
      );

    if (
      lat === null ||
      lng === null
    ) {
      return undefined;
    }

    const loadData =
      async () => {
        try {
          setIsLoadingPlaces(
            true
          );

          setPlaceError("");

          const response =
            await getNearbyPlaces({
              lat,
              lng,
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

        if (
          !meetingDateTime
        ) {
          return;
        }

        try {
          setWeatherError("");

          const response =
            await getWeather({
              lat,
              lng,
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
     ★ WEATHER
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
     MAP
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
              `quick-participant-${participant.id}`,

            type:
              "participant",

            lat:
              participant.originLat,

            lng:
              participant.originLng,

            initial:
              participant.nickname
                ?.charAt(0) ??
              "?",

            color:
              color.color,

            textColor:
              color.textColor,
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
            "quick-midpoint",

          type:
            "midpoint",

          lat:
            midpointLat,

          lng:
            midpointLng,

          initial:
            "🍌",

          color:
            "#f4cf45",

          textColor:
            "#21190f",

          zIndex: 300,
        });
      }

      places.forEach(
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
              `quick-place-${place.id}`,

            type:
              "place",

            lat,
            lng,

            initial:
              String(
                index + 1
              ),

            color:
              "#ffffff",

            textColor:
              "#21190f",
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
     REASON
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
        return `${candidate.name}은 참여자들의 출발지와 대중교통 접근성을 기준으로 계산된 후보예요.`;
      }

      if (
        gapMinutes <= 5
      ) {
        return `${candidate.name}은 참여자별 실제 대중교통 이동시간 차이가 ${gapMinutes}분으로 매우 작아, 이동 부담이 가장 고르게 분배되는 지역이에요.`;
      }

      return `${candidate.name}은 참여자들의 실제 대중교통 이동시간을 비교해 선정됐으며, 현재 이동시간 차이는 ${gapMinutes}분이에요.`;
    }, [
      candidate,
      gapMinutes,
      validTravelTimes.length,
    ]);

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
          ) =>
            Math.abs(
              current -
              point
            ) <
            Math.abs(
              current -
              closest
            )
              ? point
              : closest,
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

  const resetSheetScroll =
    () => {
      requestAnimationFrame(
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
        lat,
        lng,
        requestId:
          Date.now(),
      });
    }
  };

  const handleConfirmPlace = (
    place
  ) => {
    sessionStorage.setItem(
      QUICK_SELECTED_PLACE_KEY,
      JSON.stringify({
        ...place,

        midpoint: {
          name:
            candidate.name,

          lat:
            candidate.lat,

          lng:
            candidate.lng,
        },

        participants,

        candidate,

        weather,

        simpleWeather,

        settings,

        timeDifference:
          gapMinutes,
      })
    );

    navigate(
      "/quick/confirmed"
    );
  };

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    !recommendationData ||
    !candidate
  ) {
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
                "/quick"
              )
            }
          >
            다시 계산하기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`result-page result-page--${simpleWeather.key.toLowerCase()}`}
    >
      {/* MAP */}

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
          />
        </div>

        {/* ★ 비 / 눈 지도 효과 */}

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
            navigate(
              "/quick/origins"
            )
          }
        >
          ←
        </button>

        {/* ★ 이제 흐림이어도
            해 + 흐림처럼 섞이지 않음 */}

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

        <div
          className="result-map-participant-chips"
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
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* SHEET */}

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
            snapToNearestPoint
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
                      : "-"}
                  </div>
                );
              }
            )}
          </div>

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

              {placeError && (
                <div className="result-message result-message--error">
                  {
                    placeError
                  }
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

                              <span>
                                {
                                  place.distanceMeters ??
                                  "-"
                                }
                                m
                              </span>
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

                            <div className="result-place-times">
                              {participants.map(
                                (
                                  participant,
                                  index
                                ) => (
                                  <span
                                    key={`${place.id}-${participant.id}`}
                                    className="result-place-time"
                                    style={{
                                      background:
                                        PARTICIPANT_COLORS[
                                          index
                                        ]?.softColor ??
                                        "#f4f0e5",
                                    }}
                                  >
                                    {
                                      participant.nickname
                                    }{" "}
                                    {
                                      participant.travelTime ??
                                      "-"
                                    }
                                    {participant.travelTime !==
                                      null &&
                                      "분"}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {selected && (
                          <button
                            type="button"
                            className="result-select-place-button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleConfirmPlace(
                                place
                              );
                            }}
                          >
                            이 장소 선택하기 →
                          </button>
                        )}
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

          {/* RESULT REASON */}

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

                  <div>
                    <strong>
                      날씨 정보를 불러오지 못했어요
                    </strong>

                    <p>
                      {
                        weatherError
                      }
                    </p>
                  </div>
                </article>
              )}

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

                  {minTravelTime !==
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

              <article className="result-reason-card">
                <span className="result-weather-reason-icon">
                  🚇
                </span>

                <div className="result-reason-content">
                  <strong>
                    어떤 기준으로 계산했나요?
                  </strong>

                  <p>
                    참여자들의 실제 대중교통 이동시간을 비교해서 이동 부담이 최대한 비슷해지는 지역을 우선 추천했어요.
                  </p>
                </div>
              </article>

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
                            ?.charAt(0) ??
                            "?"}
                        </div>

                        <div className="result-weather-person">
                          <strong>
                            {
                              participant.nickname
                            }
                          </strong>

                          <span>
                            대중교통
                          </span>
                        </div>

                        <strong className="result-weather-minute">
                          {
                            participant.travelTime ??
                            "-"
                          }
                          {participant.travelTime !==
                            null &&
                            "분"}
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

export default QuickResultPage;