# Username Validation & Profanity Filter 리서치 결과

> 조사일: 2026-03-13

---

## 1. Reserved Usernames (예약된 사용자명)

### A. `shouldbee/reserved-usernames` (Raw List)
- **URL**: https://github.com/shouldbee/reserved-usernames
- **내용**: 590+ 예약 사용자명 (admin, root, support, api, www 등)
- **포맷**: JSON, CSV, SQL, plain text
- **npm**: `reserved-usernames` (v1.1.6, 7년 전 - 비활성)
- **사용법**: Raw JSON 파일 다운로드 or npm install reserved-usernames
- **평가**: 리스트 자체는 충분히 포괄적. npm 패키지는 비활성이지만 JSON 리스트를 직접 가져다 쓰기 좋음

### B. `reserved-email-addresses-list` (npm)
- **URL**: https://www.npmjs.com/package/reserved-email-addresses-list
- **내용**: 1,250+ 예약 이메일/사용자명 (보안 관점)
- **사용법**: `npm install reserved-email-addresses-list`
- **평가**: shouldbee보다 더 포괄적. 보안 관련 주소 포함

### C. GitHub Gists (보완용)
- https://gist.github.com/1453705 — 대표적인 예약 사용자명 gist
- https://gist.github.com/benbowler/40516ec43d520d5ff49a4b3595c175b5

### 권장: shouldbee의 JSON 리스트를 프로젝트에 내장 + 사우나 앱 전용 예약어 추가 (sauna, admin, official, support 등)

---

## 2. Korean Profanity / Bad Words Lists (한국어 욕설 리스트)

### A. `badwords-ko` (npm) — 한국어 전용 필터
- **URL**: https://github.com/yoonheyjung/badwords-ko
- **npm**: `npm install badwords-ko` (v1.0.4)
- **마지막 업데이트**: ~2년 전
- **사용법**:
  ```js
  const Filter = require('badwords-ko');
  const filter = new Filter();
  filter.clean("입력 텍스트"); // 비속어를 *** 로 치환
  ```
- **평가**: 간단하고 가벼움. 한국어 전용. 단어 수는 제한적일 수 있음

### B. `korcen` (npm) — 한국어 비속어 판별 (TypeScript)
- **URL**: https://github.com/Tanat05/korcen.ts
- **npm**: `npm install korcen` (v0.2.4)
- **라이선스**: Apache-2.0
- **사용법**:
  ```js
  const { check } = require('korcen');
  const result = check("입력 텍스트"); // boolean 반환
  ```
- **평가**: TypeScript 지원. 같은 개발자가 ML 기반 korcen-kogpt2도 운영. 비교적 활발한 생태계

### C. `hlog2e/bad_word_list` (Raw JSON)
- **URL**: https://github.com/hlog2e/bad_word_list
- **포맷**: JSON Array
- **사용법**: CDN 또는 직접 다운로드
- **평가**: 순수 데이터 리스트. 자체 필터 로직에 통합하기 좋음

### D. `doublems/korean-bad-words` (Raw Markdown)
- **URL**: https://github.com/doublems/korean-bad-words
- **포맷**: Markdown 리스트
- **평가**: 한국 온라인 서비스용. 보충 리스트로 활용

### E. `korean-profanity-resources` (메타 리소스)
- **URL**: https://github.com/Tanat05/korean-profanity-resources
- **내용**: 한국어 욕설/비속어/혐오표현 관련 데이터셋, 라이브러리, API 모음
- **평가**: 리소스 허브. 어떤 옵션이 있는지 한눈에 파악 가능

---

## 3. Combined: Multi-language Profanity Filter (영어 + 한국어 통합)

### A. `glin-profanity` (npm) — 23개 언어, ML 기반 ⭐ 추천
- **URL**: https://github.com/GLINCKER/glin-profanity
- **npm**: `npm install glin-profanity` (v1.9.0)
- **언어**: 23개 (Korean, English, Japanese, Chinese 등 포함)
- **주간 다운로드**: ~245
- **마지막 업데이트**: ~20일 전 (활발)
- **특징**: TensorFlow.js 기반 독성 탐지, leetspeak/유니코드 우회 방지, React hooks, LRU 캐싱
- **사용법**:
  ```js
  import { checkProfanity } from 'glin-profanity';
  const result = checkProfanity("입력", { languages: ['korean', 'english'] });
  if (result.containsProfanity) {
    console.log('차단:', result.profaneWords);
  }
  ```
- **평가**: 가장 포괄적이고 활발. 한국어+영어 동시 지원. 다만 TensorFlow.js 의존성으로 번들 크기 증가 가능

### B. `@2toad/profanity` (npm) — 다국어, TypeScript
- **URL**: https://github.com/2Toad/Profanity
- **npm**: `npm install @2toad/profanity` (v3.2.0)
- **GitHub Stars**: ~116
- **마지막 업데이트**: ~5개월 전
- **특징**: TypeScript 풀 지원, LibreTranslate 기반 다국어
- **사용법**:
  ```js
  import { Profanity } from '@2toad/profanity';
  const profanity = new Profanity({ languages: ['en'] });
  profanity.exists("text"); // boolean
  profanity.censor("text"); // 치환된 텍스트
  ```
- **평가**: TypeScript 지원 좋음. 한국어 지원 여부는 명확하지 않음 (LibreTranslate 의존)

### C. `obscenity` (npm) — 확장 가능, 영어 중심
- **URL**: https://github.com/jo3-l/obscenity
- **npm**: `npm install obscenity` (v0.4.6)
- **GitHub Stars**: ~147
- **마지막 업데이트**: ~19일 전
- **특징**: Transformer 기반 패턴 매칭, leetspeak 변형 자동 탐지
- **평가**: 영어 preset만 내장. 한국어는 커스텀 사전 추가 필요. 아키텍처는 가장 견고

---

## 4. 추천 조합 (Sauna Log 프로젝트용)

### 방법 1: 가벼운 조합 (권장)
```
reserved-usernames JSON (shouldbee) + korcen (한국어) + 자체 영어 금지어 리스트
```
- 번들 크기 최소
- 한국어는 korcen으로, 영어 금지어는 간단한 배열로 관리
- 예약 사용자명은 JSON import

### 방법 2: 올인원
```
glin-profanity (한국어+영어 통합) + reserved-usernames JSON
```
- 하나의 패키지로 다국어 처리
- TensorFlow.js 의존성 부담

### 방법 3: 커스텀 (최경량)
```
shouldbee JSON + hlog2e/bad_word_list JSON + 자체 영어 금지어 배열
```
- 외부 의존성 최소
- JSON 리스트를 constants 파일에 직접 내장
- Set 기반 O(1) lookup
