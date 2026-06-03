#!/usr/bin/env node
/** katalk-new-meta-final.mjs (READ-ONLY) — Step 4-0 최종 메타 고정
 * 40건: Naver 정확명 조회로 verbatim 지도명·도로명·raw mapx/mapy 확보 → external_id=mapx_mapy, 좌표.
 * city는 도로명 시/도+시/군 → 컨벤션 영문맵. is_24h는 입력맵(호텔 off 반영).
 * 산출: katalk-new-meta-final-20260603.json + .md
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const NID=process.env.NAVER_CLIENT_ID,NSEC=process.env.NAVER_CLIENT_SECRET;
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const dec=s=>(s||'').replace(/&amp;/g,'&').replace(/<[^>]+>/g,'');
// [verbatim 지도명, 조회질의(이름+지역), facility_type, is_24h]
const D=[
['강남24시사우나','강남24시사우나 파주','public-bath',true],
['스카이베이호텔 경포','스카이베이호텔 경포','hotel-premium',false],
['신라모노그램 강릉','신라모노그램 강릉','hotel-premium',false],
['서로재','서로재 고성 죽왕','hotel-premium',false],
['새광주참숯가마','새광주참숯가마','special',false],
['스페이스본휘트니스','스페이스본휘트니스 종로','public-bath',false],
['그랜드 머큐어 앰배서더 호텔 앤 레지던스 서울 용산','그랜드 머큐어 앰배서더 서울 용산','hotel-premium',false],
['그랜드 조선 제주','그랜드 조선 제주 서귀포','hotel-premium',false],
['그랜드 조선 부산','그랜드 조선 부산','hotel-premium',false],
['기린온천사우나','기린온천사우나 강릉','small-bath',false],
['쏠비치 남해','쏠비치 남해','resort-spa',false],
['네스트호텔','네스트호텔 영종','hotel-premium',false],
['홈스파월드','홈스파월드 대구 남구','public-bath',false],
['르네상스 휘트니스','르네상스 휘트니스 송파','public-bath',false],
['무한사우나','무한사우나 강서','public-bath',true],
['스파해수랑','스파해수랑 부산 서구','public-bath',false],
['수락산편백원','수락산편백원 의정부','special',false],
['수목원생활온천','수목원생활온천 달서','public-bath',false],
['수원효소힐링센터','수원효소힐링센터 팔달','special',false],
['시수하우스','시수하우스 강남','private-sauna',false],
['유사우나','유사우나 신사','public-bath',false],
['아늑 시그니처 호텔 서울 구로','아늑 시그니처 서울 구로','hotel-premium',false],
['아트리파라다이스','아트리파라다이스 용인','hotel-premium',false],
['앰배서더 서울 풀만 호텔','앰배서더 서울 풀만 호텔','hotel-premium',false],
['덕산온천탕','덕산온천탕 예산','public-bath',false],
['서울드래곤시티','서울드래곤시티','hotel-premium',false],
['원시불한증막','원시불한증막 양양','special',false],
['월곡건강랜드','월곡건강랜드 성북','public-bath',false],
['웨스틴 서울 파르나스','웨스틴 서울 파르나스','hotel-premium',false],
['이비스 스타일 앰배서더 서울 명동','이비스 스타일 앰배서더 서울 명동','hotel-premium',false],
['스파앳홈 인천공항 제1터미널점','스파앳홈 인천공항 제1터미널점','public-bath',true],
['잠실수양불한증막','잠실수양불한증막 송파','special',true],
['스파온','스파온 전주 완산','public-bath',false],
['엠버퓨어힐 호텔&리조트 제주','엠버퓨어힐 호텔 리조트 제주','hotel-premium',false],
['서울서초글램핑청계산장','서울서초글램핑청계산장','private-sauna',false],
['동궁사우나','동궁사우나 중구 다산','public-bath',true],
['파라곤스파','파라곤스파 목동','public-bath',true],
['파라다이스 호텔 부산','파라다이스 호텔 부산','hotel-premium',false],
['팔공산심천랜드','팔공산심천랜드','public-bath',false],
['포시즌스 호텔 서울','포시즌스 호텔 서울','hotel-premium',false],
];
const METRO={'서울':'Seoul','부산':'Busan','대구':'Daegu','인천':'Incheon','광주광역시':'Gwangju','대전':'Daejeon','울산':'Ulsan','세종':'Sejong'};
const SIGUN={'파주시':'Paju','강릉시':'Gangneung','고성군':'Goseong','광주시':'Gwangju-si','남해군':'Namhae','의정부시':'Uijeongbu','수원시':'Suwon','용인시':'Yongin','예산군':'Yesan','양양군':'Yangyang','전주시':'Jeonju','제주시':'Jeju','서귀포시':'Seogwipo'};
function cityFromRoad(road){
  const t=road.split(/\s+/);
  const sido=t[0]||'';
  if(sido.startsWith('서울'))return'Seoul';
  if(sido.startsWith('부산'))return'Busan';if(sido.startsWith('대구'))return'Daegu';
  if(sido.startsWith('인천'))return'Incheon';if(sido.startsWith('광주광역'))return'Gwangju';
  if(sido.startsWith('대전'))return'Daejeon';if(sido.startsWith('울산'))return'Ulsan';if(sido.startsWith('세종'))return'Sejong';
  // 도: 2번째 토큰이 시/군
  const sg=t[1]||''; if(SIGUN[sg])return SIGUN[sg];
  return sg||sido; // 폴백
}
async function naver(q){const r=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=5`,{headers:{'X-Naver-Client-Id':NID,'X-Naver-Client-Secret':NSEC}});const j=await r.json();return (j.items||[]).map(i=>({name:dec(i.title),road:i.roadAddress,cat:i.category,mapx:i.mapx,mapy:i.mapy}));}
const res=[],warn=[];
for(const [vname,q,ft,is24] of D){
  const items=await naver(q); await new Promise(s=>setTimeout(s,120));
  // verbatim 이름 정확 일치 우선
  let pick=items.find(x=>x.name===vname) || items.find(x=>x.name.replace(/\s/g,'')===vname.replace(/\s/g,''));
  if(!pick){ // 그랜드조선제주처럼 본체 미인덱싱 → 이름 포함 + 주소 매칭으로 폴백
    pick=items[0]; warn.push(`${vname}: 정확매칭 실패, top=${items[0]?.name||'무'}`);
  }
  const road=pick?.road||'';
  res.push({name:vname, road, lat:pick?+pick.mapy/1e7:null, lng:pick?+pick.mapx/1e7:null,
    external_id:pick?`${pick.mapx}_${pick.mapy}`:null, source:'naver', coordinate_source:'naver',
    city:cityFromRoad(road), facility_type:ft, is_24h:is24, naver_cat:pick?.cat||null});
}
fs.writeFileSync(path.join(DIR,'katalk-new-meta-final-20260603.json'),JSON.stringify(res,null,1));
const L=['# Step 4-0 최종 메타 (Naver verbatim·external_id=mapx_mapy·city 컨벤션) 2026-06-03','',
 '| # | 등록명 | ft | city | 24h | 도로명주소 | 좌표 | external_id |','|---|---|---|---|---|---|---|---|'];
res.forEach((r,i)=>L.push(`| ${i+1} | ${r.name} | ${r.facility_type} | ${r.city} | ${r.is_24h?'O':'-'} | ${r.road} | ${r.lat?.toFixed(5)},${r.lng?.toFixed(5)} | ${r.external_id} |`));
if(warn.length){L.push('','## ⚠️ 정확매칭 경고(수동확인)');warn.forEach(w=>L.push('- '+w));}
fs.writeFileSync(path.join(DIR,'katalk-new-meta-final-20260603.md'),L.join('\n'));
console.log(`WROTE meta-final. rows:${res.length} 경고:${warn.length}`);
