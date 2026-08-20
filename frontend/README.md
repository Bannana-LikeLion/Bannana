# 반나나(Bannana) Frontend 🍌

여러 참여자의 출발지를 기준으로 **실제 대중교통 이동시간 차이가 적은 중간 지점**을 찾고,  

날씨와 주변 장소 정보를 함께 제공하여 모두가 만나기 좋은 약속 장소를 추천하는  

**반나나(Bannana) 모바일 웹 서비스의 프론트엔드**입니다.

반나나는 단순한 좌표상의 중간점이 아니라 실제 대중교통 이동시간을 비교하여  

참여자 간 이동시간 편차가 작은 장소를 추천하는 것을 목표로 합니다.

---

## 기술 스택

| 구분 | 기술 |

| --- | --- |

| Language | JavaScript |

| Frontend | React |

| Build Tool | Vite |

| Routing | React Router DOM |

| Styling | CSS |

| Map / 장소 검색 | Kakao Maps JavaScript SDK |

| QR Code | react-qr-code |

| State | React Hooks |

| Temporary State | sessionStorage / localStorage |

| Backend | Spring Boot REST API |

---

# 주요 Flow

프론트엔드는 크게 세 가지 사용자 Flow로 구성되어 있습니다.

```text

Host Flow

Participant Flow

Quick Flow

```

---

# 1. Host Flow

호스트가 약속방을 생성하고 참여자를 초대한 뒤,  

참여자들의 출발지를 기반으로 공평한 중간 장소를 추천받고 최종 장소를 선택하는 흐름입니다.

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

서비스의 Home 화면입니다.

다음 두 가지 Flow로 이동할 수 있습니다.

- 약속방 만들기

- 바로 장소 찾기

---

## `/create`

호스트가 약속방 정보와 자신의 출발지를 입력합니다.

### 입력 정보

- 약속방 이름

- 약속 날짜

- 약속 시간

- 이동수단

- 원하는 장소 유형

- 호스트 이름

- 호스트 출발지

현재 MVP에서는 이동수단을 **대중교통** 기준으로 제공합니다.

출발지는 Kakao Maps 기반 장소 검색을 이용하여 입력하며  

선택된 장소의 위도와 경도를 Backend로 전달합니다.

### 사용 API

```http

POST /rooms

POST /rooms/{roomId}/host

```

방 생성과 호스트 등록이 완료되면 초대 화면으로 이동합니다.

---

## `/room/:roomId/share`

생성된 약속방의 초대 정보를 확인하는 화면입니다.

### 주요 기능

- 약속방 정보 표시

- 초대 링크 표시

- 초대 링크 복사

- QR Code 생성

- 문자 공유

- 참여 현황 화면 이동

참여자는 다음 Frontend Route를 통해 약속방에 입장합니다.

```text

/join/{roomId}

```

---

## `/room/:roomId/status`

호스트가 약속방 참여 현황을 확인하는 화면입니다.

### 주요 기능

- 참여 인원 확인

- 참여자 이름 표시

- 참여자 출발지 표시

- 지도 Marker 표시

- 참여자 목록 표시

- 참여 현황 새로고침

- 중간 장소 찾기

### 사용 API

```http

GET /rooms/{roomId}/status

```

모든 참여자의 출발지가 준비되면 중간 장소 계산을 시작할 수 있습니다.

---

## `/room/:roomId/loading`

참여자들의 출발지를 기준으로 공평한 중간 지점을 계산하는 화면입니다.

화면에서는 다음 계산 단계를 표시합니다.

```text

출발지 분석

↓

공평한 중간 지점 탐색

↓

이동시간 계산

↓

추천 후보 정리

```

### 사용 API

```http

POST /recommendations

```

Backend에서는 후보 지점별 실제 대중교통 이동시간을 조회하고  

참여자 간 이동시간 차이가 작은 후보를 계산합니다.

---

## `/room/:roomId/result`

추천된 중간 지점과 주변 장소를 확인하는 화면입니다.

### 표시 정보

- 추천 중간 지점

- 참여자별 이동시간

- 이동시간 차이

- 참여자 Marker

- 날씨

- 주변 추천 장소

- 장소 유형

- 추천 이유

- 중간 지점으로부터의 거리

- 도보 예상 정보

추천 장소 목록은 단계형 Bottom Sheet 형태로 제공합니다.

### 주변 장소 조회

```http

GET /places/nearby?lat=&lng=&types=

```

### 날씨 조회

```http

GET /weather?lat=&lng=&datetime=

```

사용자는 추천 장소 중 하나를 선택하여 최종 약속 장소를 결정할 수 있습니다.

---

## `/room/:roomId/confirmed`

호스트가 선택한 최종 장소를 확인하는 화면입니다.

### 표시 정보

- 최종 약속 장소

- 추천 중간 지역

- 약속 날짜

- 약속 시간

- 날씨

- 참여자별 이동시간

- 지도

- 약속 공유 정보

---

# 2. Participant Flow

초대 링크를 받은 참여자가 자신의 이름과 출발지를 입력하고  

최종 약속 결과를 확인하는 흐름입니다.

```text

/join/:inviteCode

↓

/join/:inviteCode/waiting

↓

/join/:inviteCode/confirmed

```

> `/join/...`은 Backend API가 아니라 React Router에서 사용하는 Frontend Route입니다.

---

## `/join/:inviteCode`

초대 링크를 통해 들어온 참여자가 약속방 정보를 확인하고  

자신의 이름과 출발지를 입력합니다.

### 입력 정보

- 참여자 이름

- 참여자 출발지

출발지는 Kakao Maps 장소 검색을 통해 입력합니다.

### 참여자 등록 API

```http

POST /rooms/{roomId}/participants

```

출발지 수정이 필요한 경우 다음 API를 사용할 수 있습니다.

```http

PATCH /rooms/{roomId}/participants/{participantId}

```

---

## `/join/:inviteCode/waiting`

출발지 입력을 완료한 참여자가 결과를 기다리는 화면입니다.

### 주요 기능

- 출발지 제출 상태 표시

- 현재 참여자 목록

- 참여 현황 표시

- 지도 Marker 표시

- 결과 대기

### 사용 API

```http

GET /rooms/{roomId}/status

```

---

## `/join/:inviteCode/confirmed`

호스트가 장소를 결정한 뒤 참여자가 최종 약속 정보를 확인하는 화면입니다.

### 표시 정보

- 최종 약속 장소

- 현재 참여자의 이동정보

- 참여자별 이동시간

- 약속 날짜 / 시간

- 날씨

- 지도

- 공유 정보

---

# 3. Quick Flow

약속방을 생성하거나 초대 링크를 공유하지 않고  

한 사용자가 여러 참여자의 출발지를 직접 입력하여 중간 장소를 찾는 기능입니다.

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

Quick Flow에서 사용할 약속 조건을 설정합니다.

### 입력 정보

- 약속 날짜

- 약속 시간

- 이동수단

- 원하는 장소 유형

현재 MVP에서 지원하는 장소 유형은 다음과 같습니다.

```text

카페

식당

```

설정 정보는 화면 간 상태 유지를 위해 `sessionStorage`에 저장합니다.

```text

bannana-quick-settings

```

---

## `/quick/origins`

Quick Flow에 참여할 사람들의 이름과 출발지를 직접 입력합니다.

### 참여 인원

```text

최소 2명

최대 6명

```

### 입력 정보

- 참여자 이름

- 참여자 출발지

출발지는 Kakao Maps 장소 검색을 통해 입력하며  

선택한 장소의 좌표를 함께 저장합니다.

사용하는 Storage Key:

```text

bannana-quick-participants

```

---

## `/quick/loading`

입력한 참여자들의 출발지를 기반으로 실제 추천 API를 호출합니다.

### 사용 API

```http

POST /recommendations

```

참여자별 대중교통 이동시간을 비교하여  

이동시간 편차가 작은 중간 후보를 계산합니다.

---

## `/quick/result`

Quick Flow의 추천 결과를 표시합니다.

### 주요 기능

- 추천 중간 지점

- 참여자별 이동시간

- 이동시간 차이

- 참여자 Marker

- 날씨

- 주변 추천 장소

- 장소 유형

- 추천 이유

- 거리 정보

- Bottom Sheet

- 최종 장소 선택

추천 결과는 다음 Storage Key를 통해 화면 간 유지합니다.

```text

bannana-quick-recommendation

```

선택한 장소는 다음 Key에 저장합니다.

```text

bannana-quick-selected-place

```

---

## `/quick/confirmed`

Quick Flow에서 선택한 최종 약속 장소를 확인하는 화면입니다.

Quick Flow는 별도의 약속방을 생성하지 않기 때문에  

화면 간 필요한 데이터는 `sessionStorage`를 이용해 유지합니다.

---

# Backend API 연동

Backend는 하나의 Spring Boot 애플리케이션으로 구성되어 있으며  

기본 개발 포트는 `8080`입니다.

| Method | Endpoint | Frontend 사용 위치 |

| --- | --- | --- |

| POST | `/rooms` | 약속방 생성 |

| POST | `/rooms/{roomId}/host` | 호스트 등록 |

| POST | `/rooms/{roomId}/participants` | 참여자 등록 |

| PATCH | `/rooms/{roomId}/participants/{participantId}` | 참여자 출발지 수정 |

| GET | `/rooms/{roomId}/status` | 참여 현황 조회 |

| POST | `/recommendations` | 중간 지점 후보 계산 |

| GET | `/weather?lat=&lng=&datetime=` | 약속 시간 날씨 조회 |

| GET | `/places/nearby?lat=&lng=&types=` | 중간 지점 주변 장소 조회 |

Backend의 자세한 실행 방법과 API 설명은 다음 문서를 참고합니다.

```text

backend/README.md

```

---

# 추천 과정

반나나는 단순한 지리적 중앙값이 아니라  

**실제 대중교통 이동시간을 기준으로 공평한 중간 지점**을 찾습니다.

전체 추천 흐름은 다음과 같습니다.

```text

참여자 출발지 입력

↓

Kakao Maps를 통한 출발지 좌표 확보

↓

중간 후보 지점 탐색

↓

ODsay 대중교통 이동시간 조회

↓

후보별 참여자 이동시간 비교

↓

이동시간 편차가 작은 후보 선택

↓

주변 카페 / 식당 검색

↓

약속 시간의 날씨 조회

↓

최종 추천 장소 표시

```

---

# Frontend 데이터 관리

핵심 데이터는 Backend API를 통해 조회하거나 저장하며,  

페이지 간 임시 상태 전달에는 Browser Storage를 사용합니다.

## Quick Flow

```text

bannana-quick-settings

bannana-quick-participants

bannana-quick-recommendation

bannana-quick-selected-place

```

## Room / Participant Flow

Room 및 Participant Flow에서도 화면 이동에 필요한 일부 정보를  

`sessionStorage` 또는 Frontend Cache에 임시 저장합니다.

Browser Storage는 Backend의 저장소를 대체하기 위한 목적이 아니라  

페이지 이동 중 필요한 UI 상태를 유지하기 위한 용도로 사용합니다.

---

# 프로젝트 구조

```text

src

├── api

│   └── bannanaApi.js

│

├── components

│   ├── common

│   │   ├── LocationSearch.jsx

│   │   └── WeatherMapEffect.jsx

│   │

│   ├── map

│   │   └── KakaoMap.jsx

│   │

│   └── result

│

├── data

│   ├── mockData.js

│   └── roomStorage.js

│

├── pages

│   ├── HomePage.jsx

│   ├── CreateRoomPage.jsx

│   ├── ShareRoomPage.jsx

│   ├── RoomStatusPage.jsx

│   ├── CalculationLoadingPage.jsx

│   ├── ResultPage.jsx

│   ├── ConfirmedRoomPage.jsx

│   ├── JoinRoomPage.jsx

│   ├── ParticipantWaitingPage.jsx

│   ├── ParticipantConfirmedPage.jsx

│   ├── QuickPage.jsx

│   ├── QuickOriginsPage.jsx

│   ├── QuickLoadingPage.jsx

│   ├── QuickResultPage.jsx

│   └── QuickConfirmedPage.jsx

│

├── App.jsx

├── main.jsx

└── index.css

```

---

# 환경 변수

Frontend에서는 Kakao Maps JavaScript SDK와 Backend 주소를 환경변수로 관리합니다.

`.env` 예시:

```env

VITE_API_BASE_URL=http://localhost:8080

VITE_KAKAO_JAVASCRIPT_KEY=YOUR_KAKAO_JAVASCRIPT_KEY

```

실제 API Key가 포함된 `.env` 파일은 Git에 Commit하지 않습니다.

`.env.example`에는 실제 Key 대신 다음과 같이 변수 이름만 작성합니다.

```env

VITE_API_BASE_URL=http://localhost:8080

VITE_KAKAO_JAVASCRIPT_KEY=

```

Backend의 Kakao REST API Key, ODsay API Key, 기상청 API Key 설정 방법은  

`backend/README.md`를 참고합니다.

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

## 3. Production Build 확인

```bash

npm run build

```

---

# Backend 실행

Backend는 프로젝트의 `backend` 디렉터리에서 실행합니다.

```bash

cd backend

./gradlew bootRun

```

Windows PowerShell:

```powershell

cd backend

.\gradlew.bat bootRun

```

기본 Backend 주소:

```text

http://localhost:8080

```

Backend 실행에 필요한 API Key 설정은  

`backend/README.md`를 참고합니다.

---

# 배포 시 확인 사항

Frontend를 배포할 때는 최소 다음 환경변수를 설정해야 합니다.

```text

VITE_API_BASE_URL

VITE_KAKAO_JAVASCRIPT_KEY

```

`VITE_API_BASE_URL`에는 로컬 개발 주소인

```text

http://localhost:8080

```

이 아니라 **실제로 배포된 Backend 서버 주소**를 입력해야 합니다.

또한 Kakao Maps JavaScript SDK 사용을 위해  

Kakao Developers에 실제 Frontend 배포 도메인이 등록되어 있어야 합니다.

---

# 배포 후 확인 Flow

배포가 완료된 후에는 다음 전체 흐름을 확인합니다.

### Host Flow

```text

방 생성

→ 호스트 출발지 입력

→ 초대 링크 생성

→ 참여자 참여

→ 참여 현황 확인

→ 중간 지점 계산

→ 추천 장소 확인

→ 장소 선택

→ 최종 결과 확인

```

### Participant Flow

```text

초대 링크 접속

→ 이름 및 출발지 입력

→ 결과 대기

→ 최종 장소 확인

```

### Quick Flow

```text

약속 조건 입력

→ 참여자 출발지 입력

→ 중간 지점 계산

→ 추천 장소 확인

→ 장소 선택

→ 최종 결과 확인

```

---

# 브랜치

프로젝트 개발 과정에서는 기능별 브랜치를 사용했습니다.

```text

main

frontend

room-service

recommendation-service

```

Frontend의 주요 개발은 `frontend` 브랜치에서 진행되었으며,  

Backend 통합 후 최종 코드는 `main` 브랜치에 통합합니다.

---

# 참고

- Frontend 개발 서버 기본 포트: `5173`

- Backend 개발 서버 기본 포트: `8080`

- 실제 API Key가 포함된 `.env`는 Git에 Commit하지 않습니다.

- Backend API의 자세한 명세와 실행 방법은 `backend/README.md`를 참고합니다.