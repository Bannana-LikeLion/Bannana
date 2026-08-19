import {
  useMemo,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import WeatherMapEffect, {
  getSimpleWeather,
} from "../components/common/WeatherMapEffect";

import "./QuickConfirmedPage.css";

/* =====================================================
   STORAGE
===================================================== */

const QUICK_SELECTED_PLACE_KEY =
  "bannana-quick-selected-place";

const QUICK_RECOMMENDATION_KEY =
  "bannana-quick-recommendation";

const QUICK_SETTINGS_KEY =
  "bannana-quick-settings";

/* =====================================================
   PARTICIPANT COLORS
===================================================== */

const PARTICIPANT_COLORS = [
  {
    color: "#f0c936",
    textColor: "#21190f",
  },

  {
    color: "#e87570",
    textColor: "#21190f",
  },

  {
    color: "#79cec5",
    textColor: "#21190f",
  },

  {
    color: "#7144df",
    textColor: "#ffffff",
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
   STORAGE READ
===================================================== */

function readStorage(
  key
) {
  try {
    const saved =
      sessionStorage.getItem(
        key
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(
      saved
    );
  } catch (error) {
    console.error(
      `${key} 읽기 실패:`,
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
   CANDIDATE TRAVEL TIME
===================================================== */

function getCandidateTravelTime(
  candidate,
  participant,
  index
) {
  const travelTimes =
    candidate?.travel_times;

  if (!travelTimes) {
    return null;
  }

  /*
    Object 형식:

    {
      "김보경": 24,
      "장서인": 23
    }
  */

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

  /*
    Array 형식도 대비
  */

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

function QuickConfirmedPage() {
  const navigate =
    useNavigate();

  /* =====================================================
     STORAGE DATA
  ===================================================== */

  const savedSelection =
    useMemo(
      () =>
        readStorage(
          QUICK_SELECTED_PLACE_KEY
        ),
      []
    );

  const recommendationData =
    useMemo(
      () =>
        readStorage(
          QUICK_RECOMMENDATION_KEY
        ),
      []
    );

  const storedSettings =
    useMemo(
      () =>
        readStorage(
          QUICK_SETTINGS_KEY
        ),
      []
    );

  /* =====================================================
     SELECTED PLACE

     최근 QuickResultPage:
     장소 정보를 root에 spread해서 저장

     이전 구조:
     selectedPlace 안에 저장

     둘 다 호환
  ===================================================== */

  const selectedPlace =
    useMemo(() => {
      if (
        !savedSelection
      ) {
        return null;
      }

      if (
        savedSelection.selectedPlace
      ) {
        return savedSelection.selectedPlace;
      }

      if (
        savedSelection.place
      ) {
        return savedSelection.place;
      }

      if (
        savedSelection.name
      ) {
        return savedSelection;
      }

      return null;
    }, [savedSelection]);

  /* =====================================================
     CANDIDATE
  ===================================================== */

  const candidate =
    savedSelection?.candidate ??
    recommendationData
      ?.candidates?.[0] ??
    null;

  /* =====================================================
     MIDPOINT
  ===================================================== */

  const midpoint =
    savedSelection?.midpoint ??
    (
      candidate
        ? {
            name:
              candidate.name,

            lat:
              candidate.lat,

            lng:
              candidate.lng,
          }
        : null
    );

  /* =====================================================
     SETTINGS
  ===================================================== */

  const settings =
    savedSelection?.settings ??
    recommendationData?.settings ??
    storedSettings ??
    {};

  /* =====================================================
     WEATHER
  ===================================================== */

  const weather =
    savedSelection?.weather ??
    recommendationData?.weather ??
    null;

  const simpleWeather =
    useMemo(
      () =>
        getSimpleWeather(
          weather
        ),
      [weather]
    );

  /* =====================================================
     PARTICIPANTS
  ===================================================== */

  const participants =
    useMemo(() => {
      const source =
        savedSelection
          ?.participants ??
        recommendationData
          ?.participants ??
        [];

      return source
        .slice(0, 6)
        .map(
          (
            participant,
            index
          ) => {
            const originLat =
              toFiniteNumber(
                participant.originLat ??
                  participant.origin_lat
              );

            const originLng =
              toFiniteNumber(
                participant.originLng ??
                  participant.origin_lng
              );

            const storedTravelTime =
              toFiniteNumber(
                participant.travelTime ??
                  participant.travel_time
              );

            const candidateTravelTime =
              getCandidateTravelTime(
                candidate,
                participant,
                index
              );

            return {
              id:
                participant.id ??
                participant.participant_id ??
                index,

              nickname:
                participant.nickname ??
                `참여자 ${index + 1}`,

              originText:
                participant.originText ??
                participant.origin_text ??
                "",

              originLat,

              originLng,

              travelTime:
                storedTravelTime ??
                candidateTravelTime,
            };
          }
        );
    }, [
      savedSelection,
      recommendationData,
      candidate,
    ]);

  /* =====================================================
     GAP
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

  const calculatedGap =
    validTravelTimes.length >=
    2
      ? Math.max(
          ...validTravelTimes
        ) -
        Math.min(
          ...validTravelTimes
        )
      : 0;

  const gapMinutes =
    toFiniteNumber(
      savedSelection
        ?.timeDifference
    ) ??
    toFiniteNumber(
      savedSelection
        ?.gapMinutes
    ) ??
    toFiniteNumber(
      candidate?.gap_minutes
    ) ??
    calculatedGap;

  /* =====================================================
     MEETING DATETIME
  ===================================================== */

  const meetingDateTime =
    useMemo(() => {
      const meetingDate =
        settings.meetingDate ??
        settings.date;

      let meetingTime =
        settings.meetingTime ??
        settings.time;

      if (
        !meetingDate ||
        !meetingTime
      ) {
        return null;
      }

      if (
        String(
          meetingTime
        ).length === 5
      ) {
        meetingTime =
          `${meetingTime}:00`;
      }

      const date =
        new Date(
          `${meetingDate}T${meetingTime}`
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      return date;
    }, [settings]);

  /* =====================================================
     DATE TEXT
  ===================================================== */

  const meetingDateText =
    useMemo(() => {
      if (
        !meetingDateTime
      ) {
        return "-";
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
        }
      ).format(
        meetingDateTime
      );
    }, [meetingDateTime]);

  const meetingTimeText =
    useMemo(() => {
      if (
        !meetingDateTime
      ) {
        return "-";
      }

      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          hour:
            "numeric",

          minute:
            "2-digit",

          hour12:
            true,
        }
      ).format(
        meetingDateTime
      );
    }, [meetingDateTime]);

  /* =====================================================
     PLACE INFORMATION
  ===================================================== */

  const placeType =
    normalizePlaceType(
      selectedPlace?.type ??
        selectedPlace?.category
    );

  const placeCategoryText =
    CATEGORY_LABELS[
      placeType
    ] ??
    "장소";

  const placeIcon =
    CATEGORY_ICONS[
      placeType
    ] ??
    "📍";

  const placeAddress =
    selectedPlace?.roadAddress ??
    selectedPlace?.road_address ??
    selectedPlace?.address ??
    "주소 정보 없음";

  const distanceMeters =
    toFiniteNumber(
      selectedPlace
        ?.distanceMeters ??
        selectedPlace
          ?.distanceM
    );

  /* =====================================================
     MAP MARKERS
  ===================================================== */

  const mapMarkers =
    useMemo(() => {
      const markers = [];

      /* PARTICIPANTS */

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
              `quick-confirmed-participant-${participant.id}`,

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

      /* FINAL PLACE */

      const finalLat =
        toFiniteNumber(
          selectedPlace?.lat
        );

      const finalLng =
        toFiniteNumber(
          selectedPlace?.lng
        );

      if (
        finalLat !== null &&
        finalLng !== null
      ) {
        markers.push({
          id:
            "quick-confirmed-final-place",

          type:
            "midpoint",

          lat:
            finalLat,

          lng:
            finalLng,

          label:
            selectedPlace.name,

          initial:
            "🍌",

          color:
            "#f4cf45",

          textColor:
            "#21190f",

          zIndex: 300,
        });
      }

      return markers;
    }, [
      participants,
      selectedPlace,
    ]);

  /* =====================================================
     SHARE
  ===================================================== */

  const handleShare =
    async () => {
      if (
        !selectedPlace
      ) {
        return;
      }

      const shareText =
        [
          "🍌 반나나에서 중간 장소를 찾았어요!",
          "",
          `📍 ${selectedPlace.name}`,
          `🏠 ${placeAddress}`,
          `🗓️ ${meetingDateText} ${meetingTimeText}`,
          `🌤️ ${simpleWeather.label}`,
          `🚇 이동시간 차이 ${gapMinutes}분`,
        ].join("\n");

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              "반나나 빠른 장소 찾기 결과",

            text:
              shareText,
          });

          return;
        }

        await navigator.clipboard.writeText(
          shareText
        );

        alert(
          "약속 정보가 복사됐어요!"
        );
      } catch (error) {
        /*
          모바일 공유창을 사용자가
          직접 닫은 경우도 있으므로
          에러 화면으로 처리하지 않는다.
        */

        console.error(
          "공유 실패:",
          error
        );
      }
    };

  /* =====================================================
     NO RESULT

     ★ 기존에는 여기서 null 값을 바로 읽어
       페이지 전체가 죽을 수 있었음.

     이제 결과가 없어도 빈 화면 대신
     복구 화면을 보여준다.
  ===================================================== */

  if (
    !savedSelection ||
    !selectedPlace
  ) {
    return (
      <main className="quick-confirmed-state">
        <section className="quick-confirmed-state-card">
          <div className="quick-confirmed-state-icon">
            ⚠️
          </div>

          <h1>
            확정된 장소를 찾을 수 없어요
          </h1>

          <p>
            추천 결과 화면에서 장소를 다시 선택해주세요.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/quick/result"
              )
            }
          >
            추천 결과로 돌아가기
          </button>
        </section>
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="quick-confirmed-page app-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="quick-confirmed-header">
        <button
          type="button"
          className="quick-confirmed-back"
          onClick={() =>
            navigate(
              "/quick/result"
            )
          }
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <div className="quick-confirmed-complete">
          <span>
            🍌
          </span>

          빠른 장소 찾기 완료
        </div>

        <h1>
          중간 장소를 찾았어요! 🎉
        </h1>

        <p>
          모두의 실제 이동시간을 비교해서 찾은 결과예요
        </p>
      </header>

      {/* =================================================
          SELECTED PLACE
      ================================================= */}

      <section className="quick-confirmed-place">
        <div className="quick-confirmed-place-icon">
          {
            placeIcon
          }
        </div>

        <div className="quick-confirmed-place-content">
          <div className="quick-confirmed-place-tags">
            <span>
              {
                placeCategoryText
              }
            </span>

            <span>
              최종 선택
            </span>
          </div>

          <h2>
            {
              selectedPlace.name
            }
          </h2>

          <p>
            📍{" "}
            {
              placeAddress
            }
          </p>

          {distanceMeters !==
            null && (
            <small>
              {midpoint?.name ??
                "추천 중간 지점"}
              에서 약{" "}
              {
                distanceMeters
              }
              m
            </small>
          )}
        </div>
      </section>

      {/* =================================================
          MAP
      ================================================= */}

      <section className="quick-confirmed-map">
        <KakaoMap
          markers={
            mapMarkers
          }
          height="100%"
          level={5}
          emptyMessage="위치 정보를 표시할 수 없어요"
        />

        {/* ★ 비 / 눈 효과 */}

        <WeatherMapEffect
          mode={
            simpleWeather.key
          }
        />

        <div className="quick-confirmed-map-label">
          🍌 최종 약속 장소
        </div>

        <div className="quick-confirmed-fairness">
          이동시간 차이{" "}
          {
            gapMinutes
          }
          분 · 공평하게 만나요 🎉
        </div>
      </section>

      {/* =================================================
          MEETING INFORMATION
      ================================================= */}

      <section className="quick-confirmed-section">
        <h2>
          🗓️ 약속 정보
        </h2>

        <div className="quick-confirmed-info-grid">
          <article>
            <span>
              날짜
            </span>

            <strong>
              {
                meetingDateText
              }
            </strong>
          </article>

          <article>
            <span>
              시간
            </span>

            <strong>
              {
                meetingTimeText
              }
            </strong>
          </article>

          <article>
            <span>
              날씨
            </span>

            <strong>
              {
                simpleWeather.icon
              }{" "}
              {
                simpleWeather.label
              }
            </strong>
          </article>
        </div>

        {weather && (
          <div className="quick-confirmed-weather-sub">
            기온{" "}
            {
              weather.temperature ??
              "-"
            }
            ℃ · 강수확률{" "}
            {
              weather.precipitationProbability ??
              0
            }
            %
          </div>
        )}
      </section>

      {/* =================================================
          PARTICIPANTS
      ================================================= */}

      <section className="quick-confirmed-section">
        <div className="quick-confirmed-section-heading">
          <div>
            <h2>
              ⏱️ 모두의 이동시간
            </h2>

            <p>
              대중교통 기준 예상 이동시간이에요
            </p>
          </div>

          <span>
            {
              participants.length
            }
            명
          </span>
        </div>

        <div className="quick-confirmed-travel-list">
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
                  className="quick-confirmed-travel-row"
                >
                  <div
                    className="quick-confirmed-avatar"
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

                  <div className="quick-confirmed-person">
                    <strong>
                      {
                        participant.nickname
                      }
                    </strong>

                    <span>
                      {participant.originText ||
                        "출발지"}
                    </span>
                  </div>

                  <strong className="quick-confirmed-minute">
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

      {/* =================================================
          FAIRNESS
      ================================================= */}

      <section className="quick-confirmed-fair-card">
        <span className="quick-confirmed-fair-icon">
          💡
        </span>

        <div>
          <strong>
            왜 이 장소가 공평한가요?
          </strong>

          <p>
            {participants.length >=
            2
              ? `각 출발지에서 실제 대중교통 이동시간을 비교했고, 참여자 간 이동시간 차이가 ${gapMinutes}분이 되도록 계산한 중간 지역 주변의 장소예요.`
              : "참여자의 출발지와 대중교통 접근성을 기준으로 추천한 장소예요."}
          </p>
        </div>
      </section>

      {/* =================================================
          ACTION
      ================================================= */}

      <section className="quick-confirmed-actions">
        <button
          type="button"
          className="quick-confirmed-primary"
          onClick={
            handleShare
          }
        >
          🔗 결과 공유하기
        </button>

        <button
          type="button"
          className="quick-confirmed-secondary"
          onClick={() =>
            navigate(
              "/quick/result"
            )
          }
        >
          다른 장소 보기
        </button>

        <button
          type="button"
          className="quick-confirmed-home"
          onClick={() =>
            navigate("/")
          }
        >
          처음으로
        </button>
      </section>
    </main>
  );
}

export default QuickConfirmedPage;