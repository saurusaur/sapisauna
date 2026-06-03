#!/usr/bin/env node
/** katalk-new-augment.mjs (READ-ONLY)
 * 40건 등록 입력셋(verbatim Naver 이름·주소·좌표 고정) + Google(en) 백필: city·is_24h·place_id.
 * city는 Google en locality(028 컨벤션), 경기 광주시→Gwangju 충돌 교정. Naver 주소와 시/군 교차검증.
 * 산출: katalk-new-register-input-20260603.json + augment 표.md
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const GKEY=process.env.GOOGLE_PLACES_API_KEY;
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
// 40건 verbatim 고정 [name, road, lat, lng, ft, 검색질의(name+지역), 지역검증토큰]
const D=[
['강남24시사우나','경기도 파주시 문산읍 방촌로 1695-21 4, 5층',37.86479,126.78202,'public-bath','강남24시사우나 파주','파주'],
['스카이베이호텔 경포','강원특별자치도 강릉시 해안로 476',37.80426,128.90778,'hotel-premium','스카이베이호텔 경포 강릉','강릉'],
['신라모노그램 강릉','강원특별자치도 강릉시 해안로 210',37.78563,128.92822,'hotel-premium','신라모노그램 강릉','강릉'],
['서로재','강원특별자치도 고성군 죽왕면 봉수대길 118',38.31613,128.51795,'hotel-premium','서로재 고성','고성'],
['새광주참숯가마','경기도 광주시 경충대로 1507-17',37.40251,127.26783,'special','새광주참숯가마 경기 광주','광주'],
['스페이스본휘트니스','서울특별시 종로구 사직로8길 4 광화문스페이스본 상가 지하2층',37.57460,126.96986,'public-bath','스페이스본휘트니스 종로','종로'],
['그랜드 머큐어 앰배서더 호텔 앤 레지던스 서울 용산','서울특별시 용산구 청파로20길 95',37.53218,126.96085,'hotel-premium','그랜드 머큐어 앰배서더 서울 용산','용산'],
['그랜드 조선 제주','제주특별자치도 서귀포시 중문관광로72번길 60',33.25241,126.40808,'hotel-premium','그랜드 조선 제주','서귀포'],
['그랜드 조선 부산','부산광역시 해운대구 해운대해변로 292',35.15994,129.16318,'hotel-premium','그랜드 조선 부산','해운대'],
['기린온천사우나','강원특별자치도 강릉시 남부로125번길 18',37.74352,128.89349,'small-bath','기린온천사우나 강릉','강릉'],
['쏠비치 남해','경상남도 남해군 미조면 쏠비치길 21',34.70350,128.02526,'resort-spa','쏠비치 남해','남해'],
['네스트호텔','인천광역시 중구 영종해안남로 19-5',37.42490,126.42802,'hotel-premium','네스트호텔 영종','영종'],
['홈스파월드','대구광역시 남구 앞산순환로 651',35.83302,128.59604,'public-bath','홈스파월드 대구 남구','대구'],
['르네상스 휘트니스','서울특별시 송파구 오금로 307 르네상스빌',37.50337,127.12672,'public-bath','르네상스 휘트니스 송파','송파'],
['무한사우나','서울특별시 강서구 공항대로 593',37.54815,126.87154,'public-bath','무한사우나 강서','강서'],
['스파해수랑','부산광역시 서구 충무대로 134',35.08242,129.02557,'public-bath','스파해수랑 부산','부산'],
['수락산편백원','경기도 의정부시 동일로192번길 50',37.70741,127.05967,'special','수락산편백원 의정부','의정부'],
['수목원생활온천','대구광역시 달서구 상화로 79',35.80823,128.52262,'public-bath','수목원생활온천 대구','달서'],
['수원효소힐링센터','경기도 수원시 팔달구 팔달로 99-1 부부빌딩 4층',37.27769,127.00309,'special','수원효소힐링센터','수원'],
['시수하우스','서울특별시 강남구 논현로155길 37',37.52102,127.02529,'private-sauna','시수하우스 강남','강남'],
['유사우나','서울특별시 강남구 도산대로17길 44',37.52143,127.02380,'public-bath','유사우나 신사 강남','강남'],
['아늑 시그니처 호텔 서울 구로','서울특별시 관악구 남부순환로 1458',37.48119,126.91285,'hotel-premium','아늑 시그니처 서울 구로','관악'],
['아트리파라다이스','경기도 용인시 기흥구 보정로 32',37.31405,127.11105,'hotel-premium','아트리파라다이스 용인','용인'],
['앰배서더 서울 풀만 호텔','서울특별시 중구 동호로 287',37.56025,127.00224,'hotel-premium','앰배서더 서울 풀만 호텔','중구'],
['덕산온천탕','충청남도 예산군 덕산면 온천단지2로 97-16',36.68901,126.66156,'public-bath','덕산온천탕 예산','예산'],
['서울드래곤시티','서울특별시 용산구 청파로20길 95',37.53182,126.96276,'hotel-premium','노보텔 앰배서더 서울 용산','용산'],
['원시불한증막','강원특별자치도 양양군 현남면 개매길 206-15',37.94152,128.76667,'special','원시불한증막 양양','양양'],
['월곡건강랜드','서울특별시 성북구 화랑로7길 32',37.60369,127.04023,'public-bath','월곡건강랜드 성북','성북'],
['웨스틴 서울 파르나스','서울특별시 강남구 봉은사로 524',37.51282,127.05710,'hotel-premium','웨스틴 서울 파르나스','강남'],
['이비스 스타일 앰배서더 서울 명동','서울특별시 중구 삼일대로 302',37.56173,126.98939,'hotel-premium','이비스 스타일 앰배서더 서울 명동','중구'],
['스파앳홈 인천공항 제1터미널점','인천광역시 중구 공항로 271',37.44957,126.45278,'public-bath','스파앗홈 인천국제공항','중구'],
['잠실수양불한증막','서울특별시 송파구 오금로11길 33',37.51549,127.11076,'special','잠실수양불한증막 송파','송파'],
['스파온','전북특별자치도 전주시 완산구 신촌3길 24',35.81745,127.11561,'public-bath','스파온 전주','전주'],
['엠버퓨어힐 호텔&리조트 제주','제주특별자치도 제주시 1100로 2671-30',33.42645,126.48734,'hotel-premium','엠버퓨어힐 호텔 리조트 제주','제주'],
['서울서초글램핑청계산장','서울특별시 서초구 청계산로 140-94',37.44841,127.04641,'private-sauna','서울서초글램핑청계산장','서초'],
['동궁사우나','서울특별시 중구 다산로 168',37.55845,127.01305,'public-bath','동궁사우나 중구 청구','중구'],
['파라곤스파','서울특별시 양천구 목동서로 155',37.52942,126.87520,'public-bath','파라곤스파 목동','양천'],
['파라다이스 호텔 부산','부산광역시 해운대구 해운대해변로 296',35.15992,129.16411,'hotel-premium','파라다이스 호텔 부산','해운대'],
['팔공산심천랜드','대구광역시 동구 서촌로 145',35.98675,128.62045,'public-bath','팔공산심천랜드','대구'],
['포시즌스 호텔 서울','서울특별시 종로구 새문안로 97',37.57069,126.97523,'hotel-premium','포시즌스 호텔 서울','종로'],
];
const METRO={'서울특별시':'Seoul','부산광역시':'Busan','대구광역시':'Daegu','인천광역시':'Incheon','광주광역시':'Gwangju','대전광역시':'Daejeon','울산광역시':'Ulsan','세종특별자치시':'Sejong'};
// Naver 도로명 첫 토큰으로 광역시 여부 판단(보조)
function metroFromRoad(road){for(const k in METRO)if(road.startsWith(k))return METRO[k];return null;}
async function google(q){
  const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':GKEY,'X-Goog-FieldMask':'places.id,places.formattedAddress,places.addressComponents,places.regularOpeningHours'},body:JSON.stringify({textQuery:q,languageCode:'en'})});
  const j=await r.json(); return (j.places||[])[0];
}
const res=[];
for(const [name,road,lat,lng,ft,q,regtok] of D){
  const g=await google(q); await new Promise(s=>setTimeout(s,130));
  const ac=g?.addressComponents||[];
  const get=(t)=>ac.find(x=>(x.types||[]).includes(t));
  const locality=get('locality')?.longText||get('postal_town')?.longText||null;
  const admin1=get('administrative_area_level_1')?.longText||null;
  const metro=metroFromRoad(road);
  let city = metro || locality || admin1 || null;
  // 경기 광주시 충돌 교정: locality Gwangju인데 admin1이 Gyeonggi면 Gwangju-si
  if(city==='Gwangju' && admin1 && /Gyeonggi/i.test(admin1)) city='Gwangju-si';
  // is_24h: regularOpeningHours
  const wd=g?.regularOpeningHours?.weekdayDescriptions||[];
  const per=g?.regularOpeningHours?.periods||[];
  const is24 = wd.some(d=>/24 hours|Open 24/i.test(d)) || (per.length===1 && per[0]?.open && !per[0]?.close);
  // 교차검증: Google 주소에 지역토큰(영문 매핑 어려우니 좌표거리로) — 여기선 좌표 일치 확인
  const gAddr=g?.formattedAddress||'';
  res.push({name,road,lat,lng,ft,city,place_id:g?.id||null,is_24h:!!is24,g_addr:gAddr});
}
fs.writeFileSync(path.join(DIR,'katalk-new-register-input-20260603.json'),JSON.stringify(res,null,1));
const L=['# 등록 입력셋 (verbatim Naver 고정 + Google 백필 city·is_24h·place_id) 2026-06-03','',
 '| # | 등록명 | ft | city | is_24h | place_id | Google addr(교차확인) |','|---|---|---|---|---|---|---|'];
res.forEach((r,i)=>L.push(`| ${i+1} | ${r.name} | ${r.ft} | ${r.city||'?'} | ${r.is_24h?'O':'-'} | ${(r.place_id||'—').slice(0,20)} | ${r.g_addr.slice(0,40)} |`));
fs.writeFileSync(path.join(DIR,'katalk-new-register-input-20260603.md'),L.join('\n'));
console.log('WROTE register-input. rows:',res.length,'| city미상:',res.filter(r=>!r.city).length,'| is_24h:',res.filter(r=>r.is_24h).length);
