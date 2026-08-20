# Bannana Frontend

여러 참여자의 출발지를 기준으로 이동시간 차이가 적은 중간 지점을 확인하고, 추천 장소를 선택할 수 있도록 구성한 **반나나(Bannana)** 서비스의 프론트엔드입니다.

현재 React 기반으로 **Host Flow / Participant Flow / Quick Flow의 기본 화면 및 화면 전환을 구현**했으며, 백엔드 API 연동 전 단계이므로 일부 데이터는 `Mock Data`, `localStorage`, `sessionStorage`를 사용하고 있습니다.

---

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Language | JavaScript |
| Frontend | React |
| Build Tool | Vite |
| Routing | React Router DOM |
| Styling | CSS |
| QR Code | react-qr-code |
| State | React Hooks |
| Temporary Data | Mock Data |
| Browser Storage | localStorage / sessionStorage |

---

# 구현 Flow

현재 프론트엔드는 크게 세 가지 Flow로 구성되어 있습니다.

```text
Host Flow
Participant Flow
Quick Flow
```

---

# 1. Host Flow

호스트가 약속방을 생성하고 참여자를 받은 뒤 중간 지점과 추천 장소를 확인하고 최종 장소를 선택하는 흐름입니다.

```text
/
↓
/create
↓
/room/:roomId/share
↓
/room/:roomId/status
↓
/room/:roomId/loading
↓
/room/:roomId/result
↓
/room/:roomId/confirmed
```

---

## `/`

Home 화면입니다.

현재 다음 두 Flow로 이동할 수 있습니다.

- 약속방 만들기
- 바로 장소 찾기

---

## `/create`

호스트가 약속 정보를 설정하는 화면입니다.

입력 항목:

- 약속방 이름
- 약속 날짜
- 약속 시간
- 이동수단
- 원하는 장소 유형
- 호스트 이름
- 호스트 출발지

현재 MVP 화면에서는 이동수단을 대중교통 기준으로 구성하고 있습니다.

호스트가 입력한 데이터는 이후 화면에서도 사용할 수 있도록 현재 Browser Storage에 임시 저장합니다.

---

## `/room/:roomId/share`

약속방 생성 후 초대 정보를 확인하는 화면입니다.

현재 구현된 UI:

- 약속방 정보
- 초대 링크 표시
- QR Code
- 링크 복사
- 문자 공유
- 참여 현황 확인 버튼

현재 프론트 개발 단계에서는 Mock 초대 코드를 사용합니다.

예:

```text
/join/rgx92k
```

실제 API 연동 후에는 `room-service`에서 반환하는 방 ID 또는 초대 정보를 사용하도록 변경해야 합니다.

---

## `/room/:roomId/status`

호스트가 참여 현황을 확인하는 화면입니다.

현재 구현된 내용:

- 참여 인원 표시
- 참여자 이름 표시
- 참여자 출발지 표시
- 출발지 입력 완료 여부
- 지도 형태의 참여자 Marker
- Map / List UI
- 새로고침 UI
- 중간 장소 찾기 버튼

현재 데이터는 Mock Data를 사용합니다.

실제 API 연동 시 다음 Room Service API를 사용할 예정입니다.

```http
GET /rooms/{roomId}/status
```

---

## `/room/:roomId/loading`

중간 지점을 계산하는 동안 표시하는 Loading 화면입니다.

현재 화면에서는 다음 계산 단계를 순서대로 보여줍니다.

1. 출발지 분석
2. 공평한 중간 지점 탐색
3. 날씨 조건 확인
4. 추천 장소 선별

현재는 Timer 기반 Mock Loading이며 일정 시간이 지나면 Result 화면으로 이동합니다.

---

## `/room/:roomId/result`

추천 중간 지점 및 추천 장소를 보여주는 화면입니다.

현재 표시하는 정보:

- 추천 중간 지점
- 참여자 이름
- 참여자별 이동시간
- 이동시간 차이
- 참여자 Marker
- 날씨
- 추천 장소
- 추천 이유
- 장소 유형
- 중간 지점으로부터의 거리
- 도보 예상 시간

추천 장소 목록은 Bottom Sheet로 구성되어 있습니다.

Bottom Sheet는 다음 세 단계 높이로 Drag할 수 있도록 구현되어 있습니다.

```text
38%
63%
90%
```

Bottom Sheet 높이에 따라 참여자 이름 범례도 함께 이동하도록 구성되어 있습니다.

장소를 선택하면 선택 버튼이 나타나며 최종 확정 화면으로 이동합니다.

현재 중간 지점, 이동시간, 날씨, 장소 정보는 Mock Data를 사용합니다.

---

## `/room/:roomId/confirmed`

호스트가 선택한 최종 장소를 확인하는 화면입니다.

현재 표시하는 정보:

- 최종 장소
- 중간 지역
- 약속 날짜
- 약속 시간
- 날씨
- 참여자별 이동시간
- 예상 출발시간
- 지도 형태의 참여자 위치
- 약속 공유 버튼

---

# 2. Participant Flow

초대 링크를 받은 참여자가 자신의 이름과 출발지를 입력하고 최종 약속 결과를 확인하는 흐름입니다.

현재 Frontend Route는 다음과 같습니다.

```text
/join/:inviteCode
↓
/join/:inviteCode/waiting
↓
/join/:inviteCode/confirmed
```

> `/join/...`은 Backend API가 아니라 React Router에서 사용하는 **Frontend Route**입니다.

---

## `/join/:inviteCode`

초대 링크를 통해 들어온 참여자가 약속방 정보를 확인하고 참여하는 화면입니다.

현재 구현된 내용:

- 초대받은 약속방 정보 표시
- 기존 참여자 표시
- 참여자 이름 입력
- 참여자 출발지 입력
- 입력값 검증
- 제출 완료 화면

현재 참여자가 입력한 정보는 `sessionStorage`에 임시 저장합니다.

사용 중인 Storage Key:

```text
bannana-current-participant
```

실제 API 연동 시 참여자 등록에는 다음 Room Service API를 사용할 예정입니다.

```http
POST /rooms/{roomId}/participants
```

---

## `/join/:inviteCode/waiting`

참여자가 자신의 출발지를 입력한 뒤 결과를 기다리는 화면입니다.

현재 구현된 내용:

- 출발지 제출 완료 상태
- 참여자 목록
- 중간 지점 탐색 상태
- 지도 형태의 참여자 Marker
- 결과 확인 버튼

현재 참여자 및 중간 지점 정보는 Mock Data를 사용합니다.

---

## `/join/:inviteCode/confirmed`

호스트가 최종 장소를 결정한 뒤 참여자가 결과를 확인하는 화면입니다.

현재 표시하는 정보:

- 최종 약속 장소
- 현재 참여자의 예상 이동시간
- 예상 출발시간
- 참여자 전체 이동시간
- 참여자별 이동시간 Bar
- 지도 형태의 참여자 위치
- 약속 날짜 / 시간
- 날씨
- 공유 버튼
- 캘린더 저장 UI

현재 Room / Result / Final Selection 정보는 Mock Data를 사용하며, 참여자 본인이 입력한 이름과 출발지는 `sessionStorage`의 값을 사용합니다.

---

# 3. Quick Flow

약속방이나 초대 링크 없이 여러 명의 출발지를 직접 입력하여 중간 장소를 확인하는 Flow입니다.

현재 구성된 Route는 다음과 같습니다.

```text
/quick
↓
/quick/origins
↓
/quick/loading
↓
/quick/result
↓
/quick/confirmed
```

---

## `/quick`

Quick Flow의 약속 조건 설정 화면입니다.

입력 항목:

- 날짜
- 시간
- 이동수단
- 원하는 장소 유형

설정 데이터는 현재 `sessionStorage`에 저장합니다.

사용 중인 Storage Key:

```text
bannana-quick-settings
```

---

## `/quick/origins`

Quick Flow 참여자의 이름과 출발지를 입력하는 화면입니다.

현재 Frontend에서는 참여자 수를 다음과 같이 제한합니다.

```text
최소 2명
최대 6명
```

입력 데이터:

- 참여자 이름
- 참여자 출발지

현재 입력값은 `sessionStorage`에 저장합니다.

```text
bannana-quick-participants
```

---

## `/quick/loading`

Quick Flow의 중간 지점 계산 Loading 화면입니다.

Host Flow의 Loading 화면과 유사하게 계산 진행 단계를 표시합니다.

현재는 실제 Backend 처리 상태가 아닌 Frontend Timer 기반 UI입니다.

---

## `/quick/result`

Quick Flow의 추천 결과 화면입니다.

현재 구현된 내용:

- 입력한 참여자 표시
- 참여자별 Mock 이동시간
- 추천 중간 지점
- 이동시간 차이
- 추천 장소 목록
- 장소 유형
- 도보 시간
- 거리
- 날씨
- 추천 이유
- 참여자 Marker
- Bottom Sheet

Bottom Sheet는 Host Result 화면과 동일하게 세 단계 Drag 방식으로 구성되어 있습니다.

```text
38%
63%
90%
```

Quick Flow에서는 최대 6명의 참여자 색상을 구분하여 표시하도록 구성되어 있습니다.

현재 선택한 장소 정보는 다음 Storage Key에 저장합니다.

```text
bannana-quick-selected-place
```

---

## `/quick/confirmed`

Quick Flow에서 선택한 최종 장소를 표시하기 위한 확정 화면입니다.

선택된 장소 데이터는 `sessionStorage`의 Quick Flow 선택 결과를 이용합니다.

---

# 현재 데이터 관리 방식

Backend API 연동 전 Frontend Flow 및 UI 개발을 위해 Mock Data와 Browser Storage를 사용하고 있습니다.

---

## Mock Data

```text
src/data/mockData.js
```

현재 Host / Participant Flow의 화면 개발을 위한 데이터가 포함되어 있습니다.

사용되는 데이터 예:

- 약속방 정보
- 참여자 정보
- 참여 현황
- 중간 지점
- 이동시간
- 날씨
- 추천 장소
- 최종 선택 장소
- Empty Result
- API Error 상태

---

## Room Storage

```text
src/data/roomStorage.js
```

호스트가 `/create`에서 입력한 정보를 이후 Host Flow에서도 유지하기 위해 사용합니다.

현재 Backend 연결 전 임시 데이터 저장 용도입니다.

---

## Participant Storage

Participant Flow에서 현재 참여자가 입력한 정보를 다음 Key로 저장합니다.

```text
bannana-current-participant
```

---

## Quick Flow Storage

현재 Quick Flow에서 사용하는 Storage Key입니다.

```text
bannana-quick-settings

bannana-quick-participants

bannana-quick-selected-place
```

---

# Backend 연동 대상

현재 Frontend는 Mock Data 기반 화면 구현 단계이며 아래 API와 연결할 예정입니다.

---

# Room Service

기본 포트:

```text
8080
```

현재 Backend에서 제공하는 API:

| Method | Endpoint | Frontend 사용 위치 |
| --- | --- | --- |
| POST | `/rooms` | Host Flow 약속방 생성 |
| POST | `/rooms/{roomId}/host` | 호스트 이름 및 출발지 등록 |
| POST | `/rooms/{roomId}/participants` | Participant Flow 참여자 등록 |
| PATCH | `/rooms/{roomId}/participants/{participantId}` | 참여자 출발지 수정 |
| GET | `/rooms/{roomId}/status` | Host Flow 참여 현황 조회 / Polling |

---

## Host Flow API 연결 예상 순서

```text
/create
   │
   ├─ POST /rooms
   │
   └─ POST /rooms/{roomId}/host
            │
            ▼
/room/:roomId/share
            │
            ▼
GET /rooms/{roomId}/status
            │
            ▼
/room/:roomId/status
```

---

## Participant Flow API 연결 예상 순서

Frontend:

```text
/join/:inviteCode
```

참여자 입력 후 Backend:

```http
POST /rooms/{roomId}/participants
```

즉,

```text
/join/:inviteCode
```

는 **Frontend URL**이고,

```text
POST /rooms/{roomId}/participants
```

가 실제 참여자 등록 **Backend API**입니다.

---

# 초대 URL 확인 필요

현재 Frontend와 Room Service의 초대 URL 형식이 서로 다릅니다.

### 현재 Frontend

```text
/join/:inviteCode
```

예:

```text
http://localhost:5173/join/rgx92k
```

### 현재 Room Service README

```text
http://localhost:5173/invite/{roomId}
```

예:

```text
http://localhost:5173/invite/1
```

따라서 API 연동 시 초대 URL 형식을 하나로 통일해야 합니다.

예를 들어 Frontend 형식을 유지한다면 Room Service에서 반환하는 URL도 다음과 같은 형태로 맞추는 방법이 있습니다.

```text
http://localhost:5173/join/{roomId}
```

또는 별도의 `inviteCode`를 Backend에서 발급하는 방식으로 변경할 수 있습니다.

이 부분은 Frontend / Room Service 간 합의가 필요합니다.

---

# Recommendation Service

기본 포트:

```text
8081
```

현재 제공되는 API:

```http
POST /recommendations
```

Request의 주요 데이터:

```json
{
  "participants": [
    {
      "nickname": "홍길동",
      "origin_lat": 37.5665,
      "origin_lng": 126.978,
      "transport_mode": "transit",
      "max_travel_min": 40
    }
  ],
  "place_types": [
    "cafe",
    "restaurant"
  ],
  "datetime": "2026-08-14T19:00:00"
}
```

Response의 주요 구조:

```json
{
  "candidates": [
    {
      "name": "성수역",
      "lat": 37.5446,
      "lng": 127.0559,
      "travel_times": {
        "홍길동": 34
      },
      "gap_minutes": 5
    }
  ]
}
```

Frontend에서는 다음과 같이 사용할 수 있습니다.

```text
candidates[].name
→ 추천 중간 지점 이름

candidates[].lat / lng
→ 추천 중간 지점 좌표

candidates[].travel_times
→ 참여자별 이동시간

candidates[].gap_minutes
→ 이동시간 차이
```

---

# 현재 Backend API만으로 아직 연결되지 않는 데이터

현재 제공된 Backend 명세 기준으로 Frontend Result 화면에서 사용하는 모든 데이터가 아직 제공되는 것은 아닙니다.

현재 추가 연동 또는 구현이 필요한 데이터:

- 출발지 문자열 → 위도 / 경도 변환
- 실제 추천 장소 목록
- 실내 여부
- 실제 날씨
- 날씨 기반 추천 이유
- 최종 선택 장소 저장
- 최종 확정 결과 조회

현재 Frontend에서는 위 항목을 Mock Data로 표시하고 있습니다.

---

# 현재 확인되는 API 연결 이슈

## 1. 출발지 좌표

Room Service의 다음 값은 현재 nullable입니다.

```text
originLat
originLng
```

반면 Recommendation Service는 다음 값을 필요로 합니다.

```text
origin_lat
origin_lng
```

따라서 실제 Recommendation 요청 전에 출발지를 좌표로 변환하는 과정이 필요합니다.

---

## 2. Invite 화면에서 사용할 Room 정보

현재 Participant Flow의 `/join/:inviteCode` 화면에서는 다음 약속 정보를 표시합니다.

- 약속방 이름
- 날짜
- 시간
- 이동수단
- 장소 유형
- 호스트

현재 Frontend에서는 `getMockRoom()`을 이용해 표시합니다.

제공된 Room Service API 중 참여 현황 조회 API는 다음과 같습니다.

```http
GET /rooms/{roomId}/status
```

현재 제공된 Response에는 다음 정보가 포함됩니다.

- roomId
- title
- status
- host
- participants
- joinedCount

따라서 Join 화면에서 필요한 날짜 / 시간 / 장소 유형 등을 실제 데이터로 표시하려면 기존 API Response 확장 또는 별도의 방 정보 조회 방식에 대한 논의가 필요합니다.

---

## 3. 추천 장소

Recommendation Service의 현재 역할은 **중간 후보 역 계산**입니다.

현재 Response는 다음 데이터를 제공합니다.

```text
중간 후보 이름
좌표
참여자별 이동시간
이동시간 차이
```

Frontend Result 화면에서 표시하는 카페 / 식당 / 전시 / 공원 등의 추천 장소 데이터는 현재 Recommendation API Response에 포함되어 있지 않습니다.

따라서 장소 검색은 별도의 API 연동이 필요합니다.

---

# 프로젝트 구조

현재 Frontend의 주요 구조입니다.

```text
src
├── data
│   ├── mockData.js
│   └── roomStorage.js
│
├── pages
│   ├── HomePage.jsx
│   ├── HomePage.css
│   │
│   ├── CreateRoomPage.jsx
│   ├── CreateRoomPage.css
│   │
│   ├── ShareRoomPage.jsx
│   ├── ShareRoomPage.css
│   │
│   ├── RoomStatusPage.jsx
│   ├── RoomStatusPage.css
│   │
│   ├── CalculationLoadingPage.jsx
│   ├── CalculationLoadingPage.css
│   │
│   ├── ResultPage.jsx
│   ├── ResultPage.css
│   │
│   ├── ConfirmedRoomPage.jsx
│   ├── ConfirmedRoomPage.css
│   │
│   ├── JoinRoomPage.jsx
│   ├── JoinRoomPage.css
│   │
│   ├── ParticipantWaitingPage.jsx
│   ├── ParticipantWaitingPage.css
│   │
│   ├── ParticipantConfirmedPage.jsx
│   ├── ParticipantConfirmedPage.css
│   │
│   ├── QuickPage.jsx
│   ├── QuickPage.css
│   │
│   ├── QuickOriginsPage.jsx
│   ├── QuickOriginsPage.css
│   │
│   ├── QuickLoadingPage.jsx
│   ├── QuickLoadingPage.css
│   │
│   ├── QuickResultPage.jsx
│   ├── QuickResultPage.css
│   │
│   ├── QuickConfirmedPage.jsx
│   └── QuickConfirmedPage.css
│
├── App.jsx
├── main.jsx
└── index.css
```

---

# 현재 구현 범위

현재 Frontend 코드에서 구현한 주요 범위:

- Home 화면
- Host Flow 화면
- Participant Flow 화면
- Quick Flow 화면
- React Router 기반 화면 이동
- 약속 정보 입력
- 호스트 정보 입력
- 참여자 정보 입력
- 참여자 입력값 검증
- 초대 링크 UI
- QR Code
- 링크 복사
- 문자 공유
- 참여 현황 UI
- Mock 참여자 데이터
- 계산 Loading UI
- Mock 중간 지점
- Mock 이동시간
- Mock 날씨
- Mock 추천 장소
- 장소 선택 UI
- 결과 Bottom Sheet
- Bottom Sheet 3단계 Drag
- 참여자 Marker
- 참여자별 색상 구분
- Empty Result UI
- API Error UI
- Browser Storage를 통한 임시 데이터 유지

---

# 아직 실제 API 연동이 필요한 부분

현재 UI는 구현되어 있으나 실제 데이터로 교체해야 하는 부분입니다.

- Room 생성 API 연동
- Host 등록 API 연동
- Participant 등록 API 연동
- 참여 현황 Polling
- 출발지 좌표 변환
- Recommendation Service 연동
- 실제 중간 지점 데이터
- 실제 ODsay 이동시간
- 실제 추천 장소 검색
- 날씨 API
- 최종 장소 저장 Backend API
- 확정 결과 조회 API
- 초대 URL 형식 통일

---

# 실행 방법

## 1. 패키지 설치

```bash
npm install
```

## 2. 개발 서버 실행

```bash
npm run dev
```

기본 Frontend 개발 주소:

```text
http://localhost:5173
```
