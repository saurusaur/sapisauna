# safeParse 적용 중 발생한 에러 분석

## 배경: 원래 뭘 하려고 했나

`JSON.parse(localStorage.getItem('currentLog'))` 같은 코드가 5개 파일에 있었다.
localStorage 데이터가 손상되면 (예: 유저가 DevTools에서 수동 편집, 앱 업데이트로 구조 변경) `JSON.parse`가 throw → 페이지 크래시.

**목표**: try/catch를 감싼 `safeParse` 헬퍼로 교체해서, 파싱 실패 시 크래시 대신 fallback 값을 반환.

```typescript
// 만든 헬퍼
export function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try { return JSON.parse(json) } catch { return fallback }
}
```

---

## 에러 1: fallback을 `{}`로 했더니 타입 불일치

### 뭐가 문제였나

처음에 이렇게 작성:
```typescript
const log = safeParse<Record<string, unknown>>(savedLog, {})
```

그런데 아래 코드에서 `log._editId`를 `setEditId()`에 넘기면:
```typescript
if (log._editId) setEditId(log._editId)  // ❌ unknown은 string에 할당 불가
```

`Record<string, unknown>`의 값이 `unknown` 타입이라, `setEditId(string)` 같은 setter에 직접 넣을 수 없다.

또한 `safeParse<Record<string, unknown>>(savedLog, {})` 에서 `{}`는 `Record<string, unknown>` 타입이 아니라 `{}` 타입으로 추론되어 타입 에러.

### 어떻게 해결했나

fallback을 `null`로 바꾸고 null-check를 추가:
```typescript
const logRaw = safeParse<Record<string, unknown> | null>(savedLog, null)
if (!logRaw) return
```

### 왜 이 방식을 선택했나

- `null` fallback은 "파싱 실패 = 데이터 없음"이라는 의미가 명확
- null-check 후 early return으로 이후 코드가 깔끔

---

## 에러 2: `Record<string, unknown>`에서 프로퍼티 접근 불가

### 뭐가 문제였나

null 문제는 해결했지만, 여전히 값이 `unknown`:
```typescript
const logRaw = safeParse<Record<string, unknown> | null>(savedLog, null)
if (!logRaw) return
// logRaw._editId의 타입은 unknown
setEditId(logRaw._editId)  // ❌ unknown → string 불가
setRevisit(logRaw.revisit_score)  // ❌ unknown → number 불가
```

이 문제가 `log/page.tsx`에서 20군데 이상 발생. 모든 setter 호출에 영향.

### 어떻게 해결했나

**파일별로 다른 전략을 사용함 (이것이 문제):**

| 파일 | 전략 | 코드 |
|------|------|------|
| `log/page.tsx` | `as Record<string, any>` 캐스팅 | `const log = logRaw as Record<string, any>` |
| `log/deep/page.tsx` | 각 프로퍼티마다 `as` 캐스팅 | `dl.companion as string` |
| `complete/page.tsx` | 구체적 타입 지정 | `safeParse<CompletedLog \| null>` |
| `story/edit/page.tsx` | 구체적 타입 지정 | `safeParse<LogData \| null>` |
| `story/page.tsx` | 그냥 null fallback | `safeParse(logData, null)` → any 추론 |

### 왜 이렇게 됐나

**원래 `JSON.parse()`는 `any`를 반환한다.** TypeScript에서 `any`는 어떤 타입에든 할당 가능하므로, 아무 setter에나 바로 넣어도 에러가 안 났다.

`safeParse`는 제네릭 `<T>`를 사용하므로 반환 타입이 명시적. `Record<string, unknown>`으로 하면 안전하지만, 기존 코드의 20+개 프로퍼티 접근이 전부 깨진다.

### 근본 원인

**`currentLog`라는 localStorage 키에 저장되는 데이터의 타입이 정의되어 있지 않다.**

현재 `currentLog`에는 이런 데이터가 들어감:
- `place_id`, `place_name` (장소)
- `tribe_id`, `revisit_score` (퀵로그)
- `sauna_temp`, `cold_bath_temp`, `totono_score` (사우너파)
- `hot_bath_temp`, `water_quality` (목욕파)
- `jjim_temp`, `cleanliness` (찜질파)
- `_editId`, `created_at` (편집 모드)
- `deep_log: { ... }` (딥로그)

이 데이터 구조에 대한 타입이 없어서 `Record<string, unknown>`으로 퉁칠 수밖에 없었고, 그래서 모든 프로퍼티 접근에 타입 에러가 발생한 것.

---

## 에러 3: ESLint 규칙 이름 불일치

### 뭐가 문제였나

`any` 사용을 억제하려고 `// eslint-disable-next-line @typescript-eslint/no-explicit-any`를 넣었는데, 이 프로젝트의 ESLint 설정에 `@typescript-eslint` 플러그인이 없어서 "규칙 정의를 찾을 수 없음" 에러.

### 어떻게 해결했나

`// eslint-disable-line`으로 변경 (규칙 이름 생략).

### 더 나은 방법

eslint-disable 자체가 불필요하도록 `any`를 쓰지 않는 게 맞다 (아래 대안 참고).

---

## 에러 4: deep/page.tsx의 `BathGender | null` 타입

### 뭐가 문제였나

```typescript
let restoredGender: BathGender | null = null
// ...
restoredGender = dl.bath_gender as string  // ❌ string은 BathGender | null에 할당 불가
```

### 어떻게 해결했나

`as BathGender`로 캐스팅.

### 이건 적절한 해결인가

맞다. `bath_gender` 값은 DB에서 온 것이므로 실제로 항상 BathGender 유니온 중 하나. `as BathGender` 캐스팅이 의미적으로 정확.

---

## 현재 상태의 문제점

### 1. 파일마다 전략이 다르다

5개 파일에 4가지 다른 패턴. 유지보수하는 사람이 "왜 여기는 `as any`이고 저기는 `as string`이지?" 혼란.

### 2. `as Record<string, any>`는 safeParse의 취지를 반감

safeParse로 런타임 안전성을 확보했지만, `as any` 캐스팅으로 타입 안전성을 다시 버렸다. "크래시는 안 나지만 타입 체크도 안 됨" 상태.

### 3. `{} as Record<string, unknown>` 같은 어색한 캐스팅

deep/page.tsx의 merge 로직에서:
```typescript
safeParse<Record<string, unknown>>(currentLog, {} as Record<string, unknown>)
```
읽기 어렵고 의도가 불명확.

---

## 더 나은 대안

### 대안 A: `CurrentLogData` 타입 정의 (추천 ✅)

```typescript
// types/index.ts에 추가
export interface CurrentLogData {
  _editId?: string
  place_id?: string
  place_name?: string
  tribe_id?: TribeId
  created_at?: string
  revisit_score?: number
  repeat?: number
  heat_time?: number
  ice_time?: number
  pause_time?: number
  sauna_temp?: number
  cold_bath_temp?: number
  totono_score?: number
  hot_bath_temp?: number
  water_quality?: number
  jjim_temp?: number
  cleanliness?: number
  deep_log?: DeepLogRecord  // deep_log의 DB 형태 타입도 정의
}
```

그러면 모든 파일이 깔끔해짐:
```typescript
const log = safeParse<CurrentLogData | null>(savedLog, null)
if (!log) return
if (log._editId) setEditId(log._editId)  // ✅ 타입 안전
if (log.revisit_score) setRevisit(log.revisit_score)  // ✅ 타입 안전
```

**장점**: 타입 안전 + as 캐스팅 0개 + 모든 파일 동일 패턴
**단점**: 타입 정의 작업 필요 (30줄 정도)
**난이도**: 쉬움

### 대안 B: safeParse 자체를 `any` 반환으로 (비추천 ❌)

```typescript
export function safeParse(json: string | null, fallback: any): any {
```

원래 JSON.parse와 동일한 타입 행동. 기존 코드 변경 최소화.

**장점**: 수정량 최소
**단점**: TypeScript의 타입 체크를 포기. safeParse를 쓰는 미래 코드에서도 타입 실수를 못 잡음.

### 대안 C: 현재 상태 유지 (중립)

크래시 방지라는 핵심 목표는 달성. `as any`가 1곳뿐이라 실질적 위험은 낮음.

**장점**: 이미 빌드 통과, 추가 작업 없음
**단점**: 파일별 패턴 불일치, 유지보수 부담

---

## 결론

| 기준 | 대안 A (타입 정의) | 대안 B (any 반환) | 대안 C (현재) |
|------|-------------------|-------------------|--------------|
| 타입 안전성 | ✅ 완전 | ❌ 없음 | ⚠️ 부분 |
| 코드 일관성 | ✅ 모든 파일 동일 | ✅ 동일 | ❌ 4가지 패턴 |
| 수정량 | 중간 (30줄 타입 + 5파일 수정) | 적음 (1줄) | 없음 |
| 미래 유지보수 | ✅ 새 필드 추가 시 타입 체크 | ❌ 실수 못 잡음 | ⚠️ |

**추천: 대안 A.** `CurrentLogData` 타입을 정의하면 safeParse의 크래시 방지 + TypeScript의 타입 체크 모두 확보. 이게 원래 했어야 할 방법.
