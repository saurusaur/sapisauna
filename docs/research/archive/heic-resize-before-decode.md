# HEIC 이미지 클라이언트 리사이즈 리서치

> 조사일: 2026-03-14

## 핵심 결론

**HEIC를 full decode 없이 리사이즈하는 방법은 현재 브라우저 JS에서 실질적으로 없다.**
가장 현실적인 전략은 아래 순서:

| 전략 | 가능성 | 속도 개선 | 비고 |
|------|--------|-----------|------|
| 1. OS 네이티브 ImageDecoder API | ⚠️ 플랫폼 의존 | 10x+ | macOS/iOS만 확실 |
| 2. HEIC 내장 썸네일 추출 | ❌ JS에서 불가 | - | hvc1 raw data, 디코더 필요 |
| 3. heic2any quality 파라미터 | ✅ 가능 | 0x (파일 작아질 뿐) | 디코드 시간 동일 |
| 4. createImageBitmap 리사이즈 | ✅ decode 후 적용 | canvas보다 빠름 | HEIC blob 직접 불가 |
| 5. 서버사이드 변환 | ✅ 확실 | 완전 회피 | Cloudflare/Cloudinary (~~sharp 불가~~) |

---

## 1. heic2any 옵션

**리사이즈/스케일 파라미터: 없음**

heic2any가 지원하는 옵션:
- `toType`: 출력 포맷 (JPEG, PNG, GIF)
- `quality`: 0~1 (JPEG 압축 품질. 파일 크기만 줄임, 해상도 변경 없음)
- `multiple`: 다중 이미지 처리
- `gifInterval`: GIF 프레임 간격

quality를 낮추면 출력 파일이 작아지지만, **WASM 디코드 시간은 동일**하다.
내부적으로 libheif WASM → full pixel decode → Canvas → toBlob 순서이므로
3000x3000 전체 디코드를 피할 수 없다.

**GitHub Issue #36**: 1.6MB HEIC → ~5초 소요. "이게 정상인가?" → maintainer 답변: 정상. 이슈 closed as "not planned".
**GitHub Issue #30**: 70MB RAM 누수 보고됨.

---

## 2. libheif-js / libheif WASM

### C API (libheif 본체)는 지원함:
- `heif_image_handle_get_number_of_thumbnails()` — 썸네일 수 조회
- `heif_image_handle_get_thumbnail_ID()` — 썸네일 ID 조회
- `heif_image_handle_get_thumbnail()` → 썸네일 이미지 핸들 획득
- v1.19+ 타일 단위 디코딩 (`decode_only_tile`)
- 멀티 해상도 피라미드 (`pymd`) 지원

### JS 바인딩 (libheif-js)은 미노출:
- `HeifDecoder` 클래스만 노출: `decode()`, `get_width()`, `get_height()`, `display()`
- **썸네일 API, 타일 디코딩, 스케일 다운 API 모두 JS에 바인딩되지 않음**
- 이론적으로 Emscripten 빌드를 커스텀하면 가능하나, 유지보수 부담 큼

### 결론: libheif C API는 가능하지만, JS 래퍼가 노출하지 않아 사용 불가

---

## 3. HEIC 내장 썸네일

### HEIC 파일 구조:
- HEIC 파일은 ISOBMFF(ISO Base Media File Format) 컨테이너
- 메인 이미지 외에 `thmb` 박스에 썸네일 참조 포함
- 썸네일은 보통 320x240 또는 640x480 크기의 **hvc1(HEVC) 인코딩 데이터**

### JS 라이브러리 현황:

| 라이브러리 | HEIC 썸네일 추출 | 비고 |
|-----------|-----------------|------|
| ExifReader | ❌ HEIC 메타데이터만 | JPEG 썸네일만 추출 가능 |
| exifr | ❌ "File doesn't contain thumbnail" | HEIC의 thmb offset/length는 찾지만, hvc1 raw data를 디코드 불가 |
| exif-heic-js | ❌ 메타데이터만 | 썸네일 추출 기능 없음 |

### 핵심 문제:
JPEG는 EXIF 내에 **완전한 JPEG 파일**로 썸네일을 임베드 → 추출 즉시 사용 가능.
HEIC는 **raw hvc1 데이터**로 썸네일 저장 → 추출해도 HEVC 디코더 없이는 사용 불가.
exifr maintainer 코멘트: "it's just a raw encoded hvc1 data. There's no file structure around it."

---

## 4. ImageDecoder API (WebCodecs)

### 지원 현황:
- Chrome 94+, Edge 94+: 지원
- Firefox: 최근 shipping
- Safari: 미지원

### HEIC 지원:
- **플랫폼 의존적**. `ImageDecoder.isTypeSupported("image/heic")`로 런타임 확인 필요
- macOS 10.13+: OS 네이티브 HEVC 디코더 사용 → ✅ 작동
- Windows: HEIF Image Extensions 설치 시 → ✅ 작동
- Linux: 대부분 ❌
- iOS Safari: ImageDecoder API 자체 미지원

### 리사이즈:
- ImageDecoder 자체에 리사이즈 옵션 없음
- decode() → ImageBitmap → createImageBitmap(bitmap, {resizeWidth, resizeHeight})로 후처리

### 결론: iOS Safari에서 작동하지 않으므로 PWA 용도로는 부적합

---

## 5. createImageBitmap + resizeWidth/resizeHeight

### 지원:
- Chrome, Firefox, Safari 15+: ✅
- `resizeWidth`, `resizeHeight` 옵션 지원

### HEIC Blob 직접 사용:
- **불가**. 브라우저가 HEIC를 네이티브로 디코드할 수 있는 경우에만 가능
- iOS Safari는 HEIC를 `<img>`에 표시할 수 있지만, `createImageBitmap(heicBlob)`은 실패하는 경우 있음
- 확실한 경로: heic2any → JPEG Blob → createImageBitmap({resizeWidth, resizeHeight})

### 성능 이점:
- Canvas drawImage로 리사이즈하는 것보다 createImageBitmap이 더 효율적
- **디코드와 리사이즈를 한 단계에서 처리** (GPU 가속 가능)
- 그러나 HEIC → JPEG 변환 자체(WASM decode)가 병목이므로, 이후 단계 최적화 효과는 제한적

---

## 6. 기타 접근법

### A. 서버사이드 변환 (가장 확실)
- ~~sharp~~: ❌ 불가 — HEVC 라이선스로 prebuilt에 libheif 미포함. Vercel/Lambda 모두 비현실적
- **Cloudflare Images** (5K 무료/월) 또는 **Cloudinary** (25크레딧): HEIC → JPEG 변환 + 리사이즈. ~100-500ms
- 단점: 네트워크 왕복, 외부 서비스 의존

### B. Web Worker에서 heic2any 실행 (현재 방식 최적화)
- heic2any는 이미 내부적으로 Web Worker 사용
- 메인 스레드 블로킹은 없지만, 절대 시간은 동일

### C. WASM HEVC 디코더 커스텀 빌드
- libheif WASM을 직접 빌드하여 썸네일 API 노출
- 이론적으로 가능하나 유지보수 부담 매우 큼
- 난이도: HIGH

### D. 조건부 네이티브 디코딩
```javascript
// macOS Chrome/Edge에서는 네이티브 디코딩 가능
if (await ImageDecoder?.isTypeSupported?.("image/heic")) {
  // 네이티브 디코더 사용 (매우 빠름)
  const decoder = new ImageDecoder({ type: "image/heic", data: stream });
  const { image } = await decoder.decode();
  // createImageBitmap로 리사이즈
} else {
  // fallback: heic2any WASM
}
```
- 장점: 지원 기기에서 10x+ 속도 향상
- 단점: iOS Safari 미지원 (핵심 타겟 놓침)

---

## 시간 분석: 3000x3000 HEIC 처리 (모바일 기기 기준)

### 전체 파이프라인 (현재)

| 단계 | 예상 시간 | 비중 |
|------|-----------|------|
| heic2any WASM 디코드 (3000x3000→raw pixels) | 3~8초 | **80-90%** |
| Canvas drawImage (3000x3000→1080x1920) | 50~150ms | 2-5% |
| Canvas toBlob (JPEG 압축) | 100~300ms | 5-10% |
| 합계 | **3.5~8.5초** | 100% |

### 핵심 인사이트:
- **WASM HEVC 디코딩이 전체 시간의 80-90%**
- Canvas 리사이즈/압축은 상대적으로 매우 빠름
- 따라서 "디코드 후 리사이즈 최적화"는 최대 10-20% 개선에 불과
- **진정한 개선은 디코드 자체를 피하거나 네이티브로 전환하는 것**

### 비교: 동일 이미지를 JPEG로 촬영했다면

| 단계 | 예상 시간 |
|------|-----------|
| createImageBitmap (JPEG→bitmap, 리사이즈 포함) | 50~200ms |
| Canvas toBlob | 100~300ms |
| 합계 | **~500ms** |

→ HEIC vs JPEG: **7-17배 차이**

---

## 최종 권장 전략

### 단기 (현재 구현 최적화)
1. heic2any 결과를 **quality: 0.8 JPEG**으로 받기 (이미 하고 있다면 유지)
2. Canvas 리사이즈 대신 `createImageBitmap({resizeWidth, resizeHeight})` 사용
3. 변환 중 적절한 로딩 UI 표시 (3-8초 대기)

### 중기 (조건부 네이티브)
1. `ImageDecoder.isTypeSupported("image/heic")` 체크
2. 지원 기기: 네이티브 디코딩 (macOS Chrome/Edge) → 10x 빠름
3. 미지원 기기: heic2any 폴백

### 장기 (서버사이드)
1. 원본 HEIC를 Cloudflare Images 또는 Cloudinary로 업로드
2. 서버에서 리사이즈 + JPEG 변환 (100-500ms)
3. 클라이언트는 변환된 JPEG만 받아서 표시
4. ~~sharp~~는 HEVC 라이선스 제약으로 불가 → 외부 이미지 서비스 사용

---

## Sources

- [heic2any npm](https://www.npmjs.com/package/heic2any)
- [heic2any Issue #36 - Conversion slow](https://github.com/alexcorvi/heic2any/issues/36)
- [heic2any Issue #30 - Worker leaks RAM](https://github.com/alexcorvi/heic2any/issues/30)
- [libheif GitHub](https://github.com/strukturag/libheif)
- [libheif-js GitHub](https://github.com/catdad-experiments/libheif-js)
- [libheif C API Reference](https://deepwiki.com/strukturag/libheif/5-c-api-reference)
- [libheif v1.19 tile access](https://github.com/strukturag/libheif/releases/tag/v1.19.0)
- [exifr Issue #43 - HEIC thumbnail](https://github.com/MikeKovarik/exifr/issues/43)
- [ExifReader GitHub](https://github.com/mattiasw/ExifReader)
- [ImageDecoder MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder)
- [HEIF Can I Use](https://caniuse.com/heif)
- [WebCodecs Can I Use](https://caniuse.com/webcodecs)
- [libheif performance Issue #1215](https://github.com/strukturag/libheif/issues/1215)
