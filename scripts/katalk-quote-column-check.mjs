#!/usr/bin/env node
/** READ-ONLY: 각 행 raw_quote의 라벨온도 ↔ 컬럼값 정합성 검사 (칸 오배치 탐지) */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const DIR=path.resolve(__dirname,'../docs/research/katalk-20260519');
function parseCsv(t){const rows=[];let f='',row=[],q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';}else if(c==='\r'){}else f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows.filter(r=>r.length>1);}
const rows=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=rows[0]; const I=Object.fromEntries(H.map((h,i)=>[h,i]));

// quote에서 라벨 온도 추출. 라벨 → 정규 컬럼.
// 건식/핀란드 → dry, 습식/스팀/쑥습 → steam, 냉탕/급냉/냉수 → cold, 온탕/메인탕/미온 → hot, 열탕/쑥탕/이벤트탕 → very_hot
const LBL=[
  ['dry', /(?:건식(?:\s*사우나)?|핀란드(?:식)?(?:\s*사우나)?)\s*(?:사우나)?\s*[:은는]?\s*(?:약\s*)?(\d{2,3}(?:\.\d)?)/],
  ['steam',/(?:습식(?:\s*사우나)?|스팀(?:\s*사우나)?)\s*(?:사우나)?\s*[:은는]?\s*(?:약\s*)?(\d{2,3}(?:\.\d)?)/],
  ['cold', /(?:냉탕|급냉탕|급랭탕)\s*(?:온도)?\s*[:은는]?\s*(?:약\s*)?(\d{1,2}(?:\.\d)?)/],
  ['hot',  /(?:온탕|메인탕)\s*(?:\d?)\s*[:은는(]?\s*(?:약\s*)?(\d{2}(?:\.\d)?)/],
  ['very_hot',/(?:열탕|쑥탕)\s*(?:\d?)\s*[:은는(]?\s*(?:약\s*)?(\d{2}(?:\.\d)?)/],
];
const COL={dry:'dry_temp_c',steam:'steam_temp_c',cold:'cold_bath_temp_c',hot:'hot_bath_temp_c',very_hot:'very_hot_bath_temp_c'};
function pt(v){if(!v||!v.trim())return null;const s=v.split('|')[0].replace(/[<>~]/g,'').trim();const m=s.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;}

const flags=[];
for(const r of rows.slice(1)){
  const quote=r[I.raw_quote]||'';
  for(const [field,re] of LBL){
    const m=quote.match(re);
    if(!m)continue;
    const qv=parseFloat(m[1]);
    const colVal=pt(r[I[COL[field]]]);
    // 이 라벨값이 정작 다른 컬럼에 들어가 있나?
    if(colVal!=null && Math.abs(colVal-qv)<0.6) continue; // 제자리 OK
    // 제자리 아님 → 다른 컬럼 어디에 qv가 있나 탐색
    let foundIn=null;
    for(const [f2,c2] of Object.entries(COL)){ if(f2===field)continue; const v2=pt(r[I[c2]]); if(v2!=null&&Math.abs(v2-qv)<0.6){foundIn=f2;break;} }
    if(foundIn) flags.push({rec:r[I.source_record],name:r[I.name],chunk:r[I.source_chunk],issue:`${field}=${qv} 인데 ${foundIn} 칸에 들어감`,quote:quote.slice(0,60)});
    else if(colVal==null) flags.push({rec:r[I.source_record],name:r[I.name],chunk:r[I.source_chunk],issue:`${field}=${qv}(quote) 인데 컬럼 비어있음(누락)`,quote:quote.slice(0,60)});
  }
}
const byChunk={};for(const f of flags)byChunk[f.chunk]=(byChunk[f.chunk]||0)+1;
console.log('칸 오배치/누락 의심:',flags.length,'| chunk별:',JSON.stringify(byChunk));
console.log('');
for(const f of flags) console.log(`[c${f.chunk}] rec${f.rec} ${f.name}: ${f.issue}`);
console.log('\n--- quote 발췌 ---');
for(const f of flags.filter(x=>x.issue.includes('칸에 들어감'))) console.log(`rec${f.rec}: "${f.quote}"`);
