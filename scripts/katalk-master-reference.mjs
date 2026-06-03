#!/usr/bin/env node
/**
 * katalk-master-reference.mjs (READ-ONLY)
 * place별 [DB 정식명·주소·place_id·type·facilities·온도] ↔ [카톡 원본 표기·온도] ↔ [노션 원본명·온도·탕/사우나] 통합.
 * 산출:
 *   docs/research/MASTER_place_matching_reference.md  — 매칭 마스터(원본명↔정식명↔place_id↔주소)
 *   docs/research/katalk-20260519/katalk-source-crossaudit-20260603.md — 온도/facilities 원본 대조 플래그
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const __dirname=path.dirname(fileURLToPath(import.meta.url)); const ROOT=path.resolve(__dirname,'..');
const RES=path.join(ROOT,'docs/research'); const DIR=path.join(RES,'katalk-20260519');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);if(m)process.env[m[1]]=m[2];}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';

const norm=s=>(s||'').toLowerCase().replace(/[\s·,()\[\]<>#&.]/g,'');
const SUF=['대중목욕탕','목욕탕','사우나','온천','스파','찜질방','불한증막','한증막','휘트니스','피트니스','호텔','리조트','랜드','센터','24시'];
const core=s=>{let x=norm(s);for(const u of SUF)x=x.split(norm(u)).join('');return x;};
const num=v=>{if(v==null)return null;const m=String(v).match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;};
const regionKey=a=>{if(!a)return '';const m=a.match(/(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\S*\s*(\S*[시군구])?/);return m?(m[1]+(m[2]||'')):'';};

// ── 노션 파서 ──
function parseNotion(){
  const txt=fs.readFileSync(path.join(RES,'notion-review-db-analysis.md'),'utf8');
  const blocks=txt.split(/^#### /m).slice(1);
  const out=[];
  for(const b of blocks){
    const name=b.split('\n')[0].trim();
    const get=re=>{const m=b.match(re);return m?m[1].trim():null;};
    const 유형=get(/\*\*유형\*\*:\s*([^|\n]+)/);
    const 주소=get(/\*\*주소\*\*:\s*([^\n]+)/);
    const 탕=get(/\*\*탕\*\*:\s*([^\n]+)/);
    const 사우나=get(/\*\*사우나\*\*:\s*([^\n]+)/);
    const 온도line=get(/\*\*온도\*\*:\s*([^\n]+)/)||'';
    const t=lbl=>{const m=온도line.match(new RegExp(lbl+'\\s*약?\\s*(\\d+(?:\\.\\d+)?)'));return m?parseFloat(m[1]):null;};
    out.push({name,유형,주소,탕,사우나,
      cold:t('냉탕'),hot:t('온탕'),vh:t('열탕'),dry:t('건식'),steam:t('습식'),
      성별:get(/\*\*성별\*\*:\s*([^|\n]+)/),한줄평:get(/\*\*한줄평\*\*:\s*([^\n]+)/)});
  }
  return out;
}
const notion=parseNotion();
const notionByCore=new Map();
for(const n of notion){const c=core(n.name);if(c&&!notionByCore.has(c))notionByCore.set(c,n);}

// ── 카톡 CSV ──
function parseCsv(t){const rows=[];let f='',row=[],q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';}else if(c==='\r'){}else f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows.filter(r=>r.length>1);}
const crows=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const CH=crows[0]; const CI=Object.fromEntries(CH.map((h,i)=>[h,i]));
const katalkByCore=new Map(); // core(정식명/표기) → {표기들, temps}
for(const r of crows.slice(1)){
  const keys=[r[CI.canonical_name],r[CI.name]].filter(Boolean);
  for(const k of keys){const c=core(k);if(!c)continue;
    if(!katalkByCore.has(c))katalkByCore.set(c,{표기:new Set(),hot:null,cold:null,dry:null,steam:null,vh:null});
    const o=katalkByCore.get(c);o.표기.add(r[CI.name]);
    for(const[f,col]of [['hot','hot_bath_temp_c'],['cold','cold_bath_temp_c'],['dry','dry_temp_c'],['steam','steam_temp_c'],['vh','very_hot_bath_temp_c']]){const v=num(r[CI[col]]);if(v!=null&&o[f]==null)o[f]=v;}
  }
}

// ── DB ──
async function pageAll(t,s){const o=[];let f=0;while(true){const{data,error}=await sb.from(t).select(s).range(f,f+999);if(error)throw error;if(!data.length)break;o.push(...data);f+=1000;if(data.length<1000)break;}return o;}
const places=await pageAll('places','id,facility_type,country_code,city,facilities');
const srcs=await pageAll('place_sources','place_id,name_original,address_original,source,external_id');
const sm={};for(const s of srcs){if(!sm[s.place_id])sm[s.place_id]={n:s.name_original,a:s.address_original,src:s.source,ext:s.external_id};}
const {data:al}=await sb.from('logs').select('id,place_id,hot_bath_temp,cold_bath_temp,sauna_temp,steam_sauna_temp,record_date').eq('user_id',ADMIN);
const logByPlace={};for(const l of al){(logByPlace[l.place_id]=logByPlace[l.place_id]||[]).push(l);}
const lids=al.map(l=>l.id);const deepByLog={};
for(let i=0;i<lids.length;i+=200){const{data:d}=await sb.from('deep_logs').select('log_id,very_hot_bath_temp').in('log_id',lids.slice(i,i+200));for(const x of(d||[]))deepByLog[x.log_id]=x;}

// ── 통합 ──
const rowsOut=[]; const auditFlags=[];
for(const p of places){
  const s=sm[p.id]||{}; const dbname=s.n||''; const c=core(dbname);
  const kat=katalkByCore.get(c); const noti=notionByCore.get(c);
  // DB 대표 온도 (2026-03 시드 로그 우선)
  const seedLog=(logByPlace[p.id]||[]).find(l=>(l.record_date||'').startsWith('2026-03'))||(logByPlace[p.id]||[])[0];
  const dbT=seedLog?{hot:seedLog.hot_bath_temp,cold:seedLog.cold_bath_temp,dry:seedLog.sauna_temp,steam:seedLog.steam_sauna_temp,vh:deepByLog[seedLog.id]?.very_hot_bath_temp}:{};
  rowsOut.push({pid:p.id,dbname,addr:s.a,type:p.facility_type,country:p.country_code,src:s.src,ext:s.ext,fac:p.facilities||[],dbT,
    kat표기:kat?[...kat.표기]:[],katT:kat||{},noti:noti||null});
  // 온도 대조 플래그 (DB vs 카톡 vs 노션, ≥5도 또는 범위이상)
  const issues=[];
  const RANGE={hot:[33,46],cold:[1,28],dry:[45,130],steam:[33,72],vh:[39,50]};
  const LAB={hot:'온',cold:'냉',dry:'건',steam:'습',vh:'열'};
  for(const k of ['hot','cold','dry','steam','vh']){
    const d=dbT[k]; if(d==null)continue;
    const[lo,hi]=RANGE[k]; if(d<lo||d>hi)issues.push(`🔴${LAB[k]}${d}범위밖`);
    const kv=kat?kat[k]:null, nv=noti?noti[k]:null;
    if(kv!=null&&Math.abs(d-kv)>=5)issues.push(`⚠️${LAB[k]} DB${d}↔카톡${kv}`);
    if(nv!=null&&Math.abs(d-nv)>=5)issues.push(`⚠️${LAB[k]} DB${d}↔노션${nv}`);
  }
  // facilities 대조: jjimjilbang인데 노션 유형/탕사우나에 찜질 없음
  if((p.facilities||[]).includes('jjimjilbang')&&noti&&!/찜질|찜방|한증/.test((noti.유형||'')+(noti.사우나||'')+(noti.탕||'')))issues.push(`🔴jjimjil태그+노션유형"${noti.유형}"`);
  if(issues.length)auditFlags.push({dbname,pid:p.id,type:p.facility_type,dbT,kat,noti,issues});
}

// ── 마스터 레퍼런스 파일 ──
const M=['# MASTER — 장소 매칭 레퍼런스 (원본명 ↔ 정식 등록명 ↔ place_id)','',
'> 생성: `scripts/katalk-master-reference.mjs` (재생성 가능). 검수 시 원본↔정식명 빠르게 조회용.',
'> DB 정식명 = place_sources.name_original (Naver/Google 등록명). 카톡/노션 = 사람들이 원본에 쓴 표기.','',
`총 ${places.length}곳 (국내 ${places.filter(p=>p.country_code==='KR').length} / 해외 ${places.filter(p=>p.country_code!=='KR').length})`,'',
'| DB 정식명 | place_id | 주소 | type | src | 카톡 표기 | 노션 표기 |','|---|---|---|---|---|---|---|'];
for(const r of rowsOut.sort((a,b)=>(a.dbname||'').localeCompare(b.dbname||'','ko'))){
  const kat=r.kat표기.filter(x=>x!==r.dbname).join(', ');
  const noti=r.noti?r.noti.name:'';
  M.push(`| ${r.dbname} | ${r.pid.slice(0,8)} | ${(r.addr||'').slice(0,28)} | ${r.type} | ${r.src||''} | ${kat||'-'} | ${noti&&core(noti)!==core(r.dbname)?'**'+noti+'**':(noti||'-')} |`);
}
fs.writeFileSync(path.join(RES,'MASTER_place_matching_reference.md'),M.join('\n')+'\n');

// ── 원본 대조 검수 플래그 파일 ──
const A=['# 원본 대조 검수: DB ↔ 카톡 ↔ 노션 (2026-06-03)','',
`플래그 ${auditFlags.length}곳 — 온도 범위이상/원본과 5도+ 불일치 또는 facilities 오태깅`,'',
'| DB명 | type | DB(온/냉/건/습/열) | 카톡(온/냉/건/습/열) | 노션(온/냉/건/습/열) | 이슈 |','|---|---|---|---|---|---|'];
const fmt=o=>o?`${o.hot??'·'}/${o.cold??'·'}/${o.dry??'·'}/${o.steam??'·'}/${o.vh??'·'}`:'-';
for(const f of auditFlags.sort((a,b)=>{const sv=x=>x.issues.filter(i=>i.startsWith('🔴')).length*10+x.issues.length;return sv(b)-sv(a);})){
  M;A.push(`| ${f.dbname} | ${f.type} | ${fmt(f.dbT)} | ${fmt(f.kat)} | ${fmt(f.noti)} | ${f.issues.join(' ')} |`);
}
fs.writeFileSync(path.join(DIR,'katalk-source-crossaudit-20260603.md'),A.join('\n')+'\n');

console.log(`MASTER: ${rowsOut.length}곳 → docs/research/MASTER_place_matching_reference.md`);
console.log(`노션 파싱: ${notion.length}블록 · 카톡 core: ${katalkByCore.size}`);
console.log(`원본대조 플래그: ${auditFlags.length} → katalk-source-crossaudit-20260603.md`);
