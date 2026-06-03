#!/usr/bin/env node
/**
 * katalk-enrich-apply.mjs — 기본 dry-run, --apply 시 실제 반영.
 * 정책(유저 확정):
 *  🟢 NULL 보강: 기존 어드민로그의 빈 온도칸을 CSV로 채움(logs UPDATE + deep_log very_hot UPDATE).
 *  ⚠️ 값 충돌: 다른 시점으로 보고 5/19 신규 어드민로그 INSERT(logs+deep_logs), 기존 보존.
 *  🅒 그룹C: 강변스파랜드 남/여 2로그, 리버사이드 5/19 시점 로그.
 *  제외: 호텔프리마부산(NEW), 오라카이=4방문→5/19 종합 1로그, 할매탕·아쿠아필드(이미 직접 교정).
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const __dirname=path.dirname(fileURLToPath(import.meta.url)); const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);if(m)process.env[m[1]]=m[2];}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const APPLY=process.argv.includes('--apply');
const REC_DATE='2026-05-19T12:00:00';
const MEMO='먼데이사우나 카톡 5/19 추출 측정';

function parseCsv(t){const rows=[];let f='',row=[],q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';}else if(c==='\r'){}else f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows.filter(r=>r.length>1);}
function norm(s){return(s||'').toLowerCase().replace(/[\s·,()\[\]<>#&.]/g,'');}
const SUF=['사우나','온천','스파','목욕탕','찜질방','불한증막','한증막','호텔','리조트','랜드','센터'];
function core(s){let x=norm(s);for(const u of SUF)x=x.split(norm(u)).join('');return x;}
function pt(v){if(!v||!v.trim())return null;const s=v.split('|')[0].replace(/[<>~+]/g,'').trim();const m=s.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;}
const uuid=()=>crypto.randomUUID();
// 온도 컬럼은 INT + BETWEEN 제약 (001/024). 반올림 후 범위밖이면 null(해당 필드 omit).
const RANGES={hot:[30,46],cold:[0,30],dry:[50,130],steam:[40,75],vh:[38,46]};
function vt(field,x){if(x==null)return null;const r=Math.round(x);const[lo,hi]=RANGES[field];return(r<lo||r>hi)?null:r;}

async function pageAll(t,s){const o=[];let f=0;while(true){const{data,error}=await sb.from(t).select(s).range(f,f+999);if(error)throw error;if(!data.length)break;o.push(...data);f+=1000;if(data.length<1000)break;}return o;}
const srcs=await pageAll('place_sources','place_id,name_original');
const pname={}; const nameIdx=new Map();
for(const s of srcs){if(!pname[s.place_id])pname[s.place_id]=s.name_original;const c=core(s.name_original);if(c.length>=2&&!nameIdx.has(c))nameIdx.set(c,s.place_id);}
const {data:adminLogs}=await sb.from('logs').select('id,place_id,hot_bath_temp,cold_bath_temp,sauna_temp,steam_sauna_temp').eq('user_id',ADMIN);
const aByPlace={};for(const l of adminLogs){if(!aByPlace[l.place_id])aByPlace[l.place_id]=l;} // place당 1개(대표)
const logIds=adminLogs.map(l=>l.id); const deepByLog={};
for(let i=0;i<logIds.length;i+=200){const{data:dl}=await sb.from('deep_logs').select('id,log_id,very_hot_bath_temp').in('log_id',logIds.slice(i,i+200));for(const d of(dl||[]))deepByLog[d.log_id]=d;}

const rows=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=rows[0]; const I=Object.fromEntries(H.map((h,i)=>[h,i]));
const facs=new Map();
for(const r of rows.slice(1)){const name=r[I.name],canon=r[I.canonical_name];const key=(canon&&canon.trim())||name.trim();
  if(!facs.has(key))facs.set(key,{key,names:new Set(),rows:[]});const f=facs.get(key);f.names.add(name);f.rows.push(r);}

const EXCLUDE=new Set(['호텔 프리마 부산','할매탕','아쿠아필드 하남']); // 후2자=직접 교정완료
const GROUPC=new Set(['강변스파랜드','더 리버사이드 호텔 더 메디스파']);
function matchPid(names){for(const c of names){const cc=core(c);if(nameIdx.has(cc))return nameIdx.get(cc);}return null;}
function pickf(f,col){for(const r of f.rows){const v=pt(r[I[col]]);if(v!=null)return v;}return null;}

// place_id별 집계
const byPlace={};
for(const f of facs.values()){
  if(EXCLUDE.has(f.key)||GROUPC.has(f.key))continue;
  const pid=matchPid([f.key,...f.names]); if(!pid)continue;
  const cv={hot:vt('hot',pickf(f,'hot_bath_temp_c')),cold:vt('cold',pickf(f,'cold_bath_temp_c')),dry:vt('dry',pickf(f,'dry_temp_c')),steam:vt('steam',pickf(f,'steam_temp_c')),vh:vt('vh',pickf(f,'very_hot_bath_temp_c'))};
  if(!byPlace[pid])byPlace[pid]={cv:{hot:null,cold:null,dry:null,steam:null,vh:null}};
  for(const k of ['hot','cold','dry','steam','vh'])if(byPlace[pid].cv[k]==null&&cv[k]!=null)byPlace[pid].cv[k]=cv[k];
}

const updates=[], inserts=[];
for(const[pid,info]of Object.entries(byPlace)){
  const a=aByPlace[pid]; const cv=info.cv; const name=pname[pid];
  if(!a){ if(Object.values(cv).some(v=>v!=null)) inserts.push({pid,name,cv,reason:'어드민로그없음'}); continue; }
  const db={hot:a.hot_bath_temp,cold:a.cold_bath_temp,dry:a.sauna_temp,steam:a.steam_sauna_temp};
  const dlog=deepByLog[a.id];
  const fills={}, conflict=[]; const deepFill={};
  for(const[k,dbk]of [['hot','hot'],['cold','cold'],['dry','dry'],['steam','steam']]){
    const dv=db[k], nv=cv[k]; if(nv==null)continue;
    if(dv==null)fills[k]=nv; else if(Math.abs(dv-nv)>=1)conflict.push(`${k}:${dv}→${nv}`);
  }
  // very_hot 보강(충돌 아닌 경우만 채움)
  if(cv.vh!=null){ const dv=dlog?.very_hot_bath_temp; if(dv==null)deepFill.vh=cv.vh; else if(Math.abs(dv-cv.vh)>=1)conflict.push(`vh:${dv}→${cv.vh}`); }
  if(conflict.length) inserts.push({pid,name,cv,reason:'충돌:'+conflict.join(',')});
  else if(Object.keys(fills).length||Object.keys(deepFill).length) updates.push({pid,name,logId:a.id,deepId:dlog?.id,fills,deepFill});
}

// 그룹C
const gbPid=matchPid(['강변스파랜드']);
const rvPid=matchPid(['더 리버사이드 호텔 더 메디스파','더 리버사이드 호텔 더 메디 스파']);
const groupc=[];
if(gbPid)groupc.push(
  {pid:gbPid,name:pname[gbPid],log:{bath_gender:'male',cold:null,hot:null,dry:null,steam:null},deep:{vh:null,memo:MEMO+': 남탕 냉탕 2개(급냉/일반), 히노끼존 내기욕+휴게의자 2개',has_ice:true,ice:5},label:'강변 남탕'},
  {pid:gbPid,name:pname[gbPid],log:{bath_gender:'female',cold:15,hot:null,dry:null,steam:null},deep:{vh:null,memo:MEMO+': 여탕 냉탕 약 15도'},label:'강변 여탕'},
);
if(rvPid)groupc.push(
  {pid:rvPid,name:pname[rvPid],log:{bath_gender:null,hot:39,cold:15,dry:97,steam:56},deep:{vh:43,cost:14000,memo:MEMO+': 8회 방문, 26.04→26.05 평점 악화, 노천/히노키탕 수질이슈'},label:'리버사이드 5/19'},
);

// ── dry-run 리포트 ──
const L=['# enrich apply 미리보기/적용 ('+(APPLY?'APPLIED':'dry-run')+') 2026-06-02','',
`UPDATE보강 ${updates.length} · INSERT신규로그 ${inserts.length} · 그룹C ${groupc.length} (제외: 호텔프리마부산·할매탕·아쿠아필드)`,'',
'## 🟢 UPDATE','| 시설 | 보강 |','|---|---|'];
for(const u of updates){const parts=[...Object.entries(u.fills).map(([k,v])=>`${k}=${v}`),...(u.deepFill.vh!=null?[`vh=${u.deepFill.vh}`]:[])];L.push(`| ${u.name} | ${parts.join(', ')} |`);}
L.push('','## ⚠️ INSERT (5/19 신규로그)','| 시설 | 온/냉/건/습/열 | 사유 |','|---|---|---|');
for(const i of inserts){const c=i.cv;L.push(`| ${i.name} | ${c.hot??'·'}/${c.cold??'·'}/${c.dry??'·'}/${c.steam??'·'}/${c.vh??'·'} | ${i.reason} |`);}
L.push('','## 🅒 그룹C','| 시설 | 로그 | 내용 |','|---|---|---|');
for(const g of groupc)L.push(`| ${g.name} | ${g.label} | 온${g.log.hot??'·'}냉${g.log.cold??'·'}건${g.log.dry??'·'}습${g.log.steam??'·'}열${g.deep.vh??'·'}${g.log.bath_gender?' '+g.log.bath_gender:''}${g.deep.has_ice?' 급냉'+g.deep.ice:''} |`);
fs.writeFileSync(path.join(DIR,'katalk-enrich-preview-20260602.md'),L.join('\n')+'\n');
console.log(`UPDATE:${updates.length} INSERT:${inserts.length} 그룹C:${groupc.length}`);

// ── 중복방지: 이미 있는 5/19 어드민로그(재실행 안전) ──
const {data:ex5}=await sb.from('logs').select('place_id,bath_gender').eq('user_id',ADMIN).eq('record_date',REC_DATE);
const exPid=new Set((ex5||[]).map(e=>e.place_id));
const exPidGender=new Set((ex5||[]).map(e=>`${e.place_id}|${e.bath_gender||''}`));

// ── APPLY ──
if(APPLY){
  let uOk=0,iOk=0,gOk=0,gSkip=0,iSkip=0,err=[];
  // UPDATE
  for(const u of updates){
    const logPatch={}; if('hot'in u.fills)logPatch.hot_bath_temp=u.fills.hot; if('cold'in u.fills)logPatch.cold_bath_temp=u.fills.cold; if('dry'in u.fills)logPatch.sauna_temp=u.fills.dry; if('steam'in u.fills)logPatch.steam_sauna_temp=u.fills.steam;
    if(Object.keys(logPatch).length){logPatch.updated_at=new Date().toISOString();const{error}=await sb.from('logs').update(logPatch).eq('id',u.logId);if(error){err.push(`UPD ${u.name}: ${error.message}`);continue;}}
    if(u.deepFill.vh!=null){
      if(u.deepId){const{error}=await sb.from('deep_logs').update({very_hot_bath_temp:u.deepFill.vh,has_very_hot_bath:true,updated_at:new Date().toISOString()}).eq('id',u.deepId);if(error){err.push(`UPDdeep ${u.name}: ${error.message}`);continue;}}
      else{const{error}=await sb.from('deep_logs').insert({id:uuid(),log_id:u.logId,very_hot_bath_temp:u.deepFill.vh,has_very_hot_bath:true,currency:'KRW'});if(error){err.push(`INSdeep ${u.name}: ${error.message}`);continue;}}
    }
    uOk++;
  }
  // INSERT
  for(const i of inserts){
    if(exPid.has(i.pid)){iSkip++;continue;} // 이미 5/19 로그 있으면 skip(재실행 안전)
    const lid=uuid();
    const{error:e1}=await sb.from('logs').insert({id:lid,user_id:ADMIN,place_id:i.pid,tribe_id:'bather',revisit_score:3,record_date:REC_DATE,hot_bath_temp:i.cv.hot,cold_bath_temp:i.cv.cold,sauna_temp:i.cv.dry,steam_sauna_temp:i.cv.steam});
    if(e1){err.push(`INS ${i.name}: ${e1.message}`);continue;}
    const{error:e2}=await sb.from('deep_logs').insert({id:uuid(),log_id:lid,very_hot_bath_temp:i.cv.vh,has_very_hot_bath:i.cv.vh!=null,currency:'KRW',memo:MEMO});
    if(e2){err.push(`INSdeep ${i.name}: ${e2.message}`);continue;}
    iOk++;
  }
  // 그룹C
  for(const g of groupc){
    if(exPidGender.has(`${g.pid}|${g.log.bath_gender||''}`)){gSkip++;continue;}
    const lid=uuid();
    const{error:e1}=await sb.from('logs').insert({id:lid,user_id:ADMIN,place_id:g.pid,tribe_id:'bather',revisit_score:3,record_date:REC_DATE,hot_bath_temp:g.log.hot,cold_bath_temp:g.log.cold,sauna_temp:g.log.dry,steam_sauna_temp:g.log.steam,bath_gender:g.log.bath_gender});
    if(e1){err.push(`GC ${g.label}: ${e1.message}`);continue;}
    const deep={id:uuid(),log_id:lid,very_hot_bath_temp:g.deep.vh,has_very_hot_bath:g.deep.vh!=null,currency:'KRW',memo:g.deep.memo};
    if(g.deep.cost!=null)deep.cost=g.deep.cost;
    if(g.deep.has_ice){deep.has_ice_bath=true;deep.ice_bath_temp=g.deep.ice;}
    const{error:e2}=await sb.from('deep_logs').insert(deep);
    if(e2){err.push(`GCdeep ${g.label}: ${e2.message}`);continue;}
    gOk++;
  }
  console.log(`\n[APPLIED] UPDATE:${uOk}/${updates.length} INSERT:${iOk}(skip ${iSkip})/${inserts.length} 그룹C:${gOk}(skip ${gSkip})/${groupc.length}`);
  if(err.length)console.log('오류:\n'+err.join('\n')); else console.log('오류 없음 ✓');
}
