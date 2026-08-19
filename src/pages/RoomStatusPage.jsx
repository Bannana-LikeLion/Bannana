import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import {
  getMockParticipants,
  getMockRoom,
  getMockRoomStatus,
  getMockWaitingRoomStatus,
} from "../data/mockData";

import {
  getRoomDraft,
} from "../data/roomStorage";

import "./RoomStatusPage.css";

function RoomStatusPage() {
  const navigate =
    useNavigate();

  const { roomId } =
    useParams();

  const mapSectionRef =
    useRef(null);

  const [
    complete,
    setComplete,
  ] = useState(false);

  const [
    activeTab,
    setActiveTab,
  ] = useState("map");

  /*
    사용자가 참여자 목록을 눌렀을 때
    카카오 지도에 전달할 위치
  */
  const [
    focusLocation,
    setFocusLocation,
  ] = useState(null);

  /* =====================================================
     ROOM
  ===================================================== */

  const room = useMemo(
    () => getMockRoom(),
    []
  );

  const roomDraft =
    useMemo(
      () => getRoomDraft(),
      []
    );

  /* =====================================================
     STATUS
  ===================================================== */

  const waitingStatus =
    useMemo(
      () =>
        getMockWaitingRoomStatus(),
      []
    );

  const completedStatus =
    useMemo(
      () =>
        getMockRoomStatus(),
      []
    );

  const status =
    complete
      ? completedStatus
      : waitingStatus;

  const submittedParticipants =
    status.participants.filter(
      (participant) =>
        participant.submitted
    );

  const waitingParticipant =
    status.participants.find(
      (participant) =>
        !participant.submitted
    );

  const totalCount =
    status.totalParticipants ??
    status.participants.length;

  const submittedCount =
    status.submittedCount ??
    submittedParticipants.length;

  /* =====================================================
     PARTICIPANT DETAIL
  ===================================================== */

  const participantDetails =
    useMemo(() => {
      const participants =
        getMockParticipants();

      return participants.map(
        (participant) => {
          /*
            호스트는 CreateRoomPage에서
            카카오 검색으로 선택한
            실제 좌표를 우선 사용
          */
          if (
            !participant.isHost
          ) {
            return participant;
          }

          const hasSavedLat =
            Number.isFinite(
              roomDraft.hostOriginLat
            );

          const hasSavedLng =
            Number.isFinite(
              roomDraft.hostOriginLng
            );

          return {
            ...participant,

            origin: {
              ...participant.origin,

              text:
                roomDraft.hostOrigin ||
                participant.origin.text,

              lat:
                hasSavedLat
                  ? roomDraft.hostOriginLat
                  : participant.origin.lat,

              lng:
                hasSavedLng
                  ? roomDraft.hostOriginLng
                  : participant.origin.lng,
            },
          };
        }
      );
    }, [roomDraft]);

  /* =====================================================
     PARTICIPANT COLORS
  ===================================================== */

  const participantColors = [
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
  ];

  /* =====================================================
     MAP PARTICIPANTS
  ===================================================== */

  const mapParticipants =
    submittedParticipants
      .map(
        (participant) => {
          const detail =
            participantDetails.find(
              (item) =>
                item.id ===
                participant.id
            );

          if (
            !detail ||
            !Number.isFinite(
              detail.origin?.lat
            ) ||
            !Number.isFinite(
              detail.origin?.lng
            )
          ) {
            return null;
          }

          const participantIndex =
            status.participants.findIndex(
              (item) =>
                item.id ===
                participant.id
            );

          const color =
            participantColors[
              participantIndex
            ] ??
            participantColors[0];

          return {
            id:
              participant.id,

            nickname:
              participant.nickname,

            isHost:
              participant.isHost,

            originText:
              participant.originText,

            lat:
              detail.origin.lat,

            lng:
              detail.origin.lng,

            marker: {
              id:
                participant.id,

              lat:
                detail.origin.lat,

              lng:
                detail.origin.lng,

              label:
                participant.nickname,

              initial:
                participant.nickname.charAt(
                  0
                ),

              color:
                color.color,

              textColor:
                color.textColor,
            },
          };
        }
      )
      .filter(Boolean);

  const mapMarkers =
    mapParticipants.map(
      (participant) =>
        participant.marker
    );

  /* =====================================================
     DATE
  ===================================================== */

  const meetingDate =
    new Date(
      room.meetingDateTime
    );

  const meetingDateText =
    new Intl.DateTimeFormat(
      "ko-KR",
      {
        month: "long",
        day: "numeric",
      }
    ).format(
      meetingDate
    );

  /* =====================================================
     AVATAR CLASS
  ===================================================== */

  const avatarClasses = [
    "status-avatar--one",
    "status-avatar--two",
    "status-avatar--three",
    "status-avatar--four",
  ];

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = () => {
    /*
      현재는 Mock.

      실제 API 연동 후:
      GET /rooms/{roomId}/status
      재호출로 변경
    */

    setComplete(true);
  };

  /* =====================================================
     PARTICIPANT CLICK
     목록 클릭 → 해당 위치로 이동
  ===================================================== */

  const handleParticipantFocus = (
    participant
  ) => {
    /*
      해당 참여자의 실제 지도 좌표 검색
    */

    const mapParticipant =
      mapParticipants.find(
        (item) =>
          item.id ===
          participant.id
      );

    /*
      아직 출발지를 입력하지 않은 사람은
      지도 이동 불가
    */
    if (!mapParticipant) {
      return;
    }

    /*
      목록 탭을 보고 있었다면
      지도로 자동 전환
    */
    setActiveTab("map");

    /*
      같은 사람을 여러 번 눌러도
      다시 이동할 수 있도록
      매번 새로운 객체 생성
    */
    setFocusLocation({
      id:
        mapParticipant.id,

      lat:
        mapParticipant.lat,

      lng:
        mapParticipant.lng,

      requestId:
        Date.now(),
    });

    /*
      클릭 후 지도 영역도
      화면에 보이도록 부드럽게 이동
    */
    requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            mapSectionRef.current?.scrollIntoView(
              {
                behavior:
                  "smooth",

                block:
                  "center",
              }
            );
          }
        );
      }
    );
  };

  /* =====================================================
     KEYBOARD
  ===================================================== */

  const handleParticipantKeyDown = (
    event,
    participant
  ) => {
    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      handleParticipantFocus(
        participant
      );
    }
  };

  /* =====================================================
     FIND MIDPOINT
  ===================================================== */

  const handleFind = () => {
    navigate(
      `/room/${roomId}/loading`
    );
  };

  return (
    <main className="status-page app-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="status-header">
        <button
          type="button"
          className="status-back-button"
          onClick={() =>
            navigate(-1)
          }
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <div className="status-title-row">
          <div>
            <h1>
              참여 현황
            </h1>

            <p>
              {room.title} ·{" "}
              {meetingDateText}
            </p>
          </div>

          <button
            type="button"
            className="status-refresh-button"
            onClick={
              handleRefresh
            }
          >
            🔄 새로고침
          </button>
        </div>

        <div className="status-progress">
          <div className="status-progress-bars">
            <span />
            <span />
            <span />
            <span />
          </div>

          <p>
            4 / 4단계 · 참여 현황
          </p>
        </div>
      </header>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section
        className={`status-summary-card ${
          status.allSubmitted
            ? "status-summary-card--complete"
            : ""
        }`}
      >
        <div className="status-summary-top">
          <div className="status-summary-avatars">
            {status.participants.map(
              (
                participant,
                index
              ) => (
                <div
                  key={
                    participant.id
                  }
                  className={`status-summary-avatar ${
                    avatarClasses[
                      index
                    ] ?? ""
                  } ${
                    !participant.submitted
                      ? "status-summary-avatar--waiting"
                      : ""
                  }`}
                >
                  {participant.submitted
                    ? participant.nickname.charAt(
                        0
                      )
                    : "?"}
                </div>
              )
            )}
          </div>

          <div className="status-summary-text">
            <strong>
              {status.allSubmitted
                ? `${totalCount}명 모두 입력했어요 ✅`
                : `${totalCount}명 중 ${submittedCount}명이 입력했어요`}
            </strong>

            <p>
              {status.allSubmitted
                ? "지금 바로 중간 지점을 찾을 수 있어요!"
                : `${
                    waitingParticipant
                      ?.nickname ??
                    "참여자"
                  }님의 입력을 기다리는 중`}
            </p>
          </div>

          <span className="status-summary-badge">
            {status.allSubmitted
              ? "완료 ✓"
              : "대기중"}
          </span>
        </div>
      </section>

      {/* =================================================
          MAP / LIST TAB
      ================================================= */}

      <div className="status-tab">
        <button
          type="button"
          className={`status-tab-button ${
            activeTab === "map"
              ? "status-tab-button--active"
              : ""
          }`}
          onClick={() =>
            setActiveTab(
              "map"
            )
          }
        >
          🗺️ 지도
        </button>

        <button
          type="button"
          className={`status-tab-button ${
            activeTab === "list"
              ? "status-tab-button--active"
              : ""
          }`}
          onClick={() =>
            setActiveTab(
              "list"
            )
          }
        >
          📋 목록
        </button>
      </div>

      {/* =================================================
          REAL KAKAO MAP
      ================================================= */}

      {activeTab ===
        "map" && (
        <section
          ref={
            mapSectionRef
          }
          className="status-map"
        >
          <KakaoMap
            markers={
              mapMarkers
            }
            height="100%"
            level={5}
            focusLocation={
              focusLocation
            }
            focusLevel={3}
            emptyMessage="출발지를 입력한 참여자가 아직 없어요"
          />

          <div className="status-map-legend">
            {mapParticipants.map(
              (
                participant
              ) => {
                const participantIndex =
                  status.participants.findIndex(
                    (item) =>
                      item.id ===
                      participant.id
                  );

                return (
                  <div
                    key={
                      participant.id
                    }
                    className="status-map-legend-item"
                  >
                    <span
                      className={`status-legend-dot status-legend-dot--${
                        participantIndex +
                        1
                      }`}
                    />

                    <span>
                      {
                        participant.nickname
                      }

                      {participant.isHost &&
                        " (호스트)"}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* =================================================
          PARTICIPANT LIST
      ================================================= */}

      <section className="status-participant-section">
        <h2>
          참여자 현황
        </h2>

        <div className="status-participant-list">
          {status.participants.map(
            (
              participant,
              index
            ) => {
              const canFocus =
                mapParticipants.some(
                  (item) =>
                    item.id ===
                    participant.id
                );

              return (
                <article
                  key={
                    participant.id
                  }
                  className={`status-participant-card ${
                    !participant.submitted
                      ? "status-participant-card--waiting"
                      : ""
                  }`}
                  role={
                    canFocus
                      ? "button"
                      : undefined
                  }
                  tabIndex={
                    canFocus
                      ? 0
                      : undefined
                  }
                  aria-label={
                    canFocus
                      ? `${participant.nickname} 위치 지도에서 보기`
                      : undefined
                  }
                  onClick={() =>
                    handleParticipantFocus(
                      participant
                    )
                  }
                  onKeyDown={(
                    event
                  ) =>
                    handleParticipantKeyDown(
                      event,
                      participant
                    )
                  }
                  style={{
                    cursor:
                      canFocus
                        ? "pointer"
                        : "default",
                  }}
                >
                  <div
                    className={`status-list-avatar ${
                      avatarClasses[
                        index
                      ] ?? ""
                    } ${
                      !participant.submitted
                        ? "status-list-avatar--waiting"
                        : ""
                    }`}
                  >
                    {participant.submitted
                      ? participant.nickname.charAt(
                          0
                        )
                      : "?"}
                  </div>

                  <div className="status-list-info">
                    <div className="status-list-name">
                      <strong>
                        {
                          participant.nickname
                        }

                        {participant.isHost &&
                          " (나)"}
                      </strong>

                      {participant.isHost && (
                        <span className="status-host-tag">
                          호스트
                        </span>
                      )}

                      {!participant.isHost &&
                        participant.submitted && (
                          <span className="status-complete-tag">
                            입력 완료
                          </span>
                        )}

                      {!participant.submitted && (
                        <span className="status-waiting-tag">
                          대기 중
                        </span>
                      )}
                    </div>

                    <p>
                      {participant.submitted
                        ? participant.originText
                        : "출발지 미입력"}
                    </p>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          BOTTOM
      ================================================= */}

      <footer className="status-bottom">
        <button
          type="button"
          className="status-find-button"
          onClick={
            handleFind
          }
        >
          중간 장소 찾기 (
          {submittedCount}/
          {totalCount}명 입력)
        </button>
      </footer>
    </main>
  );
}

export default RoomStatusPage;