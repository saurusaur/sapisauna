# UX/UI Principles for Sauna Log PWA

> 모바일 PWA (사우나/찜질방 기록 앱) 전용 UX/UI 원칙 레퍼런스
> 최종 업데이트: 2026-02-28

---

## 1. 핵심 UX 법칙/원칙 (Core UX Laws)

### 1-1. 3-Click Rule (3클릭 규칙)

| 항목 | 내용 |
|------|------|
| **정의** | 사용자가 원하는 정보/기능에 3번 이내의 클릭으로 도달해야 한다는 경험 법칙 |
| **학술적 근거** | NN/g 연구에서 클릭 수와 사용자 성공률 사이에 유의미한 상관관계가 없음을 밝힘. 한 연구에서는 8,000건 이상의 클릭을 분석한 결과, 사용자는 2~25회 클릭 범위에서 활동. 오히려 3클릭에서 4클릭으로 변경 후 제품 발견율이 600% 증가한 사례도 존재 |
| **현대적 해석** | 클릭 수 자체보다 **각 클릭의 인지적 비용(cognitive cost)**이 중요. 클릭마다 사용자가 "올바른 방향으로 가고 있다"는 확신(information scent)을 제공하면 클릭 수는 문제가 되지 않음 |
| **Sauna Log 적용** | 로그 기록의 핵심 플로우(홈 → 로그 → 완료)를 3단계로 설계하되, 상세 기록(Deep Log)은 4~5단계여도 각 단계에서 진행 상태를 명확히 표시 |

**출처**: [NN/g: The 3-Click Rule for Navigation Is False](https://www.nngroup.com/articles/3-click-rule/), [UX Myths #2](https://uxmyths.com/post/654026581/myth-all-pages-should-be-accessible-in-3-clicks)

---

### 1-2. Hick's Law (힉의 법칙)

| 항목 | 내용 |
|------|------|
| **정의** | 선택지의 수와 복잡도가 증가하면 의사결정에 필요한 시간이 로그 함수적으로 증가한다 |
| **공식** | RT = a + b × log₂(n) (RT: 반응시간, n: 선택지 수) |
| **핵심 원리** | 선택지가 너무 많으면 망설임(hesitation), 피로(fatigue), 이탈(abandonment) 발생 |
| **2026 맥락** | AI 추천/개인화 레이어로 선택지를 사전 필터링하는 추세. 작은 세트의 명확한 경로를 먼저 보여주고, 검색/필터/단계적 진행으로 세분화 |
| **Sauna Log 적용** | 사용자 그룹(목욕파/사우너파/찜질파) 선택을 온보딩에서 한 번만 수행 → 이후 해당 그룹에 최적화된 3~5개 핵심 입력 필드만 노출. 장소 선택도 최근 방문/즐겨찾기를 상단 배치 |

**출처**: [Laws of UX: Hick's Law](https://lawsofux.com/hicks-law/), [Clay: Laws of UX](https://clay.global/blog/laws-of-ux)

---

### 1-3. Fitts's Law (피츠의 법칙)

| 항목 | 내용 |
|------|------|
| **정의** | 타겟까지의 이동 시간은 타겟의 크기에 반비례하고 거리에 비례한다 (1954, Paul Fitts) |
| **공식** | MT = a + b × log₂(2D/W) (MT: 이동시간, D: 거리, W: 타겟 너비) |
| **핵심 원리** | 중요한 액션은 손가락이 이미 있는 곳 가까이, 충분히 크게 배치 |
| **수치 기준** | Apple HIG: 최소 44×44pt / Material Design: 최소 48×48dp / MIT Touch Lab: 평균 손가락 패드 10-14mm, 손가락 끝 8-10mm |
| **Sauna Log 적용** | "기록 시작" FAB 버튼을 하단 중앙에 크게 배치 (최소 56dp). 기록 중 주요 입력 영역(온도 슬라이더, 시간 선택)을 화면 하단 2/3에 집중 배치 |

**출처**: [Laws of UX: Fitts's Law](https://lawsofux.com/fittss-law/), [NN/g: Touch Target Size](https://www.nngroup.com/articles/touch-target-size/)

---

### 1-4. Jakob's Law (제이콥의 법칙)

| 항목 | 내용 |
|------|------|
| **정의** | 사용자는 대부분의 시간을 다른 앱/사이트에서 보내므로, 당신의 앱도 그들이 이미 아는 방식으로 작동하길 기대한다 (Jakob Nielsen) |
| **핵심 원리** | 익숙한 디자인 패턴을 활용하면 사용자가 패턴 학습이 아닌 작업 완료에 집중할 수 있음 |
| **Sauna Log 적용** | 하단 탭 네비게이션(홈/탐색/기록/히스토리/설정) 사용 — Instagram, 카카오맵 등 사용자가 익숙한 패턴. 기록 카드 UI는 Instagram 스토리/카드 레이아웃 참조. 설정 페이지는 iOS 설정 앱과 유사한 리스트 구조 |

**출처**: [Laws of UX: Jakob's Law](https://lawsofux.com/jakobs-law/), [Helio: Jakob's Law](https://helio.app/ux-research/laws-of-ux/jakobs-law/)

---

### 1-5. Miller's Law (밀러의 법칙)

| 항목 | 내용 |
|------|------|
| **정의** | 평균적인 사람의 작업 기억(working memory)은 한 번에 7(±2)개의 정보 청크(chunk)를 처리할 수 있다 (1956, George Miller) |
| **핵심 원리** | 정보를 의미 있는 단위(chunk)로 묶어 인지 부하를 줄여야 함. 단, "7개 제한"을 디자인 독단으로 사용하지 말 것 — 핵심은 인지 부하 감소 |
| **실제 사례** | Netflix: 각 카테고리 캐러셀에 6개 항목 표시, 네비게이션 메뉴도 청킹 활용 |
| **Sauna Log 적용** | 기록 입력 필드를 카테고리별로 청킹 — "기본 정보"(장소, 날짜), "사우나 루틴"(온도, 시간, 세트), "컨디션"(체감, 메모). 한 화면에 5개 이하의 입력 필드 노출 |

**출처**: [Laws of UX: Miller's Law](https://lawsofux.com/millers-law/), [CareerFoundry: Miller's Law Guide](https://careerfoundry.com/en/blog/ux-design/what-is-millers-law/)

---

### 1-6. Doherty Threshold (도허티 임계값)

| 항목 | 내용 |
|------|------|
| **정의** | 시스템 응답 시간이 400ms 이하일 때 생산성이 급격히 상승하며 사용이 "중독적(addicting)"이 된다 (1982, Doherty & Thadani, IBM Systems Journal) |
| **이전 기준** | 기존 허용 기준은 2,000ms(2초) — Doherty는 이를 400ms로 대폭 낮춤 |
| **핵심 원리** | 실제 처리 속도뿐 아니라 **체감 속도**도 중요. 로딩 애니메이션, 스켈레톤 UI, 낙관적 업데이트(optimistic update)로 즉각 반응하는 느낌 제공 |
| **Sauna Log 적용** | 기록 저장 시 즉시 완료 화면 표시 (낙관적 업데이트) → 백그라운드에서 Supabase 동기화. 페이지 전환 시 스켈레톤 UI 사용. 탭 전환 400ms 이내 응답 |

**출처**: [Laws of UX: Doherty Threshold](https://lawsofux.com/doherty-threshold/), [Designzig: Doherty's Threshold](https://designzig.com/dohertys-threshold-in-ux-design/)

---

### 1-7. Peak-End Rule (피크-엔드 법칙)

| 항목 | 내용 |
|------|------|
| **정의** | 사람은 경험 전체의 평균이 아니라, 가장 강렬했던 순간(peak)과 마지막 순간(end)을 기준으로 경험을 기억하고 평가한다 (Daniel Kahneman & Barbara Fredrickson) |
| **핵심 원리** | 완벽한 전체 경험보다 **기억에 남는 피크 모먼트 + 긍정적 마무리**가 더 효과적 |
| **실제 사례** | Duolingo: 레슨 완료 후 축하 애니메이션과 가상 보상. Uber: 라이드 종료 시 간결한 요약과 별점 |
| **Sauna Log 적용** | **피크**: 기록 완료 시 사우나 테마 축하 애니메이션 + 이번 기록의 하이라이트 요약. **엔드**: 인스타그램 스토리 공유 프리뷰를 아름답게 보여주며 "오늘의 사우나 기록 완성!" 메시지. 월간 리포트의 마무리도 성취감 있는 시각화로 |

**출처**: [Laws of UX: Peak-End Rule](https://lawsofux.com/peak-end-rule/), [FlowMapp: Peak-End Rule](https://www.flowmapp.com/blog/qa/peak-end-rule)

---

### 1-8. Aesthetic-Usability Effect (심미적-사용성 효과)

| 항목 | 내용 |
|------|------|
| **정의** | 사용자는 미적으로 매력적인 디자인을 더 사용하기 쉽다고 인식한다 (1995, Kurosu & Kashimura, Hitachi Design Center) |
| **연구 근거** | 252명 참가자에게 ATM UI 26개 변형을 테스트 → 미적 매력과 사용 편의성 인식 간 강한 양의 상관관계 |
| **핵심 원리** | 아름다운 디자인은 사용자의 뇌에서 긍정적 반응을 유발하여 사소한 사용성 문제를 관대하게 넘기게 함. 단, 근본적인 사용성 문제를 가릴 수 있으므로 테스트 시 유의 |
| **Sauna Log 적용** | 사우나/온천 감성의 따뜻한 컬러 팔레트와 부드러운 그라데이션 적용. 기록 카드와 스토리 공유 이미지의 시각적 완성도를 높여 "예쁘게 기록한다"는 핵심 가치 강화. 폰트, 여백, 아이콘 일관성 유지 |

**출처**: [Laws of UX: Aesthetic-Usability Effect](https://lawsofux.com/laws/), [Toptal: Laws of UX](https://www.toptal.com/designers/ux/laws-of-ux-infographic)

---

### 1-9. Von Restorff Effect (폰 레스토프 효과 / 격리 효과)

| 항목 | 내용 |
|------|------|
| **정의** | 여러 유사한 객체 중에서 나머지와 다른 하나가 가장 잘 기억된다 (1933, Hedwig von Restorff) |
| **핵심 원리** | "모든 것이 강조되면 아무것도 강조되지 않는다." 단일 주요 버튼, 한 가지 핵심 CTA만 시각적으로 차별화 |
| **주의사항** | 접근성을 위해 색상만으로 구분하지 말고 크기, 형태, 위치 등 복합적 시각 단서 사용 |
| **Sauna Log 적용** | 각 화면에서 하나의 Primary CTA만 강조 색상 적용(예: "기록 시작" 버튼). 히스토리 목록에서 "오늘의 기록"을 시각적으로 차별화(배경색, 뱃지). 탐색 페이지에서 추천 장소를 별도 카드 스타일로 |

**출처**: [Laws of UX: Von Restorff Effect](https://lawsofux.com/von-restorff-effect/), [UXtweak: Von Restorff Effect](https://blog.uxtweak.com/von-restorff-effect/)

---

### 1-10. Zeigarnik Effect (자이가르닉 효과)

| 항목 | 내용 |
|------|------|
| **정의** | 미완료된 작업은 완료된 작업보다 더 잘 기억된다. 열린 루프(open loop)는 정신적 긴장을 만들어 주의를 끌어당긴다 (Bluma Zeigarnik) |
| **핵심 원리** | 드래프트 저장, "이어서 하기", 프로그레스 바 등으로 사용자가 자연스럽게 돌아오게 유도 |
| **실제 사례** | LinkedIn 프로필 완성도 바, 게임의 퀘스트 시스템, Duolingo 연속 학습 스트릭 |
| **Sauna Log 적용** | 기록 중 이탈 시 자동 드래프트 저장 → 다음 접속 때 "기록을 이어가세요" 카드 표시. 월간 목표 진행률 시각화("이번 달 8/12회 달성"). 사우너 레벨/뱃지 시스템의 다음 단계를 항상 노출 |

**출처**: [Laws of UX](https://clay.global/blog/laws-of-ux), [Looppanel: Laws of UX](https://www.looppanel.com/blog/laws-of-ux)

---

### 1-11. Progressive Disclosure (점진적 공개)

| 항목 | 내용 |
|------|------|
| **정의** | 사용자에게 필요한 시점에 필요한 만큼의 정보만 순차적으로 제공하여 인지 부하를 줄이는 인터랙션 디자인 패턴 |
| **핵심 원리** | 불필요한 링크, 이미지, 태그, 버튼을 제거하여 사용자가 목표를 빠르게 달성하도록 지원. 복잡한 기능은 고급 옵션/확장 영역에 배치 |
| **Sauna Log 적용** | 숏로그(Quick Log): 장소 + 날짜 + 한줄평만 → 3초 완료. 딥로그(Deep Log): "더 자세히 기록하기" 탭으로 온도, 세트, 컨디션 등 확장. 설정에서도 기본/고급 분리. 온보딩에서 핵심 기능만 먼저, 고급 기능은 사용 중 자연스럽게 발견하도록 |

**출처**: [Think360 Studio: Progressive Disclosure](https://think360studio.com/blog/progressive-disclosure)

---

### 1-12. Recognition over Recall (재인 > 회상)

| 항목 | 내용 |
|------|------|
| **정의** | 사용자에게 기억에서 꺼내게(recall) 하지 말고, 보여주고 고르게(recognize) 하라 (Nielsen의 10가지 휴리스틱 중 #6) |
| **핵심 원리** | 익숙한 아이콘, 레이아웃, 레이블을 사용하면 사용자가 멈추지 않고 즉시 행동 가능. 장바구니 아이콘, 돋보기 검색 아이콘 등 |
| **Sauna Log 적용** | 최근 방문 장소를 로그 시작 시 카드로 표시 → 직접 입력(recall) 대신 선택(recognize). 이전 기록의 루틴을 템플릿으로 제안. 사우나 종류(건식/습식/반신욕 등)를 아이콘+텍스트로 시각적 선택지 제공 |

**출처**: [IxDF: Recognition vs Recall](https://www.interaction-design.org/literature/topics/recognition-vs-recall), [Nielsen Heuristics](https://blog.uxtweak.com/usability-heuristics/)

---

## 2. 모바일 특화 가이드라인 (Mobile-Specific Guidelines)

### 2-1. 터치 타겟 사이즈 (Touch Target Size)

| 플랫폼/표준 | 최소 사이즈 | 비고 |
|-------------|-----------|------|
| **Apple HIG** | 44 × 44 pt | 모든 컨트롤에 적용 |
| **Material Design** | 48 × 48 dp | Android 기본 권장 |
| **WCAG 2.5.8** | 24 × 24 CSS px | Level AA 최소 기준 (또는 24px 간격) |
| **물리적 근거** | 9 × 9 mm 이상 | MIT Touch Lab: 평균 손가락 패드 10-14mm, 손가락 끝 8-10mm |

**Sauna Log 적용**: 모든 터치 가능 요소 최소 48dp 보장. 슬라이더 핸들은 56dp 이상. 인접 버튼 간 최소 8dp 간격.

---

### 2-2. 엄지 존 (Thumb Zone)

| 영역 | 위치 | 사용 가이드 |
|------|------|-----------|
| **Easy Zone** (자연스러운 영역) | 화면 하단 1/3, 특히 하단 중앙 | 주요 CTA, 핵심 네비게이션, 자주 쓰는 액션 |
| **Stretch Zone** (긴장 영역) | 화면 중앙~상단 1/3 | 콘텐츠 표시, 읽기 영역 |
| **Hard Zone** (어려운 영역) | 화면 최상단, 특히 좌우 상단 모서리 | 비주류 기능만 배치 (설정 톱니, 알림 등) |

**2025 트렌드**: 하단 내비게이션 바, FAB(Floating Action Button), 슬라이드-업 드로어가 표준. 3~5개 메인 섹션에 하단 탭 네비게이션이 가장 효과적.

**Sauna Log 적용**:
- 하단 탭 네비게이션 (홈/탐색/기록/히스토리/설정)
- "새 기록" FAB 버튼을 하단 중앙 배치
- 기록 입력 시 주요 인터랙션 영역을 화면 하반부에 집중
- 삭제/편집 등 파괴적 액션은 상단 또는 모달로 분리

---

### 2-3. 세이프 영역 (Safe Area)

| 요소 | 가이드 |
|------|--------|
| **상단 노치/다이나믹 아일랜드** | iOS: `env(safe-area-inset-top)` 준수. 콘텐츠가 노치 아래로 가리지 않도록 |
| **하단 홈 인디케이터** | iOS: 하단 34pt 여백 확보. 스와이프 제스처 충돌 방지 |
| **모서리 라운딩** | 최신 디바이스의 라운드 코너에 콘텐츠가 잘리지 않도록 |
| **PWA 상태바** | `<meta name="theme-color">` 설정, `display: standalone` 모드에서 상태바 영역 관리 |

**Sauna Log 적용**: Next.js viewport meta 설정에 `viewport-fit=cover` + CSS `env()` 함수로 안전 영역 패딩. PWA manifest에서 `display: standalone` 설정.

---

### 2-4. Apple HIG 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **Clarity** | 텍스트는 모든 사이즈에서 읽기 쉽고, 아이콘은 정확하고 명료 |
| **Deference** | 콘텐츠가 주인공. UI 크롬은 최소화 |
| **Depth** | 시각적 레이어와 동작으로 계층 구조와 관계를 표현 |
| **Direct Manipulation** | 콘텐츠를 직접 조작하는 느낌 (드래그, 스와이프) |
| **Feedback** | 모든 액션에 대한 즉각적 시각/햅틱 피드백 |
| **Consistency** | 시스템 전체에서 일관된 용어, 아이콘, 인터랙션 |

---

### 2-5. Material Design 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **Material is the metaphor** | 물리적 세계의 촉각과 공간감을 디지털에 반영 |
| **Bold, graphic, intentional** | 타이포그래피, 그리드, 컬러, 이미지로 의미 있는 시각 계층 |
| **Motion provides meaning** | 애니메이션은 주의를 안내하고 연속성을 유지하는 도구 |
| **Adaptive design** | 다양한 화면 크기와 입력 방식에 적응하는 반응형 레이아웃 |

---

### 2-6. 모바일 폼 UX Best Practices

| 원칙 | 구체적 가이드 |
|------|-------------|
| **단일 컬럼 레이아웃** | 모바일에서 다중 컬럼 금지. 2025 UX 트렌드: 68%의 사용자가 한 손 사용에 최적화된 폼에 더 참여 |
| **적절한 input type** | `email`, `tel`, `number`, `date` 등으로 디바이스 키보드 최적화. 입력 필드 최소 높이 44px |
| **Autocomplete 활용** | HTML `autocomplete` 속성 사용 시 타이핑 노력 60% 감소, 데이터 정확도 향상 |
| **인라인 유효성 검사** | 필드 완료 즉시 실시간 피드백. "입력이 잘못되었습니다" → "올바른 이메일 주소를 입력해주세요" |
| **진행 표시** | 다단계 폼에서 프로그레스 바 또는 스텝 인디케이터 |
| **최소 필드** | 선택적 필드는 기본 숨김. 필수 필드만 노출 |

**Sauna Log 적용**: 기록 입력 시 날짜는 `type="date"`, 시간은 `type="time"`, 온도는 숫자 슬라이더. 최근 방문 장소 자동완성. 인라인 에러 메시지는 영어+한국어 혼용.

---

## 3. 기록/로깅 앱 특화 원칙 (Logging App Specific)

### 3-1. 최소 입력 원칙 (Friction Minimization)

| 원칙 | 내용 |
|------|------|
| **"탭, 한 두 단어, 저장"** | 로깅이 너무 빨라서 "안 해야지"라고 생각할 틈이 없어야 함. 문자 보내는 것만큼 빠르게 |
| **고빈도 기록은 1~3줄** | 자주 하는 기록은 탭+선택만으로 완료. 추가 필드는 opt-in |
| **필드 가치 검증** | "이 필드가 나중에 조회/분석에 도움이 되는가?" — 아니면 현재 마찰만 증가시킴 |
| **로깅이 기본 행동** | "새 기록" 버튼은 항상 보이는 곳에 — FAB 또는 하단 프롬프트 |

**Sauna Log 적용**:
- 숏로그: 장소 선택(1탭) → 한줄평(선택) → 저장(1탭) = 최소 2탭 완료
- 딥로그: 기본 필드 자동 채움 후 수정만
- 기록 버튼은 홈 화면과 하단 네비게이션에서 항상 접근 가능

---

### 3-2. 기본값의 중요성 (Smart Defaults)

| 전략 | 적용 |
|------|------|
| **시간 기반 기본값** | 현재 날짜/시간 자동 입력 |
| **이력 기반 기본값** | 가장 최근 방문 장소를 첫 번째 추천으로 |
| **패턴 기반 기본값** | 사용자의 평소 루틴(예: 매주 토요일 방문)을 학습하여 제안 |
| **그룹 기반 기본값** | 사우너파는 온도/세트 필드 기본 표시, 목욕파는 입욕제/코스 필드 기본 표시 |

**핵심**: 기본값은 사용자의 시간과 노력을 절약하고, 불필요한 클릭 없이 의사결정을 안내한다.

---

### 3-3. 즉각적 피드백 (Immediate Feedback)

| 유형 | 구현 방법 |
|------|----------|
| **시각적 피드백** | 저장 시 체크마크 애니메이션, 슬라이더 조작 시 실시간 값 표시 |
| **햅틱 피드백** | 중요 액션(저장, 삭제) 시 진동 피드백 (PWA에서 Vibration API 활용) |
| **낙관적 업데이트** | UI를 먼저 업데이트하고 서버 동기화는 백그라운드에서 |
| **상태 표시** | 저장 중/완료/오프라인 저장됨 상태를 명확히 |

---

### 3-4. 데이터 시각화 원칙 (Data Visualization)

| 원칙 | 모바일 적용 가이드 |
|------|-------------------|
| **간결함 우선** | 불필요한 차트 잉크 제거. "Less is more" |
| **색상 3~4개** | 같은 데이터 유형에 일관된 색상 사용. 색상만으로 의미 전달 금지 (접근성) |
| **레전드 위치** | 모바일에서는 차트 상단에 범례 배치 (인터랙션 시 가려지지 않도록) |
| **터치 인터랙션** | 마우스 hover 대신 탭/롱프레스로 상세 데이터 표시 |
| **텍스트 가독성** | 확대 없이 읽을 수 있는 크기. 버튼/요소 탭 가능한 크기 |
| **시각적 계층** | 핵심 데이터를 크고 눈에 띄게, 부가 데이터는 작게 |

**Sauna Log 적용**: 히스토리 캘린더 뷰에서 방문 빈도를 히트맵으로 표시. 월간 리포트에서 방문 횟수/선호 장소/총 시간을 카드형 대시보드로. 차트는 단순한 바 차트나 도넛 차트 위주.

---

## 4. 프로덕션 환경 체크리스트 (Production UX Checklist)

### 4-1. 필수 UI 상태 (Essential UI States)

모든 데이터 표시 화면은 아래 5가지 상태를 반드시 처리해야 한다:

| # | 상태 | 설명 | 구현 가이드 |
|---|------|------|-----------|
| 1 | **로딩 상태 (Loading)** | 데이터 불러오는 중 | 스켈레톤 UI 사용 (스피너보다 우수). 400ms 이하 로딩은 로딩 표시 생략 가능 |
| 2 | **빈 상태 (Empty)** | 데이터가 없음 | 설명 텍스트 + CTA ("첫 사우나 기록을 시작해보세요!"). 일러스트 활용으로 차가운 느낌 방지 |
| 3 | **에러 상태 (Error)** | 요청 실패 | 구체적 에러 메시지 + 재시도 버튼. "다시 시도" 한 탭으로 복구 가능하게 |
| 4 | **성공 상태 (Success)** | 작업 완료 | 체크마크/축하 애니메이션 + 다음 액션 제안 |
| 5 | **부분 상태 (Partial)** | 일부만 로드됨 | 로드된 데이터 먼저 표시 + 나머지 로딩 인디케이터 |

---

### 4-2. PWA 특유 UX 고려사항

| 항목 | 가이드 | 우선순위 |
|------|--------|---------|
| **오프라인 지원** | 커스텀 오프라인 페이지 제공. 캐시된 데이터 즉시 표시, 백그라운드 동기화 | 필수 |
| **오프라인 기록** | 오프라인에서도 기록 가능 → IndexedDB/localStorage에 저장 → 온라인 복귀 시 자동 동기화 | 필수 |
| **동기화 상태 표시** | "저장됨" / "동기화 대기 중" / "동기화 완료" 상태를 사용자에게 명확히 | 필수 |
| **설치 프롬프트** | 적절한 시점에 "홈 화면에 추가" 안내. 첫 방문이 아닌 재방문 시 or 핵심 기능 사용 후 | 권장 |
| **앱 셸 아키텍처** | UI 프레임을 공격적으로 캐싱 → 재방문 시 1초 이하 로딩 | 권장 |
| **서비스 워커 캐싱 전략** | 정적 자산: Cache-first / API 응답: Network-first / 반복 데이터: Stale-while-revalidate | 필수 |
| **푸시 알림** | 기록 리마인더 (사용자 설정 시간). 과도한 알림은 삭제 사유 #1 | 선택 |
| **업데이트 알림** | 새 버전 사용 가능 시 비침투적 토스트로 안내 | 권장 |

**캐싱 전략 상세**:
- **Cache-first**: 변하지 않는 정적 자산 (이미지, 폰트, CSS)
- **Network-first**: API 응답, 동적 콘텐츠 (기록 데이터)
- **Stale-while-revalidate**: 사용자에게 즉시 캐시 표시 + 백그라운드 업데이트

---

### 4-3. 접근성 기본 (Accessibility Essentials)

| 항목 | 기준 | 수치 |
|------|------|------|
| **색상 대비 (일반 텍스트)** | WCAG AA | 4.5:1 이상 |
| **색상 대비 (큰 텍스트)** | WCAG AA | 3:1 이상 (18pt 이상 또는 14pt 볼드) |
| **색상 대비 (AAA)** | WCAG AAA | 7:1 이상 (일반), 4.5:1 이상 (큰 텍스트) |
| **UI 컴포넌트 대비** | WCAG 2.1 | 3:1 이상 (폼 테두리, 아이콘 등) |
| **최소 폰트 사이즈** | 본문 텍스트 | 16px 이상 (모바일) — iOS에서 16px 미만은 자동 줌 발생 |
| **터치 타겟** | WCAG 2.5.8 | 24×24 CSS px 최소 (권장 44-48px) |
| **색상만으로 정보 전달 금지** | WCAG 1.4.1 | 색맹 사용자를 위해 형태/텍스트 등 보조 단서 필수 |
| **포커스 인디케이터** | WCAG 2.4.7 | 키보드/스크린리더 사용자를 위한 명확한 포커스 스타일 |

**참고**: 색상 대비 위반은 웹 접근성 위반 1위 — WebAIM 2024 조사에서 전체 웹사이트의 83.6%에서 발견.

**Sauna Log 적용**:
- 따뜻한 톤의 컬러 팔레트 사용 시 흰 배경 위 밝은 오렌지 텍스트 등 대비 부족 주의
- 모든 입력 필드 최소 16px 폰트
- 이모지를 감성적 요소에 쓰되, 기능적 정보는 이모지+텍스트 병행
- 다크 모드 지원 시 양 모드에서 모두 대비 기준 충족 확인

---

### 4-4. 성능 체크리스트

| 항목 | 목표 |
|------|------|
| **First Contentful Paint (FCP)** | 1.8초 이하 |
| **Largest Contentful Paint (LCP)** | 2.5초 이하 |
| **Cumulative Layout Shift (CLS)** | 0.1 이하 |
| **Interaction to Next Paint (INP)** | 200ms 이하 |
| **Time to Interactive (TTI)** | 3.8초 이하 |
| **번들 사이즈** | 초기 JS 번들 200KB 이하 (gzip) |
| **이미지 최적화** | WebP/AVIF 포맷, lazy loading, 적절한 사이즈 |

---

## 5. 요약 Quick Reference

### 기록 플로우 설계 원칙

```
[사용자 의도] → [최소 탭] → [즉각 피드백] → [긍정적 마무리]
     │              │              │               │
  Hick's Law    Fitts's Law   Doherty        Peak-End
  (선택지 축소)  (큰 터치 타겟)  Threshold      Rule
                              (400ms 이내)    (축하!)
```

### 핵심 수치 요약

| 항목 | 수치 |
|------|------|
| 시스템 응답 시간 | < 400ms (Doherty Threshold) |
| 터치 타겟 최소 | 48 × 48 dp (Material Design) |
| 작업 기억 청크 | 7 ± 2개 (Miller's Law) |
| 색상 대비 최소 | 4.5:1 (WCAG AA) |
| 본문 폰트 최소 | 16px (모바일) |
| LCP 목표 | ≤ 2.5초 |
| 초기 JS 번들 | ≤ 200KB (gzip) |
| 네비게이션 탭 수 | 3~5개 (하단 탭) |

---

## 참고 출처 (Sources)

### UX Laws & Principles
- [Laws of UX](https://lawsofux.com/) — Jon Yablonski
- [NN/g: 3-Click Rule](https://www.nngroup.com/articles/3-click-rule/)
- [Clay: Laws of UX](https://clay.global/blog/laws-of-ux)
- [Toptal: Laws of UX Infographic](https://www.toptal.com/designers/ux/laws-of-ux-infographic)
- [Medium: 15 UI/UX Design Laws 2026 Guide](https://medium.com/@quartedesign/15-ui-ux-design-laws-with-examples-2026-guide-6927d0114204)

### Mobile & Touch Design
- [NN/g: Touch Target Size](https://www.nngroup.com/articles/touch-target-size/)
- [Smashing Magazine: Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- [Material Design: Touch Target](https://m2.material.io/develop/web/supporting/touch-target)
- [Medium: Thumb Zone UX in 2025](https://medium.com/design-bootcamp/the-thumb-zone-ux-in-2025-why-your-mobile-app-needs-to-rethink-ergonomics-now-9d1828f42bd9)
- [AppMySite: Bottom Navigation 2025 Guide](https://blog.appmysite.com/bottom-navigation-bar-in-mobile-apps-heres-all-you-need-to-know/)

### PWA Best Practices
- [MDN: PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [Lollypop: PWA UX Tips 2025](https://lollypop.design/blog/2025/september/progressive-web-app-ux-tips-2025/)
- [WireFuture: PWA Best Practices 2026](https://wirefuture.com/post/progressive-web-apps-pwa-best-practices-for-2026)

### Forms & Input Design
- [NN/g: Mobile Input Checklist](https://www.nngroup.com/articles/mobile-input-checklist/)
- [UXPin: Form Input Design](https://www.uxpin.com/studio/blog/form-input-design-best-practices/)
- [DesignStudioUIUX: Form UX 2026](https://www.designstudiouiux.com/blog/form-ux-design-best-practices/)

### Accessibility
- [W3C WCAG 2.1: Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM: Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [AllAccessible: Color Contrast 2025 Guide](https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025)
- [LogRocket: Accessible Touch Target Sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)

### Logging App UX
- [Koder: Minimalist Personal Logs](https://koder.ai/blog/create-mobile-app-minimalist-personal-logs)
- [Material Design: Data Visualization](https://m2.material.io/design/communication/data-visualization.html)
