# TODO: 기록 추가 흐름 리디자인

> 작성: 2026-03-09
> 최종 업데이트: 2026-03-09

## 현재 흐름
```
장소 선택 → 숏로그 → 스토리 미리보기 → (선택) 딥로그/커스텀 에디터 → /complete(DB 저장)
```

## 새 흐름
```
장소 선택 → 숏로그 → 분기 모달
                      ├─ "상세 기록 추가" → 딥로그 → DB 저장(숏+딥) → 스토리(뷰어)
                      └─ "바로 스토리로"  → DB 저장(숏로그) ──────→ 스토리(뷰어)
```

**핵심 변화:**
- DB 저장이 스토리 진입 **전**에 완료됨
- 스토리 페이지는 순수 카드 뷰어/공유 도구 (저장 책임 없음)
- `/complete` 페이지 제거 → 스토리 진입 시 성공 토스트로 대체
- 편집 모드도 동일한 분기 흐름 적용

---

## 확정된 의사결정

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| 1 | 분기 UI 형태 | ConfirmModal 확장 (children 지원) | 새 컴포넌트 불필요, 기존 패턴 재활용 |
| 2 | 사진 기능 범위 | 추가/삭제만 | 에디터 제거 취지에 부합 |
| 3 | 사진 삭제 시 | 트라이브 기본 배경으로 자동 복원 | `--story-bg-{tribe}` CSS 변수 활용 |
| 4 | 저장 실행 위치 | 분기 모달 버튼 클릭 시 | 네트워크 실패 시 스토리로 안 보냄 |
| 5 | /complete 페이지 | 토스트+애니메이션으로 대체 | 폭죽&스팀 CSS 애니메이션 |
| 6 | 편집 모드 | 새 기록과 동일한 분기 흐름 | 딥로그 편집 기회 동일 제공 |
| 7 | 제거 타이밍 | 2단계 분리 (구현 먼저 → 레거시 제거) | 안전한 롤백, 커밋 위생 |

---

## 구현 계획

### Step 1: ConfirmModal 확장 + 분기 모달
- `confirm-modal.tsx`에 `children?: ReactNode` prop 추가
- children이 있으면 message 대신 children 렌더
- 버튼도 유연하게: 2버튼 외에 vertical 레이아웃 지원
- 기존 사용처 영향 없음 (optional prop)

### Step 2: 숏로그 페이지 분기 흐름
- 현재 `handleSave` (line 124): localStorage 저장 → `/story` 이동
- 변경: localStorage 저장 → 분기 모달 open
- 분기 모달 CTA:
  - **"상세 기록 추가하기"** → `/log/deep` 이동
  - **"바로 스토리로"** → DB 저장 (insertLog/updateLog) → 성공 시 `/story` 이동
- DB 저장 시 로딩 상태 표시 (버튼 disabled + 스피너)
- 실패 시 모달 내 에러 메시지

### Step 3: 딥로그 → 스토리 전환 시 저장
- 현재: 딥로그 완료 → currentLog.deep_log에 merge → `/story` 이동
- 변경: 딥로그 완료 → DB 저장 (숏+딥 함께) → `/story` 이동
- 딥로그 페이지의 "완료" 핸들러에서 insertLog + saveOrUpdateDeepLog 호출
- 편집 모드: updateLog + saveOrUpdateDeepLog

### Step 4: 스토리 페이지 역할 변경
- DB 저장 로직 제거 (이미 저장됨)
- 딥로그 추가 버튼 제거
- 커스텀 카드 에디터 버튼 제거
- 남는 기능: 카드 프리뷰 + 공유 + 다운로드 + 사진 추가/삭제
- 진입 시 성공 토스트 + 폭죽&스팀 애니메이션 표시
- 헤더: "홈으로" / "내 기록 보기" 네비게이션 추가
- 사진 삭제 시 → 트라이브 기본 배경(`--story-bg-{tribe}`)으로 자동 복원

### Step 5: 성공 토스트 + 애니메이션
- 순수 CSS `@keyframes` 기반
- 폭죽: 파티클 scatter (radial burst)
- 스팀: 위로 올라가는 연기 효과 (opacity fade + translateY)
- 2~3초 후 자동 dismiss
- 컴포넌트: `SaveSuccessToast` (재사용 가능)

### Step 6: /complete 페이지 제거 + 라우팅 정리
- `/complete/page.tsx` 삭제
- complete로의 라우팅 참조 모두 제거
- 뒤로가기 차단 로직 → 스토리 페이지로 이동 (이미 저장됨이므로 안전)

### Step 7: 레거시 코드 제거 (별도 커밋)
- `/story/edit/page.tsx` 삭제
- `editor-canvas.tsx` 및 관련 컴포넌트 삭제
- `sessionStorage` 에디터 상태 관리 (`EDITOR_STATE_KEY`) 제거
- 스티커 시스템 (`sticker-templates.ts`, `sticker-drawer.tsx`, `sticker-content.tsx`) 삭제
- `background-picker.tsx`, `crop-modal.tsx` 삭제
- `/log/nudge/page.tsx` 삭제 (더 이상 미사용)

---

## 데이터 흐름 변경 상세

### 새 기록 (INSERT)
```
1. 장소 선택 → localStorage('selectedPlace')
2. 숏로그 폼 → localStorage('currentLog')
3. 분기 모달:
   A) "바로 스토리" 클릭
      → insertLog(currentLog) → log_id 확보
      → localStorage('savedLogId', log_id) ← 스토리에서 참조용
      → localStorage 정리 (currentLog, selectedPlace)
      → router.push('/story')
   B) "상세 기록" 클릭
      → router.push('/log/deep')
      → 딥로그 완료 시:
         → insertLog(currentLog) → log_id 확보
         → saveOrUpdateDeepLog(log_id, deepLog)
         → localStorage 정리
         → router.push('/story')
```

### 편집 (UPDATE)
```
1. 히스토리 상세 → 편집 버튼 → localStorage('currentLog' with _editId)
2. 숏로그 폼 (기존 값 프리필)
3. 분기 모달:
   A) "바로 스토리" → updateLog(editId, currentLog) → '/story'
   B) "상세 기록"   → '/log/deep' → updateLog + saveOrUpdateDeepLog → '/story'
```

### 스토리 페이지 (저장 후)
```
- localStorage('savedLogId')에서 log_id 읽기
- DB에서 완성된 로그 fetch (카드 렌더링용)
- 공유/다운로드 기능
- 사진 추가/삭제 (로컬 only, DB 저장 불필요 — 스토리 카드는 일회성 공유용)
- 네비: 홈 / 내 기록 / 한번 더 기록
```

---

## 영향받는 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/components/ui/confirm-modal.tsx` | 수정 | children prop 추가 |
| `src/app/log/page.tsx` | 수정 | 분기 모달 + DB 저장 로직 |
| `src/app/log/deep/page.tsx` | 수정 | 완료 시 DB 저장 후 스토리 이동 |
| `src/app/story/page.tsx` | 수정 | 뷰어 전용으로 단순화 + 토스트 |
| `src/components/ui/save-success-toast.tsx` | 신규 | 폭죽&스팀 애니메이션 토스트 |
| `src/app/complete/page.tsx` | 삭제 | Step 6 |
| `src/app/story/edit/page.tsx` | 삭제 | Step 7 |
| `src/components/story-editor/*` | 삭제 | Step 7 |
| `src/lib/sticker-templates.ts` | 삭제 | Step 7 |
| `src/app/log/nudge/page.tsx` | 삭제 | Step 7 |

---

## 미결 사항 / 후속 작업
- [ ] 사진 추가/삭제 UI 세부 디자인 (스토리 카드 내 위치, 사이즈)
- [ ] 성공 토스트 애니메이션 세부 디자인 (파티클 수, 색상, 타이밍)
- [ ] 스토리 페이지에서 로그 데이터 소스 전환 (localStorage → DB fetch via savedLogId)
- [ ] 편집 모드에서 기존 딥로그 유무에 따른 분기 모달 문구 차이 ("편집" vs "추가")
