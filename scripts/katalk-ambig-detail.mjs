#!/usr/bin/env node
/** READ-ONLY: AMBIGUOUS + 다중지점 검토용 상세 비교표 생성 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const __dirname=path.dirname(fileURLToPath(import.meta.url)); const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^([^#=]+)=(.*)$/);if(m)process.env[m[1].trim()]=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseCsv(t){const rows=[];let f='',row=[],q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c==='"')q=true;else if(c===','){row.push(f);f='';}else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';}else if(c==='\r'){}else f+=c;}}if(f.length||row.length){row.push(f);rows.push(row);}return rows.filter(r=>r.length>1);}

// DB place_sources by name substring
async function findPlaces(nameLike){
  const {data}=await sb.from('place_sources').select('place_id,name_original,address_original').ilike('name_original',`%${nameLike}%`);
  if(!data||!data.length)return [];
  const ids=[...new Set(data.map(d=>d.place_id))];
  const {data:pl}=await sb.from('places').select('id,facility_type,bath_policy,country_code,city').in('id',ids);
  const pm=Object.fromEntries((pl||[]).map(p=>[p.id,p]));
  // group by place_id
  const byId={};
  for(const d of data){ (byId[d.place_id]||(byId[d.place_id]={names:new Set(),addr:'',p:pm[d.place_id]})); byId[d.place_id].names.add(d.name_original); if(d.address_original&&!byId[d.place_id].addr)byId[d.place_id].addr=d.address_original; }
  return Object.entries(byId).map(([id,v])=>({id,names:[...v.names],addr:v.addr,type:v.p?.facility_type,city:v.p?.city,policy:v.p?.bath_policy}));
}

// CSV index by record
const rows=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=rows[0]; const I=Object.fromEntries(H.map((h,i)=>[h,i]));
const byRec={}; for(const r of rows.slice(1)){ byRec[r[I.source_record]]=r; }
function csvRow(rec){ const r=byRec[rec]; if(!r)return null; return {name:r[I.name],region:r[I.region],quote:r[I.raw_quote],notes:r[I.notes]}; }

// AMBIGUOUS 항목: [csv대표명, dbNameLike, records[]]
const AMBIG=[
  ['강릉 소금강스파','소금강스파',['7538']],
  ['군인공제회(남탕)','군인공제회',['7152']],
  ['군인공제회 사우나','군인공제회',['10614']],
  ['그랜드워커힐','워커힐',['7832']],
  ['그랜드하얏트 서울 남자 사우나','하얏트',['10582']],
  ['노량진 솔로사우나 레포','솔로사우나',['5612']],
  ['다산 스파디움24','스파디움24',['3368']],
  ['리버사이드','리버사이드',['331']],
  ['마포365 센터','마포365',['792']],
  ['마포365사우나','마포365',['1418']],
  ['설해원&면역공방','면역공방',['5267']],
  ['올림픽 선수촌 사우나','선수촌',['7112']],
  ['춘천 나무향기','나무향기',['5315']],
  ['하비오 사우나','하비오',['6572']],
  ['하이렉스 사우나','하이렉스',['1437']],
  ['호텔 더디자이너스 서울역 사우나','더디자이너스',['10341']],
];
// 다중지점
const MULTI=[
  ['군인공제회 (전 지점)','군인공제회',['5008','7152','10614']],
  ['레몬사우나 (전 지점)','레몬사우나',['2032','6523','6542','7154']],
];

const L=['# AMBIGUOUS / 다중지점 상세 검토 (2026-06-01)','','각 항목: 카톡 원문(지역·발화) ↔ DB 후보(이름/주소/city/type). 유저가 매칭 여부 결정.',''];
async function dump(title,list){
  L.push(`## ${title}`,'');
  for(const [label,like,recs] of list){
    L.push(`### ${label}`);
    for(const rec of recs){ const c=csvRow(rec); if(c) L.push(`- 카톡 rec${rec} [${c.region}] "${(c.quote||'').slice(0,70)}"${c.notes?` · 비고:${c.notes.slice(0,40)}`:''}`); else L.push(`- 카톡 rec${rec}: (CSV에 없음)`); }
    const dbs=await findPlaces(like);
    if(!dbs.length) L.push(`- DB 후보: 없음`);
    else for(const d of dbs) L.push(`- DB → **${d.names.join(' / ')}** | ${d.addr||'주소없음'} | city=${d.city||'-'} | type=${d.type} | policy=${d.policy||'-'}`);
    L.push('');
  }
}
await dump('AMBIGUOUS 16',AMBIG);
await dump('다중지점',MULTI);
const out=path.join(DIR,'katalk-ambig-detail-20260601.md');
fs.writeFileSync(out,L.join('\n')+'\n');
console.log('WROTE',out);
