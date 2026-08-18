import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import "./QuickLoadingPage.css";
  
  const QUICK_PARTICIPANTS_STORAGE_KEY =
    "bannana-quick-participants";
  
  function readParticipants() {
    try {
      const saved =
        sessionStorage.getItem(
          QUICK_PARTICIPANTS_STORAGE_KEY
        );
  
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error(
        "Quick 참여자 읽기 실패:",
        error
      );
    }
  
    return [];
  }
  
  function QuickLoadingPage() {
    const navigate =
      useNavigate();
  
    const participants =
      useMemo(
        () =>
          readParticipants(),
        []
      );
  
    const [
      currentStep,
      setCurrentStep,
    ] = useState(0);
  
    const [
      progress,
      setProgress,
    ] = useState(15);
  
    const steps = [
      "출발지 분석 중",
      "공평한 중간 지점 탐색 중",
      "날씨 조건 확인 중",
      "추천 장소 선별 중",
    ];
  
    useEffect(() => {
      if (
        participants.length < 2
      ) {
        navigate(
          "/quick/origins",
          {
            replace: true,
          }
        );
  
        return undefined;
      }
  
      const stepTimer =
        setInterval(() => {
          setCurrentStep(
            (prev) =>
              Math.min(
                prev + 1,
                steps.length - 1
              )
          );
        }, 850);
  
      const progressTimer =
        setInterval(() => {
          setProgress(
            (prev) =>
              Math.min(
                prev + 4,
                96
              )
          );
        }, 160);
  
      const resultTimer =
        setTimeout(() => {
          navigate(
            "/quick/result",
            {
              replace: true,
            }
          );
        }, 3900);
  
      return () => {
        clearInterval(
          stepTimer
        );
  
        clearInterval(
          progressTimer
        );
  
        clearTimeout(
          resultTimer
        );
      };
    }, [
      navigate,
      participants.length,
    ]);
  
    const markerClasses = [
      "quick-loading-person--top",
      "quick-loading-person--left",
      "quick-loading-person--right",
      "quick-loading-person--bottom",
      "quick-loading-person--far-left",
      "quick-loading-person--far-right",
    ];
  
    return (
      <main className="quick-loading-page app-container">
        <section className="quick-loading-main">
          <div className="quick-loading-visual">
            <div className="quick-loading-orbit quick-loading-orbit--outer" />
            <div className="quick-loading-orbit quick-loading-orbit--middle" />
            <div className="quick-loading-orbit quick-loading-orbit--inner" />
  
            <div className="quick-loading-center">
              반
            </div>
  
            {participants.map(
              (
                participant,
                index
              ) => (
                <div
                  key={
                    participant.id
                  }
                  className={`quick-loading-person ${
                    markerClasses[
                      index
                    ] ?? ""
                  }`}
                >
                  {participant.nickname.charAt(
                    0
                  )}
                </div>
              )
            )}
          </div>
  
          <div className="quick-loading-heading">
            <h1>
              모두에게 공평한
              <br />
              중간 장소를 찾고 있어요
            </h1>
  
            <p>
              평점 높은 장소를 우선
              추천해요
            </p>
          </div>
  
          <section className="quick-loading-card">
            {steps.map(
              (
                step,
                index
              ) => {
                const isDone =
                  index <
                  currentStep;
  
                const isCurrent =
                  index ===
                  currentStep;
  
                const isWaiting =
                  index >
                  currentStep;
  
                return (
                  <div
                    key={step}
                    className="quick-loading-row"
                  >
                    <div
                      className={`quick-loading-icon ${
                        isDone
                          ? "quick-loading-icon--done"
                          : ""
                      } ${
                        isCurrent
                          ? "quick-loading-icon--current"
                          : ""
                      } ${
                        isWaiting
                          ? "quick-loading-icon--waiting"
                          : ""
                      }`}
                    >
                      {isDone ? (
                        "✓"
                      ) : isCurrent ? (
                        <span className="quick-loading-spinner" />
                      ) : null}
                    </div>
  
                    <span
                      className={`quick-loading-label ${
                        isWaiting
                          ? "quick-loading-label--waiting"
                          : ""
                      }`}
                    >
                      {step}
                    </span>
  
                    {isCurrent && (
                      <span className="quick-loading-dots">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </div>
                );
              }
            )}
          </section>
        </section>
  
        <footer className="quick-loading-bottom">
          <div className="quick-loading-progress">
            <div
              className="quick-loading-progress__value"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
  
          <p>
            잠깐만요, 거의 다 됐어요...
          </p>
        </footer>
      </main>
    );
  }
  
  export default QuickLoadingPage;