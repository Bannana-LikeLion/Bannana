import {
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import "./QuickResultPage.css";
  
  /* =====================================================
     STORAGE
  ===================================================== */
  
  const QUICK_SETTINGS_STORAGE_KEY =
    "bannana-quick-settings";
  
  const QUICK_PARTICIPANTS_STORAGE_KEY =
    "bannana-quick-participants";
  
  const QUICK_SELECTED_PLACE_KEY =
    "bannana-quick-selected-place";
  
  /* =====================================================
     BOTTOM SHEET
  
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
  
  /* =====================================================
     PARTICIPANT COLORS
  
     최대 6명
  ===================================================== */
  
  const PARTICIPANT_COLORS = [
    "#F0C936",
    "#E87570",
    "#79CEC5",
    "#7144DF",
    "#E7A3C2",
    "#F0A65A",
  ];
  
  /* =====================================================
     Mock 이동시간
  
     추후 ODsay API 결과로 교체
  ===================================================== */
  
  const BASE_TRAVEL_TIMES = [
    36,
    39,
    41,
    38,
    40,
    37,
  ];
  
  /* =====================================================
     Mock 추천 장소
  
     평점 제거
  
     추후 Kakao Local API +
     Backend recommendation 결과로 교체
  ===================================================== */
  
  const MOCK_PLACES = [
    {
      id: 1,
  
      name:
        "카페 어니언 성수",
  
      category:
        "CAFE",
  
      distanceM: 200,
  
      walkMinutes: 3,
  
      indoor: true,
  
      icon: "☕",
  
      tags: [
        "역에서 5분",
        "우천시 추천",
      ],
    },
  
    {
      id: 2,
  
      name:
        "오스테리아 오르조",
  
      category:
        "RESTAURANT",
  
      distanceM: 350,
  
      walkMinutes: 5,
  
      indoor: true,
  
      icon: "🍝",
  
      tags: [
        "예약 가능",
        "우천시 추천",
      ],
    },
  
    {
      id: 3,
  
      name:
        "서울숲 공원",
  
      category:
        "PARK",
  
      distanceM: 500,
  
      walkMinutes: 7,
  
      indoor: false,
  
      icon: "🌳",
  
      tags: [
        "산책",
        "넓은 공간",
      ],
    },
  
    {
      id: 4,
  
      name:
        "성수 갤러리 플레이스",
  
      category:
        "CULTURE",
  
      distanceM: 600,
  
      walkMinutes: 8,
  
      indoor: true,
  
      icon: "🎨",
  
      tags: [
        "전시",
        "실내",
      ],
    },
  ];
  
  /* =====================================================
     STORAGE READ
  ===================================================== */
  
  function readStorage(
    key,
    fallback
  ) {
    try {
      const saved =
        sessionStorage.getItem(
          key
        );
  
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(
        "Quick 데이터 읽기 실패:",
        error
      );
    }
  
    return fallback;
  }
  
  /* =====================================================
     PAGE
  ===================================================== */
  
  function QuickResultPage() {
    const navigate =
      useNavigate();
  
    /* ===================================================
       STORAGE DATA
    =================================================== */
  
    const settings =
      useMemo(
        () =>
          readStorage(
            QUICK_SETTINGS_STORAGE_KEY,
            null
          ),
        []
      );
  
    const storedParticipants =
      useMemo(
        () =>
          readStorage(
            QUICK_PARTICIPANTS_STORAGE_KEY,
            []
          ),
        []
      );
  
    /* ===================================================
       PARTICIPANTS
  
       입력한 이름 + 출발지를 그대로 사용
       이동시간만 Mock
    =================================================== */
  
    const participants =
      useMemo(
        () =>
          storedParticipants
            .slice(0, 6)
            .map(
              (
                participant,
                index
              ) => ({
                ...participant,
  
                travelTime:
                  BASE_TRAVEL_TIMES[
                    index
                  ] ?? 40,
              })
            ),
        [
          storedParticipants,
        ]
      );
  
    /* ===================================================
       BOTTOM SHEET STATE
    =================================================== */
  
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
  
    /*
      PointerMove에서 state 갱신 시점에
      영향을 받지 않고 즉시 drag 여부를
      확인하기 위한 ref
    */
    const isDraggingRef =
      useRef(false);
  
    /* ===================================================
       입력 데이터 없을 때
    =================================================== */
  
    useEffect(() => {
      if (
        !settings ||
        participants.length < 2
      ) {
        navigate(
          "/quick/origins",
          {
            replace: true,
          }
        );
      }
    }, [
      navigate,
      participants.length,
      settings,
    ]);
  
    /* ===================================================
       RESULT DATA
    =================================================== */
  
    const travelTimes =
      participants.map(
        (participant) =>
          participant.travelTime
      );
  
    const minTravelTime =
      travelTimes.length
        ? Math.min(
            ...travelTimes
          )
        : 0;
  
    const maxTravelTime =
      travelTimes.length
        ? Math.max(
            ...travelTimes
          )
        : 0;
  
    const timeDifference =
      maxTravelTime -
      minTravelTime;
  
    /* ===================================================
       WEATHER Mock
  
       추후 기상청 API로 교체
    =================================================== */
  
    const weather = {
      condition:
        "RAIN",
  
      icon:
        "🌧️",
  
      label:
        "비",
  
      temperature:
        22,
  
      rainProbability:
        80,
  
      description:
        "약속 시간에 비가 예상돼요.",
    };
  
    /* ===================================================
       MIDPOINT Mock
  
       추후 Backend 알고리즘 결과로 교체
    =================================================== */
  
    const midpoint = {
      name:
        "성수동·서울숲",
    };
  
    /* ===================================================
       추천 이유
    =================================================== */
  
    const recommendationReason =
      "비가 예상되어 역에서 가깝고 실내에서 이용할 수 있는 카페와 식당을 우선 추천했어요.";
  
    /* ===================================================
       CATEGORY
    =================================================== */
  
    const categoryLabel = {
      CAFE:
        "카페",
  
      RESTAURANT:
        "식당",
  
      CULTURE:
        "전시",
  
      SHOPPING:
        "쇼핑",
  
      PARK:
        "공원",
    };
  
    /* ===================================================
       선택한 장소 유형 우선 필터링
    =================================================== */
  
    const preferredCategories =
      settings
        ?.preferredCategories ??
      [];
  
    const filteredPlaces =
      MOCK_PLACES.filter(
        (place) =>
          preferredCategories.includes(
            place.category
          )
      );
  
    /*
      데모에서 결과가 너무 적게 나오는 것을
      방지하기 위해 2개 미만이면 전체 Mock 표시
    */
    const places =
      filteredPlaces.length >= 2
        ? filteredPlaces
        : MOCK_PLACES;
  
    /* ===================================================
       DRAG START
    =================================================== */
  
    const handleSheetPointerDown =
      (event) => {
        isDraggingRef.current =
          true;
  
        setIsDragging(true);
  
        dragStartYRef.current =
          event.clientY;
  
        dragStartHeightRef.current =
          currentHeightRef.current;
  
        event.currentTarget
          .setPointerCapture(
            event.pointerId
          );
      };
  
    /* ===================================================
       DRAG MOVE
    =================================================== */
  
    const handleSheetPointerMove =
      (event) => {
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
  
    /* ===================================================
       SNAP
    =================================================== */
  
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
              const currentDistance =
                Math.abs(
                  current -
                    point
                );
  
              const closestDistance =
                Math.abs(
                  current -
                    closest
                );
  
              return currentDistance <
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
  
        setIsDragging(false);
  
        setSheetHeight(
          nearest
        );
      };
  
    /* ===================================================
       DRAG END
    =================================================== */
  
    const handleSheetPointerUp =
      (event) => {
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
  
    /* ===================================================
       WEATHER DETAIL
    =================================================== */
  
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
  
    /* ===================================================
       PLACE SELECT
    =================================================== */
  
    const handlePlaceClick = (
      placeId
    ) => {
      setSelectedPlaceId(
        placeId
      );
    };
  
    /*
      ★ 수정 핵심
  
      1. 선택한 장소
      2. 중간 지점
      3. 참여자 이동시간
      4. 날씨
      5. 추천 이유
  
      를 sessionStorage에 저장한 뒤
  
      /quick/confirmed 로 이동한다.
    */
    const handleConfirmPlace = (
      place
    ) => {
      const selectedResult = {
        ...place,
  
        midpoint:
          midpoint.name,
  
        participants,
  
        weather,
  
        recommendationReason,
  
        timeDifference,
      };
  
      try {
        sessionStorage.setItem(
          QUICK_SELECTED_PLACE_KEY,
          JSON.stringify(
            selectedResult
          )
        );
  
        navigate(
          "/quick/confirmed"
        );
      } catch (error) {
        console.error(
          "선택 장소 저장 실패:",
          error
        );
  
        alert(
          "장소 정보를 저장하지 못했습니다."
        );
      }
    };
  
    /* ===================================================
       데이터 로딩 전
    =================================================== */
  
    if (
      !settings ||
      participants.length < 2
    ) {
      return null;
    }
  
    /* ===================================================
       UI
    =================================================== */
  
    return (
      <main className="quick-result-page">
        {/* =================================================
            MAP
        ================================================= */}
  
        <section className="quick-result-map">
          {/* ROAD */}
  
          <div className="quick-result-map__road quick-result-map__road--vertical" />
  
          <div className="quick-result-map__road quick-result-map__road--horizontal" />
  
          <div className="quick-result-map__yellow-road" />
  
          {/* DECORATION */}
  
          <div className="quick-result-map__green" />
  
          <div className="quick-result-map__water" />
  
          <div className="quick-result-map__building quick-result-map__building--left" />
  
          <div className="quick-result-map__building quick-result-map__building--right" />
  
          {/* BACK */}
  
          <button
            type="button"
            className="quick-result-back"
            onClick={() =>
              navigate(
                "/quick/origins"
              )
            }
            aria-label="뒤로 가기"
          >
            ←
          </button>
  
          {/* WEATHER */}
  
          <button
            type="button"
            className="quick-result-weather-badge"
            onClick={
              handleShowWeather
            }
          >
            <span className="quick-result-weather-badge__icon">
              {weather.icon}
            </span>
  
            <span>
              <strong>
                {weather.label}
              </strong>
  
              <small>
                강수{" "}
                {
                  weather.rainProbability
                }
                %
              </small>
            </span>
          </button>
  
          {/* ZOOM */}
  
          <div className="quick-result-map-control">
            <button
              type="button"
            >
              ＋
            </button>
  
            <button
              type="button"
            >
              −
            </button>
          </div>
  
          {/* ===============================================
              PARTICIPANT LEGEND
  
              Bottom Sheet 높이에 따라
              같이 위아래로 이동
          =============================================== */}
  
          <div
            className={`quick-result-participant-chips ${
              isDragging
                ? "quick-result-participant-chips--dragging"
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
              ) => (
                <div
                  key={
                    participant.id ??
                    index
                  }
                  className="quick-result-participant-chip"
                >
                  <span
                    className="quick-result-participant-dot"
                    style={{
                      background:
                        PARTICIPANT_COLORS[
                          index
                        ],
                    }}
                  />
  
                  {
                    participant.nickname
                  }
                </div>
              )
            )}
          </div>
  
          {/* ===============================================
              PARTICIPANT MARKER
          =============================================== */}
  
          {participants.map(
            (
              participant,
              index
            ) => (
              <div
                key={
                  participant.id ??
                  index
                }
                className={`quick-result-map-person quick-result-map-person--${
                  index + 1
                }`}
                style={{
                  background:
                    PARTICIPANT_COLORS[
                      index
                    ],
                }}
              >
                {participant.nickname
                  ?.charAt(0) ??
                  "?"}
              </div>
            )
          )}
  
          {/* ===============================================
              MIDPOINT
          =============================================== */}
  
          <div className="quick-result-midpoint">
            <div className="quick-result-midpoint-label">
              <strong>
                {midpoint.name}
              </strong>
  
              <span>
                추천 중간 지점
              </span>
            </div>
  
            <div className="quick-result-midpoint-pin">
              🍌
            </div>
          </div>
        </section>
  
        {/* =================================================
            BOTTOM SHEET
        ================================================= */}
  
        <section
          className={`quick-result-sheet ${
            isDragging
              ? "quick-result-sheet--dragging"
              : ""
          }`}
          style={{
            height:
              `${sheetHeight}dvh`,
          }}
        >
          {/* ===============================================
              DRAG HANDLE
          =============================================== */}
  
          <div
            className="quick-result-sheet-drag-area"
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
            <div className="quick-result-sheet-handle" />
          </div>
  
          {/* ===============================================
              SCROLL CONTENT
          =============================================== */}
  
          <div className="quick-result-sheet-scroll">
            {/* HEADER */}
  
            <header className="quick-result-sheet-header">
              <div>
                <h1>
                  {midpoint.name}
                </h1>
  
                <p>
                  추천 중간 지점 ·
                  이동시간 차이{" "}
                  {
                    timeDifference
                  }
                  분
                </p>
              </div>
  
              <div className="quick-result-fairness">
                차이{" "}
                {
                  timeDifference
                }
                분 🎉
              </div>
            </header>
  
            {/* TRAVEL SUMMARY */}
  
            <div className="quick-result-travel-summary">
              {participants.map(
                (
                  participant,
                  index
                ) => (
                  <div
                    key={
                      participant.id ??
                      index
                    }
                    className="quick-result-travel-chip"
                  >
                    <span
                      className="quick-result-participant-dot"
                      style={{
                        background:
                          PARTICIPANT_COLORS[
                            index
                          ],
                      }}
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
                <div className="quick-result-place-heading">
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
  
                <div className="quick-result-place-list">
                  {places.map(
                    (
                      place,
                      placeIndex
                    ) => {
                      const isSelected =
                        selectedPlaceId ===
                        place.id;
  
                      return (
                        <article
                          key={
                            place.id
                          }
                          className={`quick-result-place-card ${
                            isSelected
                              ? "quick-result-place-card--selected"
                              : ""
                          }`}
                          onClick={() =>
                            handlePlaceClick(
                              place.id
                            )
                          }
                        >
                          <div className="quick-result-place-main">
                            {/* ICON */}
  
                            <div className="quick-result-place-image">
                              {
                                place.icon
                              }
                            </div>
  
                            {/* INFO */}
  
                            <div className="quick-result-place-content">
                              <div className="quick-result-place-name-row">
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
  
                              {/* TAG */}
  
                              <div className="quick-result-place-tags">
                                <span>
                                  {
                                    categoryLabel[
                                      place.category
                                    ] ??
                                    "장소"
                                  }
                                </span>
  
                                {place.indoor && (
                                  <span className="quick-result-tag-green">
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
  
                              {/* TRAVEL TIME */}
  
                              <div className="quick-result-place-times">
                                {participants.map(
                                  (
                                    participant,
                                    index
                                  ) => (
                                    <span
                                      key={`${place.id}-${participant.id ?? index}`}
                                      className="quick-result-place-time"
                                      style={{
                                        background:
                                          `${PARTICIPANT_COLORS[index]}2A`,
                                      }}
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
  
                              {/* EXTRA TAG */}
  
                              <div className="quick-result-extra-tags">
                                {place.tags.map(
                                  (
                                    tag
                                  ) => (
                                    <span
                                      key={
                                        tag
                                      }
                                    >
                                      {
                                        tag
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
  
                          {/* SELECT */}
  
                          {isSelected && (
                            <button
                              type="button"
                              className="quick-result-select-button"
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
  
            {/* =================================================
                WEATHER / REASON MODE
            ================================================= */}
  
            {sheetMode ===
              "weather" && (
              <section className="quick-result-weather-detail">
                <div className="quick-result-weather-detail-header">
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
  
                {/* WEATHER */}
  
                <article className="quick-result-weather-info-card">
                  <span className="quick-result-weather-info-icon">
                    {
                      weather.icon
                    }
                  </span>
  
                  <div>
                    <strong>
                      약속 시간 ·{" "}
                      {
                        weather.label
                      }
                    </strong>
  
                    <p>
                      {
                        weather.description
                      }
                    </p>
                  </div>
                </article>
  
                {/* WHY */}
  
                <article className="quick-result-weather-reason-card">
                  <span className="quick-result-weather-reason-icon">
                    💡
                  </span>
  
                  <div>
                    <strong>
                      왜 이 장소를
                      추천했나요?
                    </strong>
  
                    <p>
                      {
                        recommendationReason
                      }
                    </p>
                  </div>
                </article>
  
                {/* FORECAST */}
  
                <section className="quick-result-weather-forecast">
                  <div className="quick-result-weather-forecast-top">
                    <div>
                      <span>
                        약속 시간
                      </span>
  
                      <strong>
                        {
                          weather.temperature
                        }
                        ℃
                      </strong>
  
                      <small>
                        {
                          weather.label
                        }
                      </small>
                    </div>
  
                    <div className="quick-result-rain-probability">
                      <span>
                        강수확률
                      </span>
  
                      <strong>
                        {
                          weather.rainProbability
                        }
                        %
                      </strong>
                    </div>
                  </div>
  
                  {/* HOURLY */}
  
                  <div className="quick-result-hourly">
                    {[
                      {
                        time:
                          "오후 1시",
  
                        temp:
                          20,
                      },
  
                      {
                        time:
                          "오후 2시",
  
                        temp:
                          21,
                      },
  
                      {
                        time:
                          "오후 3시",
  
                        temp:
                          22,
                      },
  
                      {
                        time:
                          "오후 4시",
  
                        temp:
                          21,
                      },
  
                      {
                        time:
                          "오후 5시",
  
                        temp:
                          20,
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
                          className={`quick-result-hourly-item ${
                            index === 2
                              ? "quick-result-hourly-item--active"
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
                              weather.icon
                            }
                          </strong>
  
                          <small>
                            {
                              item.temp
                            }
                            ℃
                          </small>
                        </div>
                      )
                    )}
                  </div>
                </section>
  
                {/* PARTICIPANTS */}
  
                <div className="quick-result-weather-participants">
                  {participants.map(
                    (
                      participant,
                      index
                    ) => (
                      <article
                        key={
                          participant.id ??
                          index
                        }
                        className="quick-result-weather-person-card"
                      >
                        <div
                          className="quick-result-weather-avatar"
                          style={{
                            background:
                              PARTICIPANT_COLORS[
                                index
                              ],
                          }}
                        >
                          {participant.nickname
                            ?.charAt(0) ??
                            "?"}
                        </div>
  
                        <strong>
                          {
                            participant.nickname
                          }
                        </strong>
  
                        <span>
                          {
                            participant.travelTime
                          }
                          분
                        </span>
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
  
  export default QuickResultPage;