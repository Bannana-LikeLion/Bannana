import {
  useCallback,
  useEffect,
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
  getRoomStatus,
} from "../api/bannanaApi";

import "./RoomStatusPage.css";

function RoomStatusPage() {
  const navigate =
    useNavigate();

  const { roomId } =
    useParams();

  const mapSectionRef =
    useRef(null);

  /* =====================================================
     STATE
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
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState("map");

  const [
    focusLocation,
    setFocusLocation,
  ] = useState(null);

  /* =====================================================
     GET ROOM STATUS

     GET /rooms/{roomId}/status
  ===================================================== */

  const fetchRoomStatus =
    useCallback(
      async ({
        showLoading = false,
      } = {}) => {
        if (!roomId) {
          return;
        }

        try {
          if (showLoading) {
            setIsLoading(true);
          } else {
            setIsRefreshing(true);
          }

          setError("");

          const data =
            await getRoomStatus(
              roomId
            );

          setRoomStatus(data);
        } catch (fetchError) {
          console.error(
            "참여 현황 조회 실패:",
            fetchError
          );

          setError(
            fetchError.message ||
              "참여 현황을 불러오지 못했습니다."
          );
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      [roomId]
    );

  /* =====================================================
     FIRST LOAD
  ===================================================== */

  useEffect(() => {
    fetchRoomStatus({
      showLoading: true,
    });
  }, [fetchRoomStatus]);

  /* =====================================================
     POLLING

     참여자가 초대 링크를 통해 들어오면
     화면에 자동 반영되도록 주기적으로 조회.
  ===================================================== */

  useEffect(() => {
    const intervalId =
      window.setInterval(
        () => {
          fetchRoomStatus();
        },
        3000
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [fetchRoomStatus]);

  /* =====================================================
     PARTICIPANT NORMALIZE

     Backend:
     participant_id
     nickname
     origin_text
     origin_lat
     origin_lng
     role

     ↓

     Frontend에서 쓰기 편한 형태로 변환
  ===================================================== */

  const participants =
    useMemo(() => {
      if (!roomStatus) {
        return [];
      }

      const rawParticipants = [
        roomStatus.host,
        ...(roomStatus.participants ??
          []),
      ].filter(Boolean);

      return rawParticipants.map(
        (participant) => {
          const lat =
            Number(
              participant.origin_lat
            );

          const lng =
            Number(
              participant.origin_lng
            );

          return {
            id:
              participant.participant_id,

            nickname:
              participant.nickname,

            originText:
              participant.origin_text,

            lat:
              Number.isFinite(lat)
                ? lat
                : null,

            lng:
              Number.isFinite(lng)
                ? lng
                : null,

            role:
              participant.role,

            isHost:
              participant.role ===
              "HOST",

            hasLocation:
              Number.isFinite(lat) &&
              Number.isFinite(lng),
          };
        }
      );
    }, [roomStatus]);

  /* =====================================================
     DATE
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
        }
      ).format(date);
    }, [
      roomStatus?.meetingDate,
    ]);

  /* =====================================================
     COLORS
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

    {
      color: "#84a9d8",
      textColor: "#21190f",
    },

    {
      color: "#d99ac5",
      textColor: "#21190f",
    },
  ];

  const avatarClasses = [
    "status-avatar--one",
    "status-avatar--two",
    "status-avatar--three",
    "status-avatar--four",
  ];

  /* =====================================================
     MAP MARKERS
  ===================================================== */

  const mapMarkers =
    useMemo(() => {
      return participants
        .filter(
          (participant) =>
            participant.hasLocation
        )
        .map(
          (
            participant,
            index
          ) => {
            const color =
              participantColors[
                index
              ] ??
              participantColors[0];

            return {
              id:
                participant.id,

              lat:
                participant.lat,

              lng:
                participant.lng,

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
            };
          }
        );
    }, [participants]);

  /* =====================================================
     MANUAL REFRESH
  ===================================================== */

  const handleRefresh =
    async () => {
      await fetchRoomStatus();
    };

  /* =====================================================
     PARTICIPANT CLICK
     → 지도 이동 + 확대
  ===================================================== */

  const handleParticipantFocus = (
    participant
  ) => {
    if (
      !participant.hasLocation
    ) {
      return;
    }

    setActiveTab("map");

    setFocusLocation({
      id:
        participant.id,

      lat:
        participant.lat,

      lng:
        participant.lng,

      requestId:
        Date.now(),
    });

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

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading) {
    return (
      <main className="status-page app-container">
        <header className="status-header">
          <h1>
            참여 현황
          </h1>

          <p>
            방 정보를 불러오는
            중이에요...
          </p>
        </header>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error &&
    !roomStatus
  ) {
    return (
      <main className="status-page app-container">
        <header className="status-header">
          <button
            type="button"
            className="status-back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            ←
          </button>

          <h1>
            참여 현황
          </h1>
        </header>

        <section className="status-participant-card">
          <div className="status-list-info">
            <strong>
              참여 현황을 불러오지
              못했어요.
            </strong>

            <p>
              {error}
            </p>
          </div>
        </section>

        <footer className="status-bottom">
          <button
            type="button"
            className="status-find-button"
            onClick={() =>
              fetchRoomStatus({
                showLoading: true,
              })
            }
          >
            다시 시도하기
          </button>
        </footer>
      </main>
    );
  }

  /* =====================================================
     VALUES
  ===================================================== */

  const joinedCount =
    roomStatus?.joinedCount ??
    participants.length;

  const locationCount =
    participants.filter(
      (participant) =>
        participant.hasLocation
    ).length;

  const everyParticipantHasLocation =
    participants.length > 0 &&
    locationCount ===
      participants.length;

  /* =====================================================
     RENDER
  ===================================================== */

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
              {
                roomStatus.title
              }
              {" · "}
              {meetingDateText}
            </p>
          </div>

          <button
            type="button"
            className="status-refresh-button"
            onClick={
              handleRefresh
            }
            disabled={
              isRefreshing
            }
          >
            {isRefreshing
              ? "🔄 확인 중"
              : "🔄 새로고침"}
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
          everyParticipantHasLocation
            ? "status-summary-card--complete"
            : ""
        }`}
      >
        <div className="status-summary-top">
          <div className="status-summary-avatars">
            {participants.map(
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
                    !participant.hasLocation
                      ? "status-summary-avatar--waiting"
                      : ""
                  }`}
                  style={
                    index >=
                    avatarClasses.length
                      ? {
                          background:
                            participantColors[
                              index
                            ]?.color ??
                            "#cccccc",
                        }
                      : undefined
                  }
                >
                  {participant.nickname?.charAt(
                    0
                  ) ?? "?"}
                </div>
              )
            )}
          </div>

          <div className="status-summary-text">
            <strong>
              현재 {joinedCount}명이
              참여했어요
            </strong>

            <p>
              {everyParticipantHasLocation
                ? "현재 참여자들의 출발지 입력이 완료됐어요!"
                : `${locationCount}/${joinedCount}명이 출발지를 입력했어요`}
            </p>
          </div>

          <span className="status-summary-badge">
            {everyParticipantHasLocation
              ? "입력 완료 ✓"
              : "참여 중"}
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
          MAP
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
            emptyMessage="아직 지도에 표시할 출발지가 없어요"
          />

          <div className="status-map-legend">
            {participants
              .filter(
                (
                  participant
                ) =>
                  participant.hasLocation
              )
              .map(
                (
                  participant,
                  index
                ) => (
                  <div
                    key={
                      participant.id
                    }
                    className="status-map-legend-item"
                  >
                    <span
                      className={`status-legend-dot status-legend-dot--${
                        index + 1
                      }`}
                      style={{
                        background:
                          participantColors[
                            index
                          ]?.color ??
                          "#cccccc",
                      }}
                    />

                    <span>
                      {
                        participant.nickname
                      }

                      {participant.isHost &&
                        " (호스트)"}
                    </span>
                  </div>
                )
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
          {participants.map(
            (
              participant,
              index
            ) => {
              const canFocus =
                participant.hasLocation;

              return (
                <article
                  key={
                    participant.id
                  }
                  className={`status-participant-card ${
                    !participant.hasLocation
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
                      !participant.hasLocation
                        ? "status-list-avatar--waiting"
                        : ""
                    }`}
                    style={
                      index >=
                      avatarClasses.length
                        ? {
                            background:
                              participantColors[
                                index
                              ]?.color ??
                              "#cccccc",
                          }
                        : undefined
                    }
                  >
                    {participant.nickname?.charAt(
                      0
                    ) ?? "?"}
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
                        participant.hasLocation && (
                          <span className="status-complete-tag">
                            입력 완료
                          </span>
                        )}

                      {!participant.hasLocation && (
                        <span className="status-waiting-tag">
                          위치 미입력
                        </span>
                      )}
                    </div>

                    <p>
                      {participant.originText ||
                        "출발지 미입력"}
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
          disabled={
            participants.length ===
            0
          }
        >
          중간 장소 찾기 (
          {joinedCount}명 참여)
        </button>
      </footer>
    </main>
  );
}

export default RoomStatusPage;