#!/usr/bin/env python3
"""
시드 데이터 통합 스크립트
- seed-data.json (90건)
- notion-seed-candidates.json (105건)
- csv-new-facilities.json (46건)
- notion-simple-review-analysis.md (37건 중 신규 후보 테이블)
- 보조 리서치 파일들 (태그, 검증 결과)
- 웨스틴 조선 서울 (수동 추가)
"""

import json
import re
import os
from collections import defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)

# ─── 제외 대상 ───
EXCLUDED = {"드래곤힐스파", "뜨끈란온천", "한남사우나", "청수탕", "백두산랜드", "연지사우나"}

# ─── male-only / female-only 시설 ───
MALE_ONLY = {
    "サウナ東京", "品川サウナ", "大阪サウナDESSE", "KIWAMI SAUNA 大須",
    "ウェルビー栄", "わがまちサウナ 大阪野田", "호텔더디자이너스 서울역점"
}
FEMALE_ONLY = {"TREATMENT SAUNA SteaMs.", "보리사우나", "SteaMs."}

# ─── mixed-bath 해외 시설 ───
MIXED_BATH = {
    "Friedrichsbad Baden-Baden", "Löyly Helsinki", "BATHHOUSE Williamsburg",
    "Othership Flatiron", "AIRE Ancient Baths", "Therme Erding",
    "ELAMUS SPA", "Kuusijärvi", "Kalma Saun",
    "SATOYAMA TERRACE", "The Sauna", "CYCL", "sauna kolme kylä",
    "知内温泉 呼吸の間", "久米屋", "亜熱帯サウナ", "Botanical Pool Club",
    "설해원", "하이디하우스", "파크로쉬 리조트앤웰니스",
    "Lauhaniemi sauna",
}

# ─── private-bath 시설 ───
PRIVATE_BATH = {
    "솔로사우나레포", "에가톳 제주", "포도호텔", "제주온쉼",
    "솔로사우나레포 광명점", "Janu Tokyo Spa House",
    "SAUNA SAKURADO", "ぬかとゆげ",
}

# ─── 알려진 중복 매핑 (대표명 → 별칭들) ───
KNOWN_ALIASES = {
    "더메디스파 신사": ["리버사이드 호텔 메디스파", "리버사이드호텔 메디스파"],
    "척산온천": [],
    "블루오션웰니스스파": [],
    "더앤온천": ["더앤리조트온천"],
    "안토사우나": ["파라스파"],
    "국제광천수온천": [],
    "백제인삼사우나": ["백제불한증막 인삼사우나", "백제불한증막인삼사우나"],
    "풍림사우나": ["풍림24시불가마사우나"],
    "센텀스파랜드 부산": ["부산 센텀 스파랜드", "센텀 스파랜드"],
    "클럽디 오아시스 부산": ["클럽 디 오아시스"],
    "베뉴지아쿠아24": ["베뉴지 아쿠아 24", "베뉴지아 아쿠아 24"],
    "능암 탄산온천": ["능암탄산온천"],
    "매일온천": ["매일온천사우나"],
    "실로암사우나": [],
    "솔로사우나레포": ["솔로사우나레포 광명점"],
    "아쿠아필드 하남": [],
    "영빈호텔사우나": ["영빈호텔 사우나"],
    "대영온천": ["대영해수온천"],
    "오라카이청계산사우나": ["오라카이 청계산 호텔 사우나"],
    "롯데사우나": ["골드로즈사우나"],  # 동일 건물이지만 다른 시설 — 별도 유지
    "산방산 탄산온천": ["산방산탄산스파"],
    "레몬사우나": [],
    "휘경인삼사우나": [],
    "Lauhaniemi sauna": ["Rauhaniemi Folk Spa"],
    "YULAX": ["湯らっくす"],
    "御船山楽園ホテル": ["らかんの湯"],
}


def normalize(name: str) -> str:
    """이름 정규화: 공백, 특수문자 제거 후 소문자"""
    s = re.sub(r'[\s\-_·&()（）【】「」\'\".,/\\]', '', name)
    return s.lower()


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def parse_review_table(md_path):
    """마크다운 하단의 '시드 추가 후보 요약' 테이블 파싱"""
    items = []
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  [SKIP] {md_path} 파일 없음")
        return items

    # "시드 추가 후보 요약" 이후의 테이블 찾기
    marker = "시드 추가 후보 요약"
    idx = content.find(marker)
    if idx < 0:
        print(f"  [SKIP] {md_path} - 테이블 마커 없음")
        return items

    lines = content[idx:].split('\n')
    header_found = False
    for line in lines:
        line = line.strip()
        if not line.startswith('|'):
            if header_found:
                break
            continue
        cols = [c.strip() for c in line.split('|')]
        cols = [c for c in cols if c]  # 빈 문자열 제거
        if len(cols) < 3:
            continue
        if cols[0] in ('시설명', '---', '----'):
            header_found = True
            continue
        if re.match(r'^-+$', cols[0]):
            continue

        name = cols[0]
        try:
            price = cols[1].replace(',', '').strip()
        except:
            price = ""
        tags_str = cols[2] if len(cols) > 2 else ""
        tags = [t.strip() for t in tags_str.split(',') if t.strip()]

        item = {
            "name": name,
            "source_hint": "naver",
            "theme_keyword": "먼데이사우나 리뷰",
            "facility_type": "gender-bath",
            "facilities_tags": tags,
            "_source": "simple-review",
        }
        if price and price != "0":
            item["price_adult"] = price

        items.append(item)

    return items


def parse_research_tags(md_path):
    """리서치 파일에서 시설별 facility_type과 tags 파싱"""
    result = {}
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  [SKIP] {md_path} 파일 없음")
        return result

    # "## N. 시설명" 또는 테이블 형태 파싱
    # 먼저 마크다운 헤딩 형태
    sections = re.split(r'\n## \d+\.\s+', content)
    for section in sections[1:]:  # 첫 번째는 헤더 이전
        lines = section.strip().split('\n')
        name = lines[0].strip().rstrip(' (중복 - #32와 동일)').rstrip(' (중복 - #33과 동일)')
        # 이름에서 괄호 안 추가 설명 제거
        name = re.sub(r'\s*\(.*?\)\s*$', '', name)
        ftype = None
        tags = []
        address = None

        for line in lines:
            line = line.strip()
            if '**facility_type**' in line:
                m = re.search(r'`([^`]+)`', line)
                if m:
                    ftype = m.group(1)
            elif '**tags**' in line:
                tags = re.findall(r'`([^`]+)`', line)
            elif '**주소**' in line:
                m = re.search(r'\*\*주소\*\*:\s*(.+)', line)
                if m:
                    address = m.group(1).strip()

        if name:
            result[name] = {"facility_type": ftype, "tags": tags, "address": address}

    # 테이블 형태 파싱 (facility-tags-research-48.md)
    table_lines = [l for l in content.split('\n') if l.strip().startswith('|') and not re.match(r'^\|\s*-', l.strip())]
    for line in table_lines:
        cols = [c.strip() for c in line.split('|')]
        cols = [c for c in cols if c]
        if len(cols) < 5:
            continue
        if cols[0] in ('#', '---'):
            continue
        try:
            int(cols[0])
        except ValueError:
            continue

        name = cols[1].strip()
        # 이름에서 괄호 안 텍스트 분리
        name = re.sub(r'\s*\(.*?\)\s*$', '', name)
        ftype = cols[2].strip() if len(cols) > 2 else None
        tags_str = cols[3] if len(cols) > 3 else ""
        tags = [t.strip() for t in tags_str.split(',') if t.strip()]
        city = cols[4] if len(cols) > 4 else ""

        result[name] = {"facility_type": ftype, "tags": tags, "city": city}

    return result


def parse_verification_tags(md_path):
    """검증 파일에서 시설명 → {facility_type, tags} 파싱"""
    result = {}
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  [SKIP] {md_path} 파일 없음")
        return result

    for line in content.split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cols = [c.strip() for c in line.split('|')]
        cols = [c for c in cols if c]
        if len(cols) < 6:
            continue
        try:
            int(cols[0])
        except ValueError:
            continue

        name = cols[1].strip()
        status = cols[2].strip()
        address = cols[3].strip() if cols[3].strip() != '-' else None
        ftype = cols[4].strip() if cols[4].strip() not in ('-', '') else None
        tags_str = cols[5] if len(cols) > 5 else ""
        tags = [t.strip() for t in tags_str.split(',') if t.strip()]

        if status in ('confirmed', 'unknown'):
            result[name] = {
                "facility_type": ftype,
                "tags": tags,
                "address": address,
                "status": status,
            }

    return result


# ─── 데이터 로드 ───
print("=== 시드 데이터 통합 시작 ===\n")

# 1) seed-data.json
seed_data = load_json(os.path.join(BASE, 'seed-data.json'))
print(f"1) seed-data.json: {len(seed_data)}건")

# 2) notion-seed-candidates.json
notion_data = load_json(os.path.join(BASE, 'notion-seed-candidates.json'))
print(f"2) notion-seed-candidates.json: {len(notion_data)}건")

# 3) csv-new-facilities.json
csv_data = load_json(os.path.join(BASE, 'csv-new-facilities.json'))
print(f"3) csv-new-facilities.json: {len(csv_data)}건")

# 4) 리뷰 테이블
review_items = parse_review_table(os.path.join(ROOT, 'docs/research/notion-simple-review-analysis.md'))
print(f"4) simple-review 테이블: {len(review_items)}건")

# 5) 리서치 태그 파일들
tags_44 = parse_research_tags(os.path.join(ROOT, 'docs/research/facility-tags-44-websearch.md'))
print(f"5) facility-tags-44: {len(tags_44)}건")
tags_48 = parse_research_tags(os.path.join(ROOT, 'docs/research/facility-tags-research-48.md'))
print(f"6) facility-tags-48: {len(tags_48)}건")

# 6) CSV 검증
verify_1 = parse_verification_tags(os.path.join(ROOT, 'docs/research/katalk-facility-verification.md'))
print(f"7) katalk-verification-1: {len(verify_1)}건")
verify_2 = parse_verification_tags(os.path.join(ROOT, 'docs/research/katalk-facility-verification-23.md'))
print(f"8) katalk-verification-2: {len(verify_2)}건")

# ─── 정규화 이름 → 대표 이름 매핑 구축 ───
alias_map = {}  # normalized alias → canonical name
for canonical, aliases in KNOWN_ALIASES.items():
    alias_map[normalize(canonical)] = canonical
    for a in aliases:
        alias_map[normalize(a)] = canonical


def get_canonical(name):
    """정규화된 이름으로 대표 이름 반환"""
    n = normalize(name)
    return alias_map.get(n, name)


# ─── 통합 딕셔너리 (canonical name → merged record) ───
unified = {}
dup_count = 0
source_counts = defaultdict(int)


def merge_record(existing, new_data, source_label):
    """기존 레코드에 새 데이터 병합"""
    for key, val in new_data.items():
        if key == '_source':
            continue
        if key == 'facilities_tags':
            # 태그 합집합
            existing_tags = set(existing.get('facilities_tags', []))
            new_tags = set(val) if isinstance(val, list) else set()
            existing['facilities_tags'] = sorted(existing_tags | new_tags)
        elif key in ('source_hint', 'theme_keyword', 'name'):
            # 기존 유지 (더 좋은 값이 있으면 업데이트)
            if not existing.get(key):
                existing[key] = val
        else:
            # 비어있는 필드만 채움
            if not existing.get(key) or existing.get(key) in ('', '0', 'x', '-', None, [], '미확인', '표시 없음', '알수없음'):
                if val and val not in ('', '0', 'x', '-', None, [], '미확인', '표시 없음', '알수없음'):
                    existing[key] = val


def add_item(item, source_label):
    """통합 딕셔너리에 아이템 추가 또는 병합"""
    global dup_count

    name = item.get('name', '').strip()
    if not name:
        return
    if name in EXCLUDED:
        return

    canonical = get_canonical(name)

    if canonical in unified:
        # 중복 → 병합
        merge_record(unified[canonical], item, source_label)
        dup_count += 1
    else:
        # 신규
        record = dict(item)
        record['name'] = canonical
        record.pop('_source', None)
        record.pop('in_seed', None)
        unified[canonical] = record
        source_counts[source_label] += 1


# ─── 1단계: notion-seed-candidates 먼저 (가장 풍부) ───
for item in notion_data:
    name = item.get('name', '')
    if name in EXCLUDED:
        continue
    add_item(item, 'notion')

# ─── 2단계: seed-data.json ───
for item in seed_data:
    name = item.get('name', '')
    if name in EXCLUDED:
        continue
    add_item(item, 'seed')

# ─── 3단계: csv 데이터 ───
for item in csv_data:
    name = item.get('name', '')
    if name in EXCLUDED:
        continue

    # 닉네임 또는 unknown 제외: 뜨끈란온천은 이미 EXCLUDED
    # 행복사우나 (닉네임 가능성), 선수촌사우나 (unknown) → 그래도 추가 (이름 형태는 시설)
    record = {
        "name": name,
        "source_hint": "katalk",
        "theme_keyword": f"카톡 커뮤니티 언급 {item.get('mentions', 0)}회",
    }
    if item.get('region') and item['region'] != '미확인':
        record['region'] = item['region']
    if item.get('notes'):
        record['notes'] = item['notes']
    if item.get('mentions'):
        record['mentions'] = item['mentions']

    add_item(record, 'csv')

# ─── 4단계: simple-review 테이블 ───
for item in review_items:
    name = item.get('name', '')
    if name in EXCLUDED:
        continue

    # hotel-sauna 태그 추가 대상
    hotel_names = {"도미인 EXPRESS 서울 인사동", "더케이호텔경주 스파온천",
                   "여수 히든베이호텔 사우나", "호텔더디자이너스 서울역점"}
    if name in hotel_names:
        if 'hotel-sauna' not in item.get('facilities_tags', []):
            item.setdefault('facilities_tags', []).append('hotel-sauna')

    add_item(item, 'simple-review')

# ─── 5단계: 웨스틴 조선 서울 추가 ───
westin = {
    "name": "웨스틴 조선 서울",
    "source_hint": "naver",
    "theme_keyword": "5성급 호텔 사우나",
    "facility_type": "gender-bath",
    "facilities_tags": ["hot-bath", "cold-bath", "dry-sauna", "wet-sauna", "scrub",
                        "massage", "indoor-rest", "shampoo-bodywash", "dryer-free", "hotel-sauna"],
    "hot_temp": "43",
    "warm_temp": "40",
    "cold_temp": "18",
    "dry_sauna_temp": "88",
    "wet_sauna_temp": "53",
    "review_bath_gender": "male",
    "one_liner": "5성급 호텔 특유의 차분함과 위생, 온기 세신 브랜드 운영"
}
add_item(westin, 'manual')

# ─── 6단계: 리서치 태그 보강 ───
def apply_research_tags(research_data, label):
    """리서치 파일에서 파싱한 태그를 통합 데이터에 병합"""
    applied = 0
    for rname, rdata in research_data.items():
        canonical = get_canonical(rname)
        if canonical in unified:
            record = unified[canonical]
            # tags 병합
            if rdata.get('tags'):
                existing_tags = set(record.get('facilities_tags', []))
                new_tags = set(rdata['tags'])
                record['facilities_tags'] = sorted(existing_tags | new_tags)
                applied += 1
            # facility_type 보강
            if rdata.get('facility_type') and not record.get('facility_type'):
                record['facility_type'] = rdata['facility_type']
            # address 보강
            if rdata.get('address') and not record.get('address'):
                record['address'] = rdata['address']
    print(f"  {label}: {applied}건 태그 보강")


apply_research_tags(tags_44, 'tags-44')
apply_research_tags(tags_48, 'tags-48')

# 검증 파일에서 태그 보강
for vdata_dict, label in [(verify_1, 'verify-1'), (verify_2, 'verify-2')]:
    applied = 0
    for vname, vdata in vdata_dict.items():
        canonical = get_canonical(vname)
        if canonical in unified:
            record = unified[canonical]
            if vdata.get('tags'):
                existing_tags = set(record.get('facilities_tags', []))
                new_tags = set(vdata['tags'])
                record['facilities_tags'] = sorted(existing_tags | new_tags)
                applied += 1
            if vdata.get('facility_type') and not record.get('facility_type'):
                record['facility_type'] = vdata['facility_type']
            if vdata.get('address') and not record.get('address'):
                record['address'] = vdata['address']
    print(f"  {label}: {applied}건 태그 보강")


# ─── 7단계: facility_type 최종 보정 ───
for name, record in unified.items():
    # male-only / female-only 오버라이드
    if name in MALE_ONLY or record.get('name') in MALE_ONLY:
        record['facility_type'] = 'male-only'
    elif name in FEMALE_ONLY or record.get('name') in FEMALE_ONLY:
        record['facility_type'] = 'female-only'
    elif name in MIXED_BATH or record.get('name') in MIXED_BATH:
        record['facility_type'] = 'mixed-bath'
    elif name in PRIVATE_BATH or record.get('name') in PRIVATE_BATH:
        record['facility_type'] = 'private-bath'

    # resort-spa, hotel-sauna는 category tag이지 facility_type이 아님
    if record.get('facility_type') in ('resort-spa', 'hotel-sauna'):
        cat_tag = record['facility_type']
        tags = set(record.get('facilities_tags', []))
        tags.add(cat_tag)
        record['facilities_tags'] = sorted(tags)
        record['facility_type'] = 'gender-bath'

    # 기본값 설정
    if not record.get('facility_type'):
        record['facility_type'] = 'gender-bath'

    # facilities_tags 없으면 빈 배열
    if not record.get('facilities_tags'):
        record['facilities_tags'] = []

    # 불필요한 내부 필드 정리
    record.pop('in_seed', None)
    record.pop('_source', None)
    record.pop('mentions', None)
    record.pop('notes', None)

# ─── 롯데사우나 ≠ 골드로즈사우나 수정 ───
# 이 둘은 같은 건물이지만 다른 시설 → 별칭 해제
# (이미 둘 다 존재하면 문제 없음)

# ─── 출력 ───
output = sorted(unified.values(), key=lambda x: x.get('name', ''))

# 출력 필드 순서 정리
FIELD_ORDER = [
    'name', 'address', 'region', 'source_hint', 'theme_keyword',
    'facility_type', 'facilities_tags',
    'price_adult', 'price_child',
    'cold_temp', 'warm_temp', 'hot_temp',
    'dry_sauna_temp', 'wet_sauna_temp',
    'bath_config', 'sauna_config',
    'review_bath_gender', 'one_liner',
]

ordered_output = []
for item in output:
    ordered = {}
    for key in FIELD_ORDER:
        if key in item:
            ordered[key] = item[key]
    # 나머지 필드도 추가
    for key in item:
        if key not in ordered:
            ordered[key] = item[key]
    ordered_output.append(ordered)

out_path = os.path.join(BASE, 'seed-data-unified.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(ordered_output, f, ensure_ascii=False, indent=2)

# ─── 통계 ───
print(f"\n=== 통합 완료 ===")
print(f"총 건수: {len(ordered_output)}")
print(f"중복 제거/병합: {dup_count}건")

print(f"\n--- facility_type 분포 ---")
ftype_counts = defaultdict(int)
for item in ordered_output:
    ftype_counts[item.get('facility_type', 'unknown')] += 1
for ft, cnt in sorted(ftype_counts.items(), key=lambda x: -x[1]):
    print(f"  {ft}: {cnt}")

print(f"\n--- 소스별 신규 기여 건수 ---")
for src, cnt in sorted(source_counts.items(), key=lambda x: -x[1]):
    print(f"  {src}: {cnt}")

print(f"\n출력: {out_path}")
