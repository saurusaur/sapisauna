# Storage 전략 분석: localStorage vs DB

> 분석일: 2026-03-06
> 목적: 각 데이터의 성격에 맞는 저장소를 결정하여 장기적 아키텍처 수립

---

## 판단 기준

| 기준 | localStorage | DB (Supabase) |
|------|-------------|---------------|
| 기기 간 동기화 | X | O |
| 유저가 앱 삭제/브라우저 초기화 시 | 소멸 | 유지 |
| 용량 | ~5MB 제한 | 사실상 무제한 |
| 속도 | 즉시 (로컬) | 네트워크 의존 |
| 비로그인 사용 | O | X (인증 필요) |
| 분석/통계 활용 | X | O |

**핵심 질문**: "유저가 폰을 바꿔도 이 데이터가 살아있어야 하는가?"
- Yes -> DB
- No -> localStorage (또는 sessionStorage)

---

## 현재 localStorage 키 전수 분석

### 1. `currentLog` — 기록 중 임시 데이터

**현재**: log -> deep -> story -> complete 플로우에서 단계별 데이터 누적
**사용 파일**: log, log/deep, story, story/edit, complete, history/[id] (8개)

| 기준 | 판정 |
|------|------|
| 기기 동기화 필요? | X (작성 중인 임시 데이터) |
| 삭제 시 손실 영향? | 낮음 (완성 전 데이터) |
| 비로그인 사용? | O (기록 플로우 진입 가능해야 함) |

**결론: localStorage 유지 (또는 sessionStorage 전환)**

sessionStorage가 더 적합한 이유:
- 탭 닫으면 자동 정리 (좀비 데이터 방지)
- 다른 탭에서 간섭 없음
- 단, "작성 중 실수로 탭 닫음" 시 복구 불가 -> 트레이드오프

**추천**: localStorage 유지하되 complete 후 즉시 삭제 (현재 이미 구현됨). 변경 불필요.

---

### 2. `selectedPlace` — 장소 선택 후 전달

**현재**: place/add, explore/[id]에서 선택 -> log 페이지로 전달
**사용 파일**: place, place/add, explore/[id], log (5개)

| 기준 | 판정 |
|------|------|
| 기기 동기화 필요? | X (페이지 이동 중 임시) |
| 수명 | 수초~수분 |

**결론: localStorage 유지**

이상적으로는 URL searchParams(`/log?placeId=xxx&placeName=yyy`)나 React Context가 더 깔끔하지만, 현재 동작에 문제 없음. 리팩토링 우선순위 낮음.

---

### 3. `user` — 유저 프로필

**현재**: DB에서 로드 + localStorage 캐시 + 오프라인 폴백
**사용 파일**: user-context, auth-context, onboarding (3개)

| 기준 | 판정 |
|------|------|
| 기기 동기화 필요? | O (프로필은 어디서든 동일해야) |
| 삭제 시 손실 영향? | 중간 (DB가 원본이므로 재로드 가능) |
| 분석 활용? | O (유저 세그먼트) |

**현재 문제**:
- DB가 원본인데 localStorage도 write -> 두 곳의 sync 문제 가능
- 설정 변경 시 localStorage만 업데이트하고 DB 반영 누락 가능성
- onboarding에서 localStorage에 먼저 쓰고 DB는 나중 -> 실패 시 불일치

**결론: DB를 single source of truth로. localStorage 캐시 제거**

로드 전략:
1. 앱 시작 -> Supabase session 확인 -> DB에서 프로필 로드
2. 로딩 중 스켈레톤 표시 (현재 이미 있음)
3. 오프라인 대응은 PWA service worker 캐시로 해결 (미래)

**백로그 상태**: P2로 등록 완료

---

### 4. `favorites` — 즐겨찾기

**현재**: 완전 localStorage 기반. use-favorites.ts 훅으로 관리.
**사용 파일**: use-favorites, explore 3페이지, place-card (6개)

| 기준 | 판정 |
|------|------|
| 기기 동기화 필요? | O (핵심 유저 데이터) |
| 삭제 시 손실 영향? | 높음 (유저가 직접 큐레이션한 데이터) |
| 분석 활용? | O (인기 장소 파악, 추천 알고리즘) |
| 비로그인 사용? | 가능하면 좋음 |

**결론: DB 전환 필수**

DB 스키마 제안:
```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id, collection_name)
);
```

전환 전략:
- Phase 1: DB 테이블 생성 + 서비스 함수
- Phase 2: use-favorites 훅 내부를 DB 호출로 교체 (외부 인터페이스 동일)
- Phase 3: 비로그인 시 localStorage 폴백 유지 -> 로그인 시 DB로 머지

**백로그 상태**: 미등록 (기존 "장소 찜 시스템 P2"에 병합 권장)

---

### 5. `lastBathGender` — 마지막 탕 성별

**현재**: deep log 작성 시 이전 선택을 기본값으로 복원
**사용 파일**: log/deep/page.tsx (1개)

| 기준 | 판정 |
|------|------|
| 기기 동기화 필요? | 약간 (편의 기능) |
| 삭제 시 손실 영향? | 매우 낮음 (다시 선택하면 됨) |

**결론: localStorage 유지**

유저 선호(preference) 데이터로 볼 수 있지만, 단일 값이고 손실 영향이 거의 없음.
미래에 "유저 설정" 테이블을 만들면 그때 포함시키면 충분.

---

## 최종 요약

| 키 | 현재 | 권장 | 우선순위 | 비고 |
|----|------|------|----------|------|
| `currentLog` | localStorage | **localStorage 유지** | - | 임시 플로우 데이터 |
| `selectedPlace` | localStorage | **localStorage 유지** | - | 페이지 간 전달용 |
| `user` | localStorage + DB | **DB only** | P2 | 백로그 등록됨 |
| `favorites` | localStorage only | **DB (+ 비로그인 폴백)** | P2 | 기존 찜 시스템 항목에 병합 |
| `lastBathGender` | localStorage | **localStorage 유지** | - | 손실 영향 극소 |

### 변경 필요: 2건
1. **user**: localStorage 캐시 제거, DB single source of truth (백로그 P2)
2. **favorites**: DB 전환 + 비로그인 폴백 (기존 백로그 P2 "찜 시스템"에 포함)

### 변경 불필요: 3건
- `currentLog`, `selectedPlace`, `lastBathGender`는 localStorage가 적합

---

## 미래 고려사항

### user_preferences 테이블 (P3)
유저별 설정이 늘어나면 (테마, 단위, 기본 통화, lastBathGender 등) 한 테이블로 통합:
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  default_currency TEXT DEFAULT 'KRW',
  last_bath_gender TEXT,
  theme TEXT DEFAULT 'light',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
현재는 설정 항목이 1개뿐이라 시기상조. 3개 이상 모이면 도입.

### 오프라인 지원 (P3)
PWA 오프라인 시 localStorage/IndexedDB에 임시 저장 -> 온라인 복귀 시 DB sync.
이건 "PWA 오프라인 지원" 백로그 항목과 함께 설계할 사안.
