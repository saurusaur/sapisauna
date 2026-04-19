# 범용 체크리스트 (모든 스택 공통)

언어와 무관하게 항상 검사하는 항목.

## 코드 위생

- [ ] 미사용 import/include/require 제거
- [ ] 미사용 변수/함수/클래스 제거
- [ ] 디버깅 잔재 제거 (언어별 패턴)
  - JS/TS: `console.log`, `console.debug`, `debugger`
  - Python: `print()` (디버깅용), `breakpoint()`, `pdb`
  - Java/Kotlin: `System.out.println`, `e.printStackTrace()`
  - Go: `fmt.Println` (디버깅용), `log.Println` (임시)
  - Rust: `dbg!()`, `println!` (디버깅용)
  - C#: `Console.WriteLine` (디버깅용), `Debug.WriteLine`
  - PHP: `var_dump`, `print_r`, `dd()`
  - Ruby: `puts` (디버깅용), `p`, `binding.pry`
  - Dart/Flutter: `print()` (디버깅용), `debugPrint()`, `debugDumpApp()`
- [ ] 주석 처리된 코드 블록 제거 (설명 주석은 유지)
- [ ] TODO/FIXME/HACK 주석 목록화 (삭제하지 않고 리포트)

## 보안 위생 (기본)

> 깊은 보안 스캔(SQL injection, XSS, 의존성 취약점)은 보안 전용 스킬 영역.
> 여기서는 가장 기본적인 위생만 검사한다.

- [ ] 하드코딩된 시크릿/토큰/API 키 탐지 (패턴: `password=`, `secret=`, `token=`, `api_key=`, Bearer 토큰 등)
- [ ] 하드코딩된 기본 자격증명 탐지 (`admin:admin`, `user@example.com:password123` 등)
- [ ] 하드코딩된 URL/엔드포인트 -> 환경 변수 또는 설정 파일로 이동 필요 여부 확인
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인

## 데이터 흐름

- [ ] 하드코딩된 값이 뷰/템플릿에 직접 박혀있지 않은지 확인
- [ ] 가짜/더미 데이터라도 교체 가능한 구조인지 확인 (매직 넘버, 매직 스트링)
- [ ] 설정값이 코드에 흩어져 있지 않고 한 곳에서 관리되는지 확인

## 컨벤션 일관성

- [ ] 네이밍 규칙 일관성 검사 (기존 코드 패턴 기준으로 판단)
  - 파일명: kebab-case / camelCase / snake_case 혼용 여부
  - 변수/함수: camelCase / snake_case 혼용 여부
- [ ] import 경로 규칙 일관성 (절대경로/상대경로 혼용 여부)
- [ ] 들여쓰기 일관성 (탭/스페이스 혼용, 스페이스 수 불일치)
