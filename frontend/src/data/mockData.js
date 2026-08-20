// src/data/mockData.js

import {
    getRoomDraft,
  } from "../data/roomStorage";
  
  // ======================================================
  // 공통
  // ======================================================
  
  export const ROOM_ID =
    "room-demo-001";
  
  export const INVITE_CODE =
    "rgx92k";
  
  
  // ======================================================
  // 호스트
  //
  // /create에서 입력한 값을 사용한다.
  // ======================================================
  
  export function getMockHost() {
    const roomDraft =
      getRoomDraft();
  
    return {
      id: 1,
  
      nickname:
        roomDraft.hostName ||
        "박지수",
  
      origin: {
        type: "STATION",
  
        text:
          roomDraft.hostOrigin ||
          "수원역",
  
        /*
          실제 API 연동 전이므로
          좌표만 Mock 값 사용
        */
        lat: 37.2658,
        lng: 127.0001,
      },
  
      transportMode: "TRANSIT",
  
      submitted: true,
  
      isHost: true,
    };
  }
  
  
  // ======================================================
  // 나머지 3명은 Mock
  // ======================================================
  
  export const mockGuests = [
    {
      id: 2,
  
      nickname: "송현석",
  
      origin: {
        type: "STATION",
        text: "잠실역",
        lat: 37.5133,
        lng: 127.1001,
      },
  
      transportMode: "TRANSIT",
  
      submitted: true,
  
      isHost: false,
    },
  
    {
      id: 3,
  
      nickname: "김보경",
  
      origin: {
        type: "STATION",
        text: "홍대입구역",
        lat: 37.5572,
        lng: 126.9245,
      },
  
      transportMode: "TRANSIT",
  
      submitted: true,
  
      isHost: false,
    },
  
    {
      id: 4,
  
      nickname: "이지은",
  
      origin: {
        type: "STATION",
        text: "회기역",
        lat: 37.5895,
        lng: 127.0579,
      },
  
      transportMode: "TRANSIT",
  
      submitted: true,
  
      isHost: false,
    },
  ];
  
  
  // ======================================================
  // 참여자 4명
  // ======================================================
  
  export function getMockParticipants() {
    return [
      getMockHost(),
      ...mockGuests,
    ];
  }
  
  
  // ======================================================
  // 약속방
  // ======================================================
  
  export function getMockRoom() {
    const draft =
      getRoomDraft();
  
    const host =
      getMockHost();
  
    return {
      id: ROOM_ID,
  
      title:
        draft.title ||
        "토요일 모임",
  
      meetingDateTime:
        `${draft.meetingDate}T${draft.meetingTime}:00`,
  
      transportMode:
        "TRANSIT",
  
      preferredCategories:
        draft.preferredCategories,
  
      host,
  
      participantCount: 4,
  
      expiresAt:
        "2026-08-23T15:00:00",
    };
  }
  
  
  // ======================================================
  // 참여 현황 - 완료
  // ======================================================
  
  export function getMockRoomStatus() {
    const participants =
      getMockParticipants();
  
    return {
      roomId: ROOM_ID,
  
      totalParticipants: 4,
  
      submittedCount: 4,
  
      allSubmitted: true,
  
      participants:
        participants.map(
          (participant) => ({
            id:
              participant.id,
  
            nickname:
              participant.nickname,
  
            originText:
              participant.origin.text,
  
            submitted: true,
  
            isHost:
              participant.isHost,
          })
        ),
    };
  }
  
  
  // ======================================================
  // 참여 현황 - 3/4
  // ======================================================
  
  export function getMockWaitingRoomStatus() {
    const [
      host,
      guest1,
      guest2,
      guest3,
    ] = getMockParticipants();
  
    return {
      roomId: ROOM_ID,
  
      totalParticipants: 4,
  
      submittedCount: 3,
  
      allSubmitted: false,
  
      participants: [
        {
          id: host.id,
  
          nickname:
            host.nickname,
  
          originText:
            host.origin.text,
  
          submitted: true,
  
          isHost: true,
        },
  
        {
          id: guest1.id,
  
          nickname:
            guest1.nickname,
  
          originText:
            guest1.origin.text,
  
          submitted: true,
  
          isHost: false,
        },
  
        {
          id: guest2.id,
  
          nickname:
            guest2.nickname,
  
          originText:
            guest2.origin.text,
  
          submitted: true,
  
          isHost: false,
        },
  
        {
          id: guest3.id,
  
          nickname:
            guest3.nickname,
  
          originText: null,
  
          submitted: false,
  
          isHost: false,
        },
      ],
    };
  }
  
  
  // ======================================================
  // 기본 결과 생성
  // ======================================================
  
  function createBaseResult() {
    const [
      host,
      guest1,
      guest2,
      guest3,
    ] = getMockParticipants();
  
    return {
      roomId: ROOM_ID,
  
      transportMode:
        "TRANSIT",
  
      midpoint: {
        candidateId:
          "candidate-001",
  
        name: "서울역",
  
        lat: 37.5547,
        lng: 126.9706,
      },
  
      participants: [
        {
          id: host.id,
  
          nickname:
            host.nickname,
  
          originText:
            host.origin.text,
  
          originLat:
            host.origin.lat,
  
          originLng:
            host.origin.lng,
  
          travelTime: 38,
  
          transferCount: 1,
  
          isHost: true,
        },
  
        {
          id: guest1.id,
  
          nickname:
            guest1.nickname,
  
          originText:
            guest1.origin.text,
  
          originLat:
            guest1.origin.lat,
  
          originLng:
            guest1.origin.lng,
  
          travelTime: 39,
  
          transferCount: 1,
  
          isHost: false,
        },
  
        {
          id: guest2.id,
  
          nickname:
            guest2.nickname,
  
          originText:
            guest2.origin.text,
  
          originLat:
            guest2.origin.lat,
  
          originLng:
            guest2.origin.lng,
  
          travelTime: 34,
  
          transferCount: 1,
  
          isHost: false,
        },
  
        {
          id: guest3.id,
  
          nickname:
            guest3.nickname,
  
          originText:
            guest3.origin.text,
  
          originLat:
            guest3.origin.lat,
  
          originLng:
            guest3.origin.lng,
  
          travelTime: 37,
  
          transferCount: 1,
  
          isHost: false,
        },
      ],
  
      fairness: {
        minTravelTime: 34,
  
        maxTravelTime: 39,
  
        timeDifference: 5,
  
        averageTravelTime: 37,
      },
    };
  }
  
  
  // ======================================================
  // 장소 Mock
  // ======================================================
  
  const rainPlaces = [
    {
      id: 1,
  
      name:
        "서울역 실내 카페 A",
  
      category: "CAFE",
  
      lat: 37.5551,
      lng: 126.9712,
  
      distanceM: 120,
  
      walkMinutes: 2,
  
      indoor: true,
  
      placeUrl: "#",
  
      source: "API",
    },
  
    {
      id: 2,
  
      name:
        "서울역 식당 B",
  
      category:
        "RESTAURANT",
  
      lat: 37.5542,
      lng: 126.972,
  
      distanceM: 180,
  
      walkMinutes: 3,
  
      indoor: true,
  
      placeUrl: "#",
  
      source: "API",
    },
  
    {
      id: 3,
  
      name:
        "서울역 카페 C",
  
      category: "CAFE",
  
      lat: 37.5538,
      lng: 126.9698,
  
      distanceM: 300,
  
      walkMinutes: 5,
  
      indoor: true,
  
      placeUrl: "#",
  
      source: "API",
    },
  ];
  
  
  // ======================================================
  // 비
  // ======================================================
  
  export function getMockRainResult() {
    return {
      ...createBaseResult(),
  
      weather: {
        condition: "RAIN",
  
        sky: "OVERCAST",
  
        precipitationType:
          "RAIN",
  
        temperature: 22,
  
        rainProbability: 80,
  
        precipitation:
          "5mm",
  
        snowfall: "0cm",
  
        description:
          "약속 시간에 비가 예상돼요.",
      },
  
      recommendationReason:
        "비가 예상되어 역에서 가깝고 실내에서 이용할 수 있는 카페와 식당을 우선 추천했어요.",
  
      places:
        rainPlaces,
    };
  }
  
  
  // ======================================================
  // 맑음
  // ======================================================
  
  export function getMockClearResult() {
    return {
      ...createBaseResult(),
  
      weather: {
        condition: "CLEAR",
  
        sky: "CLEAR",
  
        precipitationType:
          "NONE",
  
        temperature: 25,
  
        rainProbability: 10,
  
        precipitation:
          "0mm",
  
        snowfall: "0cm",
  
        description:
          "맑고 활동하기 좋은 날씨예요.",
      },
  
      recommendationReason:
        "날씨가 맑아 카페와 식당뿐 아니라 주변을 함께 둘러보기 좋은 장소를 추천했어요.",
  
      places:
        rainPlaces,
    };
  }
  
  
  // ======================================================
  // 눈
  // ======================================================
  
  export function getMockSnowResult() {
    return {
      ...createBaseResult(),
  
      weather: {
        condition: "SNOW",
  
        sky: "OVERCAST",
  
        precipitationType:
          "SNOW",
  
        temperature: -1,
  
        rainProbability: 70,
  
        precipitation:
          "0mm",
  
        snowfall: "2cm",
  
        description:
          "약속 시간에 눈이 예상돼요.",
      },
  
      recommendationReason:
        "눈이 예상되어 이동이 편하고 실내에서 오래 머물 수 있는 장소를 우선 추천했어요.",
  
      places:
        rainPlaces,
    };
  }
  
  
  // ======================================================
  // 날씨별 결과
  // ======================================================
  
  export function getMockResultByWeather(
    weather = "RAIN"
  ) {
    if (weather === "CLEAR") {
      return getMockClearResult();
    }
  
    if (weather === "SNOW") {
      return getMockSnowResult();
    }
  
    return getMockRainResult();
  }
  
  
  // ======================================================
  // 기본 결과
  // ======================================================
  
  export function getMockResult() {
    return getMockRainResult();
  }
  
  
  // ======================================================
  // 최종 확정
  // ======================================================
  
  export function getMockFinalSelection() {
    return {
      roomId: ROOM_ID,
  
      midpoint: {
        candidateId:
          "candidate-001",
  
        name: "서울역",
  
        lat: 37.5547,
        lng: 126.9706,
      },
  
      selectedPlace: {
        ...rainPlaces[0],
      },
  
      decidedAt:
        "2026-08-22T14:00:00",
    };
  }
  
  
  // ======================================================
  // Empty
  // ======================================================
  
  export const mockEmptyResult = {
    roomId: ROOM_ID,
  
    transportMode:
      "TRANSIT",
  
    midpoint: null,
  
    participants: [],
  
    fairness: null,
  
    weather: null,
  
    recommendationReason:
      "",
  
    places: [],
  };
  
  
  // ======================================================
  // API ERROR
  // ======================================================
  
  export const mockApiError = {
    code: "API_ERROR",
  
    message:
      "결과를 불러오지 못했습니다.",
  
    description:
      "잠시 후 다시 시도해주세요.",
  };
  
  
  // ======================================================
  // INVALID INVITE
  // ======================================================
  
  export const mockInvalidInvite = {
    code:
      "INVALID_INVITE",
  
    message:
      "유효하지 않은 초대 링크입니다.",
  
    description:
      "방장에게 새로운 초대 링크를 요청해주세요.",
  };