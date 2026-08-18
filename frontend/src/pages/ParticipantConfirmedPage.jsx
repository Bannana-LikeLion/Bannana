import {
    useMemo,
    useState,
  } from "react";
  
  import {
    getMockFinalSelection,
    getMockResult,
    getMockRoom,
  } from "../data/mockData";
  
  import "./ParticipantConfirmedPage.css";
  
  const PARTICIPANT_STORAGE_KEY =
    "bannana-current-participant";
  
  /* =====================================================
     참여자 입력 정보 읽기
  ===================================================== */
  
  function readCurrentParticipant() {
    try {
      const saved =
        sessionStorage.getItem(
          PARTICIPANT_STORAGE_KEY
        );
  
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(
        "참여자 정보 읽기 실패:",
        error
      );
    }
  
    return null;
  }
  
  /* =====================================================
     ICS 문자열 안에서 특수문자 처리
  ===================================================== */
  
  function escapeICSText(text = "") {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }
  
  /* =====================================================
     JS Date → ICS 날짜 포맷
  
     2026-08-22T06:00:00.000Z
          ↓
     20260822T060000Z
  ===================================================== */
  
  function formatICSDate(date) {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  }
  
  /* =====================================================
     PARTICIPANT CONFIRMED PAGE
  ===================================================== */
  
  function ParticipantConfirmedPage() {
    const [
      calendarSaved,
      setCalendarSaved,
    ] = useState(false);
  
    /* =====================================================
       DATA
    ===================================================== */
  
    const room =
      useMemo(
        () => getMockRoom(),
        []
      );
  
    const result =
      useMemo(
        () => getMockResult(),
        []
      );
  
    const finalSelection =
      useMemo(
        () =>
          getMockFinalSelection(),
        []
      );
  
    const storedParticipant =
      useMemo(
        () =>
          readCurrentParticipant(),
        []
      );
  
    /* =====================================================
       참여자 데이터 구성
  
       1번째 = 호스트
       4번째 = 현재 Participant
    ===================================================== */
  
    const displayParticipants =
      useMemo(() => {
        return result.participants.map(
          (
            participant,
            index
          ) => {
            /* 호스트 */
  
            if (index === 0) {
              return {
                ...participant,
  
                nickname:
                  room.host
                    ?.nickname ??
                  participant.nickname,
  
                originText:
                  room.host
                    ?.origin
                    ?.text ??
                  participant.originText,
  
                isHost: true,
              };
            }
  
            /* 현재 참여자 */
  
            if (
              participant.id === 4 &&
              storedParticipant
            ) {
              return {
                ...participant,
  
                nickname:
                  storedParticipant.nickname,
  
                originText:
                  storedParticipant.originText,
  
                isHost: false,
              };
            }
  
            return {
              ...participant,
  
              isHost: false,
            };
          }
        );
      }, [
        result.participants,
        room,
        storedParticipant,
      ]);
  
    /* =====================================================
       현재 참여자
    ===================================================== */
  
    const currentParticipant =
      displayParticipants.find(
        (participant) =>
          participant.id === 4
      ) ??
      displayParticipants[
        displayParticipants.length -
          1
      ];
  
    /* =====================================================
       확정 장소
    ===================================================== */
  
    const selectedPlace =
      finalSelection.selectedPlace;
  
    /* =====================================================
       약속 날짜
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
  
    /* =====================================================
       출발 시간
    ===================================================== */
  
    const getDepartureTime = (
      travelTime
    ) => {
      const departureDate =
        new Date(
          meetingDate.getTime() -
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
        departureDate
      );
    };
  
    /* =====================================================
       WEATHER
    ===================================================== */
  
    const weatherMeta = {
      CLEAR: {
        icon: "☀️",
        label: "맑음",
      },
  
      RAIN: {
        icon: "🌧️",
        label: "비",
      },
  
      SNOW: {
        icon: "🌨️",
        label: "눈",
      },
    };
  
    const currentWeather =
      weatherMeta[
        result.weather?.condition
      ] ??
      weatherMeta.CLEAR;
  
    /* =====================================================
       CATEGORY
    ===================================================== */
  
    const categoryText = {
      CAFE: "카페",
  
      RESTAURANT:
        "식당",
  
      CULTURE:
        "문화",
    };
  
    /* =====================================================
       실제 캘린더 파일(.ics) 저장
  
       약속 시작 시간:
       room.meetingDateTime
  
       약속 종료 시간:
       시작 + 2시간
    ===================================================== */
  
    const handleSaveCalendar =
      () => {
        try {
          /* 약속 시작 */
  
          const startDate =
            new Date(
              room.meetingDateTime
            );
  
          /* 약속 종료 = 2시간 뒤 */
  
          const endDate =
            new Date(
              startDate.getTime() +
                2 *
                  60 *
                  60 *
                  1000
            );
  
          /* 파일 생성 시간 */
  
          const now =
            new Date();
  
          const location =
            `${selectedPlace.name}, ${finalSelection.midpoint.name}`;
  
          const description =
            [
              `반나나에서 정한 약속 장소입니다.`,
              `중간 지역: ${finalSelection.midpoint.name}`,
              `장소: ${selectedPlace.name}`,
              `날씨: ${currentWeather.label}`,
              `예상 강수확률: ${result.weather.rainProbability}%`,
              `이동시간 차이: ${result.fairness.timeDifference}분`,
            ].join("\n");
  
          /*
            ICS 파일 형식
  
            대부분의 캘린더 앱에서
            읽을 수 있는 표준 포맷
          */
  
          const icsContent = [
            "BEGIN:VCALENDAR",
  
            "VERSION:2.0",
  
            "PRODID:-//BANNANA//Meeting//KO",
  
            "CALSCALE:GREGORIAN",
  
            "METHOD:PUBLISH",
  
            "BEGIN:VEVENT",
  
            `UID:${room.id}-${Date.now()}@bannana.app`,
  
            `DTSTAMP:${formatICSDate(
              now
            )}`,
  
            `DTSTART:${formatICSDate(
              startDate
            )}`,
  
            `DTEND:${formatICSDate(
              endDate
            )}`,
  
            `SUMMARY:${escapeICSText(
              room.title
            )}`,
  
            `LOCATION:${escapeICSText(
              location
            )}`,
  
            `DESCRIPTION:${escapeICSText(
              description
            )}`,
  
            "BEGIN:VALARM",
  
            "TRIGGER:-PT30M",
  
            "ACTION:DISPLAY",
  
            "DESCRIPTION:반나나 약속 30분 전이에요!",
  
            "END:VALARM",
  
            "END:VEVENT",
  
            "END:VCALENDAR",
          ].join("\r\n");
  
          /* ============================
             Blob 생성
          ============================ */
  
          const blob =
            new Blob(
              [icsContent],
              {
                type:
                  "text/calendar;charset=utf-8",
              }
            );
  
          const url =
            URL.createObjectURL(
              blob
            );
  
          /* ============================
             다운로드 링크 생성
          ============================ */
  
          const link =
            document.createElement(
              "a"
            );
  
          link.href =
            url;
  
          link.download =
            "반나나_약속.ics";
  
          document.body.appendChild(
            link
          );
  
          link.click();
  
          document.body.removeChild(
            link
          );
  
          /* Blob URL 제거 */
  
          setTimeout(() => {
            URL.revokeObjectURL(
              url
            );
          }, 1000);
  
          /* 성공 메시지 */
  
          setCalendarSaved(
            true
          );
  
          /*
            몇 초 뒤 성공 메시지 제거
          */
  
          setTimeout(() => {
            setCalendarSaved(
              false
            );
          }, 3500);
        } catch (error) {
          console.error(
            "캘린더 저장 실패:",
            error
          );
  
          alert(
            "캘린더 파일을 만들지 못했습니다."
          );
        }
      };
  
    /* =====================================================
       SHARE
    ===================================================== */
  
    const handleShare =
      async () => {
        const text =
          `${room.title}\n` +
          `${selectedPlace.name}\n` +
          `${meetingDateText} ${meetingTimeText}`;
  
        try {
          if (
            navigator.share
          ) {
            await navigator.share({
              title:
                "반나나 약속 장소 확정",
  
              text,
  
              url:
                window.location.href,
            });
  
            return;
          }
  
          await navigator.clipboard.writeText(
            `${text}\n${window.location.href}`
          );
  
          alert(
            "약속 정보가 복사됐어요!"
          );
        } catch (error) {
          console.error(
            "공유 실패:",
            error
          );
        }
      };
  
    /* =====================================================
       UI
    ===================================================== */
  
    return (
      <main className="participant-confirmed-page app-container">
  
        {/* =================================================
            PROGRESS
        ================================================= */}
  
        <div className="participant-confirmed-progress">
  
          <div className="participant-confirmed-progress-bars">
  
            <span />
  
            <span />
  
            <span />
  
          </div>
  
          <strong>
            3/3
          </strong>
  
        </div>
  
        {/* =================================================
            HEADER
        ================================================= */}
  
        <header className="participant-confirmed-header">
  
          <h1>
            약속 장소 확정! 🎉
          </h1>
  
          <p>
            {room.host.nickname}
            님이 최종 장소를 결정했어요
          </p>
  
        </header>
  
        {/* =================================================
            MY TRAVEL TIME
        ================================================= */}
  
        <section className="participant-my-travel">
  
          <div className="participant-my-travel-top">
  
            <div>
  
              <p>
                {
                  currentParticipant.nickname
                }
                님의 예상 이동시간
              </p>
  
              <strong className="participant-my-travel-minute">
  
                {
                  currentParticipant.travelTime
                }
  
                <span>
                  분
                </span>
  
              </strong>
  
            </div>
  
            <div className="participant-departure">
  
              <strong>
                {getDepartureTime(
                  currentParticipant.travelTime
                )}
              </strong>
  
              <span>
                출발
              </span>
  
            </div>
  
          </div>
  
          <div className="participant-travel-progress">
  
            <div
              style={{
                width: `${Math.min(
                  100,
                  (currentParticipant.travelTime /
                    60) *
                    100
                )}%`,
              }}
            />
  
          </div>
  
          <p className="participant-travel-help">
            대중교통 기준 · 출발 시간에 맞춰 나가면 돼요
          </p>
  
        </section>
  
        {/* =================================================
            FINAL PLACE
        ================================================= */}
  
        <section className="participant-final-place">
  
          <h2>
            📍 약속 장소
          </h2>
  
          <div className="participant-final-place-main">
  
            <div className="participant-final-place-image">
  
              {selectedPlace.category ===
              "CAFE"
                ? "☕"
                : selectedPlace.category ===
                    "RESTAURANT"
                  ? "🍽️"
                  : "🎨"}
  
            </div>
  
            <div className="participant-final-place-info">
  
              <h3>
                {
                  selectedPlace.name
                }
              </h3>
  
              <div className="participant-final-place-tags">
  
                <span>
                  {
                    categoryText[
                      selectedPlace.category
                    ] ?? "장소"
                  }
                </span>
  
                {selectedPlace.indoor && (
  
                  <span className="participant-final-place-tag--indoor">
                    실내
                  </span>
  
                )}
  
              </div>
  
              <p>
                📍{" "}
                {
                  finalSelection.midpoint.name
                }
                {" · "}
                {
                  selectedPlace.distanceM
                }
                m
              </p>
  
            </div>
  
          </div>
  
        </section>
  
        {/* =================================================
            MAP
        ================================================= */}
  
        <section className="participant-confirmed-map">
  
          <div className="participant-confirmed-map-road participant-confirmed-map-road--vertical" />
  
          <div className="participant-confirmed-map-road participant-confirmed-map-road--horizontal" />
  
          <div className="participant-confirmed-map-green" />
  
          <div className="participant-confirmed-map-water" />
  
          <div className="participant-confirmed-map-building participant-confirmed-map-building--left" />
  
          <div className="participant-confirmed-map-building participant-confirmed-map-building--right" />
  
          {displayParticipants.map(
            (
              participant,
              index
            ) => (
  
              <div
                key={
                  participant.id
                }
                className={`participant-confirmed-marker participant-confirmed-marker--${
                  index + 1
                }`}
              >
                {participant.nickname.charAt(
                  0
                )}
              </div>
  
            )
          )}
  
          <div className="participant-confirmed-midpoint">
            🍌
          </div>
  
          <div className="participant-map-fair-label">
  
            이동시간 차이{" "}
  
            {
              result.fairness
                .timeDifference
            }
  
            분 · 가장 공평해요 🎉
  
          </div>
  
        </section>
  
        {/* =================================================
            ALL TRAVEL TIME
        ================================================= */}
  
        <section className="participant-all-travel">
  
          <h2>
            ⏱️ 모두의 이동시간
          </h2>
  
          <div className="participant-all-travel-list">
  
            {displayParticipants.map(
              (
                participant,
                index
              ) => {
  
                const isMe =
                  participant.id ===
                  currentParticipant.id;
  
                return (
  
                  <article
                    key={
                      participant.id
                    }
                    className="participant-all-travel-row"
                  >
  
                    <div
                      className={`participant-all-avatar participant-all-avatar--${
                        index + 1
                      }`}
                    >
  
                      {participant.nickname.charAt(
                        0
                      )}
  
                    </div>
  
                    <div className="participant-all-person">
  
                      <strong>
  
                        {
                          participant.nickname
                        }
  
                        {isMe &&
                          " (나)"}
  
                      </strong>
  
                      <div className="participant-all-bar">
  
                        <span
                          className={`participant-all-bar-value participant-all-bar-value--${
                            index + 1
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (participant.travelTime /
                                60) *
                                100
                            )}%`,
                          }}
                        />
  
                      </div>
  
                    </div>
  
                    <div className="participant-all-time">
  
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
  
                );
              }
            )}
  
          </div>
  
        </section>
  
        {/* =================================================
            WEATHER + DATE
        ================================================= */}
  
        <section className="participant-final-summary">
  
          <div className="participant-final-weather">
  
            <span className="participant-final-weather-icon">
              {
                currentWeather.icon
              }
            </span>
  
            <div>
  
              <strong>
                {
                  currentWeather.label
                }
              </strong>
  
              <small>
                강수{" "}
                {
                  result.weather.rainProbability
                }
                %
              </small>
  
            </div>
  
          </div>
  
          <div className="participant-final-date">
  
            <strong>
              {
                meetingDateText
              }
            </strong>
  
            <span>
  
              {
                meetingTimeText
              }
  
              <br />
  
              {
                selectedPlace.name
              }
  
            </span>
  
          </div>
  
        </section>
  
        {/* =================================================
            CALENDAR SUCCESS
        ================================================= */}
  
        {calendarSaved && (
  
          <div className="participant-calendar-success">
            ✅ 캘린더 파일을 만들었어요! 파일을 열어 일정을 추가해주세요.
          </div>
  
        )}
  
        {/* =================================================
            BUTTONS
        ================================================= */}
  
        <section className="participant-confirmed-actions">
  
          <button
            type="button"
            className="participant-calendar-button"
            onClick={
              handleSaveCalendar
            }
          >
            🗓️ 내 캘린더에 저장하기
          </button>
  
          <button
            type="button"
            className="participant-share-button"
            onClick={
              handleShare
            }
          >
            🔗 친구에게 공유하기
          </button>
  
        </section>
  
      </main>
    );
  }
  
  export default ParticipantConfirmedPage;