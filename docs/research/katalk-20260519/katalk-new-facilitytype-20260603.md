# Phase 4 최종 40 + facility_type 제안 (read-only)

48 −5(DB중복→enrich) −3(병합) = 40건. 제안은 Google types+이름 휴리스틱 → 유저 확정 필요.

| # | 시설(정식명) | city | Google types | 제안 facility_type | 비고/온도매핑 |
|---|---|---|---|---|---|
| 1 | 강남 24시 사우나 | 파주시 | sauna|public_bath|spa|health|poi | **public-bath** | 대중탕/사우나 |
| 2 | 스카이베이호텔 경포 | 강릉시 | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 3 | 신라모노그램 강릉 | 강릉시 | bed_and_breakfast|lodging|point_ | **hotel-premium** | 호텔/리조트 |
| 4 | 서로재 | 고성군 | bed_and_breakfast|lodging|point_ | **hotel-premium** | 호텔/리조트 |
| 5 | 광주참숯가마(주) | Gwangju | point_of_interest|establishment | **special** | 한증막/숯가마/효소 → jjim_temp |
| 6 | 스페이스본스크린골프 | Seoul | sports_activity_location|point_o | **public-bath** | 휘트니스 사우나(gym-sauna UI제외→public-bath?) |
| 7 | Grand Mercure Ambassador Hotel and Residences Seoul Yongsan | Seoul | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 8 | 그랜드 조선 제주 | 서귀포시 | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 9 | 그랜드 조선 부산 | Busan | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 10 | 기린사우나 | 강릉시 | spa|point_of_interest|establishm | **public-bath** | 대중탕/사우나 |
| 11 | 쏠비치 남해 | 남해군 | resort_hotel|hotel|lodging|point | **hotel-premium** | 호텔/리조트 |
| 12 | 네스트 호텔 | Incheon | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 13 | 홈스파월드 | Daegu | spa|point_of_interest|establishm | **public-bath** | 대중탕/사우나 |
| 14 | 르네상스휘트니스클럽 | Seoul | gym|sports_activity_location|hea | **public-bath** | 휘트니스 사우나(gym-sauna UI제외→public-bath?) |
| 15 | 무한사우나 | Seoul | sauna|public_bath|spa|health|poi | **public-bath** | 대중탕/사우나 |
| 16 | 스파해수랑 | Busan | sauna|public_bath|massage_spa|sp | **public-bath** | 대중탕/사우나 |
| 17 | 수락산편백원 | 의정부시 | sauna|public_bath|spa|health|poi | **special** | 한증막/숯가마/효소 → jjim_temp |
| 18 | 수목원생활온천 | Daegu | public_bath|point_of_interest|es | **public-bath** | 대중탕/사우나 |
| 19 | 수원효소힐링센터 | 수원시 | store|point_of_interest|establis | **special** | 한증막/숯가마/효소 → jjim_temp |
| 20 | 시수하우스(sisuhouse) | Seoul | sauna|public_bath|spa|health|poi | **private-sauna** | 개인/프라이빗 사우나 |
| 21 | 유사우나 | Seoul | public_bathroom|point_of_interes | **public-bath** | 대중탕/사우나 |
| 22 | 아늑 시그니처 호텔 서울 구로 | Seoul | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 23 | 아트리파라다이스 | 용인시 | sports_complex|gym|sports_activi | **hotel-premium** | 호텔/리조트 |
| 24 | 앰배서더 서울 풀만 호텔 | Seoul | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 25 | 덕원온천장 | 예산군 | public_bath|point_of_interest|es | **public-bath** | 대중탕/사우나 |
| 26 | Novotel Ambassador Seoul Yongsan - Seoul Dragon City | Seoul | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 27 | 원시한증막 | 양양군 | spa|point_of_interest|establishm | **special** | 한증막/숯가마/효소 → jjim_temp |
| 28 | 월곡건강랜드 | Seoul | public_bath|point_of_interest|es | **public-bath** | 대중탕/사우나 |
| 29 | 웨스틴 서울 파르나스 | Seoul | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 30 | 이비스 스타일 앰배서더 서울 명동 | Seoul | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 31 | 스파앳홈 인천공항2터미널 Spa at home Incheon Airport T2 | Incheon | public_bath|point_of_interest|es | **public-bath** | 대중탕/사우나 |
| 32 | 잠실수양불한증막 | Seoul | public_bath|point_of_interest|es | **special** | 한증막/숯가마/효소 → jjim_temp |
| 33 | 스파온 | 전주시 | sauna|public_bath|spa|point_of_i | **public-bath** | 대중탕/사우나 |
| 34 | 엠버 퓨어힐 호텔 앤 리조트 제주 | Jeju | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 35 | 서울서초글램핑청계산장 | Seoul | childrens_camp|point_of_interest | **private-sauna** | 개인/프라이빗 사우나 |
| 36 | 동궁사우나 | Seoul | spa|point_of_interest|establishm | **public-bath** | 대중탕/사우나 |
| 37 | 목동파라곤 | Seoul | apartment_building|service|point | **public-bath** | 대중탕/사우나 |
| 38 | 파라다이스 호텔 부산 | Busan | hotel|lodging|point_of_interest| | **hotel-premium** | 호텔/리조트 |
| 39 | 팔공산 심천랜드 | Daegu | sauna|public_bath|spa|point_of_i | **public-bath** | 대중탕/사우나 |
| 40 | 포시즌스 호텔 서울 | Seoul | hotel|resort_hotel|extended_stay | **hotel-premium** | 호텔/리조트 |

## 병합 3쌍 (대표로 흡수, 카톡 데이터 합산)
- 강릉 스카이베이 ← 스카이베이 사우나
- 강릉 신라모노그램 ← 신라모노그램호텔사우나
- 그랜드 머큐어 용산 ← 용산 드래곤머큐어

## DB중복 5건 (등록 제외 → enrich 트랙)
- 더케이호텔경주·국제광천수온천·한화리조트 산정호수·리버사우나·오레브

## ⚠️ 이름/정체 추가확인 (등록 전)
- 광주 숯가마(Google=경기광주 참숯/Naver=두레건강랜드)·파라곤(목동파라곤 아파트?)·스파앗홈 T1(Google이 T2매칭=중복위험)

제안 분포: public-bath:16 · hotel-premium:17 · special:5 · private-sauna:2