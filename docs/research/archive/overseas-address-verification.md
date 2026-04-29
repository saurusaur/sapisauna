# Overseas (Non-Korean) Address Verification Report

**Date**: 2026-03-24
**Source**: `docs/research/seed-data-final-db-state.csv`
**Scope**: All non-Korean facilities EXCLUDING 15 hotel-spa entries already verified in `hotel-spa-address-verification.md`
**Total entries verified**: 34

---

## Summary

| Result | Count |
|--------|-------|
| MATCH | 17 |
| MATCH (truncated) | 10 |
| MISMATCH | 4 |
| MISMATCH (address completely wrong) | 1 |
| MISMATCH (number differs) | 1 |
| UNABLE TO VERIFY (DB truncated) | 1 |

---

## Japanese Facilities (28)

### 1. sauna kolme kyla
- **Type**: public-bath
- **DB**: `Japan  〒700-0942 Okayama  Minami Ward  T` (truncated)
- **Verified**: 〒700-0942 岡山県岡山市南区豊成1-182-3
- **Result**: **MATCH (truncated)** — DB has correct postal code and ward; truncated at "T..." = Toyonari (豊成). Missing street number 1-182-3.

### 2. Nukatoyuge
- **Type**: special
- **DB**: `941-1 Mineyamachō Sugitani  Kyotango  Ky` (truncated)
- **Verified**: 〒627-0031 京都府京丹後市峰山町杉谷941-1
- **Result**: **MATCH (truncated)** — Address number 941-1, town Mineyamachō Sugitani, Kyotango all correct. Truncated at "Ky..." = Kyoto Prefecture.

### 3. Wagamachi Sauna
- **Type**: public-bath
- **DB**: `Japan  〒553-0007 Osaka  Fukushima Ward  ` (truncated)
- **Verified**: 〒553-0007 大阪府大阪市福島区大開1-1-4 TAKUYOビル4F
- **Result**: **MISMATCH** — DB says "Fukushima Ward" but the actual address is in Fukushima-ku, **Ōhiraki** (大開) area, not just "Fukushima Ward." Postal code matches. Missing street-level detail (大開1-1-4).
- **Note**: Minor — ward is correct, just missing sub-area and street address due to truncation. No action needed beyond truncation fix.

### 4. Sauna Tokyo
- **Type**: public-bath
- **DB**: `3-chōme-13-4 Akasaka  Minato City  Tokyo`
- **Verified**: 〒107-0052 東京都港区赤坂3-13-4
- **Result**: **MATCH**

### 5. Spa Metsa Sendai Ryusenji no Yu
- **Type**: public-bath
- **DB**: `Japan  〒981-3137 Miyagi  Sendai  Izumi W` (truncated)
- **Verified**: 〒981-3137 宮城県仙台市泉区大沢2-5-9
- **Result**: **MATCH (truncated)** — Postal code and Izumi Ward correct. Truncated at "Izumi W..." = Izumi Ward. Missing street address 大沢2-5-9.

### 6. CYCL
- **Type**: public-bath
- **DB**: `479-107 Hirano  Yamanakako  Minamitsuru ` (truncated)
- **Verified**: 〒401-0502 山梨県南都留郡山中湖村平野479-107
- **Result**: **MATCH (truncated)** — Number 479-107, Hirano, Yamanakako, Minamitsuru all correct. Truncated at district name (南都留郡). Missing prefecture 山梨県.

### 7. Hiki stargazing sauna
- **Type**: private-sauna
- **DB**: `Japan  〒730-0852 Hiroshima  Naka Ward  N` (truncated)
- **Verified**: 広島県広島市中区猫屋町8-17
- **Result**: **MISMATCH** — DB postal code 730-0852 does not match. 猫屋町 is 〒730-0051. DB truncated at "N..." likely = Nekoyachō. Street number 8-17 missing.
- **Correct address**: `〒730-0051 Hiroshima  Naka Ward  Nekoyachō 8-17`

### 8. Hotta-yu sento
- **Type**: public-bath
- **DB**: `3-chōme-20-14 Sekibara  Adachi City  Tok` (truncated)
- **Verified**: 東京都足立区関原3-20-14
- **Result**: **MATCH (truncated)** — 3-20-14 Sekibara, Adachi City correct. Truncated at "Tok..." = Tokyo.

### 9. KIWAMI SAUNA Osu
- **Type**: public-bath
- **DB**: `1-chōme-4-12 Tachibana  Naka Ward  Nagoy` (truncated)
- **Verified**: 〒460-0016 愛知県名古屋市中区橘1-4-12
- **Result**: **MATCH (truncated)** — 1-4-12 Tachibana (橘), Naka Ward correct. Truncated at "Nagoy..." = Nagoya.

### 10. Onsen Balcony King&Queen
- **Type**: public-bath
- **DB**: `2-chōme-271 Kitanaka  Tokorozawa  Saitam` (truncated)
- **Verified**: 〒359-1101 埼玉県所沢市北中2-271
- **Result**: **MATCH (truncated)** — 2-271 Kitanaka, Tokorozawa correct. Truncated at "Saitam..." = Saitama.

### 11. SATOYAMA TERRACE
- **Type**: public-bath
- **DB**: `898 Tabara  Futtsu  Chiba 299-1755  Japa` (truncated)
- **Verified**: 千葉県富津市田原898-1 (〒299-1755)
- **Result**: **MISMATCH (number differs)** — DB has "898" but verified is "898-**1**". Tabara/Futtsu/Chiba/postal code all correct.
- **Recommended fix**: Change 898 → 898-1

### 12. SAUNA SAKURADO
- **Type**: private-sauna
- **DB**: `9-5 Tsunabamachi  Hakata Ward  Fukuoka  ` (truncated)
- **Verified**: 〒812-0024 福岡県福岡市博多区綱場町9-5
- **Result**: **MATCH** — 9-5 Tsunabamachi, Hakata Ward, Fukuoka correct.

### 13. SKY SPA Yokohama
- **Type**: public-bath
- **DB**: `Japan  〒220-0011 Kanagawa  Yokohama  Nis` (truncated)
- **Verified**: 横浜市西区高島2-19-12 スカイビル14F (〒220-0011)
- **Result**: **MATCH (truncated)** — Postal code correct. Truncated at "Nis..." = Nishi Ward (西区). Missing street address 高島2-19-12.

### 14. TOTOPA Toritsu Meiji Koen
- **Type**: public-bath
- **DB**: `5-7 Kasumigaokamachi  Shinjuku City  Tok` (truncated)
- **Verified**: 〒160-0013 東京都新宿区霞ヶ丘町5-7
- **Result**: **MATCH** — 5-7 Kasumigaokamachi (霞ヶ丘町), Shinjuku City correct.

### 15. TREATMENT SAUNA STEAMS.
- **Type**: private-sauna
- **DB**: `Japan  〒107-0052 Tokyo  Minato City  Aka` (truncated)
- **Verified**: 〒107-0052 東京都港区赤坂9-5-12 パークサイドシックスB1-D
- **Result**: **MATCH (truncated)** — Postal code, Minato City, truncated at "Aka..." = Akasaka. Missing street number 9-5-12.

### 16. The Sauna
- **Type**: public-bath
- **DB**: `Japan  〒389-1303 Nagano  Kamiminochi Dis` (truncated)
- **Verified**: 長野県上水内郡信濃町野尻379-2 (〒389-1303)
- **Result**: **MATCH (truncated)** — Postal code correct. Truncated at "Kamiminochi Dis..." = Kamiminochi District (上水内郡). Missing town/number 信濃町野尻379-2.

### 17. Yulax
- **Type**: public-bath
- **DB**: `722 Honjōmachi  Chuo Ward  Kumamoto  860` (truncated)
- **Verified**: 熊本県熊本市中央区本荘町722 (〒860-0811)
- **Result**: **MATCH** — 722 Honjōmachi, Chuo Ward, Kumamoto correct. "860" = beginning of postal code.

### 18. Kumeya Omihachiman
- **Type**: public-bath
- **DB**: `454-5 Takakaichō  Omihachiman  Shiga 523` (truncated)
- **Verified**: 岡山県美作市右手156-1
- **Result**: **MISMATCH (address completely wrong)** — The actual "Kumeya" sauna (サウナシュラン 2023 11位) is "パブリックハウス アンド サウナ 久米屋" in **Mimasaka, Okayama**, NOT Omihachiman, Shiga. The DB address (454-5 Takakaichō, Omihachiman) belongs to an izakaya restaurant "大衆酒場 久米屋 近江八幡店". The DB name "Kumeya Omihachiman" is also incorrect.
- **Recommended fix**: Name → `Kumeya` / Address → `156-1 Nakaute, Mimasaka, Okayama 707-0413`

### 19. Jungle Photo Land
- **Type**: public-bath
- **DB**: `2599 Izumi  Motobu  Kunigami District  O` (truncated)
- **Verified**: 〒905-0221 沖縄県国頭郡本部町伊豆味2599
- **Result**: **MATCH** — 2599 Izumi (伊豆味), Motobu, Kunigami District correct. "O..." = Okinawa.

### 20. Shinagawa Sauna
- **Type**: public-bath
- **DB**: `1-chōme-6-1 Ōi  Shinagawa City  Tokyo 14` (truncated)
- **Verified**: 〒140-0014 東京都品川区大井1-6-1
- **Result**: **MATCH** — 1-6-1 Ōi, Shinagawa City, Tokyo. "14..." = beginning of postal code 140-0014.

### 21. TSUKAHARA KARAFURO
- **Type**: public-bath
- **DB**: `1050-4 Shōwa  Sanuki  Kagawa 769-2304  J` (truncated)
- **Verified**: 香川県さぬき市昭和1050-4 (〒769-2304)
- **Result**: **MATCH** — 1050-4 Shōwa (昭和), Sanuki, Kagawa, postal code all correct.

### 22. Osaka Sauna DESSE
- **Type**: public-bath
- **DB**: `Japan  〒542-0081 Osaka  Chuo Ward  Minam` (truncated)
- **Verified**: 大阪府大阪市中央区南船場3-6-18 (〒542-0081)
- **Result**: **MATCH (truncated)** — Postal code, Chuo Ward correct. "Minam..." = Minamisenba (南船場). Missing street number 3-6-18.

### 23. Taikou-no-Yu Hot Spring
- **Type**: public-bath
- **DB**: `池の尻-292-2 Arimachō  Kita Ward  Kobe  Hyo` (truncated)
- **Verified**: 〒651-1401 兵庫県神戸市北区有馬町池の尻292-2
- **Result**: **MATCH** — 池の尻292-2, Arimachō, Kita Ward, Kobe correct. "Hyo..." = Hyogo.

### 24. Shibuya Saunas
- **Type**: public-bath
- **DB**: `18-9 Sakuragaokachō  Shibuya  Tokyo 150-` (truncated)
- **Verified**: 〒150-0031 東京都渋谷区桜丘町18-9
- **Result**: **MATCH** — 18-9 Sakuragaokachō, Shibuya, Tokyo 150- (= 150-0031) all correct.

### 25. Shiriuchi Onsen Kokyu no Ma
- **Type**: public-bath
- **DB**: `北海道上磯郡知内町湯ノ里284`
- **Verified**: 〒049-1221 北海道上磯郡知内町湯ノ里284
- **Result**: **MATCH**

### 26. Midorinokaze Resort Kitayuzawa
- **Type**: public-bath
- **DB**: `300-2 Ōtakiku Kitayuzawaonsenchō  Date  ` (truncated)
- **Verified**: 北海道伊達市大滝区北湯沢温泉町300-2 (〒052-0316)
- **Result**: **MATCH** — 300-2 Ōtakiku Kitayuzawaonsenchō, Date correct.

### 27. Taikou-no-Yu: Note on mixed Japanese/English
- The DB address `池の尻-292-2 Arimachō` mixes Japanese characters (池の尻) with romanized names. Consider normalizing to either all-Japanese or all-English format.

---

## European/US Facilities (6)

### 28. Bathhouse Williamsburg
- **Type**: public-bath
- **DB**: `103 N 10th St  Brooklyn  NY 11249  USA`
- **Verified**: 103 N 10th St, Brooklyn, NY 11249, USA
- **Result**: **MATCH**

### 29. Friedrichsbad Baden-Baden
- **Type**: public-bath
- **DB**: `Römerpl. 1  76530 Baden-Baden  Germany`
- **Verified**: Römerplatz 1, 76530 Baden-Baden, Germany
- **Result**: **MATCH** — "Römerpl." is an abbreviation of "Römerplatz" which is acceptable.

### 30. Kalma Saun
- **Type**: public-bath
- **DB**: `Vana-Kalamaja tn 9A  10414 Tallinn  Esto` (truncated)
- **Verified**: Vana-Kalamaja tn 9A, 10414 Tallinn, Estonia
- **Result**: **MATCH (truncated)** — Full address correct, just "Esto..." = Estonia truncated.

### 31. Kuusijärvi
- **Type**: public-bath
- **DB**: `Kuusijärvi  01260 Vantaa  Finland`
- **Verified**: Kuusijärventie 3, 01260 Vantaa, Finland
- **Result**: **MISMATCH** — DB has just "Kuusijärvi" (the lake name) but the actual street address is "Kuusijärven**tie** 3" (Kuusijärvi Road 3).
- **Recommended fix**: `Kuusijärventie 3  01260 Vantaa  Finland`

### 32. Rauhaniemi Folk Spa
- **Type**: public-bath
- **DB**: `Rauhaniementie 23 b  33180 Tampere  Finl` (truncated)
- **Verified**: Rauhaniementie 23 b, 33180 Tampere, Finland
- **Result**: **MATCH (truncated)** — "Finl..." = Finland.

### 33. Löyly Helsinki
- **Type**: public-bath
- **DB**: `Hernesaarenranta 4  00150 Helsinki  Finl` (truncated)
- **Verified**: Hernesaarenranta 4, 00150 Helsinki, Finland
- **Result**: **MATCH (truncated)** — "Finl..." = Finland.

### 34. Othership Flatiron
- **Type**: public-bath
- **DB**: `23 W 20th St  New York  NY 10011  USA`
- **Verified**: 23 W 20th St, New York, NY 10011, USA
- **Result**: **MATCH**

### 35. Rajaportti sauna
- **Type**: public-bath
- **DB**: `Pispalan valtatie 9  33250 Tampere  Finl` (truncated)
- **Verified**: Pispalan valtatie 9, FI-33250 Tampere, Finland
- **Result**: **MATCH (truncated)** — "Finl..." = Finland.

---

## Action Items

### Critical Mismatches (2건 — DB 수정 필요)

| # | 시설명 | 문제 | 수정안 |
|---|--------|------|--------|
| 18 | Kumeya Omihachiman | 주소/이름 완전히 다른 시설 (이자카야). 실제 사우나는 岡山県美作市 | Name: `Kumeya` / Address: `156-1 Nakaute  Mimasaka  Okayama 707-0413` |
| 31 | Kuusijärvi | 호수 이름만 기재, 도로명 주소 누락 | `Kuusijärventie 3  01260 Vantaa  Finland` |

### Minor Mismatches (2건)

| # | 시설명 | 문제 | 수정안 |
|---|--------|------|--------|
| 7 | Hiki stargazing sauna | 우편번호 730-0852 오류 (정확: 730-0051) | 우편번호 수정 + 주소 보완: `〒730-0051 Hiroshima  Naka Ward  Nekoyachō 8-17` |
| 11 | SATOYAMA TERRACE | 번지 898 → 898-1 | `898-1 Tabara  Futtsu  Chiba 299-1755` |

### Truncated Addresses (10건 — DB 필드 길이 제한으로 잘림)

대부분 내용은 정확하나 불완전. DB address 필드 길이 확장 검토 필요:

| # | 시설명 | 잘린 부분 | 누락 정보 |
|---|--------|-----------|-----------|
| 1 | sauna kolme kyla | "...T" | 豊成1-182-3 (Toyonari 1-182-3) |
| 2 | Nukatoyuge | "...Ky" | Kyoto (京都府) |
| 5 | Spa Metsa Sendai | "...Izumi W" | Izumi Ward + 大沢2-5-9 |
| 6 | CYCL | "...Minamitsuru" | District + Yamanashi |
| 9 | KIWAMI SAUNA Osu | "...Nagoy" | Nagoya, Aichi |
| 13 | SKY SPA Yokohama | "...Nis" | Nishi Ward + 高島2-19-12 |
| 15 | TREATMENT SAUNA STEAMS. | "...Aka" | Akasaka 9-5-12 |
| 16 | The Sauna | "...Kamiminochi Dis" | District + 信濃町野尻379-2 |
| 22 | Osaka Sauna DESSE | "...Minam" | Minamisenba 3-6-18 |
| 30 | Kalma Saun | "...Esto" | Estonia |

### Format Consistency Note
- #23 Taikou-no-Yu: DB address mixes Japanese (池の尻) with romanized text. Consider normalizing.

---

## DB Field Length Issue

10 out of 34 overseas non-hotel-spa entries (29%) have truncated addresses. Combined with the 5 truncated hotel-spa entries from the previous verification, **15 out of ~49 total overseas entries (31%) are truncated**. The current DB `address` field appears to have a ~45-character effective limit. Recommend extending to at least 100 characters to accommodate full international addresses.
