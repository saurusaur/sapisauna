#!/usr/bin/env node
/**
 * katalk-db-full-audit.mjs (READ-ONLY, DB 쓰기 없음)
 * Phase 0+1: 전 places(255) 스냅샷 + DB↔Google↔Naver 전수 비교.
 * 산출:
 *   qa/db-snapshot-all-20260601.json   (롤백 기준선)
 *   qa/api-cache.json                  (Google/Naver 응답 캐시)
 *   qa/audit-flags.json                (교정 후보 구조화)
 *   katalk-db-full-audit-20260601.md   (전수 비교표 + 플래그 요약)
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'docs/research/katalk-20260519');
const QA = path.join(DIR, 'qa'); fs.mkdirSync(QA, { recursive: true });
for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) { const m = l.match(/^([^#=]+)=(.*)$/); if (m) process.env[m[1].trim()] = m[2].trim(); }
const sb = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const GKEY = process.env.GOOGLE_PLACES_API_KEY;
const NID = process.env.NAVER_CLIENT_ID, NSEC = process.env.NAVER_CLIENT_SECRET;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── 캐시 ──
const cachePath = path.join(QA, 'api-cache.json');
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const saveCache = () => fs.writeFileSync(cachePath, JSON.stringify(cache));

// ── DB 로드 ──
async function pageAll(table, sel) {
  const out = []; let from = 0; const size = 1000;
  while (true) { const { data, error } = await sb.from(table).select(sel).range(from, from + size - 1); if (error) throw error; if (!data.length) break; out.push(...data); from += size; if (data.length < size) break; }
  return out;
}
const placesRaw = await pageAll('places', 'id,facility_type,bath_policy,country_code,city,latitude,longitude,coordinate_source');
const sourcesRaw = await pageAll('place_sources', 'place_id,name_original,address_original,source,external_id');

// 스냅샷
fs.writeFileSync(path.join(QA, 'db-snapshot-all-20260601.json'), JSON.stringify({ at: new Date().toISOString(), places: placesRaw, place_sources: sourcesRaw }, null, 0));

// place 조립
const places = new Map();
for (const p of placesRaw) places.set(p.id, { ...p, names: [], addr: '', source: '', ext: '' });
for (const s of sourcesRaw) { const p = places.get(s.place_id); if (!p) continue; if (s.name_original) p.names.push(s.name_original); if (s.address_original && !p.addr) p.addr = s.address_original; if (s.source && !p.source) p.source = s.source; if (s.external_id && !p.ext) p.ext = s.external_id; }

// MATCHED place_id 태깅 (katalk 통합 CSV 이름과 매칭)
function norm(s){return (s||'').toLowerCase().replace(/[\s·,()\[\]<>#&.]/g,'');}
const SUF=['사우나','온천','스파','목욕탕','찜질방','불한증막','한증막','호텔','리조트','랜드','센터'];
function core(s){let x=norm(s);for(const u of SUF)x=x.split(norm(u)).join('');return x;}
let csvCores = new Set();
try {
  const csv = fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8').split('\n').slice(1);
  for (const line of csv){ const m=line.match(/^"([^"]*)"/); if(m){const c=core(m[1]); if(c.length>=2)csvCores.add(c);} const cm=line.match(/","([^"]*)"\s*$/); }
} catch {}

// ── 외부 검색 ──
function distM(a,b,c,d){ if([a,b,c,d].some(v=>v==null))return null; const R=6371000,t=x=>x*Math.PI/180; const dLat=t(c-a),dLng=t(d-b); const h=Math.sin(dLat/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dLng/2)**2; return Math.round(R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))); }

async function googleSearch(query, regionCode){
  const key=`g:${query}:${regionCode||''}`; if(cache[key])return cache[key];
  try{
    const body={ textQuery:query, languageCode:'ko' }; if(regionCode)body.regionCode=regionCode;
    const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':GKEY,'X-Goog-FieldMask':'places.displayName,places.formattedAddress,places.types,places.location,places.addressComponents'},body:JSON.stringify(body)});
    const j=await r.json();
    let out={ok:r.ok};
    if(j.places&&j.places[0]){ const p=j.places[0]; const country=(p.addressComponents||[]).find(c=>(c.types||[]).includes('country')); out={ok:true,name:p.displayName?.text,addr:p.formattedAddress,types:p.types||[],lat:p.location?.latitude,lng:p.location?.longitude,country:country?.shortText||null}; }
    else out={ok:r.ok,empty:true,err:j.error?.message};
    cache[key]=out; return out;
  }catch(e){ const out={ok:false,err:String(e)}; cache[key]=out; return out; }
}
async function naverSearch(query){
  const key=`n:${query}`; if(cache[key])return cache[key];
  try{
    const r=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1&sort=random`,{headers:{'X-Naver-Client-Id':NID,'X-Naver-Client-Secret':NSEC}});
    const j=await r.json(); let out={ok:r.ok};
    if(j.items&&j.items[0]){ const it=j.items[0]; out={ok:true,title:(it.title||'').replace(/<[^>]+>/g,''),category:it.category,addr:it.address,road:it.roadAddress,mapx:it.mapx,mapy:it.mapy}; }
    else out={ok:r.ok,empty:true,err:j.errorMessage};
    cache[key]=out; return out;
  }catch(e){ const out={ok:false,err:String(e)}; cache[key]=out; return out; }
}

// ── 메인 루프 ──
const all=[...places.values()];
const flags=[]; let i=0;
for(const p of all){
  i++;
  const name=p.names[0]||'';
  const isMatched = p.names.some(n=>csvCores.has(core(n)));
  // 쿼리는 이름+주소로 (city 누락 다수 → 동명이의 오매칭 방지). 주소가 위치를 고정.
  const q = (name + (p.addr?` ${p.addr}`:(p.city?` ${p.city}`:''))).trim();
  const region = p.country_code && p.country_code!=='KR' ? p.country_code : 'KR';
  const g = name ? await googleSearch(q, region) : {ok:false,empty:true};
  const n = (name && region==='KR') ? await naverSearch(name) : {ok:false,skip:region!=='KR'};
  if(i%10===0){ saveCache(); process.stdout.write(`\r  ${i}/${all.length}`); }
  await sleep(120);

  // 플래그 판정
  const f={ id:p.id, name, isMatched, db:{type:p.facility_type,country:p.country_code,city:p.city,addr:p.addr,lat:p.latitude,lng:p.longitude,coordSrc:p.coordinate_source,source:p.source,ext:p.ext}, google:g, naver:n, flags:[] };
  // Google 반환 이름이 DB 이름과 core 일치하는지 (불일치면 type/coord 비교 신뢰불가)
  const gNameOk = g.ok && !g.empty && g.name && (core(g.name).includes(core(name))||core(name).includes(core(g.name)));
  f.gNameOk = gNameOk;
  // 이름 누락
  if(!name) f.flags.push('🔴name-missing');
  // country (이름 일치 시에만 신뢰)
  if(gNameOk&&g.country&&p.country_code&&g.country!==p.country_code) f.flags.push(`🔴country DB=${p.country_code}≠G=${g.country}`);
  // 주소 공란
  if(!p.addr) f.flags.push('🔴addr-empty');
  // 좌표 (이름 일치 시에만 거리 비교)
  if(p.latitude==null||p.longitude==null) f.flags.push('🟡coord-missing');
  else if(gNameOk&&g.lat!=null){ const d=distM(p.latitude,p.longitude,g.lat,g.lng); if(d!=null&&d>500) f.flags.push(`🟡coord-far ${d}m`); }
  // external_id / city
  if(!p.ext) f.flags.push('🟡ext-id-missing');
  if(!p.city) f.flags.push('🟡city-missing');
  // facility_type 의심: Google types vs DB (이름 일치 시에만)
  if(gNameOk&&g.types){ const t=g.types;
    const hasLodging=t.includes('lodging')||t.includes('hotel');
    const hasBath=t.includes('public_bath')||t.includes('sauna')||t.includes('spa');
    if(p.facility_type==='hotel-spa'&&hasBath&&!hasLodging) f.flags.push('🟡type? DB=hotel-spa·G=public_bath/sauna');
    if(['public-bath','small-bath'].includes(p.facility_type)&&hasLodging&&!hasBath) f.flags.push('🟡type? DB=public-bath·G=lodging');
  }
  // Google 매칭 자체가 안 됨(이름 불일치) → 별도 표시(검수 보조용, 교정 아님)
  if(g.ok&&!g.empty&&!gNameOk) f.flags.push('⚪g-name-mismatch');
  if(f.flags.length) flags.push(f);
}
saveCache();
fs.writeFileSync(path.join(QA,'audit-flags.json'), JSON.stringify(flags,null,1));

// ── 리포트 ──
const counts={}; for(const f of flags)for(const fl of f.flags){const k=fl.split(' ')[0];counts[k]=(counts[k]||0)+1;}
const L=['# DB 전수 검수 (2026-06-01)','',`대상: places ${all.length}개 · MATCHED 태깅 ${all.filter(p=>p.names.some(n=>csvCores.has(core(n)))).length}`,'',`플래그 있는 place: ${flags.length} / ${all.length}`,'',`| 플래그 | 수 |`,`|---|---|`];
for(const [k,v] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) L.push(`| ${k} | ${v} |`);
L.push('','## 플래그 상세 (place별)','');
L.push('| place名 | M | DB type | DB country | DB주소 | Google(name/types/country) | Naver(category) | 플래그 |');
L.push('|---|---|---|---|---|---|---|---|');
for(const f of flags.sort((a,b)=>(b.flags.length-a.flags.length))){
  const g=f.google, n=f.naver;
  const gcol = g.ok&&!g.empty ? `${g.name||''} / ${(g.types||[]).slice(0,3).join(',')} / ${g.country||'?'}` : (g.empty?'(검색0)':'(err)');
  const ncol = n.ok&&!n.empty ? `${(n.category||'').replace(/>/g,'·')}` : (n.skip?'(해외skip)':n.empty?'(검색0)':'(err)');
  L.push(`| ${f.name||'(이름없음)'} | ${f.isMatched?'✓':''} | ${f.db.type} | ${f.db.country} | ${(f.db.addr||'').slice(0,20)||'∅'} | ${gcol} | ${ncol} | ${f.flags.join(' ')} |`);
}
fs.writeFileSync(path.join(DIR,'katalk-db-full-audit-20260601.md'), L.join('\n')+'\n');
console.log(`\nDONE places:${all.length} flagged:${flags.length}`);
console.log('flag counts:', JSON.stringify(counts));
