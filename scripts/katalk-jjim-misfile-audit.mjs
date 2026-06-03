#!/usr/bin/env node
/** katalk-jjim-misfile-audit.mjs (READ-ONLY)
 * 전체 어드민 로그: sauna_temp(건식칸)에 한증막/불가마 온도가 잘못 들어간 곳 탐지.
 * 신호: place가 bulgama/jjimjilbang 태그 보유 + dry-sauna 태그 없음 → sauna_temp는 jjim_temp여야.
 * CSV raw_quote 있으면 교차확인. 산출: katalk-jjim-misfile-audit-20260603.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
// places facilities/type/name
const pf={}; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,facility_type,facilities').range(f,f+999);if(!data?.length)break;for(const p of data)pf[p.id]=p;if(data.length<1000)break;}
const nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.place_id])nm[r.place_id]=r.name_original;if(data.length<1000)break;}
// 어드민 로그 sauna_temp 있는 것
const logs=[]; for(let f=0;;f+=1000){const{data}=await sb.from('logs').select('id,place_id,sauna_temp,jjim_temp,tribe_id').eq('user_id',ADMIN).range(f,f+999);if(!data?.length)break;logs.push(...data);if(data.length<1000)break;}
const withSauna=logs.filter(l=>l.sauna_temp!=null);
const KILN=['bulgama','jjimjilbang','salt-room','salt-sauna','hwangto','charcoal-kiln'];
const strong=[],maybe=[];
for(const l of withSauna){
  const p=pf[l.place_id]; if(!p)continue;
  const fac=p.facilities||[];
  const hasDry=fac.includes('dry-sauna');
  const kiln=fac.filter(x=>KILN.includes(x));
  if(kiln.length&&!hasDry) strong.push({l,p,kiln});
  else if(kiln.length&&hasDry) maybe.push({l,p,kiln});
}
const L=['# 한증막/불가마 온도가 건식칸(sauna_temp)에 잘못 들어갔는지 — 전체 어드민로그 감사 (2026-06-03)','',
 `어드민 로그 ${logs.length} / sauna_temp 보유 ${withSauna.length}`,'',
 `## 🔴 STRONG (불가마/찜질 태그O + 건식사우나 태그X) — sauna_temp가 한증막온도 의심: ${strong.length}`,
 '| 시설 | type | sauna_temp | jjim_temp | 보유 찜질태그 |','|---|---|---|---|---|'];
for(const s of strong)L.push(`| ${nm[s.l.place_id]||s.l.place_id.slice(0,8)} | ${s.p.facility_type} | ${s.l.sauna_temp} | ${s.l.jjim_temp??'∅'} | ${s.kiln.join(',')} |`);
L.push('',`## 🟡 MAYBE (건식·불가마 둘 다 태그O) — 원문확인 필요: ${maybe.length}`,
 '| 시설 | type | sauna_temp | jjim_temp | 태그 |','|---|---|---|---|---|');
for(const s of maybe)L.push(`| ${nm[s.l.place_id]||s.l.place_id.slice(0,8)} | ${s.p.facility_type} | ${s.l.sauna_temp} | ${s.l.jjim_temp??'∅'} | ${s.kiln.join(',')} |`);
fs.writeFileSync(path.join(DIR,'katalk-jjim-misfile-audit-20260603.md'),L.join('\n'));
console.log(`sauna_temp 보유 ${withSauna.length} → STRONG ${strong.length} / MAYBE ${maybe.length}`);
