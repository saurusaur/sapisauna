# Phase 3 Devil's Advocate Review

**Commit**: `d3ffda4` — refactor: Phase 3 타입 정리 + UX 에러 처리 + 피드백 개선
**Date**: 2026-03-06
**Reviewer**: Claude (비판적 관점)

---

## 1. FacilityType / BathGender 타입 추출

### 잘 된 점
- `FacilityType`과 `BathGender`를 `src/types/index.ts`에 중앙 집중화하여 7개 파일에서 일관되게 참조
- `Place.facility_type`과 `LogWithPlace.deep_log.bath_gender`에 타입 적용 완료
- `logs-service.ts`, `places-service.ts`에서 `as FacilityType`, `as BathGender` 캐스팅 적용

### 비판

**[MEDIUM] 타입 안전성이 반쪽짜리**
- `explore/page.tsx:148-151`에 하드코딩 리터럴 배열이 남아 있음:
  ```ts
  ['male-only', 'female-only', 'private-bath', 'mixed-bath'].includes(f)
  ```
  FacilityType에서 값이 추가/변경되면 이 배열은 자동으로 업데이트되지 않음. `PLACE_BATH_TYPE`이나 `EXPLORE_FILTERS.GENDER.options`를 참조하도록 해야 일관성 보장.

**[LOW] `as FacilityType` / `as BathGender` 캐스팅 남용**
- `deep/page.tsx:53`, `deep/page.tsx:68`, `deep/page.tsx:152`, `place/add/page.tsx:357` 등에서 `as BathGender`, `as FacilityType` 강제 캐스팅. DB나 localStorage에서 예상 외 값이 오면 런타임에 타입과 실제 값이 불일치. validation guard 없이 캐스팅만 하면 타입 시스템의 보호 효과가 없음.

**[LOW] `PLACE_BATH_TYPE`과 `FacilityType`의 이중 관리**
- `content.ts:44-50`의 `PLACE_BATH_TYPE` 배열 id와 `types/index.ts:16`의 `FacilityType` 유니온이 수동으로 동기화됨. 한쪽만 수정하면 다른 쪽은 컴파일 에러가 나긴 하지만, `as const` + `typeof`로 단일 소스에서 파생하는 게 더 안전.

---

## 2. facility_type 값 rename (public -> gender-bath 등)

### 비판

**[CRITICAL] 기존 DB 데이터 마이그레이션 부재**
- 스키마 파일(`001_schema.sql`)의 CHECK 제약만 변경했고, **기존 행의 값은 변환하지 않음**.
- 이미 DB에 `'public'`, `'private'`, `'mixed'` 값으로 저장된 행이 있으면:
  1. CHECK 제약 변경 시 (`ALTER TABLE`) 기존 행이 제약 위반으로 실패
  2. `toPlace()`에서 `(row.facility_type as FacilityType) || 'gender-bath'`로 폴백하므로 old 값은 무시되지만, 원본 데이터가 손실됨
- **필요한 작업**: `UPDATE places SET facility_type = 'gender-bath' WHERE facility_type = 'public'` 등의 마이그레이션 SQL. 현재 완전히 누락.

**[HIGH] 스키마 파일이 마이그레이션 도구가 아님**
- `001_schema.sql`은 `CREATE TABLE IF NOT EXISTS`로 작성됨 — 이미 테이블이 존재하면 실행해도 컬럼 변경이 적용되지 않음. 기존 환경에서 이 스키마를 다시 실행해도 CHECK 제약은 바뀌지 않음.
- 별도 `ALTER TABLE` 마이그레이션 스크립트가 필요하나 없음.

**[MEDIUM] `places-service.ts:27` 폴백값의 의미 변화**
- `(row.facility_type as FacilityType) || 'gender-bath'` — `facility_type`이 NOT NULL DEFAULT이므로 `||` 폴백이 실행될 일이 원래 없음. 하지만 old DB에 `'public'` 값이 남아 있으면 falsy가 아니라 truthy이므로 `'public'`이 그대로 `FacilityType`으로 캐스팅됨. 런타임에 `'public'`이라는 유효하지 않은 값이 돌아다니게 됨.

---

## 3. 온보딩 에러 처리

### 잘 된 점
- `nicknameStatus`에 `'error'` 상태 추가 — 네트워크 실패 시 사용자에게 피드백
- UNIQUE 제약 위반(23505) 시 닉네임 단계로 복귀 + duplicate 표시
- `submitError` 상태로 DB 저장 실패 시 메시지 표시

### 비판

**[MEDIUM] 에러 복구 흐름 불완전**
- `submitError`가 표시되지만 재시도 버튼이 별도로 없음. "시작하기" 버튼을 다시 누르면 재시도가 되긴 하나, 에러 메시지 바로 옆에 명시적 재시도 CTA가 없어서 사용자가 인지하기 어려움.
- `setIsSubmitting(false)`는 `finally` 블록에서 처리되지만, 23505 에러로 `return`할 때 `setIsSubmitting(false)`가 호출되지 않는 경로가 있음 (line 127에서 `return` 후 `finally`가 실행되므로 실제로는 OK — 하지만 코드 리딩 시 혼란 유발).

**[MEDIUM] 닉네임 중복 체크의 TOCTOU 문제**
- 중복 체크 시점과 실제 DB upsert 시점 사이에 다른 유저가 같은 닉네임을 선점 가능. 23505 에러 핸들링으로 커버하고 있긴 하나, UX 관점에서 "사용 가능"이라고 표시한 뒤 제출 시 "이미 사용 중"으로 바뀌는 경험은 좋지 않음. 이건 구조적 한계이므로 에러 메시지에 "다른 사용자가 먼저 사용했습니다"라고 좀 더 구체적으로 안내하면 좋겠음.

**[LOW] authUser가 null인 경우 처리**
- `handleSubmit`에서 `if (authUser)` 체크가 있지만, authUser가 null이면 DB 저장을 건너뛰고 `setUser(userData)` + `router.push('/home')`으로 진행함. 온보딩 페이지에 비인증 유저가 도달할 수 없다는 전제가 있겠지만, 방어 코드가 없으면 localStorage에만 데이터가 남고 DB에는 없는 유령 유저가 생길 수 있음.

**[LOW] 닉네임 입력 후 Enter 키 미지원**
- 닉네임 입력 → 중복확인 버튼 클릭 → "다음" 버튼 클릭이라는 2단계 클릭 필요. Enter 키로 중복확인이나 다음 단계 진행이 안 됨. 3-click rule 위반까지는 아니지만 모바일에서도 키보드 "완료" 탭으로 진행 가능하면 UX 향상.

---

## 4. 스토리 공유/저장 인라인 피드백

### 잘 된 점
- `showMessage` 콜백 + 2.5초 자동 해제 타이머 — 깔끔한 구현
- success/error 색상 분리, 고정 높이(`h-6`) 영역으로 레이아웃 점프 방지
- 컴포넌트 언마운트 시 타이머 정리(`useEffect` cleanup)

### 비판

**[MEDIUM] 공유 실패 메시지가 부정확**
- `handleShare` catch에서 `'공유를 지원하지 않는 환경이에요'`라고 표시하지만, 실패 원인이 항상 Web Share API 미지원인 것은 아님. `captureCard` 실패(canvas 렌더링 에러), 네트워크 문제 등 다른 원인도 있을 수 있음. 에러 원인을 구분하지 않고 단일 메시지로 퉁치고 있음.

**[LOW] 메시지 접근성 부족**
- 피드백 메시지가 시각적으로만 표시되고 `aria-live` 영역이 아님. 스크린리더 사용자는 공유/저장 결과를 알 수 없음. PWA 타겟 앱이라 우선순위는 낮지만 기록해둘 만함.

**[LOW] 연속 클릭 시 타이머 리셋 동작**
- `clearTimeout(messageTimer.current)` 후 새 타이머 설정이므로 연속 클릭 시 마지막 메시지만 2.5초 유지. 의도된 동작이지만, 빠르게 "공유 → 저장"을 누르면 첫 번째 결과를 볼 시간이 없을 수 있음.

---

## 5. 의도치 않은 부작용 / Regression 위험

### [CRITICAL] DB 마이그레이션 없는 rename은 프로덕션 장애 유발

현재 Vercel에 배포된 프로덕션 DB에 이미 `'public'`, `'private'`, `'mixed'` 값이 있다면:
1. **새 코드는 old 값을 인식 못함** — `FacilityType`에 없는 값이 런타임에 돌아다님
2. **필터가 old 데이터를 표시 못함** — `explore/page.tsx`의 gender 필터가 `'gender-bath'` 등만 매칭하므로 old 값의 장소는 필터에서 사라짐
3. **새 장소 추가 시 old/new 값 혼재** — 기존 장소는 `'public'`, 새 장소는 `'gender-bath'`로 불일치

### [MEDIUM] `EXPLORE_FILTERS.GENDER.options`에 `'gender-bath'` 누락

`content.ts:634`의 GENDER 필터 옵션:
```ts
options: ['male-only', 'female-only', 'private-bath', 'mixed-bath']
```
`'gender-bath'`(일반 대중탕)가 필터 옵션에 없음. 이는 의도적 설계일 수 있지만 (대부분이 gender-bath이므로 필터 불필요), 사용자가 "일반 대중탕만 보기"를 원할 때 방법이 없음.

### [LOW] place/add/page.tsx의 기본값 토글 UX

`place/add/page.tsx:356-358`:
```ts
bathGender === option.id ? 'gender-bath' : option.id as FacilityType
```
같은 버튼을 다시 클릭하면 `'gender-bath'`로 리셋되는 토글 동작. 이 UX에서 "선택 해제"의 결과가 `null`이 아니라 `'gender-bath'`(일반 대중탕)라는 것이 직관적인지 의문. 사용자는 "선택 안 함"이라고 생각하지만 실제로는 "일반 대중탕 선택"이 됨.

---

## 6. 종합 판정

| 영역 | 평가 | 핵심 위험 |
|------|------|----------|
| 타입 추출 | B | 효과적이나 캐스팅 남용, 하드코딩 잔여 |
| facility_type rename | D | **마이그레이션 SQL 부재 = 프로덕션 데이터 불일치** |
| 온보딩 에러 처리 | B+ | 주요 시나리오 커버, 세부 UX 개선 여지 |
| 스토리 피드백 | A- | 깔끔한 구현, 사소한 접근성 이슈 |
| 전체 regression 위험 | **HIGH** | DB rename이 가장 큰 리스크 |

---

## 7. 권장 조치 (우선순위 순)

1. **[긴급] DB 마이그레이션 SQL 작성 + 실행**
   ```sql
   UPDATE places SET facility_type = 'gender-bath' WHERE facility_type = 'public';
   UPDATE places SET facility_type = 'private-bath' WHERE facility_type = 'private';
   UPDATE places SET facility_type = 'mixed-bath' WHERE facility_type = 'mixed';
   -- 이후 CHECK 제약 변경 (ALTER TABLE)
   ```

2. **[높음] explore/page.tsx의 하드코딩 리터럴 → 상수 참조로 교체**
   `EXPLORE_FILTERS.GENDER.options` 또는 FacilityType에서 파생된 Set 사용

3. **[중간] as 캐스팅에 런타임 validation 추가**
   ```ts
   const VALID_BATH_GENDERS = new Set(['male','female','mixed','private'])
   const validated = VALID_BATH_GENDERS.has(raw) ? raw as BathGender : null
   ```

4. **[낮음] 온보딩 Enter 키 지원, 에러 메시지 구체화

---

*이 리뷰는 코드를 직접 읽고 비판적 관점에서 작성되었습니다. 구현 품질 자체는 양호하나, DB rename 마이그레이션 누락이 프로덕션 안정성에 직접 영향을 주는 가장 큰 리스크입니다.*
