import {
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import "./QuickOriginsPage.css";
  
  const QUICK_SETTINGS_STORAGE_KEY =
    "bannana-quick-settings";
  
  const QUICK_PARTICIPANTS_STORAGE_KEY =
    "bannana-quick-participants";
  
  const MIN_PARTICIPANTS = 2;
  const MAX_PARTICIPANTS = 6;
  
  const PARTICIPANT_COLORS = [
    "#F0C936",
    "#E87570",
    "#79CEC5",
    "#7144DF",
    "#E7A3C2",
    "#F0A65A",
  ];
  
  function readQuickSettings() {
    try {
      const saved =
        sessionStorage.getItem(
          QUICK_SETTINGS_STORAGE_KEY
        );
  
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(
        "Quick 설정 읽기 실패:",
        error
      );
    }
  
    return null;
  }
  
  function readSavedParticipants() {
    try {
      const saved =
        sessionStorage.getItem(
          QUICK_PARTICIPANTS_STORAGE_KEY
        );
  
      if (saved) {
        const parsed =
          JSON.parse(saved);
  
        if (Array.isArray(parsed)) {
          return parsed.slice(
            0,
            MAX_PARTICIPANTS
          );
        }
      }
    } catch (error) {
      console.error(
        "Quick 참여자 정보 읽기 실패:",
        error
      );
    }
  
    return null;
  }
  
  function createParticipant(id) {
    return {
      id,
      nickname: "",
      originText: "",
    };
  }
  
  function QuickOriginsPage() {
    const navigate =
      useNavigate();
  
    const settings =
      useMemo(
        () =>
          readQuickSettings(),
        []
      );
  
    const savedParticipants =
      useMemo(
        () =>
          readSavedParticipants(),
        []
      );
  
    const [
      participants,
      setParticipants,
    ] = useState(() => {
      if (
        savedParticipants &&
        savedParticipants.length >=
          MIN_PARTICIPANTS
      ) {
        return savedParticipants;
      }
  
      return [
        createParticipant(1),
        createParticipant(2),
      ];
    });
  
    const [
      errors,
      setErrors,
    ] = useState({});
  
    const handleParticipantChange = (
      id,
      field,
      value
    ) => {
      setParticipants(
        (prev) =>
          prev.map(
            (participant) =>
              participant.id === id
                ? {
                    ...participant,
                    [field]: value,
                  }
                : participant
          )
      );
  
      setErrors(
        (prev) => ({
          ...prev,
          [`${id}-${field}`]: "",
        })
      );
    };
  
    const handleAddParticipant =
      () => {
        if (
          participants.length >=
          MAX_PARTICIPANTS
        ) {
          return;
        }
  
        const maxId =
          Math.max(
            ...participants.map(
              (participant) =>
                participant.id
            )
          );
  
        setParticipants(
          (prev) => [
            ...prev,
            createParticipant(
              maxId + 1
            ),
          ]
        );
      };
  
    const handleRemoveParticipant = (
      id
    ) => {
      if (
        participants.length <=
        MIN_PARTICIPANTS
      ) {
        return;
      }
  
      setParticipants(
        (prev) =>
          prev.filter(
            (participant) =>
              participant.id !== id
          )
      );
    };
  
    const validateParticipants =
      () => {
        const nextErrors = {};
  
        participants.forEach(
          (participant) => {
            if (
              !participant.nickname.trim()
            ) {
              nextErrors[
                `${participant.id}-nickname`
              ] =
                "이름을 입력해주세요.";
            }
  
            if (
              !participant.originText.trim()
            ) {
              nextErrors[
                `${participant.id}-originText`
              ] =
                "출발지를 입력해주세요.";
            }
          }
        );
  
        setErrors(nextErrors);
  
        return (
          Object.keys(
            nextErrors
          ).length === 0
        );
      };
  
    const handleFindMidpoint =
      () => {
        if (
          !validateParticipants()
        ) {
          return;
        }
  
        const normalizedParticipants =
          participants.map(
            (participant) => ({
              ...participant,
  
              nickname:
                participant.nickname.trim(),
  
              originText:
                participant.originText.trim(),
            })
          );
  
        sessionStorage.setItem(
          QUICK_PARTICIPANTS_STORAGE_KEY,
          JSON.stringify(
            normalizedParticipants
          )
        );
  
        /*
          약속 설정이 없는 상태에서
          URL로 직접 들어온 경우 방지
        */
        if (!settings) {
          navigate("/quick");
          return;
        }
  
        /*
          ★ Quick 계산 로딩 화면으로 이동
        */
        navigate("/quick/loading");
      };
  
    const completedCount =
      participants.filter(
        (participant) =>
          participant.nickname.trim() &&
          participant.originText.trim()
      ).length;
  
    return (
      <main className="quick-origin-page app-container">
        <header className="quick-origin-header">
          <button
            type="button"
            className="quick-origin-back"
            onClick={() =>
              navigate("/quick")
            }
          >
            ←
          </button>
  
          <div className="quick-origin-title">
            <h1>
              출발지 입력
              <span>📍</span>
            </h1>
  
            <p>
              참여자 이름과 출발지를
              입력해주세요
            </p>
          </div>
  
          <div className="quick-origin-progress">
            <span className="quick-origin-progress__bar quick-origin-progress__bar--active" />
            <span className="quick-origin-progress__bar quick-origin-progress__bar--active" />
            <span className="quick-origin-progress__bar" />
          </div>
  
          <p className="quick-origin-step">
            2 / 3 단계
          </p>
        </header>
  
        <section className="quick-origin-map">
          <div className="quick-origin-map__road quick-origin-map__road--vertical" />
          <div className="quick-origin-map__road quick-origin-map__road--horizontal" />
          <div className="quick-origin-map__road quick-origin-map__road--diagonal" />
  
          <div className="quick-origin-map__green" />
          <div className="quick-origin-map__water" />
  
          <div className="quick-origin-map__building quick-origin-map__building--left" />
          <div className="quick-origin-map__building quick-origin-map__building--right" />
  
          {participants.map(
            (
              participant,
              index
            ) => {
              if (
                !participant.originText.trim()
              ) {
                return null;
              }
  
              return (
                <div
                  key={
                    participant.id
                  }
                  className={`quick-origin-map__marker quick-origin-map__marker--${
                    index + 1
                  }`}
                  style={{
                    background:
                      PARTICIPANT_COLORS[
                        index
                      ],
                  }}
                >
                  {participant.nickname.trim()
                    ? participant.nickname
                        .trim()
                        .charAt(0)
                    : index + 1}
                </div>
              );
            }
          )}
        </section>
  
        <p className="quick-origin-map-help">
          출발지를 입력하면 지도에
          표시돼요
        </p>
  
        <section className="quick-origin-list">
          {participants.map(
            (
              participant,
              index
            ) => (
              <article
                key={
                  participant.id
                }
                className="quick-origin-card"
              >
                <div className="quick-origin-card__header">
                  <div className="quick-origin-card__title">
                    <span
                      className="quick-origin-number"
                      style={{
                        background:
                          PARTICIPANT_COLORS[
                            index
                          ],
                      }}
                    >
                      {index + 1}
                    </span>
  
                    <strong>
                      참여자{" "}
                      {index + 1}
                    </strong>
                  </div>
  
                  {index >= 2 && (
                    <button
                      type="button"
                      className="quick-origin-remove"
                      onClick={() =>
                        handleRemoveParticipant(
                          participant.id
                        )
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
  
                <input
                  type="text"
                  className={`quick-origin-input ${
                    errors[
                      `${participant.id}-nickname`
                    ]
                      ? "quick-origin-input--error"
                      : ""
                  }`}
                  placeholder="이름"
                  value={
                    participant.nickname
                  }
                  onChange={(
                    event
                  ) =>
                    handleParticipantChange(
                      participant.id,
                      "nickname",
                      event.target.value
                    )
                  }
                />
  
                {errors[
                  `${participant.id}-nickname`
                ] && (
                  <p className="quick-origin-error">
                    {
                      errors[
                        `${participant.id}-nickname`
                      ]
                    }
                  </p>
                )}
  
                <input
                  type="text"
                  className={`quick-origin-input ${
                    errors[
                      `${participant.id}-originText`
                    ]
                      ? "quick-origin-input--error"
                      : ""
                  }`}
                  placeholder="출발지 (예: 서울 마포구 합정동)"
                  value={
                    participant.originText
                  }
                  onChange={(
                    event
                  ) =>
                    handleParticipantChange(
                      participant.id,
                      "originText",
                      event.target.value
                    )
                  }
                />
  
                {errors[
                  `${participant.id}-originText`
                ] && (
                  <p className="quick-origin-error">
                    {
                      errors[
                        `${participant.id}-originText`
                      ]
                    }
                  </p>
                )}
              </article>
            )
          )}
        </section>
  
        {participants.length <
          MAX_PARTICIPANTS && (
          <button
            type="button"
            className="quick-origin-add"
            onClick={
              handleAddParticipant
            }
          >
            ＋ 참여자 추가
            <span>
              (최대 6명)
            </span>
          </button>
        )}
  
        <footer className="quick-origin-bottom">
          <button
            type="button"
            className="quick-origin-find-button"
            onClick={
              handleFindMidpoint
            }
          >
            🍌 중간 지점 찾기
          </button>
  
          <p className="quick-origin-count">
            {completedCount}/
            {participants.length}명 입력
          </p>
        </footer>
      </main>
    );
  }
  
  export default QuickOriginsPage;