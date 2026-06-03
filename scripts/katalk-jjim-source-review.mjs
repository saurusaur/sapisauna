#!/usr/bin/env node
/** katalk-jjim-source-review.mjs (READ-ONLY)
 * STRONG 4 + sauna_temp>=90 의심 시설을 DB·Notion(seed memo)·카톡 raw 3중 대조.
 * sauna_temp가 건식인지 불가마/한증막인지 출처 원문으로 판별 근거 제공.
 * 산출: katalk-jjim-source-review-20260603.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
// DB
const pf={},nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,facility_type,facilities').range(f,f+999);if(!data?.length)break;for(const p of data)pf[p.id]=p;if(data.length<1000)break;}
for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.place_id])nm[r.place_id]=r.name_original;if(data.length<1000)break;}
const logs=[]; for(let f=0;;f+=1000){const{data}=await sb.from('logs').select('id,place_id,sauna_temp,jjim_temp').eq('user_id',ADMIN).range(f,f+999);if(!data?.length)break;logs.push(...data);if(data.length<1000)break;}
const lids=logs.map(l=>l.id),memoBy={};
for(let i=0;i<lids.length;i+=200){const{data:dl}=await sb.from('deep_logs').select('log_id,memo').in('log_id',lids.slice(i,i+200));for(const d of(dl||[]))memoBy[d.log_id]=d.memo;}
// Notion seed
const seed=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/seed-data-unified.json'),'utf8'));
const norm=s=>(s||'').replace(/[\s()·\-.]/g,'').toLowerCase();
const seedBy={}; for(const s of seed){seedBy[norm(s.name)]=s; if(s.name_alias)for(const a of [].concat(s.name_alias))seedBy[norm(a)]=s;}
// 카톡 CSV raw by canonical
function parseCsv(t){const rows=[];let i=0,f='',row=[],q=false;while(i<t.length){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c=='"')q=true;else if(c==','){row.push(f);f='';}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);if(row.some(x=>x!==''))rows.push(row);row=[];f='';}else f+=c;}i++;}if(f!==''||row.length){row.push(f);rows.push(row);}return rows;}
const csv=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const CH=csv[0],CIx=Object.fromEntries(CH.map((h,i)=>[h,i]));
const csvBy={}; for(const r of csv.slice(1)){const k=norm(r[CIx.canonical_name]||r[CIx.name]);(csvBy[k]=csvBy[k]||[]).push(r);}
// 대상: STRONG 4 (이름) + sauna_temp>=90
const STRONG=new Set(['우이령불가마주쉼사우나','아쿠아필드 하남','신북온천 리조트'].map(norm));
const KILN=['bulgama','jjimjilbang','salt-sauna','salt-room'];
const targets=[];
for(const l of logs){if(l.sauna_temp==null)continue;const p=pf[l.place_id];if(!p)continue;const name=nm[l.place_id]||'';
  const hasKiln=(p.facilities||[]).some(x=>KILN.includes(x));
  if((l.sauna_temp>=90&&hasKiln)||STRONG.has(norm(name)))targets.push({l,p,name});}
const L=['# jjim 오기입 출처 검토 — DB·Notion·카톡 3중 대조 (2026-06-03)','',
 `대상 ${targets.length}건 (STRONG 4 + sauna_temp≥90 & 찜질태그).`,'',
 '판별: memo/raw에 sauna_temp값이 "불가마/한증막/숯가마/소금"으로 명시 → 🔴jjim오기입 / "건식/핀란드"로 명시 → ⚪정상 / 불명 → ❓','',
 '| 시설 | type | sauna_temp | DB memo발췌 | Notion seed memo발췌 | 카톡 raw발췌 | 판별 |','|---|---|---|---|---|---|---|'];
function verdict(temp,texts){
  const T=texts.join(' ');
  const re=new RegExp(`(불가마|한증막|숯가마|소금|황토|맥반석)[^0-9]{0,8}${temp}|${temp}\\s*도?[^0-9]{0,6}(불가마|한증막|숯가마|소금|황토|맥반석)`);
  const reDry=new RegExp(`(건식|핀란드|로울리|로일리)[^0-9]{0,8}${temp}|${temp}\\s*도?[^0-9]{0,6}(건식|핀란드)`);
  if(re.test(T))return'🔴jjim오기입';
  if(reDry.test(T))return'⚪건식정상';
  // 키워드만 있고 온도 직접연결 안돼도 힌트
  if(/불가마|한증막|숯가마/.test(T)&&!/건식|핀란드/.test(T))return'🟠불가마only(건식언급X)';
  return'❓불명';
}
for(const t of targets){
  const dbMemo=memoBy[t.l.id]||'';
  const s=seedBy[norm(t.name)]; const sMemo=s?.memo||'';
  const craw=(csvBy[norm(t.name)]||[]).map(r=>r[CIx.raw_quote]).join(' / ');
  const v=verdict(t.l.sauna_temp,[dbMemo,sMemo,craw]);
  L.push(`| ${t.name} | ${t.p.facility_type} | ${t.l.sauna_temp} | ${dbMemo.slice(0,40)||'·'} | ${sMemo.slice(0,55)||'·'} | ${craw.slice(0,45)||'·'} | ${v} |`);
}
fs.writeFileSync(path.join(DIR,'katalk-jjim-source-review-20260603.md'),L.join('\n'));
console.log('WROTE source-review. targets:',targets.length);
