import "./WeatherMapEffect.css";

/* =====================================================
   SIMPLE WEATHER

   반나나에서는
   맑음 / 비 / 눈
   세 가지 상태만 사용
===================================================== */

export function getSimpleWeather(
  weather
) {
  if (!weather) {
    return {
      key: "CLEAR",
      icon: "☀️",
      label: "맑음",
    };
  }

  const condition =
    String(
      weather.condition ??
        ""
    )
      .trim()
      .toUpperCase();

  const conditionText =
    String(
      weather.conditionText ??
        ""
    )
      .trim()
      .toLowerCase();

  const precipitationType =
    Number(
      weather.pty ??
        weather.precipitationType
    );

  /* ===================================================
     SNOW
  =================================================== */

  if (
    precipitationType === 2 ||
    precipitationType === 3 ||
    condition.includes("SNOW") ||
    condition.includes("SLEET") ||
    conditionText.includes("눈") ||
    conditionText.includes(
      "진눈깨비"
    )
  ) {
    return {
      key: "SNOW",
      icon: "🌨️",
      label: "눈",
    };
  }

  /* ===================================================
     RAIN
  =================================================== */

  if (
    precipitationType === 1 ||
    precipitationType === 4 ||
    condition.includes("RAIN") ||
    condition.includes(
      "SHOWER"
    ) ||
    conditionText.includes("비") ||
    conditionText.includes(
      "소나기"
    )
  ) {
    return {
      key: "RAIN",
      icon: "🌧️",
      label: "비",
    };
  }

  /* ===================================================
     CLEAR

     흐림 / 구름 많음도
     MVP에서는 맑음으로 통합
  =================================================== */

  return {
    key: "CLEAR",
    icon: "☀️",
    label: "맑음",
  };
}

/* =====================================================
   WEATHER EFFECT
===================================================== */

function WeatherMapEffect({
  mode,
}) {
  if (
    mode !== "RAIN" &&
    mode !== "SNOW"
  ) {
    return null;
  }

  return (
    <div
      className={`weather-map-effect weather-map-effect--${mode.toLowerCase()}`}
      aria-hidden="true"
    />
  );
}

export default WeatherMapEffect;