#!/usr/bin/env node
/** katalk-enrich-missed-apply.mjs — 자동매처 NEW오분류로 누락된 기존시설 enrich (기본 dry-run, --apply)
 * 정책(안전): 🟢NULL보강=기존 어드민로그 빈칸만 채움 / 🆕로그없음=신규 INSERT / ⚠️진짜충돌=5/19 신규로그(기존보존)
 *   / 🏷️facilities=합집합 추가 / 📝memo=기존 deep_log에 append / ⚪노이즈·경계=SKIP.
 * place_id는 정식명으로 라이브 조회. 온도 라이브 CHECK 범위 검증.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const l of fs.readFileSync(path.join(ROOT,'.env.local'),'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)process.env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const sb=createClient(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ADMIN='23c431c3-9b23-4779-bb27-13472e58090a';
const APPLY=process.argv.includes('--apply');
const DIR=path.join(ROOT,'docs/research/katalk-20260519');

// 🟢 NULL보강: 기존 어드민로그 빈칸만 채움 (logs: sauna/cold/hot/steam, deep: vh)
const FILL=[
 {db:'호텔탑스텐 금진온천', log:{sauna:73,hot:39}, deep:{vh:41}},
 {db:'청춘목욕탕', log:{cold:20,sauna:80}},
 {db:'대영온천', deep:{vh:44}},
 {db:'더케이호텔경주 스파온천', log:{hot:40}, deep:{vh:44}},
 {db:'도미인 서울 강남', log:{hot:38}},
 {db:'도미인 EXPRESS 서울 인사동', deep:{vh:42}},
];
// 🆕 신규 로그 INSERT (로그없음) + ⚠️ 진짜충돌(5/19 신규로그)
const NEWLOG=[
 {db:'하남사우나', tribe:'saunner', log:{hot:38,sauna:110,bath_gender:'female'}, deep:{vh:43}, memo:'후암동 하남사우나(rec10065): 여탕, 건식110/온38/열43, 습식 뜨겁고 냉탕 그럭저럭', reason:'로그없음'},
 {db:'리버사우나', tribe:'saunner', log:{hot:39,cold:16,sauna:70,steam:60}, deep:{vh:42}, memo:'이촌동 리버사우나(rec7533): 온39/히노끼39/열42/냉16/건70/습60, 물 깨끗', reason:'로그없음'},
 {db:'덕구온천스파월드', tribe:'saunner', log:{hot:42,cold:24,sauna:73}, deep:{vh:44}, memo:'덕구온천(rec6207) 5/19시점: 옥사우나73/자수정62, 외기욕/선베드/데크의자', recDate:'2026-05-19', reason:'충돌(기존 냉16건92 보존)'},
 {db:'소노캄 경주', tribe:'saunner', log:{cold:23,sauna:75,steam:54}, deep:{memo:'소노캄 경주(rec1123) 5/19시점: 건식75/습식54/냉탕23, 사우나 온도 낮은 평'}, recDate:'2026-05-19', reason:'충돌(기존 보존)'},
];
// 🏷️ facilities 합집합 추가
const FAC=[
 {db:'주심유황참숯가마', add:['open-air-bath']},
 {db:'덕구온천스파월드', add:['outdoor-rest']},
];
// 📝 memo append (기존 deep_log)
const MEMO=[
 {db:'스파레이', memo:'효소찜질 10만원 코스(별도등록X, D-1)'},
];
const SKIP=[['국제광천수온천','cold ±1 노이즈'],['오레브핫스프링앤스파','cold/dry ±1 노이즈'],['힐튼호텔 경주','cold ±1 노이즈'],['조선 팰리스 서울 강남','경계(데이터 겹침)'],['스파디움24','경계(데이터 겹침)']];

const RANGES={hot:[30,46],cold:[0,30],sauna:[50,130],steam:[40,75],vh:[38,46]};
const vt=(f,x)=>{if(x==null)return null;const r=Math.round(x);const[lo,hi]=RANGES[f];return(r<lo||r>hi)?null:r;};
// 정식명 → place_id
const nm={}; for(let f=0;;f+=1000){const{data}=await sb.from('place_sources').select('place_id,name_original').range(f,f+999);if(!data?.length)break;for(const r of data)if(!nm[r.name_original])nm[r.name_original]=r.place_id;if(data.length<1000)break;}
const pidOf=n=>nm[n]||null;
async function adminLog(pid){const{data}=await sb.from('logs').select('id,sauna_temp,cold_bath_temp,hot_bath_temp,steam_sauna_temp,jjim_temp,bath_gender').eq('user_id',ADMIN).eq('place_id',pid).limit(1);return data?.[0]||null;}
async function deepOf(logId){const{data}=await sb.from('deep_logs').select('id,very_hot_bath_temp,memo').eq('log_id',logId).limit(1);return data?.[0]||null;}

const out=[`# enrich 누락분 ${APPLY?'APPLIED':'DRY-RUN'} 2026-06-04`,''];
const colMap={sauna:'sauna_temp',cold:'cold_bath_temp',hot:'hot_bath_temp',steam:'steam_sauna_temp'};

out.push('## 🟢 NULL보강 UPDATE');
for(const f of FILL){const pid=pidOf(f.db);if(!pid){out.push(`- ❌ ${f.db}: place없음`);continue;}
  const a=await adminLog(pid); if(!a){out.push(`- ⚠️ ${f.db}: 어드민로그없음(→NEWLOG로 가야)`);continue;}
  const fills={};for(const[k,v]of Object.entries(f.log||{})){const col=colMap[k];if(a[col]==null)fills[col]=vt(k,v);else out.push(`  · ${f.db} ${k} 이미값${a[col]}→건너뜀`);}
  let dfill=null;const dl=await deepOf(a.id);
  if(f.deep?.vh!=null){if(dl&&dl.very_hot_bath_temp==null)dfill=vt('vh',f.deep.vh);else if(!dl)dfill=vt('vh',f.deep.vh);else out.push(`  · ${f.db} vh 이미값${dl.very_hot_bath_temp}→건너뜀`);}
  out.push(`- ${f.db}: logUPDATE{${Object.entries(fills).map(([k,v])=>k+'='+v).join(',')||'-'}}${dfill!=null?' deep.vh='+dfill:''}`);
  if(APPLY){if(Object.keys(fills).length){await sb.from('logs').update({...fills,updated_at:new Date().toISOString()}).eq('id',a.id);}
    if(dfill!=null){if(dl)await sb.from('deep_logs').update({very_hot_bath_temp:dfill}).eq('id',dl.id);else await sb.from('deep_logs').insert({log_id:a.id,very_hot_bath_temp:dfill});}}
}
out.push('','## 🆕/⚠️ 신규 어드민로그 INSERT');
for(const n of NEWLOG){const pid=pidOf(n.db);if(!pid){out.push(`- ❌ ${n.db}: place없음`);continue;}
  const lr={user_id:ADMIN,place_id:pid,tribe_id:n.tribe};
  for(const[k,v]of Object.entries(n.log||{})){if(k==='bath_gender')lr.bath_gender=v;else lr[colMap[k]]=vt(k,v);}
  if(n.recDate)lr.record_date=n.recDate;
  const dpre=[n.deep?.vh!=null?'vh='+vt('vh',n.deep.vh):null].filter(Boolean);
  out.push(`- ${n.db} [${n.reason}]: log{${Object.entries(lr).filter(([k])=>!['user_id','place_id'].includes(k)).map(([k,v])=>k+'='+v).join(',')}} deep{${dpre.join(',')}${(n.memo||n.deep?.memo)?' memo':''}}`);
  if(APPLY){const{data:lg,error}=await sb.from('logs').insert(lr).select('id').single();if(error){out.push(`  ERR ${error.message}`);continue;}
    const dr={log_id:lg.id};if(n.deep?.vh!=null)dr.very_hot_bath_temp=vt('vh',n.deep.vh);const memo=n.memo||n.deep?.memo;if(memo)dr.memo=memo;
    if(Object.keys(dr).length>1)await sb.from('deep_logs').insert(dr);}
}
out.push('','## 🏷️ facilities 합집합 추가');
for(const f of FAC){const pid=pidOf(f.db);if(!pid){out.push(`- ❌ ${f.db}`);continue;}
  const{data:pl}=await sb.from('places').select('facilities').eq('id',pid).single();
  const cur=pl.facilities||[];const toAdd=f.add.filter(t=>!cur.includes(t));
  out.push(`- ${f.db}: 현재[${cur.join(',')}] + ${toAdd.join(',')||'(이미있음)'}`);
  if(APPLY&&toAdd.length)await sb.from('places').update({facilities:[...cur,...toAdd],updated_at:new Date().toISOString()}).eq('id',pid);
}
out.push('','## 📝 memo append');
for(const m of MEMO){const pid=pidOf(m.db);if(!pid){out.push(`- ❌ ${m.db}`);continue;}
  const a=await adminLog(pid);const dl=a?await deepOf(a.id):null;
  out.push(`- ${m.db}: deep memo += "${m.memo}" (기존memo:${dl?.memo?'있음':'없음'})`);
  if(APPLY&&a){const newMemo=dl?.memo?(dl.memo.includes(m.memo)?dl.memo:dl.memo+' / '+m.memo):m.memo;
    if(dl)await sb.from('deep_logs').update({memo:newMemo}).eq('id',dl.id);else await sb.from('deep_logs').insert({log_id:a.id,memo:newMemo});}
}
out.push('','## ⚪ SKIP (노이즈/경계 — 정상 데이터 보존)');
for(const[n,r]of SKIP)out.push(`- ${n}: ${r}`);
fs.writeFileSync(path.join(DIR,'katalk-enrich-missed-dryrun-20260604.md'),out.join('\n'));
console.log(out.join('\n'));
