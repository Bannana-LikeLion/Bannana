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
  getRoomStatus,
} from "../api/bannanaApi";

import "./ConfirmedRoomPage.css";

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
   FINAL PLACE STORAGE
===================================================== */

function readFinalPlace(
  roomId
) {
  try {
    const saved =
      sessionStorage.getItem(
        `bannana-final-place-${roomId}`
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(
      saved
    );
  } catch (error) {
    console.error(
      "최종 장소 읽기 실패:",
      error
    );

    return null;
  }
}

/* =====================================================
   RECOMMENDATION STORAGE
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

    return JSON.parse(
      saved
    );
  } catch (error) {
    console.error(
      "추천 결과 읽기 실패:",
      error
    );

    return null;
  }
}

/* =====================================================
   KAKAO SHARE SDK
===================================================== */

let kakaoSharePromise =
  null;

function loadKakaoShareSdk() {
  const appKey =
    import.meta.env
      .VITE_KAKAO_JAVASCRIPT_KEY;

  if (!appKey) {
    return Promise.reject(
      new Error(
        "VITE_KAKAO_JAVASCRIPT_KEY가 없습니다."
      )
    );
  }

  /* ==========================================
     이미 SDK가 로드된 경우
  ========================================== */

  if (window.Kakao) {
    if (
      !window.Kakao.isInitialized()
    ) {
      window.Kakao.init(
        appKey
      );
    }

    return Promise.resolve(
      window.Kakao
    );
  }

  /* ==========================================
     이미 로딩 중
  ========================================== */

  if (kakaoSharePromise) {
    return kakaoSharePromise;
  }

  /* ==========================================
     SDK LOAD
  ========================================== */

  kakaoSharePromise =
    new Promise(
      (
        resolve,
        reject
      ) => {
        const existingScript =
          document.querySelector(
            'script[src*="t1.kakaocdn.net/kakao_js_sdk"]'
          );

        const initialize =
          () => {
            if (!window.Kakao) {
              reject(
                new Error(
                  "카카오 JavaScript SDK를 불러오지 못했습니다."
                )
              );

              return;
            }

            if (
              !window.Kakao.isInitialized()
            ) {
              window.Kakao.init(
                appKey
              );
            }

            resolve(
              window.Kakao
            );
          };

        /* ======================================
           기존 script 존재
        ====================================== */

        if (existingScript) {
          if (window.Kakao) {
            initialize();

            return;
          }

          existingScript.addEventListener(
            "load",
            initialize,
            {
              once: true,
            }
          );

          existingScript.addEventListener(
            "error",
            () => {
              reject(
                new Error(
                  "카카오 JavaScript SDK 로드에 실패했습니다."
                )
              );
            },
            {
              once: true,
            }
          );

          return;
        }

        /* ======================================
           새 script 생성
        ====================================== */

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";

        script.async =
          true;

        script.onload =
          initialize;

        script.onerror =
          () => {
            reject(
              new Error(
                "카카오 JavaScript SDK 로드에 실패했습니다."
              )
            );
          };

        document.head.appendChild(
          script
        );
      }
    );

  return kakaoSharePromise;
}

/* =====================================================
   CONFIRMED ROOM PAGE
===================================================== */

function ConfirmedRoomPage() {
  const navigate =
    useNavigate();

  const { roomId } =
    useParams();

  /* =====================================================
     STATE
  ===================================================== */

  const [
    roomStatus,
    setRoomStatus,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =====================================================
     LOCAL DATA
  ===================================================== */

  const savedFinalPlace =
    useMemo(
      () =>
        readFinalPlace(
          roomId
        ),
      [roomId]
    );

  const recommendation =
    useMemo(
      () =>
        readRecommendation(
          roomId
        ),
      [roomId]
    );

  /* =====================================================
     PRELOAD KAKAO SHARE SDK

     버튼 클릭 전에 미리 SDK를 불러와
     공유창이 더 자연스럽게 열리도록 한다.
  ===================================================== */

  useEffect(() => {
    loadKakaoShareSdk().catch(
      (shareError) => {
        /*
          여기서는 페이지 전체 오류로
          처리하지 않는다.

          카카오 공유가 안 되더라도
          Web Share / Clipboard fallback이 있다.
        */

        console.warn(
          "카카오 공유 SDK 사전 로드 실패:",
          shareError
        );
      }
    );
  }, []);

  /* =====================================================
     ROOM STATUS API
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
  ===================================================== */

  const participants =
    useMemo(() => {
      if (!roomStatus) {
        return [];
      }

      return [
        roomStatus.host,

        ...(roomStatus.participants ??
          []),
      ]
        .filter(Boolean)
        .map(
          (
            participant,
            index
          ) => {
            const nickname =
              participant.nickname ??
              participant.name ??
              `참여자 ${index + 1}`;

            const savedTravelTime =
              savedFinalPlace
                ?.travelTimes?.[
                  nickname
                ];

            const backendTravelTime =
              participant.travel_time ??
              participant.travelTime;

            return {
              id:
                participant.participant_id ??
                participant.participantId ??
                participant.id ??
                index,

              nickname,

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

              travelTime:
                toFiniteNumber(
                  backendTravelTime ??
                    savedTravelTime
                ),
            };
          }
        );
    }, [
      roomStatus,
      savedFinalPlace,
    ]);

  /* =====================================================
     FINAL PLACE
  ===================================================== */

  const backendFinalPlace =
    roomStatus?.finalPlace ??
    null;

  const selectedPlace =
    useMemo(() => {
      if (
        !savedFinalPlace &&
        !backendFinalPlace
      ) {
        return null;
      }

      return {
        id:
          savedFinalPlace?.id ??
          "final-place",

        name:
          savedFinalPlace?.name ??
          backendFinalPlace
            ?.placeName ??
          "확정 장소",

        type:
          savedFinalPlace?.type ??
          savedFinalPlace
            ?.category ??
          null,

        lat:
          toFiniteNumber(
            savedFinalPlace?.lat ??
              backendFinalPlace?.lat
          ),

        lng:
          toFiniteNumber(
            savedFinalPlace?.lng ??
              backendFinalPlace?.lng
          ),

        roadAddress:
          savedFinalPlace
            ?.roadAddress ??
          savedFinalPlace
            ?.road_address ??
          "",

        address:
          savedFinalPlace
            ?.address ??
          "",

        distanceMeters:
          toFiniteNumber(
            savedFinalPlace
              ?.distanceMeters ??
              savedFinalPlace
                ?.distanceM
          ),
      };
    }, [
      savedFinalPlace,
      backendFinalPlace,
    ]);

  /* =====================================================
     MIDPOINT
  ===================================================== */

  const midpoint =
    useMemo(() => {
      if (
        savedFinalPlace
          ?.midpoint
      ) {
        return savedFinalPlace.midpoint;
      }

      const firstCandidate =
        recommendation
          ?.candidates?.[0];

      if (!firstCandidate) {
        return null;
      }

      return {
        name:
          firstCandidate.name,

        lat:
          firstCandidate.lat,

        lng:
          firstCandidate.lng,
      };
    }, [
      savedFinalPlace,
      recommendation,
    ]);

  /* =====================================================
     FAIRNESS
  ===================================================== */

  const gapMinutes =
    useMemo(() => {
      const saved =
        toFiniteNumber(
          savedFinalPlace
            ?.gapMinutes
        );

      if (saved !== null) {
        return saved;
      }

      return toFiniteNumber(
        recommendation
          ?.candidates?.[0]
          ?.gap_minutes
      );
    }, [
      savedFinalPlace,
      recommendation,
    ]);

  /* =====================================================
     WEATHER
  ===================================================== */

  const weatherData =
    savedFinalPlace?.weather ??
    null;

  const weatherCondition =
    weatherData?.condition ??
    "CLEAR";

  const weatherMeta =
    WEATHER_META[
      weatherCondition
    ] ??
    WEATHER_META.CLEAR;

  const weatherLabel =
    weatherData
      ?.conditionText ??
    weatherMeta.label;

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
     DATE TEXT
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

          weekday:
            "short",
        }
      ).format(
        meetingDate
      );
    }, [meetingDate]);

  /* =====================================================
     TIME TEXT
  ===================================================== */

  const meetingTimeText =
    useMemo(() => {
      if (!meetingDate) {
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
        meetingDate
      );
    }, [meetingDate]);

  /* =====================================================
     DEPARTURE
  ===================================================== */

  const getDepartureTime =
    (
      travelTime
    ) => {
      if (
        !meetingDate ||
        travelTime === null ||
        travelTime === undefined
      ) {
        return "-";
      }

      const departureTime =
        new Date(
          meetingDate.getTime() -
            travelTime *
              60 *
              1000
        );

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
        departureTime
      );
    };

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

          zIndex: 200,
        });
      }

      return markers;
    }, [
      participants,
      selectedPlace,
    ]);

  /* =====================================================
     FALLBACK SHARE TEXT
  ===================================================== */

  const createShareText =
    () => {
      const lines = [
        "🍌 반나나 약속이 확정됐어요!",
        "",
        `📌 ${roomStatus?.title ?? "반나나 약속"}`,
        `📍 ${selectedPlace?.name ?? "약속 장소"}`,
        `🗓️ ${meetingDateText} · ${meetingTimeText}`,
      ];

      if (
        gapMinutes !== null
      ) {
        lines.push(
          `⚖️ 이동시간 차이 ${gapMinutes}분 · 모두에게 공평한 장소예요!`
        );
      }

      lines.push(
        "",
        "아래 링크에서 약속 정보를 확인해주세요 👇"
      );

      return lines.join(
        "\n"
      );
    };

  /* =====================================================
     NATIVE SHARE FALLBACK
  ===================================================== */

  const handleNativeShare =
    async (
      shareUrl
    ) => {
      const shareText =
        createShareText();

      if (
        navigator.share
      ) {
        try {
          await navigator.share({
            title:
              "반나나 약속 확정 🍌",

            text:
              shareText,

            url:
              shareUrl,
          });

          return;
        } catch (
          nativeError
        ) {
          /*
            사용자가 공유창을 닫은 경우
          */

          if (
            nativeError?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "기본 공유 실패:",
            nativeError
          );
        }
      }

      /* ==========================================
         CLIPBOARD
      ========================================== */

      try {
        await navigator.clipboard.writeText(
          `${shareText}\n${shareUrl}`
        );

        alert(
          "약속 정보와 링크가 복사됐어요!"
        );
      } catch (
        clipboardError
      ) {
        console.error(
          "약속 공유 실패:",
          clipboardError
        );

        alert(
          "약속 정보를 공유하지 못했어요."
        );
      }
    };

  /* =====================================================
     ★ KAKAO SHARE

     카카오톡에서는 예쁜 기본 Feed Template 사용.

     공유 대상은 호스트 페이지가 아니라
     참여자도 볼 수 있는 confirmed 페이지로 연결.
  ===================================================== */

  const handleShare =
    async () => {
      if (!selectedPlace) {
        alert(
          "확정된 장소 정보를 아직 불러오고 있어요."
        );

        return;
      }

      /*
        받은 사람이 호스트 전용 화면이 아니라
        참여자용 확정 화면을 볼 수 있도록 한다.
      */

      const shareUrl =
        `${window.location.origin}/join/${roomId}/confirmed`;

      try {
        const Kakao =
          await loadKakaoShareSdk();

        if (
          !Kakao?.Share
        ) {
          throw new Error(
            "카카오톡 공유 기능을 사용할 수 없습니다."
          );
        }

        /* ==========================================
           DESCRIPTION

           Feed Template은
           제목 + 설명을 너무 길게 쓰지 않고
           핵심 정보만 보여준다.
        ========================================== */

        const descriptionLines = [
          `${roomStatus?.title ?? "반나나 약속"}`,

          `📍 ${selectedPlace.name}`,

          `🗓️ ${meetingDateText} · ${meetingTimeText}`,
        ];

        if (
          gapMinutes !== null
        ) {
          descriptionLines.push(
            `⚖️ 이동시간 차이 ${gapMinutes}분`
          );
        }

        Kakao.Share.sendDefault({
          objectType:
            "feed",

          content: {
            title:
              "🍌 반나나 약속이 확정됐어요!",

            description:
              descriptionLines.join(
                "\n"
              ),

            link: {
              mobileWebUrl:
                shareUrl,

              webUrl:
                shareUrl,
            },
          },

          buttons: [
            {
              title:
                "약속 확인하기",

              link: {
                mobileWebUrl:
                  shareUrl,

                webUrl:
                  shareUrl,
              },
            },
          ],
        });
      } catch (
        kakaoError
      ) {
        console.error(
          "카카오톡 카드 공유 실패:",
          kakaoError
        );

        /*
          Kakao Share가 실패하면
          자동으로 기존 공유 방식 사용
        */

        await handleNativeShare(
          shareUrl
        );
      }
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading) {
    return (
      <main className="confirmed-page app-container">
        <section
          className="confirmed-section"
          style={{
            marginTop:
              "120px",

            textAlign:
              "center",
          }}
        >
          <h2>
            🍌 약속 정보를
            불러오고 있어요
          </h2>
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
      <main className="confirmed-page app-container">
        <section
          className="confirmed-section"
          style={{
            marginTop:
              "120px",

            textAlign:
              "center",
          }}
        >
          <h2>
            약속 정보를
            불러오지 못했어요
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="confirmed-primary-button"
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
     NO FINAL PLACE
  ===================================================== */

  if (!selectedPlace) {
    return (
      <main className="confirmed-page app-container">
        <section
          className="confirmed-section"
          style={{
            marginTop:
              "120px",

            textAlign:
              "center",
          }}
        >
          <h2>
            아직 약속 장소가
            확정되지 않았어요
          </h2>

          <button
            type="button"
            className="confirmed-primary-button"
            onClick={() =>
              navigate(
                `/room/${roomId}/result`
              )
            }
          >
            결과 화면으로
          </button>
        </section>
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="confirmed-page app-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="confirmed-header">
        <button
          type="button"
          className="confirmed-back-button"
          onClick={() =>
            navigate(-1)
          }
        >
          ←
        </button>

        <h1>
          약속 확정! 🎉
        </h1>

        <p>
          모두의 중간 장소가
          결정됐어요
        </p>
      </header>

      {/* =================================================
          PLACE
      ================================================= */}

      <section className="confirmed-place-card">
        <div className="confirmed-place-image">
          {selectedPlace.type ===
          "CAFE"
            ? "☕"
            : selectedPlace.type ===
                "RESTAURANT"
              ? "🍽️"
              : "📍"}
        </div>

        <div className="confirmed-place-info">
          <div className="confirmed-place-name">
            <div>
              <span>
                {CATEGORY_LABELS[
                  selectedPlace.type
                ] ??
                  "약속 장소"}
              </span>
            </div>

            <h2>
              {
                selectedPlace.name
              }
            </h2>

            <p>
              📍{" "}
              {selectedPlace.roadAddress ||
                selectedPlace.address ||
                midpoint?.name ||
                "최종 선택 장소"}

              {selectedPlace.distanceMeters !==
                null && (
                <>
                  {" · "}

                  {
                    selectedPlace.distanceMeters
                  }
                  m
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          REAL KAKAO MAP
      ================================================= */}

      <section className="confirmed-map">
        <KakaoMap
          markers={
            mapMarkers
          }
          height="100%"
          level={5}
          emptyMessage="위치 정보를 불러올 수 없어요"
        />

        {gapMinutes !==
          null && (
          <div className="confirmed-fair-label">
            이동시간 차이{" "}
            {
              gapMinutes
            }
            분 · 가장 공평해요 🎉
          </div>
        )}
      </section>

      {/* =================================================
          MEETING INFO
      ================================================= */}

      <section className="confirmed-section">
        <h2 className="confirmed-section-title">
          🗓️ 약속 정보
        </h2>

        <div className="confirmed-meeting-info">
          <div className="confirmed-info-box">
            <span>
              날짜
            </span>

            <strong>
              {
                meetingDateText
              }
            </strong>
          </div>

          <div className="confirmed-info-box">
            <span>
              시간
            </span>

            <strong>
              {
                meetingTimeText
              }
            </strong>
          </div>

          <div className="confirmed-info-box">
            <span>
              날씨
            </span>

            <strong>
              {
                weatherMeta.icon
              }{" "}
              {
                weatherLabel
              }
            </strong>
          </div>
        </div>
      </section>

      {/* =================================================
          TRAVEL INFO
      ================================================= */}

      <section className="confirmed-section">
        <h2 className="confirmed-section-title">
          ⏱️ 참여자별 이동 안내
        </h2>

        <p className="confirmed-section-description">
          대중교통 기준 예상
          이동시간
        </p>

        <div className="confirmed-travel-list">
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
                  className="confirmed-travel-card"
                >
                  <div
                    className="confirmed-avatar"
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

                  <div className="confirmed-travel-info">
                    <strong>
                      {
                        participant.nickname
                      }

                      {participant.isHost &&
                        " (호스트)"}
                    </strong>

                    <span>
                      {participant.originText ||
                        "출발지 등록 완료"}
                    </span>
                  </div>

                  <div className="confirmed-travel-time">
                    {participant.travelTime !==
                    null ? (
                      <>
                        <strong>
                          {
                            participant.travelTime
                          }
                          분
                        </strong>

                        <span>
                          {getDepartureTime(
                            participant.travelTime
                          )}{" "}
                          출발
                        </span>
                      </>
                    ) : (
                      <>
                        <strong>
                          --
                        </strong>

                        <span>
                          이동시간 확인 중
                        </span>
                      </>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>

        <div className="confirmed-complete-message">
          ✅ 약속 확정 완료!
        </div>
      </section>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <section className="confirmed-actions">
        <button
          type="button"
          className="confirmed-primary-button"
          onClick={
            handleShare
          }
        >
          💬 약속 공유하기
        </button>

        <button
          type="button"
          className="confirmed-secondary-button"
          onClick={() =>
            navigate(
              `/room/${roomId}/result`
            )
          }
        >
          다른 장소 보기
        </button>
      </section>
    </main>
  );
}

export default ConfirmedRoomPage;