import { useState } from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import QRCode from "react-qr-code";

import {
  getMockRoom,
} from "../data/mockData";

import "./ShareRoomPage.css";

function ShareRoomPage() {
  const navigate = useNavigate();

  const location = useLocation();

  const { roomId } = useParams();

  const [copied, setCopied] =
    useState(false);

  /*
    /create에서 room을 state로 직접 넘겨준 경우
    해당 데이터를 우선 사용한다.

    새로고침하거나 state가 없는 경우에는
    roomStorage에 저장된 호스트 입력값을
    getMockRoom()이 읽어서 사용한다.
  */
  const room =
    location.state?.room ??
    getMockRoom();

  /*
    현재 Mock 개발용 초대 코드.

    실제 API 연결 후에는
    방 생성 API 응답으로 받은
    inviteCode를 사용하면 된다.
  */
  const inviteCode = "rgx92k";

  /*
    개발 중:
    http://localhost:5173/join/rgx92k

    배포 후:
    Vercel 주소 기준으로 자동 생성
  */
  const inviteLink =
    `${window.location.origin}/join/${inviteCode}`;

  /* ==========================================
     날짜 / 시간 표시
  ========================================== */

  const formatMeetingDateTime =
    () => {
      const date =
        new Date(
          room.meetingDateTime
        );

      const dateText =
        new Intl.DateTimeFormat(
          "ko-KR",
          {
            month: "long",
            day: "numeric",
            weekday: "short",
          }
        ).format(date);

      const timeText =
        new Intl.DateTimeFormat(
          "ko-KR",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        ).format(date);

      return `${dateText} · ${timeText}`;
    };

  /* ==========================================
     장소 유형 표시
  ========================================== */

  const formatCategories =
    () => {
      const labels = {
        CAFE: "카페",
        RESTAURANT: "식당",
        CULTURE: "문화",
      };

      return (
        room.preferredCategories ??
        []
      )
        .map(
          (category) =>
            labels[category] ??
            category
        )
        .filter(Boolean)
        .join(", ");
    };

  /* ==========================================
     링크 복사
  ========================================== */

  const handleCopy =
    async () => {
      try {
        await navigator.clipboard.writeText(
          inviteLink
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 1500);
      } catch (error) {
        console.error(
          "링크 복사 실패:",
          error
        );

        alert(
          "링크 복사에 실패했습니다."
        );
      }
    };

  /* ==========================================
     문자 공유
  ========================================== */

  const handleSmsShare =
    () => {
      const text =
        encodeURIComponent(
          `반나나 약속방에 참여해주세요!\n${inviteLink}`
        );

      window.location.href =
        `sms:?&body=${text}`;
    };

  return (
    <main className="share-page app-container">
      {/* ======================
          HEADER
      ====================== */}

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
              친구들에게 링크를
              보내세요
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

      {/* ======================
          CREATED
      ====================== */}

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

      {/* ======================
          ROOM INFORMATION
      ====================== */}

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

      {/* ======================
          INVITE LINK
      ====================== */}

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
            onClick={handleCopy}
          >
            {copied
              ? "완료"
              : "복사"}
          </button>
        </div>

        <div className="share-qr-area">
          <div className="share-qr">
            <QRCode
              value={inviteLink}
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

      {/* ======================
          SHARE OPTIONS
      ====================== */}

      <section className="share-buttons">
        <button
          type="button"
          className="share-option share-option--kakao"
        >
          <span className="share-option__icon">
            💬
          </span>

          <span>
            카카오톡
          </span>
        </button>

        <button
          type="button"
          className="share-option"
          onClick={
            handleSmsShare
          }
        >
          <span className="share-option__icon">
            📱
          </span>

          <span>
            문자
          </span>
        </button>

        <button
          type="button"
          className="share-option"
          onClick={handleCopy}
        >
          <span className="share-option__icon">
            📋
          </span>

          <span>
            링크 복사
          </span>
        </button>
      </section>

      {/* ======================
          BOTTOM
      ====================== */}

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