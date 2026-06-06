# 해외 기존 7건 검증 (검증만, 무변경) — 2026-06-04

> 23건 중 이미 DB 존재(2026-03 큐레이션 시드 출처). 사용자 결정: **검증만 후 보고, 손대지 않음**.
> review의 facility_type "hotel-spa"는 마이그레이션 **026에서 hotel-premium으로 리네임·폐기**된 구표기 → DB hotel-premium이 정답.

| # | 시설(DB명) | place_id | DB ft | review ft | city | 온도로그 | 판정 |
|---|---|---|---|---|---|---|---|
| 1 | Sauna Tokyo | ChIJCXXkNHeLGGAR… | public-bath | public-bath | Tokyo | bather(온도없음), male-only ✓ | ✅ 일치 |
| 2 | Shibuya Saunas | ChIJpzjfMsyLGGAR… | public-bath | public-bath | Tokyo | bather(온도없음) | ✅ 일치 |
| 3 | Kairyou-yu | ChIJ2-qK3EKLGGAR… | **small-bath** | public-bath | Tokyo | 없음 | ⚠️ ft 차이 → **small-bath 유지(사용자 결정)** |
| 4 | Taikou-no-Yu(아리마) | ChIJgZSbjEKKAGAR… | public-bath | public-bath | Kobe | bather(온도없음) | ✅ 일치 / 카톡 건식 93-94도 **미반영**(enrich 보류) |
| 5 | TOTOPA | ChIJ3R0NHwCNGGAR… | public-bath | public-bath | Tokyo | bather(온도없음) | ✅ 일치 |
| 6 | Midorinokaze | ChIJ26524iBbdV8R… | hotel-premium | hotel-spa(구표기) | Date | bather(온도없음) | ✅ 일치(026 리네임) |
| 7 | Janu Tokyo | ChIJEWV5V2-LGGAR… | hotel-premium | hotel-spa(구표기) | Tokyo | bather(온도없음) | ✅ 일치(026 리네임) |

## 요약
- 7건 모두 시드 등록 시 **랭킹·aufguss·self-loyly 등 카톡 review보다 풍부한 데이터** 보유 → 손대지 않음.
- **카이료유**만 ft 실차이(small-bath vs review public-bath) → 사용자 결정으로 **small-bath 유지**.
- (선택) 미반영 enrich 후보: 아리마 건식 93-94도 카톡 후기. 현재 보류.
