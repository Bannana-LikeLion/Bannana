import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./QuickPage.css";

const QUICK_SETTINGS_STORAGE_KEY =
  "bannana-quick-settings";

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
  {
    id: "CULTURE",
    icon: "🎨",
    label: "전시",
  },
  {
    id: "SHOPPING",
    icon: "🛍️",
    label: "쇼핑",
  },
  {
    id: "PARK",
    icon: "🌳",
    label: "공원",
  },
];

function QuickPage() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      meetingDate: "",
      meetingTime: "",
      transportMode: "TRANSIT",
      preferredCategories: [],
    });

  /* =====================================================
     날짜 / 시간 입력
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     장소 유형 선택 / 해제
  ===================================================== */

  const toggleCategory = (
    category
  ) => {
    setFormData((prev) => {
      const isSelected =
        prev.preferredCategories.includes(
          category
        );

      return {
        ...prev,

        preferredCategories:
          isSelected
            ? prev.preferredCategories.filter(
                (item) =>
                  item !== category
              )
            : [
                ...prev.preferredCategories,
                category,
              ],
      };
    });
  };

  /* =====================================================
     다음 단계

     1. 입력 검증
     2. sessionStorage 저장
     3. /quick/origins 이동

     ★ alert 없음
  ===================================================== */

  const handleNext = () => {
    if (!formData.meetingDate) {
      alert(
        "약속 날짜를 선택해주세요."
      );

      return;
    }

    if (!formData.meetingTime) {
      alert(
        "약속 시간을 선택해주세요."
      );

      return;
    }

    if (
      formData.preferredCategories
        .length === 0
    ) {
      alert(
        "원하는 장소 유형을 하나 이상 선택해주세요."
      );

      return;
    }

    /* 입력 정보 저장 */

    sessionStorage.setItem(
      QUICK_SETTINGS_STORAGE_KEY,
      JSON.stringify(formData)
    );

    /* ==============================
       출발지 입력 화면으로 이동
    ============================== */

    navigate("/quick/origins");
  };

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
            <span>🗓️</span>
          </h1>

          <p>
            이번 약속에 필요한
            정보만 입력하세요
          </p>
        </div>

        {/* Progress */}

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
            날짜 / 시간
        =============================================== */}

        <article className="quick-card">
          <h2 className="quick-card-title">
            🗓️ 약속 날짜 & 시간
          </h2>

          <div className="quick-date-time">
            {/* DATE */}

            <div className="quick-field">
              <label htmlFor="meetingDate">
                날짜
              </label>

              <input
                id="meetingDate"
                type="date"
                name="meetingDate"
                className="quick-input"
                value={
                  formData.meetingDate
                }
                onChange={
                  handleChange
                }
              />
            </div>

            {/* TIME */}

            <div className="quick-field">
              <label htmlFor="meetingTime">
                시간
              </label>

              <input
                id="meetingTime"
                type="time"
                name="meetingTime"
                className="quick-input"
                value={
                  formData.meetingTime
                }
                onChange={
                  handleChange
                }
              />
            </div>
          </div>
        </article>

        {/* ===============================================
            이동수단

            MVP = 대중교통 고정
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
            장소 유형
        =============================================== */}

        <article className="quick-card">
          <h2 className="quick-card-title">
            📍 원하는 장소 유형
          </h2>

          <p className="quick-card-help">
            중복 선택 가능해요
          </p>

          <div className="quick-place-types">
            {PLACE_TYPES.map(
              (place) => {
                const isSelected =
                  formData.preferredCategories.includes(
                    place.id
                  );

                return (
                  <button
                    key={place.id}
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
                      {place.icon}
                    </span>

                    {place.label}
                  </button>
                );
              }
            )}
          </div>
        </article>
      </section>

      {/* =================================================
          BOTTOM
      ================================================= */}

      <footer className="quick-bottom">
        <button
          type="button"
          className="quick-next-button"
          onClick={handleNext}
        >
          다음 단계 →
        </button>
      </footer>
    </main>
  );
}

export default QuickPage;