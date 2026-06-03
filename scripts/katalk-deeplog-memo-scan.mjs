#!/usr/bin/env node
/** katalk-deeplog-memo-scan.mjs (READ-ONLY)
 * 어드민 deep_log.memo 중 'facility 토큰 문자열'(prose 아님) 검출 → place facilities와 대조.
 * memo가 facilities로 가야 했던 건지, 이미 반영됐는지 확인. 산출: katalk-deeplog-memo-scan-20260604.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
// 구→신 태그 매핑
const RENAME={'wet-sauna':'steam-sauna'};
const VALID=new Set('hot-bath very-hot-bath dry-sauna steam-sauna wet-sauna bulgama salt-sauna cold-bath ice-bath ice-room outdoor-rest indoor-rest open-air-bath jjimjilbang aufguss self-loyly scrub massage dryer-free dryer-paid towel shampoo-bodywash tattoo-friendly tattoo-cover workspace food sleep-room parking'.split(' '));
const nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.place_id])nm[r.place_id]=r.name_original;if(data.length<1000)break;}
const pf={}; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,facilities').range(f,f+999);if(!data?.length)break;for(const p of data)pf[p.id]=p.facilities||[];if(data.length<1000)break;}
// 어드민 로그 + deep memo
const logs=[]; for(let f=0;;f+=1000){const{data}=await sb.from('logs').select('id,place_id').eq('user_id',ADMIN).range(f,f+999);if(!data?.length)break;logs.push(...data);if(data.length<1000)break;}
const logPid={}; for(const l of logs)logPid[l.id]=l.place_id;
const ids=logs.map(l=>l.id); const deeps=[];
for(let i=0;i<ids.length;i+=200){const{data}=await sb.from('deep_logs').select('id,log_id,memo').in('log_id',ids.slice(i,i+200));deeps.push(...(data||[]));}
// memo가 facility 토큰 문자열인가? (토큰만 |/, 로 나열, prose 아님)
function isFacMemo(memo){if(!memo)return false;
  const parts=memo.replace(/"/g,'').split(/[|,]/).map(s=>s.trim()).filter(Boolean);
  if(!parts.length)return false;
  const facLike=parts.filter(p=>VALID.has(p)||VALID.has(p.replace(/^"+/,'')));
  return facLike.length>=1 && facLike.length>=parts.length*0.6; // 60%+가 facility 토큰
}
const out=['# deep_log memo 손상 스캔 (facility 토큰이 memo에 들어간 것) 2026-06-04','',
 '| place | memo(원문) | memo토큰 | place facilities 반영? | 누락토큰 |','|---|---|---|---|---|'];
let n=0,missingTotal=new Set();
for(const d of deeps){if(!isFacMemo(d.memo))continue;n++;
  const pid=logPid[d.log_id];const name=nm[pid]||pid?.slice(0,8);const fac=pf[pid]||[];
  const toks=d.memo.replace(/"/g,'').split(/[|,]/).map(s=>RENAME[s.trim()]||s.trim()).filter(t=>VALID.has(t)||t==='steam-sauna');
  const missing=toks.filter(t=>!fac.includes(t));
  if(missing.length)missing.forEach(m=>missingTotal.add(name+':'+m));
  out.push(`| ${name} | ${JSON.stringify(d.memo)} | ${toks.join(',')} | ${missing.length?'❌일부누락':'✅반영됨'} | ${missing.join(',')||'-'} |`);
}
out.push('',`facility-토큰 memo: ${n}건 / 누락(facilities 미반영) 토큰: ${missingTotal.size}`);
fs.writeFileSync(path.join(DIR,'katalk-deeplog-memo-scan-20260604.md'),out.join('\n'));
console.log(out.join('\n'));
