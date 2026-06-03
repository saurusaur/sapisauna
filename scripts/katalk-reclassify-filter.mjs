#!/usr/bin/env node
/** READ-ONLY: 새 분류(hotel-premium/resort-spa) 후보를 DB+캐시 Google types로 걸러냄 */
import { createClient } from '@supabase/supabase-js'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const __dirname=path.dirname(fileURLToPath(import.meta.url)); const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'docs/research/katalk-20260519'); const QA=path.join(DIR,'qa');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^([^#=]+)=(.*)$/);if(m)process.env[m[1].trim()]=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const cache=JSON.parse(fs.readFileSync(path.join(QA,'api-cache.json'),'utf8'));

async function pageAll(t,s){const o=[];let f=0;const z=1000;while(true){const{data,error}=await sb.from(t).select(s).range(f,f+z-1);if(error)throw error;if(!data.length)break;o.push(...data);f+=z;if(data.length<z)break;}return o;}
const pl=await pageAll('places','id,facility_type,country_code,city,latitude,longitude');
const src=await pageAll('place_sources','place_id,name_original,address_original');
const sm={};for(const s of src){if(!sm[s.place_id])sm[s.place_id]={n:s.name_original,a:s.address_original};}

function gLookup(name,addr,country){
  const q=(name+(addr?` ${addr}`:'')).trim();
  const region=country&&country!=='KR'?country:'KR';
  return cache[`g:${q}:${region}`]||cache[`n:${name}`]&&null||null;
}

const RESORT_RE=/워터파크|아쿠아필드|스파랜드|테르메|therme|메가|워터킹덤|오아시스|aquafield|워터/i;
const RESORT_TYPES=new Set(['water_park','amusement_park']);
const LODGE_TYPES=new Set(['lodging','hotel','resort_hotel','japanese_inn','motel']);

const out={resortSpa:[],hotelPremium:[],reviewLodging:[]};
for(const p of pl){
  const s=sm[p.id]||{}; const name=s.n||''; if(!name)continue;
  const g=gLookup(name,s.a,p.country_code);
  const gtypes=(g&&g.types)||[];
  const gname=(g&&g.name)||'';
  const isResort = RESORT_RE.test(name)||RESORT_RE.test(gname)||gtypes.some(t=>RESORT_TYPES.has(t));
  const isLodge = gtypes.some(t=>LODGE_TYPES.has(t));
  const row={name, cur:p.facility_type, gtypes:gtypes.slice(0,4).join(','), gname, country:p.country_code};
  if(isResort) out.resortSpa.push(row);
  else if(p.facility_type==='hotel-spa') out.hotelPremium.push(row);   // 기존 hotel-spa → hotel-premium 기본
  else if(isLodge && p.facility_type!=='hotel-spa') out.reviewLodging.push(row); // public-bath인데 Google=lodging → 검토
}

const L=['# 재분류 후보 (hotel-premium / resort-spa) — 2026-06-01','','Google types(캐시) + 이름 기반 자동 제안. 유저 확정 필요.',''];
function tbl(title,arr){ L.push(`## ${title} (${arr.length})`,''); L.push('| 시설 | 현재type | Google name | Google types | country |'); L.push('|---|---|---|---|---|'); for(const r of arr.sort((a,b)=>a.cur.localeCompare(b.cur)||a.name.localeCompare(b.name,'ko'))) L.push(`| ${r.name} | ${r.cur} | ${r.gname||'?'} | ${r.gtypes||'?'} | ${r.country} |`); L.push(''); }
tbl('🅰 resort-spa 후보 (워터파크/메가 데이온천 시그널)', out.resortSpa);
tbl('🅱 hotel-premium 후보 (현 hotel-spa 전체 → premium)', out.hotelPremium);
tbl('🅲 검토: 현 public-bath인데 Google=lodging (모텔 동명 오매칭 가능성 포함)', out.reviewLodging);

fs.writeFileSync(path.join(DIR,'katalk-reclassify-candidates-20260601.md'),L.join('\n')+'\n');
console.log('resort-spa 후보:',out.resortSpa.length,'| hotel-premium 후보:',out.hotelPremium.length,'| review-lodging:',out.reviewLodging.length);
