#!/usr/bin/env node
/**
 * 먼데이사우나 카톡 토픽/키워드 빈도 분석 (v2 — 7분류)
 * - 입퇴장·미디어·시스템 라인 제거 후 실발화만 대상
 * - '리뷰'를 단순(다녀왔어요) vs 시설·온도 상세로 분리 (상호배타)
 * - 그 외 카테고리는 키워드 매칭(중복 매칭 가능)
 * - 카테고리별 예시 5건 추출
 */
import fs from "node:fs";

const CSV = "docs/research/katalk-20260519/KakaoTalk_Chat_먼데이사우나 mondaysauna 함께만드는사우나♨️_2026-05-19-01-25-20.csv";

function parseCSV(text) {
  const rows = []; let f = "", row = [], q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else { if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c === "\r") {} else f += c; }
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows;
}

const raw = fs.readFileSync(CSV, "utf8").replace(/^﻿/, "");
const rows = parseCSV(raw); rows.shift();
const MEDIA = new Set(["사진", "이모티콘", "동영상", "음성메시지", "삭제된 메시지입니다."]);
const sys = (m) => /joined this chatroom|left this chatroom|invited |removed from this chatroom/.test(m);
const msgs = [];
for (const r of rows) { const m = (r[2] || "").trim(); if (!m || MEDIA.has(m) || sys(m)) continue; msgs.push(m); }

// --- 판정 헬퍼 ---
const TEMP = /(?<!\d)\d{1,3}\s*도(?!\s*(안|모르|없|몰|이해))|(\d{1,3})\s*[°℃]/; // 91도 / 9°C, "1도 안다" 슬랭 제외
const FACILITY = ["건식", "습식", "냉탕", "온탕", "열탕", "노천", "외기욕", "수질", "한증막", "불가마", "소금", "청결", "수면실", "휴게", "급냉", "바데풀", "고온", "사우나실", "이벤트탕"];
const facHits = (m) => FACILITY.filter((k) => m.includes(k)).length;
const REVIEW_VERB = /다녀왔|다녀옴|다녀온|다녀와|가봤|갔다왔|갔다옴|와봤|방문|들렀|후기|리뷰|이용했|이용해봤/;

// --- 키워드 사전 (리뷰 2종은 함수로 별도 판정) ---
const KW = {
  "사우나 추천": ["추천", "어디가 좋", "어디 좋", "갈만", "가볼만", "어디 갈", "어디로", "괜찮은 곳", "좋은 곳", "갈까요", "어디 가", "어디있", "어디 있", "있을까요", "어디가나", "어디가세", "추천좀", "추천 좀", "어디가요"],
  "경험담(스토리/매너/문화)": ["처음", "입문", "첫 사우나", "첫사우나", "인생", "신세계", "황홀", "개운", "힐링", "감동", "행복", "좋았", "지렸", "미쳤", "매너", "에티켓", "타투", "문신", "눈치", "민폐", "예의", "노매너", "촬영", "사진 찍", "문화", "혼탕", "혼욕", "규칙", "금지"],
  "가격 팁": ["입장료", "입욕료", "얼마에", "얼마예", "얼마인", "얼마나 하", "얼마 정도", "할인", "쿠폰", "멤버십", "정기권", "회원권", "가성비", "비싸", "저렴", "요금", "가격", "유료", "무료입장", "공짜"],
  "사우나 용품": ["용품", "가운", "타올", "타월", "수건", "슬리퍼", "세신타올", "때수건", "샴푸", "바디", "보디", "사우나햇", "사우나 햇", "쿨러", "텀블러", "물통", "로션", "스킨", "화장품", "브랜드", "어디서 사", "어디서 구매", "제품 추천", "용품 추천", "비누", "면도", "방석", "모자"],
  "사우나 루틴": ["루틴", "냉온", "토토노", "외기욕", "반신욕", "몇분", "몇 분", "몇세트", "몇 세트", "몇 번 들어", "회차", "인터벌", "냉탕 몇", "사우나 몇 분", "몇 도까지", "들어갔다 나"],
};

const CATS = ["단순 다녀왔어요 리뷰", "시설·온도 상세 리뷰", ...Object.keys(KW)];
const totals = {}, qTotals = {}, examples = {};
for (const k of CATS) { totals[k] = 0; qTotals[k] = 0; examples[k] = []; }

const push = (cat, m, isQ) => {
  totals[cat]++; if (isQ) qTotals[cat]++;
  if (examples[cat].length < 25 && m.length > 14 && m.length < 160 && !/^https?:/.test(m)) examples[cat].push(m.replace(/\n/g, " "));
};

let qCount = 0;
for (const m of msgs) {
  const isQ = m.includes("?");
  if (isQ) qCount++;

  // 리뷰 2종 (상호배타): 온도 수치 or 시설키워드≥2 → 상세, 그 외 방문동사 → 단순
  const detailed = TEMP.test(m) || facHits(m) >= 2;
  if (detailed && (REVIEW_VERB.test(m) || facHits(m) >= 2 || TEMP.test(m))) {
    push("시설·온도 상세 리뷰", m, isQ);
  } else if (REVIEW_VERB.test(m)) {
    push("단순 다녀왔어요 리뷰", m, isQ);
  }

  // 나머지 키워드 카테고리 (중복 매칭)
  for (const [cat, kws] of Object.entries(KW)) {
    if (kws.some((kw) => m.includes(kw))) push(cat, m, isQ);
  }
}

console.log(`총 발화(노이즈 제거): ${msgs.length} / 물음표 포함: ${qCount}\n`);
console.log("카테고리\t전체\t질문성\t발화대비%");
const order = ["사우나 추천", "시설·온도 상세 리뷰", "단순 다녀왔어요 리뷰", "경험담(스토리/매너/문화)", "가격 팁", "사우나 용품", "사우나 루틴"];
for (const k of order) console.log(`${k}\t${totals[k]}\t${qTotals[k]}\t${(totals[k] / msgs.length * 100).toFixed(1)}%`);

let ex = "# 카테고리별 후보 발화 (각 최대 25건 — 큐레이션용)\n\n";
for (const k of order) {
  ex += `## ${k} — 전체 ${totals[k]} / 질문성 ${qTotals[k]}\n`;
  for (const e of examples[k]) ex += `- ${e}\n`;
  ex += "\n";
}
fs.writeFileSync("docs/research/katalk-20260519/topic-analysis-candidates.md", ex);
console.log("\n후보 → docs/research/katalk-20260519/topic-analysis-candidates.md");
