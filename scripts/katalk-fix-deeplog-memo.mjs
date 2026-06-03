#!/usr/bin/env node
/** deep_log memo의 facility-토큰 문자열 정리: 누락분 facilities 합집합 추가 후 memo=null. 기본 dry-run, --apply */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const APPLY=process.argv.includes('--apply');
const RENAME={'wet-sauna':'steam-sauna'};
const VALID=new Set('hot-bath very-hot-bath dry-sauna steam-sauna wet-sauna bulgama salt-sauna cold-bath ice-bath ice-room outdoor-rest indoor-rest open-air-bath jjimjilbang aufguss self-loyly scrub massage dryer-free dryer-paid towel shampoo-bodywash tattoo-friendly tattoo-cover workspace food sleep-room parking'.split(' '));
const pf={}; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,facilities').range(f,f+999);if(!data?.length)break;for(const p of data)pf[p.id]=p.facilities||[];if(data.length<1000)break;}
const nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.place_id])nm[r.place_id]=r.name_original;if(data.length<1000)break;}
const logs=[]; for(let f=0;;f+=1000){const{data}=await sb.from('logs').select('id,place_id').eq('user_id',ADMIN).range(f,f+999);if(!data?.length)break;logs.push(...data);if(data.length<1000)break;}
const logPid={}; for(const l of logs)logPid[l.id]=l.place_id;
const ids=logs.map(l=>l.id); const deeps=[];
for(let i=0;i<ids.length;i+=200){const{data}=await sb.from('deep_logs').select('id,log_id,memo').in('log_id',ids.slice(i,i+200));deeps.push(...(data||[]));}
function isFacMemo(memo){if(!memo)return false;const parts=memo.replace(/"/g,'').split(/[|,]/).map(s=>s.trim()).filter(Boolean);if(!parts.length)return false;const f=parts.filter(p=>VALID.has(p));return f.length>=1&&f.length>=parts.length*0.6;}
let fixed=0;
for(const d of deeps){if(!isFacMemo(d.memo))continue;
  const pid=logPid[d.log_id];const fac=pf[pid]||[];
  const toks=d.memo.replace(/"/g,'').split(/[|,]/).map(s=>RENAME[s.trim()]||s.trim()).filter(t=>VALID.has(t)||t==='steam-sauna');
  const missing=toks.filter(t=>!fac.includes(t));
  console.log(`${nm[pid]}: memo${JSON.stringify(d.memo)} → facilities+[${missing.join(',')||'없음'}], memo=null`);
  if(APPLY){
    if(missing.length){await sb.from('places').update({facilities:[...fac,...missing],updated_at:new Date().toISOString()}).eq('id',pid);pf[pid]=[...fac,...missing];}
    await sb.from('deep_logs').update({memo:null}).eq('id',d.id);
  }
  fixed++;
}
console.log(`\n${APPLY?'APPLIED':'DRY-RUN'} ${fixed}건`);
