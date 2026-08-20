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

import "./ParticipantWaitingPage.css";

/* =====================================================
   POLLING

   참여자는 호스트와 다른 브라우저를 사용하므로
   호스트가 장소를 확정했는지 주기적으로
   Backend에 다시 물어본다.
===================================================== */

const POLLING_INTERVAL = 2500;

/* =====================================================
   PARTICIPANT COLORS

   최대 6명
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
   PARTICIPANT WAITING PAGE
===================================================== */

function ParticipantWaitingPage() {
  const navigate =
    useNavigate();

  /*
    App.jsx에서 parameter 이름은
    inviteCode이지만 현재 실제 값은 roomId.
  */
  const { inviteCode } =
    useParams();

  const roomId =
    inviteCode;

  /* =====================================================
     STATE
  ===================================================== */

  const [
    roomStatus,
    setRoomStatus,
  ] = useState(null);

  const [
    isInitialLoading,
    setIsInitialLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =====================================================
     REAL ROOM STATUS

     GET /rooms/{roomId}/status

     처음 화면에 들어왔을 때 한 번 실행하고,
     이후 2.5초마다 다시 조회한다.
  ===================================================== */

  useEffect(() => {
    let cancelled =
      false;

    let intervalId =
      null;

    const loadRoomStatus =
      async ({
        initial = false,
      } = {}) => {
        try {
          if (initial) {
            setIsInitialLoading(
              true
            );
          }

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

          setError("");
        } catch (
          roomStatusError
        ) {
          console.error(
            "약속방 상태 조회 실패:",
            roomStatusError
          );

          if (cancelled) {
            return;
          }

          /*
            이미 정상 데이터를 한 번
            받은 뒤 polling 한 번 실패한 경우에는
            기존 화면은 유지한다.
          */

          setError(
            roomStatusError.message ||
              "약속방 정보를 불러오지 못했습니다."
          );
        } finally {
          if (
            !cancelled &&
            initial
          ) {
            setIsInitialLoading(
              false
            );
          }
        }
      };

    /*
      첫 조회
    */

    loadRoomStatus({
      initial: true,
    });

    /*
      이후 자동 Polling
    */

    intervalId =
      window.setInterval(
        () => {
          loadRoomStatus();
        },
        POLLING_INTERVAL
      );

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(
          intervalId
        );
      }
    };
  }, [roomId]);

  /* =====================================================
     PARTICIPANTS

     Backend 응답:

     host
     +
     participants[]
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
      ].filter(Boolean);
    }, [roomStatus]);

  /* =====================================================
     FINAL PLACE

     호스트가 ResultPage에서
     "이 장소 선택하기"를 누르면

     POST /rooms/{roomId}/final-place

     이후 GET /status의 finalPlace가
     null이 아니게 된다.
  ===================================================== */

  const finalPlace =
    roomStatus?.finalPlace ??
    null;

  const hasFinalPlace =
    Boolean(
      finalPlace?.placeName
    );

  /* =====================================================
     MAP MARKERS
  ===================================================== */

  const mapMarkers =
    useMemo(() => {
      const markers = [];

      /* ===============================================
         PARTICIPANTS
      =============================================== */

      participants.forEach(
        (
          participant,
          index
        ) => {
          const lat =
            Number(
              participant.origin_lat
            );

          const lng =
            Number(
              participant.origin_lng
            );

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
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
              `participant-${participant.participant_id ?? index}`,

            type:
              "participant",

            lat,
            lng,

            label:
              participant.nickname,

            initial:
              participant.nickname?.charAt(
                0
              ) ?? "?",

            color:
              color.color,

            textColor:
              color.textColor,

            zIndex:
              100 + index,
          });
        }
      );

      /* ===============================================
         FINAL PLACE

         호스트가 장소를 확정한 뒤에만 표시
      =============================================== */

      if (finalPlace) {
        const lat =
          Number(
            finalPlace.lat
          );

        const lng =
          Number(
            finalPlace.lng
          );

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {
          markers.push({
            id:
              "final-place",

            type:
              "midpoint",

            lat,
            lng,

            label:
              finalPlace.placeName,

            initial:
              "🍌",

            color:
              "#f4cf45",

            textColor:
              "#21190f",

            zIndex:
              200,
          });
        }
      }

      return markers;
    }, [
      participants,
      finalPlace,
    ]);

  /* =====================================================
     RESULT
  ===================================================== */

  const handleShowResult =
    () => {
      /*
        아직 확정되지 않았다면
        이동시키지 않는다.
      */

      if (!hasFinalPlace) {
        return;
      }

      navigate(
        `/join/${roomId}/confirmed`
      );
    };

  /* =====================================================
     RETRY
  ===================================================== */

  const handleRetry =
    async () => {
      try {
        setError("");

        setIsInitialLoading(
          true
        );

        const response =
          await getRoomStatus(
            roomId
          );

        setRoomStatus(
          response
        );
      } catch (
        retryError
      ) {
        console.error(
          "약속방 상태 재조회 실패:",
          retryError
        );

        setError(
          retryError.message ||
            "약속방 정보를 불러오지 못했습니다."
        );
      } finally {
        setIsInitialLoading(
          false
        );
      }
    };

  /* =====================================================
     INITIAL LOADING
  ===================================================== */

  if (
    isInitialLoading &&
    !roomStatus
  ) {
    return (
      <main className="participant-waiting-page app-container">
        <section className="participant-waiting-loading">
          <div className="participant-waiting-spinner" />

          <h1>
            약속방 정보를
            불러오고 있어요
          </h1>

          <p>
            잠시만 기다려주세요.
          </p>
        </section>
      </main>
    );
  }

  /* =====================================================
     INITIAL ERROR
  ===================================================== */

  if (
    !roomStatus &&
    error
  ) {
    return (
      <main className="participant-waiting-page app-container">
        <section className="participant-waiting-error-card">
          <div className="participant-waiting-error-icon">
            !
          </div>

          <h1>
            약속방 정보를
            불러오지 못했어요
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={
              handleRetry
            }
          >
            다시 불러오기
          </button>
        </section>
      </main>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="participant-waiting-page app-container">
      {/* =================================================
          PROGRESS
      ================================================= */}

      <div className="participant-waiting-progress">
        <div className="participant-progress-bar participant-progress-bar--active" />

        <div className="participant-progress-bar participant-progress-bar--active" />

        <div className="participant-progress-bar participant-progress-bar--active" />

        <span>
          3/3
        </span>
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="participant-waiting-header">
        <h1>
          {hasFinalPlace
            ? "장소가 확정됐어요!"
            : "결과 기다리는 중"}
        </h1>

        <p>
          {hasFinalPlace
            ? `${finalPlace.placeName}으로 결정됐어요 🎉`
            : "호스트가 모두에게 공평한 장소를 고르고 있어요 🍌"}
        </p>
      </header>

      {/* =================================================
          ROOM
      ================================================= */}

      <section className="participant-waiting-room-card">
        <div>
          <h2>
            {roomStatus?.title ??
              "약속방"}
          </h2>

          <p>
            호스트{" "}
            {roomStatus?.host
              ?.nickname ??
              "-"}
          </p>
        </div>

        <span
          className={`participant-room-status ${
            hasFinalPlace
              ? "participant-room-status--complete"
              : "participant-room-status--waiting"
          }`}
        >
          {hasFinalPlace
            ? "장소 확정 ✓"
            : "선택 중"}
        </span>
      </section>

      {/* =================================================
          PROCESS
      ================================================= */}

      <section className="participant-process-card">
        <h2>
          진행 현황
        </h2>

        <div className="participant-process-list">
          {/* ==========================================
              1
          ========================================== */}

          <div className="participant-process-item">
            <div className="participant-process-icon participant-process-icon--done">
              ✓
            </div>

            <div>
              <strong>
                출발지 제출 완료
              </strong>

              <p>
                내 출발지가
                정상적으로 등록됐어요
              </p>
            </div>
          </div>

          <div className="participant-process-line participant-process-line--done" />

          {/* ==========================================
              2
          ========================================== */}

          <div className="participant-process-item">
            <div className="participant-process-icon participant-process-icon--done">
              ✓
            </div>

            <div>
              <strong>
                참여자{" "}
                {
                  participants.length
                }
                명 참여
              </strong>

              <p>
                {participants.length >
                0
                  ? participants
                      .map(
                        (
                          participant
                        ) =>
                          participant.nickname
                      )
                      .join(", ")
                  : "참여자 정보를 확인하고 있어요"}
              </p>
            </div>
          </div>

          <div className="participant-process-line participant-process-line--done" />

          {/* ==========================================
              3
          ========================================== */}

          <div className="participant-process-item">
            <div
              className={`participant-process-icon ${
                hasFinalPlace
                  ? "participant-process-icon--done"
                  : "participant-process-icon--current"
              }`}
            >
              {hasFinalPlace
                ? "✓"
                : (
                  <span className="participant-process-spinner" />
                )}
            </div>

            <div>
              <strong>
                {hasFinalPlace
                  ? "호스트의 장소 선택 완료"
                  : "호스트가 추천 장소 확인 중"}
              </strong>

              <p>
                {hasFinalPlace
                  ? `${finalPlace.placeName}을 선택했어요`
                  : "이동시간을 비교해 가장 적합한 장소를 고르고 있어요"}
              </p>
            </div>
          </div>

          <div
            className={`participant-process-line ${
              hasFinalPlace
                ? "participant-process-line--done"
                : ""
            }`}
          />

          {/* ==========================================
              4
          ========================================== */}

          <div
            className={`participant-process-item ${
              !hasFinalPlace
                ? "participant-process-item--waiting"
                : ""
            }`}
          >
            <div
              className={`participant-process-icon ${
                hasFinalPlace
                  ? "participant-process-icon--done"
                  : ""
              }`}
            >
              {hasFinalPlace
                ? "✓"
                : null}
            </div>

            <div>
              <strong>
                {hasFinalPlace
                  ? "최종 장소 확정"
                  : "최종 장소 확정 대기"}
              </strong>

              <p>
                {hasFinalPlace
                  ? "이제 확정된 약속 장소를 확인해보세요"
                  : "호스트의 선택을 기다리고 있어요"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          REAL KAKAO MAP
      ================================================= */}

      <section className="participant-waiting-map">
        <KakaoMap
          markers={
            mapMarkers
          }
          height="100%"
          level={5}
          emptyMessage="참여자 위치 정보를 불러올 수 없어요"
        />

        {/* =============================================
            FINAL PLACE LABEL
        ============================================= */}

        {hasFinalPlace && (
          <div className="participant-map-result-label">
            🍌{" "}
            {
              finalPlace.placeName
            }{" "}
            확정
          </div>
        )}

        {/* =============================================
            MAP LEGEND
        ============================================= */}

        <div className="participant-waiting-map-legend">
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
                <div
                  key={
                    participant.participant_id ??
                    index
                  }
                  className="participant-waiting-map-legend-item"
                >
                  <span
                    className="participant-waiting-legend-dot"
                    style={{
                      backgroundColor:
                        color.color,
                    }}
                  />

                  <span>
                    {
                      participant.nickname
                    }

                    {participant.role ===
                      "HOST" &&
                      " (호스트)"}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          POLLING ERROR

          이전 데이터가 이미 있는 상태에서
          새로고침만 한 번 실패한 경우.
      ================================================= */}

      {error && (
        <div className="participant-waiting-poll-error">
          <span>
            ⚠️
          </span>

          <p>
            최신 상태를 잠시
            불러오지 못했어요.
            자동으로 다시 시도합니다.
          </p>
        </div>
      )}

      {/* =================================================
          BOTTOM
      ================================================= */}

      <footer className="participant-waiting-bottom">
        <button
          type="button"
          className={`participant-waiting-primary ${
            !hasFinalPlace
              ? "participant-waiting-primary--disabled"
              : ""
          }`}
          disabled={
            !hasFinalPlace
          }
          onClick={
            handleShowResult
          }
        >
          {hasFinalPlace
            ? "🍌 확정된 장소 확인하기"
            : "호스트가 장소를 선택하고 있어요"}
        </button>
      </footer>
    </main>
  );
}

export default ParticipantWaitingPage;