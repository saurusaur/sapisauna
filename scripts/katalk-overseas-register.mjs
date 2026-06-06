#!/usr/bin/env node
/** katalk-overseas-register.mjs — Phase4b 해외 신규 16건 등록 (기본 dry-run, --apply 시 INSERT)
 * 입력: overseas-geocode-20260604.json (Google place_id 직접조회: displayName·좌표·city·country)
 *       + 아래 OV(시설별 결정: ft·facilities·온도·memo, overseas-facilities-review.md 근거).
 * 해외 분기: source='google', external_id=place_id, coordinate_source='google', country_code 개별.
 *   국내와 달리 tattoo-friendly 자동부여 안 함. ft=hotel-premium(026: hotel-spa 폐기)/public-bath.
 * 안전: external_id(place_id) 중복가드, 좌표 프록시미티(<120m) 경고, 5건 배치(--only=N-M).
 * 온도 라이브 CHECK 범위검증. 산출: overseas-register-dryrun-20260604.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const APPLY=process.argv.includes('--apply');
const ONLY=(process.argv.find(a=>a.startsWith('--only='))||'').split('=')[1];
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const RANGES={hot:[30,46],cold:[0,30],sauna:[50,130],steam:[40,75],vh:[38,46],ice:[0,20]};
const vt=(f,x)=>{if(x==null)return null;const r=Math.round(x);const[lo,hi]=RANGES[f];return(r<lo||r>hi)?null:r;};
const CUR={JP:'JPY',US:'USD',HK:'HKD'};
const geo=JSON.parse(fs.readFileSync(path.join(DIR,'overseas-geocode-20260604.json'),'utf8'));

// 시설별 결정 (overseas-facilities-review.md + 2026-06-04 사용자 검토 반영). nameOv=정식명 교정, cityOv=city 교정.
// facilities=명시 언급분만. 온도=명시값만(라이브 CHECK, 코코로노 습식 40 사용자지정). memo=카톡 후기+결정 보존.
const OV={
 '나미하노유':{ft:'public-bath',facilities:['open-air-bath','hot-bath','cold-bath','dry-sauna','indoor-rest','outdoor-rest','parking','food','jjimjilbang','dryer-free','shampoo-bodywash','massage'],memo:'완간시장 앞, 노천탕 유명. 노천·냉탕·실키탕·건식. 후쿠오카항 인근, 가성비·동선 우수. 온천'},
 '쓰루가메유':{ft:'small-bath',facilities:['hot-bath','cold-bath','dry-sauna','indoor-rest','tattoo-friendly','towel'],memo:'후쿠오카 레트로 전통 동네 센토. 작은 탕, 냉탕 극락. 타투 커버없이 OK, 사우나 이용 시 수건 1장 제공. 16~24시, 목욕비 5천원 미만'},
 '세이류온천':{ft:'public-bath',nameOv:'Nakagawa Seiryu',facilities:['open-air-bath','steam-sauna','outdoor-rest','indoor-rest','dry-sauna','cold-bath','food','parking','shampoo-bodywash'],memo:'큐슈 나카가와 당일온천. 숲속 노천탕·풍욕, 리뉴얼, 습식 라벤더. 온천'},
 '코코로노':{ft:'hotel-premium',nameOv:'Hotel Furukawa',facilities:['open-air-bath','hot-bath','steam-sauna','indoor-rest','outdoor-rest','towel','shampoo-bodywash'],log:{steam:40},memo:'시라오이(노보리베츠 인근) 리조트. 대욕장(실내+노천)+오션뷰 프라이빗탕, 습식 약40도. 대욕장 남녀 위치 매일 교대, 2박 권장. 정식명 心のリゾート海の別邸ふる川(이키타이 海の別邸 ふる川)'},
 '코노스미카':{ft:'hotel-premium',facilities:['open-air-bath','hot-bath','cold-bath','dry-sauna','towel'],memo:'도야호 리조트. 노천탕 우수, 미니 후지산(요테이산) 산뷰, 객실에도 노천탕'},
 '토토켄':{ft:'public-bath',facilities:['dry-sauna','cold-bath','hot-bath','outdoor-rest','ice-bath','indoor-rest','tattoo-friendly','shampoo-bodywash','dryer-free'],log:{sauna:95,ice:4,cold:10,hot:40},memo:'러닝 컨셉 사우나(니혼바시 하마쵸, 스미다강 러닝). 1층 카페. 사우나10인/냉탕4인/급냉탕1인/온탕2인'},
 '이나리유':{ft:'small-bath',facilities:['hot-bath'],memo:'이케부쿠로(카미이케부쿠로) 동네 센토'},
 '마에다유':{ft:'small-bath',facilities:['hot-bath','very-hot-bath','towel'],memo:'이케부쿠로 동네 센토. 탕 4개, 냉탕 없음, 사우나 없음'},
 '우메유':{ft:'small-bath',facilities:['hot-bath','shampoo-bodywash','dryer-paid'],memo:'진보초(간다) 센토. 사우나·냉탕 없음, 드라이기 유료. 표기 우메유 = Umenoyu(梅の湯)'},
 '하기노유':{ft:'public-bath',facilities:['hot-bath','cold-bath','dry-sauna','steam-sauna','indoor-rest','outdoor-rest','food','dryer-free','shampoo-bodywash'],memo:'우구이스다니(네기시) 센토. Google 영업중(2026-06 확인)'},
 'fuua':{ft:'hotel-premium',facilities:['open-air-bath','aufguss','hot-bath','dry-sauna','cold-bath','indoor-rest','parking','towel','shampoo-bodywash','dryer-free','food','jjimjilbang'],memo:'아타미, 바다 보며 하는 노천탕 유명. 아우프구스 경험 가능, 대형 목욕탕'},
 '카마타온센':{ft:'public-bath',facilities:['dry-sauna','cold-bath','open-air-bath','indoor-rest','outdoor-rest','tattoo-friendly','parking','dryer-paid','hot-bath'],cost:500,memo:'하네다공항 인근(우버 10-15분). 평범한 센토, 뜨거운 검정색 탕 인상적. 목욕만 500엔'},
 '91도사우나':{ft:'public-bath',nameOv:'91° SAUNA',facilities:['dry-sauna','cold-bath','open-air-bath','indoor-rest','outdoor-rest','towel','shampoo-bodywash','dryer-free'],log:{sauna:98},cost:1980,memo:'긴자. 컴팩트·소인수. 11층 프라이빗 사우나(가족실/개인실 대여)·12층 퍼블릭. 60분 1980엔. 표기 건식 91도(컨셉) 실제 ~98도'},
 '아만도쿄':{ft:'hotel-premium',facilities:['steam-sauna','indoor-rest','parking','towel','shampoo-bodywash','dryer-free','hot-bath'],memo:'오테마치타워. 사우나 목적엔 비추(건식·냉탕·외기욕 없음). 습식사우나+뷰 좋은 탕만'},
 '메도우드':{ft:'hotel-premium',facilities:['open-air-bath','dry-sauna','steam-sauna','hot-bath','outdoor-rest','shampoo-bodywash','towel','tattoo-friendly'],memo:'나파밸리(세인트헬레나) 리조트 스파. 프라이빗 욕실, 야외 해수풀, 외기욕(음료·과일 제공)'},
 '홍콩리젠트':{ft:'hotel-premium',cityOv:'Tsim Sha Tsui',facilities:['dry-sauna','steam-sauna','hot-bath','tattoo-friendly','shampoo-bodywash','dryer-free','parking'],memo:'침사추이 하버뷰. 남자=건식/여자=습식 성별분리. 4인 규모(거의 개인 이용). 리노베이션 시설'},
};

function build(g){
  const ov=OV[g.tag]; if(!ov)return null;
  const name=ov.nameOv||g.name;
  const city=ov.cityOv||g.city;
  const facilities=[...new Set(ov.facilities||[])];
  const log=ov.log||{};
  const v={ sauna:vt('sauna',log.sauna), cold:vt('cold',log.cold), hot:vt('hot',log.hot), steam:vt('steam',log.steam), ice:vt('ice',log.ice) };
  const tribe=ov.tribe || (facilities.includes('dry-sauna')||facilities.includes('steam-sauna')?'saunner':'bather');
  const currency=CUR[g.country_code]||null;
  const hasTemp=Object.values(v).some(x=>x!=null);
  return {tag:g.tag,name,road:g.road,lat:g.lat,lng:g.lng,external_id:g.pid,
    country_code:g.country_code,city,facility_type:ov.ft,bath_policy:'gender-bath',is_24h:false,
    facilities,log:v,tribe,cost:ov.cost??null,currency,memo:ov.memo||'',hasTemp};
}

let list=geo.map(build).filter(Boolean).map((x,i)=>({i:i+1,...x}));
if(ONLY){const[a,b]=ONLY.split('-').map(Number);list=list.filter(x=>x.i>=a&&x.i<=b);}

const applied=[];
if(APPLY){
  const places=[]; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,latitude,longitude').range(f,f+999);if(!data?.length)break;places.push(...data);if(data.length<1000)break;}
  const dist=(a,b,c,d)=>{const R=6371000,t=x=>x*Math.PI/180;const h=Math.sin(t(c-a)/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(t(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
  for(const x of list){
    const {data:ex}=await sb.from('place_sources').select('place_id').eq('source','google').eq('external_id',x.external_id);
    if(ex&&ex.length){applied.push(`SKIP(place_id 중복) ${x.tag}`);continue;}
    let near=null; for(const p of places){if(p.latitude==null)continue;const dd=dist(x.lat,x.lng,+p.latitude,+p.longitude);if(dd<120){near=Math.round(dd);break;}}
    if(near!=null){applied.push(`SKIP(근접 ${near}m, 수동확인) ${x.tag}`);continue;}
    const {data:pl,error:e1}=await sb.from('places').insert({country_code:x.country_code,latitude:x.lat,longitude:x.lng,facilities:x.facilities,is_24h:x.is_24h,facility_type:x.facility_type,coordinate_source:'google',status:'active',bath_policy:x.bath_policy,city:x.city,created_by:ADMIN}).select('id').single();
    if(e1){applied.push(`ERR places ${x.tag}: ${e1.message}`);continue;}
    const {error:e2}=await sb.from('place_sources').insert({place_id:pl.id,source:'google',external_id:x.external_id,name_original:x.name,address_original:x.road,latitude:x.lat,longitude:x.lng});
    if(e2){applied.push(`ERR place_sources ${x.tag}: ${e2.message} (place ${pl.id} 생성됨!)`);continue;}
    const hasData=x.hasTemp||x.cost!=null||x.memo;
    if(hasData){
      const lr={user_id:ADMIN,place_id:pl.id,tribe_id:x.tribe};
      if(x.log.sauna!=null)lr.sauna_temp=x.log.sauna;
      if(x.log.cold!=null)lr.cold_bath_temp=x.log.cold;
      if(x.log.hot!=null)lr.hot_bath_temp=x.log.hot;
      if(x.log.steam!=null)lr.steam_sauna_temp=x.log.steam;
      const {data:lg,error:e3}=await sb.from('logs').insert(lr).select('id').single();
      if(e3){applied.push(`ERR logs ${x.tag}: ${e3.message} (place ${pl.id})`);continue;}
      const dr={log_id:lg.id};
      if(x.log.ice!=null){dr.ice_bath_temp=x.log.ice;dr.has_ice_bath=true;}
      if(x.cost!=null){dr.cost=x.cost;dr.currency=x.currency;}
      if(x.memo)dr.memo=x.memo;
      if(Object.keys(dr).length>1){const {error:e4}=await sb.from('deep_logs').insert(dr);if(e4)applied.push(`WARN deep ${x.tag}: ${e4.message}`);}
      applied.push(`OK ${x.tag} (place+source+log${Object.keys(dr).length>1?'+deep':''})`);
    } else applied.push(`OK ${x.tag} (place+source)`);
  }
  console.log(applied.join('\n'));
}

const L=[`# Phase4b 해외 등록 ${APPLY?'APPLIED':'DRY-RUN'} ${ONLY?'(batch '+ONLY+')':''} 2026-06-04`,'',
 '| # | 카톡 | 정식명 | cc | city | ft | facilities | 로그(tribe: 온도) | cost | memo |',
 '|---|---|---|---|---|---|---|---|---|---|'];
for(const x of list){
  const t=x.hasTemp?`${x.tribe}: ${[x.log.hot!=null&&'온'+x.log.hot,x.log.cold!=null&&'냉'+x.log.cold,x.log.sauna!=null&&'건'+x.log.sauna,x.log.steam!=null&&'습'+x.log.steam,x.log.ice!=null&&'급냉'+x.log.ice].filter(Boolean).join('/')}`:`${x.tribe}(온도없음)`;
  L.push(`| ${x.i} | ${x.tag} | ${x.name} | ${x.country_code} | ${x.city} | ${x.facility_type} | ${x.facilities.join(',')} | ${t} | ${x.cost?x.cost+' '+x.currency:'·'} | ${x.memo.slice(0,60)} |`);
}
fs.writeFileSync(path.join(DIR,`overseas-register-dryrun-20260604${ONLY?'-b'+ONLY:''}.md`),L.join('\n'));
console.log(`${APPLY?'APPLIED':'DRY-RUN'} rows:${list.length}. 온도있음 ${list.filter(x=>x.hasTemp).length} / 온도없음 ${list.filter(x=>!x.hasTemp).length}`);
if(!APPLY)console.log('→ 파일 검토 후 --apply (5건 배치: --only=1-5)');
