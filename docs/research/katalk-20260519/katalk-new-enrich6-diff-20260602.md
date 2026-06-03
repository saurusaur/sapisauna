# 6건(NEW 오분류→동일확정) enrich 진단 (read-only)

기존 MATCHED enrich에서 빠졌던 6건. CSV ↔ 기존 어드민로그 비교.

| 시설 | 기존 어드민로그 | DB(온/냉/건/습/열) | CSV(온/냉/건/습/열) | 판정 |
|---|---|---|---|---|
| 호텔탑스텐 금진온천 | 있음+deep | ·/·/·/·/· | 39/·/73/·/41 | 🟢보강UPDATE(hot=39,dry=73,vh=41) |
| 덕구온천스파월드 | 있음+deep | 42/16/92/·/44 | 42/24/73/·/44 | ⚠️충돌→신규로그(cold:16→24,dry:92→73)  |
| 청춘목욕탕 | 있음+deep | ·/·/·/·/· | ·/20/80/·/· | 🟢보강UPDATE(cold=20,dry=80) |
| 주심유황참숯가마 | 있음+deep | ·/·/·/·/· | ·/·/·/·/· | 🏷️facilities += open-air-bath (노천탕 존재, 영하5도시만 운영) |
| 하남사우나(용산) | 없음 | — | 38/·/110/·/43 | ⚠️어드민로그없음 → 신규INSERT (여탕) |
| 대영온천 | 있음+deep | 40/18/94/·/· | 40/18/94/·/44 | 🟢보강UPDATE(vh=44). 습식82 범위초과 omit |

---

## ✅ 확정 (2026-06-02 유저) — Phase 4 NEW 등록과 한 배치로 apply

| 시설 | UUID | 조치 |
|---|---|---|
| 호텔탑스텐 금진온천 | 3e337352 | logs UPDATE hot=39,dry=73 + deep UPDATE vh=41 |
| 청춘목욕탕 | 976f42ab | logs UPDATE cold=20,dry=80 |
| 대영온천 | 6d05bd50 | deep UPDATE vh=44 (습식82 omit) |
| 덕구온천스파월드 | 437f289a | **5/19 신규 어드민로그 INSERT**(hot42,cold24,dry73,vh44) 기존보존 + **places.facilities += outdoor-rest**(외기욕). nap은 모호→제외 |
| 하남사우나(용산) | f73d775a | **신규 어드민로그 INSERT**(hot38,dry110,vh43, bath_gender=female) + memo |
| 주심유황참숯가마 | 73b89671 | **places.facilities += open-air-bath**. 온도 없음→로그 변경 없음 |

안전장치: vt 범위검증·반올림, 5/19 신규로그 중복가드, facilities 합집합(중복 미추가).