import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./QuickPage.css";

/* =====================================================
   STORAGE
===================================================== */

const QUICK_SETTINGS_STORAGE_KEY =
  "bannana-quick-settings";

/* =====================================================
   PLACE TYPES

   빠른 장소 찾기에서는
   카페 / 식당만 사용
===================================================== */

const PLACE_TYPES = [
  {
    id: "CAFE",
    icon: "☕",
    label: "카페",
  },

  {
    id: "RESTAURANT",
    icon: "🍽️",
    label: "식당",
  },
];

/* =====================================================
   LOCAL DATE

   YYYY-MM-DD
===================================================== */

function getTodayString() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

/* =====================================================
   LOCAL TIME

   HH:MM

   현재 사용자의 로컬 시간을 기준으로 한다.
===================================================== */

function getCurrentTimeString() {
  const now =
    new Date();

  const hours =
    String(
      now.getHours()
    ).padStart(
      2,
      "0"
    );

  const minutes =
    String(
      now.getMinutes()
    ).padStart(
      2,
      "0"
    );

  return `${hours}:${minutes}`;
}

/* =====================================================
   QUICK PAGE
===================================================== */

function QuickPage() {
  const navigate =
    useNavigate();

  /*
    렌더링 시점의 오늘 날짜.

    validation 할 때는
    아래 함수에서 다시 현재 날짜를 계산한다.
  */

  const today =
    getTodayString();

  const currentTime =
    getCurrentTimeString();

  /* =====================================================
     FORM
  ===================================================== */

  const [
    formData,
    setFormData,
  ] = useState({
    meetingDate: "",
    meetingTime: "",
    transportMode:
      "TRANSIT",
    preferredCategories:
      [],
  });

  /* =====================================================
     ERROR
  ===================================================== */

  const [
    errors,
    setErrors,
  ] = useState({
    meetingDate: "",
    meetingTime: "",
    preferredCategories:
      "",
  });

  /* =====================================================
     DATE CHANGE
  ===================================================== */

  const handleDateChange =
    (event) => {
      const value =
        event.target.value;

      /*
        날짜 저장
      */

      setFormData(
        (prev) => ({
          ...prev,

          meetingDate:
            value,
        })
      );

      const latestToday =
        getTodayString();

      const latestTime =
        getCurrentTimeString();

      /* ================================================
         날짜를 지운 경우
      ================================================ */

      if (!value) {
        setErrors(
          (prev) => ({
            ...prev,

            meetingDate:
              "",
          })
        );

        return;
      }

      /* ================================================
         과거 날짜
      ================================================ */

      if (
        value <
        latestToday
      ) {
        setErrors(
          (prev) => ({
            ...prev,

            meetingDate:
              "오늘 이전 날짜는 선택할 수 없어요.",
          })
        );

        return;
      }

      /* ================================================
         정상 날짜
      ================================================ */

      setErrors(
        (prev) => ({
          ...prev,

          meetingDate:
            "",
        })
      );

      /* ================================================
         날짜를 오늘로 변경했는데

         이미 선택돼 있던 시간이
         현재 시간보다 과거라면 오류 표시
      ================================================ */

      if (
        value ===
          latestToday &&
        formData.meetingTime &&
        formData.meetingTime <
          latestTime
      ) {
        setErrors(
          (prev) => ({
            ...prev,

            meetingTime:
              "현재 시간보다 이전 시간은 선택할 수 없어요.",
          })
        );

        return;
      }

      /*
        미래 날짜이거나
        오늘 + 정상 시간인 경우

        기존 시간 오류 제거
      */

      if (
        formData.meetingTime
      ) {
        setErrors(
          (prev) => ({
            ...prev,

            meetingTime:
              "",
          })
        );
      }
    };

  /* =====================================================
     TIME CHANGE
  ===================================================== */

  const handleTimeChange =
    (event) => {
      const value =
        event.target.value;

      /*
        시간 저장
      */

      setFormData(
        (prev) => ({
          ...prev,

          meetingTime:
            value,
        })
      );

      /* 시간을 지운 경우 */

      if (!value) {
        setErrors(
          (prev) => ({
            ...prev,

            meetingTime:
              "",
          })
        );

        return;
      }

      const latestToday =
        getTodayString();

      const latestTime =
        getCurrentTimeString();

      /* ================================================
         오늘 약속인데
         현재 시간보다 과거 시간
      ================================================ */

      if (
        formData.meetingDate ===
          latestToday &&
        value <
          latestTime
      ) {
        setErrors(
          (prev) => ({
            ...prev,

            meetingTime:
              "현재 시간보다 이전 시간은 선택할 수 없어요.",
          })
        );

        return;
      }

      /* 정상 */

      setErrors(
        (prev) => ({
          ...prev,

          meetingTime:
            "",
        })
      );
    };

  /* =====================================================
     CATEGORY
  ===================================================== */

  const toggleCategory =
    (
      category
    ) => {
      setFormData(
        (prev) => {
          const isSelected =
            prev.preferredCategories.includes(
              category
            );

          const nextCategories =
            isSelected
              ? prev.preferredCategories.filter(
                  (
                    item
                  ) =>
                    item !==
                    category
                )
              : [
                  ...prev.preferredCategories,
                  category,
                ];

          /*
            하나 이상 선택되면
            오류 제거
          */

          if (
            nextCategories.length >
            0
          ) {
            setErrors(
              (
                previousErrors
              ) => ({
                ...previousErrors,

                preferredCategories:
                  "",
              })
            );
          }

          return {
            ...prev,

            preferredCategories:
              nextCategories,
          };
        }
      );
    };

  /* =====================================================
     VALIDATE
  ===================================================== */

  const validateForm =
    () => {
      const nextErrors = {
        meetingDate: "",
        meetingTime: "",
        preferredCategories:
          "",
      };

      /*
        ★ 버튼을 누르는 바로 그 순간의
          실제 현재 날짜/시간을 다시 계산한다.

        페이지를 오래 켜둬도 정확하게 검증하기 위함.
      */

      const latestToday =
        getTodayString();

      const latestTime =
        getCurrentTimeString();

      /* =================================================
         DATE
      ================================================= */

      if (
        !formData.meetingDate
      ) {
        nextErrors.meetingDate =
          "약속 날짜를 선택해주세요.";
      } else if (
        formData.meetingDate <
        latestToday
      ) {
        nextErrors.meetingDate =
          "오늘 이전 날짜는 선택할 수 없어요.";
      }

      /* =================================================
         TIME
      ================================================= */

      if (
        !formData.meetingTime
      ) {
        nextErrors.meetingTime =
          "약속 시간을 선택해주세요.";
      } else if (
        formData.meetingDate ===
          latestToday &&
        formData.meetingTime <
          latestTime
      ) {
        nextErrors.meetingTime =
          "현재 시간보다 이전 시간은 선택할 수 없어요.";
      }

      /* =================================================
         CATEGORY
      ================================================= */

      if (
        formData
          .preferredCategories
          .length === 0
      ) {
        nextErrors.preferredCategories =
          "장소 유형을 하나 이상 선택해주세요.";
      }

      setErrors(
        nextErrors
      );

      return !(
        nextErrors.meetingDate ||
        nextErrors.meetingTime ||
        nextErrors.preferredCategories
      );
    };

  /* =====================================================
     NEXT
  ===================================================== */

  const handleNext =
    () => {
      /*
        날짜 / 시간 / 장소 유형
        모두 다시 검증
      */

      if (
        !validateForm()
      ) {
        return;
      }

      /* ==========================================
         SAVE
      ========================================== */

      sessionStorage.setItem(
        QUICK_SETTINGS_STORAGE_KEY,

        JSON.stringify(
          formData
        )
      );

      /* ==========================================
         NEXT
      ========================================== */

      navigate(
        "/quick/origins"
      );
    };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="quick-page app-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="quick-header">
        <button
          type="button"
          className="quick-back-button"
          onClick={() =>
            navigate("/")
          }
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <div className="quick-title-area">
          <h1>
            약속 설정

            <span>
              🗓️
            </span>
          </h1>

          <p>
            이번 약속에 필요한
            정보만 입력하세요
          </p>
        </div>

        <div className="quick-progress">
          <div className="quick-progress__bar quick-progress__bar--active" />

          <div className="quick-progress__bar" />

          <div className="quick-progress__bar" />
        </div>

        <p className="quick-step-text">
          1 / 3단계
        </p>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="quick-content">
        {/* ===============================================
            DATE / TIME
        =============================================== */}

        <article className="quick-card">
          <h2 className="quick-card-title">
            🗓️ 약속 날짜 & 시간
          </h2>

          <div className="quick-date-time">
            {/* ===========================================
                DATE
            =========================================== */}

            <div className="quick-field">
              <label htmlFor="meetingDate">
                날짜
              </label>

              <input
                id="meetingDate"
                type="date"
                name="meetingDate"

                /*
                  오늘 이전 날짜를
                  브라우저 날짜 선택기에서도 차단
                */

                min={
                  today
                }

                className={`quick-input ${
                  errors.meetingDate
                    ? "quick-input--error"
                    : ""
                }`}
                value={
                  formData.meetingDate
                }
                onChange={
                  handleDateChange
                }
              />

              {errors.meetingDate && (
                <p className="quick-error-message">
                  ⚠{" "}
                  {
                    errors.meetingDate
                  }
                </p>
              )}
            </div>

            {/* ===========================================
                TIME
            =========================================== */}

            <div className="quick-field">
              <label htmlFor="meetingTime">
                시간
              </label>

              <input
                id="meetingTime"
                type="time"
                name="meetingTime"

                /*
                  ★ 선택 날짜가 오늘인 경우에만
                    현재 시간부터 선택 가능하도록 설정.

                  미래 날짜라면
                  min 제한 없음.
                */

                min={
                  formData.meetingDate ===
                  today
                    ? currentTime
                    : undefined
                }

                className={`quick-input ${
                  errors.meetingTime
                    ? "quick-input--error"
                    : ""
                }`}
                value={
                  formData.meetingTime
                }
                onChange={
                  handleTimeChange
                }
              />

              {errors.meetingTime && (
                <p className="quick-error-message">
                  ⚠{" "}
                  {
                    errors.meetingTime
                  }
                </p>
              )}
            </div>
          </div>
        </article>

        {/* ===============================================
            TRANSPORT
        =============================================== */}

        <article className="quick-card">
          <h2 className="quick-card-title">
            🚇 이동수단
          </h2>

          <div className="quick-transport-list">
            <button
              type="button"
              className="quick-transport-button quick-transport-button--selected"
              aria-pressed="true"
            >
              <span className="quick-transport-icon">
                🚇
              </span>

              <strong>
                대중교통
              </strong>
            </button>
          </div>
        </article>

        {/* ===============================================
            PLACE TYPE
        =============================================== */}

        <article
          className={`quick-card ${
            errors.preferredCategories
              ? "quick-card--error"
              : ""
          }`}
        >
          <h2 className="quick-card-title">
            📍 원하는 장소 유형
          </h2>

          <p className="quick-card-help">
            카페와 식당 중 선택해주세요 · 중복 선택 가능해요
          </p>

          <div className="quick-place-types">
            {PLACE_TYPES.map(
              (
                place
              ) => {
                const isSelected =
                  formData.preferredCategories.includes(
                    place.id
                  );

                return (
                  <button
                    key={
                      place.id
                    }
                    type="button"
                    className={`quick-place-type ${
                      isSelected
                        ? "quick-place-type--selected"
                        : ""
                    }`}
                    aria-pressed={
                      isSelected
                    }
                    onClick={() =>
                      toggleCategory(
                        place.id
                      )
                    }
                  >
                    <span>
                      {
                        place.icon
                      }
                    </span>

                    {
                      place.label
                    }
                  </button>
                );
              }
            )}
          </div>

          {errors.preferredCategories && (
            <p className="quick-error-message quick-error-message--category">
              ⚠{" "}
              {
                errors.preferredCategories
              }
            </p>
          )}
        </article>
      </section>

      {/* =================================================
          BOTTOM
      ================================================= */}

      <footer className="quick-bottom">
        <button
          type="button"
          className="quick-next-button"
          onClick={
            handleNext
          }
        >
          다음 단계 →
        </button>
      </footer>
    </main>
  );
}

export default QuickPage;