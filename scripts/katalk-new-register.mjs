#!/usr/bin/env node
/** katalk-new-register.mjs — Phase4 NEW 40건 등록 (기본 dry-run, --apply 시 실제 INSERT)
 * 입력: katalk-new-meta-final-20260603.json (verbatim 이름·좌표·external_id·city·ft·is_24h)
 *       + flat CSV (온도·facilities, rec 조인) + 아래 OVERRIDE(결정 반영).
 * 규칙: DB_REGISTER_CONVENTION(README). 온도 라이브 CHECK 범위검증. special 한증막/숯가마=jjim_temp+tribe=jimi.
 * 안전: external_id 중복가드, 좌표 프록시미티(<120m) 경고, 5건 배치 의식. 산출: register dry-run.md
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const APPLY=process.argv.includes('--apply');
const ONLY=(process.argv.find(a=>a.startsWith('--only='))||'').split('=')[1]; // 배치: --only=1-5
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
const RANGES={hot:[30,46],cold:[0,30],dry:[50,130],steam:[40,75],vh:[38,46],jjim:[70,130],ice:[0,20]};
const pt=v=>{if(v==null||!String(v).trim())return null;const s=String(v).split('|')[0].replace(/[<>~+]/g,'').trim();const m=s.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;};
const vt=(f,x)=>{if(x==null)return null;const r=Math.round(x);const[lo,hi]=RANGES[f];return(r<lo||r>hi)?null:r;};
function parseCsv(t){const rows=[];let i=0,f='',row=[],q=false;while(i<t.length){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c=='"')q=true;else if(c==','){row.push(f);f='';}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);if(row.some(x=>x!==''))rows.push(row);row=[];f='';}else f+=c;}i++;}if(f!==''||row.length){row.push(f);rows.push(row);}return rows;}
const csv=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=csv[0],C=Object.fromEntries(H.map((h,i)=>[h,i]));
const byRec={}; for(const r of csv.slice(1)){(byRec[r[C.source_record]]=byRec[r[C.source_record]]||[]).push(r);}
const meta=JSON.parse(fs.readFileSync(path.join(DIR,'katalk-new-meta-final-20260603.json'),'utf8'));

// 등록명 → CSV rec(s)
const REC={'강남24시사우나':[7031],'스카이베이호텔 경포':[2734],'신라모노그램 강릉':[3424,6126],'서로재':[1411],'새광주참숯가마':[5121],
'스페이스본휘트니스':[5293],'그랜드 머큐어 앰배서더 호텔 앤 레지던스 서울 용산':[2338],'그랜드 조선 제주':[9219],'그랜드 조선 부산':[6430],
'기린온천사우나':[8501],'쏠비치 남해':[1908],'네스트호텔':[2674],'홈스파월드':[8519],'르네상스 휘트니스':[2344],'무한사우나':[10144],
'스파해수랑':[9023],'수락산편백원':[9481],'수목원생활온천':[6578],'수원효소힐링센터':[8745],'시수하우스':[4274,10075],'유사우나':[6647],
'아늑 시그니처 호텔 서울 구로':[11002],'아트리파라다이스':[1999],'앰배서더 서울 풀만 호텔':[5654],'덕산온천탕':[2906],'서울드래곤시티':[2985],
'원시불한증막':[9864],'월곡건강랜드':[10060],'웨스틴 서울 파르나스':[9220],'이비스 스타일 앰배서더 서울 명동':[10682],
'스파앳홈 인천공항 제1터미널점':[],'잠실수양불한증막':[8976],'스파온':[11033],'엠버퓨어힐 호텔&리조트 제주':[6726],
'서울서초글램핑청계산장':[6187],'동궁사우나':[8860],'파라곤스파':[2240],'파라다이스 호텔 부산':[2914],'팔공산심천랜드':[10889],'포시즌스 호텔 서울':[2452]};

// CSV facility 토큰 → DB 태그 (private/enzyme=drop, hinoki/event=hot-bath, cool_room=ice-room, nap=per-case override)
const TOK={dry_sauna:'dry-sauna',wet_sauna:'steam-sauna',cold_bath:'cold-bath',warm_bath:'hot-bath',hot_bath:'very-hot-bath',
 jjimjil:'jjimjilbang',scrub:'scrub',salt:'salt-sauna',outdoor:'outdoor-rest',hinoki:'hot-bath',event_bath:'hot-bath',cool_room:'ice-room'};
const DROP=new Set(['private','enzyme','nap','indoor_bath','sunbed','water_bath','bubble_spa','capsule_hotel']);

// 시설별 OVERRIDE (결정 doc 반영): special-kiln(jjim), 추가태그, memo, cost, scrub_cost, cold/hot 보정, bath_policy
const OV={
 '새광주참숯가마':{kiln:true,jjim:130,addTags:['jjimjilbang','outdoor-rest','food'],memo:'숯가마 91·95·138도 + 외기 숯, 최고 130-140도, 식당(삼겹살). (먼데이 카톡 5/19)'},
 '원시불한증막':{kiln:true,is24:true,scrub_cost:null,addTags:['jjimjilbang','food','parking'],cost:15000,memo:'불한증막(내부 약88도), 한증막 2기, 샤워, 연중무휴, 24시'},
 '잠실수양불한증막':{ft:'public-bath',addTags:['jjimjilbang','bulgama','food','parking'],memo:'불한증막. 온탕39/열탕42/냉탕22, 건식79'},
 '수락산편백원':{addTags:['jjimjilbang'],memo:'효소찜질(15분), 외기욕 효소방, 족욕 약48도(필드없음). special'},
 '수원효소힐링센터':{addTags:['jjimjilbang'],scrub_cost:35000,memo:'효소힐링센터(효소찜질). special'},
 '파라곤스파':{addTags:['jjimjilbang','parking','sleep-room','food','scrub'],scrub_cost:30000,memo:'건식/습식, 찜질방, 주차, 24시간, 식당, 수면실, 수질관리 좋음. 열탕 약48도(불확실, 제외)',noTemp:true},
 '스페이스본휘트니스':{addTags:['bulgama'],memo:'불한증막(하이라이트), 이벤트탕·안마탕 약37도'},
 '르네상스 휘트니스':{addTags:['jjimjilbang'],memo:'황토방 포함, 관리 좋음, 가격 약간 비쌈'},
 '아트리파라다이스':{coldSet:22,addTags:['indoor-rest','scrub'],cost:18900,scrub_cost:null,memo:'호텔식 사우나(숙박X, 헬스+수영 복합, 일일권 18,900). 비치베드2, 샤워 칸막이. 습식 약80도(범위초과 미기록). 여탕 기준'},
 '웨스틴 서울 파르나스':{hotSet:40,addTags:['dry-sauna','steam-sauna'],memo:'혼탕(=온탕 40), 열탕43, 냉탕23, 건식·습식'},
 '이비스 스타일 앰배서더 서울 명동':{addTags:['open-air-bath'],memo:'건식83, 남산뷰 노천 냉탕 20도(표기20/체감40, 온도계 고장 가능성), 별도 실내 냉탕 없음, 샤워실 2개'},
 '기린온천사우나':{addTags:['jjimjilbang','sleep-room'],memo:'탄산나트륨, 수면방, 건식 표기110/체감90. 미니찜질방, 입욕권 10,000(블로그)'},
 '아늑 시그니처 호텔 서울 구로':{addTags:['indoor-rest','outdoor-rest'],cost:20000,memo:'내기욕 선베드2, 외기욕 공간. 이용료 20,000'},
 '시수하우스':{addTags:['self-loyly'],removeTags:['ice-room'],memo:'프라이빗 핀란드 사우나, 로일뤼 가능, 냉수 10-14도. 리커버리 패키지'},
 '서울서초글램핑청계산장':{coldSet:19,addTags:['parking','self-loyly'],memo:'뇨끼 예약제 프라이빗 사우나, 건식83 셋팅, 양모 모자, 라운지 샤워, 계란/음료, 두타임 예약'},
 '팔공산심천랜드':{saunaSet:80,onsen:true,addTags:['open-air-bath','outdoor-rest','cold-bath','parking'],memo:'노천탕 온도 좋음, 사우나 약80, 노천 냉탕 차가움'},
 '쏠비치 남해':{ft:'hotel-premium',addTags:['open-air-bath','hot-bath'],memo:'인피니티 온수풀 뷰, 시설 깔끔, 건식70'},
 '덕산온천탕':{memo:'85도 고온방, 냉탕 23-4도, 주말에도 안 붐빔'},
 '홈스파월드':{memo:'건식 85-90'},
 '스파앳홈 인천공항 제1터미널점':{noTemp:true,addTags:['jjimjilbang','dryer-free','shampoo-bodywash','towel'],memo:'인천공항 제1터미널 사우나(T2와 별개)'},
 '수목원생활온천':{scrub_cost:23000,addTags:['outdoor-rest','scrub','hot-bath','very-hot-bath','dry-sauna','steam-sauna','bulgama','ice-room'],memo:'온천'},
 '스파해수랑':{cost:15000,addTags:['parking','jjimjilbang','food','massage','hot-bath','very-hot-bath','cold-bath','dry-sauna','steam-sauna','scrub']},
 '유사우나':{is24:true,bathPolicy:'female-only',cost:15000,scrub_cost:35000,addTags:['very-hot-bath','hot-bath','cold-bath','scrub','dryer-free'],memo:'세신 맛집'},
 '서울드래곤시티':{addTags:['dry-sauna','steam-sauna','shampoo-bodywash','towel'],memo:'어메니티 있음'},
 '월곡건강랜드':{is24:true,addTags:['parking','food']},
 '스파온':{onsen:true,addTags:['parking','open-air-bath','scrub'],memo:'운동시설 있음'},
 '동궁사우나':{addTags:['dry-sauna','steam-sauna','jjimjilbang']},
};
const KILN=new Set(['새광주참숯가마','원시불한증막']); // dry→jjim, tribe=jimi (잠실수양은 public-bath로 변경→건식 sauna_temp)

function build(m){
  const recs=REC[m.name]||[]; const ov=OV[m.name]||{};
  const rows=recs.flatMap(r=>byRec[String(r)]||[]);
  // 온도 픽 (여러 rec면 첫 non-null)
  const pick=col=>{for(const r of rows){const v=pt(r[C[col]]);if(v!=null)return v;}return null;};
  let cv={dry:pick('dry_temp_c'),steam:pick('steam_temp_c'),cold:pick('cold_bath_temp_c'),hot:pick('hot_bath_temp_c'),vh:pick('very_hot_bath_temp_c')};
  if('coldSet' in ov)cv.cold=ov.coldSet; if('hotSet' in ov)cv.hot=ov.hotSet; if('saunaSet' in ov)cv.dry=ov.saunaSet;
  // facilities: CSV 토큰 매핑
  const tagSet=new Set();
  for(const r of rows)for(const t of (r[C.facilities]||'').split('|').filter(Boolean)){if(DROP.has(t))continue;if(TOK[t])tagSet.add(TOK[t]);}
  // 온도 함의 태그 (non-kiln)
  const kiln=KILN.has(m.name);
  if(!ov.noTemp){
    if(!kiln && vt('dry',cv.dry)!=null)tagSet.add('dry-sauna');
    if(vt('steam',cv.steam)!=null)tagSet.add('steam-sauna');
    if(vt('cold',cv.cold)!=null)tagSet.add('cold-bath');
    if(vt('hot',cv.hot)!=null)tagSet.add('hot-bath');
    if(vt('vh',cv.vh)!=null)tagSet.add('very-hot-bath');
  }
  for(const t of (ov.addTags||[]))tagSet.add(t);
  // facility_type 오버라이드
  const ft = ov.ft!==undefined ? ov.ft : m.facility_type;
  // 기본 온탕/열탕/냉탕 태그: special·private-sauna 제외 국내 사우나 (유저 baseline 규칙)
  if(['public-bath','small-bath','hotel-premium','resort-spa'].includes(ft)){
    tagSet.add('hot-bath'); tagSet.add('very-hot-bath'); tagSet.add('cold-bath');
  }
  if(ft==='hotel-premium') tagSet.add('parking'); // 호텔 기본 주차 (유저)
  tagSet.add('tattoo-friendly'); // 한국 시설 기본 타투가능 (유저, 40건 전부 국내)
  // removeTags (없음 명시분: 이비스 냉탕없음·시수 ice-room 등)
  for(const t of (ov.removeTags||[]))tagSet.delete(t);
  // 비용: CSV 우선, OV 폴백
  const csvCost=pick('entrance_cost_krw'), csvScrub=pick('scrub_cost_krw');
  const cost = ov.cost!==undefined ? ov.cost : (csvCost??null);
  const scrub_cost = ov.scrub_cost!==undefined ? ov.scrub_cost : (csvScrub??null);
  if(scrub_cost!=null)tagSet.add('scrub'); // 세신비 있으면 scrub 태그
  const facilities=[...tagSet];
  // is_24h / bath_policy 오버라이드
  const is_24h = ov.is24!==undefined ? ov.is24 : m.is_24h;
  const bath_policy = ov.bathPolicy || 'gender-bath';
  // 온천명 시설 → memo에 "온천" (향후 온천 리스트 추출용)
  let memo = ov.memo||'';
  if((m.name.includes('온천')||ov.onsen) && !memo.includes('온천')) memo = (memo?memo+' / ':'')+'온천';
  // 로그 온도
  let log={}, jjim=null;
  if(ov.noTemp){ /* 온도 로그 없음 */ }
  else if(kiln){ jjim = ov.jjim!=null?ov.jjim:vt('jjim',cv.dry);
    log={cold:vt('cold',cv.cold),hot:vt('hot',cv.hot),steam:vt('steam',cv.steam),vh:vt('vh',cv.vh)};
  } else {
    log={sauna:vt('dry',cv.dry),steam:vt('steam',cv.steam),cold:vt('cold',cv.cold),hot:vt('hot',cv.hot),vh:vt('vh',cv.vh)};
  }
  // tribe: kiln=jimi / 건식·습식 있으면 saunner / 그 외(탕만)=bather
  let tribe = kiln?'jimi' : (facilities.includes('dry-sauna')||facilities.includes('steam-sauna'))?'saunner':'bather';
  const hasTemp = jjim!=null || Object.values(log).some(v=>v!=null);
  return {m,ft,is_24h,bath_policy,facilities,log,jjim,tribe,cost,scrub_cost,memo,hasTemp};
}

let list=meta.map((m,i)=>({i:i+1,...build(m)}));
if(ONLY){const[a,b]=ONLY.split('-').map(Number);list=list.filter(x=>x.i>=a&&x.i<=b);}

// ── APPLY: places→place_sources→logs→deep_logs (dup guard + 프록시미티) ──
const applied=[];
if(APPLY){
  // 기존 좌표(프록시미티)
  const places=[]; for(let f=0;;f+=1000){const{data}=await sb.from('places').select('id,latitude,longitude').range(f,f+999);if(!data?.length)break;places.push(...data);if(data.length<1000)break;}
  const dist=(a,b,c,d)=>{const R=6371000,t=x=>x*Math.PI/180;const h=Math.sin(t(c-a)/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(t(d-b)/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
  for(const x of list){const m=x.m;
    // external_id 중복가드
    const {data:ex}=await sb.from('place_sources').select('place_id').eq('source','naver').eq('external_id',m.external_id);
    if(ex&&ex.length){applied.push(`SKIP(중복) ${m.name}`);continue;}
    // 프록시미티 경고(차단X, 사전검증됨)
    let near=null; for(const p of places){if(p.latitude==null)continue;const dd=dist(m.lat,m.lng,+p.latitude,+p.longitude);if(dd<120){near=Math.round(dd);break;}}
    if(near!=null){applied.push(`SKIP(근접 ${near}m, 수동확인) ${m.name}`);continue;}
    // places
    const {data:pl,error:e1}=await sb.from('places').insert({country_code:'KR',latitude:m.lat,longitude:m.lng,facilities:x.facilities,is_24h:x.is_24h,facility_type:x.ft,coordinate_source:'naver',status:'active',bath_policy:x.bath_policy,city:m.city,created_by:ADMIN}).select('id').single();
    if(e1){applied.push(`ERR places ${m.name}: ${e1.message}`);continue;}
    // place_sources
    const {error:e2}=await sb.from('place_sources').insert({place_id:pl.id,source:'naver',external_id:m.external_id,name_original:m.name,address_original:m.road,latitude:m.lat,longitude:m.lng});
    if(e2){applied.push(`ERR place_sources ${m.name}: ${e2.message} (place ${pl.id} 생성됨!)`);continue;}
    // admin log (데이터 있을 때만)
    const hasData = x.jjim!=null || Object.values(x.log).some(v=>v!=null) || x.cost!=null || x.scrub_cost!=null || x.memo;
    if(hasData){
      const lr={user_id:ADMIN,place_id:pl.id,tribe_id:x.tribe};
      if(x.jjim!=null)lr.jjim_temp=x.jjim;
      if(x.log.sauna!=null)lr.sauna_temp=x.log.sauna;
      if(x.log.cold!=null)lr.cold_bath_temp=x.log.cold;
      if(x.log.hot!=null)lr.hot_bath_temp=x.log.hot;
      if(x.log.steam!=null)lr.steam_sauna_temp=x.log.steam;
      const {data:lg,error:e3}=await sb.from('logs').insert(lr).select('id').single();
      if(e3){applied.push(`ERR logs ${m.name}: ${e3.message} (place ${pl.id})`);continue;}
      const dr={log_id:lg.id};
      if(x.log.vh!=null)dr.very_hot_bath_temp=x.log.vh;
      if(x.cost!=null)dr.cost=x.cost;
      if(x.scrub_cost!=null){dr.scrub_cost=x.scrub_cost;dr.has_scrub=true;}
      if(x.memo)dr.memo=x.memo;
      if(Object.keys(dr).length>1){const {error:e4}=await sb.from('deep_logs').insert(dr);if(e4)applied.push(`WARN deep ${m.name}: ${e4.message}`);}
      applied.push(`OK ${m.name} (place+source+log${Object.keys(dr).length>1?'+deep':''})`);
    } else applied.push(`OK ${m.name} (place+source, 로그없음)`);
  }
  console.log(applied.join('\n'));
}

// dry-run 리포트
const L=[`# Phase4 NEW 등록 ${APPLY?'APPLIED':'DRY-RUN'} ${ONLY?'(batch '+ONLY+')':''} 2026-06-03`,'',
 '| # | 등록명 | ft | city | 24h | bath_policy | facilities | 로그(tribe: 온도) | cost | scrub | memo |',
 '|---|---|---|---|---|---|---|---|---|---|---|'];
for(const x of list){const m=x.m;
  const t=x.jjim!=null?`jimi: jjim${x.jjim}${x.log.cold!=null?'/냉'+x.log.cold:''}${x.log.hot!=null?'/온'+x.log.hot:''}${x.log.vh!=null?'/열'+x.log.vh:''}`
    :(x.hasTemp?`${x.tribe}: ${[x.log.hot!=null&&'온'+x.log.hot,x.log.cold!=null&&'냉'+x.log.cold,x.log.sauna!=null&&'건'+x.log.sauna,x.log.steam!=null&&'습'+x.log.steam,x.log.vh!=null&&'열'+x.log.vh].filter(Boolean).join('/')}`:'(온도없음)');
  L.push(`| ${x.i} | ${m.name} | ${x.ft} | ${m.city} | ${x.is_24h?'O':'-'} | ${x.bath_policy} | ${x.facilities.join(',')} | ${t} | ${x.cost??'·'} | ${x.scrub_cost??'·'} | ${x.memo.slice(0,50)} |`);
}
fs.writeFileSync(path.join(DIR,`katalk-new-register-dryrun-20260603${ONLY?'-b'+ONLY:''}.md`),L.join('\n'));
console.log(`${APPLY?'APPLIED':'DRY-RUN'} rows:${list.length}. 온도있음 ${list.filter(x=>x.hasTemp).length} / 온도없음 ${list.filter(x=>!x.hasTemp).length}`);
if(!APPLY)console.log('→ 파일 검토 후 --apply 로 실제 등록');
