import {
    useLocation,
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import {
    getMockFinalSelection,
    getMockResult,
    getMockRoom,
  } from "../data/mockData";
  
  import "./ConfirmedRoomPage.css";
  
  function ConfirmedRoomPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams();
  
    const room =
      getMockRoom();
  
    const fallbackResult =
      getMockResult();
  
    const fallbackSelection =
      getMockFinalSelection();
  
    const selectedPlace =
      location.state?.selectedPlace ??
      fallbackSelection.selectedPlace;
  
    const result =
      location.state?.result ??
      fallbackResult;
  
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
  
    const getDepartureTime = (
      travelTime
    ) => {
      const departureTime =
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
        departureTime
      );
    };
  
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
  
    const weather =
      weatherMeta[
        result.weather?.condition
      ] ?? weatherMeta.CLEAR;
  
    const handleShare =
      async () => {
        const shareText =
          `${room.title}\n` +
          `${selectedPlace.name}\n` +
          `${meetingDateText} ${meetingTimeText}`;
  
        try {
          if (navigator.share) {
            await navigator.share({
              title:
                "반나나 약속 확정",
  
              text:
                shareText,
  
              url:
                window.location.href,
            });
  
            return;
          }
  
          await navigator.clipboard.writeText(
            `${shareText}\n${window.location.href}`
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
  
    return (
      <main className="confirmed-page app-container">
        <header className="confirmed-header">
          <button
            type="button"
            className="confirmed-back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            ←
          </button>
  
          <h1>
            약속 확정! 🎉
          </h1>
  
          <p>
            모두의 중간 장소가
            결정됐어요
          </p>
        </header>
  
        <section className="confirmed-place-card">
          <div className="confirmed-place-image">
            {selectedPlace.category ===
            "CAFE"
              ? "☕"
              : "🍽️"}
          </div>
  
          <div className="confirmed-place-info">
            <div className="confirmed-place-name">
              <div>
                <span>
                  {selectedPlace.category ===
                  "CAFE"
                    ? "카페"
                    : "식당"}
                </span>
  
                {selectedPlace.indoor && (
                  <span>
                    실내
                  </span>
                )}
              </div>
  
              <h2>
                {selectedPlace.name}
              </h2>
  
              <p>
                📍 {result.midpoint.name}
                {" · "}
                {selectedPlace.distanceM}m
              </p>
            </div>
          </div>
        </section>
  
        <section className="confirmed-map">
          <div className="confirmed-map__road confirmed-map__road--v" />
          <div className="confirmed-map__road confirmed-map__road--h" />
  
          <div className="confirmed-map__green" />
          <div className="confirmed-map__water" />
  
          <div className="confirmed-map-midpoint">
            🍌
          </div>
  
          {result.participants.map(
            (
              participant,
              index
            ) => (
              <div
                key={participant.id}
                className={`confirmed-map-person confirmed-map-person--${
                  index + 1
                }`}
              >
                {participant.nickname.charAt(
                  0
                )}
              </div>
            )
          )}
  
          <div className="confirmed-fair-label">
            이동시간 차이{" "}
            {
              result.fairness
                .timeDifference
            }
            분 · 가장 공평해요 🎉
          </div>
        </section>
  
        <section className="confirmed-section">
          <h2 className="confirmed-section-title">
            🗓️ 약속 정보
          </h2>
  
          <div className="confirmed-meeting-info">
            <div className="confirmed-info-box">
              <span>
                날짜
              </span>
  
              <strong>
                {meetingDateText}
              </strong>
            </div>
  
            <div className="confirmed-info-box">
              <span>
                시간
              </span>
  
              <strong>
                {meetingTimeText}
              </strong>
            </div>
  
            <div className="confirmed-info-box">
              <span>
                날씨
              </span>
  
              <strong>
                {weather.icon}{" "}
                {weather.label}
              </strong>
            </div>
          </div>
        </section>
  
        <section className="confirmed-section">
          <h2 className="confirmed-section-title">
            ⏱️ 참여자별 이동 안내
          </h2>
  
          <p className="confirmed-section-description">
            대중교통 기준 예상
            이동시간
          </p>
  
          <div className="confirmed-travel-list">
            {result.participants.map(
              (
                participant,
                index
              ) => (
                <article
                  key={participant.id}
                  className="confirmed-travel-card"
                >
                  <div
                    className={`confirmed-avatar confirmed-avatar--${
                      index + 1
                    }`}
                  >
                    {participant.nickname.charAt(
                      0
                    )}
                  </div>
  
                  <div className="confirmed-travel-info">
                    <strong>
                      {
                        participant.nickname
                      }
  
                      {participant.isHost &&
                        " (호스트)"}
                    </strong>
  
                    <span>
                      {
                        participant.originText
                      }
                    </span>
                  </div>
  
                  <div className="confirmed-travel-time">
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
  
          <div className="confirmed-complete-message">
            ✅ 약속 확정 완료!
          </div>
        </section>
  
        <section className="confirmed-actions">
          <button
            type="button"
            className="confirmed-primary-button"
            onClick={handleShare}
          >
            🔗 약속 공유하기
          </button>
  
          <button
            type="button"
            className="confirmed-secondary-button"
            onClick={() =>
              navigate(
                `/room/${roomId}/result`
              )
            }
          >
            다른 장소 보기
          </button>
        </section>
      </main>
    );
  }
  
  export default ConfirmedRoomPage;