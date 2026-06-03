#!/usr/bin/env node
/**
 * katalk-merge-flat.mjs
 * 5개 chunk flat CSV → 단일 통합 CSV (국내 only).
 *
 * 배경: chunk-2(13열, very_hot 누락) / chunk-4(컬럼 시프트 + 마지막열이 신뢰도)가
 *       규격을 어겨, 원출추출 MD(section C / D-1)의 권위 온도로 재정규화한다.
 *       chunk-1/3/5는 14열 규격이라 그대로 사용(일부 열탕 누락은 raw_quote에 원문 보존됨).
 *
 * 출력 컬럼(15):
 *   name, region, dry_temp_c, steam_temp_c, cold_bath_temp_c,
 *   hot_bath_temp_c, very_hot_bath_temp_c, facilities,
 *   scrub_cost_krw, entrance_cost_krw, source_chunk, source_record,
 *   raw_quote, notes, canonical_name
 *
 * canonical_name: 그룹 A/B alias→정식명 매핑(명확한 것만). 모호/미정은 "".
 * 해외 행은 OVERSEAS_EXCLUDE로 제외(해외는 overseas-facilities-review.md에서 별도 관리).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, '../docs/research/katalk-20260519');

// ── 간단 CSV 파서/직렬화 (따옴표·콤마 처리) ──
function parseCsv(text) {
  const rows = [];
  let field = '', row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}
const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

// ── chunk-2 온도 override (행 인덱스 0-27, 원출추출 chunk2.md §C) ──
// [dry, steam, cold, hot, very_hot]
const C2 = {
  1: ['93', '56', '19', '', ''],
  2: ['90', '50', '', '39', '41'],
  3: ['100', '', '', '', ''],
  4: ['', '', '18', '38.7', '42-43'],
  5: ['80', '', '22', '39', ''],
  6: ['', '', '', '', ''],            // 노천탕 42 → notes
  7: ['65', '', '19', '38', '41'],
  8: ['', '', '18', '37', '40'],      // 노천 34 → notes
  9: ['85', '', '23-24', '', ''],
  10: ['70-85', '50', '20', '40', '43'],
  11: ['65', '38', '24', '', ''],
  12: ['', '', '21', '40', '43'],
  13: ['', '', '21-22', '', ''],
  14: ['', '', '', '40.2', ''],       // 히노끼 37 → notes
  15: ['77.6', '', '23.7', '41.5', ''],
  16: ['', '', '19', '39', ''],       // 건식 사진참고 미기재
  17: ['', '', '', '', '43'],
  18: ['', '', '5', '', ''],
  19: ['', '', '', '38-39', ''],
  20: ['', '', '13', '41', '43'],
  21: ['85', '', '18', '39', ''],
  22: ['80', '', '23', '39', '42'],   // 자쿠지 36 → notes
  23: ['67', '', '19', '39', ''],     // 노천 38-39 → notes
  24: ['72', '', '18', '39', ''],     // 탕 18/30/39
  25: ['70', '', '', '', ''],
  26: ['75', '', '', '', ''],
  27: ['70', '', '', '', ''],
  // 0(쿠알라룸푸르=말레이시아)은 OVERSEAS_EXCLUDE
};

// ── chunk-4 온도 override (행 인덱스 0-32, 원출추출 chunk4.md §D-1/§C) ──
const C4 = {
  0: ['75', '', '19', '', '41'],      // 오레브: 건식75 냉19 열탕41 노천41
  1: ['', '', '16.5-17', '', ''],     // 프리마 냉탕
  2: ['95', '', '15', '42', '44'],
  3: ['93', '66', '21', '42', '44'],  // 파주강남24시
  4: ['', '', '', '', ''],            // 네이처스파 노천 42 → notes
  5: ['', '', '', '', ''],            // 휘경인삼 없음
  6: ['', '', '', '', ''],            // 올림픽선수촌 없음
  7: ['', '', '', '', ''],            // 실로암 없음
  8: ['86', '55-56', '22-23', '38', '43-44'],
  9: ['', '', '23', '', ''],          // 레몬: 그룹C 단일값 23
  10: ['', '', '', '', ''],           // 해미안 없음
  11: ['88', '53', '18', '40', '43'],
  12: ['75', '51', '19', '38', '42'],
  13: ['79', '74', '12', '38', '42'],
  14: ['70', '60', '16', '39', '42'],
  15: ['', '', '', '', ''],           // 강릉소금강 없음
  // 16(홍콩 리젠트)은 OVERSEAS_EXCLUDE
  17: ['81', '', '22', '39', '41'],
  18: ['85', '', '21', '', '42'],
  19: ['', '', '', '41-43', ''],      // 수안보 온천 41-43
  20: ['', '45', '25', '41', ''],     // 하남스타필드(여탕): 건식없음, 탄산35.5/노천39.5 → notes
  21: ['90', '53', '20', '40', '44'],
  22: ['110', '', '', '41', '44'],    // 기린: 건식 표기110/체감90 → notes
  23: ['85-90', '', '', '', ''],      // 홈스파월드: 노천70 초고온85-90 → notes
  // 24(토토켄)은 OVERSEAS_EXCLUDE
  25: ['71', '', '22', '40', ''],
  26: ['', '', '4.5', '', ''],        // 강변스파랜드 체감 4-5
  27: ['', '', '', '', ''],           // 청구역동궁 없음
  28: ['', '', '', '', ''],           // 신사스파레이 enzyme
  29: ['', '', '', '', ''],           // 수원효소 없음
  30: ['79', '', '22', '39', '42'],
  31: ['', '', '', '', ''],           // 부산송도해수랑 없음
  32: ['', '', '', '', ''],           // 황금스파 없음
};

// ── chunk-1/3/5 칸밀림 교정 (raw_quote↔컬럼 대조로 발견, 2026-06-02) ──
// 추출 시 건식↔습식 / 온탕↔열탕이 한 칸씩 밀린 행. record 기준 override(제공 필드만 교체, ''=비움).
const FIX135 = {
  '735':  { dry:'100', steam:'' },           // 프리마(마포): "건식 100도" → steam에 잘못 들어감
  '1173': { dry:'100', steam:'' },           // 프리마(부산=호텔프리마): "100도 건식" → steam에 잘못 들어감
  '1225': { dry:'80', steam:'' },            // 솔로레포 노량진: 핀란드 로울리 80도(건식) → steam에 잘못 들어감
  '792':  { dry:'76', steam:'58', hot:'40', vh:'44' }, // 마포365: 건식76/습식58/온탕40/열탕44
  '10144':{ steam:'91-94' },                  // 무한사우나: "건식/습식 91-94" 둘 다 → 습식 보강
  '1123': { dry:'75', steam:'54', vh:'' },   // 경주 소노캄: 건식75/습식54 (steam·vh로 밀림)
  '1999': { dry:'98', steam:'80', vh:'43' }, // 아트리파라다이스: 건식98/습식80/열탕43
  '2032': { cold:'', steam:'' },             // 레몬(분당): "온탕40 안되는듯"·계기판104 무효 → 비움
  '4679': { vh:'41.8' },                      // 노다지: 쑥탕41.8 누락 보강
  '9462': { hot:'42', vh:'43' },             // 스파레이: 온탕42/이벤트탕43 (vh로 밀림)
  // 2026-06-03 전수감사(colshift-audit)로 추가 발견 — 둘 다 "건식 70도"가 습식칸으로 밀림
  '1664': { dry:'70', steam:'' },            // 부산 국제온천(=국제광천수온천): "건식사우나 온도 70도"
  '1908': { dry:'70', steam:'' },            // 남해 쏠비치: "건식 사우나 온도가 70도"
};

// ── 해외 제외 (chunk, rowIndex) ──
const OVERSEAS = new Set(['1:21', '2:0', '3:13', '4:16', '4:24', '5:8']);
// 1:21 카마타온센(rec32) / 2:0 쿠알라룸푸르 / 3:13 아리마타이코노유 / 4:16 홍콩리젠트 / 4:24 토토켄 / 5:8 Recharged(다낭)

// ── 그룹 A/B alias → 정식명 (명확한 것만; 모호한 부산 프리마 등은 제외) ──
const CANON = new Map([
  ['프리마', '프리마스파'],            // ※ 부산 해운대 프리마(c1 rec1173)는 AMBIG로 별도 처리
  ['프리마스파', '프리마스파'],
  ['청담프리마', '프리마스파'],
  ['청담 프리마스파', '프리마스파'],
  ['우리유황', '우리유황온천'],
  ['우리유황온천', '우리유황온천'],
  ['현남 더앤리조트온천', '더앤리조트 스파'],
  ['양양 더앤온천', '더앤리조트 스파'],
  ['안토', '안토'],
  ['안토 사우나', '안토'],
  ['노다지', '프라임노다지사우나'],
  ['광진구 프라임 노다지', '프라임노다지사우나'],
  ['쉐레이 사우나', '쉐레이암반수사우나'],
  ['구기동 쉐레이 사우나', '쉐레이암반수사우나'],
  ['스파앳홈 인천공항2터미널점', '스파앳홈 T2 인천공항 제2터미널점'],
  ['#파주강남24시', '강남24시사우나'],
  ['송해원', '송도해수온천 송해온'],
  ['아늑 시그니처 호텔 구로 루프 사우나', '아늑 시그니처 서울 구로 루프 사우나'],
  ['웨스틴 조선', '웨스틴 조선 서울'],
  ['웨스틴서울 파르나스', '웨스틴 서울 파르나스'],
  ['해미안 해수사우나', '해미안녹차해수사우나'],
  ['아쿠아필드 하남', '아쿠아필드 하남'],
  ['하남 스타필드 스파', '아쿠아필드 하남'],   // 그룹C: 동일 시설 병합
]);
// 부산 프리마(c1 rec1173, 부산,해운대) = 청담 프리마스파와 별개 시설.
//   청담 프리마스파 = 대중목욕탕(public-bath), 부산 호텔 프리마 = 호텔스파(hotel-spa).
const PRIMA_BUSAN_KEY = '1:7';
const PRIMA_BUSAN_CANON = '호텔 프리마 부산';

function loadChunk(n) {
  const p = path.join(DIR, `katalk-chunk-${n}-flat.csv`);
  return parseCsv(fs.readFileSync(p, 'utf8'));
}

const HEADER = ['name','region','dry_temp_c','steam_temp_c','cold_bath_temp_c',
  'hot_bath_temp_c','very_hot_bath_temp_c','facilities','scrub_cost_krw',
  'entrance_cost_krw','source_chunk','source_record','raw_quote','notes','canonical_name'];

const out = [HEADER];
const report = { perChunk: {}, overseasExcluded: [], ambig: [], canonMapped: 0, total: 0 };

for (const n of [1, 2, 3, 4, 5]) {
  const rows = loadChunk(n);
  report.perChunk[n] = { read: rows.length, kept: 0 };
  rows.forEach((r, idx) => {
    const key = `${n}:${idx}`;
    if (OVERSEAS.has(key)) { report.overseasExcluded.push(`${key} ${r[0]}`); return; }

    let name, region, dry, steam, cold, hot, vh, facilities, scrub, entrance, srcChunk, srcRec, quote, notes;

    if (n === 2) {
      // chunk2: 13열 [name,region,dry,steam,cold,hot,fac,scrub,entr,chunk,rec,quote,notes]
      [name, region, , , , , facilities, scrub, entrance, srcChunk, srcRec, quote, notes] = r;
      const ov = C2[idx] || ['', '', '', '', ''];
      [dry, steam, cold, hot, vh] = ov;
    } else if (n === 4) {
      // chunk4: 14열이나 마지막열=신뢰도. [name,region,t2,t3,t4,t5,t6,fac,scrub,entr,chunk,rec,quote,conf]
      const conf = r[13];
      [name, region, , , , , , facilities, scrub, entrance, srcChunk, srcRec, quote] = r;
      const ov = C4[idx] || ['', '', '', '', ''];
      [dry, steam, cold, hot, vh] = ov;
      notes = conf ? `[${conf}]` : '';
    } else {
      // chunk1/3/5: 14열 규격 그대로
      [name, region, dry, steam, cold, hot, vh, facilities, scrub, entrance, srcChunk, srcRec, quote, notes] = r;
    }

    // canonical_name 매핑
    let canon = CANON.get((name || '').trim()) || '';
    if (key === PRIMA_BUSAN_KEY) { canon = PRIMA_BUSAN_CANON; notes = (notes ? notes + ' ' : '') + '[facility_type=hotel-spa, 청담 프리마스파와 별개]'; }
    if (canon) report.canonMapped++;

    // source_record 정규화: "record 1173" → "1173", "수기 11070+" 등은 유지
    const recNorm = (srcRec || '').replace(/^record\s+/, '').trim();

    // chunk-1/3/5 칸밀림 교정 적용 (chunk2/4는 이미 위에서 override됨)
    const fx = FIX135[recNorm];
    if (fx) { if ('dry' in fx) dry = fx.dry; if ('steam' in fx) steam = fx.steam; if ('cold' in fx) cold = fx.cold; if ('hot' in fx) hot = fx.hot; if ('vh' in fx) vh = fx.vh; }

    out.push([name, region, dry, steam, cold, hot, vh, facilities, scrub, entrance,
      srcChunk || String(n), recNorm, quote, notes, canon]);
    report.perChunk[n].kept++;
    report.total++;
  });
}

const csv = out.map(r => r.map(esc).join(',')).join('\n') + '\n';
const outPath = path.join(DIR, 'katalk-extract-20260519-flat.csv');
fs.writeFileSync(outPath, csv);

console.log('WROTE', outPath);
console.log('total domestic rows:', report.total);
console.log('per chunk:', JSON.stringify(report.perChunk));
console.log('overseas excluded:', report.overseasExcluded.length, '→', report.overseasExcluded.join(' | '));
console.log('canonical_name mapped:', report.canonMapped);
console.log('ambig:', report.ambig.join(' | '));
