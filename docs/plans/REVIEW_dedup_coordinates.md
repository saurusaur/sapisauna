# Dedup 좌표 & 중복 검증 로직 — 추가 검토 메모

> 장소 DB 연동 플랜 진행 중 분리된 검토 항목

## 현재 결정 (플랜 반영)

- 좌표는 `places`에만 저장 (첫 등록 시 해당 소스 좌표 사용, 이후 유지)
- Naver 원본 좌표는 `external_id` "{mapx}_{mapy}"에 보존됨

## Dedup(중복 방지) 로직

장소 등록 시 3단계 체크:
```
1단계: place_sources에서 source + external_id 일치 → 기존 place 반환
2단계: places에서 좌표 50m 이내 → 기존 place에 새 source 추가
3단계: 매칭 없음 → 신규 place + source 생성
```

## 검토 필요 사항

### Q1: 좌표를 place_sources에도 저장해야 하나?

**places에만 (현재 결정):**
- 단순, dedup 쿼리 간단 (`places.latitude/longitude` 1회 비교)
- Naver 원본은 external_id에 이미 보존
- 단점: 소스별 좌표 차이 추적 불가

**place_sources에도 저장:**
- 소스별 원본 좌표 완전 보존
- Naver KATEC→WGS84 변환 오차 추적 가능
- 나중에 더 정확한 좌표로 places 업데이트 가능 (예: Google 좌표가 더 정확)
- 단점: place_sources에 2컬럼 추가

### Q2: 50m 반경 기준이 적절한가?

- 서울 사우나/목욕탕은 보통 건물 단위 — 50m면 충분
- 해외 대형 리조트 스파는 건물이 넓을 수 있음 — 100m가 나을 수도
- 같은 건물 내 다른 층의 다른 업체는? (예: 같은 빌딩 1층 사우나 vs 3층 스파)
- Naver KATEC 변환 오차가 50m 이상일 수 있음

### Q3: dedup 충돌 시 유저 확인 UX

- 좌표가 가까운 기존 장소 발견 시: 자동 매칭? 유저에게 "이 장소가 맞나요?" 확인?
- 이름이 다른데 좌표가 같은 경우 (리브랜딩 등) 처리

### Q4: 대표 좌표 업데이트 정책

- 첫 소스의 좌표를 영구 사용?
- 더 정확한 소스(Google)가 추가되면 업데이트?
- 수동 보정 가능?

## 참고

- `docs/plans/PLAN_place_db_schema.md` — 원본 스키마 설계
- `/Users/stella/.claude/plans/mutable-beaming-sunrise.md` — 전체 구현 플랜
