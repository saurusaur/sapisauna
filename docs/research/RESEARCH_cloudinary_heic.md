# Cloudinary HEIC-to-JPEG 전환 서비스 리서치

> 조사일: 2026-03-14 | 신뢰도: ✅ 검증됨 (공식 문서 + 가격 페이지 기반)

## 1. HEIC 입력 지원 여부

**결론: 완벽 지원.**

- Cloudinary는 HEIC/HEIF 입력을 네이티브로 지원
- 업로드 시 자동 변환 가능 (incoming transformation에서 format 지정)
- `f_jpg` 또는 `f_auto` 파라미터로 JPEG/WebP 자동 변환
- 별도 코덱 설치나 설정 불필요

## 2. Free Tier 한도 (2026년 3월 기준)

**월 25 크레딧** (크레딧 기반 통합 쿼터)

| 리소스 | 1 크레딧 = | 25 크레딧 최대 |
|--------|-----------|---------------|
| 변환 (Transformations) | 1,000건 | 25,000건 |
| 저장소 (Storage) | 1 GB | 25 GB |
| 대역폭 (Bandwidth) | 1 GB | 25 GB |

- 크레딧은 세 가지에 자유롭게 배분 가능
- 예: 변환 5,000건 + 저장소 10GB + 대역폭 10GB
- 최대 이미지 크기: 10MB
- **우리 유스케이스 추정**: 사진 1장당 변환 1건 + ~3MB 대역폭 → 월 수천 장 변환 가능

## 3. 통합 방식 (3가지)

### 방식 A: Upload API (권장 — 서버사이드)
```
POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
Body: FormData { file, upload_preset, ... }
```
- 서버에서 signed upload (API key + secret으로 인증)
- 업로드 시 incoming transformation으로 HEIC → JPEG 자동 변환
- 응답에서 `secure_url` 받아서 사용
- **SDK 없이 fetch()로 가능**

### 방식 B: Unsigned Upload (클라이언트사이드)
```
POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
Body: FormData { file, upload_preset: "unsigned_preset_name" }
```
- Upload Preset 미리 생성 필요 (Cloudinary 대시보드)
- Preset에 format 변환 설정 가능
- API key 노출 없음

### 방식 C: Fetch URL (업로드 없이 변환)
```
https://res.cloudinary.com/{cloud_name}/image/fetch/f_jpg,q_auto/{remote_image_url}
```
- 원격 이미지 URL을 넣으면 on-the-fly 변환 + CDN 캐시
- 이미지를 Cloudinary에 저장하지 않음
- **단, HEIC 파일이 이미 public URL로 접근 가능해야 함**
- 우리 케이스: Supabase Storage URL → Cloudinary fetch → JPEG 반환

## 4. 레이턴시

- **첫 요청**: 변환 처리 필요 → 일반 이미지 수백ms, 대형 이미지 1-2초 수준
- **이후 요청**: CDN 캐시 히트 → 수십ms
- 공식 문서: "on-the-fly 변환 시간은 negligible" (일반 크기 기준)
- **Eager transformation**: 업로드 시점에 미리 변환 생성 가능 → 첫 요청 레이턴시 제거
- **비교**: 현재 sharp 서버 변환도 비슷한 수준이므로 체감 차이 미미

## 5. 유료 플랜 가격

| 플랜 | 월 가격 | 크레딧 |
|------|---------|--------|
| Free | $0 | 25 |
| Plus | $89 | 225 |
| Advanced | $224 | 600 |
| Enterprise | 커스텀 | 커스텀 |

- 초과 사용 시 추가 크레딧 구매 가능
- Free → Plus 점프가 $89로 큰 편

## 6. 대안 비교

| 서비스 | HEIC 입력 | Free Tier | 가격 (유료) | 특징 |
|--------|-----------|-----------|------------|------|
| **Cloudinary** | ✅ 네이티브 | 25 크레딧/월 | $89/월~ | 가장 성숙, fetch URL 변환, SDK 풍부 |
| **imgix** | ✅ 네이티브 | 있음 (한도 미확인) | 크레딧 기반 | 외부 스토리지 연결 방식, 빠른 렌더링 |
| **Cloudflare Images** | ✅ 입력만 | 5,000 변환/월 무료 | $0.50/1K 변환 | 종량제, 이그레스 무료, 단순 |
| **Uploadcare** | ✅ | 없음 (사실상) | $185/월~ | 비싸고 free tier 부실 |
| **CloudConvert** | ✅ | 25 변환/일 | 종량제 | API 기반, 범용 파일 변환 |

### 추천 순위 (우리 유스케이스 기준)
1. **Cloudflare Images** — 종량제라 소규모에 최적, 5K 무료 변환
2. **Cloudinary** — Free 25 크레딧으로 충분, 생태계 풍부
3. **imgix** — 외부 스토리지 연결 방식이 Supabase와 잘 맞음

## 7. SDK 없이 fetch 기반 접근

**가능.** 두 가지 패턴:

### 패턴 1: Upload + 변환 (fetch API만 사용)
```
// 서버사이드 API route에서
const formData = new FormData();
formData.append('file', heicBuffer);
formData.append('upload_preset', 'my_preset');

const res = await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
  { method: 'POST', body: formData }
);
const { secure_url } = await res.json();
// secure_url이 변환된 JPEG URL
```

### 패턴 2: Fetch URL (이미 퍼블릭 URL이 있을 때)
```
// URL 조합만으로 변환 — API 호출 불필요
const jpegUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_jpg,q_auto/${encodeURIComponent(originalHeicUrl)}`;
```

- SDK 설치 불필요
- 환경변수: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (signed upload 시)
- Unsigned upload은 `CLOUD_NAME` + `UPLOAD_PRESET`만 필요

## 8. 현재 아키텍처와의 비교

현재: 클라이언트 HEIC → Next.js API Route (sharp) → JPEG → Supabase Storage
- **문제**: Vercel serverless에서 sharp가 HEIC 코덱 미지원

Cloudinary 도입 시:
- **옵션 A**: 클라이언트 HEIC → Cloudinary Upload (자동 변환) → JPEG URL 반환 → Supabase에 URL 저장
- **옵션 B**: 클라이언트 HEIC → Supabase Storage → Cloudinary Fetch URL로 JPEG 서빙
- **옵션 C**: 클라이언트 HEIC → API Route에서 Cloudinary Upload → 변환된 이미지 다운로드 → Supabase Storage 저장

## 결론

Cloudinary Free tier(25크레딧)로 시작하기에 충분하며, SDK 없이 fetch()만으로 통합 가능.
Cloudflare Images도 종량제로 매력적이나, Cloudinary가 HEIC 변환 + CDN + 리사이즈를 한번에 처리하는 점에서 통합 비용이 낮음.
