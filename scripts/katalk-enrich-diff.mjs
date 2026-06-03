#!/usr/bin/env node
/** READ-ONLY: MATCHED 시설 기존 어드민로그 온도 ↔ CSV 추출 온도 차이표 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const __dirname=path.dirname(fileURLToPath(import.meta.url)); const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);if(m)process.env[m[1]]=m[2];}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';

function parseCsv(t){const rows=[];let f='',row=[],q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';}else if(c==='\r'){}else f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows.filter(r=>r.length>1);}
function norm(s){return(s||'').toLowerCase().replace(/[\s·,()\[\]<>#&.]/g,'');}
const SUF=['사우나','온천','스파','목욕탕','찜질방','불한증막','한증막','호텔','리조트','랜드','센터'];
function core(s){let x=norm(s);for(const u of SUF)x=x.split(norm(u)).join('');return x;}
// CSV 온도 파싱: 범위/부등호 → 대표 숫자(첫값)
function pt(v){if(!v||!v.trim())return null;const s=v.split('|')[0].replace(/[<>~]/g,'').trim();const m=s.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;}

// DB places
async function pageAll(t,s){const o=[];let f=0;while(true){const{data,error}=await sb.from(t).select(s).range(f,f+999);if(error)throw error;if(!data.length)break;o.push(...data);f+=1000;if(data.length<1000)break;}return o;}
const places=await pageAll('places','id,facility_type');
const srcs=await pageAll('place_sources','place_id,name_original');
const nameIdx=new Map(); // core(name) → place_id
const pname={};
for(const s of srcs){ if(!pname[s.place_id])pname[s.place_id]=s.name_original; const c=core(s.name_original); if(c.length>=2&&!nameIdx.has(c))nameIdx.set(c,s.place_id); }

// 어드민 로그 (place당 대표 1개; 여러개면 첫번째)
const adminLogs=await pageAll('logs','id,place_id,record_date,hot_bath_temp,cold_bath_temp,sauna_temp,steam_sauna_temp,bath_gender');
const adminByPlace={};
for(const l of adminLogs){ if(l.user_id===undefined||true){} if(!adminByPlace[l.place_id])adminByPlace[l.place_id]=[]; adminByPlace[l.place_id].push(l); }
// 어드민만 필터 별도 쿼리
const {data:adminOnly}=await sb.from('logs').select('id,place_id,hot_bath_temp,cold_bath_temp,sauna_temp,steam_sauna_temp,bath_gender,record_date').eq('user_id',ADMIN);
const aByPlace={}; for(const l of adminOnly){(aByPlace[l.place_id]=aByPlace[l.place_id]||[]).push(l);}
// deep_log very_hot 매핑
const logIds=adminOnly.map(l=>l.id);
const deepByLog={};
for(let i=0;i<logIds.length;i+=200){const chunk=logIds.slice(i,i+200);const{data:dl}=await sb.from('deep_logs').select('log_id,very_hot_bath_temp,cost').in('log_id',chunk);for(const d of (dl||[]))deepByLog[d.log_id]=d;}

// CSV
const rows=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=rows[0]; const I=Object.fromEntries(H.map((h,i)=>[h,i]));
// 시설 단위 그룹
const facs=new Map();
for(const r of rows.slice(1)){const name=r[I.name],canon=r[I.canonical_name];const key=(canon&&canon.trim())||name.trim();
  if(!facs.has(key))facs.set(key,{key,names:new Set(),rows:[]});
  const f=facs.get(key);f.names.add(name);f.rows.push(r);}

const L=['# enrich 차이표: 기존 어드민로그 ↔ CSV(2026-05-19) 온도','','형식: 필드 [DB값 → CSV값]. 차이있는 필드만 ⚠️. DB NULL→CSV값은 🟢(보강후보).','','| 시설 | DB type | 기존로그(온/냉/건/습/열) | CSV(온/냉/건/습/열) | 차이 |','|---|---|---|---|---|'];
let matched=0,newFac=0;
const out=[];
for(const f of facs.values()){
  // 매칭
  let pid=null; for(const c of [f.key,...f.names]){const cc=core(c);if(nameIdx.has(cc)){pid=nameIdx.get(cc);break;}}
  if(!pid){newFac++;continue;}
  matched++;
  const a=(aByPlace[pid]||[])[0]; const dl=a?deepByLog[a.id]:null;
  const db={h:a?.hot_bath_temp,c:a?.cold_bath_temp,d:a?.sauna_temp,s:a?.steam_sauna_temp,v:dl?.very_hot_bath_temp};
  // CSV: 여러 row면 각 필드 비어있지 않은 첫 값
  const pick=col=>{for(const r of f.rows){const v=pt(r[I[col]]);if(v!=null)return v;}return null;};
  const cv={h:pick('hot_bath_temp_c'),c:pick('cold_bath_temp_c'),d:pick('dry_temp_c'),s:pick('steam_temp_c'),v:pick('very_hot_bath_temp_c')};
  const diffs=[];
  for(const[k,lab]of [['h','온'],['c','냉'],['d','건'],['s','습'],['v','열']]){
    const a1=db[k],b1=cv[k];
    if(b1==null)continue;
    if(a1==null)diffs.push(`🟢${lab}:∅→${b1}`);
    else if(Math.abs(a1-b1)>=1)diffs.push(`⚠️${lab}:${a1}→${b1}`);
  }
  const fmt=o=>`${o.h??'·'}/${o.c??'·'}/${o.d??'·'}/${o.s??'·'}/${o.v??'·'}`;
  out.push({key:f.key,dbname:pname[pid],type:places.find(p=>p.id===pid)?.facility_type,db:fmt(db),cv:fmt(cv),diffs,n:diffs.length});
}
out.sort((a,b)=>b.n-a.n);
for(const o of out)L.push(`| ${o.key}${o.key!==o.dbname?` (${o.dbname})`:''} | ${o.type} | ${o.db} | ${o.cv} | ${o.diffs.join(' ')||'동일'} |`);
fs.writeFileSync(path.join(DIR,'katalk-enrich-diff-20260602.md'),L.join('\n')+'\n');
const withDiff=out.filter(o=>o.n>0).length;
const onlyFill=out.filter(o=>o.diffs.every(d=>d.startsWith('🟢'))&&o.n>0).length;
const conflict=out.filter(o=>o.diffs.some(d=>d.startsWith('⚠️'))).length;
console.log(`MATCHED 시설:${matched} | NEW:${newFac}`);
console.log(`차이있음:${withDiff} (🟢보강만:${onlyFill} / ⚠️값충돌포함:${conflict}) | 동일:${matched-withDiff}`);
console.log('→ docs/research/katalk-20260519/katalk-enrich-diff-20260602.md');
