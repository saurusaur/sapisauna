# Research Document Taxonomy & Guide

> 작성일: 2026-03-27
> 대상: `docs/research/` 내 모든 파일 (archive 제외)

---

## A. 원본 데이터 소스 (Raw Sources)

### 1. notion-review-db-analysis.md
- **내용**: 먼데이사우나 리뷰어들의 Notion 상세 리뷰 DB. 129개 시설, 온도/태그/한줄평/좋은점/아쉬운점 포함
- **날짜**: 2026-03-18 (수집)
- **용도**: 시드 데이터의 원본 소스. 시설별 상세 리뷰 원문 확인할 때
- **신뢰도**: HIGH — 리뷰어 직접 작성, 온도 실측
- **크기**: ~192KB (대용량)

### 2. notion-simple-review-analysis.md
- **내용**: 간소화 리뷰 DB. 37개 시설, 좋은점/아쉬운점 키워드 추출 + 태그 후보
- **날짜**: 2026-03-18 (수집)
- **용도**: 노션 리뷰의 요약본. 태그 추출 검토할 때
- **신뢰도**: HIGH — notion-review-db-analysis.md 의 축약
- **관계**: `notion-review-db-analysis.md` → 이 파일 (축약)

### 3. katalk-facility-analysis.md ⚠️ OLD
- **내용**: 카톡 오픈채팅 1차 추출 (2025.10.30 ~ 2026.03.13, ~L10264). 기존 시설 태그 후보 + 신규 시설 30건 + 커뮤니티 인사이트
- **날짜**: 2026-03-13 (추출 기간 종료)
- **용도**: 1차 카톡 분석 결과. 시설별 태그/후기 키워드 파악
- **신뢰도**: MEDIUM — 추출은 정확하나 온도 데이터 부족, 일부 시설 태그 정보 불완전
- **관계**: 이 파일 → `katalk-tag-review.csv` (요약) / `katalk-facility-detail-v2.csv` (상세)
- **상태**: `katalk-raw-extracts-20260326.md` 등 신규 추출로 일부 대체됨

### 4. katalk-facility-detail-v2.csv ⚠️ OLD
- **내용**: 카톡 1차 추출 시설별 온도/태그/수질/가격/후기 CSV. ~65건 시설
- **날짜**: 2026-03-21 (최종 수정)
- **용도**: 시설별 구조화된 데이터 조회. 큐레이션 리스트 매칭 소스
- **신뢰도**: MEDIUM — 온도 데이터 불완전(빈 칸 다수), 후기는 카톡 원문 발췌
- **관계**: `katalk-facility-analysis.md` → 이 파일 (구조화)
- **상태**: 신규 추출로 일부 온도 데이터가 업데이트/보강됨

### 5. katalk-tag-review.csv ⚠️ OLD
- **내용**: 카톡 1차 추출 태그 리뷰 요약. 30건 시설 × 태그/온도/메모/주의사항
- **날짜**: 2026-03-24 (최종 수정)
- **용도**: 태그 반영 여부 빠르게 확인할 때 (체크리스트 형태)
- **신뢰도**: MEDIUM — katalk-facility-analysis.md 의 요약
- **관계**: `katalk-facility-analysis.md` → 이 파일 (요약)

---

## B. 신규 카톡 추출 (2026-03-26, L10265~12896)

### 6. katalk-extraction-plan-20260326.md
- **내용**: 2차 카톡 추출 방법론 문서. Phase 1~4 단계, 키워드, 산출물 정의
- **날짜**: 2026-03-26
- **용도**: 추출 프로세스 이해/재현할 때
- **신뢰도**: N/A (방법론 문서)

### 7. katalk-raw-extracts-20260326.md ★ NEW
- **내용**: 카톡 2차 추출 원문 + 출처. 시설별 온도 데이터, 시설 특징 정리. 안토리조트/프라임노다지/리버사우나/유천스파/그랜드워커힐/아쿠아필드 하남/리버사이드호텔/강변스파랜드/웨스틴조선부산/인천조탕/레몬사우나/휘경인삼사우나 등 12+ 시설
- **날짜**: 2026-03-26 (L10265~12896, 기간 2026-03-16~03-26)
- **용도**: 기존 시설의 온도/시설정보 보강 원본. DB 업데이트 근거
- **신뢰도**: HIGH — 줄번호 기반 원문 출처 명시, 발언자/날짜 포함
- **관계**: `katalk-extraction-plan-20260326.md` (방법론) → 이 파일 (Phase 2 산출물)

### 8. katalk-long-reviews-20260326.md ★ NEW
- **내용**: 100자+ 장문 리뷰 전문 추출. 오레브 핫스프링 상세 리뷰, 제주 도민 추천 목욕탕 리스트, 산방산 탄산온천 상세 리뷰, 호텔 사우나 팁 등
- **날짜**: 2026-03-26 (기간 2026-03-16~03-26)
- **용도**: 시설별 상세 리뷰 원문. 메모/한줄평 작성 근거
- **신뢰도**: HIGH — 카톡 원문 전문 보존
- **관계**: `katalk-raw-extracts-20260326.md`와 동일 소스, 장문 필터링

### 9. katalk-new-facilities-20260326.md ★ NEW
- **내용**: 카톡 2차에서 발견된 DB 미등록 신규 시설. 국내 40+ 시설, 해외 시설 포함. 시설별 위치/요약/원문 컨텍스트
- **날짜**: 2026-03-26 (기간 2026-03-16~03-26)
- **용도**: 신규 시설 등록 후보 검토. 시설 존재 확인 + DB 추가 여부 결정
- **신뢰도**: MEDIUM — 원문은 정확하나, 시설명이 비공식명/별칭인 경우 있음 (한림탕, 봉래탕 등)
- **관계**: `katalk_10_verification_20260327.md` (검증 결과)

### 10. katalk-facility-update-20260326.md ★ NEW (통합 요약)
- **내용**: 2차 카톡 추출 통합 정리. A: DB 업데이트 필요 기존 시설 8건, B: 신규 시설 등록 후보 10+4건, C: 세신 정보, D: 유저 확인 필요 사항
- **날짜**: 2026-03-26
- **용도**: 2차 추출의 액션 아이템 요약. "다음에 뭘 해야 하나" 확인할 때
- **신뢰도**: HIGH — raw/long/new 3개 파일의 요약
- **관계**: `katalk-raw-extracts-20260326.md` + `katalk-long-reviews-20260326.md` + `katalk-new-facilities-20260326.md` → 이 파일 (통합)

---

## C. DB 스냅샷 & 품질 관리

### 11. seed-data-final-db-state.csv
- **내용**: DB 최종 상태 스냅샷. 226건 시설의 이름/주소/시설유형/온도/태그/메모
- **날짜**: 2026-03-24 (스냅샷 시점)
- **용도**: DB 현재 상태 기준점. 큐레이션/테마 매칭의 기준 데이터
- **신뢰도**: HIGH — DB 직접 덤프
- **관계**: 모든 검증/분석 파일의 기준 데이터

### 12. devils-advocate-db-audit-20260324.md
- **내용**: DB 전수 감사. 중복(1건 CRITICAL), 시설유형 모순(10건), 입장료 이상치(9건), 온도 이상치(20+건) 등 10개 카테고리
- **날짜**: 2026-03-24
- **용도**: 데이터 품질 이슈 전체 목록. 수정 우선순위 결정할 때
- **신뢰도**: HIGH — 체계적 감사, 근거 명시
- **관계**: `seed-data-final-db-state.csv` (감사 대상) → 이 파일 (감사 결과)

### 13. data-quality-analysis-20260324.md
- **내용**: Places DB 품질 분석. country_code 오류 11건(KR→JP), 언어 검증 등
- **날짜**: 2026-03-24
- **용도**: DB 시스템 레벨 오류 확인
- **신뢰도**: HIGH — Google Places API로 교차검증
- **관계**: → `data-quality-fix-sql-20260324.md` (수정 SQL)

### 14. data-quality-fix-sql-20260324.md
- **내용**: 품질 이슈 수정 SQL. country_code 11건 + Naver external_id URL 오류 5건
- **날짜**: 2026-03-24
- **용도**: 직접 실행 가능한 수정 쿼리
- **신뢰도**: HIGH — data-quality-analysis 기반
- **관계**: `data-quality-analysis-20260324.md` → 이 파일 (수정 쿼리)

---

## D. 주소/이름/링크 검증

### 15. hotel-spa-address-verification.md
- **내용**: hotel-spa 유형 40건 주소 검증. MATCH 31, MISMATCH 2, TRUNCATED 5, UNABLE 2
- **날짜**: 2026-03-24
- **용도**: 호텔 스파 주소 정확성 확인
- **신뢰도**: HIGH — Naver/Google 검색 교차검증

### 16. overseas-address-verification.md
- **내용**: 해외 시설 34건 주소 검증. 일본 28 + 기타 6. MATCH 17, MATCH(truncated) 10, MISMATCH 6
- **날짜**: 2026-03-24
- **용도**: 해외 시설 주소 정확성 확인. Truncation 이슈 파악
- **신뢰도**: HIGH — Google 검색 교차검증

### 17. facility_verification_20260324.md
- **내용**: 의심 시설 6건 팩트체크. DELETE 1건(온유재 — 마사지샵), KEEP 5건
- **날짜**: 2026-03-24
- **용도**: 시설 실재 여부 + 유형 정확성 확인
- **신뢰도**: HIGH — 웹 검색 기반 팩트체크

### 18. naver_name_verification_20260324.md
- **내용**: 시설명 네이버 검증. MEDIUM 13건(업종명 변경), 누락 8건(노션에만 존재)
- **날짜**: 2026-03-24
- **용도**: Notion 원본명 vs DB 등록명 차이 확인. 오매칭 방지
- **신뢰도**: HIGH — 네이버 검색 교차검증

### 19. notion-vs-csv-name-comparison-20260324.md
- **내용**: Notion 원본명 vs 시드 CSV 등록명 비교. 이름 변경 17건 + 띄어쓰기 차이 13건
- **날짜**: 2026-03-24
- **용도**: 시설명 변경 추적. Naver 검색이 원래 이름을 덮어쓴 케이스 파악
- **신뢰도**: HIGH
- **관계**: `notion-review-db-analysis.md` + `seed-data-final-db-state.csv` → 이 파일 (비교)

### 20. naver-search-format-test-20260324.md
- **내용**: 네이버 지도 검색어 포맷 최적화. 6가지 포맷 × 30개 장소 테스트. Format B(name+시도+시군구) 100% 정확
- **날짜**: 2026-03-24
- **용도**: 네이버 지도 링크 생성 로직 결정 근거
- **신뢰도**: HIGH — Naver Local Search API 실측

### 21. map-link-verification-20260324.md
- **내용**: Google Maps URL 포맷 검증. Format A(현재) 0/30 작동, Format B(권장) 29/30 작동
- **날짜**: 2026-03-24
- **용도**: Google Maps 링크 포맷 수정 근거
- **신뢰도**: HIGH — curl + API 실측

### 22. katalk_10_verification_20260327.md ★ NEW
- **내용**: 카톡 신규 10건 시설 네이버 검증. 확인 5건, 부분확인 1건, 미확인 4건
- **날짜**: 2026-03-27
- **용도**: 신규 시설 등록 전 실재 여부 확인
- **신뢰도**: HIGH — 웹 검색 기반
- **관계**: `katalk-new-facilities-20260326.md` → 이 파일 (검증)

### 23. hotel-spa-subitems-20260327.md ★ NEW
- **내용**: 호텔 부대시설 스파/사우나 리서치. 반얀트리/풀만/그랜드조선부산 등의 공식명, 비투숙객 이용, 가격
- **날짜**: 2026-03-27
- **용도**: 호텔 사우나 독립 등록 여부 결정 근거
- **신뢰도**: HIGH — 공식 사이트/네이버 검색 기반

---

## E. 큐레이션 & 기능 기획

### 24. curation_final_candidates_20260323.md
- **내용**: 큐레이션 리스트 최종 후보. 냉탕 미친(13건), 노천탕 BEST(10건), 24시간(16건) 등 테마별 시설 선별
- **날짜**: 2026-03-23
- **용도**: SA-LIST 큐레이션 콘텐츠 소스
- **신뢰도**: HIGH — seed DB + katalk 교차검증
- **관계**: `sa-list-theme-categorization.md` + `curation_list_matching_20260323.md` → 이 파일 (최종 후보)

### 25. curation_list_matching_20260323.md
- **내용**: 9개 테마별 시설 딥 매칭. 키워드 매칭 → 문맥 확인 → DB 교차검증. 테마당 15~40건
- **날짜**: 2026-03-23
- **용도**: 큐레이션 테마별 매칭 근거 확인
- **신뢰도**: HIGH — 다중 소스 교차
- **관계**: `katalk-facility-detail-v2.csv` + `seed-data-final-db-state.csv` → 이 파일 (매칭)

### 26. sa-list-theme-categorization.md
- **내용**: SA-리스트 테마별 시설 분류. 냉탕/노천탕/24시간/아우프구스 등 9개 테마 × 시설 목록
- **날짜**: 2026-03-23
- **용도**: 테마 분류 기준과 시설 배정 확인
- **신뢰도**: HIGH
- **관계**: `seed-data-final-db-state.csv` → 이 파일 (분류)

### 27. sa_list_benchmark_20260323.md
- **내용**: SA-LIST 벤치마크. Spotify/Instagram/Letterboxd/YouTube의 리스트/컬렉션 UX 비교 (생성, 저장, 상세, 탐색, 공유)
- **날짜**: 2026-03-23
- **용도**: SA-LIST 기능 설계 참고. UX 패턴 선택 근거
- **신뢰도**: HIGH — 실제 서비스 기반 비교

### 28. saunaschleng_awards.md
- **내용**: 일본 사우나슐렝(サウナシュラン) 2023/2024/2025 수상 시설. 랭킹 + 특징 + 명예의 전당
- **날짜**: 2026-03-23 (조사)
- **용도**: 일본 시설 시드 데이터 소스. 품질 검증 기준
- **신뢰도**: HIGH — 공식 사이트 기반

---

## F. 기타 리서치

### 29. review-westin-chosun.md
- **내용**: 웨스틴 조선 서울 사우나 단건 리뷰. 온도, 태그, 시드 데이터 형식 포함
- **날짜**: 2026-03-20
- **용도**: 시드 등록 시 참고
- **신뢰도**: HIGH — 직접 방문 리뷰

### 30. legal-review-beta.md
- **내용**: 베타 출시 법률 검토. 개인정보보호법(PIPA) 준수, 수집 항목, 동의 요건
- **날짜**: 2026-03-20
- **용도**: 법률 준수 체크리스트
- **신뢰도**: MEDIUM — AI 분석 기반, 법률 전문가 확인 권장

### 31. pwa-desktop-layout-patterns.md
- **내용**: PWA 데스크톱 레이아웃 패턴. "Mobile Shell" 패턴 비교 (Instagram, Toss, KakaoBank 등)
- **날짜**: 2026-03-13
- **용도**: 데스크톱 대응 CSS 구현 참고
- **신뢰도**: HIGH

### 32. RESEARCH_cloudinary_heic.md
- **내용**: HEIC 변환 전략 리서치. heic-to vs libheif-js vs heic2any 비교. 서버/클라이언트 옵션
- **날짜**: 2026-03-18
- **용도**: HEIC 변환 라이브러리 선택 근거
- **신뢰도**: HIGH — npm/GitHub/커뮤니티 벤치마크 기반

### 33. username-profanity-filter-options.md
- **내용**: 유저네임 예약어 + 비속어 필터 라이브러리 리서치
- **날짜**: 2026-03-13
- **용도**: 온보딩 닉네임 검증 로직 참고
- **신뢰도**: HIGH

---

## G. 파일 간 관계도 (Data Flow)

```
[Notion DB] ──→ notion-review-db-analysis.md ──→ notion-simple-review-analysis.md
                         │
                         ├──→ seed-data-final-db-state.csv (DB)
                         │         │
                         │         ├──→ devils-advocate-db-audit
                         │         ├──→ data-quality-analysis → data-quality-fix-sql
                         │         ├──→ hotel-spa-address-verification
                         │         ├──→ overseas-address-verification
                         │         ├──→ notion-vs-csv-name-comparison
                         │         └──→ sa-list-theme-categorization
                         │
[카톡 CSV]               │
  ├─ ~L10264 (OLD) ──→ katalk-facility-analysis.md
  │                      ├──→ katalk-facility-detail-v2.csv
  │                      └──→ katalk-tag-review.csv
  │
  └─ L10265~12896 (NEW)
       │  katalk-extraction-plan (방법론)
       ├──→ katalk-raw-extracts-20260326.md (온도/시설 원문)
       ├──→ katalk-long-reviews-20260326.md (장문 리뷰)
       ├──→ katalk-new-facilities-20260326.md (신규 시설)
       │         └──→ katalk_10_verification_20260327.md (검증)
       └──→ katalk-facility-update-20260326.md (통합 요약)

[사우나슐렝] ──→ saunaschleng_awards.md

[큐레이션]
  seed DB + katalk detail ──→ curation_list_matching
                           ──→ curation_final_candidates
  sa_list_benchmark (벤치마크, 독립)
```

---

## H. 아카이브 권장 파일

다음 파일은 신규 추출로 대체되었거나, 목적이 완료된 파일:

| 파일 | 아카이브 사유 |
|------|-------------|
| `katalk-tag-review.csv` | `katalk-facility-update-20260326.md`로 대체. 태그 리뷰 기능 완료 |
| `katalk-extraction-plan-20260326.md` | 추출 완료. 방법론 보존용이지만 활성 참조 불필요 |

다음 파일은 아카이브하지 말 것:

| 파일 | 유지 사유 |
|------|----------|
| `katalk-facility-analysis.md` | OLD 기간(~03-13) 데이터는 NEW에 포함 안 됨. 상호 보완 |
| `katalk-facility-detail-v2.csv` | OLD 기간 구조화 데이터. 큐레이션 매칭에서 여전히 참조 중 |
