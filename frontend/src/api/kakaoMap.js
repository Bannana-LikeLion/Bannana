let kakaoSdkPromise = null;

export function loadKakaoMapSdk() {
  const appKey =
    import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;

  if (!appKey) {
    return Promise.reject(
      new Error(
        "카카오 JavaScript 키가 설정되어 있지 않습니다."
      )
    );
  }

  // 이미 SDK가 로드되어 있다면 다시 불러오지 않음
  if (window.kakao?.maps?.services) {
    return Promise.resolve(window.kakao);
  }

  // 이미 로딩 중이라면 같은 Promise 사용
  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise = new Promise(
    (resolve, reject) => {
      const existingScript =
        document.querySelector(
          'script[data-kakao-map-sdk="true"]'
        );

      const handleLoad = () => {
        if (!window.kakao?.maps) {
          kakaoSdkPromise = null;

          reject(
            new Error(
              "카카오 지도 SDK를 불러오지 못했습니다."
            )
          );

          return;
        }

        window.kakao.maps.load(() => {
          if (
            !window.kakao?.maps?.services
          ) {
            kakaoSdkPromise = null;

            reject(
              new Error(
                "카카오 장소 검색 서비스를 불러오지 못했습니다."
              )
            );

            return;
          }

          resolve(window.kakao);
        });
      };

      // 혹시 이미 script 태그가 존재하면 재사용
      if (existingScript) {
        existingScript.addEventListener(
          "load",
          handleLoad,
          { once: true }
        );

        return;
      }

      const script =
        document.createElement("script");

      script.dataset.kakaoMapSdk =
        "true";

      script.src =
        `https://dapi.kakao.com/v2/maps/sdk.js` +
        `?appkey=${appKey}` +
        `&autoload=false` +
        `&libraries=services`;

      script.async = true;

      script.onload = handleLoad;

      script.onerror = () => {
        kakaoSdkPromise = null;

        reject(
          new Error(
            "카카오 지도 SDK 로딩 중 오류가 발생했습니다."
          )
        );
      };

      document.head.appendChild(script);
    }
  );

  return kakaoSdkPromise;
}