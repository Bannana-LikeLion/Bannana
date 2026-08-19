import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import LocationSearch from "../components/common/LocationSearch";
import KakaoMap from "../components/map/KakaoMap";

import bannanaLogo from "../assets/bannana-logo.svg";

import {
  getMockParticipants,
  getMockRoom,
} from "../data/mockData";

import "./JoinRoomPage.css";

function JoinRoomPage() {
  const navigate = useNavigate();

  /*
    현재 App.jsx의 Route가
    /join/:inviteCode 이므로 일단 그대로 읽는다.

    실제 값은 앞으로 roomId로 사용한다.
  */
  const { inviteCode } = useParams();

  const roomId = inviteCode;

  /* =====================================================
     MOCK ROOM
  ===================================================== */

  const room = useMemo(
    () => getMockRoom(),
    []
  );

  const mockParticipants = useMemo(
    () => getMockParticipants(),
    []
  );

  /*
    Mock 데모에서는

    1. 호스트
    2. 송현석
    3. 김보경

    까지 참여한 상태이고,

    현재 초대 링크로 접속한 사용자가
    4번째 참여자가 된다고 가정한다.
  */

  const existingParticipants =
    mockParticipants.slice(0, -1);

  const participantTemplate =
    mockParticipants[
      mockParticipants.length - 1
    ];

  const totalParticipantCount =
    existingParticipants.length + 1;

  const participantStorageKey =
    `bannana-participant-${roomId}`;

  /* =====================================================
     STEP
  ===================================================== */

  const [step, setStep] =
    useState("invite");

  /* =====================================================
     PARTICIPANT FORM
  ===================================================== */

  const [formData, setFormData] =
    useState({
      nickname: "",

      originText: "",

      originLat: null,

      originLng: null,
    });

  const [errors, setErrors] =
    useState({});

  /* =====================================================
     MEETING INFO
  ===================================================== */

  const meetingDate = new Date(
    room.meetingDateTime
  );

  const meetingDateText =
    new Intl.DateTimeFormat(
      "ko-KR",
      {
        month: "long",
        day: "numeric",
        weekday: "short",
      }
    ).format(meetingDate);

  const meetingTimeText =
    new Intl.DateTimeFormat(
      "ko-KR",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    ).format(meetingDate);

  const categoryText =
    room.preferredCategories
      .map((category) => {
        if (category === "CAFE") {
          return "카페";
        }

        if (
          category ===
          "RESTAURANT"
        ) {
          return "식당";
        }

        if (
          category === "CULTURE"
        ) {
          return "문화";
        }

        return category;
      })
      .join(", ");

  /* =====================================================
     NAME INPUT
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

    setErrors(
      (prev) => ({
        ...prev,

        [name]: "",
      })
    );
  };

  /* =====================================================
     ORIGIN TEXT INPUT
  ===================================================== */

  const handleOriginInputChange = (
    value
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        originText: value,

        /*
          검색 결과를 선택한 후
          사용자가 텍스트를 다시 수정하면
          기존 좌표는 더 이상 유효하지 않음.
        */
        originLat: null,

        originLng: null,
      })
    );

    setErrors(
      (prev) => ({
        ...prev,

        originText: "",
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

        originText:
          place.placeName,

        originLat:
          place.lat,

        originLng:
          place.lng,
      })
    );

    setErrors(
      (prev) => ({
        ...prev,

        originText: "",
      })
    );
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateForm = () => {
    const nextErrors = {};

    if (
      !formData.nickname.trim()
    ) {
      nextErrors.nickname =
        "이름을 입력해주세요.";
    }

    if (
      !formData.originText.trim()
    ) {
      nextErrors.originText =
        "출발지를 입력해주세요.";
    } else if (
      !Number.isFinite(
        formData.originLat
      ) ||
      !Number.isFinite(
        formData.originLng
      )
    ) {
      nextErrors.originText =
        "출발지를 검색한 뒤 검색 결과에서 하나를 선택해주세요.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  /* =====================================================
     PARTICIPANT SUBMIT
  ===================================================== */

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    /*
      지금은 Mock 저장.

      실제 API 연결 후에는:

      POST /rooms/{roomId}/participants

      {
        name,
        originText,
        originLat,
        originLng
      }

      형태로 서버에 전달한다.
    */

    const participant = {
      id:
        participantTemplate?.id ??
        4,

      nickname:
        formData.nickname.trim(),

      originType:
        "PLACE",

      originText:
        formData.originText.trim(),

      originLat:
        formData.originLat,

      originLng:
        formData.originLng,

      transportMode:
        "TRANSIT",

      submitted: true,

      isHost: false,

      /*
        실제 API 연결 후
        Recommendation 결과로 교체.
      */
      travelTime: 37,
    };

    /*
      다음 Participant 화면에서도
      현재 입력값을 사용할 수 있도록
      sessionStorage에 임시 저장.
    */

    sessionStorage.setItem(
      participantStorageKey,
      JSON.stringify(
        participant
      )
    );

    setStep("complete");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================================
     WAITING PAGE
  ===================================================== */

  const handleWaitResult = () => {
    navigate(
      `/join/${roomId}/waiting`
    );
  };

  /* =====================================================
     STEP 1
     INVITATION
  ===================================================== */

  if (step === "invite") {
    return (
      <main className="join-page join-page--invite app-container">
        <header className="join-invite-header">
          <div className="join-logo">
            <img
              src={bannanaLogo}
              alt="반나나 로고"
              className="join-logo__image"
            />

            <strong>
              반나나
            </strong>
          </div>

          <div className="join-invite-badge">
            초대장
          </div>
        </header>

        <div className="join-invite-character">
          🐵
        </div>

        <section className="join-invite-card">
          <p className="join-invite-host">
            {room.host.nickname}님이
            초대했어요
          </p>

          <h1>
            {room.title}
          </h1>

          <div className="join-invite-info">
            <div className="join-invite-info__row">
              <span>
                🗓️ 날짜
              </span>

              <strong>
                {meetingDateText}{" "}
                {meetingTimeText}
              </strong>
            </div>

            <div className="join-invite-info__row">
              <span>
                🚇 이동수단
              </span>

              <strong>
                대중교통
              </strong>
            </div>

            <div className="join-invite-info__row">
              <span>
                📍 장소 유형
              </span>

              <strong>
                {categoryText}
              </strong>
            </div>
          </div>

          <div className="join-existing">
            <div className="join-existing__avatars">
              {existingParticipants.map(
                (
                  participant,
                  index
                ) => (
                  <div
                    key={
                      participant.id
                    }
                    className={`join-mini-avatar join-mini-avatar--${
                      index + 1
                    }`}
                  >
                    {participant.nickname.charAt(
                      0
                    )}
                  </div>
                )
              )}
            </div>

            <strong>
              {
                existingParticipants.length
              }
              명이 이미 참여했어요
            </strong>
          </div>
        </section>

        <div className="join-no-login">
          <span>
            ✅
          </span>

          <p>
            로그인·회원가입 없이
            바로 참여할 수 있어요
          </p>
        </div>

        <footer className="join-fixed-bottom">
          <button
            type="button"
            className="join-primary-button"
            onClick={() =>
              setStep("input")
            }
          >
            🍌 출발지 입력하고
            참여하기
          </button>

          <p>
            내 출발지만 입력하면 끝!
            이동시간이 공평한 장소를
            찾아드려요
          </p>
        </footer>
      </main>
    );
  }

  /* =====================================================
     STEP 2
     PARTICIPANT INPUT
  ===================================================== */

  if (step === "input") {
    return (
      <main className="join-page join-input-page app-container">
        <header className="join-input-header">
          <button
            type="button"
            className="join-back-button"
            onClick={() =>
              setStep("invite")
            }
            aria-label="뒤로가기"
          >
            ←
          </button>

          <div className="join-progress">
            <div className="join-progress__bar join-progress__bar--active" />

            <div className="join-progress__bar" />

            <div className="join-progress__bar" />

            <span>
              1/3
            </span>
          </div>

          <h1>
            내 출발지 입력
          </h1>

          <p>
            이름과 출발지만 입력하면
            돼요. 딱 10초면 충분해요
            🍌
          </p>
        </header>

        {/* =================================================
            ROOM SUMMARY
        ================================================= */}

        <section className="join-room-summary">
          <div className="join-room-summary__icon">
            🍌
          </div>

          <div>
            <strong>
              {room.title}
            </strong>

            <p>
              {meetingDateText}{" "}
              {meetingTimeText}
            </p>
          </div>
        </section>

        {/* =================================================
            FORM
        ================================================= */}

        <section className="join-form">
          {/* NAME */}

          <div className="join-field">
            <label htmlFor="nickname">
              이름
              <span>
                *
              </span>
            </label>

            <input
              id="nickname"
              name="nickname"
              className={`join-input ${
                errors.nickname
                  ? "join-input--error"
                  : ""
              }`}
              placeholder={`예: ${
                participantTemplate
                  ?.nickname ??
                "이지은"
              }`}
              value={
                formData.nickname
              }
              onChange={
                handleChange
              }
            />

            {errors.nickname && (
              <p className="join-error">
                {
                  errors.nickname
                }
              </p>
            )}
          </div>

          {/* ORIGIN */}

          <div className="join-field">
            <label>
              출발지
              <span>
                *
              </span>
            </label>

            <LocationSearch
              value={
                formData.originText
              }
              onInputChange={
                handleOriginInputChange
              }
              onSelect={
                handleOriginSelect
              }
              placeholder="예: 회기역"
              inputClassName={
                errors.originText
                  ? "join-input join-input--error"
                  : "join-input"
              }
            />

            {errors.originText && (
              <p className="join-error">
                {
                  errors.originText
                }
              </p>
            )}

            {/* =============================================
                REAL KAKAO MAP
            ============================================= */}

            <div className="join-origin-map">
              <KakaoMap
                lat={
                  formData.originLat
                }
                lng={
                  formData.originLng
                }
                placeName={
                  formData.originText
                }
                userName={
                  formData.nickname.trim()
                }
                height={180}
                emptyMessage="출발지를 검색하고 선택해주세요"
              />
            </div>
          </div>

          {/* PRIVACY */}

          <div className="join-privacy-notice">
            <span>
              🔒
            </span>

            <p>
              입력한 정보는 중간 지점
              계산에만 사용돼요.
              정확한 주소는 다른
              참여자에게 공유되지
              않아요.
            </p>
          </div>
        </section>

        <footer className="join-input-bottom">
          <button
            type="button"
            className="join-primary-button"
            onClick={
              handleSubmit
            }
          >
            출발지 제출하기 →
          </button>
        </footer>
      </main>
    );
  }

  /* =====================================================
     STEP 3
     COMPLETE
  ===================================================== */

  return (
    <main className="join-page join-complete-page app-container">
      <div className="join-complete-progress">
        <div className="join-progress">
          <div className="join-progress__bar join-progress__bar--active" />

          <div className="join-progress__bar join-progress__bar--active" />

          <div className="join-progress__bar" />

          <span>
            2/3
          </span>
        </div>
      </div>

      <section className="join-complete-hero">
        <div className="join-complete-character">
          🐵
        </div>

        <h1>
          출발지 제출 완료! 🎉
        </h1>

        <p>
          {formData.nickname}님의
          출발지가 등록됐어요.
          <br />

          호스트가 중간 지점을
          찾으면
          <br />

          <strong>
            바로 알려드릴게요!
          </strong>
        </p>
      </section>

      <section className="join-submitted-card">
        <h2>
          제출 내용 확인
        </h2>

        <div className="join-submitted-row">
          <span>
            👤 이름
          </span>

          <strong>
            {formData.nickname}
          </strong>
        </div>

        <div className="join-submitted-row">
          <span>
            📍 출발지
          </span>

          <strong>
            {formData.originText}
          </strong>
        </div>

        <div className="join-submitted-row">
          <span>
            🍌 약속방
          </span>

          <strong>
            {room.title}
          </strong>
        </div>
      </section>

      <section className="join-complete-count">
        <div className="join-complete-avatars">
          {existingParticipants.map(
            (
              participant,
              index
            ) => (
              <div
                key={
                  participant.id
                }
                className={`join-complete-avatar join-complete-avatar--${
                  index + 1
                }`}
              >
                {participant.nickname.charAt(
                  0
                )}
              </div>
            )
          )}

          <div className="join-complete-avatar join-complete-avatar--4">
            {formData.nickname.charAt(
              0
            )}
          </div>
        </div>

        <div>
          <strong>
            {totalParticipantCount}
            명 참여 완료
          </strong>

          <p>
            모든 참여자가 출발지를
            입력했어요
          </p>
        </div>
      </section>

      <footer className="join-complete-bottom">
        <button
          type="button"
          className="join-primary-button"
          onClick={
            handleWaitResult
          }
        >
          결과 기다리기 →
        </button>
      </footer>
    </main>
  );
}

export default JoinRoomPage;