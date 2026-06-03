#!/usr/bin/env node
/**
 * katalk-name-facility-audit.mjs (READ-ONLY)
 * DB place 이름·facilities ↔ 현재 Naver 등록명/카테고리 대조.
 * 플래그: jjimjilbang 오태깅(카테고리 찜질방 아님), 이름 불일치, Naver 미발견/다른위치.
 * 산출: docs/research/katalk-20260519/katalk-name-facility-audit-20260603.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const __dirname=path.dirname(fileURLToPath(import.meta.url)); const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'docs/research/katalk-20260519'); const QA=path.join(DIR,'qa'); fs.mkdirSync(QA,{recursive:true});
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);if(m)process.env[m[1]]=m[2];}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const NID=process.env.NAVER_CLIENT_ID,NSEC=process.env.NAVER_CLIENT_SECRET;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cachePath=path.join(QA,'naver-name-cache.json');
const cache=fs.existsSync(cachePath)?JSON.parse(fs.readFileSync(cachePath,'utf8')):{};
const strip=s=>(s||'').replace(/<[^>]+>/g,'');
const norm=s=>(s||'').toLowerCase().replace(/[\s·,()\[\]<>#&.]/g,'');
const SUF=['사우나','온천','스파','목욕탕','대중목욕탕','찜질방','불한증막','한증막','호텔','리조트','랜드','센터','휘트니스','피트니스'];
const core=s=>{let x=norm(s);for(const u of SUF)x=x.split(norm(u)).join('');return x;};

async function naver(q){if(cache[q])return cache[q];try{
  const r=await fetch('https://openapi.naver.com/v1/search/local.json?query='+encodeURIComponent(q)+'&display=5',{headers:{'X-Naver-Client-Id':NID,'X-Naver-Client-Secret':NSEC}});
  const j=await r.json();const out=(j.items||[]).map(it=>({title:strip(it.title),category:it.category,road:it.roadAddress,addr:it.address}));
  cache[q]=out;return out;
}catch(e){return [];}}

async function pageAll(t,s){const o=[];let f=0;while(true){const{data,error}=await sb.from(t).select(s).range(f,f+999);if(error)throw error;if(!data.length)break;o.push(...data);f+=1000;if(data.length<1000)break;}return o;}
const places=await pageAll('places','id,facility_type,country_code,city,facilities');
const srcs=await pageAll('place_sources','place_id,name_original,address_original,source');
const sm={};for(const s of srcs){if(!sm[s.place_id])sm[s.place_id]={n:s.name_original,a:s.address_original,src:s.source};}

// 주소에서 시/구 키 추출 (Naver 결과 동일위치 판정용)
function regionKey(addr){if(!addr)return '';const m=addr.match(/(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\S*\s*(\S*[시군구])?/);return m?(m[1]+(m[2]||'')):'';}

const flags=[]; let i=0; const kr=places.filter(p=>p.country_code==='KR');
for(const p of kr){
  i++; const s=sm[p.id]||{}; const name=s.n||''; if(!name)continue;
  const res=await naver(name);
  if(i%10===0){fs.writeFileSync(cachePath,JSON.stringify(cache));process.stdout.write(`\r ${i}/${kr.length}`);}
  await sleep(110);
  const dbRegion=regionKey(s.a);
  // DB 주소 지역과 같은 지역의 결과 우선, 없으면 이름 core 일치 결과
  let best=res.find(r=>dbRegion&&regionKey(r.road||r.addr)===dbRegion) || res.find(r=>core(r.title)===core(name)) || res[0];
  const fac=p.facilities||[];
  const issues=[];
  if(!best){issues.push('🟡naver-미발견');}
  else{
    const cat=best.category||'';
    const sameRegion=dbRegion&&regionKey(best.road||best.addr)===dbRegion;
    // jjimjilbang 오태깅
    if(fac.includes('jjimjilbang')&&!/찜질/.test(cat)) issues.push(`🔴jjimjil태그+Naver카테고리="${cat}"`);
    // 이름 불일치 (같은 지역인데 이름 다름)
    if(sameRegion&&core(best.title)!==core(name)) issues.push(`🟡이름 DB"${name}"↔Naver"${best.title}"`);
    // Naver 결과가 다른 지역 (DB 위치 검증 불가)
    if(dbRegion&&!sameRegion&&!res.some(r=>regionKey(r.road||r.addr)===dbRegion)) issues.push(`🟡Naver동일지역없음(DB:${dbRegion})`);
  }
  if(issues.length)flags.push({name,pid:p.id,type:p.facility_type,src:s.src,fac,best,issues});
}
fs.writeFileSync(cachePath,JSON.stringify(cache));

flags.sort((a,b)=>{const sev=f=>f.issues.filter(x=>x.startsWith('🔴')).length*10+f.issues.length;return sev(b)-sev(a);});
const L=['# DB 이름·facilities ↔ Naver 대조 검수 (2026-06-03)','',`KR place ${kr.length} 검사 · 플래그 ${flags.length}`,'',
'🔴 jjimjilbang 오태깅(카테고리 찜질방 아님) · 🟡 이름불일치/Naver위치불일치','',
'| DB명 | type | DB facilities | Naver(명/카테고리/주소) | 이슈 |','|---|---|---|---|---|'];
for(const f of flags){const b=f.best;const nv=b?`${b.title} / ${b.category} / ${(b.road||b.addr||'').slice(0,24)}`:'(없음)';
  L.push(`| ${f.name} | ${f.type} | ${f.fac.join(',')} | ${nv} | ${f.issues.join(' ')} |`);}
fs.writeFileSync(path.join(DIR,'katalk-name-facility-audit-20260603.md'),L.join('\n')+'\n');
const jt=flags.filter(f=>f.issues.some(x=>x.startsWith('🔴'))).length;
console.log(`\n플래그 ${flags.length} (🔴jjimjil오태깅:${jt})`);
console.log('→ docs/research/katalk-20260519/katalk-name-facility-audit-20260603.md');
