#!/usr/bin/env node
/** katalk-new-final-lookup.mjs (READ-ONLY)
 * 40건: Naver를 [지역+분류 필터]로 올바른 엔티티 선택 → verbatim 지도명·도로명주소·좌표.
 * Google place_id 백필. 추측 없이 API 원문만. 산출: katalk-new-final-lookup-20260603.md + .json
 * 분류 화이트리스트(목욕탕/사우나/찜질방/온천/스파/호텔)에 안 맞거나 지역토큰 불일치 → 🔴수동.
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const NID=process.env.NAVER_CLIENT_ID,NSEC=process.env.NAVER_CLIENT_SECRET,GKEY=process.env.GOOGLE_PLACES_API_KEY;
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const dec=s=>(s||'').replace(/&amp;/g,'&').replace(/<[^>]+>/g,'');
// [추출후보, Naver검색질의, 지역키토큰(주소포함검증), facility_type]
const F=[
 ['#파주강남24시','강남24시사우나 파주','파주','public-bath'],
 ['강릉 스카이베이 사우나','스카이베이호텔 경포','강릉','hotel-premium'],
 ['강릉 신라모노그램','신라모노그램 강릉','강릉','hotel-premium'],
 ['고성 서로재','서로재 고성','고성','hotel-premium'],
 ['광주 숯가마','새광주참숯가마','광주시','special'],
 ['광화문 스페이스본','스페이스본휘트니스','종로','public-bath'],
 ['그랜드 머큐어 용산','그랜드 머큐어 앰배서더 서울 용산','용산','hotel-premium'],
 ['그랜드조선 제주','그랜드 조선 제주','서귀포','hotel-premium'],
 ['그랜드조선부산','그랜드 조선 부산','해운대','hotel-premium'],
 ['기린온천사우나','기린온천사우나 강릉','강릉','small-bath'],
 ['남해 쏠비치','쏠비치 남해','남해','resort-spa'],
 ['네스트호텔','네스트호텔 인천 영종','중구','hotel-premium'],
 ['대구 홈스파월드','홈스파월드 대구','대구','public-bath'],
 ['르네상스휘트니스사우나','르네상스휘트니스 송파','송파','public-bath'],
 ['무한사우나','무한사우나 강서','강서','public-bath'],
 ['부산 송도 스파 해수랑','스파해수랑 부산','서구','public-bath'],
 ['수락산편백원','수락산편백원 의정부','의정부','special'],
 ['수목원생활온천','수목원생활온천 대구','달서','public-bath'],
 ['수원효소힐링센터','수원효소힐링센터','수원','special'],
 ['시수하우스','시수하우스 강남','강남','private-sauna'],
 ['신사 유사우나','유사우나 신사','강남','public-bath'],
 ['아늑 시그니처 구로','아늑 시그니처 서울 구로','관악','hotel-premium'],
 ['아트리파라다이스','아트리파라다이스 용인','용인','hotel-premium'],
 ['엠버서더 풀만','앰배서더 서울 풀만 호텔','중구','hotel-premium'],
 ['예산 덕산 온천탕','덕산온천탕 예산','예산','public-bath'],
 ['용산 드래곤시티','서울드래곤시티 용산','용산','hotel-premium'],
 ['원시불한증막','원시불한증막 양양','양양','special'],
 ['월곡건강랜드','월곡건강랜드 성북','성북','public-bath'],
 ['웨스틴서울 파르나스','웨스틴 서울 파르나스','강남','hotel-premium'],
 ['이비스 명동 노천탕','이비스 스타일 앰배서더 서울 명동','중구','hotel-premium'],
 ['인천공항 스파엣홈','스파앳홈 인천공항 제1터미널점','중구','public-bath'],
 ['잠실수양불한증막','잠실수양불한증막 송파','송파','special'],
 ['전주 스파온','스파온 전주','전주','public-bath'],
 ['제주 엠버퓨어힐','엠버퓨어힐 호텔&리조트 제주','제주시','hotel-premium'],
 ['청계산글램핑 뇨끼사우나','서울서초글램핑청계산장','서초','private-sauna'],
 ['청구역 동궁사우나','동궁사우나 중구','중구','public-bath'],
 ['파라곤','파라곤스파 목동','양천','public-bath'],
 ['파라다이스 부산','파라다이스 호텔 부산','해운대','hotel-premium'],
 ['팔공산 심천랜드','팔공산심천랜드','대구','public-bath'],
 ['포시즌스','포시즌스 호텔 서울','종로','hotel-premium'],
];
const OK_CAT=/목욕탕|사우나|찜질방|온천|스파|호텔|리조트|펜션|관광호텔|숙박/;
async function naver(q){const r=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=5`,{headers:{'X-Naver-Client-Id':NID,'X-Naver-Client-Secret':NSEC}});const j=await r.json();return (j.items||[]).map(i=>({name:dec(i.title),road:i.roadAddress,jibun:i.address,cat:i.category,lat:+i.mapy/1e7,lng:+i.mapx/1e7}));}
async function google(q){const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':GKEY,'X-Goog-FieldMask':'places.id,places.formattedAddress,places.location'},body:JSON.stringify({textQuery:q,languageCode:'ko'})});const j=await r.json();return (j.places||[])[0];}
const res=[];
for(const [src,q,regtok,ft] of F){
  const items=await naver(q); await new Promise(s=>setTimeout(s,110));
  // 분류 화이트리스트 + 지역토큰 주소포함 으로 올바른 엔티티 선택
  let pick=items.find(x=>OK_CAT.test(x.cat||'')&&((x.road||'')+(x.jibun||'')).includes(regtok));
  if(!pick)pick=items.find(x=>OK_CAT.test(x.cat||''));
  let flag=pick?'✅':'🔴수동';
  if(pick&&!((pick.road||'')+(pick.jibun||'')).includes(regtok))flag='⚠️지역확인';
  const g=pick?await google(`${pick.name} ${regtok}`):null; if(pick)await new Promise(s=>setTimeout(s,110));
  res.push({src,naver_name:pick?.name||null,road:pick?.road||null,cat:pick?.cat||null,lat:pick?.lat,lng:pick?.lng,
    g_addr:g?.formattedAddress||null,g_id:g?.id||null,ft,flag});
}
fs.writeFileSync(path.join(DIR,'katalk-new-final-lookup-20260603.json'),JSON.stringify(res,null,1));
const L=['# Step 4-0 최종 — Naver 지도명(분류+지역 필터로 올바른 엔티티 선택, verbatim) 2026-06-03','',
 '추측 없음. Naver 분류 화이트리스트(목욕탕/사우나/찜질방/온천/스파/호텔)+지역토큰 일치로 선택.','',
 '| # | 추출후보 | Naver 지도명(verbatim) | 도로명주소 | 분류 | 좌표 | ft | 플래그 |','|---|---|---|---|---|---|---|---|'];
res.forEach((r,i)=>L.push(`| ${i+1} | ${r.src} | ${r.naver_name||'(무)'} | ${r.road||'—'} | ${(r.cat||'').split('>').pop()} | ${r.lat?r.lat.toFixed(5)+','+r.lng.toFixed(5):'—'} | ${r.ft} | ${r.flag} |`));
const bad=res.filter(r=>r.flag!=='✅').length;
L.push('',`✅ ${res.length-bad} / 확인필요 ${bad}`);
fs.writeFileSync(path.join(DIR,'katalk-new-final-lookup-20260603.md'),L.join('\n'));
console.log(`WROTE final-lookup. ✅${res.length-bad} 확인필요${bad}`);
