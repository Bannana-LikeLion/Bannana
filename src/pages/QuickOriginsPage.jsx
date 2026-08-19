import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import KakaoMap from "../components/map/KakaoMap";

import "./QuickOriginsPage.css";

/* =====================================================
   STORAGE
===================================================== */

const QUICK_SETTINGS_STORAGE_KEY =
  "bannana-quick-settings";

const QUICK_PARTICIPANTS_STORAGE_KEY =
  "bannana-quick-participants";

const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 6;

/* =====================================================
   PARTICIPANT COLORS
===================================================== */

const PARTICIPANT_COLORS = [
  {
    color: "#f0c936",
    textColor: "#21190f",
  },

  {
    color: "#e87570",
    textColor: "#21190f",
  },

  {
    color: "#79cec5",
    textColor: "#21190f",
  },

  {
    color: "#7144df",
    textColor: "#ffffff",
  },

  {
    color: "#84a9d8",
    textColor: "#21190f",
  },

  {
    color: "#d99ac5",
    textColor: "#21190f",
  },
];

/* =====================================================
   COORDINATE
===================================================== */

function hasCoordinateValue(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  return Number.isFinite(
    Number(value)
  );
}

function hasSelectedOrigin(
  participant
) {
  return (
    hasCoordinateValue(
      participant.originLat
    ) &&
    hasCoordinateValue(
      participant.originLng
    )
  );
}

/* =====================================================
   KAKAO PLACE SDK
===================================================== */

let kakaoPlacesPromise =
  null;

function loadKakaoPlacesSdk() {
  /* 이미 services까지 준비된 경우 */

  if (
    window.kakao
      ?.maps
      ?.services
  ) {
    return Promise.resolve(
      window.kakao
    );
  }

  /*
    Kakao Maps 객체는 있는데
    autoload=false 로 아직 load가 끝나지 않은 경우
  */

  if (
    window.kakao?.maps
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        window.kakao.maps.load(
          () => {
            if (
              window.kakao
                ?.maps
                ?.services
            ) {
              resolve(
                window.kakao
              );

              return;
            }

            reject(
              new Error(
                "카카오 장소 검색 서비스를 불러오지 못했습니다."
              )
            );
          }
        );
      }
    );
  }

  if (
    kakaoPlacesPromise
  ) {
    return kakaoPlacesPromise;
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

  kakaoPlacesPromise =
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
              () => {
                if (
                  !window.kakao
                    ?.maps
                    ?.services
                ) {
                  reject(
                    new Error(
                      "카카오 장소 검색 서비스를 불러오지 못했습니다."
                    )
                  );

                  return;
                }

                resolve(
                  window.kakao
                );
              }
            );
          };

        /* 이미 같은 SDK script가 있는 경우 */

        if (
          existingScript
        ) {
          if (
            window.kakao
              ?.maps
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

        /* 최초 SDK 로드 */

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

  return kakaoPlacesPromise;
}

/* =====================================================
   PARTICIPANT
===================================================== */

function createParticipant(
  id
) {
  return {
    id,

    nickname: "",

    originText: "",

    originAddress: "",

    originLat: null,

    originLng: null,
  };
}

/* =====================================================
   READ SETTINGS
===================================================== */

function readQuickSettings() {
  try {
    const saved =
      sessionStorage.getItem(
        QUICK_SETTINGS_STORAGE_KEY
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(
      saved
    );
  } catch (error) {
    console.error(
      "Quick 설정 읽기 실패:",
      error
    );

    return null;
  }
}

/* =====================================================
   READ PARTICIPANTS
===================================================== */

function readSavedParticipants() {
  try {
    const saved =
      sessionStorage.getItem(
        QUICK_PARTICIPANTS_STORAGE_KEY
      );

    if (!saved) {
      return null;
    }

    const parsed =
      JSON.parse(saved);

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return null;
    }

    return parsed
      .slice(
        0,
        MAX_PARTICIPANTS
      )
      .map(
        (
          participant,
          index
        ) => {
          const hasLat =
            hasCoordinateValue(
              participant.originLat
            );

          const hasLng =
            hasCoordinateValue(
              participant.originLng
            );

          return {
            id:
              participant.id ??
              index + 1,

            nickname:
              participant.nickname ??
              "",

            originText:
              participant.originText ??
              "",

            originAddress:
              participant.originAddress ??
              "",

            originLat:
              hasLat
                ? Number(
                    participant.originLat
                  )
                : null,

            originLng:
              hasLng
                ? Number(
                    participant.originLng
                  )
                : null,
          };
        }
      );
  } catch (error) {
    console.error(
      "Quick 참여자 정보 읽기 실패:",
      error
    );

    return null;
  }
}

/* =====================================================
   PAGE
===================================================== */

function QuickOriginsPage() {
  const navigate =
    useNavigate();

  /* =====================================================
     DATA
  ===================================================== */

  const settings =
    useMemo(
      () =>
        readQuickSettings(),
      []
    );

  const savedParticipants =
    useMemo(
      () =>
        readSavedParticipants(),
      []
    );

  /* =====================================================
     STATE
  ===================================================== */

  const [
    participants,
    setParticipants,
  ] = useState(() => {
    if (
      savedParticipants &&
      savedParticipants.length >=
        MIN_PARTICIPANTS
    ) {
      return savedParticipants;
    }

    return [
      createParticipant(1),
      createParticipant(2),
    ];
  });

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    searchResults,
    setSearchResults,
  ] = useState({});

  const [
    searchingId,
    setSearchingId,
  ] = useState(null);

  const [
    focusLocation,
    setFocusLocation,
  ] = useState(null);

  /* =====================================================
     PARTICIPANT CHANGE
  ===================================================== */

  const handleParticipantChange = (
    id,
    field,
    value
  ) => {
    setParticipants(
      (
        previous
      ) =>
        previous.map(
          (
            participant
          ) => {
            if (
              participant.id !==
              id
            ) {
              return participant;
            }

            /* NAME */

            if (
              field ===
              "nickname"
            ) {
              return {
                ...participant,

                nickname:
                  value,
              };
            }

            /* ORIGIN */

            if (
              field ===
              "originText"
            ) {
              /*
                사용자가 검색 결과에서
                장소를 선택한 뒤

                검색어를 직접 수정하면
                기존 장소 선택은 무효.
              */

              return {
                ...participant,

                originText:
                  value,

                originAddress:
                  "",

                originLat:
                  null,

                originLng:
                  null,
              };
            }

            return participant;
          }
        )
    );

    /* 해당 필드 오류 제거 */

    setErrors(
      (
        previous
      ) => ({
        ...previous,

        [`${id}-${field}`]:
          "",

        [`${id}-origin`]:
          "",
      })
    );

    /* 검색어 수정 시 기존 검색결과 제거 */

    if (
      field ===
      "originText"
    ) {
      setSearchResults(
        (
          previous
        ) => ({
          ...previous,

          [id]: [],
        })
      );

      /*
        현재 focus 중인 출발지를
        다시 수정한 경우 focus 해제
      */

      setFocusLocation(
        (
          previous
        ) =>
          previous?.id ===
          id
            ? null
            : previous
      );
    }
  };

  /* =====================================================
     SEARCH ORIGIN
  ===================================================== */

  const handleSearchOrigin =
    async (
      participantId
    ) => {
      const participant =
        participants.find(
          (
            item
          ) =>
            item.id ===
            participantId
        );

      const keyword =
        participant
          ?.originText
          ?.trim();

      if (!keyword) {
        setErrors(
          (
            previous
          ) => ({
            ...previous,

            [`${participantId}-originText`]:
              "출발지를 입력해주세요.",
          })
        );

        return;
      }

      try {
        setSearchingId(
          participantId
        );

        setErrors(
          (
            previous
          ) => ({
            ...previous,

            [`${participantId}-originText`]:
              "",

            [`${participantId}-origin`]:
              "",
          })
        );

        const kakao =
          await loadKakaoPlacesSdk();

        const placesService =
          new kakao.maps.services.Places();

        placesService.keywordSearch(
          keyword,

          (
            data,
            status
          ) => {
            setSearchingId(
              null
            );

            /* ==========================================
               SUCCESS
            ========================================== */

            if (
              status ===
              kakao.maps.services.Status.OK
            ) {
              const normalized =
                data
                  .slice(
                    0,
                    5
                  )
                  .map(
                    (
                      place
                    ) => ({
                      id:
                        place.id,

                      name:
                        place.place_name,

                      address:
                        place.address_name,

                      roadAddress:
                        place.road_address_name,

                      category:
                        place.category_name,

                      lat:
                        Number(
                          place.y
                        ),

                      lng:
                        Number(
                          place.x
                        ),
                    })
                  );

              setSearchResults(
                (
                  previous
                ) => ({
                  ...previous,

                  [participantId]:
                    normalized,
                })
              );

              return;
            }

            /* ==========================================
               ZERO RESULT
            ========================================== */

            if (
              status ===
              kakao.maps.services.Status.ZERO_RESULT
            ) {
              setSearchResults(
                (
                  previous
                ) => ({
                  ...previous,

                  [participantId]:
                    [],
                })
              );

              setErrors(
                (
                  previous
                ) => ({
                  ...previous,

                  [`${participantId}-origin`]:
                    "검색 결과가 없습니다. 다른 검색어를 입력해주세요.",
                })
              );

              return;
            }

            /* ==========================================
               ERROR
            ========================================== */

            setSearchResults(
              (
                previous
              ) => ({
                ...previous,

                [participantId]:
                  [],
              })
            );

            setErrors(
              (
                previous
              ) => ({
                ...previous,

                [`${participantId}-origin`]:
                  "장소 검색에 실패했습니다.",
              })
            );
          }
        );
      } catch (error) {
        console.error(
          "출발지 검색 실패:",
          error
        );

        setSearchingId(
          null
        );

        setErrors(
          (
            previous
          ) => ({
            ...previous,

            [`${participantId}-origin`]:
              error.message ||
              "장소 검색에 실패했습니다.",
          })
        );
      }
    };

  /* =====================================================
     ENTER
  ===================================================== */

  const handleOriginKeyDown = (
    event,
    participantId
  ) => {
    if (
      event.key !==
      "Enter"
    ) {
      return;
    }

    event.preventDefault();

    handleSearchOrigin(
      participantId
    );
  };

  /* =====================================================
     SELECT ORIGIN
  ===================================================== */

  const handleSelectOrigin = (
    participantId,
    place
  ) => {
    setParticipants(
      (
        previous
      ) =>
        previous.map(
          (
            participant
          ) =>
            participant.id ===
            participantId
              ? {
                  ...participant,

                  originText:
                    place.name,

                  originAddress:
                    place.roadAddress ||
                    place.address,

                  originLat:
                    Number(
                      place.lat
                    ),

                  originLng:
                    Number(
                      place.lng
                    ),
                }
              : participant
        )
    );

    setSearchResults(
      (
        previous
      ) => ({
        ...previous,

        [participantId]:
          [],
      })
    );

    setErrors(
      (
        previous
      ) => ({
        ...previous,

        [`${participantId}-originText`]:
          "",

        [`${participantId}-origin`]:
          "",
      })
    );

    /*
      선택한 장소로 지도 이동
    */

    setFocusLocation({
      id:
        participantId,

      lat:
        Number(
          place.lat
        ),

      lng:
        Number(
          place.lng
        ),

      requestId:
        Date.now(),
    });
  };

  /* =====================================================
     ADD PARTICIPANT
  ===================================================== */

  const handleAddParticipant =
    () => {
      if (
        participants.length >=
        MAX_PARTICIPANTS
      ) {
        return;
      }

      const maxId =
        Math.max(
          0,

          ...participants.map(
            (
              participant
            ) =>
              Number(
                participant.id
              ) || 0
          )
        );

      setParticipants(
        (
          previous
        ) => [
          ...previous,

          createParticipant(
            maxId + 1
          ),
        ]
      );
    };

  /* =====================================================
     REMOVE PARTICIPANT
  ===================================================== */

  const handleRemoveParticipant = (
    id
  ) => {
    if (
      participants.length <=
      MIN_PARTICIPANTS
    ) {
      return;
    }

    setParticipants(
      (
        previous
      ) =>
        previous.filter(
          (
            participant
          ) =>
            participant.id !==
            id
        )
    );

    setSearchResults(
      (
        previous
      ) => {
        const next = {
          ...previous,
        };

        delete next[id];

        return next;
      }
    );

    setErrors(
      (
        previous
      ) => {
        const next = {
          ...previous,
        };

        delete next[
          `${id}-nickname`
        ];

        delete next[
          `${id}-originText`
        ];

        delete next[
          `${id}-origin`
        ];

        return next;
      }
    );

    setFocusLocation(
      (
        previous
      ) =>
        previous?.id ===
        id
          ? null
          : previous
    );
  };

  /* =====================================================
     VALIDATE
  ===================================================== */

  const validateParticipants =
    () => {
      const nextErrors = {};

      participants.forEach(
        (
          participant
        ) => {
          /* NAME */

          if (
            !participant.nickname
              .trim()
          ) {
            nextErrors[
              `${participant.id}-nickname`
            ] =
              "이름을 입력해주세요.";
          }

          /* ORIGIN TEXT */

          if (
            !participant.originText
              .trim()
          ) {
            nextErrors[
              `${participant.id}-originText`
            ] =
              "출발지를 입력해주세요.";

            return;
          }

          /* REAL ORIGIN */

          if (
            !hasSelectedOrigin(
              participant
            )
          ) {
            nextErrors[
              `${participant.id}-origin`
            ] =
              "검색 결과에서 실제 출발지를 선택해주세요.";
          }
        }
      );

      setErrors(
        nextErrors
      );

      return (
        Object.keys(
          nextErrors
        ).length === 0
      );
    };

  /* =====================================================
     FIND MIDPOINT
  ===================================================== */

  const handleFindMidpoint =
    () => {
      /*
        Step 1 설정이 없으면
        다시 빠른 장소 찾기 첫 화면으로
      */

      if (!settings) {
        navigate(
          "/quick"
        );

        return;
      }

      if (
        !validateParticipants()
      ) {
        return;
      }

      const normalizedParticipants =
        participants.map(
          (
            participant
          ) => ({
            id:
              participant.id,

            nickname:
              participant.nickname
                .trim(),

            originText:
              participant.originText
                .trim(),

            originAddress:
              participant.originAddress,

            originLat:
              Number(
                participant.originLat
              ),

            originLng:
              Number(
                participant.originLng
              ),
          })
        );

      sessionStorage.setItem(
        QUICK_PARTICIPANTS_STORAGE_KEY,

        JSON.stringify(
          normalizedParticipants
        )
      );

      navigate(
        "/quick/loading"
      );
    };

  /* =====================================================
     COUNTS

     selectedOriginCount
     = 출발지만 실제 선택된 인원

     completedCount
     = 이름 + 출발지 모두 완료된 인원
  ===================================================== */

  const selectedOriginCount =
    participants.filter(
      (
        participant
      ) =>
        hasSelectedOrigin(
          participant
        )
    ).length;

  const completedCount =
    participants.filter(
      (
        participant
      ) =>
        participant.nickname
          .trim() &&
        hasSelectedOrigin(
          participant
        )
    ).length;

  /* =====================================================
     MAP MARKERS

     실제 선택된 출발지만 표시한다.

     이름이 없어도 지도에서는
     1, 2, 3 ... 번호로 표시한다.
  ===================================================== */

  const mapMarkers =
    useMemo(() => {
      return participants
        .map(
          (
            participant,
            index
          ) => {
            if (
              !hasSelectedOrigin(
                participant
              )
            ) {
              return null;
            }

            const color =
              PARTICIPANT_COLORS[
                index
              ] ??
              PARTICIPANT_COLORS[0];

            return {
              id:
                `quick-participant-${participant.id}`,

              type:
                "participant",

              lat:
                Number(
                  participant.originLat
                ),

              lng:
                Number(
                  participant.originLng
                ),

              label:
                participant.nickname
                  .trim() ||
                `참여자 ${index + 1}`,

              /*
                지도에서는 이름 첫 글자가 아니라
                참여자 번호를 표시
              */

              initial:
                String(
                  index + 1
                ),

              color:
                color.color,

              textColor:
                color.textColor,

              zIndex:
                100 +
                index,
            };
          }
        )
        .filter(Boolean);
    }, [participants]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <main className="quick-origin-page app-container">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="quick-origin-header">
        <button
          type="button"
          className="quick-origin-back"
          onClick={() =>
            navigate(
              "/quick"
            )
          }
          aria-label="뒤로 가기"
        >
          ←
        </button>

        <div className="quick-origin-title">
          <h1>
            출발지 입력

            <span>
              📍
            </span>
          </h1>

          <p>
            참여자 이름과 출발지를 입력해주세요
          </p>
        </div>

        <div className="quick-origin-progress">
          <span className="quick-origin-progress__bar quick-origin-progress__bar--active" />

          <span className="quick-origin-progress__bar quick-origin-progress__bar--active" />

          <span className="quick-origin-progress__bar" />
        </div>

        <p className="quick-origin-step">
          2 / 3 단계
        </p>
      </header>

      {/* =================================================
          MAP

          ★ 아무 출발지도 없어도
            실제 Kakao Map을 보여준다.
      ================================================= */}

      <section className="quick-origin-map">
        <KakaoMap
          markers={
            mapMarkers
          }
          height="100%"
          level={8}
          defaultLat={37.5665}
          defaultLng={126.978}
          focusLocation={
            focusLocation
          }
          focusLevel={5}
          showEmptyMessage={
            false
          }
        />
      </section>

      <div className="quick-origin-map-status">
        {selectedOriginCount ===
        0 ? (
          <>
            출발지를 선택하면 지도에 마커가 표시돼요
          </>
        ) : (
          <>
            <span>
              {
                selectedOriginCount
              }
            </span>

            /{participants.length}명
            출발지 선택 완료
          </>
        )}
      </div>

      {/* =================================================
          PARTICIPANTS
      ================================================= */}

      <section className="quick-origin-list">
        {participants.map(
          (
            participant,
            index
          ) => {
            const results =
              searchResults[
                participant.id
              ] ?? [];

            const isOriginSelected =
              hasSelectedOrigin(
                participant
              );

            const color =
              PARTICIPANT_COLORS[
                index
              ] ??
              PARTICIPANT_COLORS[0];

            return (
              <article
                key={
                  participant.id
                }
                className={`quick-origin-card ${
                  isOriginSelected
                    ? "quick-origin-card--complete"
                    : ""
                }`}
              >
                {/* =========================================
                    CARD HEADER
                ========================================= */}

                <div className="quick-origin-card__header">
                  <div className="quick-origin-card__title">
                    <span
                      className="quick-origin-number"
                      style={{
                        backgroundColor:
                          color.color,

                        color:
                          color.textColor,
                      }}
                    >
                      {
                        index + 1
                      }
                    </span>

                    <div>
                      <strong>
                        참여자{" "}
                        {
                          index + 1
                        }
                      </strong>

                      {isOriginSelected && (
                        <small>
                          출발지 선택 완료
                        </small>
                      )}
                    </div>
                  </div>

                  {participants.length >
                    MIN_PARTICIPANTS && (
                    <button
                      type="button"
                      className="quick-origin-remove"
                      onClick={() =>
                        handleRemoveParticipant(
                          participant.id
                        )
                      }
                      aria-label={`참여자 ${index + 1} 삭제`}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* =========================================
                    NAME
                ========================================= */}

                <div className="quick-origin-field">
                  <label>
                    이름
                  </label>

                  <input
                    type="text"
                    className={`quick-origin-input ${
                      errors[
                        `${participant.id}-nickname`
                      ]
                        ? "quick-origin-input--error"
                        : ""
                    }`}
                    placeholder="이름을 입력해주세요"
                    value={
                      participant.nickname
                    }
                    onChange={(
                      event
                    ) =>
                      handleParticipantChange(
                        participant.id,
                        "nickname",
                        event.target
                          .value
                      )
                    }
                  />

                  {errors[
                    `${participant.id}-nickname`
                  ] && (
                    <p className="quick-origin-error">
                      {
                        errors[
                          `${participant.id}-nickname`
                        ]
                      }
                    </p>
                  )}
                </div>

                {/* =========================================
                    ORIGIN
                ========================================= */}

                <div className="quick-origin-field">
                  <label>
                    출발지
                  </label>

                  <div className="quick-origin-search-row">
                    <input
                      type="text"
                      className={`quick-origin-input quick-origin-search-input ${
                        errors[
                          `${participant.id}-originText`
                        ] ||
                        errors[
                          `${participant.id}-origin`
                        ]
                          ? "quick-origin-input--error"
                          : ""
                      }`}
                      placeholder="예: 수원역"
                      value={
                        participant.originText
                      }
                      onChange={(
                        event
                      ) =>
                        handleParticipantChange(
                          participant.id,
                          "originText",
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) =>
                        handleOriginKeyDown(
                          event,
                          participant.id
                        )
                      }
                    />

                    <button
                      type="button"
                      className="quick-origin-search-button"
                      disabled={
                        searchingId ===
                        participant.id
                      }
                      onClick={() =>
                        handleSearchOrigin(
                          participant.id
                        )
                      }
                    >
                      {searchingId ===
                      participant.id
                        ? "검색 중"
                        : "검색"}
                    </button>
                  </div>

                  {/* =====================================
                      SEARCH RESULTS
                  ===================================== */}

                  {results.length >
                    0 && (
                    <div className="quick-origin-search-results">
                      {results.map(
                        (
                          place
                        ) => (
                          <button
                            key={
                              place.id
                            }
                            type="button"
                            className="quick-origin-search-result"
                            onClick={() =>
                              handleSelectOrigin(
                                participant.id,
                                place
                              )
                            }
                          >
                            <div>
                              <strong>
                                {
                                  place.name
                                }
                              </strong>

                              <span>
                                {place.roadAddress ||
                                  place.address}
                              </span>
                            </div>

                            <span className="quick-origin-result-select">
                              선택
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* =====================================
                      SELECTED
                  ===================================== */}

                  {isOriginSelected && (
                    <div className="quick-origin-selected">
                      <div className="quick-origin-selected__check">
                        ✓
                      </div>

                      <div className="quick-origin-selected__content">
                        <strong>
                          {
                            participant.originText
                          }
                        </strong>

                        <span>
                          {participant.originAddress ||
                            "출발지가 선택됐어요"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* =====================================
                      ERRORS
                  ===================================== */}

                  {errors[
                    `${participant.id}-originText`
                  ] && (
                    <p className="quick-origin-error">
                      {
                        errors[
                          `${participant.id}-originText`
                        ]
                      }
                    </p>
                  )}

                  {errors[
                    `${participant.id}-origin`
                  ] && (
                    <p className="quick-origin-error">
                      {
                        errors[
                          `${participant.id}-origin`
                        ]
                      }
                    </p>
                  )}
                </div>
              </article>
            );
          }
        )}
      </section>

      {/* =================================================
          ADD
      ================================================= */}

      {participants.length <
      MAX_PARTICIPANTS ? (
        <button
          type="button"
          className="quick-origin-add"
          onClick={
            handleAddParticipant
          }
        >
          <strong>
            ＋ 참여자 추가
          </strong>

          <span>
            최대 6명까지 입력할 수 있어요
          </span>
        </button>
      ) : (
        <div className="quick-origin-max-message">
          최대 6명까지 입력할 수 있어요.
        </div>
      )}

      {/* =================================================
          BOTTOM
      ================================================= */}

      <footer className="quick-origin-bottom">
        <button
          type="button"
          className="quick-origin-find-button"
          onClick={
            handleFindMidpoint
          }
        >
          🍌 중간 지점 찾기
        </button>

        <p className="quick-origin-count">
          <strong>
            {
              completedCount
            }
          </strong>

          /{participants.length}명
          입력 완료
        </p>
      </footer>
    </main>
  );
}

export default QuickOriginsPage;