# 반나나(Bannana) — 추천 알고리즘 서비스

참여자들의 출발지를 받아 모두에게 이동시간 부담이 공평한 중간 장소 후보 3곳을 계산하는 **stateless** API.

## 실행

기본 포트는 `8081`(`application.yml`의 `server.port`).

> ODsay 키는 **인코딩 전 원본**을 넣어야 한다. 클라이언트가 호출할 때 한 번 URL 인코딩하므로,
> 이미 인코딩된 키(`%2B` 등이 들어간 값)를 넣으면 이중 인코딩으로 인증이 실패한다.

키가 없어도 애플리케이션은 뜬다. 다만 ODsay 조회가 전부 실패하므로 요청은 502로 응답한다.

## 요청 / 응답

프론트와 합의된 계약이라 필드명을 임의로 바꾸지 않는다. 바꿔야 하면 먼저 합의할 것.

```bash
curl -X POST http://localhost:8081/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {"nickname":"홍길동","origin_lat":37.5665,"origin_lng":126.9780,"transport_mode":"transit","max_travel_min":40},
      {"nickname":"김홍도","origin_lat":37.4979,"origin_lng":127.0276,"transport_mode":"transit","max_travel_min":40},
      {"nickname":"이지은","origin_lat":37.5445,"origin_lng":127.0557,"transport_mode":"transit","max_travel_min":40}
    ],
    "place_types": ["cafe","restaurant"],
    "datetime": "2026-08-14T19:00:00"
  }'
```

```json
{
  "candidates": [
    {
      "name": "성수역",
      "lat": 37.5446,
      "lng": 127.0559,
      "travel_times": { "홍길동": 34, "김홍도": 37, "이지은": 39 },
      "gap_minutes": 5
    }
  ]
}
```

### 상태 코드

| 코드 | 상황 |
| --- | --- |
| 200 | 후보 계산 성공 |
| 400 | 요청 검증 실패, 닉네임 중복, 본문 파싱 실패 |
| 405 | `POST` 외의 메서드 |
| 502 | 후보 역을 못 찾음 / 모든 후보의 이동시간 조회 실패 |


## 처리 흐름

`RecommendationService`가 명세의 1~4단계를 조립한다.

1. **중심점** — 출발지 좌표의 단순 평균 (`GeoPoint.centroid`)
2. **후보 역 선정** — `StationProvider` (기본 `auto`)
3. **이동시간 조회** — (후보 × 참여자) 조합을 `OdsayClient`로 병렬 조회
4. **점수화 / 정렬** — `CandidateScorer`가 `gap_minutes`와 합계를 계산해 상위 3곳

### 후보 역 선정: 하이브리드

`bannana.recommendation.station-provider` 값으로 전환한다.

| 값 | 동작 |
| --- | --- |
| `auto` (기본) | 카카오 실시간 검색 → 결과가 `min-candidates`에 못 미치거나 키가 없으면 정적 목록으로 폴백 |
| `kakao` | 카카오 실시간 검색만 (`KAKAO_API_KEY` 필수) |
| `static` | `StationCatalog`의 정적 목록만. 외부 의존 없이 돌릴 때 / 테스트용 |

- 카카오는 카테고리 그룹 `SW8`(지하철역)을 `sort=distance`로 검색하고, 호선별 중복(`성수역 2호선` 등)을
  이름 정규화로 합친다. 도심 밖에서는 역이 드물어 `search-radii`를 3km → 5km → 10km → 20km로 넓혀 재시도한다.
- 정적 목록은 서울/경기·인천 주요 역 약 125곳이며 좌표는 **근사값**이다. 정확한 좌표가 필요하면 카카오 경로를 쓴다.

### 부분 실패 처리

- `OdsayClient`는 **예외를 밖으로 던지지 않는다.** 타임아웃·5xx·파싱 오류·ODsay의 본문 오류(ODsay는 오류도
  HTTP 200 + `error` 필드로 내려준다)를 전부 `Optional.empty()`로 흡수한다.
- 실패한 (참여자 × 후보) 조합만 빠지고 나머지로 계산이 이어진다. 해당 참여자는 그 후보의 `travel_times`에서 빠진다.
- 한 후보의 **모든** 참여자 조회가 실패하면 그 후보만 결과에서 제외된다.
- 후보가 하나도 안 남으면 **502**.
- 전체 조회에 25초 예산을 두고, 초과하면 그때까지 모인 결과로 계산한다(전체를 실패시키지 않는다).

## 설정

`application.yml`의 `bannana.recommendation` 아래.

| 키 | 기본값 | 설명 |
| --- | --- | --- |
| `min-candidates` | 6 | 후보 역 최소 개수 (반경 확장/폴백 판단 기준) |
| `max-candidates` | 10 | 후보 역 최대 개수 |
| `top-n` | 3 | 응답에 담을 후보 수 |
| `search-radii` | 3000, 5000, 10000, 20000 | 카카오 검색 반경(m) |
| `station-provider` | `auto` | `auto` / `kakao` / `static` |
| `concurrency` | 8 | ODsay 동시 호출 수 |

## 스펙에 없어서 정한 것들

명세의 처리 순서에 언급이 없거나 외부 API 제약 때문에 판단이 필요했던 부분이다. 다르게 가야 하면 알려주면 된다.

- **`max_travel_min` — soft 필터.** 초과 참여자가 있는 후보는 뒤로 밀리지만 결과에서 완전히 빠지지는 않는다.
  `gap_minutes` 정렬은 초과 없는 후보들 사이에서 먼저 적용된다. 후보가 모자라면 초과 후보로 3개를 채운다.
  (hard 필터로 바꾸면 빈 배열이 나갈 수 있다.)
- **`datetime` — 받지만 쓰지 않는다.** ODsay `searchPubTransPathT`에 출발시각 파라미터가 없어 경로 탐색이 시간과 무관하다.
- **`place_types` — 받지만 쓰지 않는다.** 장소 검색은 다른 서비스 담당.
- **`transport_mode` — 전부 대중교통으로 계산한다.** 이동시간 계산이 ODsay 대중교통 경로검색뿐이라
  `car` / `walk`가 와도 transit 기준이며 로그만 남는다.
- **ODsay "너무 가까움" 응답 → 도보 추정치.** 참여자가 후보 역 바로 옆이면 ODsay가 경로 대신 오류를 준다.
  이걸 실패로 빼면 `gap_minutes`가 오히려 왜곡되므로 직선거리 ÷ 4km/h로 대체한다.
- **닉네임 중복 → 400.** `travel_times`가 닉네임 키라서 중복이 있으면 결과가 조용히 덮어써진다.
- **참여자 수 상한 20명.** 후보 10곳 × 20명 = 200콜이 상한선이 된다.

## 테스트

- `GeoPointTest` — 중심점 평균, 거리 계산
- `CandidateScorerTest` — `gap_minutes`, 부분 실패, 정렬 규칙, soft 필터
- `OdsayClientTest` — **SX=경도 / SY=위도 순서**, 본문 오류·5xx·빈 경로 흡수, 근거리 도보 대체
- `RecommendationServiceTest` — 상위 3곳 선정, 부분 실패 진행, 502 조건
- `RecommendationControllerTest` — 계약 스키마(snake_case) 고정, 400/502
- `RecommendationEndToEndTest` — ODsay만 스텁하고 전체 파이프라인 통과

## 구조

```
com.bannana.recommendation
├─ web/        컨트롤러, 계약 DTO, 예외 → HTTP 상태 매핑
├─ service/    오케스트레이션, 점수화, 후보 역 선정 전략
├─ client/     카카오 / ODsay 호출 (실패를 흡수하는 경계)
├─ domain/     GeoPoint, Participant, Station, ScoredCandidate, TravelTimeMatrix
└─ config/     API 키·알고리즘 파라미터 바인딩, RestClient, executor
```
