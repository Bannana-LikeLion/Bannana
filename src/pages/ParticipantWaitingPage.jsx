import {
  useMemo,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import {
  getMockParticipants,
  getMockResult,
  getMockRoom,
} from "../data/mockData";

import {
  getRoomDraft,
} from "../data/roomStorage";

import "./ParticipantWaitingPage.css";

/*
  현재 Mock Flow에서는
  네 번째 참여자를 초대 링크로 들어온
  현재 사용자라고 가정한다.
*/
const CURRENT_PARTICIPANT_ID = 4;

/* =====================================================
   SESSION STORAGE
===================================================== */

function getCurrentParticipant(
  roomId
) {
  try {
    const currentKey =
      `bannana-participant-${roomId}`;

    const saved =
      sessionStorage.getItem(
        currentKey
      );

    if (saved) {
      return JSON.parse(saved);
    }

    /*
      이전 버전 호환
    */
    const legacySaved =
      sessionStorage.getItem(
        "bannana-current-participant"
      );

    if (legacySaved) {
      return JSON.parse(
        legacySaved
      );
    }
  } catch (error) {
    console.error(
      "참여자 정보 읽기 실패:",
      error
    );
  }

  return null;
}

function ParticipantWaitingPage() {
  const navigate =
    useNavigate();

  /*
    App.jsx Route는 아직 inviteCode라는
    이름을 사용하고 있지만 실제 값은
    이후 roomId로 사용한다.
  */
  const { inviteCode } =
    useParams();

  const roomId =
    inviteCode;

  /* =====================================================
     MOCK ROOM / RESULT
  ===================================================== */

  const room = useMemo(
    () => getMockRoom(),
    []
  );

  const result = useMemo(
    () => getMockResult(),
    []
  );

  const roomDraft =
    useMemo(
      () => getRoomDraft(),
      []
    );

  const participants =
    useMemo(
      () =>
        getMockParticipants(),
      []
    );

  /* =====================================================
     CURRENT PARTICIPANT
  ===================================================== */

  const storedParticipant =
    useMemo(
      () =>
        getCurrentParticipant(
          roomId
        ),
      [roomId]
    );

  /* =====================================================
     PARTICIPANT DATA

     1. 호스트
        CreateRoomPage에서 선택한 실제 좌표 사용

     2. 현재 참여자
        JoinRoomPage에서 선택한 실제 좌표 사용

     3. 나머지 참여자
        아직 Mock 좌표 사용
  ===================================================== */

  const displayParticipants =
    useMemo(() => {
      return participants.map(
        (participant) => {
          /* ==========================================
             HOST
          ========================================== */

          if (
            participant.isHost
          ) {
            const hasHostLat =
              Number.isFinite(
                roomDraft.hostOriginLat
              );

            const hasHostLng =
              Number.isFinite(
                roomDraft.hostOriginLng
              );

            return {
              ...participant,

              nickname:
                roomDraft.hostName ||
                participant.nickname,

              origin: {
                ...participant.origin,

                text:
                  roomDraft.hostOrigin ||
                  participant.origin.text,

                lat:
                  hasHostLat
                    ? roomDraft.hostOriginLat
                    : participant.origin.lat,

                lng:
                  hasHostLng
                    ? roomDraft.hostOriginLng
                    : participant.origin.lng,
              },
            };
          }

          /* ==========================================
             CURRENT PARTICIPANT
          ========================================== */

          if (
            participant.id ===
              CURRENT_PARTICIPANT_ID &&
            storedParticipant
          ) {
            return {
              ...participant,

              nickname:
                storedParticipant.nickname,

              origin: {
                ...participant.origin,

                text:
                  storedParticipant.originText,

                lat:
                  Number.isFinite(
                    storedParticipant.originLat
                  )
                    ? storedParticipant.originLat
                    : participant.origin.lat,

                lng:
                  Number.isFinite(
                    storedParticipant.originLng
                  )
                    ? storedParticipant.originLng
                    : participant.origin.lng,
              },
            };
          }

          return participant;
        }
      );
    }, [
      participants,
      roomDraft,
      storedParticipant,
    ]);

  /* =====================================================
     MAP MARKERS
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

  const participantMarkers =
    displayParticipants
      .map(
        (
          participant,
          index
        ) => {
          const lat =
            Number(
              participant.origin?.lat
            );

          const lng =
            Number(
              participant.origin?.lng
            );

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            return null;
          }

          const color =
            participantColors[
              index
            ] ??
            participantColors[0];

          return {
            id:
              `participant-${participant.id}`,

            lat,
            lng,

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
          };
        }
      )
      .filter(Boolean);

  /* =====================================================
     MIDPOINT MARKER
  ===================================================== */

  const midpointMarker =
    useMemo(() => {
      const midpoint =
        result.midpoint;

      if (
        !midpoint ||
        !Number.isFinite(
          Number(midpoint.lat)
        ) ||
        !Number.isFinite(
          Number(midpoint.lng)
        )
      ) {
        return null;
      }

      return {
        id:
          "midpoint",

        lat:
          Number(
            midpoint.lat
          ),

        lng:
          Number(
            midpoint.lng
          ),

        label:
          midpoint.name,

        initial:
          "🍌",

        color:
          "#f4cf45",

        textColor:
          "#21190f",
      };
    }, [result]);

  const mapMarkers =
    midpointMarker
      ? [
          ...participantMarkers,
          midpointMarker,
        ]
      : participantMarkers;

  /* =====================================================
     RESULT BUTTON
  ===================================================== */

  const handleShowResult =
    () => {
      navigate(
        `/join/${roomId}/confirmed`
      );
    };

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
          결과 기다리는 중
        </h1>

        <p>
          중간 지점이 발견됐어요!
          🎉
        </p>
      </header>

      {/* =================================================
          ROOM
      ================================================= */}

      <section className="participant-waiting-room-card">
        <div>
          <h2>
            {room.title}
          </h2>

          <p>
            호스트{" "}
            {
              roomDraft.hostName ||
              room.host.nickname
            }
          </p>
        </div>

        <span className="participant-search-complete">
          탐색 완료 ✓
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
          {/* 1 */}

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
                등록됐어요
              </p>
            </div>
          </div>

          <div className="participant-process-line participant-process-line--done" />

          {/* 2 */}

          <div className="participant-process-item">
            <div className="participant-process-icon participant-process-icon--done">
              ✓
            </div>

            <div>
              <strong>
                참여자{" "}
                {
                  displayParticipants.length
                }
                명 모임
              </strong>

              <p>
                {displayParticipants
                  .map(
                    (participant) =>
                      participant.nickname
                  )
                  .join(", ")}
              </p>
            </div>
          </div>

          <div className="participant-process-line participant-process-line--done" />

          {/* 3 */}

          <div className="participant-process-item">
            <div className="participant-process-icon participant-process-icon--done">
              ✓
            </div>

            <div>
              <strong>
                호스트가 중간 지점
                탐색 완료
              </strong>

              <p>
                {result.midpoint?.name ??
                  "중간 지점"}{" "}
                발견
              </p>
            </div>
          </div>

          <div className="participant-process-line" />

          {/* 4 */}

          <div className="participant-process-item participant-process-item--waiting">
            <div className="participant-process-icon" />

            <div>
              <strong>
                최종 장소 확정 대기
              </strong>

              <p>
                호스트가 장소를
                선택하고 있어요
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
          emptyMessage="위치 정보를 불러올 수 없어요"
        />

        {result.midpoint && (
          <div className="participant-map-result-label">
            🍌{" "}
            {
              result.midpoint.name
            }{" "}
            발견
          </div>
        )}

        {/* =============================================
            MAP LEGEND
        ============================================= */}

        <div className="participant-waiting-map-legend">
          {displayParticipants.map(
            (
              participant,
              index
            ) => (
              <div
                key={
                  participant.id
                }
                className="participant-waiting-map-legend-item"
              >
                <span
                  className={`participant-waiting-legend-dot participant-waiting-legend-dot--${
                    index + 1
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
            )
          )}
        </div>
      </section>

      {/* =================================================
          BOTTOM
      ================================================= */}

      <footer className="participant-waiting-bottom">
        <button
          type="button"
          className="participant-waiting-primary"
          onClick={
            handleShowResult
          }
        >
          🍌 결과 확인하기
        </button>
      </footer>
    </main>
  );
}

export default ParticipantWaitingPage;