#!/usr/bin/env node
/** katalk-enrich-missed.mjs (READ-ONLY 진단)
 * 자동매처(crosscheck/enrich-apply)가 NEW로 오분류해 enrich에서 누락된 '기존 DB 시설'들의
 * 카톡 CSV 데이터 ↔ 현 어드민로그 비교. 산출: katalk-enrich-missed-20260602.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const RANGES={hot:[30,46],cold:[0,30],dry:[50,130],steam:[40,75],vh:[38,46]};
const vt=(f,x)=>{if(x==null)return null;const r=Math.round(x);const[lo,hi]=RANGES[f];return(r<lo||r>hi)?null:r;};
const pt=v=>{if(!v||!String(v).trim())return null;const s=String(v).split('|')[0].replace(/[<>~+]/g,'').trim();const m=s.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;};
// CSV 파싱
function parseCsv(t){const rows=[];let i=0,f='',row=[],q=false;while(i<t.length){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c=='"')q=true;else if(c==',' ){row.push(f);f='';}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);if(row.some(x=>x!==''))rows.push(row);row=[];f='';}else f+=c;}i++;}if(f!==''||row.length){row.push(f);rows.push(row);}return rows;}
const csv=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=csv[0],CI=Object.fromEntries(H.map((h,i)=>[h,i]));
const byRec={}; for(const r of csv.slice(1)){const rec=r[CI.source_record];(byRec[rec]=byRec[rec]||[]).push(r);}
function csvTemps(recs){const cv={hot:null,cold:null,dry:null,steam:null,vh:null};
  for(const rec of recs)for(const r of (byRec[String(rec)]||[])){
    const m={hot:'hot_bath_temp_c',cold:'cold_bath_temp_c',dry:'dry_temp_c',steam:'steam_temp_c',vh:'very_hot_bath_temp_c'};
    for(const k in m){if(cv[k]==null){const v=vt(k,pt(r[CI[m[k]]]));if(v!=null)cv[k]=v;}}}
  return cv;}
// 누락 의심 18곳: DB 정식명(place_sources name_original) + 관련 rec
const TARGETS=[
 {db:'호텔탑스텐 금진온천',recs:[5931]},{db:'덕구온천스파월드',recs:[6207]},{db:'청춘목욕탕',recs:[10843]},
 {db:'주심유황참숯가마',recs:[1682]},{db:'하남사우나',recs:[10065],note:'용산 후암동(동작 아님)'},{db:'대영온천',recs:[6235]},
 {db:'더케이호텔경주 스파온천',recs:[1434]},{db:'국제광천수온천',recs:[1664]},{db:'한화리조트 산정호수 온천',recs:[1270]},
 {db:'리버사우나',recs:[7533]},{db:'오레브핫스프링앤스파',recs:[6778]},
 {db:'도미인 서울 강남',recs:[3890]},{db:'도미인 EXPRESS 서울 인사동',recs:[3923],note:'rec3923 도미인행만'},
 {db:'조선 팰리스 서울 강남',recs:[6681]},{db:'스파레이',recs:[8874],note:'D-1: 온도없음, 효소 memo만'},
 {db:'스파디움24',recs:[8675]},{db:'소노캄 경주',recs:[1123]},{db:'힐튼호텔 경주',recs:[10898]},
];
// 정식명 → place_id
const nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.name_original])nm[r.name_original]=r.place_id;if(data.length<1000)break;}
const pids=TARGETS.map(t=>nm[t.db]).filter(Boolean);
const {data:logs}=await sb.from('logs').select('id,place_id,hot_bath_temp,cold_bath_temp,sauna_temp,steam_sauna_temp,bath_gender').eq('user_id',ADMIN).in('place_id',pids);
const aBy={}; for(const l of(logs||[]))if(!aBy[l.place_id])aBy[l.place_id]=l;
const lids=(logs||[]).map(l=>l.id); const dBy={};
if(lids.length)for(let i=0;i<lids.length;i+=200){const{data:dl}=await sb.from('deep_logs').select('id,log_id,very_hot_bath_temp').in('log_id',lids.slice(i,i+200));for(const d of(dl||[]))dBy[d.log_id]=d;}
const L=['# 누락 enrich 종합 진단 (read-only) — 자동매처 NEW오분류로 빠진 18곳','',
 `대상 ${TARGETS.length}곳. CSV 데이터 ↔ 현 어드민로그.`,'',
 '| DB 시설 | place_id | DB(온/냉/건/습/열) | CSV(온/냉/건/습/열) | 판정 |','|---|---|---|---|---|'];
let act=0;
for(const t of TARGETS){
  const pid=nm[t.db]; if(!pid){L.push(`| ${t.db} | ❌없음 | — | — | place 못찾음 |`);continue;}
  const a=aBy[pid], dl=a?dBy[a.id]:null; const cv=csvTemps(t.recs);
  const dbT=a?`${a.hot_bath_temp??'·'}/${a.cold_bath_temp??'·'}/${a.sauna_temp??'·'}/${a.steam_sauna_temp??'·'}/${dl?.very_hot_bath_temp??'·'}`:'로그없음';
  const csvT=`${cv.hot??'·'}/${cv.cold??'·'}/${cv.dry??'·'}/${cv.steam??'·'}/${cv.vh??'·'}`;
  let v;
  if(!Object.values(cv).some(x=>x!=null)){v=t.note?.includes('memo')?'온도없음(memo/facilities만 검토)':'온도없음→변경없음';}
  else if(!a){v='⚠️어드민로그없음→신규INSERT';act++;}
  else{const fills=[],conf=[];
    for(const[k,c]of[['hot','hot_bath_temp'],['cold','cold_bath_temp'],['dry','sauna_temp'],['steam','steam_sauna_temp']]){const dv=a[c],nv=cv[k];if(nv==null)continue;if(dv==null)fills.push(`${k}=${nv}`);else if(Math.abs(dv-nv)>=1)conf.push(`${k}:${dv}→${nv}`);}
    if(cv.vh!=null){const dv=dl?.very_hot_bath_temp;if(dv==null)fills.push(`vh=${cv.vh}`);else if(Math.abs(dv-cv.vh)>=1)conf.push(`vh:${dv}→${cv.vh}`);}
    if(conf.length){v='⚠️충돌→신규로그('+conf.join(',')+')';act++;}
    else if(fills.length){v='🟢보강UPDATE('+fills.join(',')+')';act++;}
    else v='동일=변경없음';}
  L.push(`| ${t.db}${t.note?' ('+t.note+')':''} | ${pid.slice(0,8)} | ${dbT} | ${csvT} | ${v} |`);
}
L.push('',`실변경 필요: ${act} / ${TARGETS.length}`);
fs.writeFileSync(path.join(DIR,'katalk-enrich-missed-20260602.md'),L.join('\n'));
console.log(L.join('\n'));
