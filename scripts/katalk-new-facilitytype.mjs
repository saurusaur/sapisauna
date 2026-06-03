#!/usr/bin/env node
/** katalk-new-facilitytype.mjs (READ-ONLY)
 * 최종 40 NEW(=48 −5 DB중복 −3 병합) + facility_type 제안 + jjim/temp 매핑 표시.
 * 산출: katalk-new-facilitytype-20260603.md
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const G=JSON.parse(fs.readFileSync(path.join(DIR,'katalk-new-geocode-20260602.json'),'utf8'));
// 제외(이미 DB, →enrich): katalk명 기준
const DBDUPE=new Set(['경주 더케이호텔 사우나','부산 국제온천','산정호수 한화리조트 온천','이촌동 리버사우나','제주 오레브 핫스프링 & 스파']);
// 병합: 흡수되는 쪽(katalk명) → 대표 katalk명
const MERGE={'스카이베이 사우나':'강릉 스카이베이 사우나','신라모노그램호텔사우나':'강릉 신라모노그램 레지던스 스파 파빌리온','용산 드래곤머큐어 호텔 사우나':'그랜드 머큐어 용산 사우나'};
const rows=G.filter(r=>!DBDUPE.has(r.katalk)&&!MERGE[r.katalk]);
// facility_type 제안 규칙
const LUX=/호텔|HOTEL|Hotel|리조트|Resort|팰리스|조선|힐튼|Hilton|머큐어|Mercure|노보텔|Novotel|웨스틴|Westin|포시즌|Four Seasons|풀만|Pullman|앰배서더|소노캄|쏠비치|네스트|파라다이스|아만|그랜드|신라모노그램|스카이베이|드래곤|엠버/;
const KILN=/숯가마|한증막|불한증막|불가마|효소|편백원/;
const WATER=/워터파크|아쿠아필드|테르메|워터킹덤|씨메르/;
const GYM=/휘트니스|피트니스|fitness|gym/i;
const PRIV=/시수하우스|솔로사우나|글램핑|뇨끼|프라이빗/;
function propose(r){
  const n=r.name+' '+(r.g.name||''); const t=r.g.types||'';
  if(KILN.test(n))return['special','한증막/숯가마/효소 → jjim_temp'];
  if(WATER.test(n))return['resort-spa','메가 데이온천/워터파크'];
  if(PRIV.test(n))return['private-sauna','개인/프라이빗 사우나'];
  if(GYM.test(n))return['public-bath','휘트니스 사우나(gym-sauna UI제외→public-bath?)'];
  if(LUX.test(n)||/hotel|resort_hotel|lodging/.test(t))return['hotel-premium','호텔/리조트'];
  return['public-bath','대중탕/사우나'];
}
const L=['# Phase 4 최종 40 + facility_type 제안 (read-only)','',
 `48 −5(DB중복→enrich) −3(병합) = ${rows.length}건. 제안은 Google types+이름 휴리스틱 → 유저 확정 필요.`,'',
 '| # | 시설(정식명) | city | Google types | 제안 facility_type | 비고/온도매핑 |','|---|---|---|---|---|---|'];
let i=0;
for(const r of rows){i++;const[ft,why]=propose(r);
  const nm=r.g.name||r.name;
  L.push(`| ${i} | ${nm} | ${r.city||'?'} | ${(r.g.types||'').slice(0,32)} | **${ft}** | ${why} |`);}
// 병합/제외 안내
L.push('','## 병합 3쌍 (대표로 흡수, 카톡 데이터 합산)','- 강릉 스카이베이 ← 스카이베이 사우나','- 강릉 신라모노그램 ← 신라모노그램호텔사우나','- 그랜드 머큐어 용산 ← 용산 드래곤머큐어');
L.push('','## DB중복 5건 (등록 제외 → enrich 트랙)','- 더케이호텔경주·국제광천수온천·한화리조트 산정호수·리버사우나·오레브');
L.push('','## ⚠️ 이름/정체 추가확인 (등록 전)','- 광주 숯가마(Google=경기광주 참숯/Naver=두레건강랜드)·파라곤(목동파라곤 아파트?)·스파앗홈 T1(Google이 T2매칭=중복위험)');
const dist={}; for(const r of rows){const[ft]=propose(r);dist[ft]=(dist[ft]||0)+1;}
L.push('',`제안 분포: ${Object.entries(dist).map(([k,v])=>k+':'+v).join(' · ')}`);
fs.writeFileSync(path.join(DIR,'katalk-new-facilitytype-20260603.md'),L.join('\n'));
console.log('WROTE facilitytype. rows:',rows.length,'분포:',JSON.stringify(dist));
