# HEIC 변환 전략 종합 리서치

> 최종 업데이트: 2026-03-18 | 신뢰도: ✅ 검증됨 (공식 문서 + npm/GitHub + 커뮤니티 벤치마크)
> 관련 파일: `heic-converter-comparison.md`, `heic-library-deep-comparison.md`, `heic-resize-before-decode.md`

---

## 현재 상태

- **사용 중**: heic2any v0.0.4 (클라이언트 WASM)
- **문제**: 스토리 생성 시 20초+ 소요 (HEIC 변환 + Canvas 렌더링)
- **서버 제약**: sharp HEIC 변환 불가 (아래 §7 참조)

---

## 1. 클라이언트 HEIC 변환 라이브러리 비교

> 상세 비교: `heic-library-deep-comparison.md`

| 항목 | **heic-to** ⭐ | **libheif-js** | **heic2any** (현재) |
|------|---------------|----------------|---------------------|
| libheif 버전 | **1.21.2** (최신) | 1.19.8 | ~1.3.x (2019) |
| 최종 배포 | 2026-02-03 | 2025-06-12 | 2023-03-29 |
| 주간 다운로드 | 139K | 367K | 466K |
| TypeScript | ✅ 내장 | ❌ | ❌ |
| iOS 18 호환 | ✅ | ⚠️ 가능하나 구버전 | ❌ 실패 보고 (#61) |
| Android Chrome | ✅ | ✅ | ⚠️ 크래시 보고 |
| Next.js 빌드 | `heic-to/next` 제공 | 수동 webpack 설정 | 없음 |
| 메모리 이슈 | 없음 | WASM 컴파일 경고 (#31) | **70MB 누수** (#30) |
| API 난이도 | `heicTo()` 한 줄 | Canvas ~30줄 직접 구현 | `heic2any()` 한 줄 |
| 라이선스 | LGPL-3.0 | LGPL-3.0 | MIT |

### 기타 후보 — 모두 부적합

| 라이브러리 | 탈락 사유 |
|-----------|----------|
| heic-convert | Node.js 전용, 브라우저 불가 |
| @saschazar/wasm-heif | 2021년 이후 폐기, libheif 1.11 |
| heic2any 포크들 | 원본보다 구버전 |
| ffmpeg.wasm | 25MB 번들, HEIC에 부적합 |
| Squoosh/libavif | HEIC 미지원 (AVIF ≠ HEIC) |

### 결론: heic-to가 클라이언트 사이드 1순위

---

## 2. 디코드 전 리사이즈 — 불가능

> 상세: `heic-resize-before-decode.md`

| 방법 | 결과 | 사유 |
|------|------|------|
| heic2any/heic-to 옵션 | ❌ | quality만 지원, 리사이즈 파라미터 없음 |
| libheif-js 썸네일 추출 | ❌ | C API는 지원하지만 JS 래퍼가 미노출 |
| HEIC 내장 썸네일 직접 추출 | ❌ | raw HEVC 데이터라 별도 디코더 필요 |
| ImageDecoder API | ❌ | iOS Safari 미지원 → PWA 부적합 |
| createImageBitmap (HEIC blob) | ❌ | 브라우저가 HEIC 네이티브 지원 시만 가능 |

**WASM 디코드가 전체 시간의 80-90%** → 디코드 후 최적화는 10-20% 개선에 불과

---

## 3. 성능 병목 분석

### 현재 파이프라인 시간 분석 (3000×3000 HEIC, 모바일)

| 단계 | 예상 시간 | 비중 |
|------|-----------|------|
| HEIC WASM 디코드 (heic2any) | 3~8초 | **80-90%** |
| Canvas drawImage + blur | 50~150ms | 2-5% |
| SVG→Image 변환 | ~50ms | 1-2% |
| canvas.toBlob (PNG 인코딩) | 100~300ms | 5-10% |
| **합계** | **3.5~8.5초** | 100% |

### heic2any → heic-to 교체 시 속도 변화

- 동일 libheif 기반이라 **WASM 디코드 시간 자체는 비슷**
- asm.js(heic2any) → WASM(heic-to) 차이로 **10-30% 빨라질 수 있음** (8초→6초 수준)
- 70MB 메모리 누수 해결 → 반복 사용 시 성능 안정
- **20초 문제의 근본 해결은 아님** — 타이밍 측정 후 정확한 병목 파악 필요

### 추가 최적화 가능 항목 (Canvas 렌더링)

| 현재 | 변경 가능 | 효과 |
|------|----------|------|
| 캔버스 1080×1920 | 810×1440 (인스타 최소 권장) | 픽셀 44% 감소 |
| PNG 출력 | JPEG 0.85 | toBlob 2-5x 빠름 + 파일 2-3MB→500KB |
| blur(3px) 필터 | 줄이거나 제거 | GPU 부담 감소 |

> ⚠️ 타이밍 측정 코드 추가됨 (process-photo.ts, image-export.ts) — 실기기 테스트 후 정확한 병목 확인 예정

---

## 4. 서버사이드 변환 대안

### 4-1. Cloudinary

| 항목 | 내용 |
|------|------|
| HEIC 지원 | ✅ 네이티브 (입력/변환 모두) |
| Free Tier | 25 크레딧/월 (= 25,000 변환 or 25GB 저장소 or 25GB 대역폭) |
| 최대 이미지 | 10MB |
| 레이턴시 | 첫 요청 수백ms, 이후 CDN 캐시 수십ms |
| 유료 | $89/월 (Plus, 225 크레딧) |
| 통합 난이도 | 낮음 (fetch()만으로 가능, SDK 불필요) |

**통합 방식 3가지**:

```
A. Upload API (서버사이드, signed)
   클라이언트 HEIC → API Route → Cloudinary Upload → JPEG URL 반환

B. Unsigned Upload (클라이언트사이드)
   클라이언트 HEIC → Cloudinary 직접 Upload (Upload Preset) → JPEG URL

C. Fetch URL (업로드 없이 변환, 이미 public URL 있을 때)
   https://res.cloudinary.com/{cloud}/image/fetch/f_jpg,q_auto/{heic_url}
```

### 4-2. Cloudflare Images

| 항목 | 내용 |
|------|------|
| HEIC 지원 | ✅ 입력 (출력은 JPEG/PNG/WebP/AVIF) |
| Free Tier | **5,000 유니크 변환/월** |
| 초과 비용 | $0.50/1,000 변환 |
| 이그레스 | **무료** |
| 방식 | URL 기반 on-the-fly 변환 (R2 연동) |

### 4-3. 기타 서버사이드

| 솔루션 | 비용 (소규모) | 복잡도 | Vercel 호환 | 권장도 |
|--------|-------------|--------|------------|--------|
| **Cloudflare Images** | 무료 (5K/월) | 낮음 | ✅ (외부 URL) | ⭐⭐⭐⭐⭐ |
| **Cloudinary** | 무료 (25크레딧) | 낮음 | ✅ (외부 API) | ⭐⭐⭐⭐⭐ |
| imgproxy (셀프호스팅) | ~$5/월 (Fly.io) | 중간 | ✅ (외부 URL) | ⭐⭐⭐⭐ |
| imgix | 크레딧 기반 | 낮음 | ✅ | ⭐⭐⭐ |
| ~~AWS Lambda + sharp-heic~~ | - | - | ❌ | ❌ 불가 (§7 참조) |
| ~~Vercel + sharp~~ | - | - | ❌ | ❌ 불가 (§7 참조) |

### 서버 변환 시 예상 성능

| 구간 | 시간 |
|------|------|
| 클라이언트 → 서버 업로드 (3MB HEIC) | 1-3초 (네트워크 의존) |
| 서버 변환 (HEIC → JPEG + 리사이즈) | 100-500ms |
| 서버 → 클라이언트 다운로드 (500KB JPEG) | 0.5-1초 |
| **합계** | **1.5-4.5초** (vs 현재 3-8초) |

> 네트워크 왕복이 추가되므로 Wi-Fi 환경에서 체감 개선, LTE/3G에서는 비슷할 수 있음

---

## 5. 브라우저 네이티브 HEIC 지원 현황 (2026-03)

| 브라우저 | HEIC 네이티브 지원 |
|---------|-------------------|
| Safari (macOS/iOS) | ✅ (macOS High Sierra+) |
| Chrome (macOS) | ⚠️ OS 코덱 의존 |
| Chrome (Android) | ❌ |
| Chrome (Windows) | ⚠️ MS Store 확장 필요 |
| Firefox | ❌ (계획 없음) |

**결론**: 2026년에도 크로스 브라우저 HEIC 지원 불가 → 변환 라이브러리 필수

---

## 6. 권장 로드맵

### Phase 1: 즉시 — heic2any → heic-to 교체 (작업량: 30분)

- iOS 18 호환 확보 (최신 libheif 1.21.2)
- 70MB 메모리 누수 해결
- TypeScript 타입 내장
- Next.js 빌드 제공
- **속도 개선: 10-30% (asm.js → WASM)**

### Phase 2: 타이밍 측정 후 — Canvas 렌더링 최적화

- 실기기 측정으로 정확한 병목 파악
- PNG → JPEG 전환 (toBlob 2-5x 빠름)
- 캔버스 사이즈 축소 검토 (1080×1920 → 810×1440)
- blur 필터 경량화

### Phase 3: 중기 — 서버사이드 변환 도입

- Cloudflare Images (5K 무료/월) 또는 Cloudinary (25크레딧)
- 클라이언트 번들 ~2.5MB 제거
- 모든 디바이스 일관된 성능 (100-500ms 변환)
- HEIC 외 리사이즈/WebP 변환도 함께 처리 가능
- **안드로이드 성능 문제 근본 해결** (현재 안드로이드에서 분 단위 소요 보고)

---

## 7. sharp HEIC 변환 — 불가 확정

### 결론: ❌ sharp는 어떤 환경에서도 HEIC 변환에 사용할 수 없다

### 불가 사유 (3중 제약)

**1. 라이선스 제약 (근본 원인)**
- HEIC는 HEVC(H.265) 코덱 기반 → Nokia/MPEG-LA 특허 라이선스 필요
- sharp의 백엔드인 libvips는 prebuilt 바이너리에 libheif를 **의도적으로 제외**
- sharp 공식 문서: _"Due to the license of Nokia's HEIF library, sharp requires globally installed libvips compiled with libheif support. Prebuilt binaries will not include HEIC support."_
- 즉, npm install sharp로 받는 바이너리는 **절대** HEIC를 처리할 수 없음

**2. Vercel Serverless 제약**
- Vercel은 prebuilt sharp 바이너리만 허용 (커스텀 빌드 불가)
- libvips를 libheif와 함께 소스 빌드하려면 시스템 라이브러리 설치 필요 → serverless 환경에서 불가
- `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 등의 환경변수로도 우회 불가

**3. AWS Lambda도 비현실적**
- sharp-heic-lambda-layer (https://github.com/zoellner/sharp-heic-lambda-layer) 가 존재하지만:
  - 커스텀 Lambda Layer를 직접 빌드해야 함 (공유 불가 — 라이선스 문제)
  - HEVC 특허 라이선스를 별도로 획득해야 상업적 사용 가능
  - Vercel 아키텍처와 완전히 분리된 별도 인프라 필요
  - 유지보수 부담 대비 효과가 Cloudflare/Cloudinary에 비해 낮음

### 요약

| 환경 | sharp HEIC | 이유 |
|------|-----------|------|
| Vercel Serverless | ❌ | prebuilt 바이너리에 libheif 미포함, 커스텀 빌드 불가 |
| AWS Lambda | ❌ 비현실적 | 커스텀 빌드 + 별도 인프라 + HEVC 라이선스 필요 |
| 로컬 개발 (macOS) | ⚠️ 가능하나 무의미 | `brew install libheif && npm rebuild sharp` 시 동작하지만 배포 불가 |
| Docker 셀프호스팅 | ⚠️ 가능하나 비효율 | 직접 빌드 가능하지만 imgproxy가 더 나은 선택 |

**→ sharp는 HEIC 전략에서 완전히 제외. 서버사이드 변환은 Cloudflare Images 또는 Cloudinary 사용.**

---

## 참고 자료

### npm 패키지
- [heic2any](https://www.npmjs.com/package/heic2any) — 현재 사용 중
- [heic-to](https://www.npmjs.com/package/heic-to) — 교체 1순위
- [libheif-js](https://www.npmjs.com/package/libheif-js) — 로우레벨 대안
- [heic-convert](https://www.npmjs.com/package/heic-convert) — Node.js 전용

### 서비스
- [Cloudinary Pricing](https://cloudinary.com/pricing)
- [Cloudflare Images Pricing](https://developers.cloudflare.com/images/pricing/)

### 기술 참고
- [libheif GitHub](https://github.com/strukturag/libheif) — 업스트림
- [heic-to GitHub](https://github.com/hoppergee/heic-to)
- [Can I Use: HEIF](https://caniuse.com/heif)
- [sharp HEIC limitation](https://sharp.pixelplumbing.com/install#heif) — 공식 "prebuilt에 HEIC 미포함" 명시
