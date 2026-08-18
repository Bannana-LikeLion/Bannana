# Bannana Backend

약속방/참여자 관리, 외부 API 연동, 중간 지점 추천 알고리즘을 담당하는 단일 Spring Boot 앱입니다.

원래 `room-service`와 추천 알고리즘 서비스가 따로 개발되다가 하나의 앱으로 합쳐졌습니다.

## 담당 기능

- 약속방 생성 및 참여자 관리
- 기상청 단기예보 조회
- Kakao Local 기반 주변 장소 검색
- 중간 지점 후보 추천 (ODsay 대중교통 이동시간 기반)

## Tech Stack

| 구분 | 기술 |
| --- | --- |
| Language | Java 21 |
| Framework | Spring Boot 4.1.0 |
| Web | Spring Web MVC |
| Data | Spring Data JPA |
| Validation | Spring Validation |
| JSON | Jackson Databind |
| DB | H2, MySQL Connector/J |
| Build | Gradle Wrapper |
| Utility | Lombok |

외부 API:

- 기상청 단기예보 조회서비스
- Kakao Local API

## Project Structure

```text
src/main/java/com/bannana/backend
├── BackendApplication.java
├── room
├── weather
├── place
└── recommendation
```

- `room`: 약속방 생성, 호스트 등록, 참여자 등록/수정, 참여 현황 조회
- `weather`: 위도/경도를 KMA 격자로 변환하고 단기예보를 조회
- `place`: Kakao Local API로 주변 장소를 검색하고 응답을 정리
- `recommendation`: 출발지 중심점 계산 → 후보 역 선정 → ODsay 이동시간 조회 → gap 기준 상위 3곳 선정 (DB를 쓰지 않는 stateless 모듈)

## API

### Room

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/rooms` | 약속방 생성 |
| POST | `/rooms/{roomId}/host` | 호스트 출발지 등록 및 초대 링크 반환 |
| POST | `/rooms/{roomId}/participants` | 참여자 등록 |
| PATCH | `/rooms/{roomId}/participants/{participantId}` | 참여자 출발지 수정 |
| GET | `/rooms/{roomId}/status` | 참여 현황 조회 |

- 한 방의 최대 참여 인원은 6명입니다.
- HOST는 1명만 허용됩니다.
- 잘못된 `roomId` 또는 `participantId` 접근은 예외로 처리됩니다.
- 호스트 등록 응답에는 초대 링크가 포함되며, 기본 형식은 `http://localhost:5173/invite/{roomId}` 입니다.
- `placeTypes`는 `PlaceType` 기준으로 `CAFE`, `RESTAURANT`, `EXHIBITION`, `SHOPPING`, `PARK` 를 받을 수 있습니다.

### Weather

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/weather?lat=&lng=&datetime=` | 약속 시간의 기상청 단기예보 조회 |

- `lat`, `lng`, `datetime` 는 필수입니다.
- 위도/경도를 KMA nx/ny 격자로 변환해서 조회합니다.
- `TMP`, `POP`, `PTY`, `SKY` 값을 기반으로 `CLEAR`, `RAIN`, `SNOW` 상태를 반환합니다.
- 응답에는 `condition`, `conditionText`, `temperature`, `precipitationProbability`, `forecastDateTime` 이 포함됩니다.
- 기상청 오류 응답과 조회 실패를 처리합니다.

### Place

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/places/nearby?lat=&lng=&types=` | 주변 장소 검색 |

- 지원하는 `types` 는 `CAFE`, `RESTAURANT`, `EXHIBITION` 입니다.
- 카카오 카테고리 매핑은 `CAFE -> CE7`, `RESTAURANT -> FD6`, `EXHIBITION -> CT1` 입니다.
- 여러 타입은 `,` 로 구분해서 전달할 수 있습니다.
- 중복 `place id` 는 제거하고, 거리순으로 정렬합니다.
- 응답에는 장소 이름, 카테고리, 주소, 도로명주소, 위도/경도, 거리, 전화번호, 카카오맵 상세 URL 이 포함됩니다.

### Recommendation

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/recommendations` | 참여자 출발지로부터 공평한 중간 지점 후보 3곳 계산 |

요청/응답 스키마는 프론트와 합의된 계약이라 임의로 바꾸지 않습니다.

```json
{
  "participants": [
    {"nickname": "김보경", "origin_lat": 37.5665, "origin_lng": 126.9780,
     "transport_mode": "transit", "max_travel_min": 40}
  ],
  "place_types": ["cafe", "restaurant"],
  "datetime": "2026-08-14T19:00:00"
}
```

```json
{
  "candidates": [
    {"name": "성수역", "lat": 37.5446, "lng": 127.0559,
     "travel_times": {"김보경": 34, "송현석": 37, "이지은": 39}, "gap_minutes": 5}
  ]
}
```

- 처리 순서: 출발지 단순 평균으로 중심점 계산 → 주변 지하철역 6~10곳 후보 선정 → (후보 × 참여자) ODsay 대중교통 이동시간 병렬 조회 → `gap_minutes`(최대-최소) 오름차순 상위 3곳.
- 후보 역 선정은 `bannana.recommendation.station-provider`로 전환합니다. `auto`(기본, 카카오 실시간 검색 후 실패 시 정적 목록 폴백) / `kakao` / `static`.
- **부분 실패는 전체를 실패시키지 않습니다.** ODsay 조회에 실패한 (참여자 × 후보) 조합만 빠지고, 해당 참여자는 그 후보의 `travel_times`에서 제외됩니다. 한 후보의 모든 조합이 실패하면 그 후보만 빠지고, 후보가 하나도 남지 않으면 502입니다.
- 오류 응답은 `{"error": "...", "message": "..."}` 형태로, room/weather/place의 `ApiErrorResponse`와 형태가 다릅니다. 통일하려면 프론트와 합의가 필요합니다.
- `datetime`, `place_types`는 계약 유지를 위해 받기만 하고 계산에는 쓰지 않습니다(ODsay 경로검색에 출발시각 파라미터가 없고, 장소 검색은 `place` 모듈 담당).
- `max_travel_min`은 soft 필터입니다. 초과 참여자가 있는 후보는 뒤로 밀리되 후보가 모자라면 채워집니다.

## Environment Variables

| Name | Description |
| --- | --- |
| `KMA_SERVICE_KEY` | 기상청 단기예보 조회서비스 인증키 |
| `KAKAO_REST_API_KEY` | Kakao Local API 인증키 (주변 장소 검색 + 후보 역 검색 공용) |
| `ODSAY_API_KEY` | ODsay 대중교통 경로검색 인증키. **URL 인코딩 전 원본 값**을 넣어야 합니다 |

IntelliJ `Run Configuration` 에서 환경 변수를 설정할 수 있습니다.

## Run

필수 환경:

- Java 21
- Spring Boot 프로젝트
- Gradle Wrapper

Windows 기준 실행:

```bash
./gradlew.bat bootRun
```

또는 IntelliJ에서 `BackendApplication` 을 실행합니다.

## 현재 구현 상태

- Room/Participant: 약속방 생성, 호스트 출발지 등록, 참여자 등록, 참여자 출발지 수정, 참여 현황 조회
- Weather: 기상청 단기예보 실연동
- Place: Kakao Local 실연동
- Recommendation: 중간지점 계산, 후보 역 선정, ODsay 대중교통 이동시간 조회, gap 기준 상위 3곳 선정

### 아직 없는 것

- **출발지 좌표 변환(지오코딩)**: 참여자는 `originText`만 저장되고 `originLat`/`originLng`는 `null`로 남습니다.
  `/recommendations`는 좌표가 필수라, 이 단계가 생기기 전까지는 방 데이터로 추천을 호출할 수 없습니다.
- **CORS 설정**: 프론트(`:5173`)에서 호출하려면 필요합니다.
- **확정(Confirm) 엔드포인트**: `RoomStatus.CLOSED`가 정의만 되어 있고 사용되지 않습니다.
- **참여자 제출 여부**: 참여자 row 생성 = 제출로 취급되어, "아직 제출 안 한 참여자"를 표현할 수 없습니다.
- `/places/nearby`는 `SHOPPING`, `PARK`를 지원하지 않지만 방 생성 시에는 허용됩니다.
