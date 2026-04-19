# TypeScript/JavaScript 체크리스트

## 감지 조건

| 파일 | 감지 결과 |
|------|----------|
| `package.json` | Node.js/JS/TS 계열 |
| `tsconfig.json` | TypeScript 활성 |

## 검사 항목

- [ ] `any` 타입 사용 -> 구체적 타입으로 교체
- [ ] 타입 단언(`as`) 남용 여부
- [ ] non-null assertion(`!`) 남용 여부
- [ ] `==` 대신 `===` 사용 여부

## Sauna Log 예시

- 도메인 타입은 `src/types/index.ts`와 맞는지 (`LogWithPlace`, `TribeId`, `Place` 등)
- 서비스 반환값이 훅에서 그대로 쓰이는지 (임의 필드 추가 금지)

## 검증 명령

| 도구 | 명령 |
|------|------|
| TypeScript | `npx tsc --noEmit` |
| ESLint (이 프로젝트) | `npm run lint` |
| Next 빌드 | `npm run build` |
