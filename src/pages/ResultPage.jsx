import {
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  
  import {
    useNavigate,
    useParams,
    useSearchParams,
  } from "react-router-dom";
  
  import {
    getMockResultByWeather,
    getMockRoom,
    mockApiError,
    mockEmptyResult,
  } from "../data/mockData";
  
  import "./ResultPage.css";
  
  /* =====================================================
     BOTTOM SHEET SNAP POINT
  
     1단계 : 38%
     2단계 : 63%
     3단계 : 90%
  ===================================================== */
  
  const SHEET_SNAP_POINTS = [
    38,
    63,
    90,
  ];
  
  const MIN_SHEET_HEIGHT = 38;
  const MAX_SHEET_HEIGHT = 90;
  
  const PARTICIPANT_STORAGE_KEY =
    "bannana-current-participant";
  
  /* =====================================================
     Participant Flow에서 입력한 사용자 읽기
  ===================================================== */
  
  function readCurrentParticipant() {
    try {
      const saved =
        sessionStorage.getItem(
          PARTICIPANT_STORAGE_KEY
        );
  
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(
        "참여자 정보 읽기 실패:",
        error
      );
    }
  
    return null;
  }
  
  /* =====================================================
     RESULT PAGE
  ===================================================== */
  
  function ResultPage() {
    const navigate =
      useNavigate();
  
    const { roomId } =
      useParams();
  
    const [searchParams] =
      useSearchParams();
  
    /* =====================================================
       BOTTOM SHEET STATE
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
  
    const dragStartYRef =
      useRef(0);
  
    const dragStartHeightRef =
      useRef(38);
  
    const currentHeightRef =
      useRef(38);
  
    /* =====================================================
       QUERY PARAM
    ===================================================== */
  
    const weatherParam =
      searchParams
        .get("weather")
        ?.toUpperCase() ??
      "RAIN";
  
    const stateParam =
      searchParams.get("state");
  
    /* =====================================================
       ROOM DATA
    ===================================================== */
  
    const room =
      useMemo(
        () => getMockRoom(),
        []
      );
  
    const storedParticipant =
      useMemo(
        () =>
          readCurrentParticipant(),
        []
      );
  
    /* =====================================================
       RESULT DATA
    ===================================================== */
  
    const result =
      useMemo(() => {
        if (
          stateParam === "empty"
        ) {
          return mockEmptyResult;
        }
  
        const rawResult =
          getMockResultByWeather(
            weatherParam
          );
  
        const participants =
          (
            rawResult.participants ??
            []
          ).map(
            (
              participant,
              index
            ) => {
              /*
                첫 번째 참여자
                = 호스트
              */
  
              if (index === 0) {
                return {
                  ...participant,
  
                  nickname:
                    room.host
                      ?.nickname ??
                    participant.nickname,
  
                  originText:
                    room.host
                      ?.origin
                      ?.text ??
                    participant.originText,
  
                  isHost: true,
                };
              }
  
              /*
                네 번째 참여자
                = Participant Flow에서 입력한 사람
              */
  
              if (
                participant.id === 4 &&
                storedParticipant
              ) {
                return {
                  ...participant,
  
                  nickname:
                    storedParticipant.nickname,
  
                  originText:
                    storedParticipant.originText,
  
                  isHost: false,
                };
              }
  
              return participant;
            }
          );
  
        return {
          ...rawResult,
          participants,
        };
      }, [
        room,
        stateParam,
        storedParticipant,
        weatherParam,
      ]);
  
    /* =====================================================
       ERROR / EMPTY
    ===================================================== */
  
    const isError =
      stateParam === "error";
  
    const isEmpty =
      !isError &&
      (
        !result?.midpoint ||
        !result?.places ||
        result.places.length === 0
      );
  
    /* =====================================================
       RESULT 변경 시 초기화
    ===================================================== */
  
    useEffect(() => {
      setSheetMode(
        "places"
      );
  
      setSelectedPlaceId(
        null
      );
  
      setSheetHeight(
        38
      );
  
      currentHeightRef.current =
        38;
  
      setIsDragging(
        false
      );
    }, [
      roomId,
      stateParam,
      weatherParam,
    ]);
  
    /* =====================================================
       WEATHER
    ===================================================== */
  
    const weatherMeta = {
      CLEAR: {
        icon: "☀️",
        label: "맑음",
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
  
    const weatherCondition =
      result?.weather
        ?.condition ??
      "CLEAR";
  
    const currentWeather =
      weatherMeta[
        weatherCondition
      ] ??
      weatherMeta.CLEAR;
  
    /* =====================================================
       CATEGORY
    ===================================================== */
  
    const categoryLabel = {
      CAFE: "카페",
      RESTAURANT: "식당",
      CULTURE: "문화",
    };
  
    /* =====================================================
       DRAG START
    ===================================================== */
  
    const handleSheetPointerDown =
      (event) => {
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
  
    /* =====================================================
       DRAG MOVE
    ===================================================== */
  
    const handleSheetPointerMove =
      (event) => {
        if (!isDragging) {
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
  
    /* =====================================================
       SNAP
    ===================================================== */
  
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
  
        setSheetHeight(
          nearest
        );
  
        setIsDragging(
          false
        );
      };
  
    /* =====================================================
       DRAG END
    ===================================================== */
  
    const handleSheetPointerUp =
      (event) => {
        if (!isDragging) {
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
       WEATHER DETAIL
    ===================================================== */
  
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
      };
  
    /* =====================================================
       PLACE SELECT
    ===================================================== */
  
    const handlePlaceClick = (
      placeId
    ) => {
      setSelectedPlaceId(
        placeId
      );
    };
  
    const handleConfirmPlace =
      () => {
        const selectedPlace =
          result.places.find(
            (place) =>
              place.id ===
              selectedPlaceId
          );
  
        if (!selectedPlace) {
          return;
        }
  
        navigate(
          `/room/${roomId}/confirmed`,
          {
            state: {
              selectedPlace,
              result,
            },
          }
        );
      };
  
    /* =====================================================
       ERROR
    ===================================================== */
  
    if (isError) {
      return (
        <main className="result-state-page">
          <section className="result-state-card">
            <div className="result-state-icon">
              ⚠️
            </div>
  
            <h1>
              {
                mockApiError.message
              }
            </h1>
  
            <p>
              {
                mockApiError.description
              }
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
              다시 시도하기
            </button>
          </section>
        </main>
      );
    }
  
    /* =====================================================
       EMPTY
    ===================================================== */
  
    if (isEmpty) {
      return (
        <main className="result-page result-page--clear">
          <section className="result-map">
            <div className="result-map__road result-map__road--vertical" />
  
            <div className="result-map__road result-map__road--horizontal" />
  
            <div className="result-map__yellow-road" />
  
            <div className="result-map__green" />
  
            <div className="result-map__water" />
  
            <button
              type="button"
              className="result-map-back"
              onClick={() =>
                navigate(-1)
              }
            >
              ←
            </button>
          </section>
  
          <section className="result-empty-sheet">
            <div className="result-sheet-handle" />
  
            <div className="result-empty-icon">
              🗺️
            </div>
  
            <h1>
              조건에 맞는 장소가 없어요
            </h1>
  
            <p>
              현재 선택한 장소 유형과
              이동 거리에 맞는 장소를
              찾지 못했어요.
            </p>
  
            <button
              type="button"
              className="result-empty-primary"
              onClick={() =>
                navigate(-1)
              }
            >
              검색 범위 넓히기
            </button>
  
            <button
              type="button"
              className="result-empty-secondary"
              onClick={() =>
                navigate(-1)
              }
            >
              조건 다시 설정
            </button>
          </section>
        </main>
      );
    }
  
    /* =====================================================
       RESULT
    ===================================================== */
  
    return (
      <main
        className={`result-page result-page--${weatherCondition.toLowerCase()}`}
      >
        {/* =================================================
            MAP
        ================================================= */}
  
        <section className="result-map">
          <div className="result-map__road result-map__road--vertical" />
  
          <div className="result-map__road result-map__road--horizontal" />
  
          <div className="result-map__yellow-road" />
  
          <div className="result-map__green" />
  
          <div className="result-map__water" />
  
          <div className="result-map__building result-map__building--left" />
  
          <div className="result-map__building result-map__building--right" />
  
          {/* BACK */}
  
          <button
            type="button"
            className="result-map-back"
            onClick={() =>
              navigate(-1)
            }
          >
            ←
          </button>
  
          {/* WEATHER */}
  
          <button
            type="button"
            className="result-weather-badge"
            onClick={
              handleShowWeather
            }
          >
            <span className="result-weather-badge__icon">
              {
                currentWeather.icon
              }
            </span>
  
            <span>
              <strong>
                {
                  currentWeather.label
                }
              </strong>
  
              <small>
                강수{" "}
                {
                  result.weather
                    ?.rainProbability ??
                  0
                }
                %
              </small>
            </span>
          </button>
  
          {/* ZOOM */}
  
          <div className="result-map-control">
            <button type="button">
              ＋
            </button>
  
            <button type="button">
              −
            </button>
          </div>
  
          {/* =============================================
              PARTICIPANT LEGEND
  
              핵심 수정:
              Bottom Sheet 바로 위에 위치.
  
              sheetHeight가
              38 → 63 → 90
              으로 변할 때 같이 이동.
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
            {result.participants.map(
              (
                participant,
                index
              ) => (
                <div
                  key={
                    participant.id
                  }
                  className="result-map-participant-chip"
                >
                  <span
                    className={`result-participant-dot result-participant-dot--${
                      index + 1
                    }`}
                  />
  
                  {
                    participant.nickname
                  }
                </div>
              )
            )}
          </div>
  
          {/* PARTICIPANT MARKERS */}
  
          {result.participants.map(
            (
              participant,
              index
            ) => (
              <div
                key={
                  participant.id
                }
                className={`result-map-person result-map-person--${
                  index + 1
                }`}
              >
                {participant.nickname.charAt(
                  0
                )}
              </div>
            )
          )}
  
          {/* MIDPOINT */}
  
          <div className="result-midpoint">
            <div className="result-midpoint-label">
              <strong>
                {
                  result.midpoint.name
                }
              </strong>
  
              <span>
                추천 중간 지점
              </span>
            </div>
  
            <div className="result-midpoint-pin">
              🍌
            </div>
          </div>
        </section>
  
        {/* =================================================
            BOTTOM SHEET
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
          {/* DRAG */}
  
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
  
          {/* CONTENT */}
  
          <div className="result-sheet-scroll">
            {/* HEADER */}
  
            <header className="result-sheet-header">
              <div>
                <h1>
                  {
                    result.midpoint.name
                  }
                </h1>
  
                <p>
                  추천 중간 지점 ·
                  이동시간 차이{" "}
                  {
                    result.fairness
                      ?.timeDifference ??
                    0
                  }
                  분
                </p>
              </div>
  
              <div className="result-fairness-badge">
                차이{" "}
                {
                  result.fairness
                    ?.timeDifference ??
                  0
                }
                분 🎉
              </div>
            </header>
  
            {/* TRAVEL */}
  
            <div className="result-travel-summary">
              {result.participants.map(
                (
                  participant,
                  index
                ) => (
                  <div
                    key={
                      participant.id
                    }
                    className="result-travel-chip"
                  >
                    <span
                      className={`result-participant-dot result-participant-dot--${
                        index + 1
                      }`}
                    />
  
                    {
                      participant.nickname
                    }{" "}
                    {
                      participant.travelTime
                    }
                    분
                  </div>
                )
              )}
            </div>
  
            {/* =================================================
                PLACE MODE
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
  
                <div className="result-place-list">
                  {result.places.map(
                    (
                      place,
                      placeIndex
                    ) => {
                      const selected =
                        selectedPlaceId ===
                        place.id;
  
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
                              place.id
                            )
                          }
                        >
                          <div className="result-place-main">
                            <div className="result-place-image">
                              {place.category ===
                              "CAFE"
                                ? "☕"
                                : place.category ===
                                    "RESTAURANT"
                                  ? "🍽️"
                                  : "🎨"}
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
                                    place.distanceM
                                  }
                                  m
                                </span>
                              </div>
  
                              <div className="result-place-tags">
                                <span>
                                  {
                                    categoryLabel[
                                      place.category
                                    ] ??
                                    "장소"
                                  }
                                </span>
  
                                {place.indoor && (
                                  <span className="result-tag-green">
                                    실내
                                  </span>
                                )}
  
                                <span>
                                  도보{" "}
                                  {
                                    place.walkMinutes
                                  }
                                  분
                                </span>
                              </div>
  
                              <div className="result-place-times">
                                {result.participants.map(
                                  (
                                    participant,
                                    index
                                  ) => (
                                    <span
                                      key={`${place.id}-${participant.id}`}
                                      className={`result-place-time result-place-time--${
                                        index + 1
                                      }`}
                                    >
                                      {
                                        participant.nickname
                                      }{" "}
                                      {participant.travelTime +
                                        placeIndex}
                                      분
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
  
                                handleConfirmPlace();
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
  
            {/* =================================================
                WEATHER MODE
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
                      약속 시간과 추천
                      지역 기준이에요
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
  
                {/* WEATHER INFO */}
  
                <article className="result-weather-info-card">
                  <span className="result-weather-info-icon">
                    {
                      currentWeather.icon
                    }
                  </span>
  
                  <div>
                    <strong>
                      토요일 오후 3시 ·{" "}
                      {
                        currentWeather.label
                      }
                    </strong>
  
                    <p>
                      {
                        result.weather
                          ?.description
                      }
                    </p>
                  </div>
                </article>
  
                {/* WHY */}
  
                <article className="result-weather-reason-card">
                  <span className="result-weather-reason-icon">
                    💡
                  </span>
  
                  <div>
                    <strong>
                      왜 이 장소를 추천했나요?
                    </strong>
  
                    <p>
                      {
                        result.recommendationReason
                      }
                    </p>
                  </div>
                </article>
  
                {/* FORECAST */}
  
                <section className="result-weather-forecast">
                  <div className="result-weather-forecast-top">
                    <div>
                      <span>
                        토요일 오후 3시
                      </span>
  
                      <strong>
                        {
                          result.weather
                            ?.temperature ??
                          22
                        }
                        ℃
                      </strong>
  
                      <small>
                        {
                          currentWeather.label
                        }
                      </small>
                    </div>
  
                    <div className="result-rain-probability">
                      <span>
                        강수확률
                      </span>
  
                      <strong>
                        {
                          result.weather
                            ?.rainProbability ??
                          0
                        }
                        %
                      </strong>
                    </div>
                  </div>
  
                  {/* HOURLY */}
  
                  <div className="result-hourly-weather">
                    {[
                      {
                        time: "오후 1시",
                        offset: -2,
                      },
                      {
                        time: "오후 2시",
                        offset: -1,
                      },
                      {
                        time: "오후 3시",
                        offset: 0,
                      },
                      {
                        time: "오후 4시",
                        offset: -1,
                      },
                      {
                        time: "오후 5시",
                        offset: -2,
                      },
                    ].map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.time
                          }
                          className={`result-hourly-item ${
                            index === 2
                              ? "result-hourly-item--active"
                              : ""
                          }`}
                        >
                          <span>
                            {
                              item.time
                            }
                          </span>
  
                          <strong>
                            {
                              currentWeather.icon
                            }
                          </strong>
  
                          <small>
                            {(result.weather
                              ?.temperature ??
                              22) +
                              item.offset}
                            ℃
                          </small>
                        </div>
                      )
                    )}
                  </div>
                </section>
  
                {/* PARTICIPANTS */}
  
                <div className="result-weather-travel-list">
                  {result.participants.map(
                    (
                      participant,
                      index
                    ) => (
                      <article
                        key={
                          participant.id
                        }
                        className="result-weather-travel-card"
                      >
                        <div
                          className={`result-weather-avatar result-weather-avatar--${
                            index + 1
                          }`}
                        >
                          {participant.nickname.charAt(
                            0
                          )}
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
                            participant.travelTime
                          }
                          분
                        </strong>
                      </article>
                    )
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