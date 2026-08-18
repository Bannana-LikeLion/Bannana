# Bannana Backend - Room Service

약속방/참여자 관리와 외부 API 연동 기능을 담당하는 `room-service` 브랜치의 백엔드입니다.

현재 이 브랜치에는 Room, Weather, Place API가 구현되어 있습니다.

## 담당 기능

- 약속방 생성 및 참여자 관리
- 기상청 단기예보 조회
- Kakao Local 기반 주변 장소 검색

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
└── place
```

- `room`: 약속방 생성, 호스트 등록, 참여자 등록/수정, 참여 현황 조회
- `weather`: 위도/경도를 KMA 격자로 변환하고 단기예보를 조회
- `place`: Kakao Local API로 주변 장소를 검색하고 응답을 정리

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

## Environment Variables

| Name | Description |
| --- | --- |
| `KMA_SERVICE_KEY` | 기상청 단기예보 조회서비스 인증키 |
| `KAKAO_REST_API_KEY` | Kakao Local API 인증키 |

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
- 제한: 중간지점 계산, 대중교통 이동시간 계산, 최종 장소 추천 알고리즘, ODsay 연동은 아직 이 브랜치에 없습니다
