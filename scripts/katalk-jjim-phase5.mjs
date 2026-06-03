#!/usr/bin/env node
/** katalk-jjim-phase5.mjs (READ-ONLY 분류)
 * sauna_temp + 불가마/찜질태그 보유 어드민로그를, Notion(notion-review-db-analysis.md) 사우나종류로 분류.
 * 건식사우나 있음→KEEP(정당) / 한증막·불가마·숯가마만(건식 없음)→CONVERT(jjim) / 불명.
 * 산출: katalk-jjim-phase5-20260604.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
// Notion 블록 파싱: name → {사우나, 온도}
const md=fs.readFileSync(path.join(ROOT,'docs/research/notion-review-db-analysis.md'),'utf8').split('\n');
const N={}; let cur=null;
for(const l of md){const h=l.match(/^####\s+(.+)$/);if(h){cur=h[1].trim();N[cur]={};continue;}
  if(cur){const s=l.match(/\*\*사우나\*\*:\s*(.+)/);if(s)N[cur].sauna=s[1];const t=l.match(/\*\*온도\*\*:\s*(.+)/);if(t)N[cur].temp=t[1];}}
const norm=s=>(s||'').replace(/[\s()·]/g,'').toLowerCase();
const Nidx={}; for(const k in N)Nidx[norm(k)]=k;
function findNotion(name){const n=norm(name);if(Nidx[n])return N[Nidx[n]];for(const k in Nidx){if(k.includes(n)||n.includes(k))return N[Nidx[k]];}return null;}
// 후보: sauna_temp + kiln 태그
const pf={},nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,facility_type,facilities').range(f,f+999);if(!data?.length)break;for(const p of data)pf[p.id]=p;if(data.length<1000)break;}
for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.place_id])nm[r.place_id]=r.name_original;if(data.length<1000)break;}
const logs=[]; for(let f=0;;f+=1000){const{data}=await sb.from('logs').select('place_id,sauna_temp,jjim_temp').eq('user_id',ADMIN).range(f,f+999);if(!data?.length)break;logs.push(...data);if(data.length<1000)break;}
const KILN=['bulgama','jjimjilbang','salt-sauna'];
const out=['# jjim Phase5 — sauna_temp 미파일 분류 (Notion 사우나종류 기준) 2026-06-04','',
 '건식사우나 있음→KEEP / 한증막·불가마·숯가마만→CONVERT(jjim) / Notion없음→불명(카톡/보류)','',
 '| 시설 | type | sauna_temp | Notion 사우나 | Notion 온도 | 판정 |','|---|---|---|---|---|---|'];
const conv=[],keep=[],unk=[];
for(const l of logs){if(l.sauna_temp==null)continue;const p=pf[l.place_id];if(!p)continue;
  const fac=p.facilities||[];if(!fac.some(t=>KILN.includes(t))||fac.includes('dry-sauna'))continue; // 건식태그 이미 있으면 제외(정당)
  const name=nm[l.place_id]||l.place_id.slice(0,8);
  const nb=findNotion(name);
  let verdict;
  if(nb?.sauna){ verdict = /건식/.test(nb.sauna)?'KEEP(건식있음)' : '🔴CONVERT(건식없음)'; }
  else verdict='❓Notion없음';
  if(verdict.includes('CONVERT'))conv.push({name,pid:l.place_id,sauna:l.sauna_temp,nb});
  else if(verdict.includes('KEEP'))keep.push(name); else unk.push(name);
  out.push(`| ${name} | ${p.facility_type} | ${l.sauna_temp} | ${nb?.sauna||'—'} | ${nb?.temp||'—'} | ${verdict} |`);
}
out.push('',`CONVERT ${conv.length} / KEEP ${keep.length} / 불명 ${unk.length}`);
fs.writeFileSync(path.join(DIR,'katalk-jjim-phase5-20260604.md'),out.join('\n'));
console.log(out.join('\n'));
