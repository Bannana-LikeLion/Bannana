import {
    useEffect,
    useRef,
    useState,
  } from "react";
  
  import "./KakaoMap.css";
  
  /* =====================================================
     SDK
  ===================================================== */
  
  let kakaoMapPromise =
    null;
  
  function loadKakaoMapSdk() {
    /* 이미 SDK 사용 가능 */
  
    if (
      window.kakao?.maps
    ) {
      return new Promise(
        (
          resolve
        ) => {
          window.kakao.maps.load(
            () =>
              resolve(
                window.kakao
              )
          );
        }
      );
    }
  
    if (
      kakaoMapPromise
    ) {
      return kakaoMapPromise;
    }
  
    const appKey =
      import.meta.env
        .VITE_KAKAO_JAVASCRIPT_KEY;
  
    if (!appKey) {
      return Promise.reject(
        new Error(
          "VITE_KAKAO_JAVASCRIPT_KEY가 없습니다."
        )
      );
    }
  
    kakaoMapPromise =
      new Promise(
        (
          resolve,
          reject
        ) => {
          const existingScript =
            document.querySelector(
              'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
            );
  
          const handleLoad =
            () => {
              if (
                !window.kakao
                  ?.maps
              ) {
                reject(
                  new Error(
                    "카카오맵 SDK를 불러오지 못했습니다."
                  )
                );
  
                return;
              }
  
              window.kakao.maps.load(
                () =>
                  resolve(
                    window.kakao
                  )
              );
            };
  
          if (
            existingScript
          ) {
            if (
              window.kakao?.maps
            ) {
              handleLoad();
  
              return;
            }
  
            existingScript.addEventListener(
              "load",
              handleLoad,
              {
                once: true,
              }
            );
  
            existingScript.addEventListener(
              "error",
              () => {
                reject(
                  new Error(
                    "카카오맵 SDK 로드에 실패했습니다."
                  )
                );
              },
              {
                once: true,
              }
            );
  
            return;
          }
  
          const script =
            document.createElement(
              "script"
            );
  
          script.src =
            `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
  
          script.async = true;
  
          script.onload =
            handleLoad;
  
          script.onerror =
            () => {
              reject(
                new Error(
                  "카카오맵 SDK 로드에 실패했습니다."
                )
              );
            };
  
          document.head.appendChild(
            script
          );
        }
      );
  
    return kakaoMapPromise;
  }
  
  /* =====================================================
     NUMBER
  ===================================================== */
  
  function toFiniteNumber(
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }
  
    const number =
      Number(value);
  
    return Number.isFinite(
      number
    )
      ? number
      : null;
  }
  
  /* =====================================================
     CUSTOM MARKER
  ===================================================== */
  
  function createMarkerElement(
    marker
  ) {
    const wrapper =
      document.createElement(
        "div"
      );
  
    wrapper.style.position =
      "relative";
  
    wrapper.style.display =
      "flex";
  
    wrapper.style.flexDirection =
      "column";
  
    wrapper.style.alignItems =
      "center";
  
    wrapper.style.transform =
      "translateY(-12px)";
  
    wrapper.style.pointerEvents =
      "auto";
  
    /* ===================================================
       CIRCLE
    =================================================== */
  
    const circle =
      document.createElement(
        "div"
      );
  
    const isMidpoint =
      marker.type ===
      "midpoint";
  
    const isPlace =
      marker.type ===
      "place";
  
    const markerSize =
      isMidpoint
        ? 58
        : isPlace
          ? 46
          : 52;
  
    circle.style.width =
      `${markerSize}px`;
  
    circle.style.height =
      `${markerSize}px`;
  
    circle.style.display =
      "flex";
  
    circle.style.alignItems =
      "center";
  
    circle.style.justifyContent =
      "center";
  
    circle.style.boxSizing =
      "border-box";
  
    circle.style.borderRadius =
      "50%";
  
    circle.style.backgroundColor =
      marker.color ??
      "#ffffff";
  
    circle.style.color =
      marker.textColor ??
      "#21190f";
  
    circle.style.border =
      "6px solid rgba(255, 255, 255, 0.97)";
  
    circle.style.boxShadow =
      "0 5px 14px rgba(33, 25, 15, 0.22)";
  
    circle.style.fontWeight =
      "900";
  
    circle.style.fontSize =
      isMidpoint
        ? "23px"
        : isPlace
          ? "14px"
          : "16px";
  
    circle.style.lineHeight =
      "1";
  
    circle.style.whiteSpace =
      "nowrap";
  
    circle.style.userSelect =
      "none";
  
    circle.textContent =
      marker.initial ??
      "?";
  
    wrapper.appendChild(
      circle
    );
  
    return wrapper;
  }
  
  /* =====================================================
     SINGLE MARKER
  ===================================================== */
  
  function createSingleMarkerElement({
    userName,
  }) {
    const wrapper =
      document.createElement(
        "div"
      );
  
    wrapper.style.width =
      "58px";
  
    wrapper.style.height =
      "58px";
  
    wrapper.style.display =
      "flex";
  
    wrapper.style.alignItems =
      "center";
  
    wrapper.style.justifyContent =
      "center";
  
    wrapper.style.boxSizing =
      "border-box";
  
    wrapper.style.borderRadius =
      "50%";
  
    wrapper.style.backgroundColor =
      "#7144df";
  
    wrapper.style.color =
      "#ffffff";
  
    wrapper.style.border =
      "6px solid #ffffff";
  
    wrapper.style.boxShadow =
      "0 6px 18px rgba(33, 25, 15, 0.22)";
  
    wrapper.style.fontSize =
      "19px";
  
    wrapper.style.fontWeight =
      "900";
  
    wrapper.style.transform =
      "translateY(-12px)";
  
    wrapper.textContent =
      userName
        ?.trim()
        ?.charAt(0) ??
      "📍";
  
    return wrapper;
  }
  
  /* =====================================================
     KAKAO MAP
  ===================================================== */
  
  function KakaoMap({
    lat = null,
    lng = null,
  
    placeName = "",
    userName = "",
  
    markers = [],
  
    height = 300,
  
    level = 5,
  
    focusLocation = null,
    focusLevel = 3,
  
    /*
      위치가 없을 때 사용할
      기본 지도 중심.
  
      기본값 = 서울시청 인근
    */
  
    defaultLat = 37.5665,
    defaultLng = 126.978,
  
    /*
      true:
      위치가 없으면 안내문 표시
  
      false:
      위치가 없어도 실제 지도만 표시
    */
  
    showEmptyMessage = true,
  
    emptyMessage =
      "위치 정보를 표시할 수 없어요",
  }) {
    const containerRef =
      useRef(null);
  
    const mapRef =
      useRef(null);
  
    const overlaysRef =
      useRef([]);
  
    const [
      isReady,
      setIsReady,
    ] = useState(false);
  
    const [
      error,
      setError,
    ] = useState("");
  
    /* =====================================================
       VALID MARKERS
    ===================================================== */
  
    const validMarkers =
      Array.isArray(
        markers
      )
        ? markers.filter(
            (
              marker
            ) =>
              toFiniteNumber(
                marker.lat
              ) !== null &&
              toFiniteNumber(
                marker.lng
              ) !== null
          )
        : [];
  
    const singleLat =
      toFiniteNumber(
        lat
      );
  
    const singleLng =
      toFiniteNumber(
        lng
      );
  
    const validDefaultLat =
      toFiniteNumber(
        defaultLat
      ) ??
      37.5665;
  
    const validDefaultLng =
      toFiniteNumber(
        defaultLng
      ) ??
      126.978;
  
    const hasSingleLocation =
      singleLat !== null &&
      singleLng !== null;
  
    const hasMarkerLocations =
      validMarkers.length >
      0;
  
    const hasAnyLocation =
      hasSingleLocation ||
      hasMarkerLocations;
  
    /* =====================================================
       INITIALIZE MAP
    ===================================================== */
  
    useEffect(() => {
      let cancelled =
        false;
  
      const initialize =
        async () => {
          try {
            setError("");
  
            const kakao =
              await loadKakaoMapSdk();
  
            if (
              cancelled ||
              !containerRef.current
            ) {
              return;
            }
  
            /*
              첫 화면 중심 결정
  
              1. markers
              2. single location
              3. default Seoul
            */
  
            let centerLat =
              validDefaultLat;
  
            let centerLng =
              validDefaultLng;
  
            if (
              validMarkers.length >
              0
            ) {
              centerLat =
                Number(
                  validMarkers[0]
                    .lat
                );
  
              centerLng =
                Number(
                  validMarkers[0]
                    .lng
                );
            } else if (
              hasSingleLocation
            ) {
              centerLat =
                singleLat;
  
              centerLng =
                singleLng;
            }
  
            const map =
              new kakao.maps.Map(
                containerRef.current,
                {
                  center:
                    new kakao.maps.LatLng(
                      centerLat,
                      centerLng
                    ),
  
                  level,
                }
              );
  
            mapRef.current =
              map;
  
            /*
              부모 레이아웃이 완전히 그려진 뒤
              카카오맵 크기 재계산
            */
  
            window.requestAnimationFrame(
              () => {
                map.relayout();
              }
            );
  
            setIsReady(
              true
            );
          } catch (
            initializeError
          ) {
            console.error(
              "카카오맵 초기화 실패:",
              initializeError
            );
  
            if (
              !cancelled
            ) {
              setError(
                initializeError.message ||
                  "지도를 불러오지 못했습니다."
              );
            }
          }
        };
  
      initialize();
  
      return () => {
        cancelled = true;
  
        overlaysRef.current.forEach(
          (
            overlay
          ) => {
            overlay.setMap(
              null
            );
          }
        );
  
        overlaysRef.current =
          [];
  
        mapRef.current =
          null;
      };
    }, []);
  
    /* =====================================================
       DRAW MARKERS
    ===================================================== */
  
    useEffect(() => {
      if (
        !isReady ||
        !mapRef.current ||
        !window.kakao?.maps
      ) {
        return;
      }
  
      const map =
        mapRef.current;
  
      const kakao =
        window.kakao;
  
      /* 기존 overlay 제거 */
  
      overlaysRef.current.forEach(
        (
          overlay
        ) => {
          overlay.setMap(
            null
          );
        }
      );
  
      overlaysRef.current =
        [];
  
      /* =================================================
         MULTI MARKERS
      ================================================= */
  
      if (
        validMarkers.length >
        0
      ) {
        const bounds =
          new kakao.maps.LatLngBounds();
  
        validMarkers.forEach(
          (
            marker,
            index
          ) => {
            const markerLat =
              Number(
                marker.lat
              );
  
            const markerLng =
              Number(
                marker.lng
              );
  
            const position =
              new kakao.maps.LatLng(
                markerLat,
                markerLng
              );
  
            bounds.extend(
              position
            );
  
            const element =
              createMarkerElement(
                marker
              );
  
            const overlay =
              new kakao.maps.CustomOverlay(
                {
                  map,
  
                  position,
  
                  content:
                    element,
  
                  xAnchor: 0.5,
  
                  yAnchor: 0.5,
  
                  zIndex:
                    marker.zIndex ??
                    50 +
                      index,
                }
              );
  
            overlaysRef.current.push(
              overlay
            );
          }
        );
  
        /*
          2개 이상 → 모든 마커가 보이도록 bounds
        */
  
        if (
          validMarkers.length >
            1 &&
          !focusLocation
        ) {
          map.setBounds(
            bounds,
            45,
            45,
            45,
            45
          );
        }
  
        /*
          1개만 있고 focusLocation이 없다면
          해당 마커 중심으로 이동
        */
  
        if (
          validMarkers.length ===
            1 &&
          !focusLocation
        ) {
          const onlyMarker =
            validMarkers[0];
  
          map.setCenter(
            new kakao.maps.LatLng(
              Number(
                onlyMarker.lat
              ),
  
              Number(
                onlyMarker.lng
              )
            )
          );
  
          map.setLevel(
            level
          );
        }
  
        return;
      }
  
      /* =================================================
         SINGLE LOCATION
      ================================================= */
  
      if (
        hasSingleLocation
      ) {
        const position =
          new kakao.maps.LatLng(
            singleLat,
            singleLng
          );
  
        map.setCenter(
          position
        );
  
        map.setLevel(
          level
        );
  
        const element =
          createSingleMarkerElement(
            {
              userName,
              placeName,
            }
          );
  
        const overlay =
          new kakao.maps.CustomOverlay(
            {
              map,
  
              position,
  
              content:
                element,
  
              xAnchor: 0.5,
  
              yAnchor: 0.5,
  
              zIndex: 100,
            }
          );
  
        overlaysRef.current.push(
          overlay
        );
  
        return;
      }
  
      /* =================================================
         NO LOCATION
  
         ★ 마커가 하나도 없으면
           실제 지도는 유지하고
           기본 서울 위치로 돌아간다.
      ================================================= */
  
      map.setCenter(
        new kakao.maps.LatLng(
          validDefaultLat,
          validDefaultLng
        )
      );
  
      map.setLevel(
        level
      );
    }, [
      isReady,
  
      markers,
  
      lat,
      lng,
  
      placeName,
      userName,
  
      level,
  
      defaultLat,
      defaultLng,
    ]);
  
    /* =====================================================
       FOCUS
    ===================================================== */
  
    useEffect(() => {
      if (
        !isReady ||
        !mapRef.current ||
        !focusLocation ||
        !window.kakao?.maps
      ) {
        return;
      }
  
      const focusLat =
        toFiniteNumber(
          focusLocation.lat
        );
  
      const focusLng =
        toFiniteNumber(
          focusLocation.lng
        );
  
      if (
        focusLat === null ||
        focusLng === null
      ) {
        return;
      }
  
      const position =
        new window.kakao.maps.LatLng(
          focusLat,
          focusLng
        );
  
      mapRef.current.panTo(
        position
      );
  
      mapRef.current.setLevel(
        focusLevel
      );
    }, [
      isReady,
  
      focusLocation,
  
      focusLevel,
    ]);
  
    /* =====================================================
       RESIZE
    ===================================================== */
  
    useEffect(() => {
      if (
        !isReady ||
        !mapRef.current
      ) {
        return;
      }
  
      const handleResize =
        () => {
          mapRef.current.relayout();
        };
  
      window.addEventListener(
        "resize",
        handleResize
      );
  
      return () => {
        window.removeEventListener(
          "resize",
          handleResize
        );
      };
    }, [isReady]);
  
    /* =====================================================
       RENDER
    ===================================================== */
  
    return (
      <div
        className="kakao-map"
        style={{
          position:
            "relative",
  
          width: "100%",
  
          height:
            typeof height ===
            "number"
              ? `${height}px`
              : height,
  
          overflow:
            "hidden",
  
          borderRadius:
            "inherit",
  
          background:
            "#eeeade",
        }}
      >
        {/* 실제 지도 */}
  
        <div
          ref={
            containerRef
          }
          style={{
            width:
              "100%",
  
            height:
              "100%",
          }}
        />
  
        {/* ===============================================
            EMPTY MESSAGE
  
            showEmptyMessage=false이면
            이 레이어 자체를 만들지 않는다.
        =============================================== */}
  
        {!hasAnyLocation &&
          !error &&
          showEmptyMessage && (
            <div
              style={{
                position:
                  "absolute",
  
                inset: 0,
  
                display:
                  "flex",
  
                alignItems:
                  "center",
  
                justifyContent:
                  "center",
  
                padding:
                  "24px",
  
                background:
                  "rgba(243, 240, 231, 0.88)",
  
                color:
                  "#9a8056",
  
                textAlign:
                  "center",
  
                fontSize:
                  "12px",
  
                pointerEvents:
                  "none",
              }}
            >
              {
                emptyMessage
              }
            </div>
          )}
  
        {/* ERROR */}
  
        {error && (
          <div
            style={{
              position:
                "absolute",
  
              inset: 0,
  
              display:
                "flex",
  
              alignItems:
                "center",
  
              justifyContent:
                "center",
  
              padding:
                "24px",
  
              background:
                "#f3f0e7",
  
              color:
                "#9a8056",
  
              textAlign:
                "center",
  
              fontSize:
                "12px",
            }}
          >
            {
              error
            }
          </div>
        )}
      </div>
    );
  }
  
  export default KakaoMap;