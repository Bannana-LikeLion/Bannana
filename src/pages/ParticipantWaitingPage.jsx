import { useMemo } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getMockParticipants,
  getMockResult,
  getMockRoom,
} from "../data/mockData";

import "./ParticipantWaitingPage.css";

/*
  현재 Participant Flow에서는
  Mock 데이터의 4번째 참여자를
  초대 링크로 들어온 사용자라고 가정한다.
*/
const CURRENT_PARTICIPANT_ID = 4;

/*
  JoinRoomPage에서 저장한 sessionStorage와
  반드시 같은 key 규칙을 사용해야 한다.

  이전 개발 버전의 key도 fallback으로 읽어서
  기존 테스트 데이터가 있으면 유지한다.
*/
function getCurrentParticipant(
  inviteCode
) {
  try {
    const currentKey =
      `bannana-participant-${inviteCode}`;

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
  const navigate = useNavigate();

  const { inviteCode } =
    useParams();

  const room = useMemo(
    () => getMockRoom(),
    []
  );

  const result = useMemo(
    () => getMockResult(),
    []
  );

  const participants =
    useMemo(
      () =>
        getMockParticipants(),
      []
    );

  /*
    JoinRoomPage에서 실제로 입력한
    참여자 이름/출발지 읽기
  */
  const storedParticipant =
    useMemo(
      () =>
        getCurrentParticipant(
          inviteCode
        ),
      [inviteCode]
    );

  /*
    Mock 데이터의 4번째 참여자를
    실제 Join 입력값으로 덮어쓴다.
  */
  const displayParticipants =
    useMemo(
      () =>
        participants.map(
          (participant) => {
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
                },
              };
            }

            return participant;
          }
        ),
      [
        participants,
        storedParticipant,
      ]
    );

  const handleShowResult =
    () => {
      navigate(
        `/join/${inviteCode}/confirmed`
      );
    };

  return (
    <main className="participant-waiting-page app-container">
      {/* =========================
          PROGRESS
      ========================= */}

      <div className="participant-waiting-progress">
        <div className="participant-progress-bar participant-progress-bar--active" />

        <div className="participant-progress-bar participant-progress-bar--active" />

        <div className="participant-progress-bar participant-progress-bar--active" />

        <span>3/3</span>
      </div>

      {/* =========================
          HEADER
      ========================= */}

      <header className="participant-waiting-header">
        <h1>
          결과 기다리는 중
        </h1>

        <p>
          중간 지점이 발견됐어요!
          🎉
        </p>
      </header>

      {/* =========================
          ROOM
      ========================= */}

      <section className="participant-waiting-room-card">
        <div>
          <h2>
            {room.title}
          </h2>

          <p>
            호스트{" "}
            {room.host.nickname}
          </p>
        </div>

        <span className="participant-search-complete">
          탐색 완료 ✓
        </span>
      </section>

      {/* =========================
          PROCESS
      ========================= */}

      <section className="participant-process-card">
        <h2>
          진행 현황
        </h2>

        <div className="participant-process-list">
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

      {/* =========================
          MAP
      ========================= */}

      <section className="participant-waiting-map">
        <div className="participant-map-road participant-map-road--vertical" />

        <div className="participant-map-road participant-map-road--horizontal" />

        <div className="participant-map-green" />

        <div className="participant-map-water" />

        {displayParticipants.map(
          (
            participant,
            index
          ) => (
            <div
              key={participant.id}
              className={`participant-map-person participant-map-person--${
                index + 1
              }`}
              title={
                participant.nickname
              }
            >
              {participant.nickname.charAt(
                0
              )}
            </div>
          )
        )}

        <div className="participant-map-midpoint">
          🍌
        </div>

        <div className="participant-map-result-label">
          🍌{" "}
          {result.midpoint?.name ??
            "중간 지점"}{" "}
          발견
        </div>
      </section>

      {/* =========================
          BOTTOM
      ========================= */}

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