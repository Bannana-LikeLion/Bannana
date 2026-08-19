import {
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import QRCode from "react-qr-code";

import {
  getRoomDraft,
} from "../data/roomStorage";

import "./ShareRoomPage.css";

/* =====================================================
   KAKAO JAVASCRIPT SDK
===================================================== */

const KAKAO_SDK_URL =
  "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";

const KAKAO_SDK_INTEGRITY =
  "sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J";

let kakaoSdkPromise =
  null;

/* =====================================================
   KAKAO SDK LOAD
===================================================== */

function loadKakaoSdk() {
  const javascriptKey =
    import.meta.env
      .VITE_KAKAO_JAVASCRIPT_KEY;

  if (!javascriptKey) {
    return Promise.reject(
      new Error(
        "VITE_KAKAO_JAVASCRIPT_KEY가 설정되지 않았습니다."
      )
    );
  }

  /*
    이미 Kakao SDK가 로드된 경우
  */
  if (window.Kakao) {
    if (
      !window.Kakao.isInitialized()
    ) {
      window.Kakao.init(
        javascriptKey
      );
    }

    return Promise.resolve(
      window.Kakao
    );
  }

  /*
    다른 요청에서 이미 SDK를
    불러오는 중이라면 동일 Promise 사용
  */
  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise =
    new Promise(
      (
        resolve,
        reject
      ) => {
        const initialize =
          () => {
            if (
              !window.Kakao
            ) {
              reject(
                new Error(
                  "카카오 JavaScript SDK를 불러오지 못했습니다."
                )
              );

              return;
            }

            if (
              !window.Kakao.isInitialized()
            ) {
              window.Kakao.init(
                javascriptKey
              );
            }

            resolve(
              window.Kakao
            );
          };

        /*
          이미 script 태그가 존재하는지 확인
        */
        const existingScript =
          document.querySelector(
            'script[data-bannana-kakao-sdk="true"]'
          );

        if (
          existingScript
        ) {
          if (
            window.Kakao
          ) {
            initialize();

            return;
          }

          existingScript.addEventListener(
            "load",
            initialize,
            {
              once: true,
            }
          );

          existingScript.addEventListener(
            "error",
            () => {
              kakaoSdkPromise =
                null;

              reject(
                new Error(
                  "카카오 JavaScript SDK 로드에 실패했습니다."
                )
              );
            },
            {
              once: true,
            }
          );

          return;
        }

        /*
          Kakao SDK script 생성
        */
        const script =
          document.createElement(
            "script"
          );

        script.src =
          KAKAO_SDK_URL;

        script.integrity =
          KAKAO_SDK_INTEGRITY;

        script.crossOrigin =
          "anonymous";

        script.async = true;

        script.dataset.bannanaKakaoSdk =
          "true";

        script.onload =
          initialize;

        script.onerror =
          () => {
            kakaoSdkPromise =
              null;

            reject(
              new Error(
                "카카오 JavaScript SDK 로드에 실패했습니다."
              )
            );
          };

        document.head.appendChild(
          script
        );
      }
    );

  return kakaoSdkPromise;
}

/* =====================================================
   DEVICE
===================================================== */

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent
  );
}

function isIOSDevice() {
  return (
    /iPhone|iPad|iPod/i.test(
      navigator.userAgent
    ) ||
    (
      navigator.platform ===
        "MacIntel" &&
      navigator.maxTouchPoints >
        1
    )
  );
}

/* =====================================================
   LOCAL URL CHECK
===================================================== */

function isLocalUrl(url) {
  try {
    const parsedUrl =
      new URL(url);

    return (
      parsedUrl.hostname ===
        "localhost" ||
      parsedUrl.hostname ===
        "127.0.0.1"
    );
  } catch {
    return false;
  }
}

/* =====================================================
   SHARE ROOM PAGE
===================================================== */

function ShareRoomPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const { roomId } =
    useParams();

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    isSharingKakao,
    setIsSharingKakao,
  ] = useState(false);

  /* =====================================================
     ROOM DATA
  ===================================================== */

  const roomDraft =
    getRoomDraft();

  const stateRoom =
    location.state?.room;

  const room =
    useMemo(
      () => ({
        id:
          stateRoom?.id ??
          Number(roomId),

        title:
          stateRoom?.title ??
          roomDraft.title ??
          "반나나 약속방",

        meetingDate:
          stateRoom?.meetingDate ??
          roomDraft.meetingDate,

        meetingTime:
          stateRoom?.meetingTime ??
          roomDraft.meetingTime,

        transportMode:
          stateRoom?.transportMode ??
          roomDraft.transportMode ??
          "TRANSIT",

        preferredCategories:
          stateRoom
            ?.preferredCategories ??
          roomDraft
            .preferredCategories ??
          [],

        hostName:
          stateRoom?.host
            ?.nickname ??
          roomDraft.hostName,

        hostOrigin:
          stateRoom?.host
            ?.origin?.text ??
          roomDraft.hostOrigin,
      }),
      [
        roomDraft,
        roomId,
        stateRoom,
      ]
    );

  /* =====================================================
     PUBLIC APP URL

     VITE_PUBLIC_APP_URL이 있으면
     카카오톡 / QR / 문자 모두
     공개 주소를 사용한다.

     개발 중 설정이 없으면
     현재 localhost를 fallback으로 사용.
  ===================================================== */

  const appBaseUrl =
    useMemo(() => {
      const envUrl =
        import.meta.env
          .VITE_PUBLIC_APP_URL;

      if (
        envUrl &&
        envUrl.trim()
      ) {
        return envUrl
          .trim()
          .replace(
            /\/+$/,
            ""
          );
      }

      return window.location.origin;
    }, []);

  /* =====================================================
     INVITE LINK
  ===================================================== */

  const inviteLink =
    `${appBaseUrl}/join/${roomId}`;

  /* =====================================================
     DATE / TIME
  ===================================================== */

  const formatMeetingDateTime =
    () => {
      if (
        !room.meetingDate ||
        !room.meetingTime
      ) {
        return "날짜·시간 미정";
      }

      const date =
        new Date(
          `${room.meetingDate}T${room.meetingTime}`
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "날짜·시간 미정";
      }

      const dateText =
        new Intl.DateTimeFormat(
          "ko-KR",
          {
            month:
              "long",

            day:
              "numeric",

            weekday:
              "short",
          }
        ).format(date);

      const timeText =
        new Intl.DateTimeFormat(
          "ko-KR",
          {
            hour:
              "numeric",

            minute:
              "2-digit",

            hour12:
              true,
          }
        ).format(date);

      return `${dateText} · ${timeText}`;
    };

  /* =====================================================
     PLACE TYPE
  ===================================================== */

  const formatCategories =
    () => {
      const labels = {
        CAFE:
          "카페",

        RESTAURANT:
          "식당",

        EXHIBITION:
          "전시",

        SHOPPING:
          "쇼핑",

        PARK:
          "공원",
      };

      const categories =
        (
          room.preferredCategories ??
          []
        )
          .map(
            (category) => {
              const normalized =
                String(
                  category
                ).toUpperCase();

              return (
                labels[
                  normalized
                ] ??
                category
              );
            }
          )
          .filter(Boolean);

      if (
        categories.length ===
        0
      ) {
        return "-";
      }

      return categories.join(
        ", "
      );
    };

  /* =====================================================
     COPY
  ===================================================== */

  const handleCopy =
    async ({
      showFailureAlert = true,
    } = {}) => {
      try {
        await navigator.clipboard.writeText(
          inviteLink
        );

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(
              false
            );
          },
          1500
        );

        return true;
      } catch (error) {
        console.error(
          "링크 복사 실패:",
          error
        );

        if (
          showFailureAlert
        ) {
          alert(
            "링크 복사에 실패했습니다."
          );
        }

        return false;
      }
    };

  /* =====================================================
     KAKAO SHARE

     feed 템플릿 + 명시적 버튼 사용
  ===================================================== */

  const handleKakaoShare =
    async () => {
      if (
        isSharingKakao
      ) {
        return;
      }

      /*
        localhost 주소는 카카오톡에서
        실제 모바일 브라우저 이동 테스트가 불가능.

        사용자에게 원인을 명확하게 알려준다.
      */
      if (
        isLocalUrl(
          inviteLink
        )
      ) {
        alert(
          "현재 초대 링크가 localhost 주소라서 카카오톡에서 실제 참여 페이지로 이동할 수 없어요.\n\nVercel 등으로 배포한 뒤 .env의 VITE_PUBLIC_APP_URL에 공개 HTTPS 주소를 넣으면 정상적으로 테스트할 수 있습니다."
        );

        return;
      }

      try {
        setIsSharingKakao(
          true
        );

        const Kakao =
          await loadKakaoSdk();

        const meetingText =
          formatMeetingDateTime();

        const categoryText =
          formatCategories();

        /*
          카카오 기본 Feed 템플릿.

          content 영역 클릭과
          아래 버튼 모두 같은
          /join/{roomId}로 이동한다.
        */
        Kakao.Share.sendDefault({
          objectType:
            "feed",

          content: {
            title:
              `🍌 ${room.title}`,

            description:
              `${meetingText}\n` +
              `장소 유형: ${categoryText}\n` +
              `출발지를 입력하고 공평한 중간 장소를 찾아봐요!`,

            link: {
              mobileWebUrl:
                inviteLink,

              webUrl:
                inviteLink,
            },
          },

          buttons: [
            {
              title:
                "약속방 참여하기",

              link: {
                mobileWebUrl:
                  inviteLink,

                webUrl:
                  inviteLink,
              },
            },
          ],
        });
      } catch (error) {
        console.error(
          "카카오톡 공유 실패:",
          error
        );

        alert(
          "카카오톡 공유를 실행하지 못했습니다.\n\n카카오 Developers의 JavaScript SDK 도메인과 제품 링크 관리의 웹 도메인을 확인해주세요."
        );
      } finally {
        setIsSharingKakao(
          false
        );
      }
    };

  /* =====================================================
     SMS
  ===================================================== */

  const handleSmsShare =
    async () => {
      /*
        PC에서는 기본 문자 앱이 없는 경우가
        많으므로 링크를 대신 복사한다.
      */

      if (
        !isMobileDevice()
      ) {
        const success =
          await handleCopy({
            showFailureAlert:
              true,
          });

        if (success) {
          alert(
            "문자 공유는 휴대폰에서 사용할 수 있어요.\n대신 초대 링크를 복사했습니다."
          );
        }

        return;
      }

      const message =
        `🍌 반나나 약속방 초대\n` +
        `${room.title}\n` +
        `${formatMeetingDateTime()}\n\n` +
        `출발지를 입력하고 함께 공평한 중간 장소를 찾아봐요!\n` +
        `${inviteLink}`;

      const encodedMessage =
        encodeURIComponent(
          message
        );

      /*
        iOS / Android의
        SMS URL 형식 차이 대응
      */

      if (
        isIOSDevice()
      ) {
        window.location.href =
          `sms:&body=${encodedMessage}`;

        return;
      }

      window.location.href =
        `sms:?body=${encodedMessage}`;
    };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="share-page app-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="share-header">
        <button
          type="button"
          className="share-back-button"
          onClick={() =>
            navigate(-1)
          }
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <div className="share-title-row">
          <div className="share-title-icon">
            🔗
          </div>

          <div>
            <h1>
              초대 링크 공유
            </h1>

            <p>
              친구들에게 링크를 보내세요
            </p>
          </div>
        </div>

        <div className="share-progress">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className={`share-progress__bar ${
                  item <= 3
                    ? "share-progress__bar--active"
                    : ""
                }`}
              />
            )
          )}
        </div>

        <p className="share-step">
          3 / 4단계 · 초대 링크
        </p>
      </header>

      {/* =================================================
          CREATED
      ================================================= */}

      <section className="share-created-card">
        <div className="share-monkey">
          🐵
        </div>

        <h2>
          약속방이 생성됐어요! 🎉
        </h2>

        <p>
          링크를 공유하면 친구들이
          출발지를 입력할 수 있어요
        </p>
      </section>

      {/* =================================================
          ROOM INFORMATION
      ================================================= */}

      <section className="share-card">
        <h2 className="share-card-title">
          약속방 정보
        </h2>

        <div className="share-info-row">
          <span>
            🍌 약속방 이름
          </span>

          <strong>
            {room.title}
          </strong>
        </div>

        <div className="share-info-row">
          <span>
            🗓️ 날짜·시간
          </span>

          <strong>
            {formatMeetingDateTime()}
          </strong>
        </div>

        <div className="share-info-row">
          <span>
            🚇 이동수단
          </span>

          <strong>
            대중교통
          </strong>
        </div>

        <div className="share-info-row">
          <span>
            📍 장소 유형
          </span>

          <strong>
            {formatCategories()}
          </strong>
        </div>
      </section>

      {/* =================================================
          INVITE LINK
      ================================================= */}

      <section className="share-card">
        <h2 className="share-card-title">
          🔗 초대 링크
        </h2>

        <div className="share-link-row">
          <div className="share-link-text">
            {inviteLink}
          </div>

          <button
            type="button"
            className="share-copy-button"
            onClick={() =>
              handleCopy()
            }
          >
            {copied
              ? "완료 ✓"
              : "복사"}
          </button>
        </div>

        {/* QR */}

        <div className="share-qr-area">
          <div className="share-qr">
            <QRCode
              value={
                inviteLink
              }
              size={88}
            />
          </div>

          <div className="share-qr-description">
            <strong>
              QR 코드 스캔
            </strong>

            <p>
              카메라로 스캔하면
              바로 참여 페이지로
              이동해요
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          SHARE OPTIONS
      ================================================= */}

      <section className="share-buttons">
        <button
          type="button"
          className="share-option share-option--kakao"
          onClick={
            handleKakaoShare
          }
          disabled={
            isSharingKakao
          }
        >
          <span className="share-option__icon">
            💬
          </span>

          <strong>
            {isSharingKakao
              ? "여는 중..."
              : "카카오톡"}
          </strong>

          <small>
            초대장 공유하기
          </small>
        </button>

        <button
          type="button"
          className="share-option share-option--sms"
          onClick={
            handleSmsShare
          }
        >
          <span className="share-option__icon">
            📱
          </span>

          <strong>
            문자
          </strong>

          <small>
            메시지로 보내기
          </small>
        </button>
      </section>

      <p className="share-options-help">
        초대 링크나 QR 코드를 보내면
        친구가 바로 약속방에 참여할 수 있어요.
      </p>

      {/* =================================================
          BOTTOM
      ================================================= */}

      <footer className="share-bottom">
        <button
          type="button"
          className="share-primary-button"
          onClick={() =>
            navigate(
              `/room/${roomId}/status`
            )
          }
        >
          참여 현황 확인하기 →
        </button>
      </footer>
    </main>
  );
}

export default ShareRoomPage;