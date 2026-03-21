#!/usr/bin/env python3
"""
카카오톡 CSV에서 사우나 시설 정보를 3단계로 정밀 추출하는 스크립트 v2.
핵심 개선: 온도는 같은 문장/단락에 시설명이 있을 때만 할당 (컨텍스트 오염 방지)
"""

import csv
import re
import json
from collections import defaultdict
from pathlib import Path

CSV_PATH = "/Users/stella/Downloads/KakaoTalk_Chat_먼데이사우나 mondaysauna 함께만드는사우나♨️_2026-03-18-20-26-53.csv"
OUTPUT_CSV = "/Users/stella/Documents/sauna_log/docs/research/katalk-facility-detail-v2.csv"
DEBUG_PATH = "/Users/stella/Documents/sauna_log/docs/research/katalk-extraction-debug.json"

# ── 시설 키워드 매핑 (더 엄격하게: 짧은 키워드는 제거) ──
FACILITY_KEYWORDS = {
    "레몬사우나": ["레몬사우나", "레몬 사우나"],
    "강변스파랜드": ["강변스파랜드", "강변스파", "강변 스파랜드"],
    "신북온천": ["신북온천", "신북 온천"],
    "홍삼스파": ["홍삼스파", "홍삼 스파"],
    "블루스파": ["블루스파", "블루 스파"],
    "백제인삼스파": ["백제인삼", "백제불한증막", "백제불한증"],
    "영빈호텔": ["영빈호텔", "영빈 호텔"],
    "선수촌사우나": ["선수촌사우나", "선수촌 사우나", "선수촌"],
    "보리사우나": ["보리사우나", "보리여성", "보리 사우나"],
    "풍림사우나": ["풍림사우나", "풍림24시", "풍림 사우나"],
    "대영온천": ["대영온천", "대영해수", "대영 온천"],
    "고려사우나": ["고려사우나", "고려 사우나"],
    "우이령불가마": ["우이령불가마", "우이령"],
    "라성스파": ["라성스파", "라성보석"],
    "휘경인삼": ["휘경인삼", "휘경 인삼"],
    "유천스파": ["유천스파", "유천 스파"],
    "제일유황": ["제일유황", "제일 유황"],
    "국제광천수": ["국제광천수"],
    "광안해수": ["광안해수"],
    "메가스파": ["메가스파"],
    "위례파크": ["위례파크"],
    "김녕용암": ["김녕용암"],
    "오라카이": ["오라카이"],
    "대성관": ["대성관"],
    "힐스파": ["힐스파"],
    "청춘목욕탕": ["청춘목욕탕", "청춘 목욕탕"],
    "설해원": ["설해원"],
    "허심청": ["허심청"],
    "프리마스파": ["프리마스파", "프리마 스파", "프리마"],
    "스파디움": ["스파디움"],
    "아쿠아필드": ["아쿠아필드", "아쿠아 필드"],
    "한별불가마": ["한별불가마"],
    "해피황토": ["해피황토"],
    "쉐레이": ["쉐레이"],
    "상암불꽃": ["상암불꽃"],
    "더메디스파": ["더메디스파", "메디스파", "리버사이드"],
    "척산온천": ["척산온천"],
    "블루오션": ["블루오션"],
    "로데오스파": ["로데오스파", "로데오 스파"],
    "삼호궁전": ["삼호궁전"],
    "포도호텔": ["포도호텔"],
    "필예온천": ["필예온천"],
    "안토사우나": ["안토사우나", "안토"],
    "금천파크": ["금천파크"],
    "갈곶목욕탕": ["갈곶목욕탕"],
    "골드로즈": ["골드로즈", "롯데사우나"],
    "더앤온천": ["더앤온천", "더앤리조트"],
    "덕구온천": ["덕구온천"],
    "율암온천": ["율암온천"],
    "능암탄산": ["능암탄산"],
    "네이처스파": ["네이처스파"],
    "황금스파": ["황금스파", "황금온천"],
    "하이디하우스": ["하이디하우스", "하이디"],
    "실로암사우나": ["실로암사우나", "실로암"],
    "센텀스파랜드": ["센텀스파랜드", "센텀스파"],
    "클럽디오아시스": ["클럽디오아시스", "디오아시스"],
    "클럽케이": ["클럽케이", "클럽K"],
    "스파렉스": ["스파렉스"],
    "드래곤힐스파": ["드래곤힐스파", "드래곤힐"],
    "더파크스파랜드": ["더파크스파랜드", "더파크스파"],
    "봉일스파": ["봉일스파"],
    "네이버한방스파": ["네이버한방스파", "네이버한방"],
    "금진온천": ["금진온천", "호텔탑스텐"],
    "월문온천": ["월문온천"],
    "우리유황": ["우리유황"],
    "반도온천": ["반도온천"],
    "북한산온천": ["북한산온천", "비젠"],
    "천성산온천": ["천성산온천"],
    "초정약수": ["초정약수"],
    "해미안": ["해미안"],
    "산방산": ["산방산"],
    "솔로사우나": ["솔로사우나", "솔로 사우나"],
    "워커힐": ["워커힐"],
    "웨스틴조선": ["웨스틴조선", "웨스틴 조선"],
    "조선팰리스": ["조선팰리스", "조선 팰리스"],
    "그랜드하얏트": ["그랜드하얏트", "그랜드 하얏트"],
    "도미인": ["도미인"],
    "신라호텔": ["신라호텔"],
    "코오롱호텔": ["코오롱호텔"],
    "아난티": ["아난티"],
    "소노캄": ["소노캄"],
    "파크로쉬": ["파크로쉬"],
    "한화리조트": ["한화리조트"],
}

TAG_KEYWORDS = {
    "hot-bath": ["온탕", "온수탕", "따뜻한 탕", "중온탕"],
    "very-hot-bath": ["열탕", "뜨거운 탕", "고온탕"],
    "cold-bath": ["냉탕", "냉수탕", "찬물탕", "찬탕"],
    "ice-bath": ["얼음탕", "아이스탕", "극냉탕", "극냉", "빙탕"],
    "dry-sauna": ["건식", "건식사우나", "드라이사우나"],
    "wet-sauna": ["습식", "습식사우나", "스팀사우나", "스팀룸", "스팀방"],
    "bulgama": ["불가마", "불한증", "한증막"],
    "open-air-bath": ["노천탕", "노천", "야외탕"],
    "outdoor-rest": ["외기욕", "외기"],
    "indoor-rest": ["내기욕", "휴게"],
    "jjimjilbang": ["찜질방", "찜질"],
    "scrub": ["세신", "때밀이"],
    "massage": ["마사지", "안마"],
    "food": ["매점", "식당", "카페"],
    "sleep-room": ["수면실", "수면방"],
    "parking": ["주차"],
    "aufguss": ["아우프구스", "아우프", "aufguss"],
    "self-loyly": ["셀프로율리", "로율리", "loyly", "뢸뤼", "로우뤼"],
    "tattoo-friendly": ["타투", "문신"],
}

IGNORE_PATTERNS = re.compile(r"joined this chatroom|left this chatroom|^Photo$|^photo$")


def read_csv(path):
    """CSV 읽기"""
    rows = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # skip header
        for row in reader:
            if len(row) >= 3:
                msg = ','.join(row[2:]) if len(row) > 3 else row[2]
                rows.append({'date': row[0], 'user': row[1], 'message': msg})
            elif len(row) >= 1 and rows:
                rows[-1]['message'] += '\n' + ','.join(row)
    return rows


def find_facilities_in_text(text):
    """텍스트에서 시설명 찾기 — 발견된 위치도 반환"""
    found = []
    text_lower = text.lower()
    for facility, keywords in FACILITY_KEYWORDS.items():
        for kw in keywords:
            pos = text_lower.find(kw.lower())
            if pos != -1:
                found.append((facility, pos, kw))
                break
    return found


def find_primary_facility(text):
    """메시지에서 주요 시설 1개를 결정 (제목/첫 언급 우선)"""
    facs = find_facilities_in_text(text)
    if not facs:
        return None
    # 가장 먼저 언급된 시설
    facs.sort(key=lambda x: x[1])
    return facs[0][0]


def find_all_facilities(text):
    """메시지에서 모든 시설명 추출"""
    return list(set(f[0] for f in find_facilities_in_text(text)))


def find_tags_in_text(text):
    found = set()
    for tag, keywords in TAG_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                found.add(tag)
                break
    return found


def extract_temperatures_strict(text):
    """
    온도 추출 — 엄격 모드.
    '냉탕온도(16도)' 형태의 괄호 안 패턴, '온탕 42도', '건식 100도' 등.
    숫자만 단독으로 나오는 건 무시.
    체감 온도: "체감 N도" 또는 "체감온도 N도" 패턴일 때만 체감으로 표시.
    """
    temps = defaultdict(list)
    # 체감 온도 판별: "체감 42도", "체감온도 42도" 등 명시적 패턴만
    is_perceived = bool(re.search(r'체감\s*(?:온도\s*)?\d{2,3}\s*도', text))

    # 단락별로 분석
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue

        # ── 온탕 ──  (N도 X 역방향 패턴 제거 — "습식 52도 건식" 같은 오매칭 방지)
        for pat in [
            r'온탕\s*[:\s(]*(\d{2,3})\s*도',
            r'온탕온도\s*[:\s(]*(\d{2,3})\s*도',
            r'온수\s*[:\s(]*(\d{2,3})\s*도',
            r'중온탕\s*[:\s(]*(\d{2,3})\s*도',
        ]:
            for m in re.finditer(pat, line):
                v = int(m.group(1))
                if 35 <= v <= 50:
                    temps['hot'].append(v)

        # ── 열탕 ──
        for pat in [
            r'열탕\s*[:\s(]*(\d{2,3})\s*도',
            r'고온탕\s*[:\s(]*(\d{2,3})\s*도',
            r'열탕[^0-9]{0,30}?(\d{2,3})\s*도',  # "열탕(쑥탕) 43도" 등
        ]:
            for m in re.finditer(pat, line):
                v = int(m.group(1))
                if 38 <= v <= 55:
                    temps['very_hot'].append(v)
        # 열탕 범위
        for m in re.finditer(r'열탕\s*[:\s(]*(\d{2,3})\s*[-~]\s*(\d{2,3})\s*도', line):
            for g in [m.group(1), m.group(2)]:
                v = int(g)
                if 38 <= v <= 55:
                    temps['very_hot'].append(v)

        # ── 냉탕 ──
        for pat in [
            r'냉탕\s*[:\s(]*(\d{1,2})\s*도',
            r'냉탕온도\s*[:\s(]*(\d{1,2})\s*도',
            r'냉수\s*[:\s(]*(\d{1,2})\s*도',
            r'찬[물탕]\s*[:\s(]*(\d{1,2})\s*도',
        ]:
            for m in re.finditer(pat, line):
                v = int(m.group(1))
                if 1 <= v <= 28:
                    temps['cold'].append(v)
        # 냉탕 범위 패턴: "냉탕온도(22-23도)"
        for m in re.finditer(r'냉탕[온도]*\s*[:\s(]*(\d{1,2})\s*[-~]\s*(\d{1,2})\s*도', line):
            for g in [m.group(1), m.group(2)]:
                v = int(g)
                if 1 <= v <= 28:
                    temps['cold'].append(v)

        # ── 건식 ──
        for pat in [
            r'건식\s*[:\s(]*(\d{2,3})\s*도',
            r'건식사우나\s*[:\s(]*(\d{2,3})\s*도',
            r'드라이\s*[:\s(]*(\d{2,3})\s*도',
        ]:
            for m in re.finditer(pat, line):
                v = int(m.group(1))
                if 50 <= v <= 130:
                    temps['dry'].append(v)
        # 건식 범위: "(98-99도)"
        for m in re.finditer(r'건식[사우나]*\s*[:\s(]*(\d{2,3})\s*[-~]\s*(\d{2,3})\s*도', line):
            for g in [m.group(1), m.group(2)]:
                v = int(g)
                if 50 <= v <= 130:
                    temps['dry'].append(v)

        # ── 습식 ──
        for pat in [
            r'습식\s*[:\s(]*(\d{2,3})\s*도',
            r'습식사우나\s*[:\s(]*(\d{2,3})\s*도',
            r'스팀\s*[:\s(]*(\d{2,3})\s*도',
        ]:
            for m in re.finditer(pat, line):
                v = int(m.group(1))
                if 35 <= v <= 90:
                    temps['wet'].append(v)

        # ── 노천탕 ──
        for pat in [
            r'노천[탕]?\s*[:\s(]*(\d{2,3})\s*도',
        ]:
            for m in re.finditer(pat, line):
                v = int(m.group(1))
                if 30 <= v <= 50:
                    temps['open_air'].append(v)

    return temps, is_perceived


def extract_generic_temps(text):
    """
    명시적 라벨 없이 온도 구조로 나열된 패턴 (예: "42도, 40도, 38도, 25도, 19도")
    하이디하우스 같은 상세 후기에서 캡처.
    """
    # "42도, 40도, 38도, 25도, 19도에 걸쳐"
    all_temps = [int(m.group(1)) for m in re.finditer(r'(\d{2,3})\s*도', text)]
    return all_temps


def extract_price(text):
    prices = []
    for m in re.finditer(r'(?:입장료|입장|이용료|이용|가격)\s*[:\s]*(\d{1,2}[,.]?\d{3})\s*원', text):
        prices.append(m.group(1).replace(',', '').replace('.', ''))
    # "N만N천원" → skip complex
    # "N원" near price context
    if not prices:
        for m in re.finditer(r'(\d{1,2}[,.]?\d{3})\s*원', text):
            v = int(m.group(1).replace(',', '').replace('.', ''))
            if 5000 <= v <= 30000:
                # 세신가격과 구분: 세신 근처면 제외
                start = max(0, m.start() - 10)
                context = text[start:m.start()]
                if '세신' not in context:
                    prices.append(str(v))
    return list(dict.fromkeys(prices))


def extract_scrub_price(text):
    prices = []
    for m in re.finditer(r'세신[^.]{0,20}?(\d{1,2}[,.]?\d{3,5})\s*원', text):
        prices.append(m.group(1).replace(',', '').replace('.', ''))
    return list(dict.fromkeys(prices))


def extract_water_quality(text):
    notes = []
    keywords = ['수질', '물이 ', '청결', '깨끗', '더러', '위생', '미끌', '까끌', '관리']
    for kw in keywords:
        idx = text.find(kw)
        if idx != -1:
            start = max(0, idx - 10)
            end = min(len(text), idx + 40)
            snippet = text[start:end].replace('\n', ' ').strip()
            if len(snippet) > 8:
                notes.append(snippet)
    return list(dict.fromkeys(notes))[:3]


def extract_special_notes(text):
    notes = []
    checks = [
        ('타투', '타투'), ('문신', '문신'), ('24시', '24시간'),
        ('리뉴얼', '리뉴얼'), ('폐업', '폐업'), ('공사', '공사'),
        ('휴업', '휴업'), ('꿀팁', '꿀팁'), ('수건', '수건'),
    ]
    for kw, label in checks:
        if kw in text:
            idx = text.find(kw)
            start = max(0, idx - 10)
            end = min(len(text), idx + 40)
            snippet = text[start:end].replace('\n', ' ').strip()
            notes.append(snippet)
    return list(dict.fromkeys(notes))[:4]


def extract_review_quote(text):
    sentences = re.split(r'[.!?\n]', text)
    review_kw = ['추천', '좋았', '최고', '만족', '별로', '아쉬', '대박', '인생',
                  '재방문', '진짜', '완전', '감동', '힐링', '천국', '극락']
    scored = []
    for s in sentences:
        s = s.strip()
        if len(s) < 10 or len(s) > 80:
            continue
        score = sum(1 for kw in review_kw if kw in s)
        if score > 0:
            scored.append((score, s))
    scored.sort(key=lambda x: -x[0])
    return [s for _, s in scored[:2]]


def main():
    print("Reading CSV...")
    rows = read_csv(CSV_PATH)
    print(f"Total rows: {len(rows)}")

    messages = [r for r in rows if not IGNORE_PATTERNS.search(r['message'])]
    print(f"After filtering: {len(messages)}")

    # ── 시설별 데이터 ──
    facility_data = defaultdict(lambda: {
        'hot': [], 'very_hot': [], 'cold': [], 'dry': [], 'wet': [], 'open_air': [],
        'tags': set(), 'water_notes': [], 'prices': [], 'scrub_prices': [],
        'special': [], 'reviews': [], 'raw_messages': [],
    })

    # ── 연속 메시지 병합 ──
    merged_messages = []
    i = 0
    while i < len(messages):
        msg = messages[i]
        combined = msg['message']
        user = msg['user']
        j = i + 1
        while j < len(messages) and messages[j]['user'] == user:
            combined += '\n' + messages[j]['message']
            j += 1
        merged_messages.append({
            'date': msg['date'], 'user': user, 'message': combined,
            'indices': list(range(i, j))
        })
        i = j

    print(f"Merged messages: {len(merged_messages)}")

    # ── 메인 추출: 각 (병합된) 메시지를 분석 ──
    temp_pattern = re.compile(r'\d{2,3}\s*도')

    for entry in merged_messages:
        text = entry['message']
        if len(text) < 5:
            continue

        # 이 메시지에서 언급된 시설들 찾기
        mentioned = find_all_facilities(text)
        if not mentioned:
            continue

        has_temp = bool(temp_pattern.search(text))
        is_long = len(text) >= 100

        # 시설이 1개만 언급 → 모든 정보를 해당 시설에 할당
        # 시설이 2개 이상 → 온도는 할당하지 않음 (오염 방지), 태그/리뷰는 주시설에만
        if len(mentioned) == 1:
            fac = mentioned[0]

            if has_temp:
                temps, perceived = extract_temperatures_strict(text)
                prefix = "체감 " if perceived else ""
                for key, vals in temps.items():
                    for v in vals:
                        facility_data[fac][key].append(f"{prefix}{v}" if perceived else str(v))

            if is_long:
                tags = find_tags_in_text(text)
                facility_data[fac]['tags'].update(tags)
                facility_data[fac]['prices'].extend(extract_price(text))
                facility_data[fac]['scrub_prices'].extend(extract_scrub_price(text))
                facility_data[fac]['water_notes'].extend(extract_water_quality(text))
                facility_data[fac]['special'].extend(extract_special_notes(text))
                facility_data[fac]['reviews'].extend(extract_review_quote(text))
                facility_data[fac]['raw_messages'].append(text[:500])
            else:
                # 짧은 메시지도 태그는 추출
                tags = find_tags_in_text(text)
                facility_data[fac]['tags'].update(tags)
                if has_temp:
                    facility_data[fac]['raw_messages'].append(text[:300])

        elif len(mentioned) >= 2:
            # 여러 시설 언급: 단락별로 분리 시도
            paragraphs = re.split(r'\n\n+', text)
            for para in paragraphs:
                para_facs = find_all_facilities(para)
                if len(para_facs) == 1:
                    fac = para_facs[0]
                    if has_temp and temp_pattern.search(para):
                        temps, perceived = extract_temperatures_strict(para)
                        prefix = "체감 " if perceived else ""
                        for key, vals in temps.items():
                            for v in vals:
                                facility_data[fac][key].append(f"{prefix}{v}" if perceived else str(v))

                    tags = find_tags_in_text(para)
                    facility_data[fac]['tags'].update(tags)
                    if len(para) >= 50:
                        facility_data[fac]['reviews'].extend(extract_review_quote(para))
                        facility_data[fac]['water_notes'].extend(extract_water_quality(para))
                        facility_data[fac]['special'].extend(extract_special_notes(para))
                        facility_data[fac]['prices'].extend(extract_price(para))
                        facility_data[fac]['raw_messages'].append(para[:300])

            # 전체 메시지에서 태그는 주 시설에
            primary = find_primary_facility(text)
            if primary:
                tags = find_tags_in_text(text)
                facility_data[primary]['tags'].update(tags)

    # ── Stage 1b: 온도 메시지 컨텍스트 보강 — 비활성화 ──
    # 오염 위험이 높아 비활성화. 온도는 시설명이 같은 메시지에 있을 때만 신뢰.
    print("\n=== Stage 1b: Orphan rescue DISABLED (too much contamination risk) ===")

    # ── 결과 정리 ──
    # 빈 시설 제거
    non_empty = {}
    for fac, data in facility_data.items():
        has_content = (
            any(data[k] for k in ['hot','very_hot','cold','dry','wet','open_air']) or
            data['tags'] or data['water_notes'] or data['prices'] or
            data['reviews'] or data['raw_messages']
        )
        if has_content:
            non_empty[fac] = data

    print(f"\n=== Total facilities with data: {len(non_empty)} ===")
    for fac in sorted(non_empty.keys()):
        data = non_empty[fac]
        temp_info = []
        for k, label in [('hot','온'), ('very_hot','열'), ('cold','냉'), ('dry','건'), ('wet','습'), ('open_air','노')]:
            if data[k]:
                temp_info.append(f"{label}:{','.join(data[k])}")
        tags_count = len(data['tags'])
        print(f"  {fac}: tags={tags_count} temps=[{' '.join(temp_info)}] msgs={len(data['raw_messages'])}")

    # ── CSV 출력 ──
    def collapse(vals):
        if not vals:
            return ''
        unique = sorted(set(vals), key=lambda x: (not x.replace('-','').replace(' ','').replace('체감','').isdigit(), x))
        return '|'.join(unique)

    output_rows = []
    for fac in sorted(non_empty.keys()):
        data = non_empty[fac]
        tags = sorted(data['tags'])
        water = list(dict.fromkeys(data['water_notes']))[:3]
        prices = list(dict.fromkeys(data['prices']))[:3]
        scrub_prices = list(dict.fromkeys(data['scrub_prices']))[:2]
        special = list(dict.fromkeys(data['special']))[:4]
        reviews = list(dict.fromkeys(data['reviews']))[:2]

        row = {
            '시설명': fac,
            '온탕온도': collapse(data['hot']),
            '열탕온도': collapse(data['very_hot']),
            '냉탕온도': collapse(data['cold']),
            '건식온도': collapse(data['dry']),
            '습식온도': collapse(data['wet']),
            '노천탕온도': collapse(data['open_air']),
            '시설태그': ','.join(tags),
            '수질청결메모': '|'.join(w[:50] for w in water),
            '입장료': '|'.join(prices),
            '세신가격': '|'.join(scrub_prices),
            '특이사항': '|'.join(s[:50] for s in special),
            '후기발췌': '|'.join(r[:80] for r in reviews),
        }
        output_rows.append(row)

    fieldnames = ['시설명','온탕온도','열탕온도','냉탕온도','건식온도','습식온도','노천탕온도',
                  '시설태그','수질청결메모','입장료','세신가격','특이사항','후기발췌']

    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"\nCSV saved: {OUTPUT_CSV}")
    print(f"Facilities: {len(output_rows)}")

    # ── Debug JSON ──
    debug = {}
    for fac, data in non_empty.items():
        debug[fac] = {
            'temps': {k: data[k] for k in ['hot','very_hot','cold','dry','wet','open_air']},
            'tags': sorted(data['tags']),
            'prices': data['prices'],
            'scrub_prices': data['scrub_prices'],
            'water_notes': data['water_notes'],
            'special': data['special'],
            'reviews': data['reviews'],
            'message_count': len(data['raw_messages']),
            'sample_messages': data['raw_messages'][:5],
        }
    with open(DEBUG_PATH, 'w', encoding='utf-8') as f:
        json.dump(debug, f, ensure_ascii=False, indent=2)
    print(f"Debug JSON saved: {DEBUG_PATH}")


if __name__ == '__main__':
    main()
