# Best Practices Registry

스택별 공식 베스트 프랙티스 소스.
vibe-cleanup 동적 조회 단계에서 참조한다.

## 조회 우선순위

| 우선순위 | 도구 | 조건 | 용도 |
|---------|------|------|------|
| 1 | context7 MCP | MCP 서버 활성 시 | 라이브러리별 최신 문서 (최대 3회) |
| 2 | WebFetch | context7 실패/보충 시 | 공식 URL 직접 조회 |
| 3 | 내장 체크리스트 | 폴백 (항상 사용) | `references/checklists/{스택}.md` |

## 스택별 소스

### React

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| React 공식 | https://react.dev/ | react | hooks rules, thinking in react, best practices |

### Next.js

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| Next.js 공식 | https://nextjs.org/docs | next.js | app router best practices, performance |

### Supabase (Sauna Log)

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| Supabase JS | https://supabase.com/docs/reference/javascript/introduction | supabase-js | auth, storage, queries, RLS |
| Supabase Next.js | https://supabase.com/docs/guides/getting-started/quickstarts/nextjs | supabase | SSR, cookies, middleware |

### TypeScript

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| TS Do's and Don'ts | https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html | typescript | do's and don'ts, strict mode |

### Python

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| PEP 8 | https://peps.python.org/pep-0008/ | python | style guide, naming conventions |
| FastAPI | https://fastapi.tiangolo.com/ | fastapi | best practices (FastAPI 감지 시) |
| Django | https://docs.djangoproject.com/ | django | best practices (Django 감지 시) |

### Java/Spring Boot

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| Spring Boot 공식 | https://docs.spring.io/spring-boot/reference/using/index.html | spring-boot | development guide, best practices |

### Go

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| Effective Go | https://go.dev/doc/effective_go | go | effective go, code review comments |

### Rust

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| Clippy | https://doc.rust-lang.org/clippy/ | rust | clippy lints, best practices |

### C#/.NET

| 소스 | URL | context7 libraryName | 조회 키워드 |
|------|-----|---------------------|-----------|
| .NET 가이드 | https://learn.microsoft.com/dotnet/ | dotnet | coding conventions, best practices |

## 외부 린터 (설치 시 자동 활용)

설치되어 있으면 vibe-cleanup 검증 단계에서 자동 실행. 없으면 스킵.

| 도구 | 용도 | 명령 | 감지 조건 | 속도 |
|------|------|------|---------|------|
| Biome | Rust 기반 올인원 린터+포매터 | `biome check .` | `biome.json` 존재 | ESLint 대비 10-20x |
| Oxlint | Rust 기반 초고속 린터 | `oxlint .` | `which oxlint` 성공 | ESLint 대비 50-100x |

> 기존 ESLint/Prettier 설정이 있으면 그것을 우선 사용.
> 이 레포: `eslint` + `eslint-config-next`, 스크립트 `npm run lint`.
