# Cloudinary vs Cloudflare Images: Deep Comparison

> 작성일: 2026-03-18 | 용도: Sauna Log PWA — HEIC→JPEG 변환 + 이미지 최적화
> 관련 파일: `RESEARCH_cloudinary_heic.md`, `heic-library-deep-comparison.md`

---

## TL;DR — 최종 추천

| 단계 | 추천 | 이유 |
|------|------|------|
| **지금 ~ 5K MAU** | **Cloudflare Images** | 무료 5K 변환/월, 이그레스 무료, 단순 URL 기반 |
| **5K ~ 50K MAU** | **Cloudinary** (또는 하이브리드) | 더 풍부한 기능 (OG 이미지, 스마트 크롭, 워터마크 등), 앱 성장에 맞는 생태계 |
| **장기 가치** | **Cloudinary** 우세 | 이미지/비디오 올인원 플랫폼, Next.js 네이티브 SDK, 확장 기능 풍부 |

---

## 1. HEIC 지원 상세 비교

### Cloudinary

| 항목 | 지원 여부 | 상세 |
|------|----------|------|
| HEIC 입력 | ✅ | 네이티브 지원, 업로드 시 자동 인식 |
| HEIF 입력 | ✅ | HEIC의 상위 컨테이너 포맷도 지원 |
| 10-bit HDR | ✅ | HDR 메타데이터 처리 가능, 톤매핑 후 SDR 출력 |
| Live Photo (.mov 포함) | ⚠️ | 이미지 부분만 추출 (비디오 별도 업로드 필요) |
| 출력 포맷 | JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, PDF 등 30+ 포맷 |
| 변환 품질 | ✅ 우수 | `q_auto` 로 지각적 최적화, 수동 1-100 지정 가능 |
| 최대 파일 크기 | Free: 10MB, Plus: 20MB, Advanced: 40MB |
| 최대 해상도 | Free: 25MP, Advanced: 50MP |

**변환 방법**:
```
# Upload API로 변환
POST /v1_1/{cloud}/image/upload
→ eager: [{ format: "jpg", quality: "auto" }]

# Fetch URL로 즉시 변환 (업로드 없이)
https://res.cloudinary.com/{cloud}/image/fetch/f_jpg,q_auto/{heic_url}

# 업로드 후 URL 변환
https://res.cloudinary.com/{cloud}/image/upload/f_jpg,q_auto/v1/{public_id}
```

### Cloudflare Images

| 항목 | 지원 여부 | 상세 |
|------|----------|------|
| HEIC 입력 | ✅ | "Cloudflare can ingest HEIC images for decoding" (공식 문서) |
| HEIF 입력 | ✅ | HEIC = HEIF의 서브셋이므로 동일 처리 |
| 10-bit HDR | ⚠️ 미확인 | 공식 문서에 HDR 관련 언급 없음 |
| Live Photo | ❌ | 이미지 포맷만 처리 |
| 출력 포맷 | JPEG, PNG, WebP, AVIF, GIF (HEIC 출력 불가) |
| 변환 품질 | ✅ 양호 | `quality=1-100` 또는 `high/medium/low` 지정 |
| 최대 파일 크기 | 70MB |
| 최대 해상도 | 100MP (단, AVIF는 1,200px 제한) |

**변환 방법**:
```
# URL 기반 변환 (외부 이미지 소스 지원)
https://{your-zone}/cdn-cgi/image/format=jpeg,quality=80,width=1080/{supabase_storage_url}

# R2에 저장된 이미지
https://{your-zone}/cdn-cgi/image/format=jpeg,quality=80/{r2_url}
```

### HEIC 지원 결론

| 비교 | Cloudinary | Cloudflare |
|------|-----------|------------|
| HEIC 입력 | ✅ 동등 | ✅ 동등 |
| 출력 포맷 다양성 | ✅ 30+ 포맷 | 6 포맷 |
| HDR 처리 | ✅ 명시적 | ⚠️ 미확인 |
| 최대 파일 크기 | ❌ 10MB (Free) | ✅ 70MB |
| 품질 조정 세밀함 | ✅ q_auto 지각적 최적화 | ✅ quality 파라미터 |

**승자: Cloudinary** (출력 다양성, HDR 처리, 지각적 품질 최적화)

---

## 2. 무료 티어 상세 분석

### Cloudinary Free Plan

| 리소스 | 무료 한도 | 비고 |
|--------|----------|------|
| **크레딧** | **25 크레딧/월** | 아래 환산표 참조 |
| 변환 | ~25,000회/월 | 1 크레딧 ≈ 1,000 변환 |
| 저장소 | ~25GB | 1 크레딧 ≈ 1GB |
| 대역폭 | ~25GB | 1 크레딧 ≈ 1GB |
| 최대 이미지 크기 | 10MB | |
| Admin API | 500 요청/시간 | |

**크레딧 소비 방식** (⚠️ 핵심 — 크레딧은 공유 자원):
- 25 크레딧은 변환, 저장, 대역폭이 **동시에 차감**
- 예: 5,000 HEIC 변환(5 크레딧) + 5GB 저장(5 크레딧) + 15GB 대역폭(15 크레딧) = 25 크레딧 소진
- 변환만 한다면 최대 25,000회이지만, 저장+대역폭도 쓰면 실질 변환 수 감소

**HEIC 변환 시 실질 무료 한도 추정**:
```
시나리오: 월 1,000 HEIC 변환 (3MB HEIC → 500KB JPEG)
- 변환: 1,000회 = ~1 크레딧
- 저장: 1,000 × 500KB = 500MB ≈ 0.5 크레딧 (변환 결과를 저장할 경우)
- 대역폭: 1,000 × 500KB = 500MB ≈ 0.5 크레딧
- 합계: ~2 크레딧/월 → ✅ 무료 한도 내 충분

시나리오: 월 10,000 HEIC 변환
- 변환: ~10 크레딧 + 저장: ~5 크레딧 + 대역폭: ~5 크레딧 = ~20 크레딧
- → ⚠️ 무료 한도 거의 소진
```

**초과 시**: Hard cutoff — 서비스 차단 (과금 없음, 업그레이드 필요)

### Cloudflare Images Free Plan

| 리소스 | 무료 한도 | 비고 |
|--------|----------|------|
| **유니크 변환** | **5,000회/월** | 동일 이미지+동일 파라미터는 1회만 카운트 |
| 저장소 | ❌ 없음 | Free에서는 외부 이미지 변환만 가능 |
| 대역폭/이그레스 | **무제한 무료** | Cloudflare 전 제품 공통 |
| 이미지 업로드 | ❌ 유료만 | $5/100K 이미지 저장 |
| 이미지 전송 | ❌ 유료만 | $1/100K 이미지 전송 |

**유니크 변환 카운팅 (⚠️ 핵심)**:
- `image_A + width=500,format=jpeg` = 1 유니크 변환
- `image_A + width=800,format=jpeg` = 별도 1 유니크 변환 (파라미터 다름)
- 같은 조합의 반복 요청은 **월 내 1회만** 카운트
- `format` 파라미터는 AVIF/WebP 등 여러 포맷으로 서빙해도 **1회로** 카운트

**HEIC 변환 시 실질 무료 한도**:
```
시나리오: 월 1,000 HEIC 변환 (각각 다른 이미지)
- 각 이미지 1가지 변환(JPEG, width=1080) = 1,000 유니크 변환
- → ✅ 무료 한도 내 (5,000 중 1,000 사용)

시나리오: 월 1,000 이미지 × 3가지 크기 (원본, 썸네일, OG)
- 1,000 × 3 = 3,000 유니크 변환
- → ✅ 무료 한도 내

시나리오: 월 2,000 이미지 × 3가지 크기
- 2,000 × 3 = 6,000 유니크 변환
- → ❌ 초과 — 9422 에러 반환 (과금 없음, 하드 컷오프)
```

**초과 시**: HTTP 9422 에러 반환 — 변환 거부, 과금 없음

### 무료 티어 비교 요약

| 비교 | Cloudinary | Cloudflare |
|------|-----------|------------|
| 변환 횟수 | ~25,000 (이론적 최대) | 5,000 유니크 |
| 실질 HEIC 변환 | ~5,000~12,000 (저장+대역폭 고려) | 5,000 (순수 변환만) |
| 이그레스 비용 | 크레딧에서 차감 | **무료** |
| 저장소 | 크레딧에서 차감 (~25GB) | ❌ Free에 없음 |
| 초과 처리 | 서비스 차단 | 9422 에러 (차단) |
| 숨은 비용 | 크레딧 공유 구조 | 없음 |

**승자: 상황에 따라 다름**
- 변환만 필요 → **Cloudflare** (단순하고 이그레스 무료)
- 변환 + 저장 + CDN 전체 → **Cloudinary** (올인원)

---

## 3. 규모별 비용 분석

### 가격 구조

| | Cloudinary | Cloudflare Images |
|--|-----------|-------------------|
| 무료 | 25 크레딧/월 | 5K 유니크 변환/월 |
| 첫 유료 | Plus: $89/월 (225 크레딧) | $0.50/1K 변환 (종량제) |
| 저장 | 크레딧 차감 | $5/100K 이미지 |
| 대역폭 | 크레딧 차감 | **무료** |
| 전송 | 크레딧 포함 | $1/100K 전송 |

### 월간 HEIC 변환 비용 시뮬레이션

가정: 각 이미지 1가지 변환 (HEIC→JPEG, width=1080), 결과 저장 안 함 (Supabase에 저장)

#### Cloudflare Images (변환만 사용, 저장/전송 불필요)

| 월 변환 수 | 유니크 변환 | 비용 | 비고 |
|-----------|-----------|------|------|
| 1,000 | 1,000 | **$0** | Free 한도 내 |
| 5,000 | 5,000 | **$0** | Free 한도 딱 맞음 |
| 10,000 | 10,000 | **$2.50** | 5K 초과분 × $0.50/1K |
| 50,000 | 50,000 | **$22.50** | 45K 초과분 × $0.50/1K |

#### Cloudinary (Upload API로 변환 후 Supabase에 저장, Cloudinary 저장소 미사용)

| 월 변환 수 | 크레딧 소비 (추정) | 비용 | 비고 |
|-----------|-----------------|------|------|
| 1,000 | ~1 cr (변환만) | **$0** | Free 25 cr 내 |
| 5,000 | ~5 cr | **$0** | Free 25 cr 내 |
| 10,000 | ~10 cr | **$0** | Free 25 cr 내 |
| 25,000 | ~25 cr | **$0** | Free 한도 딱 맞음 |
| 50,000 | ~50 cr | **$89** | Plus 플랜 필요 (225 cr) |

> ⚠️ Cloudinary 크레딧 계산은 변환만 할 경우의 추정치. 저장+대역폭을 함께 쓰면 크레딧 소모가 더 빠름.

#### 비용 교차점 분석

```
변환만 사용 시 (저장은 Supabase):

  월 1K~5K:   Cloudflare $0  vs  Cloudinary $0  → 무승부
  월 10K:     Cloudflare $2.50  vs  Cloudinary $0  → Cloudinary 승
  월 25K:     Cloudflare $10  vs  Cloudinary $0  → Cloudinary 승
  월 30K:     Cloudflare $12.50  vs  Cloudinary $89 (Plus 필요)  → Cloudflare 승
  월 50K:     Cloudflare $22.50  vs  Cloudinary $89  → Cloudflare 승

→ 교차점: ~30K 변환/월에서 역전
→ 25K 이하에서는 Cloudinary가 무료로 더 많이 커버
→ 30K+ 에서는 Cloudflare의 종량제가 유리
```

### 비용 결론

| 규모 | 승자 | 이유 |
|------|------|------|
| < 5K/월 | **무승부** | 둘 다 무료 |
| 5K~25K/월 | **Cloudinary** | 무료 크레딧으로 커버 가능 |
| 25K~30K/월 | **교차점** | 비슷한 비용대 |
| 30K+/월 | **Cloudflare** | 종량제 $0.50/1K로 저렴 |

---

## 4. 우리 스택과의 통합

### Cloudinary + Next.js 14 + Vercel + Supabase

**패키지**: `next-cloudinary` (공식 커뮤니티 라이브러리)

```bash
npm install next-cloudinary
```

**환경변수** (.env.local):
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret  # 서버 전용
```

**컴포넌트**:
- `CldImage` — Next.js Image 래핑, 자동 최적화
- `CldUploadWidget` — 클라이언트 업로드 위젯
- `CldOgImage` — OG 이미지 자동 생성
- `getCldImageUrl()` — 프로그래밍 URL 생성

**HEIC 변환 통합 패턴** (Supabase 연동):
```
패턴 A: Fetch URL (가장 간단, 업로드 없이)
  1. HEIC를 Supabase Storage에 업로드
  2. Cloudinary fetch URL로 변환: /image/fetch/f_jpg,q_auto/{supabase_url}
  3. 변환된 JPEG URL을 사용
  → 장점: Cloudinary에 저장 불필요, 크레딧 절약
  → 단점: Supabase URL이 public이어야 함

패턴 B: Upload API Route (보안 강화)
  1. 클라이언트에서 HEIC → Next.js API Route
  2. API Route에서 Cloudinary Upload API 호출 (signed)
  3. eager 변환으로 JPEG 생성
  4. JPEG URL 반환 → Supabase에 저장
  → 장점: API Secret 보호, 전처리 가능
  → 단점: Vercel Serverless 타임아웃 주의 (10초)

패턴 C: Unsigned Upload (클라이언트 직접)
  1. Upload Preset 생성 (Cloudinary 대시보드)
  2. 클라이언트에서 직접 Cloudinary 업로드
  3. 변환된 URL 반환
  → 장점: 서버 부하 없음, 가장 빠름
  → 단점: Upload Preset 노출 (제한적 보안)
```

### Cloudflare Images + Next.js 14 + Vercel + Supabase

**패키지**: 없음 (SDK 불필요, URL 기반)

**환경변수**:
```
# Cloudflare zone에서 변환 활성화 필요
# 자체 도메인이 Cloudflare에 있어야 함 (또는 Workers 사용)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_token  # Upload API 사용 시만
```

**Next.js Image Loader 설정**:
```js
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-loader.ts',
  },
}

// lib/cloudflare-loader.ts
export default function cloudflareLoader({ src, width, quality }) {
  return `https://your-domain.com/cdn-cgi/image/width=${width},quality=${quality || 75},format=auto/${src}`
}
```

**HEIC 변환 통합 패턴**:
```
패턴 A: URL 기반 변환 (가장 간단)
  1. HEIC를 Supabase Storage에 업로드 (public URL)
  2. Cloudflare URL로 변환:
     https://your-cf-domain.com/cdn-cgi/image/format=jpeg,quality=80/{supabase_url}
  → 전제: your-cf-domain.com이 Cloudflare에 있어야 함
  → ⚠️ Vercel 도메인에서는 /cdn-cgi/ 사용 불가

패턴 B: Workers로 프록시
  1. Cloudflare Worker가 변환 요청 처리
  2. Worker에서 Supabase URL 변환
  3. 변환된 이미지 반환
  → 장점: Vercel 도메인 제약 우회
  → 단점: Worker 설정 + 별도 도메인 필요
```

### 통합 비교

| 비교 | Cloudinary | Cloudflare |
|------|-----------|------------|
| SDK | ✅ `next-cloudinary` 공식 | ❌ 없음 (URL 기반) |
| 설정 복잡도 | 낮음 (env 3개) | 중간 (도메인 설정 + 존 활성화) |
| Vercel 호환 | ✅ 완벽 | ⚠️ 별도 CF 도메인 또는 Worker 필요 |
| Supabase 연동 | ✅ fetch URL로 직접 변환 | ✅ URL 기반 변환 가능 |
| 클라이언트 업로드 | ✅ CldUploadWidget | ❌ API만 (서버 경유) |
| 코드량 | 적음 (컴포넌트 기반) | 중간 (커스텀 로더 + URL 구성) |

**승자: Cloudinary** (Next.js 네이티브 SDK, Vercel 완벽 호환, 코드량 적음)

---

## 5. 성능 비교

### HEIC 변환 속도

| 항목 | Cloudinary | Cloudflare |
|------|-----------|------------|
| 첫 변환 (cold) | 200-800ms | 300-1,000ms |
| 캐시된 요청 | ~50ms (CDN 히트) | ~20ms (엣지 캐시) |
| 3MB HEIC → 1080px JPEG | ~300-500ms | ~300-600ms |
| 리사이즈 포함 | 동시 처리 (추가 시간 미미) | 동시 처리 |
| Cold start 페널티 | 낮음 (항상 가동) | 낮음 (엣지 컴퓨팅) |

> ⚠️ 정확한 벤치마크는 실측 필요. 위 수치는 커뮤니티 보고 + 공식 문서 기반 추정

### CDN 커버리지 (한국/아시아)

| 항목 | Cloudinary | Cloudflare |
|------|-----------|------------|
| 글로벌 PoP | ~70개 도시 (Akamai/Fastly 연동) | **330+ 도시, 120+ 국가** |
| 서울 PoP | ✅ (CDN 파트너 경유) | ✅ 직접 운영 (AI 추론까지 지원) |
| 부산 PoP | ⚠️ 미확인 | ⚠️ 미확인 (서울만 명시) |
| 일본 PoP | ✅ | ✅ (도쿄, 오사카 등 다수) |
| 동남아 | ✅ (주요 도시) | ✅ (다수 PoP) |
| 엣지 캐시 | ✅ | ✅ (더 많은 엣지 노드) |

### 한국 유저 체감 성능

```
Cloudflare:
- 서울 PoP 직접 존재 → 엣지에서 변환 + 캐시
- 첫 요청: ~200-400ms (서울 엣지 변환)
- 반복 요청: ~10-20ms (엣지 캐시 히트)
- Anycast 네트워크 → 항상 가장 가까운 PoP

Cloudinary:
- CDN 파트너(Akamai/Fastly) 서울 PoP 경유
- 첫 요청: ~300-600ms (오리진 변환 + CDN 캐시)
- 반복 요청: ~30-50ms (CDN 캐시 히트)
- 오리진 서버 위치에 따라 첫 요청 지연 가능
```

**승자: Cloudflare** (서울 직접 PoP, 더 많은 엣지 노드, Anycast)

---

## 6. HEIC 너머 — 미래 가치

### 기능 비교 매트릭스

| 기능 | Cloudinary | Cloudflare | 우리 앱 필요도 |
|------|-----------|------------|--------------|
| **리사이즈 on-the-fly** | ✅ | ✅ | 🔴 높음 |
| **WebP/AVIF 자동 포맷** | ✅ f_auto | ✅ format=auto | 🔴 높음 |
| **품질 자동 최적화** | ✅ q_auto (지각적) | ✅ quality 수동 | 🟡 중간 |
| **썸네일 생성** | ✅ (크롭+리사이즈) | ✅ (크롭+리사이즈) | 🔴 높음 |
| **워터마크** | ✅ 오버레이 API | ❌ 없음 | 🟢 낮음 (미래) |
| **얼굴 인식/스마트 크롭** | ✅ g_auto, g_face | ✅ gravity=auto (기본) | 🟡 중간 |
| **OG 이미지 생성** | ✅ CldOgImage 컴포넌트 | ❌ 없음 | 🟡 중간 |
| **텍스트 오버레이** | ✅ 풍부한 텍스트 API | ❌ 없음 | 🟡 중간 (스토리 카드) |
| **비디오 처리** | ✅ 풀 비디오 트랜스코딩 | ❌ (Stream은 별도 제품) | 🟢 낮음 (미래) |
| **배경 제거** | ✅ AI 기반 | ❌ 없음 | 🟢 낮음 |
| **이미지 분석/태깅** | ✅ AI 태깅 | ❌ 없음 | 🟢 낮음 |
| **GIF→비디오** | ✅ | ❌ | 🟢 낮음 |
| **PDF→이미지** | ✅ | ❌ | 🟢 낮음 |
| **색상 보정** | ✅ 밝기/대비/감마 | ✅ 밝기/대비/감마 | 🟢 낮음 |
| **블러 효과** | ✅ | ✅ | 🟡 중간 (배경 블러) |
| **세그먼테이션** | ❌ | ✅ segment (배경 분리) | 🟢 낮음 |

### 사우나 로그 앱 특화 시나리오

**인스타 스토리 카드 생성**:
- Cloudinary: ✅ 텍스트 오버레이 + 이미지 합성 → 서버에서 스토리 카드 완성 가능
- Cloudflare: ❌ 리사이즈/포맷 변환만 → 카드 합성은 여전히 클라이언트

**프로필 이미지**:
- Cloudinary: ✅ 얼굴 인식 크롭 + 원형 마스크 + 리사이즈
- Cloudflare: ✅ 스마트 크롭 + 리사이즈 (마스크 없음)

**시설 사진 갤러리**:
- Cloudinary: ✅ 자동 품질 + 반응형 이미지 + lazy loading
- Cloudflare: ✅ 자동 포맷 + 리사이즈

**OG 이미지 (SNS 공유)**:
- Cloudinary: ✅ `CldOgImage` 컴포넌트로 동적 생성
- Cloudflare: ❌ 별도 구현 필요 (Vercel OG 등)

**승자: Cloudinary** (압도적 — 특히 텍스트 오버레이, OG 이미지, 비디오 처리)

---

## 7. 개발자 경험 (DX)

| 항목 | Cloudinary | Cloudflare |
|------|-----------|------------|
| **대시보드** | ✅ 풍부 (미디어 라이브러리, 사용량, 분석) | ✅ 기본 (이미지 목록, 사용량) |
| **문서 품질** | ✅ 매우 좋음 (예제 풍부, 인터랙티브) | ✅ 좋음 (간결, 명확) |
| **API 복잡도** | 중간 (URL 파라미터 + SDK) | 낮음 (URL 파라미터만) |
| **에러 핸들링** | ✅ 상세 에러 코드 + 메시지 | 기본 (HTTP 상태 코드) |
| **디버깅** | ✅ 변환 로그, 사용량 추적 | 기본 (Workers 로그) |
| **Rate Limit** | 500 Admin API/시간 (Free) | 유니크 변환 월 5K (Free) |
| **SDK 품질** | ✅ 13개 공식 SDK | ❌ SDK 없음 |
| **커뮤니티** | ✅ 크고 활발 (Stack Overflow 등) | 중간 (Cloudflare 포럼) |
| **학습 곡선** | 중간 (파라미터 많음) | 낮음 (단순 URL) |
| **타입 안전** | ✅ next-cloudinary TS 지원 | N/A (URL 문자열) |

**승자: Cloudinary** (SDK, 대시보드, 문서, 커뮤니티 모두 우세)

---

## 8. 벤더 락인 리스크

### Cloudinary

| 항목 | 리스크 | 상세 |
|------|--------|------|
| URL 구조 | 🔴 높음 | `res.cloudinary.com/{cloud}/image/upload/...` — 벤더 전용 |
| 이미지 저장 | 🟡 중간 | Export API 존재, 하지만 대량 마이그레이션 번거로움 |
| 변환 URL | 🔴 높음 | `f_auto,q_auto,w_500` 문법은 Cloudinary 전용 |
| SDK 의존 | 🟡 중간 | next-cloudinary 사용 시 컴포넌트 교체 필요 |
| 마이그레이션 | 중간 난이도 | URL 리라이트 + 이미지 재다운로드 필요 |

**완화 전략**:
- 변환 URL을 직접 DB에 저장하지 않고, public_id만 저장 → URL 재구성 가능
- 원본은 Supabase Storage에 보관 → Cloudinary는 변환 레이어로만 사용

### Cloudflare Images

| 항목 | 리스크 | 상세 |
|------|--------|------|
| URL 구조 | 🟡 중간 | `/cdn-cgi/image/...` — Cloudflare 전용이지만 패턴 단순 |
| 이미지 저장 | 🟢 낮음 | 외부 URL 변환만 쓰면 저장 의존 없음 |
| 변환 URL | 🟡 중간 | `width=500,format=auto` — 벤더 전용이지만 범용적 |
| SDK 의존 | 🟢 없음 | SDK 없이 URL만 사용 |
| 마이그레이션 | 쉬움 | URL 패턴 교체만으로 가능 |

**핵심 차이**: Cloudflare는 "변환 레이어"로만 사용 가능 → 락인 최소화.
Cloudinary는 "저장 + 변환 + CDN" 올인원 → 깊게 쓸수록 락인 증가.

### 우리 케이스에서의 완화법

```
원본 이미지: 항상 Supabase Storage에 보관 (진실의 원천)
변환 서비스: Cloudinary 또는 Cloudflare는 "캐시/변환 레이어"로만 사용
DB 저장: 원본 Supabase URL만 저장, 변환 URL은 런타임 생성

→ 이 패턴이면 어느 서비스든 교체 비용 낮음 (URL 생성 로직만 변경)
```

**승자: Cloudflare** (저장 의존 없음, SDK 의존 없음, 교체 용이)

---

## 9. 장기 가치 평가

### 앱 성장 단계별 가치

| 단계 | MAU | Cloudinary 가치 | Cloudflare 가치 |
|------|-----|----------------|----------------|
| **MVP** (지금) | < 1K | ⭐⭐⭐⭐ HEIC 변환 무료 | ⭐⭐⭐⭐⭐ 간단, 무료, 이그레스 무료 |
| **성장기** | 1K~10K | ⭐⭐⭐⭐⭐ 무료 크레딧으로 커버 + OG 이미지 | ⭐⭐⭐⭐ 유니크 변환 한도 도달 가능 |
| **확장기** | 10K~50K | ⭐⭐⭐⭐ 유료 전환 ($89/월) 필요하지만 기능 풍부 | ⭐⭐⭐⭐⭐ 종량제로 비용 효율적 |
| **성숙기** | 50K+ | ⭐⭐⭐⭐⭐ 비디오, AI 기능까지 확장 | ⭐⭐⭐ 변환만 가능, 고급 기능 부족 |

### 가격 대비 기능 비율

| 규모 | Cloudinary | Cloudflare |
|------|-----------|------------|
| $0/월 | 25K 변환 + 저장 + CDN + OG + SDK | 5K 변환 + CDN |
| $10/월 | N/A (최소 유료 $89) | 15K 변환 + CDN |
| $22.50/월 | N/A | 50K 변환 + CDN |
| $89/월 | 225K 변환 + 저장 + CDN + OG + 비디오 + AI | 173K 변환 + CDN |

### 소규모 팀에 유리한 생태계

**Cloudinary**:
- ✅ 올인원 미디어 플랫폼 (이미지 + 비디오 + AI)
- ✅ No-code 대시보드에서 변환 설정 가능
- ✅ 마케팅팀도 사용 가능 (미디어 라이브러리)
- ✅ 문서/튜토리얼 풍부 → 학습 비용 낮음
- ❌ 유료 진입 장벽 높음 ($89/월)

**Cloudflare**:
- ✅ 이미 Cloudflare 사용 중이면 추가 비용 없음
- ✅ 종량제 → 예측 가능한 비용
- ✅ R2 + Workers + Images 통합 생태계
- ❌ 이미지 변환 외 기능 부족
- ❌ 고급 기능 필요 시 직접 구현해야 함

---

## 10. 최종 추천

### Sauna Log에 대한 구체적 추천

#### 즉시 (Phase 1): **Cloudflare Images** 도입

**이유**:
1. **지금 필요한 것은 HEIC→JPEG 변환뿐** — Cloudflare가 가장 단순하게 해결
2. **5K 무료 변환/월**이 초기 1K MAU에 충분 (월 1-2K 변환 예상)
3. **이그레스 무료** → 비용 예측 쉬움
4. **URL 기반** → SDK 설치 불필요, 통합 30분
5. **Supabase URL 직접 변환 가능** → 아키텍처 변경 최소

**통합 방법**:
```
1. Cloudflare 계정에서 도메인 설정 (또는 Worker 배포)
2. 이미지 변환 활성화 ("Resize images from any origin" 켜기)
3. 클라이언트에서 HEIC → Supabase Storage 업로드
4. 변환 URL 생성: /cdn-cgi/image/format=jpeg,quality=80,width=1080/{supabase_url}
5. 변환된 이미지로 스토리 카드 렌더링
```

#### 중기 (Phase 2, MAU 5K+ 또는 고급 기능 필요 시): **Cloudinary로 전환 또는 하이브리드**

**전환 트리거**:
- OG 이미지 동적 생성이 필요해질 때
- 텍스트 오버레이로 서버사이드 스토리 카드 생성이 필요해질 때
- 비디오 기능 추가 시
- 월 5K 유니크 변환 초과가 빈번해질 때

**하이브리드 구성**:
```
Cloudflare Images → HEIC 변환 + 일반 리사이즈 (비용 효율)
Cloudinary → OG 이미지 + 텍스트 오버레이 + 특수 변환 (기능 풍부)
```

### 마이그레이션 경로

```
현재 (클라이언트 WASM)
  ↓ Phase 1: heic2any → heic-to 교체 (즉시 개선)
  ↓ Phase 2: Cloudflare Images 도입 (서버사이드 변환)
  ↓ Phase 3: 필요 시 Cloudinary 추가 (고급 기능)

원본은 항상 Supabase Storage에 보관
→ 어느 시점이든 변환 레이어 교체 가능
```

### 의사결정 요약표

| 질문 | 답변 |
|------|------|
| 지금 당장 어떤 것? | **Cloudflare Images** (단순, 무료, 빠름) |
| 장기적으로 더 가치 있는 것? | **Cloudinary** (기능 생태계) |
| 락인 리스크가 낮은 것? | **Cloudflare** (변환 레이어만) |
| DX가 좋은 것? | **Cloudinary** (SDK, 문서, 대시보드) |
| 비용이 저렴한 것? | 규모에 따라 다름 (위 §3 참조) |
| 한국 성능이 좋은 것? | **Cloudflare** (서울 직접 PoP) |
| HEIC 변환 품질? | 둘 다 우수 (실측 비교 필요) |

---

## 부록: 주요 수치 한눈에 보기

| 항목 | Cloudinary Free | Cloudflare Free |
|------|----------------|-----------------|
| 월 무료 변환 | ~25,000 (크레딧 공유) | 5,000 유니크 |
| 월 무료 저장 | ~25GB (크레딧 공유) | ❌ |
| 월 무료 대역폭 | ~25GB (크레딧 공유) | ♾️ 무제한 |
| 최대 이미지 크기 | 10MB | 70MB |
| 최대 해상도 | 25MP | 100MP |
| HEIC 입력 | ✅ | ✅ |
| 출력 포맷 수 | 30+ | 6 |
| CDN PoP (글로벌) | ~70 도시 | 330+ 도시 |
| 서울 PoP | ✅ (파트너) | ✅ (직접) |
| Next.js SDK | ✅ next-cloudinary | ❌ (커스텀 로더) |
| 첫 유료 플랜 | $89/월 | $0.50/1K (종량제) |
| 초과 시 | 서비스 차단 | 9422 에러 차단 |

---

> 신뢰도: ⚠️ 부분확인
> - Cloudflare Images 데이터: ✅ 공식 문서 기반
> - Cloudinary 크레딧 시스템: ⚠️ 공식 문서 접근 제한으로 커뮤니티/이전 연구 기반 추정 포함
> - 성능 수치: ⚠️ 커뮤니티 보고 기반 추정 (실측 필요)
> - 비용 계산: ⚠️ 크레딧 환산율은 정확한 공식 문서 확인 권장
