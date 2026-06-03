# DB 전수 검수 (2026-06-01)

대상: places 255개 · MATCHED 태깅 29

플래그 있는 place: 159 / 255

| 플래그 | 수 |
|---|---|
| 🟡city-missing | 114 |
| ⚪g-name-mismatch | 43 |
| 🟡type? | 18 |
| 🟡ext-id-missing | 9 |
| 🟡coord-far | 1 |

## 플래그 상세 (place별)

| place名 | M | DB type | DB country | DB주소 | Google(name/types/country) | Naver(category) | 플래그 |
|---|---|---|---|---|---|---|---|
| 클럽케이서울 |  | public-bath | KR | 서울특별시 강남구 선릉로 524 지하 | Club K Seoul / spa,night_club,bar / KR | 스포츠시설·헬스장 | 🟡city-missing ⚪g-name-mismatch |
| 하남사우나 |  | small-bath | KR | 서울특별시 용산구 후암로28길 38 | 대도목욕탕 / spa,point_of_interest,establishment / KR | 생활,편의·목욕,찜질 | 🟡city-missing ⚪g-name-mismatch |
| 한림탕 |  | public-bath | KR | 제주특별자치도 제주시 한림읍 한림로  | 한라 사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡ext-id-missing ⚪g-name-mismatch |
| 리버사우나 |  | public-bath | KR | 서울특별시 용산구 이촌로84길 9 유 | 리버사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡ext-id-missing 🟡city-missing |
| 봉래탕 |  | small-bath | KR | 부산광역시 영도구 대교로2번길 7 2 | 봉래목욕탕 / point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡ext-id-missing 🟡city-missing |
| 인천조탕 |  | special | KR | 인천광역시 중구 용유서로 30 | 인천조탕 / public_bath,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡ext-id-missing 🟡city-missing |
| 라파사우나찜질방 |  | public-bath | KR | 서울특별시 송파구 오금로 396 지하 | 라파사우나찜질방 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡ext-id-missing 🟡city-missing |
| 동아온천사우나 |  | public-bath | KR | 대전광역시 유성구 온천로 59 | 동아온천사우나 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡ext-id-missing 🟡city-missing |
| 파라다이스시티 씨메르 |  | special | KR | 인천광역시 중구 영종해안남로321번길 | 파라다이스시티 / hotel,lodging,point_of_interest / KR | 레저,테마·워터파크 | 🟡ext-id-missing 🟡city-missing |
| 건강나라 |  | public-bath | KR | 서울특별시 동대문구 왕산로37길 39 | 할머니냉면 / korean_restaurant,restaurant,point_of_interest / KR | 쇼핑,유통·건강기능보조식품 | 🟡city-missing ⚪g-name-mismatch |
| 온유재스파마사지 상무점 |  | private-sauna | KR | 광주광역시 서구 시청로 57 2층 2 | 온유재스파 상무점 / massage_spa,spa,massage / KR | 미용·피부,체형관리 | 🟡city-missing ⚪g-name-mismatch |
| 난곡목욕탕 |  | small-bath | KR | 서울특별시 관악구 난곡로24가길 12 | 프린스대중사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing ⚪g-name-mismatch |
| 간월산온천 |  | public-bath | KR | 울산광역시 울주군 상북면 알프스온천4 | 간월산온천텔 / motel,lodging,point_of_interest / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing 🟡type? DB=public-bath·G=lodging |
| 그랜드 하얏트 서울 |  | hotel-spa | KR | 서울특별시 용산구 소월로 322 | Grand Hyatt Seoul / resort_hotel,hotel,lodging / KR | 음식점·뷔페 | 🟡city-missing ⚪g-name-mismatch |
| 도미인 EXPRESS 서울 인사동 |  | hotel-spa | KR | 서울특별시 종로구 인사동길 20-9 | ドーミーインEXPRESS SEOUL 仁寺洞(インサドン) / hotel,lodging,point_of_interest / KR | 숙박·호텔 | 🟡city-missing ⚪g-name-mismatch |
| 도미인 서울 강남 |  | hotel-spa | KR | 서울특별시 강남구 봉은사로 134 | ドーミーインSEOULカンナム / hotel,lodging,point_of_interest / KR | 숙박·호텔 | 🟡city-missing ⚪g-name-mismatch |
| 솔로사우나레포 노량진점 | ✓ | private-sauna | KR | 서울특별시 동작구 노들로2길 7 노량 | 솔로사우나_레포 노량진점 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing ⚪g-name-mismatch |
| 스파앳홈 T2 인천공항 제2터미널점 |  | public-bath | KR | 인천광역시 중구 제2터미널대로 446 | 스파앳홈 인천공항2터미널 Spa at home Incheon Airport T2 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕,찜질 | 🟡city-missing ⚪g-name-mismatch |
| 더 리버사이드 호텔 더 메디스파 | ✓ | hotel-spa | KR | 서울 서초구 강남대로107길 6 | 더 리버사이드 호텔 더 메디스파 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 트리니티스파 신세계백화점센텀시티점 |  | hotel-spa | KR | 부산광역시 해운대구 센텀남대로 35  | 스파랜드 신세계백화점 센텀시티점 / sauna,public_bath,massage_spa / KR | 미용·피부,체형관리 | 🟡city-missing 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 조선 팰리스 서울 강남 |  | hotel-spa | KR | 서울특별시 강남구 테헤란로 231 센 | Josun Palace, a Luxury Collection Hotel, Seoul Gangnam / hotel,wedding_venue,lodging / KR | 숙박·호텔 | 🟡city-missing ⚪g-name-mismatch |
| 유성온천대온탕 |  | public-bath | KR | 대전광역시 유성구 온천로 33 | 유성온천대온탕 / hotel,lodging,point_of_interest / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing 🟡type? DB=public-bath·G=lodging |
| 하이디하우스 | ✓ | hotel-spa | KR | 서울특별시 서초구 성촌4길 11 | 하이디하우스 / spa,point_of_interest,establishment / KR | 음식점·카페,디저트 | 🟡city-missing 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 클럽디오아시스 스파&워터파크 |  | hotel-spa | KR | 부산광역시 해운대구 달맞이길 30 엘 | 클럽디 오아시스 스파&워터파크 / water_park,amusement_park,spa / KR | 레저,테마·워터파크 | 🟡city-missing 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 프리마스파 | ✓ | hotel-spa | KR | 서울특별시 강남구 도산대로102길 1 | 프리마스파 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 유림탕쑥사우나 |  | small-bath | KR | 부산광역시 동래구 명안로 23-1 | 23-1 / street_address / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing ⚪g-name-mismatch |
| 스파레이 | ✓ | public-bath | KR | 서울특별시 서초구 강남대로107길 5 | 스파레이 / spa,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| 신호사우나 |  | small-bath | KR | 서울특별시 용산구 장문로 98-1 1 | 신호찜질방사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 삼호궁전사우나 | ✓ | public-bath | KR | 서울특별시 서초구 논현로 87 | 삼호궁전사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕,찜질 | 🟡city-missing |
| 실로암사우나 | ✓ | public-bath | KR | 서울특별시 광진구 용마산로 171 | 실로암사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| Vabali |  | hotel-spa | DE | 6 Seydlitzstraße, Mi | 바발리 스파 베를린 / spa,point_of_interest,establishment / DE | (해외skip) | ⚪g-name-mismatch |
| 황금스파 | ✓ | public-bath | KR | 서울특별시 중구 청계천로 400 롯데 | 황금스파 / sauna,public_bath,massage_spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| AIRE Ancient Baths New York |  | hotel-spa | US | 88 Franklin Street,  | AIRE Ancient Baths New York · Tribeca / spa,gift_shop,public_bath / US | (해외skip) | 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 세현사우나 |  | small-bath | KR | 인천광역시 부평구 백범로 520 | 세현사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 레몬사우나 | ✓ | small-bath | KR | 서울특별시 광진구 광나루로 635 | 레몬사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 호텔더디자이너스 서울역점 남성전용 사우나 |  | hotel-spa | KR | 서울특별시 용산구 한강대로 305 호 | 호텔 더 디자이너스 서울역 / hotel,lodging,point_of_interest / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| Kuusijärvi |  | public-bath | FI | 3 Kuusijärventie, Va | Kuusijärventie 3 / premise,street_address / FI | (해외skip) | ⚪g-name-mismatch |
| KIWAMI SAUNA Osu |  | public-bath | JP | 1-chōme-4-12, Tachib | KIWAMI SAUNA 大須 / sauna,wellness_center,public_bath / JP | (해외skip) | ⚪g-name-mismatch |
| Kairyou-yu |  | small-bath | JP | 2-chōme-19-9, Higash | 카이료유 / public_bath,point_of_interest,establishment / JP | (해외skip) | ⚪g-name-mismatch |
| Therme Erding |  | hotel-spa | DE | 1-5 Thermenallee, Er | Therme Erding / water_park,sauna,amusement_park / DE | (해외skip) | 🟡type? DB=hotel-spa·G=public_bath/sauna |
| Shiriuchi Onsen Kokyu no Ma |  | public-bath | JP | 284, Yunosato, Shiri | Utopia Warakuen Shiriuchi Onsen Inn / japanese_inn,sauna,hotel / JP | (해외skip) | ⚪g-name-mismatch |
| Wellbe Sakae |  | hotel-spa | JP | 3-chōme-13-12, Sakae | 웰비 사카에 / sauna,public_bath,spa / JP | (해외skip) | ⚪g-name-mismatch |
| Shinagawa Sauna |  | public-bath | JP | 1-chōme-6-1, Ōi, Shi | Shinagawa Sauna / hostel,lodging,point_of_interest / JP | (해외skip) | 🟡type? DB=public-bath·G=lodging |
| Aomoriya by Hoshino Resorts |  | hotel-spa | JP | Horikirizawa-56, Inu | 호시노리조트 아오모리야 / hotel,japanese_inn,resort_hotel / JP | (해외skip) | ⚪g-name-mismatch |
| 아라고나이트 고온천 |  | hotel-spa | KR | 제주특별자치도 서귀포시 안덕면 산록남 | 아라고나이트 고온천 / public_bath,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡type? DB=hotel-spa·G=public_bath/sauna |
| Ume-yu |  | small-bath | JP | 175-1, Iwatakichō, S | 우메유 사우나 / public_bath,point_of_interest,establishment / JP | (해외skip) | ⚪g-name-mismatch |
| Shibuya Saunas |  | public-bath | JP | 18-9, Sakuragaokachō | 시부야 사우나 / sauna,public_bath,spa / JP | (해외skip) | ⚪g-name-mismatch |
| SKY SPA Yokohama |  | public-bath | JP | 2-chōme-19-12, Takas | 스카이 스파 요코하마 / spa,sauna,hotel / JP | (해외skip) | ⚪g-name-mismatch |
| 강변스파랜드 | ✓ | public-bath | KR | 서울특별시 광진구 구의강변로 45 | 강변스파랜드 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| Noboribetsu Grand Hotel |  | hotel-spa | JP | 154, Noboribetsuonse | 노보리베츠 그랜드 호텔 / hotel,lodging,point_of_interest / JP | (해외skip) | ⚪g-name-mismatch |
| sauna kolme kyla |  | public-bath | JP | 1-chōme-8-182, Toyon | sauna kolme kylä 岡山サウナ（サウナ コルメ キュラ） / sauna,public_bath,spa / JP | (해외skip) | ⚪g-name-mismatch |
| Kannojigoku Hotel |  | hotel-spa | JP | 257, Tano, Kokonoe,  | 칸노지고쿠 료칸 / japanese_inn,hotel,spa / JP | (해외skip) | ⚪g-name-mismatch |
| 소금강스파 |  | special | KR | 강원특별자치도 강릉시 연곡면 진고개로 | 소금강온천 / spa,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡ext-id-missing |
| 서울사우나 휘트니스 |  | public-bath | KR | 제주특별자치도 제주시 노형로 283 | 서울사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕,찜질 | 🟡ext-id-missing |
| Bettei Senjyuan |  | hotel-spa | JP | 614, Tanigawa, Minak | 벳테이 센쥬안 / japanese_inn,lodging,point_of_interest / JP | (해외skip) | ⚪g-name-mismatch |
| Yuyado Daiichi |  | hotel-spa | JP | 518, Yōrōushi, Nakas | 유야도 다이이치 / hotel,lodging,point_of_interest / JP | (해외skip) | ⚪g-name-mismatch |
| 유라이크 |  | private-sauna | KR | 서울특별시 용산구 청파로45길 19  | 1인 세신샵 유라이크스파 Ulike Spa Yongsan Seoul Premium Private Korean Body Scrub Care l 韓国個室アカスリl WOMAN ONLY / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| Onyado Nono Nanba |  | hotel-spa | JP | 1-chōme-4-18, Nippon | 온야도 노노 난바 / hotel,lodging,point_of_interest / JP | (해외skip) | ⚪g-name-mismatch |
| 고려사우나 | ✓ | public-bath | KR | 서울특별시 송파구 송파대로27길 30 | 고려탕 / public_bath,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| Bathhouse Williamsburg |  | public-bath | US | 103 North 10th Stree | Bathhouse / sauna,public_bath,swimming_pool / US | (해외skip) | 🟡city-missing |
| AIRE Ancient Baths Barcelona |  | hotel-spa | ES | 22 Passeig de Picass | Aire Ancient Baths | Barcelona / spa,gift_shop,public_bath / ES | (해외skip) | ⚪g-name-mismatch |
| Elamus Spa |  | hotel-spa | EE | 30 Akadeemia tee, Mu | Elamus Spa / spa,point_of_interest,establishment / EE | (해외skip) | 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 대성관 |  | public-bath | KR | 부산광역시 북구 금곡대로199번길 1 | 대성관 / restaurant,point_of_interest,food / KR | 한식·감자탕 | 🟡city-missing |
| 성수탕 |  | small-bath | KR | 서울특별시 성동구 성덕정19길 11 | 성수탕 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 로데오 스파 | ✓ | public-bath | KR | 서울특별시 강남구 선릉로 823 한양 | 로데오 스파 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| Koganeyu |  | public-bath | JP | 4-chōme-14-6, Taihei | 코가네유 / hotel,public_bath,lodging / JP | (해외skip) | ⚪g-name-mismatch |
| Hotta-yu sento |  | public-bath | JP | 3-chōme-20-14, Sekib | 호타유 / public_bath,point_of_interest,establishment / JP | (해외skip) | ⚪g-name-mismatch |
| Janu Tokyo |  | hotel-spa | JP | 1-chōme-2-1, Azabuda | 자누 도쿄 / hotel,lodging,point_of_interest / JP | (해외skip) | ⚪g-name-mismatch |
| 군인공제회관 M스포렉스 | ✓ | public-bath | KR | 서울특별시 강남구 남부순환로 2806 | 군인공제회관 / corporate_office,point_of_interest,establishment / KR | 스포츠시설·헬스장 | 🟡city-missing |
| TOTOPA Toritsu Meiji Koen |  | public-bath | JP | 5-7, Kasumigaokamach | TOTOPA 都立明治公園店 / sauna,public_bath,spa / JP | (해외skip) | ⚪g-name-mismatch |
| 관악24시불가마사우나 |  | public-bath | KR | 서울특별시 관악구 관악로 212 관악 | 관악24시불가마사우나 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 대영온천 |  | public-bath | KR | 부산광역시 남구 황령대로492번길 1 | 대영온천 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 버핏그라운드 광화문 |  | gym-sauna | KR | 서울특별시 중구 세종대로 136 B1 | 버핏그라운드 광화문 / spa,health,point_of_interest / KR | 스포츠시설·헬스장 | 🟡city-missing |
| 골드로즈사우나 |  | public-bath | KR | 서울특별시 강남구 선릉로86길 31  | 골드로즈사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| 선수촌사우나 |  | public-bath | KR | 서울특별시 송파구 양재대로 1164  | 선수촌사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 계룡스파텔대온천탕 |  | public-bath | KR | 대전광역시 유성구 온천로 81 | 계룡스파텔 대온천탕 / public_bath,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 광안해수월드 |  | public-bath | KR | 부산광역시 수영구 민락동 110-85 | 광안해수월드 / public_bath,sports_complex,sports_activity_location / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 동방온천사우나 |  | small-bath | KR | 부산광역시 동래구 금강로106번길 3 | 동방온천 hot spring / sauna,public_bath,spa / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 성지연사우나 |  | public-bath | KR | 서울특별시 강남구 테헤란로 313 지 | 성지연 사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 그랜드 하얏트 인천 |  | hotel-spa | KR | 인천광역시 중구 영종해안남로321번길 | 그랜드 하얏트 인천 / resort_hotel,hotel,lodging / KR | 숙박·호텔 | 🟡city-missing |
| 면역공방 |  | special | KR | 서울특별시 중구 퇴계로20길 2 지하 | 면역공방 / sauna,public_bath,spa / KR | 생활,편의·목욕,찜질 | 🟡city-missing |
| 금정산부곡온천 |  | public-bath | KR | 부산광역시 금정구 수림로20번길 36 | 금정산부곡온천 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 금샘탕 |  | small-bath | KR | 부산광역시 금정구 금샘로578번길 4 | 금샘탕 / public_bath,public_bathroom,point_of_interest / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 녹천탕 |  | small-bath | KR | 부산광역시 동래구 금강공원로26번길  | 녹천탕 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 24시사우나 네이버한방스파 |  | public-bath | KR | 서울특별시 마포구 큰우물로 53 지하 | 네이버한방스파 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 국제광천수온천 | ✓ | public-bath | KR | 부산광역시 부산진구 거제대로 70 7 | 국제광천수온천 / spa,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 금천파크온천호텔 |  | public-bath | KR | 부산광역시 동래구 금강로 140-1 | 금천파크온천 / spa,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 송도해수온천 송해온 |  | public-bath | KR | 인천광역시 연수구 인천타워대로197번 | 송해온 / public_bath,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 쉐르빌사우나 |  | public-bath | KR | 서울특별시 성동구 무학로6길 50 | 쉐르빌사우나 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 소노캄 여수 |  | hotel-spa | KR | 전라남도 여수시 오동도로 111 1층 | 셰프스 키친 / restaurant,point_of_interest,food / KR | 음식점·카페,디저트 | ⚪g-name-mismatch |
| 매일온천 |  | small-bath | KR | 서울특별시 광진구 자양로53길 109 | 매일온천사우나 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| Midorinokaze Resort Kitayuzawa |  | public-bath | JP | 300-2, Ōtakiku Kitay | 미도리노카제 리조트 기타유자와 / japanese_inn,hotel,lodging / JP | (해외skip) | ⚪g-name-mismatch |
| 황토와 소나무 불한증막 |  | special | KR | 전북특별자치도 정읍시 신태인읍 고산1 | 황토와소나무 / point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡coord-far 171932m |
| 백제불한증막 인삼사우나 |  | public-bath | KR | 서울특별시 송파구 백제고분로 293  | 백제인삼사우나 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 봉일스파랜드 |  | public-bath | KR | 서울특별시 관악구 은천로 28 봉일프 | 봉일스파랜드 / spa,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| 삼부건강랜드보석사우나 |  | public-bath | KR | 서울특별시 은평구 증산로21길 11  | 24시 삼부건강랜드 보석사우나 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 더앤리조트스파 |  | public-bath | KR | 강원 양양군 현남면 개매길 260 | 더앤리조트 / resort_hotel,hotel,lodging / KR | 여행,명소·온천,스파 | 🟡type? DB=public-bath·G=lodging |
| 보리여성불한증막 |  | public-bath | KR | 서울특별시 강남구 선릉로130길 20 | 보리 여성 불한증막 사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕,찜질 | 🟡city-missing |
| 블루오션웰니스스파 |  | public-bath | KR | 인천광역시 중구 자연대로 7 2층 2 | 블루오션웰니스스파 / spa,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| 더파크 스파랜드 |  | public-bath | KR | 서울특별시 영등포구 선유동1로 50  | 더파크 스파랜드 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 베뉴지아쿠아24 |  | public-bath | KR | 서울특별시 강서구 화곡로 347 지하 | 베뉴지아쿠아24 / sauna,public_bath,massage_spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| Taikou-no-Yu Hot Spring |  | public-bath | JP | Arimachō, Kita Ward, | 다이코노유 / public_bath,point_of_interest,establishment / JP | (해외skip) | ⚪g-name-mismatch |
| 루하스사우나 |  | public-bath | KR | 서울특별시 은평구 통일로 1022 지 | 루하스사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 센텀 스파랜드 |  | public-bath | KR | 부산광역시 해운대구 센텀남대로 35  | 스파랜드 신세계백화점 센텀시티점 / sauna,public_bath,massage_spa / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 수정사우나 |  | small-bath | KR | 서울특별시 서초구 반포대로21길 30 | 수정사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 만수탕 |  | small-bath | KR | 부산광역시 사하구 장림시장5길 255 | (검색0) | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 동래 반도 온천 |  | public-bath | KR | 부산광역시 동래구 금강공원로 37 | 동래반도온천 / public_bath,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 라성보석사우나 |  | public-bath | KR | 서울특별시 성동구 성수이로 118 성 | 라성스파 / spa,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| 도봉산 24시 불한증막 사우나 |  | public-bath | KR | 경기도 의정부시 평화로 252 지하1 | 도봉산불가마사우나 / spa,point_of_interest,establishment / KR | 생활,편의·찜질방 | ⚪g-name-mismatch |
| 스파마린 |  | public-bath | KR | 부산광역시 해운대구 마린시티2로 33 | 스파마린 / spa,public_bath,point_of_interest / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 스파렉스 굿모닝시티 |  | public-bath | KR | 서울특별시 중구 장충단로 247 굿모 | 24시 스파렉스 굿모닝시티 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 태화강참숯가마 |  | special | KR | 울산광역시 울주군 언양읍 대암둔기로  | 태화강참숯가마 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕,찜질 | 🟡city-missing |
| 할매탕 | ✓ | public-bath | KR | 부산광역시 해운대구 중동2로10번길  | 할매탕 / spa,point_of_interest,establishment / KR | 음식점·한식 | 🟡city-missing |
| 디오션 스파&사우나 |  | public-bath | KR | 전라남도 여수시 소호로 295 콘도  | 디오션리조트 / resort_hotel,water_park,golf_course / KR | 생활,편의·목욕탕,사우나 | 🟡type? DB=public-bath·G=lodging |
| 오레브핫스프링앤스파 |  | hotel-spa | KR | 제주특별자치도 서귀포시 태평로 152 | 오레브 핫스프링 앤 스파 / spa,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 원성탕 |  | small-bath | KR | 충청남도 천안시 동남구 원거리6길 2 | 25 / street_address / KR | 생활,편의·목욕탕,사우나 | ⚪g-name-mismatch |
| 혜우사우나 |  | public-bath | KR | 서울특별시 서대문구 신촌역로 10 B | 혜우사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 휘경인삼사우나 | ✓ | public-bath | KR | 서울특별시 동대문구 망우로 123 휘 | HG Sauna(휘경인삼사우나) / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 설해원 온천사우나 | ✓ | hotel-spa | KR | 강원특별자치도 양양군 손양면 공항로  | 설해온천사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡type? DB=hotel-spa·G=public_bath/sauna |
| 마포365구민센터 |  | public-bath | KR | 서울특별시 마포구 토정로 98 | 마포 365 구민센터 / sports_club,point_of_interest,association_or_organization / KR | 스포츠,오락·구민체육센터 | 🟡city-missing |
| 숲속한방랜드 |  | special | KR | 서울특별시 서대문구 봉원사길 75-7 | 숲속한방랜드 / public_bath,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| 동양사우나 |  | public-bath | KR | 서울특별시 은평구 가좌로7길 11 | 동양 사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 서울신라호텔 |  | hotel-spa | KR | 서울특별시 중구 동호로 249 | 서울신라호텔 / hotel,lodging,point_of_interest / KR | 숙박·호텔 | 🟡city-missing |
| 아난티 앳 부산 코브 |  | hotel-spa | KR | 부산광역시 기장군 기장읍 기장해안로  | 아난티 앳 부산 코브 / hotel,banquet_hall,wedding_venue / KR | 음식점·뷔페 | 🟡city-missing |
| 쉐레이암반수사우나 |  | public-bath | KR | 서울특별시 종로구 진흥로 432 1층 | 쉐레이암반수사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 유성온천불가마사우나 |  | public-bath | KR | 대전광역시 유성구 계룡로113번길 7 | 유성온천불가마사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 척산온천휴양촌 |  | public-bath | KR | 강원특별자치도 속초시 관광로 327 | 척산온천휴양촌 / hotel,lodging,point_of_interest / KR | 여행,명소·온천,스파 | 🟡type? DB=public-bath·G=lodging |
| 성수불막사우나 |  | special | KR | 서울특별시 성동구 동일로 143 성수 | 성수불막사우나 / spa,public_bath,point_of_interest / KR | 생활,편의·찜질방 | 🟡city-missing |
| 소노벨청송 솔샘온천 |  | public-bath | KR | 경상북도 청송군 주왕산면 소노로 38 | 소노벨 청송 / resort_hotel,hotel,lodging / KR | 여행,명소·온천,스파 | 🟡type? DB=public-bath·G=lodging |
| 오성건강랜드 |  | public-bath | KR | 서울특별시 서대문구 모래내로 143  | 오성건강랜드 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 우영탕 |  | small-bath | KR | 서울특별시 강북구 삼양로92길 23 | 우영탕 / restaurant,point_of_interest,food / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 주신사우나 |  | small-bath | KR | 서울특별시 중구 마장로9길 33 | 주신사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 한별불가마사우나 |  | public-bath | KR | 서울특별시 강동구 동남로75길 13- | 한별사우나 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 해피황토사우나 |  | public-bath | KR | 서울특별시 은평구 갈현로3길 15 | 해피황토사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 스파렉스 동묘 |  | public-bath | KR | 서울특별시 종로구 지봉로 19 13층 | 스파렉스 동묘 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 풍림24시불가마사우나 |  | public-bath | KR | 서울특별시 마포구 마포대로 127 | 풍림24시불가마사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 프라임노다지사우나 |  | public-bath | KR | 서울특별시 광진구 광나루로56길 5  | 프라임노다지사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 하이렉스파불한증막사우나 |  | special | KR | 서울특별시 노원구 노원로1길 67 | 하이렉스파 / public_bath,point_of_interest,establishment / KR | 생활,편의·찜질방 | 🟡city-missing |
| 영빈호텔사우나 | ✓ | public-bath | KR | 서울특별시 중구 퇴계로56길 18 | 영빈사우나 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 스파바이록시땅앳파크로쉬 |  | hotel-spa | KR | 강원특별자치도 정선군 북평면 중봉길  | 파크로쉬 리조트 앤 웰니스 / resort_hotel,hotel,lodging / KR | 생활,편의·목욕탕,사우나 | ⚪g-name-mismatch |
| 영진목욕탕사우나 |  | small-bath | KR | 서울특별시 양천구 목동중앙북로14길  | 영진목욕탕 / store,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 위례파크 사우나 |  | public-bath | KR | 경기도 성남시 수정구 위례광장로 19 | GA스타 / sauna,public_bath,spa / KR | 생활,편의·목욕,찜질 | ⚪g-name-mismatch |
| 우리유황온천 | ✓ | public-bath | KR | 서울특별시 광진구 자양로5길 33 지 | 우리유황온천 / spa,point_of_interest,establishment / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 유진사우나 |  | small-bath | KR | 서울특별시 서대문구 세무서5길 35 | 유진남여사우나 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 한신옥사우나 |  | small-bath | KR | 서울특별시 성동구 왕십리로31나길 1 | 한신옥사우나 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 우이령불가마주쉼사우나 | ✓ | public-bath | KR | 서울특별시 강북구 삼양로179길 21 | 우이령불가마주쉼사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕,찜질 | 🟡city-missing |
| 힐스파 |  | public-bath | KR | 부산광역시 해운대구 달맞이길117번길 | 힐스파 / sauna,public_bath,spa / KR | 생활,편의·찜질방 | 🟡city-missing |
| 유성온천사이언스 |  | public-bath | KR | 대전광역시 유성구 온천로 60 유성사 | 유성 사이언스 스파사우나 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 웨스틴 조선 서울 |  | hotel-spa | KR | 서울특별시 중구 소공로 106 | 웨스틴 조선 서울 / hotel,wedding_venue,lodging / KR | 음식점·뷔페 | 🟡city-missing |
| 송파파크하비오워터킹덤워터파크&찜질스파 |  | public-bath | KR | 서울특별시 송파구 송파대로 111 2 | 워터킹덤 & 스파 / water_park,tourist_attraction,amusement_park / KR | 레저,테마·워터파크 | 🟡city-missing |
| 옥정스파24시사우나 |  | public-bath | KR | 경기도 양주시 옥정동로7다길 62 대 | 오션스파24시 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | ⚪g-name-mismatch |
| 허심청 |  | public-bath | KR | 부산광역시 동래구 온천장로107번길  | 허심청 온천탕 / spa,sauna,public_bath / KR | 여행,명소·온천,스파 | 🟡city-missing |
| 단오풍정 |  | private-sauna | KR | 서울특별시 성북구 동소문로25길 13 | Danpoong spa: Hanok branch | 個室アカスリ Danpoong韓屋店 | Private Body Scrub Shop |1인 세신샵 단오풍정 한옥점 / sauna,public_bath,spa / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 24시인아사우나 |  | public-bath | KR | 경기도 양주시 고암길 358 | 신인아24시불가마사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | ⚪g-name-mismatch |
| 그랜드워커힐서울 |  | hotel-spa | KR | 서울특별시 광진구 광장동 22-1 그 | 그랜드 워커힐 서울 / hotel,lodging,point_of_interest / KR | 중식·중식당 | 🟡city-missing |
| 천호목욕탕 |  | small-bath | KR | 서울특별시 마포구 망원로7길 23 | 천호대중목욕탕 / spa,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 안토 | ✓ | hotel-spa | KR | 서울 강북구 삼양로 689 | 안토 / resort_hotel,hotel,lodging / KR | 숙박·콘도,리조트 | 🟡city-missing |
| 오라카이 청계산 호텔 사우나 | ✓ | hotel-spa | KR | 서울특별시 서초구 청계산로9길 1-7 | 오라카이 청계산 호텔, BW 프리미어 컬렉션 / hotel,lodging,point_of_interest / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
| 현대월드대중사우나 |  | public-bath | KR | 서울특별시 양천구 목동서로 77 현대 | 현대월드대중사우나 / public_bath,point_of_interest,establishment / KR | 생활,편의·목욕탕,사우나 | 🟡city-missing |
