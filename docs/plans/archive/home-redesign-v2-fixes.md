# 홈 리디자인 v2 — 최종 변경 내역

> 완료: 2026-03-08

## 변경 파일 (4개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/constants/content.ts` | GREETING 대문자, CALENDAR_HEADING 함수화(닉네임), VIEW_ALL→전체보기, ADD_RECORD→기록하기, TOOLTIP_CTA/LOADING/RECOMMEND 상수 추가, ADD_RECORD_LINK 제거(NAV.ADD_RECORD로 통합) |
| `src/components/features/home-calendar.tsx` | 좌우 chevron 화살표 추가, touchmove preventDefault로 페이지 끌림 방지, 하드코딩 제거(MESSAGES 참조) |
| `src/components/bottom-nav.tsx` | 5항목 구조(4탭+center raised), 기록 버튼 돌출감 강화(-mt-7, border-4, shadow-xl), 사-리스트 opacity-20+coming soon 텍스트 제거, 말풍선 MESSAGES 참조, NAV.ADD_RECORD→"기록하기" |
| `src/app/home/page.tsx` | HELLO SA-PIEN 대문자, "{닉네임}의 기록" 헤딩, 빈 기록 카드 탭→/place+밑줄 링크, 기록 영역 h-[104px] 고정, 추천 섹션 "다음은 여기 어때요?" 헤딩, 하드코딩 제거 |
| `src/app/history/page.tsx` | 헤딩 "{닉네임}의 기록"으로 홈과 통일, useUser import 추가 |

## 전체 반영 항목

| # | 항목 | 상태 |
|---|------|------|
| 1 | "HELLO SA-PIEN" 대문자 | ✅ |
| 2 | 스와이프 힌트 (좌우 chevron 화살표) | ✅ |
| 3 | 스와이프 시 페이지 끌림 방지 | ✅ |
| 4 | 네비 기록 버튼 돌출감 강화 | ✅ |
| 5 | 사-리스트 더 흐릿 + coming soon 제거 | ✅ |
| 6 | 달력 헤딩 "나의 기록" → "{닉네임}의 기록" | ✅ |
| 7 | History 헤딩 통일 "{닉네임}의 기록" | ✅ |
| 8 | 추천 섹션 헤딩 "다음은 여기 어때요?" | ✅ |
| 9 | 빈 기록 카드 탭 가능 + 밑줄 "기록하기" | ✅ |
| 10 | 하드코딩 제거 → content.ts 통합 (6건) | ✅ |
| 11 | "전체보기" 수정 (기록 전체보기→전체보기) | ✅ |
| 12 | 네비+빈카드 용어 통일 (NAV.ADD_RECORD 공유) | ✅ |
| 13 | 기록 영역 고정 높이 (h-[104px]) | ✅ |

## 신규 파일 (v1에서 생성)

| 파일 | 용도 |
|------|------|
| `src/components/features/home-calendar.tsx` | 홈 전용 주간/월간 전환 달력 |
