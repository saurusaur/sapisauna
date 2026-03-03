# 장소 Dedup — 미적용 잔여 작업

> 분리일: 2026-03-03
> 원본: `archive/PLAN_place_dedup_logic.md`
> 선행 완료: DB 스키마(places 3컬럼, place_sources lat/lng), RPC find_nearby_places, addPlace() dedup 1-3단계

---

## 1. Dedup 2단계 — 유저 확인 UI

**현재**: 50m 이내 후보 발견 시 첫 번째 후보로 **자동 병합**
**목표**: 후보를 유저에게 보여주고 "같은 장소인가요?" 확인 후 병합/신규 결정

### 왜 필요한가
- 같은 건물 다른 업체 (주영목욕탕 vs 유라이크스파, 3.1m 거리) → 자동 병합하면 오매칭
- 원본 플랜의 핵심 원칙: "불확실하면 사람에게 물어본다"

### 구현 범위
- `src/lib/places-service.ts` `addPlace()` — 자동 병합 → 후보 반환으로 변경
- 새 UI 컴포넌트: 병합 확인 모달/바텀시트
  - 기존 장소 이름 + 주소 표시
  - "네, 같은 장소입니다" → 소스 병합 (merged=true)
  - "아니오, 다른 장소입니다" → 신규 생성
- `src/app/place/add/page.tsx` 또는 장소 선택 흐름에서 호출

### 의사 코드 (원본 플랜)
```typescript
if (candidates.length > 0) {
  const userChoice = await showMergeConfirmation(candidates)
  if (userChoice.merge && userChoice.selectedPlaceId) {
    // 소스 추가 + merged=true
  }
  // else → 3단계 신규 생성
}
```

### 엣지 케이스
| 케이스 | 처리 |
|--------|------|
| 50m 내 여러 장소 | 후보 전체를 유저에게 표시 |
| 같은 건물 다른 업체 | 유저가 "다른 장소" 선택 → 신규 생성 |
| 같은 업체 다른 이름 (리브랜딩) | 유저가 "같은 장소" 선택 → 소스 병합 |

---

## 2. 폐업 확인 플로우

**현재**: places.status 컬럼 존재하지만 업데이트 로직 없음
**목표**: 유저 "폐업했어요" 신고 → Google API 검증 → 상태 업데이트

### 플로우
```
유저가 "폐업했어요" 클릭
    │
    ▼
place_sources에 google 소스 있나?
    │
    ├─ 있음 → Place Details API(place_id) → business_status 확인
    │         ├─ CLOSED_PERMANENTLY → places.status = 'closed_permanently'
    │         ├─ CLOSED_TEMPORARILY → places.status = 'closed_temporarily'
    │         └─ OPERATIONAL → places.status = 'under_review' (어드민 큐)
    │
    └─ 없음 (Naver only) → places.status = 'under_review' (어드민 큐)
```

### 구현 범위
- 장소 상세 페이지(`explore/[id]/page.tsx`)에 "폐업 신고" 버튼
- Google Place Details API 호출 엔드포인트 (서버사이드, $17/1000건)
- places.status UPDATE 로직

---

## 3. 어드민 리뷰 화면

**현재**: merged=true / status='under_review' 쿼리 가능하지만 UI 없음
**목표**: 병합된 장소와 폐업 신고를 리뷰하는 어드민 페이지

### 쿼리
```sql
SELECT p.id, p.status, p.merged, ps.name_original, ps.source, ps.address_original
FROM places p
JOIN place_sources ps ON ps.place_id = p.id
WHERE p.merged = true OR p.status = 'under_review'
ORDER BY p.updated_at DESC;
```

### 구현 범위
- `/admin/places` 페이지 (인증 + 어드민 권한 체크)
- 병합 이력 확인: 소스별 이름/주소 비교
- 상태 변경: under_review → active / closed_permanently

---

## 4. 기타 후순위

- [ ] 자동 크로스 소스 매칭 (등록 시 백그라운드 Google 검색으로 place_id 확보)
- [ ] 외국인 UX (다국어 확인 UI) — 한국 유저 메인 확립 후
- [ ] "다른 장소에요" 유저 신고 기능 (오병합 해제)
- [ ] Google 평점/리뷰 수/사진 저장 활용

---

## 참고 자료 (원본 플랜에서 발췌)

### 좌표 검증 데이터
| 장소 | Naver→WGS84 | Google WGS84 | 거리 |
|------|-------------|-------------|------|
| 삼영사우나 | 37.5888630, 127.0102249 | 37.5889016, 127.0103009 | 8.0m |
| 주영여성대중목욕탕 | 37.5442864, 126.9693815 | 37.5442281, 126.9693667 | 6.5m |
| 유라이크스파 (같은 건물) | 37.5442864, 126.9693815 | 37.5442605, 126.9693700 | 3.1m |

### API 비용
| API | 비용 |
|-----|------|
| Naver Search Local | 무료 (일 25,000건) |
| Google Text Search | $32/1000건 |
| Google Place Details | $17/1000건 |
