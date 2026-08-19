import { useState } from "react";
import { useNavigate } from "react-router-dom";

import LocationSearch from "../components/common/LocationSearch";
import KakaoMap from "../components/map/KakaoMap";

import {
  createRoom,
  registerHost,
} from "../api/bannanaApi";

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

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

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
     ORIGIN TEXT CHANGE
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
          직접 글자를 수정하면
          기존 좌표는 더 이상 정확하지 않음.
        */
        hostOriginLat: null,

        hostOriginLng: null,
      })
    );
  };

  /* =====================================================
     KAKAO PLACE SELECT
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
     REAL ROOM CREATE
  ===================================================== */

  const handleCreate =
    async () => {
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

      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        /* ================================================
           1. ROOM CREATE

           POST /rooms
        ================================================ */

        const roomResponse =
          await createRoom({
            title:
              formData.title.trim(),

            meetingDate:
              formData.meetingDate,

            meetingTime:
              formData.meetingTime,

            transportMode:
              "transit",

            /*
              프론트에서는
              CAFE / RESTAURANT를 사용하지만

              API 요청에서는
              cafe / restaurant로 전달.
            */
            placeTypes:
              formData.preferredCategories.map(
                (category) =>
                  category.toLowerCase()
              ),
          });

        const roomId =
          roomResponse.roomId;

        if (!roomId) {
          throw new Error(
            "방 생성 응답에서 roomId를 받지 못했습니다."
          );
        }

        /* ================================================
           2. HOST REGISTER

           POST /rooms/{roomId}/host
        ================================================ */

        const hostResponse =
          await registerHost(
            roomId,
            {
              name:
                formData.hostName.trim(),

              originText:
                formData.hostOrigin.trim(),

              originLat:
                formData.hostOriginLat,

              originLng:
                formData.hostOriginLng,
            }
          );

        /* ================================================
           3. FRONTEND INVITE LINK

           백엔드는 현재 /invite/{roomId}를 반환하지만
           프론트 Route는 /join/{roomId}이므로
           프론트에서 직접 생성.
        ================================================ */

        const inviteLink =
          `${window.location.origin}/join/${roomId}`;

        /* ================================================
           4. FRONTEND ROOM DATA

           기존 화면들이 사용하는 데이터 구조와
           최대한 호환되도록 저장.
        ================================================ */

        const frontendRoom = {
          id:
            roomResponse.roomId,

          roomId:
            roomResponse.roomId,

          title:
            roomResponse.title,

          meetingDate:
            roomResponse.meetingDate,

          meetingTime:
            roomResponse.meetingTime,

          meetingDateTime:
            `${roomResponse.meetingDate}T${roomResponse.meetingTime}`,

          transportMode:
            roomResponse.transportMode,

          preferredCategories:
            roomResponse.placeTypes,

          status:
            roomResponse.status,

          host: {
            id:
              hostResponse.participantId,

            nickname:
              formData.hostName.trim(),

            origin: {
              text:
                formData.hostOrigin.trim(),

              lat:
                formData.hostOriginLat,

              lng:
                formData.hostOriginLng,
            },
          },

          inviteLink,
        };

        /* ================================================
           5. LOCAL FRONTEND CACHE

           화면 새로고침 시에도
           방 정보를 사용할 수 있도록 저장.
        ================================================ */

        saveRoomDraft({
          roomId,

          title:
            formData.title.trim(),

          meetingDate:
            formData.meetingDate,

          meetingTime:
            formData.meetingTime,

          hostParticipantId:
            hostResponse.participantId,

          hostName:
            formData.hostName.trim(),

          hostOrigin:
            formData.hostOrigin.trim(),

          hostOriginLat:
            formData.hostOriginLat,

          hostOriginLng:
            formData.hostOriginLng,

          preferredCategories:
            roomResponse.placeTypes,

          transportMode:
            roomResponse.transportMode,

          inviteLink,

          /*
            현재 백엔드가 실제로 반환한 값도
            확인용으로 저장.
          */
          backendInviteUrl:
            hostResponse.inviteUrl,
        });

        /* ================================================
           6. SHARE PAGE
        ================================================ */

        navigate(
          `/room/${roomId}/share`,
          {
            state: {
              room:
                frontendRoom,

              inviteLink,

              hostParticipantId:
                hostResponse.participantId,
            },
          }
        );
      } catch (error) {
        console.error(
          "약속방 생성 실패:",
          error
        );

        alert(
          error.message ||
            "약속방 생성에 실패했습니다."
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
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
                disabled={
                  isSubmitting
                }
              />
            </div>

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
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "약속방 만드는 중..."
              : "🔗 초대 링크 생성하기"}
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