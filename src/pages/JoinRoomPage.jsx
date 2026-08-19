import {
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import {
    getMockParticipants,
    getMockRoom,
  } from "../data/mockData";
  
  import "./JoinRoomPage.css";

import bannanaLogo from "../assets/bannana-logo.svg";
  
  function JoinRoomPage() {
    const navigate = useNavigate();
  
    const { inviteCode } = useParams();
  
    /*
      현재는 Mock 방 정보.
  
      API 연결 후:
      GET /rooms/invite/:inviteCode
      같은 요청 결과로 교체하면 된다.
    */
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
  
      까지 이미 참여했다고 가정하고,
  
      초대 링크에 접속한 사람이
      4번째 참여자가 된다.
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
      `bannana-participant-${inviteCode}`;
  
    const [step, setStep] =
      useState("invite");
  
    const [formData, setFormData] =
      useState({
        nickname: "",
        originText: "",
      });
  
    const [errors, setErrors] =
      useState({});
  
    /* ==========================================
       MEETING INFO
    ========================================== */
  
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
            category === "RESTAURANT"
          ) {
            return "식당";
          }
  
          if (category === "CULTURE") {
            return "문화";
          }
  
          return category;
        })
        .join(", ");
  
    /* ==========================================
       INPUT
    ========================================== */
  
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
  
      /*
        입력을 다시 시작하면
        해당 필드 오류 제거
      */
      setErrors(
        (prev) => ({
          ...prev,
          [name]: "",
        })
      );
    };
  
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
      }
  
      setErrors(nextErrors);
  
      return (
        Object.keys(nextErrors)
          .length === 0
      );
    };
  
    /* ==========================================
       PARTICIPANT SUBMIT
    ========================================== */
  
    const handleSubmit = () => {
      if (!validateForm()) {
        return;
      }
  
      /*
        실제 API 연결 후에는
  
        POST /rooms/:roomId/participants
  
        요청 body가 될 데이터와
        최대한 유사하게 구성
      */
      const participant = {
        id:
          participantTemplate?.id ??
          4,
  
        nickname:
          formData.nickname.trim(),
  
        originType:
          "STATION",
  
        originText:
          formData.originText.trim(),
  
        /*
          실제 좌표는 추후
          카카오 Local API 결과 사용
        */
        originLat:
          participantTemplate
            ?.origin?.lat ?? null,
  
        originLng:
          participantTemplate
            ?.origin?.lng ?? null,
  
        transportMode:
          "TRANSIT",
  
        submitted: true,
  
        isHost: false,
  
        /*
          실제 API 연결 후
          중간지점 계산 결과에서 받음
        */
        travelTime: 37,
      };
  
      /*
        현재 Mock 단계에서는
        Participant Flow의 다음 화면들이
        사용자의 입력값을 읽을 수 있도록
        sessionStorage에 저장한다.
  
        API 연결 후 이 부분은
        서버 저장으로 교체.
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
  
    const handleWaitResult = () => {
      navigate(
        `/join/${inviteCode}/waiting`
      );
    };
  
    /* ==========================================
       STEP 1
       INVITATION
    ========================================== */
  
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
  
    /* ==========================================
       STEP 2
       INPUT
    ========================================== */
  
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
  
          <section className="join-form">
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
  
            <div className="join-field">
              <label htmlFor="originText">
                출발지
                <span>
                  *
                </span>
              </label>
  
              <input
                id="originText"
                name="originText"
                className={`join-input ${
                  errors.originText
                    ? "join-input--error"
                    : ""
                }`}
                placeholder={`예: ${
                  participantTemplate
                    ?.origin?.text ??
                  "회기역"
                }`}
                value={
                  formData.originText
                }
                onChange={
                  handleChange
                }
              />
  
              {errors.originText && (
                <p className="join-error">
                  {
                    errors.originText
                  }
                </p>
              )}
            </div>
  
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
  
    /* ==========================================
       STEP 3
       COMPLETE
    ========================================== */
  
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