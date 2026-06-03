#!/usr/bin/env node
/** katalk-fix-corrupt-facilities.mjs — places.facilities 깨진 토큰(앞에 " 붙은 것) 수정. 기본 dry-run, --apply.
 * "cold-bath → cold-bath (clean이 이미 있으면 깨진것만 제거=dedupe). 순서 보존.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.place_id])nm[r.place_id]=r.name_original;if(data.length<1000)break;}
const places=[]; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,facilities').range(f,f+999);if(!data?.length)break;places.push(...data);if(data.length<1000)break;}
let cnt=0;
for(const p of places){const fac=p.facilities||[];
  if(!fac.some(t=>t.startsWith('"')))continue;
  const cleaned=[];const seen=new Set();
  for(const t of fac){const c=t.replace(/^"+/,'');if(seen.has(c))continue;seen.add(c);cleaned.push(c);}
  cnt++;
  console.log(`${nm[p.id]||p.id.slice(0,8)}: [${fac.join(',')}] → [${cleaned.join(',')}]`);
  if(APPLY)await sb.from('places').update({facilities:cleaned,updated_at:new Date().toISOString()}).eq('id',p.id);
}
console.log(`\n${APPLY?'APPLIED':'DRY-RUN'} 수정대상 ${cnt}곳`);
