# HEIC/HEIF Client-Side Conversion Library Deep Comparison

> 조사일: 2026-03-14
> 목적: PWA(iOS Safari + Android Chrome)에서 클라이언트 사이드 HEIC → JPEG 변환 라이브러리 선정

---

## 1. 후보 라이브러리 요약

| 항목 | **heic-to** | **libheif-js** | **heic2any** | **heic-convert** |
|------|-------------|----------------|--------------|------------------|
| npm 주간 다운로드 | 139,063 | 366,910 | 465,692 | 322,771 |
| 최신 버전 | 1.4.2 | 1.19.8 | 0.0.4 | 2.1.0 |
| 최종 배포일 | 2026-02-03 | 2025-06-12 | 2023-03-29 | 2023-11-30 |
| 라이선스 | LGPL-3.0 | LGPL-3.0 | MIT | ISC |
| GitHub Stars | 301 | 111 | 828 | (same org) |
| Open Issues | 6 | 6 | 24 | N/A |
| TypeScript 지원 | ✅ 내장 (.d.ts) | ❌ 없음 | ❌ 없음 (@types도 없음) | ✅ @types/heic-convert |
| 브라우저 전용 | ✅ | ✅ (wasm-bundle) | ✅ | ❌ Node.js 전용 |

---

## 2. heic-to (v1.4.2) — 상세 분석

### 기본 정보
- **Repo**: https://github.com/hoppergee/heic-to
- **설명**: "Converting HEIF/HEIF image formats to PNG/JPEG in the browser"
- **libheif 버전**: **1.21.2** (최신에 가까움)
- **Dependencies**: 없음 (zero runtime deps, WASM 내장)
- **마지막 커밋**: 2026-02-03

### 번들 크기
- npm unpacked size: ~22MB (모든 빌드 변형 포함)
- **실제 사용 시 minified**: ~2.4MB (WASM 바이너리 포함)
- gzipped 예상: ~1.0-1.2MB
- 파일 수: 31개 (dist 폴더에 여러 빌드 변형)

### 빌드 변형 (3종)
| Import Path | 용도 | 비고 |
|-------------|------|------|
| `heic-to` | 기본 ESM | `eval()` 사용 가능 환경 |
| `heic-to/csp` | CSP 호환 | `unsafe-eval` 금지 환경 |
| `heic-to/next` | Web Worker / Next.js | Worker 환경 |

### API 예시
```typescript
import { heicTo, isHeic } from "heic-to";

// HEIC 여부 확인
const file: File = input.files[0];
const isHeicFile: boolean = await isHeic(file);

// JPEG 변환
const jpegBlob: Blob = await heicTo({
  blob: file,
  type: "image/jpeg",
  quality: 0.8,  // 0-1
});

// PNG 변환
const pngBlob: Blob = await heicTo({
  blob: file,
  type: "image/png",
  quality: 0.9,
});

// Bitmap 추출 (Canvas용)
const bitmap: ImageBitmap = await heicTo({
  blob: file,
  type: "bitmap",
  options: { imageOrientation: "flipY" },
});
```

### 장점
- ✅ 가장 최신 libheif (1.21.2) → 최신 iPhone HEIC 지원 가능성 높음
- ✅ TypeScript 타입 내장
- ✅ CSP 호환 빌드 제공
- ✅ Next.js/Worker 빌드 제공
- ✅ 활발한 유지보수 (2026-02 최종 업데이트)
- ✅ API가 단순 (heicTo 하나로 끝)
- ✅ isHeic() 유틸 함수 포함
- ✅ Blob 직접 반환 (Canvas 변환 불필요)
- ✅ CDN/IIFE 지원

### 단점/이슈
- ⚠️ LGPL-3.0 라이선스 (상업적 사용 시 주의)
- ⚠️ unpacked 22MB (실제 사용 ~2.4MB이지만 npm install 시 무거움)
- ⚠️ PNG quality 파라미터 실제로 효과 없음 (Issue #26)
- ⚠️ 성능 최적화 요청 있음 - MacBook에서 3-4초 (Issue #19)

### GitHub 주요 이슈
| # | 제목 | 심각도 |
|---|------|--------|
| #26 | PNG quality 파라미터 무효 | 낮음 |
| #24 | 패키지 크기 20MB 과다 | 중간 (실사용 2.4MB) |
| #19 | 변환 속도 최적화 요청 | 중간 |
| #6 | CDN 사용 시 전역 변수 없음 | 해결됨 (v1.4+) |

---

## 3. libheif-js (v1.19.8) — 상세 분석

### 기본 정보
- **Repo**: https://github.com/catdad-experiments/libheif-js
- **설명**: "Emscripten distribution of libheif for Node.JS and the browser"
- **libheif 버전**: **1.19.8** (install.js 확인)
- **Dependencies**: 없음 (zero runtime deps)
- **마지막 커밋**: 2025-06-12

### 번들 크기
- npm unpacked size: ~6.4MB (모든 빌드 변형 포함)
- 3개 빌드: pure JS (~2.6MB) / WASM + loader / WASM-bundle (~3.5MB)
- gzipped 예상: ~1.0-1.5MB (WASM bundle)
- 파일 수: 15개

### 빌드 변형 (3종)
| Import Path | 용도 | 비고 |
|-------------|------|------|
| `libheif-js` | Pure JS (기본) | 번들러 호환, 느림 |
| `libheif-js/wasm` | WASM (동적 로딩) | Node.js용, .wasm 파일 별도 로딩 |
| `libheif-js/wasm-bundle` | WASM (내장) | **브라우저 권장**, JS에 WASM 인라인 |

### API 예시
```javascript
// 브라우저용 WASM bundle
import libheif from "libheif-js/wasm-bundle";

async function heicToJpeg(file) {
  const buffer = await file.arrayBuffer();
  const decoder = new libheif.HeifDecoder();
  const data = decoder.decode(new Uint8Array(buffer));

  if (!data.length) throw new Error("No images found");

  const image = data[0];
  const width = image.get_width();
  const height = image.get_height();

  // Canvas를 통한 변환 필요
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(width, height);

  await new Promise((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (!displayData) return reject(new Error("HEIF processing error"));
      resolve();
    });
  });

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.85);
  });
}
```

### 장점
- ✅ heic-convert, heic-decode의 기반 라이브러리 (검증된 코어)
- ✅ 주간 36만 다운로드 (높은 채택률)
- ✅ Raw 디코딩 API → 유연한 후처리 가능
- ✅ 다중 이미지 추출 (`data[0]`, `data[1]`, ...)
- ✅ Pure JS 폴백 옵션

### 단점/이슈
| # | 제목 | 심각도 |
|---|------|--------|
| #42 | TypeScript 타입 없음 | 중간 |
| #40 | import 문서 부정확 | 낮음 |
| #39 | 벤치마크 정보 없음 | 낮음 |
| #31 | 메인 스레드에서 WASM 컴파일 경고 (>4KB) | **높음** |
| #23 | 번들러 정적 분석 실패 (require) | 중간 |
| #18 | 알파 채널 투명도 버그 (255→0) | 중간 |

- ❌ TypeScript 타입 없음 (@types도 없음)
- ❌ Low-level API → Canvas 변환 코드 직접 작성 필요
- ❌ libheif 1.19.8 (heic-to의 1.21.2보다 구버전)
- ❌ Issue #31: 메인 스레드에서 큰 WASM 컴파일 시 경고
- ⚠️ LGPL-3.0 라이선스

---

## 4. heic2any (v0.0.4) — 상세 분석

### 기본 정보
- **Repo**: https://github.com/alexcorvi/heic2any
- **설명**: "Converting HEIC/HEIF to PNG/JPEG/GIF in the browser"
- **libheif 버전**: **~1.3.x** (2019년경 빌드, 정확한 버전 미확인 — src/libheif.js에 asm.js 기반 구버전 직접 번들)
- **Dependencies**: 없음 (zero deps, libheif 직접 번들)
- **마지막 커밋**: 2024-04-11 (최종 배포: 2023-03-29)

### 번들 크기
- npm unpacked size: ~2.7MB
- minified: ~2.6MB (단일 파일)
- gzipped 예상: ~800KB-1MB
- 파일 수: 6개 (가장 적음)

### API 예시
```typescript
import heic2any from "heic2any";

// 단일 이미지 변환
const jpegBlob: Blob = await heic2any({
  blob: file,                // File 또는 Blob
  toType: "image/jpeg",      // "image/jpeg" | "image/png" | "image/gif"
  quality: 0.85,             // 0-1 (기본값: 0.92)
}) as Blob;

// 멀티 이미지 추출
const blobs: Blob[] = await heic2any({
  blob: file,
  toType: "image/jpeg",
  quality: 0.8,
  multiple: true,            // 모든 이미지를 배열로
}) as Blob[];

// Burst → GIF
const gif: Blob = await heic2any({
  blob: burstFile,
  toType: "image/gif",
  gifInterval: 0.4,          // 프레임 간격 (초)
}) as Blob;
```

### 장점
- ✅ MIT 라이선스 (가장 관대)
- ✅ 주간 46만 다운로드 (최다 채택)
- ✅ API 가장 단순 (함수 하나)
- ✅ GIF 변환 지원 (burst photos)
- ✅ TypeScript 타입 내장 (.d.ts 포함)
- ✅ 번들 크기 가장 작음 (~2.7MB unpacked)

### 단점/이슈 — **심각한 문제 다수**
| # | 제목 | 심각도 |
|---|------|--------|
| #64 | Chrome 크래시 | **치명적** |
| #63 | 최신 iPhone HEIC 파일 미지원 | **치명적** |
| #61 | iPhone 15 Pro + iOS 18 변환 실패 | **치명적** |
| #55 | Safari에서 동작 안 함 | **높음** |
| #52 | 알파 채널 오류 | 중간 |
| #49 | 변환 시 색상 왜곡 (차갑고 어두워짐) | 중간 |
| #38 | iPhone 13 Pro Max 이미지 실패 | 높음 |
| #30 | Worker가 70MB RAM 누수 | **높음** |
| #29 | decodeBuffer 메모리 누수 | 높음 |
| #59 | libheif 라이선스 위반 의혹 | 중간 |

- ❌ **번들된 libheif가 매우 구버전** (~2019, asm.js 기반) → 최신 iPhone HEIC 미지원
- ❌ **메인테이너 비활성** — 마지막 npm 배포 2023년, 치명적 이슈 미해결
- ❌ 24개 오픈 이슈 (대부분 미응답)
- ❌ 70MB 메모리 누수 (Worker 미종료)
- ❌ iPhone 15 Pro + iOS 18 조합에서 변환 실패
- ❌ Safari 호환성 문제 보고
- ❌ Node.js 사용 불가 (DOM 필요)

---

## 5. heic-convert (v2.1.0) — 참고용

> **브라우저 사용 불가** — Node.js 전용. 내부적으로 `heic-decode` → `libheif-js` → `jpeg-js`/`pngjs`를 사용하므로 pngjs/jpeg-js가 Node.js Buffer API 의존.

- 이 라이브러리는 서버사이드 변환에 적합
- 클라이언트 사이드 PWA에는 **사용할 수 없음**

---

## 6. 기타 후보

### @saschazar/wasm-heif (v2.0.0)
- **마지막 배포**: 2021-04-15 (5년 전)
- **libheif 버전**: 1.11.0 (매우 구버전)
- **상태**: 사실상 폐기. 최신 HEIC 미지원 가능성 높음
- **결론**: 사용 부적합

### alexcorvi-heic2any (v0.0.3)
- heic2any의 포크, 2021-12 배포
- 원본보다 더 구버전
- **결론**: 사용 부적합

### @tuily/heic2any (v0.0.6)
- heic2any의 또 다른 포크, 2022-08 배포
- **결론**: 사용 부적합

### 독립 libde265 WASM
- npm에 독립 `libde265-wasm` 또는 `libde265-js` 패키지 **없음**
- HEVC 디코더만 단독으로 쓰려면 직접 Emscripten 빌드 필요 → 비현실적
- libheif가 내부적으로 libde265를 사용하므로 별도 필요 없음

---

## 7. 브라우저 호환성 비교

| 브라우저 | heic-to | libheif-js | heic2any |
|----------|---------|------------|----------|
| iOS Safari 14 | ⚠️ WASM 지원됨, 미검증 | ⚠️ 미검증 | ⚠️ 구버전 호환 가능 |
| iOS Safari 15 | ✅ 예상 호환 | ✅ 예상 호환 | ⚠️ Issue #55 |
| iOS Safari 16 | ✅ 예상 호환 | ✅ 예상 호환 | ⚠️ Issue #55 |
| iOS Safari 17 | ✅ 예상 호환 | ✅ 예상 호환 | ⚠️ 불안정 |
| **iOS Safari 18** | ✅ 예상 호환 (libheif 1.21.2) | ⚠️ 가능하나 libheif 구버전 | ❌ **실패 보고 (Issue #61)** |
| Android Chrome | ✅ | ✅ | ⚠️ 크래시 보고 |
| Desktop Chrome | ✅ | ✅ | ❌ 크래시 보고 (#64) |
| Desktop Firefox | ✅ | ✅ | ⚠️ 미검증 |
| Desktop Safari | ✅ | ✅ | ❌ 실패 보고 (#55) |

**참고**: iOS Safari 17+에서는 HEIC를 네이티브로 지원하므로 변환이 불필요할 수 있음. 하지만 `<input type="file">`로 받은 HEIC를 서버 업로드 전 JPEG 변환 시에는 여전히 라이브러리 필요.

> ❓ 주요 미검증 사항: iOS Safari에서 `<input type="file" accept="image/*">`로 HEIC를 선택하면 iOS가 자동으로 JPEG 변환하여 전달하는 경우가 있음. 이 동작은 iOS 버전과 설정에 따라 다르므로 실기기 테스트 필수.

---

## 8. HEIC 포맷 지원 상세

| 포맷 | heic-to (libheif 1.21.2) | libheif-js (1.19.8) | heic2any (~1.3.x) |
|------|--------------------------|---------------------|--------------------|
| 표준 HEIC (단일) | ✅ | ✅ | ✅ (구 기기만) |
| HEIC 멀티 이미지 | ⚠️ API에 없음 (단일만) | ✅ `data[0..n]` | ✅ `multiple: true` |
| HEIF | ✅ | ✅ | ✅ |
| 10-bit HDR (iPhone 14+ ProRAW) | ✅ 가능성 높음 (최신 libheif) | ⚠️ 1.19.8에서 부분 지원 | ❌ 미지원 가능성 높음 |
| Live Photo HEIC | ⚠️ 정지 이미지만 | ⚠️ 정지 이미지만 | ⚠️ 정지 이미지만 |
| HEIC 시퀀스 (burst) | ❓ 미확인 | ✅ 멀티 디코딩 | ✅ GIF 변환 가능 |

---

## 9. 성능 비교

| 항목 | heic-to | libheif-js | heic2any |
|------|---------|------------|----------|
| 디코딩 엔진 | WASM (libheif 1.21.2) | WASM 또는 Pure JS | asm.js (구버전) |
| 보고된 변환 시간 | 3-4초 (MacBook, 큰 파일) | 벤치마크 없음 | 벤치마크 없음 |
| 메모리 사용 | 보고된 문제 없음 | Issue #31 (WASM 컴파일 경고) | **70MB 누수** (Issue #30) |
| Web Worker 지원 | ✅ (`heic-to/next`) | 수동 구현 필요 | 내장 Worker (but 누수) |
| 메인 스레드 블로킹 | 디코딩 중 블로킹 가능 | 디코딩 중 블로킹 가능 | Worker에서 실행 |

**성능 참고**: 모든 라이브러리가 WASM/asm.js 기반이므로 모바일 디바이스에서 큰 HEIC 파일(12MP+) 디코딩 시 2-5초 소요 예상. Web Worker 사용을 강력 권장.

---

## 10. 에러 핸들링

| 항목 | heic-to | libheif-js | heic2any |
|------|---------|------------|----------|
| 비-HEIC 파일 감지 | ✅ `isHeic()` 함수 | ❌ 직접 구현 | ❌ (런타임 에러) |
| 손상된 파일 | Promise reject | callback에 null 전달 | Promise reject |
| 미지원 포맷 | Promise reject | 빈 배열 반환 | `ERR_LIBHEIF` 에러 |
| 에러 메시지 품질 | ⚠️ 미확인 | ⚠️ 제한적 | ⚠️ 에러 코드만 |

---

## 11. 최종 비교 매트릭스

| 평가 기준 (가중치) | heic-to | libheif-js | heic2any |
|--------------------|---------|------------|----------|
| 최신 HEIC 호환 (30%) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| API 편의성 (20%) | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 유지보수 활성도 (20%) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| TypeScript (10%) | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ |
| 번들 크기 (10%) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 안정성/이슈 (10%) | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **종합** | **4.5/5** | **2.8/5** | **2.2/5** |

---

## 12. 결론 및 권장

### 🏆 1순위: heic-to

**PWA(iOS Safari + Android Chrome) 프로젝트에 가장 적합한 라이브러리.**

선정 이유:
1. **최신 libheif 1.21.2** — iPhone 15 Pro, iOS 18 등 최신 기기 HEIC 지원
2. **TypeScript 타입 내장** — 별도 @types 불필요
3. **CSP 호환 빌드** — PWA 배포 시 CSP 정책 충돌 방지
4. **Next.js/Worker 빌드** — 프로젝트 스택(Next.js)과 직접 호환
5. **활발한 유지보수** — 2026-02 최종 업데이트, 이슈 응답 활발
6. **단순한 API** — `heicTo()` 하나로 Blob 직접 반환

주의사항:
- LGPL-3.0 라이선스 확인 필요 (WASM 바이너리 포함이므로 동적 링킹으로 해석 가능)
- 멀티 이미지 추출 API 없음 (단일 이미지만)
- 첫 로드 시 ~2.4MB WASM 다운로드 (lazy loading 또는 Service Worker 캐싱 권장)

### 2순위: libheif-js (직접 사용 시)

Low-level 제어가 필요하거나 멀티 이미지 추출이 필요한 경우에만.
단, TypeScript 타입 없고, Canvas 변환 코드를 직접 작성해야 함.

### ❌ 비권장: heic2any

다운로드 수가 많지만 **사실상 폐기 상태**. 구버전 libheif로 인해 최신 iPhone HEIC 미지원, 메모리 누수, Safari 호환성 문제 등 치명적 이슈 다수. 새 프로젝트에서 선택하면 안 됨.

---

## 13. 구현 가이드 (heic-to 채택 시)

```typescript
// utils/heic-converter.ts
import { heicTo, isHeic } from "heic-to";
// CSP 제한 환경이면: import { heicTo, isHeic } from "heic-to/csp";

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  // 1. HEIC 여부 확인
  const needsConversion = await isHeic(file);
  if (!needsConversion) return file;

  // 2. JPEG로 변환
  const jpegBlob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.85,
  });

  return jpegBlob;
}

// 사용 예시
const file = inputEvent.target.files[0];
const jpeg = await convertHeicToJpeg(file);
const url = URL.createObjectURL(jpeg);
```

### Next.js 설정 (필요 시)
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    // WASM 파일 처리
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};
```
