# TODO: 기록 추가 흐름 리디자인

> 작성: 2026-03-09
> 최종 업데이트: 2026-03-09
> 상태: **핵심 구현 완료** — 후속 작업 남음

## 현재 흐름 (구현 완료)
```
장소 선택 → 숏로그 → 분기 모달
                      ├─ "상세 기록 추가" → 딥로그 → DB 저장(숏+딥) → 스토리(뷰어)
                      └─ "바로 스토리로"  → DB 저장(숏로그) ──────→ 스토리(뷰어)
```

**삭제된 페이지/컴포넌트:**
- `/complete/page.tsx` → 성공 토스트로 대체
- `/story/edit/page.tsx` + `story-editor/*` (6파일) → 스토리 에디터 전체 제거
- `/log/nudge/page.tsx` → 미사용 제거
- `sticker-templates.ts` → 미사용 제거

---

## 구현 완료 항목

- [x] Step 1: ConfirmModal 확장 (children prop) — `confirm-modal.tsx`
- [x] Step 2: 숏로그 분기 모달 + DB 저장 — `log/page.tsx`
- [x] Step 3: 딥로그 → DB 저장 후 스토리 이동 — `log/deep/page.tsx`
- [x] Step 4: 스토리 페이지 뷰어 전용 (savedLogId → DB fetch) — `story/page.tsx`
- [x] Step 5: 성공 토스트 (기본 인라인 구현) — `story/page.tsx` 내 인라인
- [x] Step 6: /complete 페이지 제거
- [x] Step 7: 레거시 코드 제거 (story-editor, sticker, nudge — 11파일 삭제)
- [x] 숏로그·딥로그 헤더 sticky + CTA 하단 고정
- [x] 편집 모드 딥로그 데이터 복원 버그 수정

## 미완료 / 후속 작업

- [ ] 성공 토스트 고도화: SaveSuccessToast 별도 컴포넌트 추출 + 폭죽&스팀 CSS 애니메이션
- [ ] 사진 추가/삭제 UI (스토리 카드 내 갤러리 선택 + 삭제 시 트라이브 기본 배경 복원)
- [ ] 히스토리 상세의 "스토리 만들기" 버튼 — 새 흐름에 맞게 업데이트 필요 (savedLogId 방식)
