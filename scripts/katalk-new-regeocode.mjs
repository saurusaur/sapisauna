#!/usr/bin/env node
/** katalk-new-regeocode.mjs (READ-ONLY) — Step 4-0
 * 최종 40건 정식명(교정 반영)으로 Naver 재지오코딩(좌표·주소·external_id) + DB 프록시미티 재확인.
 * 산출: katalk-new-regeocode-20260603.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const NID=process.env.NAVER_CLIENT_ID,NSEC=process.env.NAVER_CLIENT_SECRET,GKEY=process.env.GOOGLE_PLACES_API_KEY;
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const G=JSON.parse(fs.readFileSync(path.join(DIR,'katalk-new-geocode-20260602.json'),'utf8'));
const DBDUPE=new Set(['경주 더케이호텔 사우나','부산 국제온천','산정호수 한화리조트 온천','이촌동 리버사우나','제주 오레브 핫스프링 & 스파']);
const MERGE={'스카이베이 사우나':1,'신라모노그램호텔사우나':1,'용산 드래곤머큐어 호텔 사우나':1};
// 정식명 교정 (flagged + 기린)
const RENAME={
  '#파주강남24시':'강남24시사우나','광주 숯가마':'새광주참숯가마','파라곤':'파라곤스파',
  '인천공항 사우나 (스파엣홈)':'스파앳홈 인천공항 제1터미널점','광화문 스페이스본':'스페이스본휘트니스',
  '웨스틴서울 파르나스':'웨스틴 서울 파르나스','아늑 시그니처 호텔 구로 루프 사우나':'아늑 시그니처 서울 구로 루프 사우나',
  '예산 덕산 온천탕':'덕산온천탕','청계산글램핑장 뇨끼사우나':'서울서초글램핑청계산장','기린온천사우나':'기린온천사우나',
};
const FT={ // facility_type 확정 (요약; 상세는 decisions doc)
  '강남24시사우나':'public-bath','강릉 스카이베이 사우나':'hotel-premium','강릉 신라모노그램 레지던스 스파 파빌리온':'hotel-premium',
  '경주 더케이호텔 사우나':'-','고성 서로재':'hotel-premium','새광주참숯가마':'special','스페이스본휘트니스':'public-bath',
  '그랜드 머큐어 용산 사우나':'hotel-premium','그랜드조선 제주':'hotel-premium','그랜드조선부산':'hotel-premium','기린온천사우나':'small-bath',
  '남해 쏠비치 사우나':'resort-spa','네스트호텔 사우나':'hotel-premium','대구 홈스파월드':'public-bath','르네상스휘트니스사우나':'public-bath',
  '무한사우나':'public-bath','부산 송도 스파 해수랑':'public-bath','수락산편백원':'special','수목원생활온천':'public-bath',
  '수원효소힐링센터':'special','시수하우스':'private-sauna','신사 유사우나':'public-bath','아늑 시그니처 호텔 구로 루프 사우나':'hotel-premium',
  '아트리파라다이스':'hotel-premium','엠버서더 풀만 사우나':'hotel-premium','덕산온천탕':'public-bath','용산 드래곤시티':'hotel-premium',
  '원시불한증막':'special','월곡건강랜드':'public-bath','웨스틴서울 파르나스':'hotel-premium','이비스 스타일 앰배서더 명동 노천탕':'hotel-premium',
  '스파앳홈 인천공항 제1터미널점':'public-bath','잠실수양불한증막 사우나':'special','전주 스파온':'public-bath','제주 엠버퓨어힐 사우나':'hotel-premium',
  '조선팰리스 강남 사우나':'-','청계산글램핑장 뇨끼사우나':'private-sauna','청구역 동궁사우나':'public-bath','파라곤':'public-bath',
  '파라다이스 부산':'hotel-premium','팔공산 심천랜드':'public-bath','포시즌스':'hotel-premium',
};
const rows=G.filter(r=>!DBDUPE.has(r.katalk)&&!MERGE[r.katalk]);
async function naver(q){const r=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=3`,{headers:{'X-Naver-Client-Id':NID,'X-Naver-Client-Secret':NSEC}});const j=await r.json();return (j.items||[]).map(i=>({name:(i.title||'').replace(/<[^>]+>/g,''),addr:i.roadAddress||i.address,cat:i.category,mapx:+i.mapx,mapy:+i.mapy}));}
// DB 좌표(프록시미티)
const places=[]; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,latitude,longitude').range(f,f+999);if(!data?.length)break;places.push(...data);if(data.length<1000)break;}
const dist=(a,b,c,d)=>{const R=6371000,t=x=>x*Math.PI/180;const h=Math.sin(t(c-a)/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(t(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
const out=['# Step 4-0 재지오코딩 (Naver, read-only) 2026-06-03','',`최종 40건. 정식명 교정 반영. 좌표=Naver WGS84(mapx/1e7).`,'',
 '| # | 등록명(교정) | ft | Naver 매칭명 | 주소 | 좌표 | DB최근접 | 신뢰 |','|---|---|---|---|---|---|---|---|'];
let i=0;
for(const r of rows){i++;
  const reg=RENAME[r.katalk]||r.name; const ft=FT[reg]||FT[r.katalk]||'?';
  const nv=await naver(reg); await new Promise(s=>setTimeout(s,120));
  const top=nv[0];
  let lat=null,lng=null,addr='',mname='',nearest='—';
  if(top){lat=top.mapy/1e7;lng=top.mapx/1e7;addr=top.addr;mname=top.name;
    let best=null;for(const p of places){if(p.latitude==null)continue;const dd=dist(lat,lng,+p.latitude,+p.longitude);if(dd<150&&(!best||dd<best))best=dd;}
    if(best!=null)nearest=`⚠️${Math.round(best)}m`;}
  const conf=top&&mname.replace(/\s/g,'').includes(reg.replace(/\s/g,'').slice(0,3))?'HIGH':(top?'MED':'LOW');
  out.push(`| ${i} | ${reg} | ${ft} | ${mname||'(무)'} | ${addr||'—'} | ${lat?lat.toFixed(4)+','+lng.toFixed(4):'—'} | ${nearest} | ${conf} |`);
}
fs.writeFileSync(path.join(DIR,'katalk-new-regeocode-20260603.md'),out.join('\n'));
console.log('WROTE regeocode. rows:',rows.length);
