# 반나나(Bannana)

참여자 모두에게 이동시간이 공평한 약속 장소를 찾아주는 서비스.

```
bannana/
├─ backend/    Spring Boot 단일 앱 (방·참여자, 날씨, 주변 장소, 추천 알고리즘)
└─ frontend/   React + Vite
```

## 실행

### backend

```bash
cd backend
./gradlew bootRun
```

`http://localhost:8080`. API 키는 환경변수로 넣는다.

```bash
export KAKAO_REST_API_KEY=...   # 카카오 REST API 키 (장소 검색 + 후보 역 검색에 공용)
export ODSAY_API_KEY=...        # ODsay 키 (인코딩 전 원본 값)
export KMA_SERVICE_KEY=...      # 기상청 단기예보 키
```

PowerShell:

```powershell
$env:KAKAO_REST_API_KEY="..."; $env:ODSAY_API_KEY="..."; $env:KMA_SERVICE_KEY="..."; ./gradlew bootRun
```

키가 없어도 앱은 뜬다. 해당 기능만 502를 반환한다.

### frontend

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173`.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/rooms` | 약속방 생성 |
| POST | `/rooms/{roomId}/host` | 방장 등록 (초대 URL 반환) |
| POST | `/rooms/{roomId}/participants` | 참여자 등록 |
| PATCH | `/rooms/{roomId}/participants/{participantId}` | 출발지 수정 |
| GET | `/rooms/{roomId}/status` | 참여 현황 |
| GET | `/weather?lat=&lng=&datetime=` | 약속 시간 날씨 |
| GET | `/places/nearby?lat=&lng=&types=` | 주변 장소 (CAFE / RESTAURANT / EXHIBITION) |
| POST | `/recommendations` | 중간 지점 후보 3곳 계산 |

`/recommendations`의 입출력 스키마는 프론트와 합의된 계약이라 임의로 바꾸지 않는다.
자세한 내용은 [backend/README.md](backend/README.md).

## 아직 연결되지 않은 부분

세 파트를 한 레포로 합쳤을 뿐, **아직 서로 호출하지 않는다.** 데모를 돌리려면 아래가 필요하다.

1. **프론트엔드 API 연동** — 현재 `src/data/mockData.js` + `localStorage`만 사용하며 네트워크 호출이 0건이다.
2. **CORS 설정** — 백엔드에 `Access-Control-*` 헤더가 없어 브라우저에서 `5173 → 8080` 호출이 차단된다.
3. **출발지 좌표 변환(지오코딩)** — 참여자는 `originText`("수원역")만 저장되고 좌표는 `null`로 남는다.
   `/recommendations`는 좌표가 필수라 이 단계 없이는 추천을 호출할 수 없다.
4. **추천 호출 주체 결정** — 프론트가 직접 `/recommendations`를 부를지, 방 상태에서 서버가 부를지 미정.
5. **초대 링크 규격** — 백엔드는 `/invite/{roomId}`를 생성하는데 프론트 라우트는 `/join/:inviteCode`다.
6. **확정(Confirm) 기능** — 프론트에 확정 화면 3개가 있으나 대응 엔드포인트가 없고, `RoomStatus.CLOSED`는 사용되지 않는다.
7. **참여자 "제출 여부"** — 프론트는 "3/4 제출" 대기 화면을 전제하지만 백엔드에는 제출 여부 개념이 없다.
8. **PARK / SHOPPING 카테고리** — 방 생성 시에는 통과하지만 `/places/nearby`는 400을 반환한다.

## 참고

- H2 인메모리 + `ddl-auto: create-drop`이라 재시작하면 방 데이터가 사라진다. `h2-console`도 열려 있으니 배포 전에 정리할 것.
- `backend`는 Jackson 2와 3을 함께 싣고 있다. place/weather 클라이언트가 Jackson 2 API를 직접 쓰기 때문이며, Jackson 3으로 옮기면 의존성을 지울 수 있다.
