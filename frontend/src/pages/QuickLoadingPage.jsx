import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getRecommendations,
} from "../api/bannanaApi";

import "./QuickLoadingPage.css";

/* =====================================================
   STORAGE
===================================================== */

const QUICK_SETTINGS_STORAGE_KEY =
  "bannana-quick-settings";

const QUICK_PARTICIPANTS_STORAGE_KEY =
  "bannana-quick-participants";

const QUICK_RECOMMENDATION_STORAGE_KEY =
  "bannana-quick-recommendation";

/* =====================================================
   STEPS
===================================================== */

const CALCULATION_STEPS = [
  "출발지 분석 중",
  "공평한 중간 지점 탐색 중",
  "이동시간 계산 중",
  "추천 후보 정리 중",
];

/* =====================================================
   PARTICIPANT POSITION
===================================================== */

const MARKER_CLASSES = [
  "quick-loading-person--top",
  "quick-loading-person--left",
  "quick-loading-person--right",
  "quick-loading-person--bottom",
  "quick-loading-person--far-left",
  "quick-loading-person--far-right",
];

/* =====================================================
   STORAGE
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

    if (!saved) {
      return fallback;
    }

    return JSON.parse(
      saved
    );
  } catch (error) {
    console.error(
      `${key} 읽기 실패:`,
      error
    );

    return fallback;
  }
}

/* =====================================================
   COORDINATE
===================================================== */

function hasCoordinate(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  return Number.isFinite(
    Number(value)
  );
}

/* =====================================================
   PLACE TYPE NORMALIZE

   QuickPage에서는 CULTURE를 사용하지만
   일반 Room Flow에서는 EXHIBITION을 사용하므로
   Backend용으로 맞춘다.
===================================================== */

function normalizePlaceType(
  type
) {
  const normalized =
    String(type)
      .trim()
      .toUpperCase();

  if (
    normalized ===
    "CULTURE"
  ) {
    return "exhibition";
  }

  return normalized.toLowerCase();
}

/* =====================================================
   MEETING DATETIME
===================================================== */

function makeMeetingDateTime(
  settings
) {
  const date =
    settings?.meetingDate;

  const time =
    settings?.meetingTime;

  if (
    !date ||
    !time
  ) {
    return null;
  }

  /*
    input type=time은
    보통 HH:mm 형식이므로
    초를 붙여준다.
  */

  const normalizedTime =
    time.length === 5
      ? `${time}:00`
      : time;

  return `${date}T${normalizedTime}`;
}

/* =====================================================
   PAGE
===================================================== */

function QuickLoadingPage() {
  const navigate =
    useNavigate();

  /* =====================================================
     DATA
  ===================================================== */

  const settings =
    useMemo(
      () =>
        readStorage(
          QUICK_SETTINGS_STORAGE_KEY,
          null
        ),
      []
    );

  const participants =
    useMemo(
      () =>
        readStorage(
          QUICK_PARTICIPANTS_STORAGE_KEY,
          []
        ),
      []
    );

  /* =====================================================
     STATE
  ===================================================== */

  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    progress,
    setProgress,
  ] = useState(15);

  const [
    isCalculating,
    setIsCalculating,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =====================================================
     VISUAL PROGRESS
  ===================================================== */

  useEffect(() => {
    if (!isCalculating) {
      return undefined;
    }

    const stepTimer =
      window.setInterval(
        () => {
          setCurrentStep(
            (prev) =>
              Math.min(
                prev + 1,
                CALCULATION_STEPS.length -
                  1
              )
          );
        },
        1300
      );

    const progressTimer =
      window.setInterval(
        () => {
          setProgress(
            (prev) =>
              Math.min(
                92,
                prev + 2
              )
          );
        },
        250
      );

    return () => {
      window.clearInterval(
        stepTimer
      );

      window.clearInterval(
        progressTimer
      );
    };
  }, [isCalculating]);

  /* =====================================================
     REAL RECOMMENDATION
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const calculate =
      async () => {
        try {
          setError("");

          setIsCalculating(
            true
          );

          /* =============================================
             BASIC VALIDATION
          ============================================= */

          if (!settings) {
            throw new Error(
              "약속 설정 정보가 없습니다."
            );
          }

          if (
            !Array.isArray(
              participants
            ) ||
            participants.length <
              2
          ) {
            throw new Error(
              "중간 장소를 찾으려면 최소 2명이 필요합니다."
            );
          }

          /* =============================================
             PARTICIPANT VALIDATION
          ============================================= */

          const missingParticipant =
            participants.find(
              (participant) =>
                !participant.nickname
                  ?.trim() ||
                !hasCoordinate(
                  participant.originLat
                ) ||
                !hasCoordinate(
                  participant.originLng
                )
            );

          if (
            missingParticipant
          ) {
            throw new Error(
              "참여자 이름 또는 출발지 정보가 올바르지 않습니다."
            );
          }

          /* =============================================
             RECOMMENDATION PARTICIPANTS
          ============================================= */

          const recommendationParticipants =
            participants.map(
              (participant) => ({
                nickname:
                  participant.nickname.trim(),

                origin_lat:
                  Number(
                    participant.originLat
                  ),

                origin_lng:
                  Number(
                    participant.originLng
                  ),

                transport_mode:
                  "transit",
              })
            );

          /* =============================================
             PLACE TYPES
          ============================================= */

          const placeTypes =
            (
              settings.preferredCategories ??
              []
            )
              .map(
                normalizePlaceType
              )
              .filter(Boolean);

          /* =============================================
             DATETIME
          ============================================= */

          const datetime =
            makeMeetingDateTime(
              settings
            );

          setCurrentStep(1);

          setProgress(
            (prev) =>
              Math.max(
                prev,
                35
              )
          );

          /* =============================================
             REAL API

             POST /recommendations
          ============================================= */

          const recommendation =
            await getRecommendations(
              {
                participants:
                  recommendationParticipants,

                placeTypes,

                datetime,
              }
            );

          if (cancelled) {
            return;
          }

          /* =============================================
             RESPONSE VALIDATION
          ============================================= */

          if (
            !recommendation ||
            !Array.isArray(
              recommendation.candidates
            ) ||
            recommendation
              .candidates
              .length === 0
          ) {
            throw new Error(
              "추천 가능한 중간 지점을 찾지 못했습니다."
            );
          }

          setCurrentStep(3);

          setProgress(100);

          /* =============================================
             STORE REAL RESULT
          ============================================= */

          sessionStorage.setItem(
            QUICK_RECOMMENDATION_STORAGE_KEY,

            JSON.stringify({
              settings,

              participants,

              candidates:
                recommendation.candidates,

              createdAt:
                new Date().toISOString(),
            })
          );

          /*
            API가 너무 빨리 끝나도
            로딩 화면이 순간적으로 사라지지 않도록
            짧게 유지
          */

          await new Promise(
            (resolve) =>
              window.setTimeout(
                resolve,
                900
              )
          );

          if (cancelled) {
            return;
          }

          navigate(
            "/quick/result",
            {
              replace: true,
            }
          );
        } catch (
          calculationError
        ) {
          console.error(
            "빠른 장소 찾기 계산 실패:",
            calculationError
          );

          if (!cancelled) {
            setIsCalculating(
              false
            );

            setError(
              calculationError.message ||
                "중간 장소 계산에 실패했습니다."
            );
          }
        }
      };

    calculate();

    return () => {
      cancelled = true;
    };
  }, [
    navigate,
    participants,
    settings,
  ]);

  /* =====================================================
     RETRY
  ===================================================== */

  const handleRetry =
    () => {
      window.location.reload();
    };

  /* =====================================================
     BACK
  ===================================================== */

  const handleBack =
    () => {
      navigate(
        "/quick/origins",
        {
          replace: true,
        }
      );
    };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="quick-loading-page app-container">
      <section className="quick-loading-main">
        {/* =============================================
            VISUAL
        ============================================= */}

        <div className="quick-loading-visual">
          <div className="quick-loading-orbit quick-loading-orbit--outer" />

          <div className="quick-loading-orbit quick-loading-orbit--middle" />

          <div className="quick-loading-orbit quick-loading-orbit--inner" />

          <div className="quick-loading-center">
            반
          </div>

          {participants
            .slice(0, 6)
            .map(
              (
                participant,
                index
              ) => (
                <div
                  key={
                    participant.id ??
                    index
                  }
                  className={`quick-loading-person ${
                    MARKER_CLASSES[
                      index
                    ] ?? ""
                  }`}
                >
                  {participant.nickname
                    ?.trim()
                    ?.charAt(0) ??
                    "?"}
                </div>
              )
            )}
        </div>

        {/* =============================================
            HEADING
        ============================================= */}

        <div className="quick-loading-heading">
          <h1>
            모두에게 공평한
            <br />

            중간 장소를 찾고 있어요
          </h1>

          <p>
            실제 대중교통 이동시간을
            비교하고 있어요
          </p>
        </div>

        {/* =============================================
            ERROR
        ============================================= */}

        {error ? (
          <section className="quick-loading-card">
            <div className="quick-loading-row">
              <div className="quick-loading-icon quick-loading-icon--done">
                !
              </div>

              <span className="quick-loading-label">
                계산에 실패했어요
              </span>
            </div>

            <p
              style={{
                margin:
                  "13px 0 0",

                color:
                  "#9a8056",

                fontSize:
                  "10px",

                lineHeight:
                  1.6,
              }}
            >
              {error}
            </p>

            <div
              style={{
                display:
                  "flex",

                gap:
                  "8px",

                marginTop:
                  "15px",
              }}
            >
              <button
                type="button"
                onClick={
                  handleRetry
                }
                style={{
                  flex: 1,

                  height:
                    "44px",

                  border:
                    "none",

                  borderRadius:
                    "12px",

                  background:
                    "#f4cf45",

                  fontWeight:
                    800,

                  cursor:
                    "pointer",
                }}
              >
                다시 계산하기
              </button>

              <button
                type="button"
                onClick={
                  handleBack
                }
                style={{
                  flex: 1,

                  height:
                    "44px",

                  border:
                    "1px solid #e6deca",

                  borderRadius:
                    "12px",

                  background:
                    "#ffffff",

                  fontWeight:
                    700,

                  cursor:
                    "pointer",
                }}
              >
                출발지 수정
              </button>
            </div>
          </section>
        ) : (
          /* =============================================
             STEPS
          ============================================= */

          <section className="quick-loading-card">
            {CALCULATION_STEPS.map(
              (
                step,
                index
              ) => {
                const isDone =
                  index <
                  currentStep;

                const isCurrent =
                  index ===
                  currentStep;

                const isWaiting =
                  index >
                  currentStep;

                return (
                  <div
                    key={
                      step
                    }
                    className="quick-loading-row"
                  >
                    <div
                      className={`quick-loading-icon ${
                        isDone
                          ? "quick-loading-icon--done"
                          : ""
                      } ${
                        isCurrent
                          ? "quick-loading-icon--current"
                          : ""
                      } ${
                        isWaiting
                          ? "quick-loading-icon--waiting"
                          : ""
                      }`}
                    >
                      {isDone ? (
                        "✓"
                      ) : isCurrent ? (
                        <span className="quick-loading-spinner" />
                      ) : null}
                    </div>

                    <span
                      className={`quick-loading-label ${
                        isWaiting
                          ? "quick-loading-label--waiting"
                          : ""
                      }`}
                    >
                      {step}
                    </span>

                    {isCurrent && (
                      <span className="quick-loading-dots">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </div>
                );
              }
            )}
          </section>
        )}
      </section>

      {/* =================================================
          BOTTOM
      ================================================= */}

      {!error && (
        <footer className="quick-loading-bottom">
          <div className="quick-loading-progress">
            <div
              className="quick-loading-progress__value"
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>

          <p>
            잠깐만요, 실제 이동시간을
            계산하고 있어요...
          </p>
        </footer>
      )}
    </main>
  );
}

export default QuickLoadingPage;