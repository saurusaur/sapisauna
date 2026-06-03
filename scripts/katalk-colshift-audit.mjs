#!/usr/bin/env node
/** katalk-colshift-audit.mjs (READ-ONLY)
 * 통합 CSV 144행 전수: raw_quote가 명시한 (사우나종류→온도)를 파싱해 CSV 온도칸과 1:1 대조.
 * 칸밀림 시그니처(원문 칸 ≠ CSV 칸이고 그 값이 다른 칸에 있음) 검출.
 * 산출: katalk-colshift-audit-20260603.md
 */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DIR=path.join(ROOT,'docs/research/katalk-20260519');
function parseCsv(t){const rows=[];let i=0,f='',row=[],q=false;while(i<t.length){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++;}else q=false;}else f+=c;}else{if(c=='"')q=true;else if(c==','){row.push(f);f='';}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);if(row.some(x=>x!==''))rows.push(row);row=[];f='';}else f+=c;}i++;}if(f!==''||row.length){row.push(f);rows.push(row);}return rows;}
const csv=parseCsv(fs.readFileSync(path.join(DIR,'katalk-extract-20260519-flat.csv'),'utf8'));
const H=csv[0],CI=Object.fromEntries(H.map((h,i)=>[h,i]));
const num=s=>{if(s==null)return null;const m=String(s).split('|')[0].replace(/[<>~+]/g,'').match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):null;};
// raw_quote에서 (종류→온도) 추출. 키워드 뒤 12자 이내 첫 숫자, 또는 숫자 뒤 4자 이내 키워드.
const KW={ dry:['건식','옥사우나','핀란드사우나','건사우나','건식사우나'], steam:['습식','스팀사우나','습식사우나'],
  hot:['온탕','메인탕','미온탕'], cold:['냉탕','냉수탕'], vh:['열탕','고온탕'], openair:['노천탕','노천'] , ice:['급냉']};
function extract(raw){
  const exp={dry:[],steam:[],hot:[],cold:[],vh:[],openair:[],ice:[]};
  for(const[type,kws]of Object.entries(KW)){
    for(const kw of kws){
      let idx=0;
      while((idx=raw.indexOf(kw,idx))>=0){
        const win=raw.slice(idx+kw.length, idx+kw.length+12);
        const m=win.match(/-?\d{2,3}(\.\d+)?/);
        if(m)exp[type].push(parseFloat(m[0]));
        idx+=kw.length;
      }
    }
  }
  return exp;
}
const cols={dry:'dry_temp_c',steam:'steam_temp_c',hot:'hot_bath_temp_c',cold:'cold_bath_temp_c',vh:'very_hot_bath_temp_c'};
const flags=[];
for(const r of csv.slice(1)){
  const rec=r[CI.source_record], name=r[CI.name], raw=r[CI.raw_quote]||'';
  const colv={}; for(const k in cols)colv[k]=num(r[CI[cols[k]]]);
  const exp=extract(raw);
  const issues=[];
  for(const k of ['dry','steam','hot','cold','vh']){
    const ev=exp[k]; if(!ev.length)continue;
    const cv=colv[k];
    const matched=ev.some(e=>cv!=null&&Math.abs(e-cv)<2);
    if(matched)continue;
    // 원문 칸과 CSV 칸 불일치 → 그 기대값이 다른 칸에 있나? (밀림 시그니처)
    for(const e of ev){
      const elsewhere=Object.entries(colv).filter(([kk,vv])=>kk!==k&&vv!=null&&Math.abs(vv-e)<2).map(([kk])=>kk);
      if(elsewhere.length) issues.push(`${k}원문${e}→CSV[${elsewhere.join('/')}]칸(밀림?), CSV.${k}=${cv??'∅'}`);
      else if(cv==null) issues.push(`${k}원문${e}→CSV.${k}=∅(누락?)`);
      else issues.push(`${k}원문${e}≠CSV.${k}=${cv}(불일치)`);
    }
  }
  if(issues.length)flags.push({rec,name,raw,colv,exp,issues});
}
const L=['# 칸밀림 전수 감사 (read-only) — 144행 raw_quote↔CSV칸 대조 (2026-06-03)','',
 `플래그 ${flags.length}행. '밀림?'=값이 다른칸에 존재(교정요), '누락?'=원문값 CSV에 없음, '불일치'=값다름(다른시점/체감/사진참고 가능).`,'',
 '| rec | 시설 | 이슈 | CSV(건/습/온/냉/열) | raw 발췌 |','|---|---|---|---|---|'];
for(const f of flags){
  const cv=`${f.colv.dry??'·'}/${f.colv.steam??'·'}/${f.colv.hot??'·'}/${f.colv.cold??'·'}/${f.colv.vh??'·'}`;
  L.push(`| ${f.rec} | ${f.name} | ${f.issues.join('; ')} | ${cv} | ${f.raw.slice(0,60).replace(/\|/g,'/')} |`);
}
fs.writeFileSync(path.join(DIR,'katalk-colshift-audit-20260603.md'),L.join('\n'));
const shift=flags.filter(f=>f.issues.some(i=>i.includes('밀림'))).length;
console.log(`총 플래그 ${flags.length}행 / 그중 밀림시그니처 ${shift}행. → katalk-colshift-audit-20260603.md`);
