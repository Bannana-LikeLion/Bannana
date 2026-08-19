import {
  useEffect,
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
  getRoomStatus,
  registerParticipant,
} from "../api/bannanaApi";

import "./JoinRoomPage.css";

/* =====================================================
   CATEGORY LABEL
===================================================== */

const CATEGORY_LABELS = {
  CAFE: "카페",
  RESTAURANT: "식당",
  EXHIBITION: "전시",
  SHOPPING: "쇼핑",
  PARK: "공원",
};

/* =====================================================
   JOIN ROOM PAGE
===================================================== */

function JoinRoomPage() {
  const navigate =
    useNavigate();

  /*
    현재 Route 이름은 inviteCode지만
    실제로는 roomId를 사용한다.

    /join/2
    → roomId = "2"
  */
  const { inviteCode } =
    useParams();

  const roomId =
    inviteCode;

  /* =====================================================
     API ROOM DATA
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
    loadError,
    setLoadError,
  ] = useState("");

  /* =====================================================
     STEP

     invite
     → input
     → complete
  ===================================================== */

  const [
    step,
    setStep,
  ] = useState("invite");

  /* =====================================================
     FORM
  ===================================================== */

  const [
    formData,
    setFormData,
  ] = useState({
    nickname: "",

    originText: "",

    originLat: null,

    originLng: null,
  });

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /* =====================================================
     LOAD ROOM

     GET /rooms/{roomId}/status
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    const loadRoom =
      async () => {
        try {
          setIsLoading(true);
          setLoadError("");

          const data =
            await getRoomStatus(
              roomId
            );

          if (!cancelled) {
            setRoomStatus(data);
          }
        } catch (error) {
          console.error(
            "초대방 정보 조회 실패:",
            error
          );

          if (!cancelled) {
            setLoadError(
              error.message ||
                "약속방 정보를 불러오지 못했습니다."
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
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

     Backend:
     host
     participants[]

     두 데이터를 하나의 배열로 합친다.
  ===================================================== */

  const existingParticipants =
    useMemo(() => {
      if (!roomStatus) {
        return [];
      }

      return [
        roomStatus.host,
        ...(roomStatus.participants ??
          []),
      ].filter(Boolean);
    }, [roomStatus]);

  /* =====================================================
     MEETING INFO
  ===================================================== */

  const meetingDateText =
    useMemo(() => {
      if (
        !roomStatus?.meetingDate
      ) {
        return "";
      }

      const date =
        new Date(
          `${roomStatus.meetingDate}T00:00:00`
        );

      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          month: "long",
          day: "numeric",
          weekday: "short",
        }
      ).format(date);
    }, [
      roomStatus?.meetingDate,
    ]);

  const meetingTimeText =
    useMemo(() => {
      if (
        !roomStatus?.meetingTime
      ) {
        return "";
      }

      const [
        hour,
        minute,
      ] =
        roomStatus.meetingTime.split(
          ":"
        );

      const date =
        new Date();

      date.setHours(
        Number(hour),
        Number(minute),
        0,
        0
      );

      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      ).format(date);
    }, [
      roomStatus?.meetingTime,
    ]);

  const categoryText =
    useMemo(() => {
      return (
        roomStatus?.placeTypes ??
        []
      )
        .map(
          (category) =>
            CATEGORY_LABELS[
              category
            ] ?? category
        )
        .join(", ");
    }, [
      roomStatus?.placeTypes,
    ]);

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
     ORIGIN INPUT

     검색 결과를 선택한 뒤
     사용자가 텍스트를 다시 수정하면
     기존 좌표는 무효 처리.
  ===================================================== */

  const handleOriginInputChange = (
    value
  ) => {
    setFormData(
      (prev) => ({
        ...prev,

        originText: value,

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
     KAKAO LOCATION SELECT
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

  const validateForm =
    () => {
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
     REAL PARTICIPANT REGISTER

     POST /rooms/{roomId}/participants
  ===================================================== */

  const handleSubmit =
    async () => {
      if (!validateForm()) {
        return;
      }

      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        const participantResponse =
          await registerParticipant(
            roomId,
            {
              name:
                formData.nickname.trim(),

              originText:
                formData.originText.trim(),

              originLat:
                formData.originLat,

              originLng:
                formData.originLng,
            }
          );

        /*
          Backend 응답:

          participant_id
          nickname
          origin_text
          origin_lat
          origin_lng
          role

          ↓

          기존 Participant 화면들이
          사용하기 편한 형태로 변환.
        */

        const participant = {
          id:
            participantResponse.participant_id,

          participantId:
            participantResponse.participant_id,

          nickname:
            participantResponse.nickname,

          originText:
            participantResponse.origin_text,

          originLat:
            participantResponse.origin_lat,

          originLng:
            participantResponse.origin_lng,

          role:
            participantResponse.role,

          submitted: true,

          isHost: false,
        };

        /* ===============================================
           SESSION STORAGE

           기다리기/확정 화면에서
           현재 참가자 정보를 사용하기 위해 저장.
        =============================================== */

        sessionStorage.setItem(
          `bannana-participant-${roomId}`,
          JSON.stringify(
            participant
          )
        );

        /*
          현재 roomStatus에도
          방금 참여자를 즉시 추가한다.

          이 때문에 POST 성공 후
          다시 GET을 보내지 않아도
          완료 화면의 인원수가 바로 반영된다.
        */

        setRoomStatus(
          (prev) => {
            if (!prev) {
              return prev;
            }

            return {
              ...prev,

              participants: [
                ...(prev.participants ??
                  []),

                participantResponse,
              ],

              joinedCount:
                Number(
                  prev.joinedCount ??
                    existingParticipants.length
                ) + 1,
            };
          }
        );

        setStep(
          "complete"
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (error) {
        console.error(
          "참여자 등록 실패:",
          error
        );

        alert(
          error.message ||
            "참여자 등록에 실패했습니다."
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =====================================================
     WAIT RESULT
  ===================================================== */

  const handleWaitResult =
    () => {
      navigate(
        `/join/${roomId}/waiting`
      );
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading) {
    return (
      <main className="join-page join-page--invite app-container">
        <section className="join-invite-card">
          <h1>
            약속방을 불러오는 중이에요
          </h1>

          <p>
            잠시만 기다려주세요 🍌
          </p>
        </section>
      </main>
    );
  }

  /* =====================================================
     LOAD ERROR
  ===================================================== */

  if (
    loadError ||
    !roomStatus
  ) {
    return (
      <main className="join-page join-page--invite app-container">
        <section className="join-invite-card">
          <h1>
            약속방을 찾을 수 없어요
          </h1>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            className="join-primary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            다시 시도하기
          </button>
        </section>
      </main>
    );
  }

  /* =====================================================
     STEP 1
     INVITATION
  ===================================================== */

  if (step === "invite") {
    return (
      <main className="join-page join-page--invite app-container">
        {/* HEADER */}

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

        {/* INVITE CARD */}

        <section className="join-invite-card">
          <p className="join-invite-host">
            {
              roomStatus.host
                ?.nickname
            }
            님이 초대했어요
          </p>

          <h1>
            {roomStatus.title}
          </h1>

          <div className="join-invite-info">
            {/* DATE */}

            <div className="join-invite-info__row">
              <span>
                🗓️ 날짜
              </span>

              <strong>
                {meetingDateText}{" "}
                {meetingTimeText}
              </strong>
            </div>

            {/* TRANSPORT */}

            <div className="join-invite-info__row">
              <span>
                🚇 이동수단
              </span>

              <strong>
                대중교통
              </strong>
            </div>

            {/* PLACE TYPE */}

            <div className="join-invite-info__row">
              <span>
                📍 장소 유형
              </span>

              <strong>
                {categoryText}
              </strong>
            </div>
          </div>

          {/* EXISTING PARTICIPANTS */}

          <div className="join-existing">
            <div className="join-existing__avatars">
              {existingParticipants.map(
                (
                  participant,
                  index
                ) => (
                  <div
                    key={
                      participant.participant_id
                    }
                    className={`join-mini-avatar join-mini-avatar--${
                      (index %
                        4) +
                      1
                    }`}
                  >
                    {participant.nickname?.charAt(
                      0
                    ) ?? "?"}
                  </div>
                )
              )}
            </div>

            <strong>
              {
                roomStatus.joinedCount
              }
              명이 이미 참여했어요
            </strong>
          </div>
        </section>

        {/* NO LOGIN */}

        <div className="join-no-login">
          <span>
            ✅
          </span>

          <p>
            로그인·회원가입 없이
            바로 참여할 수 있어요
          </p>
        </div>

        {/* BOTTOM */}

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
     INPUT
  ===================================================== */

  if (step === "input") {
    return (
      <main className="join-page join-input-page app-container">
        {/* HEADER */}

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

        {/* ROOM SUMMARY */}

        <section className="join-room-summary">
          <div className="join-room-summary__icon">
            🍌
          </div>

          <div>
            <strong>
              {
                roomStatus.title
              }
            </strong>

            <p>
              {meetingDateText}{" "}
              {meetingTimeText}
            </p>
          </div>
        </section>

        {/* FORM */}

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
              placeholder="예: 이지은"
              value={
                formData.nickname
              }
              onChange={
                handleChange
              }
              disabled={
                isSubmitting
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

            {/* REAL MAP */}

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

        {/* SUBMIT */}

        <footer className="join-input-bottom">
          <button
            type="button"
            className="join-primary-button"
            onClick={
              handleSubmit
            }
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "출발지 등록 중..."
              : "출발지 제출하기 →"}
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
      {/* PROGRESS */}

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

      {/* COMPLETE HERO */}

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
            바로 확인할 수 있어요!
          </strong>
        </p>
      </section>

      {/* SUBMITTED DATA */}

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
            {roomStatus.title}
          </strong>
        </div>
      </section>

      {/* PARTICIPANT COUNT */}

      <section className="join-complete-count">
        <div className="join-complete-avatars">
          {existingParticipants.map(
            (
              participant,
              index
            ) => (
              <div
                key={
                  participant.participant_id
                }
                className={`join-complete-avatar join-complete-avatar--${
                  (index % 4) +
                  1
                }`}
              >
                {participant.nickname?.charAt(
                  0
                ) ?? "?"}
              </div>
            )
          )}
        </div>

        <div>
          <strong>
            {
              roomStatus.joinedCount
            }
            명 참여 완료
          </strong>

          <p>
            출발지 등록이
            완료됐어요
          </p>
        </div>
      </section>

      {/* WAIT */}

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