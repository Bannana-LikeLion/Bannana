import { useState } from "react";
import { useNavigate } from "react-router-dom";

import LocationSearch from "../components/common/LocationSearch";
import KakaoMap from "../components/map/KakaoMap";

import {
  saveRoomDraft,
} from "../data/roomStorage";

import "./CreateRoomPage.css";

function CreateRoomPage() {
  const navigate =
    useNavigate();

  const [
    step,
    setStep,
  ] = useState(1);

  /* =====================================================
     FORM
  ===================================================== */

  const [
    formData,
    setFormData,
  ] = useState({
    title: "",

    meetingDate: "",

    meetingTime: "",

    hostName: "",

    hostOrigin: "",

    hostOriginLat: null,

    hostOriginLng: null,

    preferredCategories: [],
  });

  /* =====================================================
     BASIC INPUT
  ===================================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (prev) => ({
        ...prev,

        [name]: value,
      })
    );
  };

  /* =====================================================
     HOST ORIGIN INPUT
  ===================================================== */

  const handleOriginInputChange = (
    value
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        hostOrigin: value,

        /*
          검색 결과를 선택한 뒤
          사용자가 다시 직접 텍스트를
          수정하면 기존 좌표는
          정확하지 않으므로 초기화.
        */
        hostOriginLat: null,

        hostOriginLng: null,
      })
    );
  };

  /* =====================================================
     HOST ORIGIN SELECT
  ===================================================== */

  const handleOriginSelect = (
    place
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        hostOrigin:
          place.placeName,

        hostOriginLat:
          place.lat,

        hostOriginLng:
          place.lng,
      })
    );
  };

  /* =====================================================
     PLACE CATEGORY
  ===================================================== */

  const toggleCategory = (
    category
  ) => {
    setFormData(
      (prev) => {
        const selected =
          prev.preferredCategories.includes(
            category
          );

        return {
          ...prev,

          preferredCategories:
            selected
              ? prev.preferredCategories.filter(
                  (item) =>
                    item !==
                    category
                )
              : [
                  ...prev.preferredCategories,
                  category,
                ],
        };
      }
    );
  };

  /* =====================================================
     STEP 1 → STEP 2
  ===================================================== */

  const handleNext = () => {
    if (
      !formData.title.trim()
    ) {
      alert(
        "약속방 이름을 입력해주세요."
      );

      return;
    }

    if (
      !formData.meetingDate ||
      !formData.meetingTime
    ) {
      alert(
        "약속 날짜와 시간을 입력해주세요."
      );

      return;
    }

    if (
      formData
        .preferredCategories
        .length === 0
    ) {
      alert(
        "원하는 장소 유형을 하나 이상 선택해주세요."
      );

      return;
    }

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     ROOM CREATE
  ===================================================== */

  const handleCreate = () => {
    if (
      !formData.hostName.trim()
    ) {
      alert(
        "이름을 입력해주세요."
      );

      return;
    }

    if (
      !formData.hostOrigin.trim()
    ) {
      alert(
        "출발지를 입력해주세요."
      );

      return;
    }

    if (
      !Number.isFinite(
        formData.hostOriginLat
      ) ||
      !Number.isFinite(
        formData.hostOriginLng
      )
    ) {
      alert(
        "출발지를 검색한 뒤 검색 결과에서 하나를 선택해주세요."
      );

      return;
    }

    /*
      아직 이번 단계에서는
      기존 Mock 저장을 유지한다.

      다음 단계에서 실제 백엔드의

      POST /rooms
      POST /rooms/{roomId}/host

      로 교체한다.
    */

    saveRoomDraft({
      title:
        formData.title.trim(),

      meetingDate:
        formData.meetingDate,

      meetingTime:
        formData.meetingTime,

      hostName:
        formData.hostName.trim(),

      hostOrigin:
        formData.hostOrigin.trim(),

      hostOriginLat:
        formData.hostOriginLat,

      hostOriginLng:
        formData.hostOriginLng,

      preferredCategories:
        formData.preferredCategories,
    });

    navigate(
      "/room/room-demo-001/share"
    );
  };

  /* =====================================================
     STEP 2
     HOST ORIGIN
  ===================================================== */

  if (step === 2) {
    return (
      <main className="create-page app-container">
        <header className="create-header">
          <button
            type="button"
            className="create-back-button"
            onClick={() => {
              setStep(1);

              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });
            }}
            aria-label="이전 단계"
          >
            ←
          </button>

          <div className="create-title-row">
            <div className="create-title-icon">
              📍
            </div>

            <div>
              <h1 className="create-title">
                내 출발지 입력
              </h1>

              <p className="create-subtitle">
                호스트의 출발지를
                먼저 설정해요
              </p>
            </div>
          </div>

          <div className="create-progress">
            <div className="create-progress__bar create-progress__bar--active" />

            <div className="create-progress__bar create-progress__bar--active" />

            <div className="create-progress__bar" />

            <div className="create-progress__bar" />
          </div>

          <p className="create-step-text">
            2 / 4단계 · 내 출발지
          </p>
        </header>

        <div className="create-content">
          {/* ===============================
              REAL KAKAO MAP
          =============================== */}

          <KakaoMap
            lat={
              formData.hostOriginLat
            }
            lng={
              formData.hostOriginLng
            }
            placeName={
              formData.hostOrigin
            }
            userName={
              formData.hostName.trim()
            }
          />

          {/* ===============================
              HOST CARD
          =============================== */}

          <section className="create-card host-card">
            <div className="host-card__header">
              <div className="host-avatar">
                👤
              </div>

              <div>
                <h2>
                  호스트 정보
                </h2>

                <p>
                  약속방 생성자로
                  표시돼요
                </p>
              </div>
            </div>

            {/* NAME */}

            <div className="host-field">
              <label htmlFor="hostName">
                이름
              </label>

              <input
                id="hostName"
                type="text"
                name="hostName"
                className="create-input"
                value={
                  formData.hostName
                }
                onChange={
                  handleChange
                }
                placeholder="예: 박지수"
              />
            </div>

            {/* ORIGIN */}

            <div className="host-field">
              <label>
                출발지
              </label>

              <LocationSearch
                value={
                  formData.hostOrigin
                }
                onInputChange={
                  handleOriginInputChange
                }
                onSelect={
                  handleOriginSelect
                }
                placeholder="예: 수원역"
                inputClassName="create-input"
              />
            </div>

            {/* NOTICE */}

            <div className="host-notice">
              <span>
                🍌
              </span>

              <p>
                초대 링크를 받은
                참여자들도 각자
                출발지를 직접
                입력해요. 호스트
                위치도 공평한 중간
                지점 계산에
                사용돼요.
              </p>
            </div>
          </section>
        </div>

        <footer className="create-bottom">
          <button
            type="button"
            className="create-primary-button"
            onClick={
              handleCreate
            }
          >
            🔗 초대 링크 생성하기
          </button>
        </footer>
      </main>
    );
  }

  /* =====================================================
     STEP 1
     ROOM SETTING
  ===================================================== */

  return (
    <main className="create-page app-container">
      <header className="create-header">
        <button
          type="button"
          className="create-back-button"
          onClick={() =>
            navigate("/")
          }
          aria-label="홈으로 돌아가기"
        >
          ←
        </button>

        <div className="create-title-row">
          <div className="create-title-icon">
            🍌
          </div>

          <div>
            <h1 className="create-title">
              약속방 만들기
            </h1>

            <p className="create-subtitle">
              호스트가 약속 조건을
              먼저 설정해요
            </p>
          </div>
        </div>

        <div className="create-progress">
          <div className="create-progress__bar create-progress__bar--active" />

          <div className="create-progress__bar" />

          <div className="create-progress__bar" />

          <div className="create-progress__bar" />
        </div>

        <p className="create-step-text">
          1 / 4단계 · 약속방 설정
        </p>
      </header>

      <div className="create-content">
        {/* ROOM NAME */}

        <section className="create-card">
          <label
            className="create-card-title"
            htmlFor="title"
          >
            📝 약속방 이름
          </label>

          <input
            id="title"
            type="text"
            name="title"
            className="create-input"
            value={
              formData.title
            }
            onChange={
              handleChange
            }
            placeholder="약속 이름을 입력해주세요"
          />
        </section>

        {/* DATE / TIME */}

        <section className="create-card">
          <h2 className="create-card-title">
            🗓️ 약속 날짜 & 시간
          </h2>

          <div className="create-date-time">
            <div className="create-field">
              <label
                className="create-field-label"
                htmlFor="meetingDate"
              >
                날짜
              </label>

              <input
                id="meetingDate"
                type="date"
                name="meetingDate"
                className="create-input"
                value={
                  formData.meetingDate
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="create-field">
              <label
                className="create-field-label"
                htmlFor="meetingTime"
              >
                시간
              </label>

              <input
                id="meetingTime"
                type="time"
                name="meetingTime"
                className="create-input"
                value={
                  formData.meetingTime
                }
                onChange={
                  handleChange
                }
              />
            </div>
          </div>
        </section>

        {/* TRANSPORT */}

        <section className="create-card">
          <h2 className="create-card-title">
            🚇 이동수단
          </h2>

          <div className="transport-list">
            <button
              type="button"
              className="transport-button transport-button--selected"
              aria-pressed="true"
            >
              <span>
                🚇
              </span>

              <strong>
                대중교통
              </strong>
            </button>
          </div>
        </section>

        {/* PLACE TYPE */}

        <section className="create-card">
          <h2 className="create-card-title">
            📍 원하는 장소 유형
          </h2>

          <p className="create-help-text">
            중복 선택 가능해요
          </p>

          <div className="place-type-list">
            <button
              type="button"
              className={
                formData.preferredCategories.includes(
                  "CAFE"
                )
                  ? "place-type-button place-type-button--selected"
                  : "place-type-button"
              }
              aria-pressed={
                formData.preferredCategories.includes(
                  "CAFE"
                )
              }
              onClick={() =>
                toggleCategory(
                  "CAFE"
                )
              }
            >
              ☕ 카페
            </button>

            <button
              type="button"
              className={
                formData.preferredCategories.includes(
                  "RESTAURANT"
                )
                  ? "place-type-button place-type-button--selected"
                  : "place-type-button"
              }
              aria-pressed={
                formData.preferredCategories.includes(
                  "RESTAURANT"
                )
              }
              onClick={() =>
                toggleCategory(
                  "RESTAURANT"
                )
              }
            >
              🍽️ 식당
            </button>
          </div>
        </section>
      </div>

      <footer className="create-bottom">
        <button
          type="button"
          className="create-primary-button"
          onClick={
            handleNext
          }
        >
          다음: 내 출발지 입력 →
        </button>
      </footer>
    </main>
  );
}

export default CreateRoomPage;