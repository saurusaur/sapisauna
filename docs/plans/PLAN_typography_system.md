# Typography System 통일 플랜

## 목표
인라인 스타일 제거 + Tailwind 기반 타이포그래피 시스템으로 앱 전체 통일

## 타입 스케일 (안)

| 레벨 | 용도 | 폰트 | 사이즈/웨이트 | 예시 |
|------|------|------|-------------|------|
| **Display** | 페이지 메인 헤더 | Oswald | text-3xl+ / Bold | HELLO SA-PIEN, EXPLORE |
| **Title** | 섹션 헤더 | Oswald or Noto Sans KR | text-xl / Semibold | 사우나범의기록, 다음에 이런 곳은 어때요? |
| **Body** | 본문/설명 | Libre Franklin + Noto Sans KR | text-base / Medium | Routine, 텍스트 버튼, 설명문구 |
| **Caption** | 작은 문구 | Libre Franklin + Noto Sans KR | text-xs~sm / Normal | 버튼 설명, 날짜, 보조 텍스트 |

## 구현 방식
- `tailwind.config.ts` → `extend.fontSize`에 커스텀 타입 스케일 정의 (폰트+사이즈+웨이트+행간 번들)
- `globals.css` → 인라인 `style={{ fontFamily }}` 제거, Tailwind 클래스로 대체
- 각 페이지/컴포넌트에서 `font-display`, `font-title`, `font-body`, `font-caption` 클래스 적용

## 작업 순서
1. 앱 전체 타이포 패턴 스캔 (현재 사용 중인 text-*/font-* 정리)
2. 타입 스케일 확정 (사용자 확인)
3. tailwind.config.ts + globals.css 설정
4. 페이지별 일괄 적용 (10개+ 파일 예상 → 중간 커밋 필요)
5. 빌드 + 시각 검증

## 상태
- [ ] 스캔
- [ ] 타입 스케일 확정
- [ ] 구현
- [ ] 검증
