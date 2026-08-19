import {
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  
  import {
    loadKakaoMapSdk,
  } from "../../api/kakaoMap";
  
  import "./KakaoMap.css";
  
  const DEFAULT_LAT = 37.5665;
  const DEFAULT_LNG = 126.978;
  
  function KakaoMap({
    lat,
    lng,
    placeName = "",
    userName = "",
  
    /*
      여러 사람의 위치를 표시할 때 사용
    */
    markers = [],
  
    /*
      일반 단일 위치 지도 확대 수준
    */
    level = 4,
  
    /*
      참여자 카드 등을 눌렀을 때
      특정 위치로 이동하기 위한 값
  
      {
        lat,
        lng,
        requestId
      }
    */
    focusLocation = null,
  
    /*
      특정 사람을 눌렀을 때
      얼마나 확대할지
      Kakao Map은 숫자가 작을수록 확대됨
    */
    focusLevel = 3,
  
    height = 190,
  
    className = "",
  
    emptyMessage =
      "출발지를 검색하고 선택해주세요",
  }) {
    const mapContainerRef =
      useRef(null);
  
    const mapRef =
      useRef(null);
  
    const overlaysRef =
      useRef([]);
  
    const [
      isLoading,
      setIsLoading,
    ] = useState(true);
  
    const [
      isMapReady,
      setIsMapReady,
    ] = useState(false);
  
    const [
      error,
      setError,
    ] = useState("");
  
    /* =====================================================
       SINGLE LOCATION CHECK
    ===================================================== */
  
    const hasSingleLocation =
      Number.isFinite(lat) &&
      Number.isFinite(lng);
  
    /* =====================================================
       MARKER NORMALIZE
  
       1. markers 배열이 있으면 여러 마커
       2. 없으면 lat/lng 하나만 표시
    ===================================================== */
  
    const normalizedMarkers =
      useMemo(() => {
        if (
          Array.isArray(markers) &&
          markers.length > 0
        ) {
          return markers.filter(
            (marker) =>
              Number.isFinite(
                marker.lat
              ) &&
              Number.isFinite(
                marker.lng
              )
          );
        }
  
        if (hasSingleLocation) {
          const label =
            userName ||
            placeName ||
            "선택 위치";
  
          return [
            {
              id: "selected-location",
  
              lat,
              lng,
  
              label,
  
              initial:
                label.charAt(0),
  
              color: "#7144df",
  
              textColor:
                "#ffffff",
            },
          ];
        }
  
        return [];
      }, [
        markers,
        hasSingleLocation,
        lat,
        lng,
        placeName,
        userName,
      ]);
  
    /* =====================================================
       MAP INITIALIZE
    ===================================================== */
  
    useEffect(() => {
      let cancelled =
        false;
  
      const initializeMap =
        async () => {
          try {
            setIsLoading(true);
            setError("");
  
            const kakao =
              await loadKakaoMapSdk();
  
            if (
              cancelled ||
              !mapContainerRef.current
            ) {
              return;
            }
  
            const defaultCenter =
              new kakao.maps.LatLng(
                DEFAULT_LAT,
                DEFAULT_LNG
              );
  
            const map =
              new kakao.maps.Map(
                mapContainerRef.current,
                {
                  center:
                    defaultCenter,
  
                  level: 8,
                }
              );
  
            mapRef.current =
              map;
  
            /*
              부모 요소 크기에 맞춰
              지도를 다시 계산
            */
            requestAnimationFrame(
              () => {
                map.relayout();
              }
            );
  
            if (!cancelled) {
              setIsMapReady(
                true
              );
  
              setIsLoading(
                false
              );
            }
          } catch (
            initializeError
          ) {
            console.error(
              "카카오 지도 생성 오류:",
              initializeError
            );
  
            if (!cancelled) {
              setIsLoading(
                false
              );
  
              setError(
                initializeError.message ||
                  "지도를 불러오지 못했습니다."
              );
            }
          }
        };
  
      initializeMap();
  
      return () => {
        cancelled = true;
  
        overlaysRef.current.forEach(
          (overlay) => {
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
       MARKER UPDATE
    ===================================================== */
  
    useEffect(() => {
      if (
        !isMapReady ||
        !mapRef.current ||
        !window.kakao?.maps
      ) {
        return;
      }
  
      const kakao =
        window.kakao;
  
      const map =
        mapRef.current;
  
      /*
        기존 마커 삭제
      */
      overlaysRef.current.forEach(
        (overlay) => {
          overlay.setMap(null);
        }
      );
  
      overlaysRef.current =
        [];
  
      /*
        마커가 없는 경우
        서울 기본 위치
      */
      if (
        normalizedMarkers.length ===
        0
      ) {
        const defaultCenter =
          new kakao.maps.LatLng(
            DEFAULT_LAT,
            DEFAULT_LNG
          );
  
        map.setCenter(
          defaultCenter
        );
  
        map.setLevel(8);
  
        return;
      }
  
      const bounds =
        new kakao.maps.LatLngBounds();
  
      /* =================================================
         MARKER CREATE
      ================================================= */
  
      normalizedMarkers.forEach(
        (marker) => {
          const position =
            new kakao.maps.LatLng(
              marker.lat,
              marker.lng
            );
  
          bounds.extend(
            position
          );
  
          /*
            기존 디자인처럼
            동그란 사람 마커를 직접 만듦
          */
          const markerElement =
            document.createElement(
              "div"
            );
  
          markerElement.className =
            "kakao-map__participant-marker";
  
          markerElement.style.backgroundColor =
            marker.color ||
            "#7144df";
  
          markerElement.style.color =
            marker.textColor ||
            "#ffffff";
  
          markerElement.textContent =
            marker.initial ||
            marker.label?.charAt(
              0
            ) ||
            "●";
  
          markerElement.title =
            marker.label || "";
  
          const overlay =
            new kakao.maps.CustomOverlay(
              {
                map,
  
                position,
  
                content:
                  markerElement,
  
                xAnchor: 0.5,
  
                yAnchor: 0.5,
  
                zIndex: 5,
              }
            );
  
          overlaysRef.current.push(
            overlay
          );
        }
      );
  
      /* =================================================
         INITIAL MAP POSITION
      ================================================= */
  
      if (
        normalizedMarkers.length ===
        1
      ) {
        const onlyMarker =
          normalizedMarkers[0];
  
        const position =
          new kakao.maps.LatLng(
            onlyMarker.lat,
            onlyMarker.lng
          );
  
        map.setCenter(
          position
        );
  
        map.setLevel(
          level
        );
  
        return;
      }
  
      /*
        여러 명이면 모든 참여자가
        지도 안에 들어오도록 자동 조절
      */
      map.setBounds(
        bounds,
        45,
        35,
        55,
        35
      );
    }, [
      normalizedMarkers,
      isMapReady,
      level,
    ]);
  
    /* =====================================================
       FOCUS LOCATION
  
       참여자 카드를 눌렀을 때
       해당 참여자의 위치로 이동 + 확대
    ===================================================== */
  
    useEffect(() => {
      if (
        !isMapReady ||
        !mapRef.current ||
        !window.kakao?.maps ||
        !focusLocation
      ) {
        return;
      }
  
      const focusLat =
        Number(
          focusLocation.lat
        );
  
      const focusLng =
        Number(
          focusLocation.lng
        );
  
      if (
        !Number.isFinite(
          focusLat
        ) ||
        !Number.isFinite(
          focusLng
        )
      ) {
        return;
      }
  
      const kakao =
        window.kakao;
  
      const map =
        mapRef.current;
  
      const focusPosition =
        new kakao.maps.LatLng(
          focusLat,
          focusLng
        );
  
      /*
        선택한 사람 위치로
        부드럽게 지도 이동
      */
      map.panTo(
        focusPosition
      );
  
      /*
        해당 위치 기준으로 확대
      */
      map.setLevel(
        focusLevel,
        {
          anchor:
            focusPosition,
  
          animate: true,
        }
      );
    }, [
      focusLocation,
      focusLevel,
      isMapReady,
    ]);
  
    /* =====================================================
       RENDER
    ===================================================== */
  
    return (
      <section
        className={`kakao-map ${className}`}
        style={{
          height,
        }}
      >
        <div
          ref={
            mapContainerRef
          }
          className="kakao-map__canvas"
        />
  
        {isLoading && (
          <div className="kakao-map__state">
            <span>
              🗺️
            </span>
  
            <p>
              지도를 불러오는 중이에요
            </p>
          </div>
        )}
  
        {error && (
          <div className="kakao-map__state kakao-map__state--error">
            <span>
              ⚠️
            </span>
  
            <p>
              {error}
            </p>
          </div>
        )}
  
        {!isLoading &&
          !error &&
          normalizedMarkers
            .length === 0 && (
            <div className="kakao-map__guide">
              <span>
                📍
              </span>
  
              {emptyMessage}
            </div>
          )}
  
        {/*
          CreateRoomPage처럼
          단일 위치를 보여줄 때만
          아래 장소 라벨 표시
        */}
  
        {markers.length === 0 &&
          hasSingleLocation &&
          placeName && (
            <div className="kakao-map__label">
              <span className="kakao-map__dot" />
  
              {userName && (
                <strong>
                  {userName}
                </strong>
              )}
  
              <span className="kakao-map__place">
                {userName
                  ? `· ${placeName}`
                  : placeName}
              </span>
            </div>
          )}
      </section>
    );
  }
  
  export default KakaoMap;