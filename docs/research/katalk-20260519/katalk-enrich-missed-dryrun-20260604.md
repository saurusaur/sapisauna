# enrich 누락분 APPLIED 2026-06-04

## 🟢 NULL보강 UPDATE
- 호텔탑스텐 금진온천: logUPDATE{sauna_temp=73,hot_bath_temp=39} deep.vh=41
- 청춘목욕탕: logUPDATE{cold_bath_temp=20,sauna_temp=80}
- 대영온천: logUPDATE{-} deep.vh=44
- 더케이호텔경주 스파온천: logUPDATE{hot_bath_temp=40} deep.vh=44
- 도미인 서울 강남: logUPDATE{hot_bath_temp=38}
- 도미인 EXPRESS 서울 인사동: logUPDATE{-} deep.vh=42

## 🆕/⚠️ 신규 어드민로그 INSERT
- 하남사우나 [로그없음]: log{tribe_id=saunner,hot_bath_temp=38,sauna_temp=110,bath_gender=female} deep{vh=43 memo}
- 리버사우나 [로그없음]: log{tribe_id=saunner,hot_bath_temp=39,cold_bath_temp=16,sauna_temp=70,steam_sauna_temp=60} deep{vh=42 memo}
- 덕구온천스파월드 [충돌(기존 냉16건92 보존)]: log{tribe_id=saunner,hot_bath_temp=42,cold_bath_temp=24,sauna_temp=73,record_date=2026-05-19} deep{vh=44 memo}
- 소노캄 경주 [충돌(기존 보존)]: log{tribe_id=saunner,cold_bath_temp=23,sauna_temp=75,steam_sauna_temp=54,record_date=2026-05-19} deep{ memo}

## 🏷️ facilities 합집합 추가
- 주심유황참숯가마: 현재[dry-sauna,hot-bath,jjimjilbang,bulgama,tattoo-friendly] + open-air-bath
- 덕구온천스파월드: 현재[cold-bath,hot-bath,very-hot-bath,shampoo-bodywash,outdoor-rest,food,parking,ice-bath,open-air-bath,dryer-free,dry-sauna,steam-sauna,tattoo-friendly] + (이미있음)

## 📝 memo append
- 스파레이: deep memo += "효소찜질 10만원 코스(별도등록X, D-1)" (기존memo:있음)

## ⚪ SKIP (노이즈/경계 — 정상 데이터 보존)
- 국제광천수온천: cold ±1 노이즈
- 오레브핫스프링앤스파: cold/dry ±1 노이즈
- 힐튼호텔 경주: cold ±1 노이즈
- 조선 팰리스 서울 강남: 경계(데이터 겹침)
- 스파디움24: 경계(데이터 겹침)