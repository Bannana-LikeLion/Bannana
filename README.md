# Bannana Room Service

약속방 생성, 호스트 등록, 참여자 등록, 출발지 수정, 참여 현황 조회를 제공하는 `room-service` 백엔드입니다.

프론트엔드에서 방을 만들고 초대 링크로 참여자를 받는 MVP 흐름에 맞춰 구현되어 있습니다.

## 담당 기능

- 약속방 생성
- 호스트 출발지 등록 및 초대 링크 반환
- 일반 참여자 등록
- 참여자 출발지 수정
- 약속방 참여 현황 조회

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Language | Java 21 |
| Framework | Spring Boot 4.1.0 |
| Web | Spring Web MVC |
| Data | Spring Data JPA |
| Validation | Spring Validation |
| DB | H2 (로컬 MVP), MySQL Connector 포함 |
| Build | Gradle |

> 현재 로컬 개발과 테스트는 H2 인메모리 DB를 사용합니다.
> MySQL Connector는 남겨 두었고, 이후 운영 DB 전환을 고려한 구조를 유지합니다.

## 프로젝트 구조

```text
src/main/java/com/bannana/backend
├── BackendApplication.java
└── room
    ├── controller
    ├── dto
    ├── entity
    ├── exception
    ├── repository
    └── service
```

## 도메인

### Entity

- `Room`
- `Participant`

### Enum

- `RoomStatus`
  - `OPEN`
  - `CLOSED`
- `ParticipantRole`
  - `HOST`
  - `PARTICIPANT`
- `TransportMode`
  - `TRANSIT`
  - `CAR`
  - `WALK`
- `PlaceType`
  - `CAFE`
  - `RESTAURANT`
  - `EXHIBITION`
  - `SHOPPING`
  - `PARK`

## API 목록

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/rooms` | 약속방 생성 |
| POST | `/rooms/{roomId}/host` | 호스트 및 출발지 등록 |
| POST | `/rooms/{roomId}/participants` | 일반 참여자 등록 |
| PATCH | `/rooms/{roomId}/participants/{participantId}` | 참여자 출발지 수정 |
| GET | `/rooms/{roomId}/status` | 약속방 참여 현황 조회 |

## API 상세

### 1. POST `/rooms`

약속방을 생성합니다.

저장 정보:

- 약속방 이름
- 약속 날짜
- 약속 시간
- 이동수단
- 장소 유형

#### Request

```json
{
  "title": "금요일 저녁 모임",
  "meetingDate": "2026-08-22",
  "meetingTime": "19:00:00",
  "transportMode": "transit",
  "placeTypes": ["카페", "식당"]
}
```

#### Response

```json
{
  "roomId": 1,
  "title": "금요일 저녁 모임",
  "meetingDate": "2026-08-22",
  "meetingTime": "19:00:00",
  "transportMode": "TRANSIT",
  "placeTypes": ["CAFE", "RESTAURANT"],
  "status": "OPEN",
  "createdAt": "2026-08-17T14:04:04.06859"
}
```

### 2. POST `/rooms/{roomId}/host`

호스트 이름과 출발지를 등록하고, 초대 링크를 반환합니다.

제약:

- 한 방에 HOST는 1명만 허용
- 이미 호스트가 있으면 `409 Conflict`

초대 링크는 MVP 기준으로 다음 형식입니다.

```text
http://localhost:5173/invite/{roomId}
```

#### Request

```json
{
  "name": "박지수",
  "originText": "서울 서초구 방배동",
  "originLat": null,
  "originLng": null
}
```

#### Response

```json
{
  "participantId": 1,
  "inviteUrl": "http://localhost:5173/invite/1"
}
```

### 3. POST `/rooms/{roomId}/participants`

일반 참여자를 등록합니다.

저장 정보:

- 이름
- 출발지
- 위도
- 경도

`originLat`, `originLng`는 nullable이며, 주소 -> 좌표 변환은 아직 구현하지 않았습니다.

#### Request

```json
{
  "name": "송현석",
  "originText": "서울 강남구 역삼동",
  "originLat": null,
  "originLng": null
}
```

#### Response

```json
{
  "participantId": 2,
  "name": "송현석",
  "originText": "서울 강남구 역삼동",
  "role": "PARTICIPANT"
}
```

### 4. PATCH `/rooms/{roomId}/participants/{participantId}`

참여자의 출발지를 수정합니다.

수정 가능 정보:

- `originText`
- `originLat`
- `originLng`

검증:

- room 존재 확인
- participant 존재 확인
- participant가 해당 room에 속해 있는지 확인

#### Request

```json
{
  "originText": "서울 송파구 잠실동",
  "originLat": null,
  "originLng": null
}
```

#### Response

```json
{
  "participantId": 2,
  "name": "송현석",
  "originText": "서울 송파구 잠실동",
  "role": "PARTICIPANT"
}
```

### 5. GET `/rooms/{roomId}/status`

프론트엔드 Polling 용도로 사용되는 참여 현황 조회 API입니다.

반환 정보:

- 약속방 정보
- HOST
- 일반 참여자 목록
- joinedCount

`joinedCount`에는 HOST도 포함됩니다.

#### Response

```json
{
  "roomId": 1,
  "title": "금요일 저녁 모임",
  "status": "OPEN",
  "host": {
    "participantId": 1,
    "name": "박지수",
    "originText": "서울 서초구 방배동",
    "role": "HOST"
  },
  "participants": [
    {
      "participantId": 2,
      "name": "송현석",
      "originText": "서울 강남구 역삼동",
      "role": "PARTICIPANT"
    }
  ],
  "joinedCount": 2
}
```

## 실행 방법

### 1. 빌드

```bash
./gradlew build
```

### 2. 애플리케이션 실행

```bash
./gradlew bootRun
```

기본 실행 포트는 `8080`입니다.

### 3. H2 콘솔

로컬 MVP 테스트용 H2 콘솔은 다음 설정으로 접근할 수 있습니다.

- URL: `jdbc:h2:mem:backend`
- Username: `sa`
- Password: 없음
- Console path: `/h2-console`

## IntelliJ HTTP Client 테스트

프로젝트 루트의 `room-service.http` 파일을 IntelliJ HTTP Client에서 실행하면 API를 순서대로 테스트할 수 있습니다.

테스트 흐름:

1. 방 생성
2. 생성된 `roomId`로 호스트 등록
3. 같은 `roomId`로 참여자 등록
4. 생성된 `participantId`로 출발지 수정
5. 마지막으로 status 조회

실행 방법:

1. IntelliJ에서 `room-service.http`를 연다.
2. 각 요청 블록 왼쪽의 실행 버튼을 누른다.
3. 상단부터 순서대로 실행하면 `client.global` 변수로 `roomId`, `participantId`가 자동 저장된다.

## 현재 구현 범위

현재 구현된 범위는 아래 5개 API입니다.

- `POST /rooms`
- `POST /rooms/{roomId}/host`
- `POST /rooms/{roomId}/participants`
- `PATCH /rooms/{roomId}/participants/{participantId}`
- `GET /rooms/{roomId}/status`

## 아직 구현하지 않은 기능

아래 기능은 아직 포함하지 않았습니다.

- 중간지점 계산
- recommendation-service 연동
- 카카오 API
- 주소 -> 좌표 변환
- 장소 검색
- ODsay API
- 날씨 API
- WebSocket
- SSE
- JWT
- 로그인 / 회원가입

향후 필요 시 별도 단계로 추가합니다.

## 검증

로컬 기준으로 아래 항목을 확인했습니다.

- `./gradlew build` 성공
- Spring Boot 애플리케이션 실행 성공
- 5개 API 동작 확인
- 주요 예외 응답 확인

