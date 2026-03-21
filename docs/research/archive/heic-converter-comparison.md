# HEIC → JPEG 변환 라이브러리 종합 비교

> 조사일: 2026-03-14 | 신뢰도: ⚠️ 부분확인 (npm/GitHub 공개 데이터 + 커뮤니티 벤치마크 기반)

---

## 목차
1. [클라이언트사이드 라이브러리 비교표](#1-클라이언트사이드-라이브러리-비교표)
2. [라이브러리 상세 분석](#2-라이브러리-상세-분석)
3. [서버사이드 대안](#3-서버사이드-대안)
4. [2025-2026 최신 동향](#4-2025-2026-최신-동향)
5. [우리 프로젝트 권장안](#5-우리-프로젝트-권장안)

---

## 1. 클라이언트사이드 라이브러리 비교표

| 패키지 | 번들 크기 | 주간 다운로드 | 마지막 릴리즈 | 브라우저 지원 | libheif 버전 | 핵심 특징 |
|--------|-----------|-------------|-------------|-------------|-------------|----------|
| **heic2any** | ~2.72 MB (min), ~1.15 MB (gzip) | ~430K | v0.0.4 (2023-04) | ✅ 브라우저 전용 | 구버전 (미공개) | 가장 대중적, Web Worker 지원 |
| **heic-to** | ~2.5 MB (WASM 포함 추정) | ~소규모 | v1.4.2 (2026-02) | ✅ 브라우저 전용 | **1.21.2** (최신) | 가장 활발한 유지보수, Worker 지원 |
| **libheif-js** | ~2.5 MB (WASM 번들) | ~170-316K | v1.19.8 | ✅ 브라우저 + Node | 1.19.8 | 로우레벨 디코더, 직접 제어 가능 |
| **heic-convert** | 7.92 KB (자체) + libheif-js 의존 | ~285-434K | v2.1.0 (2년 전) | ⚠️ 브라우저 가능 (메인 스레드만) | libheif-js 의존 | Node 우선, 브라우저는 별도 임포트 |
| **heic-decode** | ~수 KB (자체) + libheif-js 의존 | ~298K | v2.1.0 (6개월 전) | ⚠️ 브라우저 가능 | libheif-js 의존 | raw pixel 데이터만 반환 |
| **@saschazar/wasm-heif** | WASM 기반 (크기 미공개) | 극소 | 미확인 | ✅ 브라우저 + Worker + Node | libheif 기반 | 의존성 없음, 디코딩만 |
| **@seven332/libheif-wasm** | WASM 기반 | 극소 | v0.2.2 (2년 전) | ✅ | 미확인 | 비활성 |

### 핵심 인사이트
- **모든 브라우저 HEIC 라이브러리의 번들 크기는 ~2-3MB** — libheif WASM 바이너리가 99%를 차지
- 번들 크기를 줄이는 것은 사실상 불가능 (libheif 자체가 대부분)
- 차이는 **libheif 버전** (최신 = iOS 18 HEIC 호환) 과 **유지보수 활성도**에서 발생

---

## 2. 라이브러리 상세 분석

### 2-1. heic2any (현재 사용 중)

- **npm**: https://www.npmjs.com/package/heic2any
- **GitHub**: https://github.com/alexcorvi/heic2any (825 stars)
- **번들**: ~2.72 MB (min), ~1.15 MB (gzip)
- **라이선스**: MIT
- **마지막 릴리즈**: v0.0.4 — 2023-04 (약 3년 전)
- **유지보수**: ❌ 비활성 (24개 미해결 이슈, 응답 없음)
- **libheif 버전**: 구버전 (정확한 버전 미공개, 1.12.x 추정)

**성능 벤치마크 (커뮤니티 보고)**:
| 이미지 크기 | 디바이스 | 변환 시간 |
|------------|---------|----------|
| 1.6 MB HEIC | 데스크톱 브라우저 | ~5초 |
| 3 MB HEIC | 안드로이드 | ~2분 |
| ~4000x3000 (추정) | 모던 데스크톱 | 3-8초 |

**장점**:
- 가장 많은 다운로드 → 커뮤니티 예제 풍부
- JPEG, PNG, WebP, GIF 출력 지원
- Web Worker 내장
- quality 파라미터 지원
- 브라우저 전용 → API가 단순

**단점**:
- ❌ **3년간 업데이트 없음** — 유지보수 포기 상태
- ❌ **구버전 libheif** → iOS 18+ HEIC 파일 디코딩 실패 가능
- ❌ 번들 2.72MB
- ❌ 대형 이미지에서 매우 느림 (5초+)
- ❌ 안드로이드에서 극도로 느림 (분 단위)
- ❌ 출력 파일 크기가 원본보다 커지는 이슈 (#32)

**알려진 이슈**:
- iOS 18 HEIC 파일 처리 실패 보고 (libheif 1.18+ 필요)
- 프로덕션 배포 시 스크립트 프리즈 (#6)
- 변환 속도 느림 (#36) — "not planned"으로 종료됨

---

### 2-2. heic-to ⭐ (유력 대안)

- **npm**: https://www.npmjs.com/package/heic-to
- **GitHub**: https://github.com/hoppergee/heic-to (301 stars, 225+ 의존 프로젝트)
- **번들**: WASM 포함 ~2.5 MB (추정, libheif 1.21.2 기반)
- **라이선스**: MIT
- **마지막 릴리즈**: v1.4.2 — 2026-02-03 (1개월 전!)
- **유지보수**: ✅ 매우 활발 (106 커밋, libheif 최신 추적)
- **libheif 버전**: **1.21.2** (최신)

**주요 기능**:
- `isHeic()` — HEIC 파일 감지
- JPEG, PNG, Bitmap 출력
- quality 설정 가능
- Web Worker 실행 가능
- ES Module, IIFE, CSP-compliant 임포트 지원
- CDN (jsDelivr) 직접 사용 가능

**장점**:
- ✅ **가장 최신 libheif** (1.21.2) → iOS 18 HEIC 완벽 호환
- ✅ **활발한 유지보수** — 매달 릴리즈
- ✅ libheif 업스트림 릴리즈를 지속적으로 추적
- ✅ Worker 지원
- ✅ 라이브 데모 제공

**단점**:
- 상대적으로 적은 다운로드 (커뮤니티 예제 부족)
- 번들 크기는 heic2any와 비슷 (~2.5 MB)
- GIF/WebP 출력 미지원 (JPEG/PNG만)

---

### 2-3. libheif-js (로우레벨 디코더)

- **npm**: https://www.npmjs.com/package/libheif-js
- **GitHub**: https://github.com/catdad-experiments/libheif-js (107 stars)
- **번들**: ~2.5 MB (WASM 번들 버전)
- **라이선스**: LGPL-3.0
- **마지막 릴리즈**: v1.19.8
- **유지보수**: ⚠️ 보통 (catdad-experiments 유지)

**3가지 빌드 제공**:
1. `libheif-js` — Emscripten JS 빌드 (Node용)
2. `libheif-js/wasm` — WASM (Node용, 동적 로딩)
3. `libheif-js/wasm-bundle` — WASM 번들 (브라우저용, .wasm 내장)

**장점**:
- heic-convert, heic-decode의 실질적 백엔드
- 직접 사용 시 최대 유연성
- WASM 버전으로 브라우저에서도 사용 가능

**단점**:
- ❌ **LGPL-3.0 라이선스** — 상업 프로젝트에서 주의 필요
- 로우레벨 API → 직접 Canvas에 그리거나 Blob으로 변환하는 코드 필요
- heic-to나 heic2any 대비 사용 편의성 낮음
- libheif 1.19.8 → 최신(1.21.2)보다 약간 뒤처짐

---

### 2-4. heic-convert (Node 우선)

- **npm**: https://www.npmjs.com/package/heic-convert
- **GitHub**: https://github.com/catdad-experiments/heic-convert (311 stars)
- **자체 크기**: 7.92 KB (+ libheif-js 의존)
- **총 번들**: libheif-js 포함 시 ~2.5 MB
- **라이선스**: ISC
- **마지막 릴리즈**: v2.1.0 (약 2년 전)
- **유지보수**: ⚠️ 느린 업데이트 (8개 미해결 이슈)

**브라우저 사용**:
```js
import convert from 'heic-convert/browser';
```
- 브라우저 네이티브 인코더 사용 → 추가 JPEG/PNG 인코더 번들 불필요
- **메인 스레드에서만 동작** (Worker 미지원)
- 동기 작업이 많아 UI 블로킹 가능

**장점**:
- Node.js에서 가장 인기 있는 HEIC 변환 패키지
- `heic-convert/browser` 엔트리로 브라우저 번들 최적화
- catdad-experiments 생태계 (heic-decode, libheif-js와 통합)

**단점**:
- ❌ 메인 스레드만 지원 → UI 프리즈 위험
- ❌ 2년간 업데이트 없음
- libheif 1.19.8 기반 → iOS 18 이슈 가능
- JPEG, PNG만 출력

---

### 2-5. heic-decode (raw pixel 전용)

- **npm**: https://www.npmjs.com/package/heic-decode
- **자체 크기**: 수 KB (+ libheif-js 의존)
- **라이선스**: ISC
- **마지막 릴리즈**: v2.1.0 (6개월 전)

**반환값**: `{ width, height, data: Uint8ClampedArray }` (raw RGBA)

**용도**: HEIC → raw pixel → Canvas → 원하는 포맷으로 직접 인코딩

**장점**:
- 가장 유연한 접근 (Canvas API와 결합 가능)
- 멀티 이미지 HEIC 지원

**단점**:
- 직접 Canvas 변환 코드 작성 필요
- 단독으로는 JPEG/PNG 파일 생성 불가
- libheif-js 의존 (동일 번들 크기)

---

### 2-6. @pdfme/converter

- HEIC 지원 없음. PDF 변환 전용 라이브러리.
- HEIC와 무관.

---

### 2-7. ffmpeg.wasm

- **npm**: https://www.npmjs.com/package/@ffmpeg/ffmpeg
- **번들**: 핵심 ~25 MB (full FFmpeg WASM)
- **HEIC 지원**: ⚠️ 이론적으로 가능하나 실용성 없음

**문제점**:
- FFmpeg WASM 번들이 ~25 MB — HEIC 변환 하나를 위해 비현실적
- FFmpeg의 HEIC 지원이 불안정 (libheif 빌드 의존)
- 초기화만 수초 소요
- SharedArrayBuffer 필요 (COOP/COEP 헤더 설정 필요)

**결론**: ❌ HEIC 변환에 사용하면 안 됨. 비디오 처리 전용.

---

### 2-8. Squoosh / jSquash / libavif

- **Squoosh**: AVIF, WebP, MozJPEG, OxiPNG 지원. **HEIC 미지원.**
- **jSquash** (@jsquash/*): Squoosh에서 파생된 WASM 코덱 번들. AVIF 인코딩/디코딩 지원. **HEIC 미지원.**
- **libavif**: AVIF 전용. HEIC(HEVC 기반)와는 다른 코덱.

**결론**: ❌ HEIC 디코딩과 무관. AVIF ≠ HEIC.

---

### 2-9. 기타 WASM 기반 패키지

| 패키지 | 상태 | 비고 |
|--------|------|------|
| @saschazar/wasm-heif | ⚠️ 소규모 | 의존성 없는 독립 WASM 디코더. Cloudinary 이미지 테스트됨 |
| @seven332/libheif-wasm | ❌ 비활성 | v0.2.2, 2년 전 마지막 업데이트 |
| magick-wasm (@imagemagick/magick-wasm) | ⚠️ 가능 | ImageMagick WASM 포트. 100+ 포맷 지원. HEIC 가능하나 번들 거대 |
| wasm-imagemagick | ⚠️ 레거시 | 구버전 ImageMagick WASM. Deno 호환 이슈 |

---

## 3. 서버사이드 대안

### 3-1. ~~sharp + libheif~~ — ❌ 불가 확정

**sharp는 HEIC 변환에 사용할 수 없다.** 어떤 배포 환경에서도 실용적이지 않음.

| 제약 | 설명 |
|------|------|
| **라이선스 (근본 원인)** | HEIC = HEVC 코덱 기반 → Nokia/MPEG-LA 특허. sharp의 prebuilt 바이너리는 libheif를 **의도적으로 제외** |
| **Vercel** | ❌ prebuilt만 허용, 커스텀 빌드 불가 |
| **AWS Lambda** | ❌ 비현실적 — 커스텀 Layer 빌드 + HEVC 라이선스 + 별도 인프라. Cloudflare/Cloudinary 대비 이점 없음 |
| **로컬 개발** | ⚠️ `brew install libheif && npm rebuild sharp`로 가능하나 배포 불가 → 무의미 |

sharp 공식 문서:
> _"Due to the license of Nokia's HEIF library, sharp requires globally installed libvips compiled with libheif support. Prebuilt binaries will not include HEIC support."_

**→ sharp는 HEIC 전략에서 완전히 제외. 서버사이드는 Cloudflare Images / Cloudinary 사용.**

---

### 3-2. Cloudinary (권장 — 별도 리서치 완료)

> 상세: `docs/research/RESEARCH_cloudinary_heic.md`

| 항목 | 내용 |
|------|------|
| HEIC 지원 | ✅ 네이티브 (입력/변환 모두) |
| Free Tier | 25 크레딧/월 (= 25,000 변환 or 25GB 저장소 or 25GB 대역폭) |
| 통합 난이도 | 낮음 (fetch() 만으로 가능, SDK 불필요) |
| 레이턴시 | 첫 요청 수백ms, 이후 CDN 캐시 |
| 유료 | $89/월 (Plus) |

---

### 3-3. Cloudflare Images

| 항목 | 내용 |
|------|------|
| HEIC 지원 | ✅ 입력 지원 (출력은 JPEG/PNG/WebP/AVIF) |
| Free Tier | **5,000 유니크 변환/월** |
| 초과 비용 | $0.50/1,000 변환 |
| 이그레스 | 무료 |
| 방식 | URL 기반 on-the-fly 변환 (R2 연동) |

**장점**: 종량제라 소규모에 최적. 이그레스 무료.
**단점**: Cloudflare 에코시스템 종속. Upload API는 별도 설정 필요.

---

### ~~3-4. AWS Lambda + sharp-heic~~ — ❌ 불가

위 3-1 참조. HEVC 라이선스 + 커스텀 빌드 + 별도 인프라 부담으로 비현실적.
Cloudflare/Cloudinary가 모든 면에서 우월.

---

### 3-5. Supabase Edge Function + magick-wasm

| 항목 | 내용 |
|------|------|
| 방식 | Supabase Edge Function (Deno) + @imagemagick/magick-wasm |
| HEIC 지원 | ⚠️ 이론적 가능 (ImageMagick이 HEIC 지원) |
| 성능 | WASM이므로 네이티브 대비 느림 |
| 장점 | 이미 Supabase 사용 중이면 추가 인프라 불필요 |
| 단점 | Deno 호환 이슈 가능, WASM 번들 크기, Edge Function 메모리 제한 |

---

### 3-6. imgproxy (셀프호스팅)

| 항목 | 내용 |
|------|------|
| HEIC 지원 | ✅ 네이티브 (libvips 기반) |
| 비용 | 오픈소스 무료 (Pro는 유료) |
| 배포 | Docker 기반 — Fly.io, Railway 등에 배포 가능 |
| 성능 | 매우 빠름 (Go + libvips) |
| 복잡도 | 중간 — Docker 컨테이너 관리 필요 |

**적합**: 셀프호스팅 가능하고 이미지 처리 볼륨이 큰 경우.

---

### 3-7. 서버사이드 종합 비교

| 솔루션 | 비용 (소규모) | 복잡도 | HEIC 지원 | Vercel 호환 | 권장도 |
|--------|-------------|--------|-----------|------------|--------|
| **Cloudflare Images** | 무료 (5K/월) | 낮음 | ✅ | ✅ (외부 URL) | ⭐⭐⭐⭐⭐ |
| **Cloudinary** | 무료 (25크레딧) | 낮음 | ✅ | ✅ (외부 API) | ⭐⭐⭐⭐⭐ |
| **imgproxy** | ~$5/월 (Fly.io) | 중간 | ✅ | ✅ (외부 URL) | ⭐⭐⭐⭐ |
| **Supabase Edge + magick-wasm** | Supabase 포함 | 중간 | ⚠️ | N/A | ⭐⭐⭐ |
| ~~AWS Lambda + sharp-heic~~ | - | - | ❌ | ❌ | ❌ 불가 |
| ~~Vercel + sharp~~ | - | - | ❌ | ❌ | ❌ 불가 |

---

## 4. 2025-2026 최신 동향

### 4-1. 브라우저 네이티브 HEIC 지원 현황 (2026-03)

| 브라우저 | HEIC 네이티브 지원 | 비고 |
|---------|-------------------|------|
| Safari (macOS/iOS) | ✅ | macOS High Sierra+ |
| Chrome (macOS) | ⚠️ OS 코덱 의존 | macOS에서만 동작 (OS 디코더 사용) |
| Chrome (Windows) | ⚠️ | MS Store HEIF 확장 설치 시 가능 |
| Chrome (Linux) | ❌ | 대부분 빌드에 HEIF 디코더 미포함 |
| Chrome (Android) | ❌ | 지원 안 함 |
| Firefox | ❌ | 지원 계획 없음 |

**결론**: 2026년 현재도 크로스 브라우저 HEIC 지원은 불가. 변환 라이브러리 여전히 필수.

### 4-2. ImageDecoder API

- Chrome에서 실험적 구현 중이나, HEIC 코덱은 미포함
- HEIC 디코딩에 활용 불가 (2026-03 기준)

### 4-3. 새로운 프로젝트 (2025-2026)

- **heic-to v1.4.x** (2026-02): libheif 1.21.2로 업데이트, 가장 최신
- **QuickJPG** (2025-08): WebAssembly 기반 HEIC 변환기, 브라우저 전용
- **Heic2Jpg** (2026-01): Next.js + WASM 기반, HN 공유됨 — 프라이버시 퍼스트
- **@qs-coder/heic-convert**: heic-convert 포크, 개선 버전 (상세 미확인)

### 4-4. libheif 업스트림 발전

- libheif 1.18.0+: iOS 18 HEIC 파일 호환 수정
- libheif 1.21.2: 최신 안정 릴리즈 (2025년 말)
- **heic2any가 구버전을 사용하므로 iOS 18 사진 처리 실패 가능성 있음**

### 4-5. 성능 개선 트렌드

- WASM SIMD (Single Instruction Multiple Data): 최신 브라우저에서 WASM SIMD 지원 → libheif WASM 빌드 시 SIMD 활용하면 디코딩 속도 2-4x 향상 가능
- 그러나 현재 npm 패키지들이 SIMD 빌드를 제공하는 것은 확인 안 됨
- WebGPU: 이론적으로 GPU 가속 디코딩 가능하나 아직 실험 단계

---

## 5. 우리 프로젝트 권장안

### 현재 상황
- heic2any 사용 중
- Vercel + Next.js + Supabase 아키텍처
- sharp HEIC 변환 불가 확정 (라이선스 + prebuilt 제약, §3-1 참조)

### 옵션별 평가

#### 옵션 A: heic2any → heic-to 교체 (클라이언트사이드 유지)

| 항목 | 내용 |
|------|------|
| 작업량 | 낮음 (API 유사, drop-in 교체에 가까움) |
| 효과 | iOS 18 호환, 최신 libheif, 활발한 유지보수 |
| 번들 영향 | 비슷 (~2.5 MB) |
| 성능 | 비슷 (동일 libheif 기반, 약간 더 최신) |
| 리스크 | 낮음 |

#### 옵션 B: 서버사이드 변환 (Cloudinary / Cloudflare)

| 항목 | 내용 |
|------|------|
| 작업량 | 중간 (API 통합, 환경변수, 에러 핸들링) |
| 효과 | 번들 2.5 MB 제거, 서버 속도 (~100-500ms), 모든 디바이스 일관된 성능 |
| 비용 | 무료 티어 충분 (Cloudflare 5K/월, Cloudinary 25크레딧) |
| 리스크 | 외부 서비스 의존성, 네트워크 추가 왕복 |

#### 옵션 C: 하이브리드 (heic-to + 서버 폴백)

| 항목 | 내용 |
|------|------|
| 방식 | 클라이언트에서 heic-to 시도 → 실패/타임아웃 시 서버 변환 |
| 장점 | 최대 호환성, 서버 비용 절감, 오프라인 가능 |
| 단점 | 구현 복잡도 높음 |

### 즉시 권장: 옵션 A (heic2any → heic-to)

**이유**:
1. 최소 작업으로 최대 개선 (iOS 18 호환 + 활발한 유지보수)
2. 번들 크기는 비슷하지만, 안정성과 호환성 대폭 향상
3. heic2any의 유지보수 포기 상태는 시간이 갈수록 리스크 증가
4. 서버사이드 전환은 다음 단계로 별도 진행 가능

**중기 권장: 옵션 B 추가 (Cloudflare Images 또는 Cloudinary)**
- 번들 크기 ~2.5 MB 절감
- 안드로이드/저사양 디바이스 성능 문제 근본 해결
- HEIC 외 다른 이미지 최적화(리사이즈, WebP 변환)도 함께 처리 가능

---

## 참고 자료

### npm 패키지
- [heic2any](https://www.npmjs.com/package/heic2any)
- [heic-to](https://www.npmjs.com/package/heic-to)
- [libheif-js](https://www.npmjs.com/package/libheif-js)
- [heic-convert](https://www.npmjs.com/package/heic-convert)
- [heic-decode](https://www.npmjs.com/package/heic-decode)
- [@saschazar/wasm-heif](https://www.npmjs.com/package/@saschazar/wasm-heif)
- [@imagemagick/magick-wasm](https://www.npmjs.com/package/@imagemagick/magick-wasm)

### GitHub
- [heic2any Issues](https://github.com/alexcorvi/heic2any/issues)
- [heic-to Repository](https://github.com/hoppergee/heic-to)
- [libheif (upstream)](https://github.com/strukturag/libheif)
- [sharp-heic-lambda-layer](https://github.com/zoellner/sharp-heic-lambda-layer)
- [imgproxy](https://github.com/imgproxy/imgproxy)
- [jSquash](https://github.com/jamsinclair/jSquash)

### 서비스
- [Cloudinary Pricing](https://cloudinary.com/pricing)
- [Cloudflare Images Pricing](https://developers.cloudflare.com/images/pricing/)
- [Can I Use: HEIF](https://caniuse.com/heif)

### 블로그 / 분석
- [Handling HEIC on the web (Upside Lab)](https://upsidelab.io/blog/handling-heic-on-the-web)
- [heic2any Conversion Slow Issue #36](https://github.com/alexcorvi/heic2any/issues/36)
- [heic2any Bundle Size Issue #35](https://github.com/alexcorvi/heic2any/issues/35)
- [Privacy-First HEIC Converter (DEV Community)](https://dev.to/alldadev/how-i-built-a-privacy-first-heic-converter-with-webassembly-58gk)
- [npm trends comparison](https://npmtrends.com/heic-convert-vs-heic-decode-vs-heic2any-vs-libheif-js)
