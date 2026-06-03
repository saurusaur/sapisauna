#!/usr/bin/env node
/**
 * katalk-new-geocode.mjs (READ-ONLY)
 * Phase 4 — NEW 48건 정식명·주소·좌표·city·types 확보.
 * Google searchText(ko): displayName/formattedAddress/location/types/place_id/addressComponents
 * Naver local: 국내 지도 정식명(title)/주소/category (지도명 우선 정책)
 * 쓰기 없음. 산출물: docs/research/katalk-20260519/katalk-new-geocode-20260602.md + .json
 * 캐시: docs/research/katalk-20260519/new-geocode-cache.json (재실행 시 API 절약)
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const GKEY=process.env.GOOGLE_PLACES_API_KEY, NID=process.env.NAVER_CLIENT_ID, NSEC=process.env.NAVER_CLIENT_SECRET;
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const cachePath=path.join(DIR,'new-geocode-cache.json');
const cache=fs.existsSync(cachePath)?JSON.parse(fs.readFileSync(cachePath,'utf8')):{};
const save=()=>fs.writeFileSync(cachePath,JSON.stringify(cache,null,1));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ── 제외 15건 (canonical 기준): 9 이미존재 + 6 동일=enrich ──
const EXCLUDE=new Set(['도미인 강남','도미인 인사동','조선팰리스 강남 사우나','더 리버사이드 호텔 메디 스파',
  '신사 스파레이','스파디움','경주 소노캄','경주 힐튼호텔 사우나','장소명 미기재(냉수욕)',
  '금진온천','덕구온천','분당 청춘목욕당','하남주심유황온천','후암동 하남사우나','대영해수온천']);
// ── canonical 오버라이드 (그룹 A·B·특수) ──
const CANON={
  '#파주강남24시':'강남24시사우나','웨스틴서울 파르나스':'웨스틴 서울 파르나스',
  '아늑 시그니처 호텔 구로 루프 사우나':'아늑 시그니처 서울 구로 루프 사우나',
  '광화문 스페이스본':'스페이스본휘트니스','인천공항 사우나 (스파엣홈)':'스파앳홈 인천공항 제1터미널점',
};

// ── NEW 표 파싱 (crosscheck md) ──
const md=fs.readFileSync(path.join(DIR,'katalk-db-crosscheck-20260601.md'),'utf8').split('\n');
const start=md.findIndex(l=>l.includes('NEW — 신규 place 후보'));
const rows=[];
for(let i=start+3;i<md.length;i++){const l=md[i];if(!l.startsWith('|'))break;
  const c=l.split('|').map(x=>x.trim());if(c[1]==='카톡 시설'||c[1].startsWith('---')||!c[1])continue;
  const katalk=c[1], canonCol=c[2]&&c[2]!=='—'?c[2]:null;
  if(EXCLUDE.has(katalk))continue;
  const name=CANON[katalk]||canonCol||katalk;
  rows.push({katalk,name,region:c[3]||'',rec:c[4]||''});}

async function google(q){
  const k='g:'+q; if(cache[k])return cache[k];
  let out={};
  try{
    const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':GKEY,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents'},body:JSON.stringify({textQuery:q,languageCode:'ko'})});
    const j=await r.json();
    if(j.places&&j.places[0]){const p=j.places[0];const ac=p.addressComponents||[];
      const get=t=>ac.find(x=>(x.types||[]).includes(t))?.longText||null;
      const getS=t=>ac.find(x=>(x.types||[]).includes(t))?.shortText||null;
      out={id:p.id,name:p.displayName?.text||null,addr:p.formattedAddress||null,
        lat:p.location?.latitude??null,lng:p.location?.longitude??null,types:(p.types||[]).join('|'),
        locality:get('locality')||get('postal_town'),admin1:get('administrative_area_level_1'),country:getS('country')};
    } else out={err:j.error?.message||'no-result'};
  }catch(e){out={err:String(e)};}
  cache[k]=out; save(); return out;
}
async function naver(q){
  const k='n:'+q; if(cache[k])return cache[k];
  let out={};
  try{
    const r=await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=1&sort=random`,{headers:{'X-Naver-Client-Id':NID,'X-Naver-Client-Secret':NSEC}});
    const j=await r.json();
    if(j.items&&j.items[0]){const it=j.items[0];
      out={name:(it.title||'').replace(/<[^>]+>/g,''),addr:it.roadAddress||it.address||null,category:it.category||null,
        mapx:it.mapx,mapy:it.mapy};
    } else out={err:'no-result'};
  }catch(e){out={err:String(e)};}
  cache[k]=out; save(); return out;
}

const KR_METRO=[['서울','Seoul'],['부산','Busan'],['인천','Incheon'],['대구','Daegu'],['대전','Daejeon'],['광주','Gwangju'],['울산','Ulsan'],['세종','Sejong'],['제주','Jeju'],['강원','Gangwon'],['경기','Gyeonggi'],['충북','Chungbuk'],['충남','Chungnam'],['전북','Jeonbuk'],['전남','Jeonnam'],['경북','Gyeongbuk'],['경남','Gyeongnam']];
const normCity=c=>{if(!c)return null;for(const[k,v]of KR_METRO)if(c.startsWith(k))return v;return c;};

const results=[];
for(const row of rows){
  // region에서 노이즈 제거: 발화자 거주지일 수 있어 검색엔 시설명만 우선, 실패시 region 결합
  const g=await google(row.name); await sleep(120);
  const n=await naver(row.name); await sleep(120);
  const city=g.locality?normCity(g.locality):(g.admin1?normCity(g.admin1):null);
  // 신뢰도: Google·Naver 둘 다 결과 + 이름 토큰 겹침
  const gName=g.name||'', nName=n.name||'';
  const norm=s=>(s||'').replace(/[\s()·\-]/g,'').toLowerCase();
  const core=norm(row.name).replace(/사우나|온천|호텔|스파|찜질방|목욕탕/g,'');
  const gHit=g.name&&(norm(gName).includes(core)||core.includes(norm(gName).slice(0,3)));
  const conf=(g.id&&n.addr)?(gHit?'HIGH':'MEDIUM'):(g.id||n.addr?'MEDIUM':'LOW');
  results.push({...row, g, n, city, conf});
}

// JSON 산출 (등록 스크립트 입력)
fs.writeFileSync(path.join(DIR,'katalk-new-geocode-20260602.json'),JSON.stringify(results,null,1));
// MD 산출 (유저 검토)
const L=['# Phase 4 NEW 48건 지오코딩 (read-only)','',`대상 ${results.length}건. Google(ko)+Naver local. 좌표=Google WGS84.`,'',
 '신뢰도: HIGH(양쪽+이름일치) / MEDIUM(한쪽만 or 이름불일치) / LOW(둘다실패)','',
 '| # | 카톡명 | Google 정식명 | Naver 정식명 | 주소(Google) | city | 좌표 | types | 신뢰도 |',
 '|---|---|---|---|---|---|---|---|---|'];
results.forEach((r,i)=>{
  const co=(r.g.lat!=null)?`${r.g.lat.toFixed(4)},${r.g.lng.toFixed(4)}`:'—';
  L.push(`| ${i+1} | ${r.katalk}${r.name!==r.katalk?' → '+r.name:''} | ${r.g.name||r.g.err||'—'} | ${r.n.name||r.n.err||'—'} | ${r.g.addr||'—'} | ${r.city||'—'} | ${co} | ${(r.g.types||'').slice(0,40)} | ${r.conf} |`);
});
const byConf=c=>results.filter(r=>r.conf===c).length;
L.push('',`HIGH ${byConf('HIGH')} · MEDIUM ${byConf('MEDIUM')} · LOW ${byConf('LOW')}`);
fs.writeFileSync(path.join(DIR,'katalk-new-geocode-20260602.md'),L.join('\n'));
console.log(`WROTE geocode md+json. rows:${results.length} HIGH:${byConf('HIGH')} MED:${byConf('MEDIUM')} LOW:${byConf('LOW')}`);
