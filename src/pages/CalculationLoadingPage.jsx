import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import {
    getMockParticipants,
  } from "../data/mockData";
  
  import "./CalculationLoadingPage.css";
  
  const CALCULATION_STEPS = [
    "출발지 분석 중",
    "공평한 중간 지점 탐색 중",
    "날씨 조건 확인 중",
    "추천 장소 선별 중",
  ];
  
  function CalculationLoadingPage() {
    const navigate = useNavigate();
    const { roomId } = useParams();
  
    const [currentStep, setCurrentStep] =
      useState(0);
  
    const [progress, setProgress] =
      useState(15);
  
    /*
      CreateRoomPage에서 저장한 호스트 정보 +
      나머지 Mock 참여자 3명을 가져온다.
    */
    const participants = useMemo(
      () => getMockParticipants(),
      []
    );
  
    const positionClasses = [
      "calculation-person--top",
      "calculation-person--left",
      "calculation-person--right",
      "calculation-person--bottom",
    ];
  
    useEffect(() => {
      const stepTimer = setInterval(() => {
        setCurrentStep((prev) => {
          if (
            prev >=
            CALCULATION_STEPS.length - 1
          ) {
            return prev;
          }
  
          return prev + 1;
        });
      }, 900);
  
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) {
            return prev;
          }
  
          return prev + 4;
        });
      }, 180);
  
      const resultTimer = setTimeout(() => {
        navigate(
          `/room/${roomId}/result`,
          {
            replace: true,
          }
        );
      }, 4000);
  
      return () => {
        clearInterval(stepTimer);
        clearInterval(progressTimer);
        clearTimeout(resultTimer);
      };
    }, [navigate, roomId]);
  
    return (
      <main className="calculation-page app-container">
        <section className="calculation-main">
          <div className="calculation-visual">
            <div className="calculation-orbit calculation-orbit--outer" />
  
            <div className="calculation-orbit calculation-orbit--middle" />
  
            <div className="calculation-orbit calculation-orbit--inner" />
  
            <div className="calculation-center">
              반
            </div>
  
            {participants.map(
              (participant, index) => (
                <div
                  key={participant.id}
                  className={`calculation-person ${
                    positionClasses[index] ?? ""
                  }`}
                  title={participant.nickname}
                >
                  {participant.nickname.charAt(0)}
                </div>
              )
            )}
          </div>
  
          <div className="calculation-heading">
            <h1>
              모두에게 공평한
              <br />
              중간 장소를 찾고 있어요
            </h1>
  
            <p>
              이동시간과 날씨를 함께
              확인하고 있어요
            </p>
          </div>
  
          <section className="calculation-step-card">
            {CALCULATION_STEPS.map(
              (step, index) => {
                const isDone =
                  index < currentStep;
  
                const isCurrent =
                  index === currentStep;
  
                const isWaiting =
                  index > currentStep;
  
                return (
                  <div
                    key={step}
                    className={`calculation-step-row ${
                      isCurrent
                        ? "calculation-step-row--current"
                        : ""
                    }`}
                  >
                    <div
                      className={`calculation-step-icon ${
                        isDone
                          ? "calculation-step-icon--done"
                          : ""
                      } ${
                        isCurrent
                          ? "calculation-step-icon--current"
                          : ""
                      } ${
                        isWaiting
                          ? "calculation-step-icon--waiting"
                          : ""
                      }`}
                    >
                      {isDone ? (
                        "✓"
                      ) : isCurrent ? (
                        <span className="calculation-spinner" />
                      ) : null}
                    </div>
  
                    <span
                      className={`calculation-step-label ${
                        isWaiting
                          ? "calculation-step-label--waiting"
                          : ""
                      }`}
                    >
                      {step}
                    </span>
  
                    {isCurrent && (
                      <span className="calculation-dots">
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
  
        <footer className="calculation-bottom">
          <div className="calculation-progress">
            <div
              className="calculation-progress__value"
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
  
  export default CalculationLoadingPage;