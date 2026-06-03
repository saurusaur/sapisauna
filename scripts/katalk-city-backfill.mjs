#!/usr/bin/env node
/**
 * katalk-city-backfill.mjs (READ-ONLY 조회 + 028 SQL 생성)
 * 대상: city 누락 places + JP 도쿄 ward(→Tokyo 롤업).
 * Google searchText(en)로 영문 locality 재지오코딩(기존 city 영문 포맷과 일관).
 * 산출: 028 마이그레이션 SQL(트리니티 삭제 + city UPDATE) + dry-run 표.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const __dirname=path.dirname(fileURLToPath(import.meta.url)); const ROOT=path.resolve(__dirname,'..');
const QA=path.join(ROOT,'docs/research/katalk-20260519/qa');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);if(m)process.env[m[1]]=m[2];}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const GKEY=process.env.GOOGLE_PLACES_API_KEY;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cachePath=path.join(QA,'city-geocode-cache.json');
const cache=fs.existsSync(cachePath)?JSON.parse(fs.readFileSync(cachePath,'utf8')):{};

async function pageAll(t,s){const o=[];let f=0;while(true){const{data,error}=await sb.from(t).select(s).range(f,f+999);if(error)throw error;if(!data.length)break;o.push(...data);f+=1000;if(data.length<1000)break;}return o;}
const places=await pageAll('places','id,facility_type,country_code,city');
const srcs=await pageAll('place_sources','place_id,name_original,address_original');
const sm={};for(const s of srcs){if(!sm[s.place_id])sm[s.place_id]={n:s.name_original,a:s.address_original};}

async function geocodeCity(q){
  if(cache[q])return cache[q];
  try{
    const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':GKEY,'X-Goog-FieldMask':'places.addressComponents,places.formattedAddress'},body:JSON.stringify({textQuery:q,languageCode:'en'})});
    const j=await r.json(); let out={};
    if(j.places&&j.places[0]){const ac=j.places[0].addressComponents||[];
      const get=type=>{const c=ac.find(x=>(x.types||[]).includes(type));return c?(c.longText||c.long_name):null;};
      out={locality:get('locality')||get('postal_town')||null, admin1:get('administrative_area_level_1')||null, country:(ac.find(x=>(x.types||[]).includes('country'))?.shortText)||null};
    } else out={empty:true,err:j.error?.message};
    cache[q]=out;return out;
  }catch(e){return {err:String(e)};}
}

// 한국 광역시/도 → 영문 정규화 (기존 city 영문 포맷 일관)
const KR_METRO=[['서울','Seoul'],['부산','Busan'],['인천','Incheon'],['대구','Daegu'],['대전','Daejeon'],['광주','Gwangju'],['울산','Ulsan'],['세종','Sejong'],['제주','Jeju'],['강원','Gangwon'],['경기','Gyeonggi'],['충북','Chungbuk'],['충남','Chungnam'],['전북','Jeonbuk'],['전남','Jeonnam'],['경북','Gyeongbuk'],['경남','Gyeongnam']];
function normCity(c){ if(!c)return c; for(const[k,v]of KR_METRO) if(c.startsWith(k))return v; return c; }
function cityFromAddr(addr){ if(!addr)return null; for(const[k,v]of KR_METRO) if(addr.startsWith(k))return v; return null; }

// 대상 선별
const targets=[];
for(const p of places){
  const s=sm[p.id]||{}; const addr=s.a||''; const name=s.n||'';
  const isTokyoWard = p.country_code==='JP' && /Tokyo/.test(addr) && p.city && p.city!=='Tokyo';
  if(p.city && !isTokyoWard) continue; // 이미 city 있고 도쿄ward 아님 → skip
  targets.push({...p,name,addr,isTokyoWard});
}
console.log('대상:',targets.length,'(city누락 또는 도쿄ward)');

const rows=[]; let i=0;
for(const t of targets){
  i++;
  let city=null, note='';
  if(t.isTokyoWard){ city='Tokyo'; note='도쿄ward 룰'; }
  else if(t.addr){
    const g=await geocodeCity(`${t.name} ${t.addr}`);
    // KR 광역시/특별시는 city가 locality가 아니라 admin1로 옴 → locality ?? admin1 폴백
    const loc = g.locality ?? g.admin1;
    if(t.country_code==='JP'&&g.admin1==='Tokyo'){ city='Tokyo'; note='도쿄룰'; }
    else if(loc){ city=t.country_code==='KR'?normCity(loc):loc; note=g.locality?'geocode':'admin1폴백'; }
    else { city=cityFromAddr(t.addr); note=city?'주소파싱폴백':'geocode실패:'+(g.err||'empty'); }
    if(i%10===0){fs.writeFileSync(cachePath,JSON.stringify(cache));process.stdout.write(`\r  ${i}/${targets.length}`);}
    await sleep(110);
  } else note='주소없음';
  rows.push({id:t.id,name:t.name,country:t.country_code,old:t.city||'∅',city,note,addr:t.addr});
}
fs.writeFileSync(cachePath,JSON.stringify(cache));

// 028 SQL 생성
const TRINITY='c1dc05fb-3293-407c-82cc-85b45a5e3028';
const L=['-- 028: 트리니티 제거(사우나 아님) + city 보강','-- 트리니티스파 신세계센텀 = 마사지/에스테틱샵(사우나 아님), 어드민 빈 placeholder 로그뿐.','-- city: 누락분 Google(en) locality 재지오코딩 + 도쿄 23특별구 → Tokyo 롤업.','',
'-- 1) 트리니티 제거 (자식부터)',
`DELETE FROM deep_logs WHERE log_id IN (SELECT id FROM logs WHERE place_id = '${TRINITY}');`,
`DELETE FROM logs WHERE place_id = '${TRINITY}';`,
`DELETE FROM place_sources WHERE place_id = '${TRINITY}';`,
`DELETE FROM places WHERE id = '${TRINITY}';`,'',
'-- 2) city 보강'];
let applied=0, failed=[];
for(const r of rows){ if(r.city){ L.push(`UPDATE places SET city = '${r.city.replace(/'/g,"''")}', updated_at = NOW() WHERE id = '${r.id}';  -- ${r.name} (${r.old}→${r.city})`); applied++; } else failed.push(r); }
L.push('','-- 확인: SELECT COUNT(*) FROM places WHERE city IS NULL;');
fs.writeFileSync(path.join(ROOT,'supabase/028_trinity_remove_city_backfill.sql'), L.join('\n')+'\n');

// dry-run 표
const dr=['# city 보강 dry-run (2026-06-02)','',`대상 ${rows.length} · city확정 ${applied} · 실패 ${failed.length}`,'','| 시설 | country | old→city | 비고 |','|---|---|---|---|'];
for(const r of rows) dr.push(`| ${r.name} | ${r.country} | ${r.old}→${r.city||'?'} | ${r.note} |`);
fs.writeFileSync(path.join(QA,'city-backfill-dryrun-20260602.md'), dr.join('\n')+'\n');

console.log(`\nWROTE supabase/028 + dryrun. city확정 ${applied} / 실패 ${failed.length}`);
if(failed.length) console.log('실패:', failed.map(f=>f.name).join(', '));
