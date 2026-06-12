# 핸드오프: 로그·스키마 구조 재검토 (L1 드래프팅) — fresh 세션용

작성 2026-06-04 / 브랜치 preview / **목적: 설계안 드래프트(옵션+트레이드오프) 도출. 구현·DDL 적용 아님(별도 승인 후).**

---

## 📌 왜 이 작업이 최우선(P0)인가
새 방향(구현스케치 `docs/po/사피_제안기능_구현스케치.html`)의 **F1 빠른 기록 = 블록 탭**:
- "오늘 뭐 했어요?"를 **블록 탭**으로 기록 → **누른 순서가 곧 루틴**(1건식→2냉탕→3휴식).
- 트라이브가 기본 블록 세트 결정(사우나파=건식·습식·냉탕·휴식 / 목욕파=온탕·냉탕·세신 / 찜질파=한증막·매점·수면).
- 온도·세트는 **상세 토글로 분리**(빠른기록은 "뭐 했나"만, 마찰 0).
- 나만의 루틴 저장/불러오기 + 트라이브 추천 루틴("토토노우 입문").

F3(방문 비교 점수·인생 랭킹)·F5(캘린더 재설계)도 이 데이터 모델 위에 얹힘 → **스키마가 전체 기반. 여기 흔들리면 데이터 전부 흔들림.** (BACKLOG 최상단 P0)

## 🗄 현재 스키마 (⚠️ 라이브 DB 기준 — .sql엔 일부 누락)
**logs** (세션 1건): `id,user_id,place_id,record_date,tribe_id,bath_gender,primary_sauna_kind`
- 온도(**탕종류별 고정 컬럼**): `cold_bath_temp, hot_bath_temp, sauna_temp, steam_sauna_temp, jjim_temp`
- 루틴 타이밍(**고정 4슬롯**): `heat_time, ice_time, pause_time, repeat`
- 점수: `revisit_score, totono_score, water_quality, rest_quality, sweat_quality`

**deep_logs** (logs 1:1): `very_hot_bath_temp, ice_bath_temp, has_very_hot_bath, has_ice_bath, cost, currency, scrub_types, scrub_cost, has_scrub, scrub_satisfaction, store_score, store_memo, has_store, food_eaten, companion, crowd, cleanliness, memo`

## 🔑 핵심 텐션 (재검토 이유)
- 현재 = **온도가 탕종류별 고정 컬럼**, 루틴은 HEAT/ICE/PAUSE/REPEAT **고정 4슬롯**.
- 새 모델 = **임의 순서·반복의 블록 시퀀스**(건식→냉탕→휴식→건식→…), 블록마다 선택적 온도/시간.
- → 순서·반복·혼합 블록을 고정 컬럼으론 표현 불가. **시퀀스 구조가 필요.**

## ❓ 드래프트에서 결정할 것 (옵션 A/B/C + 트레이드오프로)
1. **시퀀스 저장 방식**: (a) 신규 `log_blocks`(log_id, seq, block_type, temp?, duration?, repeat?) (b) `logs.routine` JSONB (c) 하이브리드. → 쿼리/집계/마이그레이션/유연성 비교.
2. **기존 컬럼 온도와의 관계**: 컬럼 유지(집계·ΔT·스토리·통계가 의존) + 블록 병행? vs 블록을 정(正)으로 두고 컬럼은 파생 뷰? (이중관리 리스크 vs 호환성)
3. **블록 타입 vocabulary 통일**: content.ts 시설칩/HEAT·ICE와 매핑(건식/습식/온탕/열탕/냉탕/급냉/휴식/세신/한증막/매점/수면…). 트라이브 기본 블록 세트 정의 위치.
4. **루틴 템플릿**: `user_routines`(나만의) + 추천 루틴(트라이브별 입문) 시드 구조.
5. **마이그레이션·하위호환**: 기존 유저 로그 + **어드민 온도 로그(시드 238곳)** 보존·변환 전략. 무손실 우선.
6. **점수·ΔT·totono 재정의**: 블록 모델에서 primary_sauna_kind·온도차·토토노 산출 방식.

## 🚫 절대 보존 (제약)
- **어드민 온도 로그**(`ADMIN_USER_ID` = 23c431c3-9b23-4779-bb27-13472e58090a): 통계·시드값. 유저 노출 안 됨(`logs-service.ts`에서 `.neq('user_id', ADMIN_USER_ID)`). 깨지면 장소별 온도 표시 붕괴.
- **스토리 카드 / 히스토리 상세 / 통계 인사이트**가 현재 logs/deep_logs 필드 의존 → 스키마 변경 시 동반수정 매핑표 필수.
- 스키마 확인은 **라이브 DB**(`select('*').limit(1)` / pg_constraint). .sql에 `scrub_cost·primary_sauna_kind·ice_bath_temp` 등 누락.

## 📎 참조
- 방향성: `docs/po/사피_제안기능_구현스케치.html`, `docs/po/UX_DIRECTION_page_emphasis_20260604.md`, BACKLOG F1·로그/스키마 재검토 항목
- 상수: `src/constants/content.ts` (HEAT/ICE/PAUSE/REPEAT, 시설칩, ADMIN_USER_ID)
- 폼/서비스: `src/app/log/`, `src/app/log/deep/`, `src/lib/logs-service.ts`
- 기존 마이그레이션(참고, 라이브 우선): `supabase/024_steam_sauna_rename_and_move.sql`, `008_very_hot_bath_rename.sql`, `016_ice_time_to_seconds.sql`

## 🎯 그 세션 산출물
스키마 재설계 **드래프트 문서**(옵션 A/B/C·트레이드오프·추천안·마이그레이션 스케치·기존 필드 영향 매핑). → 유저 검토·승인 후 별도 세션에서 DDL/구현.
