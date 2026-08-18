import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import "./QuickConfirmedPage.css";
  
  /* =====================================================
     STORAGE KEY
  ===================================================== */
  
  const QUICK_SETTINGS_STORAGE_KEY =
    "bannana-quick-settings";
  
  const QUICK_PARTICIPANTS_STORAGE_KEY =
    "bannana-quick-participants";
  
  const QUICK_SELECTED_PLACE_KEY =
    "bannana-quick-selected-place";
  
  /* =====================================================
     PARTICIPANT COLORS
  ===================================================== */
  
  const PARTICIPANT_COLORS = [
    "#F0C936",
    "#E87570",
    "#79CEC5",
    "#7144DF",
    "#E7A3C2",
    "#F0A65A",
  ];
  
  /* =====================================================
     STORAGE
  ===================================================== */
  
  function readSessionStorage(
    key,
    fallback
  ) {
    try {
      const saved =
        sessionStorage.getItem(
          key
        );
  
      if (saved) {
        return JSON.parse(
          saved
        );
      }
    } catch (error) {
      console.error(
        `${key} 읽기 실패:`,
        error
      );
    }
  
    return fallback;
  }
  
  /* =====================================================
     CATEGORY
  ===================================================== */
  
  const CATEGORY_META = {
    CAFE: {
      label: "카페",
      icon: "☕",
    },
  
    RESTAURANT: {
      label: "식당",
      icon: "🍝",
    },
  
    CULTURE: {
      label: "전시",
      icon: "🎨",
    },
  
    PARK: {
      label: "공원",
      icon: "🌳",
    },
  
    SHOPPING: {
      label: "쇼핑",
      icon: "🛍️",
    },
  };
  
  /* =====================================================
     PAGE
  ===================================================== */
  
  function QuickConfirmedPage() {
    const navigate =
      useNavigate();
  
    const [
      shared,
      setShared,
    ] = useState(false);
  
    /* ===================================================
       DATA
    =================================================== */
  
    const settings =
      useMemo(
        () =>
          readSessionStorage(
            QUICK_SETTINGS_STORAGE_KEY,
            null
          ),
        []
      );
  
    const storedParticipants =
      useMemo(
        () =>
          readSessionStorage(
            QUICK_PARTICIPANTS_STORAGE_KEY,
            []
          ),
        []
      );
  
    const selectedData =
      useMemo(
        () =>
          readSessionStorage(
            QUICK_SELECTED_PLACE_KEY,
            null
          ),
        []
      );
  
    /* ===================================================
       잘못된 직접 접근 방지
    =================================================== */
  
    useEffect(() => {
      if (!selectedData) {
        navigate(
          "/quick/result",
          {
            replace: true,
          }
        );
      }
    }, [
      navigate,
      selectedData,
    ]);
  
    if (!selectedData) {
      return null;
    }
  
    /* ===================================================
       PLACE
    =================================================== */
  
    const selectedPlace =
      selectedData;
  
    const midpoint =
      selectedData.midpoint ??
      "성수동·서울숲";
  
    const category =
      CATEGORY_META[
        selectedPlace.category
      ] ?? {
        label: "장소",
        icon: "📍",
      };
  
    /* ===================================================
       PARTICIPANTS
  
       Result에서 저장한 이동시간 정보가 있으면
       그것을 그대로 사용.
  
       없으면 입력 참여자 정보로 fallback.
    =================================================== */
  
    const participants =
      selectedData.participants?.length
        ? selectedData.participants
        : storedParticipants.map(
            (
              participant,
              index
            ) => ({
              ...participant,
  
              travelTime:
                [
                  36,
                  39,
                  41,
                  38,
                  40,
                  37,
                ][index] ?? 40,
            })
          );
  
    /* ===================================================
       DATE / TIME
    =================================================== */
  
    const meetingDate =
      settings?.meetingDate ??
      "2026-08-22";
  
    const meetingTime =
      settings?.meetingTime ??
      "15:00";
  
    const meetingDateObject =
      new Date(
        `${meetingDate}T${meetingTime}:00`
      );
  
    const meetingDateText =
      new Intl.DateTimeFormat(
        "ko-KR",
        {
          month: "long",
          day: "numeric",
          weekday: "short",
        }
      ).format(
        meetingDateObject
      );
  
    const meetingTimeText =
      new Intl.DateTimeFormat(
        "ko-KR",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      ).format(
        meetingDateObject
      );
  
    /* ===================================================
       WEATHER MOCK
  
       추후 기상청 API 결과로 교체
    =================================================== */
  
    const weather = {
      icon: "🌧️",
      label: "비",
      rainProbability: 80,
    };
  
    /* ===================================================
       출발 시간
    =================================================== */
  
    const getDepartureTime = (
      travelTime
    ) => {
      const departure =
        new Date(
          meetingDateObject.getTime() -
            travelTime *
              60 *
              1000
        );
  
      return new Intl.DateTimeFormat(
        "ko-KR",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      ).format(
        departure
      );
    };
  
    /* ===================================================
       SHARE
    =================================================== */
  
    const handleShare =
      async () => {
        const shareText =
          `반나나 약속이 확정됐어요! 🎉\n` +
          `장소: ${selectedPlace.name}\n` +
          `지역: ${midpoint}\n` +
          `날짜: ${meetingDateText}\n` +
          `시간: ${meetingTimeText}`;
  
        try {
          if (
            navigator.share
          ) {
            await navigator.share({
              title:
                "반나나 약속 확정",
              text:
                shareText,
            });
  
            setShared(true);
  
            return;
          }
  
          await navigator.clipboard.writeText(
            shareText
          );
  
          setShared(true);
        } catch (error) {
          /*
            navigator.share에서 사용자가
            공유창을 닫은 경우도 있으므로
            오류 페이지로 보내지 않는다.
          */
  
          console.error(
            "공유 실패:",
            error
          );
        }
      };
  
    /* ===================================================
       UI
    =================================================== */
  
    return (
      <main className="quick-confirmed-page">
        {/* =================================================
            HEADER
        ================================================= */}
  
        <header className="quick-confirmed-header">
          <button
            type="button"
            className="quick-confirmed-back"
            onClick={() =>
              navigate(
                "/quick/result"
              )
            }
            aria-label="뒤로 가기"
          >
            ←
          </button>
  
          <h1>
            약속 확정! 🎉
          </h1>
        </header>
  
        {/* =================================================
            PLACE CARD
        ================================================= */}
  
        <section className="quick-confirmed-place-card">
          <div className="quick-confirmed-place-image">
            {selectedPlace.icon ??
              category.icon}
          </div>
  
          <div className="quick-confirmed-place-content">
            <h2>
              {selectedPlace.name}
            </h2>
  
            <div className="quick-confirmed-place-meta">
              <span>
                {
                  category.label
                }
              </span>
  
              {selectedPlace.indoor && (
                <span className="quick-confirmed-green-tag">
                  실내
                </span>
              )}
            </div>
  
            <p>
              📍 {midpoint} ·{" "}
              {
                selectedPlace.distanceM
              }
              m
            </p>
  
            <div className="quick-confirmed-place-tags">
              {selectedPlace.tags?.map(
                (tag) => (
                  <span
                    key={
                      tag
                    }
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </section>
  
        {/* =================================================
            MAP
        ================================================= */}
  
        <section className="quick-confirmed-map">
          <div className="quick-confirmed-map__road quick-confirmed-map__road--vertical" />
  
          <div className="quick-confirmed-map__road quick-confirmed-map__road--horizontal" />
  
          <div className="quick-confirmed-map__green" />
  
          <div className="quick-confirmed-map__water" />
  
          <div className="quick-confirmed-map__building quick-confirmed-map__building--left" />
  
          <div className="quick-confirmed-map__building quick-confirmed-map__building--right" />
  
          {/* 중간 지점 */}
  
          <div className="quick-confirmed-midpoint">
            🍌
          </div>
  
          {/* 참여자 */}
  
          {participants.map(
            (
              participant,
              index
            ) => (
              <div
                key={
                  participant.id ??
                  index
                }
                className={`quick-confirmed-map-person quick-confirmed-map-person--${
                  index + 1
                }`}
                style={{
                  background:
                    PARTICIPANT_COLORS[
                      index
                    ],
                }}
              >
                {participant.nickname
                  ?.charAt(0) ??
                  "?"}
              </div>
            )
          )}
        </section>
  
        {/* =================================================
            MEETING INFO
        ================================================= */}
  
        <section className="quick-confirmed-section">
          <h2 className="quick-confirmed-section-title">
            🗓️ 약속 정보
          </h2>
  
          <div className="quick-confirmed-info-grid">
            <article className="quick-confirmed-info-card">
              <span>
                날짜
              </span>
  
              <strong>
                {
                  meetingDateText
                }
              </strong>
            </article>
  
            <article className="quick-confirmed-info-card">
              <span>
                시간
              </span>
  
              <strong>
                {
                  meetingTimeText
                }
              </strong>
            </article>
  
            <article className="quick-confirmed-info-card">
              <span>
                날씨
              </span>
  
              <strong>
                {
                  weather.icon
                }{" "}
                {
                  weather.label
                }
              </strong>
            </article>
          </div>
        </section>
  
        {/* =================================================
            PARTICIPANT TRAVEL
        ================================================= */}
  
        <section className="quick-confirmed-section quick-confirmed-travel-section">
          <h2 className="quick-confirmed-section-title">
            ⏱️ 참여자별 이동 안내
          </h2>
  
          <p className="quick-confirmed-section-description">
            대중교통 기준 예상
            이동시간
          </p>
  
          <div className="quick-confirmed-travel-list">
            {participants.map(
              (
                participant,
                index
              ) => (
                <article
                  key={
                    participant.id ??
                    index
                  }
                  className="quick-confirmed-travel-row"
                >
                  <div
                    className="quick-confirmed-avatar"
                    style={{
                      background:
                        PARTICIPANT_COLORS[
                          index
                        ],
                    }}
                  >
                    {participant.nickname
                      ?.charAt(0) ??
                      "?"}
                  </div>
  
                  <div className="quick-confirmed-person-info">
                    <strong>
                      {
                        participant.nickname
                      }
                    </strong>
  
                    <span>
                      {participant.originText ??
                        participant.origin?.text ??
                        "출발지"}
                    </span>
  
                    <div className="quick-confirmed-travel-bar">
                      <span
                        style={{
                          width:
                            `${Math.min(
                              100,
                              ((participant.travelTime ??
                                40) /
                                60) *
                                100
                            )}%`,
  
                          background:
                            PARTICIPANT_COLORS[
                              index
                            ],
                        }}
                      />
                    </div>
                  </div>
  
                  <div className="quick-confirmed-time-info">
                    <strong>
                      {
                        participant.travelTime
                      }
                      분
                    </strong>
  
                    <span>
                      {getDepartureTime(
                        participant.travelTime
                      )}{" "}
                      출발
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
  
          {/* 공유 완료 표시 */}
  
          {shared && (
            <div className="quick-confirmed-share-success">
              ✅ 약속 공유 완료!
            </div>
          )}
        </section>
  
        {/* =================================================
            ACTIONS
        ================================================= */}
  
        <section className="quick-confirmed-actions">
          <button
            type="button"
            className="quick-confirmed-primary"
            onClick={
              handleShare
            }
          >
            🔗 약속 공유하기
          </button>
  
          <button
            type="button"
            className="quick-confirmed-secondary"
            onClick={() =>
              navigate(
                "/quick/result"
              )
            }
          >
            다른 장소 보기
          </button>
        </section>
      </main>
    );
  }
  
  export default QuickConfirmedPage;