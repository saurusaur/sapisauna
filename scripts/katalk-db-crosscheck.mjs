#!/usr/bin/env node
/**
 * katalk-db-crosscheck.mjs (READ-ONLY)
 * 통합 CSV(144 국내행) ↔ 라이브 places/place_sources 매칭.
 * 쓰기 없음. 산출물: docs/research/katalk-20260519/katalk-db-crosscheck-20260601.md
 *
 * 매칭 등급(보수적 — 16건 오매칭 재발 방지):
 *   MATCHED   : 정규화 이름 완전 일치
 *   AMBIGUOUS : 부분 포함 일치(한쪽이 다른쪽 포함, 길이>=3) → 유저 검토
 *   NEW       : 매칭 없음 → 신규 place 후보
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'docs/research/katalk-20260519');

// env
for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim();
}
const sb = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CSV 파서 (따옴표)
function parseCsv(text) {
  const rows = []; let f = '', row = [], q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
    else { if (c==='"') q=true; else if (c===',') {row.push(f);f='';} else if (c==='\n'){row.push(f);rows.push(row);row=[];f='';} else if (c==='\r'){} else f+=c; }
  }
  if (f.length||row.length){row.push(f);rows.push(row);}
  return rows.filter(r => r.length>1);
}

// 이름 정규화: 소문자, 공백/구두점 제거, 흔한 접미사 제거
const SUFFIX = ['사우나','온천','스파','목욕탕','찜질방','불한증막','한증막','호텔','리조트','랜드','센터'];
function norm(s) {
  let x = (s||'').toLowerCase().replace(/[\s·,()\[\]<>#&·.]/g,'');
  return x;
}
function normCore(s) {
  let x = norm(s);
  for (const suf of SUFFIX) x = x.split(norm(suf)).join('');
  return x;
}

const places = [];
{ // pull places + place_sources
  let from = 0; const pageSize = 1000;
  const pmap = new Map();
  while (true) {
    const { data, error } = await sb.from('places')
      .select('id,facility_type,bath_policy,country_code,city,latitude,longitude').range(from, from+pageSize-1);
    if (error) throw error; if (!data.length) break;
    for (const p of data) pmap.set(p.id, { ...p, names: [], addr: '' });
    from += pageSize; if (data.length < pageSize) break;
  }
  from = 0;
  while (true) {
    const { data, error } = await sb.from('place_sources')
      .select('place_id,name_original,address_original,source').range(from, from+pageSize-1);
    if (error) throw error; if (!data.length) break;
    for (const s of data) { const p = pmap.get(s.place_id); if (p) { if (s.name_original) p.names.push(s.name_original); if (s.address_original && !p.addr) p.addr = s.address_original; } }
    from += pageSize; if (data.length < pageSize) break;
  }
  for (const p of pmap.values()) places.push(p);
}

// DB 인덱스 (정규화 이름 → places[])
const exactIdx = new Map();   // norm(name) → [place]
const coreIdx = new Map();    // normCore(name) → [place]
for (const p of places) {
  for (const nm of p.names) {
    const e = norm(nm); if (e) { (exactIdx.get(e)||exactIdx.set(e,[]).get(e)).push(p); }
    const c = normCore(nm); if (c) { (coreIdx.get(c)||coreIdx.set(c,[]).get(c)).push(p); }
  }
}

// CSV 로드
const rows = parseCsv(fs.readFileSync(path.join(DIR, 'katalk-extract-20260519-flat.csv'), 'utf8'));
const H = rows[0]; const idx = Object.fromEntries(H.map((h,i)=>[h,i]));
const data = rows.slice(1);

// 중복 시설(같은 canonical/name) 묶기 → 고유 시설 단위 매칭
const facilities = new Map(); // key=canonical||name → {names:Set, rows:[], region}
for (const r of data) {
  const name = r[idx.name]; const canon = r[idx.canonical_name];
  const key = (canon && canon.trim()) ? canon.trim() : name.trim();
  if (!facilities.has(key)) facilities.set(key, { key, canon: canon?.trim()||'', names:new Set(), rows:[], region:r[idx.region] });
  const f = facilities.get(key); f.names.add(name); f.rows.push(r[idx.source_record]);
}

const result = { matched: [], ambiguous: [], neww: [] };
for (const f of facilities.values()) {
  const cands = [f.key, ...f.names];
  let hit = null, grade = null;
  // 1) exact
  for (const c of cands) { const e = norm(c); if (exactIdx.has(e)) { hit = exactIdx.get(e); grade='MATCHED'; break; } }
  // 2) core exact
  if (!hit) for (const c of cands) { const cc = normCore(c); if (cc.length>=2 && coreIdx.has(cc)) { hit = coreIdx.get(cc); grade='MATCHED'; break; } }
  // 3) substring (ambiguous)
  if (!hit) {
    const found = [];
    for (const c of cands) { const cc = normCore(c); if (cc.length<3) continue;
      for (const [k,ps] of coreIdx) { if (k.length<3) continue; if (k.includes(cc)||cc.includes(k)) { for (const p of ps) if(!found.includes(p)) found.push(p); } }
    }
    if (found.length) { hit = found; grade='AMBIGUOUS'; }
  }
  const dbNames = hit ? [...new Set(hit.flatMap(p=>p.names))].slice(0,3) : [];
  const dbTypes = hit ? [...new Set(hit.map(p=>p.facility_type))] : [];
  const entry = { key:f.key, canon:f.canon, csvNames:[...f.names], region:f.region, recs:f.rows, dbNames, dbTypes, dbCount: hit?hit.length:0 };
  if (grade==='MATCHED') result.matched.push(entry);
  else if (grade==='AMBIGUOUS') result.ambiguous.push(entry);
  else result.neww.push(entry);
}

// 리포트
const L = [];
L.push('# 카톡 ↔ DB 크로스체크 (2026-06-01)');
L.push('');
L.push(`입력: \`katalk-extract-20260519-flat.csv\` 144행 → 고유 시설 ${facilities.size}개`);
L.push(`DB: places ${places.length} · place_sources 이름 인덱스 ${exactIdx.size}`);
L.push('');
L.push(`| 등급 | 수 |`);
L.push(`|---|---|`);
L.push(`| ✅ MATCHED | ${result.matched.length} |`);
L.push(`| ⚠️ AMBIGUOUS (유저 검토) | ${result.ambiguous.length} |`);
L.push(`| 🆕 NEW (신규 후보) | ${result.neww.length} |`);
L.push('');
function tbl(title, arr, showDb) {
  L.push(`## ${title} (${arr.length})`); L.push('');
  L.push(showDb ? '| 카톡 시설 | canonical | DB 매칭명 | DB type | rec |' : '| 카톡 시설 | canonical | region | rec |');
  L.push(showDb ? '|---|---|---|---|---|' : '|---|---|---|---|');
  for (const e of arr.sort((a,b)=>a.key.localeCompare(b.key,'ko'))) {
    const csv = [...new Set(e.csvNames)].join(' / ');
    if (showDb) L.push(`| ${csv} | ${e.canon||'—'} | ${e.dbNames.join(' / ')||'?'}${e.dbCount>1?` (${e.dbCount}곳)`:''} | ${e.dbTypes.join(',')} | ${e.recs.slice(0,3).join(',')} |`);
    else L.push(`| ${csv} | ${e.canon||'—'} | ${e.region} | ${e.recs.slice(0,3).join(',')} |`);
  }
  L.push('');
}
tbl('⚠️ AMBIGUOUS — 유저 검토 필요', result.ambiguous, true);
tbl('🆕 NEW — 신규 place 후보', result.neww, false);
tbl('✅ MATCHED — enrich 후보', result.matched, true);

const outPath = path.join(DIR, 'katalk-db-crosscheck-20260601.md');
fs.writeFileSync(outPath, L.join('\n')+'\n');
console.log('WROTE', outPath);
console.log(`facilities:${facilities.size} matched:${result.matched.length} ambiguous:${result.ambiguous.length} new:${result.neww.length}`);
console.log('places:', places.length, '| name-index:', exactIdx.size);
