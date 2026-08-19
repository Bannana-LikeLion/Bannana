import {
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import {
  getMockFinalSelection,
  getMockResult,
  getMockRoom,
} from "../data/mockData";

import {
  getRoomDraft,
} from "../data/roomStorage";

import "./ParticipantConfirmedPage.css";

const CURRENT_PARTICIPANT_ID = 4;

/* =====================================================
   참여자 입력 정보 읽기
===================================================== */

function readCurrentParticipant(
  roomId
) {
  try {
    /*
      현재 JoinRoomPage에서 사용하는
      새로운 저장 key
    */
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

/* =====================================================
   ICS 문자열 특수문자 처리
===================================================== */

function escapeICSText(
  text = ""
) {
  return String(text)
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /\n/g,
      "\\n"
    )
    .replace(
      /,/g,
      "\\,"
    )
    .replace(
      /;/g,
      "\\;"
    );
}

/* =====================================================
   JS Date → ICS 날짜
===================================================== */

function formatICSDate(date) {
  return date
    .toISOString()
    .replace(
      /[-:]/g,
      ""
    )
    .replace(
      /\.\d{3}Z$/,
      "Z"
    );
}

/* =====================================================
   PARTICIPANT CONFIRMED PAGE
===================================================== */

function ParticipantConfirmedPage() {
  /*
    App.jsx에서는 아직
    /join/:inviteCode/confirmed

    라는 이름을 사용하지만
    실제 값은 roomId 역할을 한다.
  */
  const { inviteCode } =
    useParams();

  const roomId =
    inviteCode;

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

  const roomDraft =
    useMemo(
      () => getRoomDraft(),
      []
    );

  const storedParticipant =
    useMemo(
      () =>
        readCurrentParticipant(
          roomId
        ),
      [roomId]
    );

  /* =====================================================
     참여자 데이터 구성

     HOST:
     CreateRoomPage에서 선택한
     실제 좌표 우선 사용

     CURRENT PARTICIPANT:
     JoinRoomPage에서 선택한
     실제 좌표 우선 사용
  ===================================================== */

  const displayParticipants =
    useMemo(() => {
      return (
        result.participants ?? []
      ).map(
        (
          participant,
          index
        ) => {
          /* ==========================================
             HOST
          ========================================== */

          if (index === 0) {
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
                room.host
                  ?.nickname ||
                participant.nickname,

              originText:
                roomDraft.hostOrigin ||
                room.host
                  ?.origin
                  ?.text ||
                participant.originText,

              originLat:
                hasHostLat
                  ? roomDraft.hostOriginLat
                  : participant.originLat,

              originLng:
                hasHostLng
                  ? roomDraft.hostOriginLng
                  : participant.originLng,

              isHost: true,
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

              originText:
                storedParticipant.originText,

              originLat:
                Number.isFinite(
                  storedParticipant.originLat
                )
                  ? storedParticipant.originLat
                  : participant.originLat,

              originLng:
                Number.isFinite(
                  storedParticipant.originLng
                )
                  ? storedParticipant.originLng
                  : participant.originLng,

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
      roomDraft,
      storedParticipant,
    ]);

  /* =====================================================
     현재 참여자
  ===================================================== */

  const currentParticipant =
    displayParticipants.find(
      (participant) =>
        participant.id ===
        CURRENT_PARTICIPANT_ID
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
     KAKAO MAP MARKERS
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

  const participantMapMarkers =
    displayParticipants
      .map(
        (
          participant,
          index
        ) => {
          const lat =
            Number(
              participant.originLat
            );

          const lng =
            Number(
              participant.originLng
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
     최종 장소 마커
  ===================================================== */

  const finalPlaceMarker =
    useMemo(() => {
      const lat =
        Number(
          selectedPlace?.lat
        );

      const lng =
        Number(
          selectedPlace?.lng
        );

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return null;
      }

      return {
        id: "final-place",

        lat,
        lng,

        label:
          selectedPlace.name,

        initial: "🍌",

        color: "#f4cf45",

        textColor:
          "#21190f",
      };
    }, [selectedPlace]);

  const mapMarkers =
    finalPlaceMarker
      ? [
          ...participantMapMarkers,
          finalPlaceMarker,
        ]
      : participantMapMarkers;

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
    ).format(
      meetingDate
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
      meetingDate
    );

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
     CALENDAR
  ===================================================== */

  const handleSaveCalendar =
    () => {
      try {
        const startDate =
          new Date(
            room.meetingDateTime
          );

        const endDate =
          new Date(
            startDate.getTime() +
              2 *
                60 *
                60 *
                1000
          );

        const now =
          new Date();

        const location =
          `${selectedPlace.name}, ${finalSelection.midpoint.name}`;

        const description =
          [
            "반나나에서 정한 약속 장소입니다.",

            `중간 지역: ${finalSelection.midpoint.name}`,

            `장소: ${selectedPlace.name}`,

            `날씨: ${currentWeather.label}`,

            `예상 강수확률: ${
              result.weather
                ?.rainProbability ??
              0
            }%`,

            `이동시간 차이: ${
              result.fairness
                ?.timeDifference ??
              0
            }분`,
          ].join("\n");

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

        setTimeout(() => {
          URL.revokeObjectURL(
            url
          );
        }, 1000);

        setCalendarSaved(
          true
        );

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
          await navigator.share(
            {
              title:
                "반나나 약속 장소 확정",

              text,

              url:
                window.location.href,
            }
          );

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
          {
            roomDraft.hostName ||
            room.host.nickname
          }
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
          REAL KAKAO MAP
      ================================================= */}

      <section className="participant-confirmed-map">
        <KakaoMap
          markers={
            mapMarkers
          }
          height="100%"
          level={5}
          emptyMessage="위치 정보를 불러올 수 없어요"
        />

        <div className="participant-map-fair-label">
          이동시간 차이{" "}
          {
            result.fairness
              ?.timeDifference ??
            0
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
                result.weather
                  ?.rainProbability ??
                0
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