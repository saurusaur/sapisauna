#!/usr/bin/env node
/** katalk-overseas-geocode.mjs (READ-ONLY)
 * Phase 4b — 해외 신규 16건 Google Place Details(place_id 직접 조회).
 * fields: displayName(en)·location·formattedAddress·addressComponents·types
 * city 규칙: locality(en) / 도쿄 23특별구(admin1=Tokyo)→'Tokyo' 롤업(address-builder.ts와 동일).
 * 쓰기 없음. 산출: docs/research/katalk-20260519/overseas-geocode-20260604.json + .md
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const GKEY=process.env.GOOGLE_PLACES_API_KEY;
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// 신규 16건 (카톡표기 → place_id) — 기존 7건(시드 등록)은 제외
const NEW=[
 ['나미하노유','ChIJtYA3dfGRQTURBG0df0WDEWY'],
 ['쓰루가메유','ChIJ78VulL2RQTURnqhAovm6orw'],
 ['세이류온천','ChIJb3BiRjyWQTUR8hgJtgmS6SM'],
 ['코코로노','ChIJqV7Vu2NkdV8Ruvk2lW5vjWc'],
 ['코노스미카','ChIJmVRU6GPjn18RTwGipnd8nXw'],
 ['토토켄','ChIJ18MimQWJGGAR4CZsF4oew6w'],
 ['이나리유','ChIJizJFXmSNGGAR6wH0thtct5A'],
 ['마에다유','ChIJVVOESaGSGGARuRAPYMZ4gKo'],
 ['우메유','ChIJmS92XhSMGGARdZKYOzcqsDI'],
 ['하기노유','ChIJIWPdM4GOGGAROBg4zlnJUXA'],
 ['fuua','ChIJx4Zhi6G_GWARq0cYKDEXR4M'],
 ['카마타온센','ChIJbZkvPfZgGGARH51c9E8goxc'],
 ['91도사우나','ChIJX4yhDQCLGGARvRZ2x_HUhR4'],
 ['아만도쿄','ChIJfV9KdPiLGGARn4ma2GUEoJo'],
 ['메도우드','ChIJNcxd_wxahIARa5OuTiYaI3E'],
 ['홍콩리젠트','ChIJAAAAAOwABDQRP_PjmMCBYQo'],
];

function deriveCity(comps){
  const get=(t)=>comps.find(c=>c.types.includes(t))?.longText||null;
  const admin1=get('administrative_area_level_1');
  const cc=comps.find(c=>c.types.includes('country'))?.shortText||null;
  let city=get('locality')||get('postal_town')||null;
  if(cc==='JP' && admin1==='Tokyo') city='Tokyo'; // 23특별구 롤업
  return {city,admin1,cc};
}

const out=[];
for(const [tag,pid] of NEW){
  const url=`https://places.googleapis.com/v1/places/${pid}?languageCode=en&fields=id,displayName,location,formattedAddress,addressComponents,types`;
  const res=await fetch(url,{headers:{'X-Goog-Api-Key':GKEY}});
  if(!res.ok){out.push({tag,pid,error:`HTTP ${res.status}`});await sleep(200);continue;}
  const j=await res.json();
  const {city,admin1,cc}=deriveCity(j.addressComponents||[]);
  out.push({tag,pid,
    name:j.displayName?.text||null,
    name_lang:j.displayName?.languageCode||null,
    road:j.formattedAddress||null,
    lat:j.location?.latitude??null, lng:j.location?.longitude??null,
    city, admin1, country_code:cc, types:j.types||[]});
  await sleep(200);
}

fs.writeFileSync(path.join(DIR,'overseas-geocode-20260604.json'),JSON.stringify(out,null,1));
const L=['# 해외 16건 Google geocode 2026-06-04','',
 '| 카톡 | displayName(en) | city | admin1 | cc | lat | lng | types |',
 '|---|---|---|---|---|---|---|---|'];
for(const r of out){
  if(r.error){L.push(`| ${r.tag} | ERR ${r.error} | | | | | | |`);continue;}
  L.push(`| ${r.tag} | ${r.name} | ${r.city} | ${r.admin1} | ${r.country_code} | ${r.lat?.toFixed(5)} | ${r.lng?.toFixed(5)} | ${r.types.join(',')} |`);
}
fs.writeFileSync(path.join(DIR,'overseas-geocode-20260604.md'),L.join('\n'));
console.log(`geocode rows: ${out.length} / err: ${out.filter(r=>r.error).length}`);
console.log('lang!=en:', out.filter(r=>r.name_lang&&r.name_lang!=='en').map(r=>`${r.tag}(${r.name_lang})`).join(', ')||'none');
