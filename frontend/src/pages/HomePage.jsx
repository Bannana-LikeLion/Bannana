import { useNavigate } from "react-router-dom";

import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="home app-container">
      <section className="home__brand">
        <div className="home__brand-line">
          <span className="home__logo-symbol">
            🍌
          </span>

          <span className="home__brand-name">
            반나나
          </span>
        </div>

        <h1 className="home__title">
          반나나
        </h1>
      </section>

      <section className="home__actions">
        <button
          type="button"
          className="home__button home__button--primary"
          onClick={() => navigate("/create")}
        >
          약속방 만들기
        </button>

        <button
          type="button"
          className="home__button home__button--secondary"
          onClick={() => navigate("/quick")}
        >
          바로 장소 찾기
        </button>
      </section>
    </main>
  );
}

export default HomePage;