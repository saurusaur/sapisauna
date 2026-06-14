# 스토리 배경사진 렌더링 성능 리뷰

## 근본 이슈

사진 선택 → 프리뷰 표시까지의 지연. 두 가지 병목:

1. **HEIC**: 서버 왕복 1-2초 + 네트워크 지연. 폴백(heic2any WASM)은 5-15초
2. **대용량 JPG/PNG**: 클라이언트 Canvas 리사이즈 자체는 100-300ms이나, **원본 파일 로딩(createImageBitmap)이 5-20MB 파일에서 300ms-1초+** 소요
3. **메인 스레드 블로킹**: Canvas 작업이 메인 스레드에서 실행 → UI 프리즈 체감

## 현재 솔루션 현황

| 포맷 | 경로 | 소요 시간 | 문제 |
|------|------|-----------|------|
| HEIC | 서버(sharp) → 폴백(heic2any) | 1-2초 / 5-15초 | 서버 의존, 폴백 극느림 |
| JPG/PNG | 클라이언트 Canvas | 100ms-1초+ | 대용량 시 메인스레드 블록 |

**한계**: Canvas toBlob은 동기적으로 메인 스레드 점유. 큰 이미지일수록 UI 멈춤 체감 증가.

---

## 사이클 1: 제안

### 후보 A: Web Worker + OffscreenCanvas
- Canvas 리사이즈를 Web Worker로 이동 → 메인 스레드 프리
- `createImageBitmap`은 Worker에서 사용 가능
- OffscreenCanvas는 Chrome/Safari 16.4+ 지원

### 후보 B: 리사이즈 스킵 (프리뷰 단계)
- 프리뷰에서는 원본 Object URL 바로 표시 (`URL.createObjectURL(file)`)
- CSS `background-size: cover`가 브라우저 네이티브 리사이즈 처리
- **실제 리사이즈는 export 시점에만** 수행
- 프리뷰 즉시 표시 → 체감 0ms

### 후보 C: progressive 렌더링
- 먼저 썸네일(320px)을 빠르게 생성 → 프리뷰 표시
- 백그라운드에서 풀사이즈 리사이즈 → 교체
- 체감 속도 개선이지만 구현 복잡도 높음

### 후보 D: sharp API route 유지 + Edge Runtime
- Vercel Edge Function에서 sharp 대신 `@cloudflare/images` 등 사용
- 글로벌 엣지에서 처리 → 지연 감소
- 비용·복잡도 증가

---

## 사이클 2: 분석

| 후보 | 체감 개선 | 구현 난이도 | 유지보수 | 호환성 |
|------|-----------|------------|---------|--------|
| A. Web Worker | 중 (시간 동일, UI 안 멈춤) | 중 | 중 | Safari 16.4+ (iOS 16.4+) |
| B. 리사이즈 스킵 | **최상** (즉시 표시) | **최저** | **최저** | 모든 브라우저 |
| C. Progressive | 상 (빠른 첫 표시) | 높음 | 높음 | 모든 브라우저 |
| D. Edge Runtime | 중-상 | 높음 | 높음 | 인프라 의존 |

### 후보 B 심층 분석

**프리뷰에서 리사이즈가 정말 필요한가?**
- 프리뷰 카드: 1080×1920을 화면에 축소 표시 (실제 렌더 ~360×640px)
- CSS `background-size: cover` + `filter: blur(3px)` → 원본이든 리사이즈든 시각적 차이 없음
- 브라우저는 `<img>` / `background-image`에 대해 GPU 가속 리사이즈 수행
- **메모리**: 20MB 원본 → 디코딩 시 ~50MB RAM. 모바일에서 부담될 수 있으나, 1장이면 문제없음

**export 시점 리사이즈:**
- export 버튼 누를 때 `processPhoto()` 호출 → Canvas 리사이즈 → export
- 이미 export는 1-2초 걸리므로 추가 300ms는 체감 무의미
- 또는 export 시 `ctx.drawImage(img, ...)` 자체가 리사이즈 역할 → 별도 리사이즈 불필요

---

## 사이클 3: 비판

### 후보 B 비판
- **장점이 압도적**: 코드 10줄 이내 변경, 즉시 프리뷰, 유지보수 부담 0
- **리스크**: 대용량 원본(20MB+) 디코딩 시 메모리. 그러나:
  - 모바일 카메라 JPG = 보통 3-8MB (iPhone 15 기준)
  - HEIC = 1-3MB (이건 어차피 서버 변환 필요)
  - 1장만 로드하므로 메모리 이슈 극히 낮음
- **blur(3px)가 품질 차이를 완전히 가림** → 리사이즈 자체가 불필요한 작업이었을 가능성

### 후보 A 비판
- Web Worker는 "느린 작업을 안 보이게" 하는 것이지 "빠르게" 하는 건 아님
- OffscreenCanvas iOS 16.4+ 제한 → 구형 기기 폴백 필요
- 복잡도 대비 효과가 후보 B보다 낮음

### 후보 C/D 비판
- 현재 앱 규모(초기 MVP)에 과도한 엔지니어링
- 유저 수 < 1000 단계에서 Edge Runtime 비용 정당화 어려움

### HEIC 처리 비판
- 서버 변환은 유지해야 함 (브라우저가 HEIC를 네이티브 디코딩 못하므로 Object URL도 불가)
- heic2any 폴백은 오프라인/서버 장애 대비로 가치 있음
- 현재 구조가 HEIC에 대해서는 최선

---

## 최종 추천

### 즉시 적용: 후보 B (프리뷰 리사이즈 스킵)

```
변경 전: 파일 선택 → processPhoto(리사이즈) → Object URL → 프리뷰
변경 후:
  비-HEIC: 파일 선택 → URL.createObjectURL(file) → 즉시 프리뷰
  HEIC:    파일 선택 → 서버 변환(JPEG 필요) → Object URL → 프리뷰
  export:  Canvas drawImage가 자체 리사이즈 → 별도 처리 불필요
```

**구현 범위:**
- `process-photo.ts`: 비-HEIC는 `URL.createObjectURL(file)` 직접 반환
- `image-export.ts`: export 시 원본 URL에서 Canvas가 리사이즈 (이미 하고 있음, drawImage의 width/height 인자)
- 예상 변경: ~5줄

**효과:**
- 비-HEIC 프리뷰: 100-1000ms → **0ms** (즉시)
- HEIC 프리뷰: 1-2초 (변동 없음, 서버 변환 필수)
- export 품질: 변동 없음 (Canvas drawImage가 리사이즈 담당)

### 향후 고려 (유저 수 증가 시)
- Web Worker: export 시 Canvas 작업을 Worker로 이동 (export 중 UI 프리즈 방지)
- HEIC 서버 변환 캐싱: 같은 파일 재선택 시 캐시 히트
