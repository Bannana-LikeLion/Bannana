import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getRecommendations,
  getRoomStatus,
} from "../api/bannanaApi";

import "./CalculationLoadingPage.css";

/* =====================================================
   CALCULATION STEPS
===================================================== */

const CALCULATION_STEPS = [
  "출발지 분석 중",
  "공평한 중간 지점 탐색 중",
  "이동시간 계산 중",
  "추천 후보 정리 중",
];

/* =====================================================
   LOADING TIME

   API가 너무 빨리 끝나더라도
   최소한 로딩 화면을 보여준다.
===================================================== */

const MIN_LOADING_VISIBLE_MS = 3200;

const FINAL_STEP_HOLD_MS = 450;

/* =====================================================
   PARTICIPANT COLORS

   최소 2명 ~ 최대 6명
===================================================== */

const PARTICIPANT_COLORS = [
  {
    color: "#7144df",
    textColor: "#ffffff",
  },

  {
    color: "#d77a72",
    textColor: "#21190f",
  },

  {
    color: "#e8c84a",
    textColor: "#21190f",
  },

  {
    color: "#8bcbc5",
    textColor: "#21190f",
  },

  {
    color: "#7fa6d8",
    textColor: "#21190f",
  },

  {
    color: "#d99ac5",
    textColor: "#21190f",
  },
];

/* =====================================================
   WAIT
===================================================== */

function wait(ms) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        ms
      );
    }
  );
}

/* =====================================================
   ORBIT POSITION

   참여자 수에 맞게
   원 둘레에 균등 배치한다.

   2명 → 서로 반대편
   3명 → 삼각형
   4명 → 사방
   5명 → 오각형
   6명 → 육각형
===================================================== */

function getOrbitPosition(
  index,
  total
) {
  const safeTotal =
    Math.max(
      total,
      1
    );

  const angleDegree =
    -90 +
    (360 / safeTotal) *
      index;

  const angleRadian =
    (angleDegree *
      Math.PI) /
    180;

  const radius = 39;

  return {
    left:
      50 +
      Math.cos(
        angleRadian
      ) *
        radius,

    top:
      50 +
      Math.sin(
        angleRadian
      ) *
        radius,
  };
}

/* =====================================================
   PAGE
===================================================== */

function CalculationLoadingPage() {
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
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    progress,
    setProgress,
  ] = useState(15);

  const [
    error,
    setError,
  ] = useState("");

  const [
    isCalculating,
    setIsCalculating,
  ] = useState(true);

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
        .slice(0, 6);
    }, [roomStatus]);

  /* =====================================================
     VISUAL PROGRESS

     실제 API 요청과 별개로
     사용자에게 계산 과정을 보여준다.
  ===================================================== */

  useEffect(() => {
    if (!isCalculating) {
      return undefined;
    }

    const stepTimer =
      window.setInterval(
        () => {
          setCurrentStep(
            (prev) => {
              if (
                prev >=
                CALCULATION_STEPS.length -
                  1
              ) {
                return prev;
              }

              return prev + 1;
            }
          );
        },
        950
      );

    const progressTimer =
      window.setInterval(
        () => {
          setProgress(
            (prev) => {
              if (
                prev >= 92
              ) {
                return prev;
              }

              return Math.min(
                92,
                prev + 2
              );
            }
          );
        },
        180
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
     REAL CALCULATION
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const calculate =
      async () => {
        /*
          로딩 화면이 처음 나타난 시간.

          API가 아주 빨리 끝나더라도
          최소 표시 시간을 계산할 때 사용.
        */

        const loadingStartedAt =
          Date.now();

        try {
          setError("");

          setIsCalculating(
            true
          );

          setCurrentStep(0);

          setProgress(15);

          /* =============================================
             1. ROOM STATUS
          ============================================= */

          const status =
            await getRoomStatus(
              roomId
            );

          if (cancelled) {
            return;
          }

          setRoomStatus(
            status
          );

          const allParticipants = [
            status.host,

            ...(status.participants ??
              []),
          ].filter(Boolean);

          /* =============================================
             2. PARTICIPANT COUNT
          ============================================= */

          if (
            allParticipants.length <
            2
          ) {
            throw new Error(
              "중간 장소를 찾으려면 최소 2명이 참여해야 합니다."
            );
          }

          if (
            allParticipants.length >
            6
          ) {
            throw new Error(
              "한 약속방에는 최대 6명까지 참여할 수 있습니다."
            );
          }

          /* =============================================
             3. LOCATION CHECK
          ============================================= */

          const missingLocation =
            allParticipants.find(
              (
                participant
              ) => {
                const lat =
                  Number(
                    participant.origin_lat
                  );

                const lng =
                  Number(
                    participant.origin_lng
                  );

                return (
                  !Number.isFinite(
                    lat
                  ) ||
                  !Number.isFinite(
                    lng
                  )
                );
              }
            );

          if (
            missingLocation
          ) {
            throw new Error(
              `${
                missingLocation.nickname ??
                "참여자"
              }님의 출발지 좌표가 없습니다.`
            );
          }

          /* =============================================
             4. RECOMMENDATION PARTICIPANTS
          ============================================= */

          const recommendationParticipants =
            allParticipants.map(
              (
                participant
              ) => ({
                nickname:
                  participant.nickname,

                origin_lat:
                  Number(
                    participant.origin_lat
                  ),

                origin_lng:
                  Number(
                    participant.origin_lng
                  ),

                transport_mode:
                  "transit",
              })
            );

          /* =============================================
             5. DATETIME
          ============================================= */

          const datetime =
            status.meetingDate &&
            status.meetingTime
              ? `${status.meetingDate}T${status.meetingTime}`
              : null;

          /* =============================================
             PLACE TYPES
          ============================================= */

          const placeTypes =
            (
              status.placeTypes ??
              []
            ).map(
              (type) =>
                String(
                  type
                ).toLowerCase()
            );

          setCurrentStep(
            (prev) =>
              Math.max(
                prev,
                1
              )
          );

          setProgress(
            (prev) =>
              Math.max(
                prev,
                35
              )
          );

          /* =============================================
             6. RECOMMENDATION API
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
             7. RESPONSE CHECK
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

          setCurrentStep(
            (prev) =>
              Math.max(
                prev,
                2
              )
          );

          setProgress(
            (prev) =>
              Math.max(
                prev,
                82
              )
          );

          /* =============================================
             8. SAVE RESULT
          ============================================= */

          sessionStorage.setItem(
            `bannana-recommendation-${roomId}`,

            JSON.stringify({
              roomStatus:
                status,

              participants:
                allParticipants,

              candidates:
                recommendation.candidates,

              createdAt:
                new Date().toISOString(),
            })
          );

          /* =============================================
             9. MINIMUM LOADING TIME

             계산이 0.5초에 끝났다면
             나머지 약 2.7초 대기.

             계산이 이미 5초 걸렸다면
             추가 대기 없음.
          ============================================= */

          const elapsed =
            Date.now() -
            loadingStartedAt;

          const remaining =
            Math.max(
              0,
              MIN_LOADING_VISIBLE_MS -
                elapsed
            );

          if (
            remaining > 0
          ) {
            await wait(
              remaining
            );
          }

          if (cancelled) {
            return;
          }

          /* =============================================
             FINAL VISUAL
          ============================================= */

          setCurrentStep(
            CALCULATION_STEPS.length -
              1
          );

          setProgress(100);

          await wait(
            FINAL_STEP_HOLD_MS
          );

          if (cancelled) {
            return;
          }

          /* =============================================
             RESULT PAGE
          ============================================= */

          navigate(
            `/room/${roomId}/result`,
            {
              replace: true,
            }
          );
        } catch (
          calculationError
        ) {
          console.error(
            "중간 장소 계산 실패:",
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
    roomId,
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
        `/room/${roomId}/status`,
        {
          replace: true,
        }
      );
    };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="calculation-page app-container">
      <section className="calculation-main">
        {/* =============================================
            VISUAL
        ============================================= */}

        <div className="calculation-visual">
          <div className="calculation-orbit calculation-orbit--outer" />

          <div className="calculation-orbit calculation-orbit--middle" />

          <div className="calculation-orbit calculation-orbit--inner" />

          <div className="calculation-center">
            반
          </div>

          {participants.map(
            (
              participant,
              index
            ) => {
              const position =
                getOrbitPosition(
                  index,
                  participants.length
                );

              const palette =
                PARTICIPANT_COLORS[
                  index %
                    PARTICIPANT_COLORS.length
                ];

              return (
                <div
                  key={
                    participant.participant_id ??
                    index
                  }
                  className="calculation-person"
                  title={
                    participant.nickname
                  }
                  aria-label={
                    participant.nickname
                  }
                  style={{
                    left:
                      `${position.left}%`,

                    top:
                      `${position.top}%`,

                    backgroundColor:
                      palette.color,

                    color:
                      palette.textColor,
                  }}
                >
                  {participant.nickname?.charAt(
                    0
                  ) ?? "?"}
                </div>
              );
            }
          )}
        </div>

        {/* =============================================
            HEADING
        ============================================= */}

        <div className="calculation-heading">
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
          <section className="calculation-step-card">
            <div className="calculation-step-row calculation-step-row--current">
              <div className="calculation-step-icon calculation-step-icon--error">
                !
              </div>

              <span className="calculation-step-label">
                계산에 실패했어요
              </span>
            </div>

            <p className="calculation-error-message">
              {error}
            </p>

            <div className="calculation-error-actions">
              <button
                type="button"
                className="calculation-error-button calculation-error-button--primary"
                onClick={
                  handleRetry
                }
              >
                다시 계산하기
              </button>

              <button
                type="button"
                className="calculation-error-button calculation-error-button--secondary"
                onClick={
                  handleBack
                }
              >
                참여 현황으로
              </button>
            </div>
          </section>
        ) : (
          /* ==========================================
             STEPS
          ========================================== */

          <section className="calculation-step-card">
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
                    key={step}
                    className={`calculation-step-row ${
                      isCurrent
                        ? "calculation-step-row--current"
                        : ""
                    }`}
                  >
                    <div
                      className={`calculation-step-icon ${
                        isDone
                          ? "calculation-step-icon--done"
                          : ""
                      } ${
                        isCurrent
                          ? "calculation-step-icon--current"
                          : ""
                      } ${
                        isWaiting
                          ? "calculation-step-icon--waiting"
                          : ""
                      }`}
                    >
                      {isDone ? (
                        "✓"
                      ) : isCurrent ? (
                        <span className="calculation-spinner" />
                      ) : null}
                    </div>

                    <span
                      className={`calculation-step-label ${
                        isWaiting
                          ? "calculation-step-label--waiting"
                          : ""
                      }`}
                    >
                      {step}
                    </span>

                    {isCurrent && (
                      <span className="calculation-dots">
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
        <footer className="calculation-bottom">
          <div className="calculation-progress">
            <div
              className="calculation-progress__value"
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

export default CalculationLoadingPage;