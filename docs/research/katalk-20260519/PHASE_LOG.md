# katalk DB Sync — Phase 통합 로그 (PHASE_LOG)

> 완료 phase들의 중간 산출물(audit·dryrun·diff·status 등 ~33개)을 2026-06-04 정리하며 **핵심 수치·결론·교훈만** 여기로 흡수. 원본 산출물은 삭제됨(git 이력에서 복구 가능). 데이터 계보·등록 컨벤션은 `README.md`, 시설별 결정은 `katalk-new-register-decisions-20260603.md`.

## 📅 Phase 결과 수치
| Phase | 작업 | 결과 |
|---|---|---|
| ~3 (선행) | facility_type 7종(026/027)·city 보강(028)·enrich 어드민로그·개별 온도/facilities 교정 | 라이브 DB 반영 (상세: handoff archive 0529_v2 §11·§13) |
| 4 국내 | NEW 48→**실신규 40건** 등록 (−5 silent중복, −3 좌표병합) | places 256→**296**(+40), naver+mapx_mapy. 온도위반0·중복0 |
| 4 enrich | NULL보강6·신규로그4·facilities/memo 교정 | 안전정책(NULL보강+진짜충돌만 apply, artifact·노이즈·경계 skip) |
| 4 jjim/deeplog | jjim Phase5(숲속한방랜드 등)·깨진 facilities 42곳·deep_log memo 손상 7건 | 라이브 반영 |
| 4b 해외 | 23건 중 7 기존(시드)·**신규 16건 등록** | places 296→**312**(+16), google+place_id. cc JP14/US1/HK1 |

## ⚠️ 교훈 (재발방지 — 다음 등록 시 필수)
1. **자동 이름매처 갭 = silent 중복**: "이미 DB 존재인데 NEW 오분류"가 체계적으로 발생 → 등록 전 **좌표 프록시미티(<120m) 전수검사 필수**. (사례: 더케이호텔 2m·국제광천수온천 12m·리버사우나 7m 등 5건이 이름매처를 통과해 silent 중복 직전)
2. **CSV 칸밀림(FIX135)**: flat.csv 일부 행에 건식↔습식·온탕↔열탕 밀림 잔존(국제광천수온천 steam43→실은 건식70). 온도 등록 전 raw_quote 1:1 대조 게이트 권장.
3. **city 정규화**: 경기 광주시가 "광주광역시(Gwangju)"로 오변환되는 disambiguation 버그 있었음 → 경기 광주시=`Gwangju-si`로 분리(README 반영됨).
4. **지오코딩 오매칭**: Naver/Google top-1 맹신 금지(스페이스본→스크린골프, 네스트→솔밭해수방, 덕산온천탕→덕원온천장, 스파앳홈T1→T2 등). 분류+주소 시·군 일치로 선택.
5. **해외 hotel-spa enum 폐기**: 026에서 hotel-premium 리네임 → 해외 호텔류는 hotel-premium. 당일 메가온천(아리마·fuua)은 resort-spa.

## 🔭 미적용/잔여 검토 (산출물 삭제로 유실 방지 — 메모)
- **resort-spa 재분류 후보 (미확정)**: `reclassify-candidates` 산출의 워터파크/메가 데이온천 시그널 15곳 — 스플라스·클럽디오아시스·강변스파랜드·더파크스파랜드·디오션·메가스파·봉일스파랜드·센텀스파랜드·워터킹덤·**아쿠아필드 고양/안성/하남**·이천 테르메덴·Therme Erding(DE). 현재 일부 public-bath/hotel-spa 잔존 가능 → 일괄 resort-spa 전환 검토 필요.
- **DB 전수검수 잔여 플래그(2026-06-01, places 255 기준)**: city-missing 114·g-name-mismatch 43·type? 18·ext-id-missing 9·coord-far 1. city/ext-id 상당수는 이후 보강됐을 수 있으나 **재감사로 현재 수치 재확인 필요**(`katalk-db-full-audit.mjs` 재실행).
- **enrich 경계 skip 2건**: 스파디움(dry77→71)·조선팰리스(steam58→52) — 데이터 겹침으로 skip. 추후 재확인 시 참고.
- **아리마 카톡 건식 온도**: 94도 반영 완료(2026-06-04).

## 🧰 재현 방법 (2026-06-04 정리 후 잔존 6 스크립트)
- 감사 재실행: `katalk-db-full-audit.mjs` (DB↔Google/Naver 전수검수. 캐시 qa/는 정리됨 → 재실행 시 재생성)
- 매칭 마스터 재생성: `katalk-master-reference.mjs`
- flat 재병합(FIX135): `katalk-merge-flat.mjs`
- 등록: 국내 `katalk-new-register.mjs`(+`katalk-new-meta-final-20260603.json`) / 해외 `katalk-overseas-register.mjs`(+`katalk-overseas-geocode.mjs`)
> 삭제된 일회성 감사(db-crosscheck·temp-sanity·name-facility·enrich-apply 등)는 db-full-audit + 등록 스크립트 내장 범위검증으로 대체됨.
