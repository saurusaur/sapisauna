#!/usr/bin/env node
/**
 * katalk-temp-sanity-audit.mjs (READ-ONLY)
 * DB 어드민로그 온도 전수 검수:
 *  (1) 상식 범위/교차모순 체크
 *  (2) 카톡 추출 CSV(원본 기반)와 DB값 ≥5도 불일치 탐지 (CSV quote=원문 근거)
 * 산출: docs/research/katalk-20260519/katalk-temp-sanity-20260602.md
 */
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
function pt(v){if(!v||!v.trim())return null;const s=v.split('|')[0].replace(/[<>~+]/g,'').trim();const m=s.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;}

async function pageAll(t,s){const o=[];let f=0;while(true){const{data,error}=await sb.from(t).select(s).range(f,f+999);if(error)throw error;if(!data.length)break;o.push(...data);f+=1000;if(data.length<1000)break;}return o;}
const srcs=await pageAll('place_sources','place_id,name_original');
const pname={}; const nameIdx=new Map();
for(const s of srcs){if(!pname[s.place_id])pname[s.place_id]=s.name_original;const c=core(s.name_original);if(c.length>=2&&!nameIdx.has(c))nameIdx.set(c,s.place_id);}
const {data:logs}=await sb.from('logs').select('id,place_id,hot_bath_temp,cold_bath_temp,sauna_temp,steam_sauna_temp,bath_gender,record_date').eq('user_id',ADMIN);
const logIds=logs.map(l=>l.id); const deep={};
for(let i=0;i<logIds.length;i+=200){const{data:dl}=await sb.from('deep_logs').select('log_id,very_hot_bath_temp').in('log_id',logIds.slice(i,i+200));for(const d of(dl||[]))deep[d.log_id]=d;}

// CSV (원본 추출) → place별 온도+quote
const rows=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=rows[0]; const I=Object.fromEntries(H.map((h,i)=>[h,i]));
const csvByPlace={};
for(const r of rows.slice(1)){
  const key=(r[I.canonical_name]&&r[I.canonical_name].trim())||r[I.name].trim();
  let pid=null; for(const c of [key,r[I.name]]){const cc=core(c);if(nameIdx.has(cc)){pid=nameIdx.get(cc);break;}}
  if(!pid)continue;
  const o=csvByPlace[pid]=csvByPlace[pid]||{hot:[],cold:[],dry:[],steam:[],vh:[],quotes:[]};
  const add=(arr,v,q)=>{const n=pt(v);if(n!=null)arr.push({v:n,q});};
  add(o.hot,r[I.hot_bath_temp_c],r[I.raw_quote]); add(o.cold,r[I.cold_bath_temp_c],r[I.raw_quote]);
  add(o.dry,r[I.dry_temp_c],r[I.raw_quote]); add(o.steam,r[I.steam_temp_c],r[I.raw_quote]); add(o.vh,r[I.very_hot_bath_temp_c],r[I.raw_quote]);
  o.quotes.push(`rec${r[I.source_record]}: ${(r[I.raw_quote]||'').slice(0,55)}`);
}

// 상식 범위
const RANGE={hot:[33,46],cold:[1,28],dry:[45,130],steam:[33,72],vh:[39,50]};
const LAB={hot:'온',cold:'냉',dry:'건',steam:'습',vh:'열'};
const flags=[];
for(const l of logs){
  const d=deep[l.id]||{};
  const v={hot:l.hot_bath_temp,cold:l.cold_bath_temp,dry:l.sauna_temp,steam:l.steam_sauna_temp,vh:d.very_hot_bath_temp};
  const name=pname[l.place_id]||'(이름없음)';
  const issues=[];
  // 범위
  for(const[k,[lo,hi]]of Object.entries(RANGE)){const x=v[k];if(x==null)continue;if(x<lo||x>hi)issues.push(`🔴범위 ${LAB[k]}${x}(정상 ${lo}~${hi})`);}
  // 교차모순
  if(v.cold!=null&&v.hot!=null&&v.cold>=v.hot)issues.push(`🔴냉${v.cold}≥온${v.hot}`);
  if(v.hot!=null&&v.vh!=null&&v.hot>v.vh+0.5)issues.push(`🟡온${v.hot}>열${v.vh}`);
  if(v.dry!=null&&v.steam!=null&&v.dry<v.steam-2)issues.push(`🟡건${v.dry}<습${v.steam}`);
  // 카톡 대조
  const cv=csvByPlace[l.place_id];
  if(cv){
    for(const k of ['hot','cold','dry','steam','vh']){
      const x=v[k]; const cand=cv[k]; if(x==null||!cand.length)continue;
      // CSV 값들 중 DB와 가장 가까운 것과 비교 (다방문 허용)
      const closest=cand.reduce((a,b)=>Math.abs(b.v-x)<Math.abs(a.v-x)?b:a);
      if(Math.abs(closest.v-x)>=5)issues.push(`⚠️${LAB[k]} DB${x}↔카톡${cand.map(c=>c.v).join('/')}`);
    }
  }
  if(issues.length)flags.push({name,pid:l.place_id,v,hasCsv:!!cv,issues,quotes:cv?cv.quotes:[]});
}

flags.sort((a,b)=>{const sev=f=>f.issues.filter(i=>i.startsWith('🔴')).length*10+f.issues.filter(i=>i.startsWith('⚠️')).length*5+f.issues.length;return sev(b)-sev(a);});
const L=['# DB 온도 sanity 검수 + 카톡 대조 (2026-06-02)','',`어드민로그 ${logs.length}개 검사 · 플래그 ${flags.length}개`,'',
'범례: 🔴비상식(범위이탈/냉≥온) · 🟡경미모순(온>열, 건<습) · ⚠️카톡과 5도+ 불일치','',
'| 시설 | DB(온/냉/건/습/열) | 이슈 | 카톡원문 |','|---|---|---|---|'];
for(const f of flags){
  const dv=`${f.v.hot??'·'}/${f.v.cold??'·'}/${f.v.dry??'·'}/${f.v.steam??'·'}/${f.v.vh??'·'}`;
  const q=f.quotes.slice(0,2).join(' ／ ').replace(/\|/g,'¦');
  L.push(`| ${f.name} | ${dv} | ${f.issues.join(' ')} | ${q||'(CSV없음→수동grep필요)'} |`);
}
fs.writeFileSync(path.join(DIR,'katalk-temp-sanity-20260602.md'),L.join('\n')+'\n');
const r=flags.filter(f=>f.issues.some(i=>i.startsWith('🔴'))).length;
const w=flags.filter(f=>f.issues.some(i=>i.startsWith('⚠️'))).length;
console.log(`플래그 ${flags.length} (🔴비상식포함:${r} / ⚠️카톡불일치포함:${w})`);
console.log('→ docs/research/katalk-20260519/katalk-temp-sanity-20260602.md');
