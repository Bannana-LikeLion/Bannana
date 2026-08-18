import {
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import {
    getMockRoom,
    getMockRoomStatus,
    getMockWaitingRoomStatus,
  } from "../data/mockData";
  
  import "./RoomStatusPage.css";
  
  function RoomStatusPage() {
    const navigate = useNavigate();
  
    const { roomId } = useParams();
  
    const [complete, setComplete] =
      useState(false);
  
    const [activeTab, setActiveTab] =
      useState("map");
  
    const room = useMemo(
      () => getMockRoom(),
      []
    );
  
    const waitingStatus = useMemo(
      () => getMockWaitingRoomStatus(),
      []
    );
  
    const completedStatus = useMemo(
      () => getMockRoomStatus(),
      []
    );
  
    const status = complete
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
  
    /* =========================================
       날짜 표시
    ========================================= */
  
    const meetingDate = new Date(
      room.meetingDateTime
    );
  
    const meetingDateText =
      new Intl.DateTimeFormat(
        "ko-KR",
        {
          month: "long",
          day: "numeric",
        }
      ).format(meetingDate);
  
    /* =========================================
       참여자별 색상 클래스
    ========================================= */
  
    const markerClasses = [
      "status-marker--one",
      "status-marker--two",
      "status-marker--three",
      "status-marker--four",
    ];
  
    const avatarClasses = [
      "status-avatar--one",
      "status-avatar--two",
      "status-avatar--three",
      "status-avatar--four",
    ];
  
    /* =========================================
       새로고침 Mock
    ========================================= */
  
    const handleRefresh = () => {
      /*
        현재 Mock 단계에서는
        새로고침 버튼을 누르면
        마지막 참여자까지 입력 완료된
        상태로 변경한다.
  
        실제 API 연결 후에는
        GET /rooms/:roomId/status
        재호출로 변경하면 된다.
      */
      setComplete(true);
    };
  
    /* =========================================
       중간 장소 계산
    ========================================= */
  
    const handleFind = () => {
      navigate(
        `/room/${roomId}/loading`
      );
    };
  
    return (
      <main className="status-page app-container">
        {/* =================================
            HEADER
        ================================= */}
  
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
  
        {/* =================================
            SUMMARY
        ================================= */}
  
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
  
        {/* =================================
            MAP / LIST TAB
        ================================= */}
  
        <div className="status-tab">
          <button
            type="button"
            className={`status-tab-button ${
              activeTab === "map"
                ? "status-tab-button--active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("map")
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
              setActiveTab("list")
            }
          >
            📋 목록
          </button>
        </div>
  
        {/* =================================
            MAP
        ================================= */}
  
        {activeTab === "map" && (
          <section className="status-map">
            <div className="status-map-road status-map-road--vertical" />
  
            <div className="status-map-road status-map-road--horizontal" />
  
            <div className="status-map-green" />
  
            <div className="status-map-water" />
  
            <div className="status-midpoint-preview">
              <strong>
                ?
              </strong>
  
              <span>
                중간 지점 예상
              </span>
            </div>
  
            {submittedParticipants.map(
              (participant) => {
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
                    className={`status-map-marker ${
                      markerClasses[
                        participantIndex
                      ] ?? ""
                    }`}
                    title={
                      participant.nickname
                    }
                  >
                    {participant.nickname.charAt(
                      0
                    )}
                  </div>
                );
              }
            )}
  
            <div className="status-map-legend">
              {submittedParticipants.map(
                (participant) => {
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
  
        {/* =================================
            PARTICIPANT LIST
        ================================= */}
  
        <section className="status-participant-section">
          <h2>
            참여자 현황
          </h2>
  
          <div className="status-participant-list">
            {status.participants.map(
              (
                participant,
                index
              ) => (
                <article
                  key={
                    participant.id
                  }
                  className={`status-participant-card ${
                    !participant.submitted
                      ? "status-participant-card--waiting"
                      : ""
                  }`}
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
              )
            )}
          </div>
        </section>
  
        {/* =================================
            BOTTOM
        ================================= */}
  
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