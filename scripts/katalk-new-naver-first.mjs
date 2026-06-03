#!/usr/bin/env node
/** katalk-new-naver-first.mjs (READ-ONLY)
 * 국내 정책: ①Naver 지도명(지역한정 조회로 동명이의 방지) → ②Google로 주소·좌표·place_id 백필.
 * 추출후보 ↔ Naver ↔ Google 투명 비교표. 산출: katalk-new-naver-first-20260603.md
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const NID=process.env.NAVER_CLIENT_ID,NSEC=process.env.NAVER_CLIENT_SECRET,GKEY=process.env.GOOGLE_PLACES_API_KEY;
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
// 최종 40: [추출후보명, 등록예정 Naver검색명, 지역힌트(동명이의 방지), 추출지역(원본)]
const F=[
 ['#파주강남24시','강남24시사우나','파주','경기파주'],
 ['강릉 스카이베이 사우나','스카이베이호텔 경포','강릉','강릉'],
 ['강릉 신라모노그램 레지던스 스파 파빌리온','신라모노그램 강릉','강릉','강릉'],
 ['고성 서로재','서로재','고성 죽왕면','강원고성'],
 ['광주 숯가마','새광주참숯가마','경기 광주','경광주'],
 ['광화문 스페이스본','스페이스본휘트니스','종로 광화문','서울'],
 ['그랜드 머큐어 용산 사우나','그랜드 머큐어 앰배서더 서울 용산','용산','서울'],
 ['그랜드조선 제주','그랜드 조선 제주','서귀포 중문','제주'],
 ['그랜드조선부산','그랜드 조선 부산','해운대','부산'],
 ['기린온천사우나','기린온천사우나','강릉 노암동','강릉'],
 ['남해 쏠비치 사우나','쏠비치 남해','남해','남해'],
 ['네스트호텔 사우나','네스트호텔','인천 영종','인천'],
 ['대구 홈스파월드','홈스파월드','대구 남구','대구'],
 ['르네상스휘트니스사우나','르네상스휘트니스','송파 오금','서울송파'],
 ['무한사우나','무한사우나','강서 공항대로','서울'],
 ['부산 송도 스파 해수랑','스파해수랑','부산 서구','부산'],
 ['수락산편백원','수락산편백원','의정부','경기'],
 ['수목원생활온천','수목원생활온천','대구 달서','대구'],
 ['수원효소힐링센터','수원효소힐링센터','수원 팔달','경기'],
 ['시수하우스','시수하우스','강남 논현','서울'],
 ['신사 유사우나','유사우나','강남 신사','서울'],
 ['아늑 시그니처 호텔 구로 루프 사우나','아늑 시그니처 서울 구로','관악','서울'],
 ['아트리파라다이스','아트리파라다이스','용인 기흥 보정','용인'],
 ['엠버서더 풀만 사우나','앰배서더 서울 풀만 호텔','중구 장충','서울'],
 ['예산 덕산 온천탕','덕산온천탕','예산 덕산면 온천단지','예산'],
 ['용산 드래곤시티','서울드래곤시티','용산','서울'],
 ['원시불한증막','원시불한증막','양양 현남','강원양양'],
 ['월곡건강랜드','월곡건강랜드','성북 월곡','서울'],
 ['웨스틴서울 파르나스','웨스틴 서울 파르나스','강남 삼성','서울'],
 ['이비스 스타일 앰배서더 명동 노천탕','이비스 스타일 앰배서더 서울 명동','중구 명동','서울'],
 ['인천공항 사우나 (스파엣홈)','스파앳홈 인천공항 제1터미널점','인천공항 제1터미널','인천'],
 ['잠실수양불한증막 사우나','잠실수양불한증막','송파 오금','서울'],
 ['전주 스파온','스파온','전주 완산','전주'],
 ['제주 엠버퓨어힐 사우나','엠버 퓨어힐 호텔 앤 리조트 제주','제주 노형','제주'],
 ['청계산글램핑장 뇨끼사우나','서울서초글램핑청계산장','서초 청계산','서울'],
 ['청구역 동궁사우나','동궁사우나','중구 청구','서울'],
 ['파라곤','파라곤스파','양천 목동','목동'],
 ['파라다이스 부산','파라다이스 호텔 부산','해운대','부산'],
 ['팔공산 심천랜드','심천랜드','대구 동구 팔공산','대구'],
 ['포시즌스','포시즌스 호텔 서울','종로 광화문','서울'],
];
async function naver(q){const r=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=3`,{headers:{'X-Naver-Client-Id':NID,'X-Naver-Client-Secret':NSEC}});const j=await r.json();return (j.items||[]).map(i=>({name:(i.title||'').replace(/<[^>]+>/g,''),addr:i.roadAddress||i.address,cat:i.category,mapx:+i.mapx,mapy:+i.mapy}));}
async function google(q){const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':GKEY,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location'},body:JSON.stringify({textQuery:q,languageCode:'ko'})});const j=await r.json();return (j.places||[])[0];}
const out=['# Step 4-0 재조회 — Naver 지도명 우선 + Google 백필 (read-only) 2026-06-03','',
 '방식: Naver를 지역한정 조회→지도명 확정 / 그 이름으로 Google 조회→주소·좌표·place_id 백필.','',
 '| # | 추출후보(원본/지역) | Naver 지도명 | Naver 주소 | Google 백필 주소 | 좌표(G) | place_id | 플래그 |',
 '|---|---|---|---|---|---|---|---|'];
let i=0;
for(const [src,qname,hint,srcReg] of F){ i++;
  const nv=(await naver(`${qname} ${hint}`)); await new Promise(s=>setTimeout(s,110));
  let top=nv[0];
  // 지역힌트 토큰이 주소에 없으면 hint 없는 쿼리도 시도
  if(!top){const n2=await naver(qname);await new Promise(s=>setTimeout(s,110));top=n2[0];}
  const nname=top?.name||'(무)', naddr=top?.addr||'—';
  // Google 백필: Naver 지도명(있으면)으로
  const g=await google(`${nname!=='(무)'?nname:qname} ${hint}`); await new Promise(s=>setTimeout(s,110));
  const gaddr=g?.formattedAddress||'—', glat=g?.location?.latitude, glng=g?.location?.longitude, gid=g?.id||'—';
  // 플래그: Naver명에 등록예정 핵심토큰 포함?
  const core=qname.replace(/\s/g,'').slice(0,3);
  const nameOk=nname!=='(무)'&&nname.replace(/\s/g,'').includes(core.slice(0,2));
  const flag=nname==='(무)'?'🔴Naver무결과':(nameOk?'✅':'⚠️이름확인');
  out.push(`| ${i} | ${src} / ${srcReg} | ${nname} | ${naddr} | ${gaddr} | ${glat?glat.toFixed(4)+','+glng.toFixed(4):'—'} | ${gid.slice(0,18)} | ${flag} |`);
}
fs.writeFileSync(path.join(DIR,'katalk-new-naver-first-20260603.md'),out.join('\n'));
console.log('WROTE naver-first table. rows:',i);
