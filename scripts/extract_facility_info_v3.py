#!/usr/bin/env python3
"""
카카오톡 채팅 CSV에서 사우나/목욕탕 시설 정보 추출 v3.
핵심 원칙: 시설명이 직접 언급된 메시지(또는 동일 유저의 연속 메시지)에서만 정보 추출.
컨텍스트 윈도우의 무관한 대화에서 온도/가격 등이 유입되지 않도록 엄격히 관리.
"""
import csv
import re
from collections import defaultdict

INPUT_PATH = "/Users/stella/Downloads/KakaoTalk_Chat_먼데이사우나 mondaysauna 함께만드는사우나♨️_2026-03-18-20-26-53.csv"
OUTPUT_PATH = "/Users/stella/Documents/sauna_log/docs/research/katalk-facility-detail-extract.csv"

SEED_FACILITIES = [
    "레몬사우나", "강변스파랜드", "신북온천", "홍삼스파", "블루스파",
    "백제인삼사우나", "영빈호텔사우나", "선수촌사우나", "보리사우나", "풍림사우나",
    "대영온천", "고려사우나", "우이령불가마", "라성스파", "휘경인삼사우나",
    "유천스파", "제일유황온천", "대영해수온천", "국제광천수온천", "광안해수월드",
    "메가스파", "위례파크사우나", "김녕용암해수사우나", "오라카이청계산사우나",
    "대성관", "힐스파", "청춘목욕탕", "설해원", "허심청", "프리마스파",
    "스파디움24", "아쿠아필드", "한별불가마", "해피황토사우나", "쉐레이암반수",
    "상암불꽃사우나", "더메디스파", "척산온천", "블루오션웰니스스파", "로데오스파",
    "삼호궁전사우나", "포도호텔", "필예온천", "안토사우나", "금천파크온천",
    "갈곶목욕탕", "골드로즈사우나",
]

# 제외할 이름 (커뮤니티명, 일반명사 등)
EXCLUDE_NAMES = {
    '먼데이사우나', '목욕탕', '사우나', '온천', '스파', '찜질방', '불가마',
    '호텔사우나', '동네사우나', '동네목욕탕', '대형사우나', '일반사우나',
    '일반목욕탕', '건식사우나', '습식사우나', '스팀사우나', '유황온천',
    '해수온천', '근처사우나', '핀란드사우나', '러시아사우나', '터키사우나',
    '전통사우나', '대중사우나', '핀란드식사우나', '일인사우나', '야외사우나',
    '여자사우나', '해수사우나', '인삼사우나', '해장사우나', '강남사우나',
    '서울사우나', '광교사우나',  # 지역+사우나 일반명사
    '메디스파',  # 더메디스파와 혼동
}


def read_messages(path):
    messages = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if len(row) >= 3:
                messages.append({
                    'date': row[0],
                    'user': row[1],
                    'message': row[2],
                    'idx': len(messages),
                })
            elif len(row) >= 1 and messages:
                messages[-1]['message'] += '\n' + ','.join(row)
    return messages


def get_related_messages(messages, center_idx):
    """
    시설명이 언급된 메시지 + 동일 유저의 바로 이어지는 메시지들.
    다른 유저의 바로 다음 1개 답장도 포함 (해당 시설에 대한 답변일 가능성).
    """
    center = messages[center_idx]
    related = [center['message']]
    user = center['user']

    # 동일 유저의 바로 이어지는 메시지 (연속 메시지)
    for i in range(center_idx + 1, min(len(messages), center_idx + 4)):
        if messages[i]['user'] == user:
            related.append(messages[i]['message'])
        else:
            # 다른 유저의 첫 번째 답장 1개만 포함
            related.append(messages[i]['message'])
            break

    return '\n'.join(related)


def extract_temps(text):
    """텍스트에서 온도 추출. 합리적 범위 검증 포함."""
    temps = {'온탕': '', '열탕': '', '냉탕': '', '건식': '', '습식': ''}

    patterns = {
        '열탕': [
            (r'열탕\s*[:：]?\s*(\d{2,3})\s*[도°]', None),
            (r'열탕\s*(\d{2,3})\s*도', None),
            (r'열탕\s*(\d{2,3})\b', lambda v: 38 <= int(v) <= 50),
        ],
        '온탕': [
            (r'온탕\s*[:：]?\s*(\d{2,3})\s*[도°]', None),
            (r'온탕\s*(\d{2,3})\s*도', None),
            (r'온탕\s*(\d{2,3})\b', lambda v: 35 <= int(v) <= 45),
        ],
        '냉탕': [
            (r'냉탕\s*[:：]?\s*(\d{1,2})\s*[도°]', None),
            (r'냉탕\s*(\d{1,2})\s*도', None),
            (r'냉수\s*[:：]?\s*(\d{1,2})\s*[도°]', None),
            (r'냉탕\s*(\d{1,2})\b', lambda v: 1 <= int(v) <= 30),
        ],
        '건식': [
            (r'건식\s*(?:사우나)?\s*[:：]?\s*(\d{2,3})\s*[도°]', None),
            (r'건식\s*(\d{2,3})\s*도', None),
            (r'건사\s*[:：]?\s*(\d{2,3})\s*[도°]', None),
        ],
        '습식': [
            (r'습식\s*(?:사우나)?\s*[:：]?\s*(\d{2,3})\s*[도°]', None),
            (r'습식\s*(\d{2,3})\s*도', None),
            (r'스팀\s*[:：]?\s*(\d{2,3})\s*[도°]', None),
        ],
    }

    for temp_type, pats in patterns.items():
        for pat, validator in pats:
            m = re.search(pat, text)
            if m:
                val = m.group(1)
                if validator is None or validator(val):
                    temps[temp_type] = val
                    break

    # 범위 검증
    for k, v in temps.items():
        if not v:
            continue
        n = int(v)
        if k == '열탕' and not (38 <= n <= 50):
            temps[k] = ''
        elif k == '온탕' and not (35 <= n <= 45):
            temps[k] = ''
        elif k == '냉탕' and not (1 <= n <= 30):
            temps[k] = ''
        elif k == '건식' and not (50 <= n <= 120):
            temps[k] = ''
        elif k == '습식' and not (40 <= n <= 100):
            temps[k] = ''

    return temps


TAG_KEYWORDS = {
    'hot-bath': ['열탕'],
    'warm-bath': ['온탕'],
    'cold-bath': ['냉탕', '냉수', '얼음탕', '아이스탕'],
    'dry-sauna': ['건식사우나', '건식', '건사'],
    'wet-sauna': ['습식사우나', '습식', '스팀사우나', '스팀룸', '스팀', '습사', '미스트'],
    'outdoor-bath': ['노천탕', '노천', '야외탕', '반노천'],
    'outdoor-air': ['외기욕', '외기', '쿨링존'],
    'jjimjilbang': ['찜질방', '찜질', '한증막', '한증'],
    'seshin': ['세신', '때밀이'],
    'bulgama': ['불가마'],
    'aufguss': ['아우프구스', '아우프', '뢰리'],
    'sleep-room': ['수면실', '휴게실'],
    'store': ['매점', '식당', '카페'],
    'parking': ['주차'],
    'ice-sauna': ['아이스사우나', '아이스룸', '얼음방'],
    'salt-room': ['소금방', '소금사우나', '솔트룸'],
    'charcoal': ['숯가마', '참숯', '황토'],
    'pool': ['수영장', '풀장', '워터파크'],
    'lounge': ['라운지', '리클라이너'],
}

QUALITY_KW = ['깨끗', '더러', '더럽', '청결', '수질', '관리', '위생', '냄새',
              '곰팡이', '노후', '깔끔', '지저분', '쾌적', '불쾌', '탁하', '맑']

SPECIAL_KW = ['타투', '문신', '24시', '새벽', '연중무휴', '폐업', '리뉴얼',
              '리모델링', '오픈', '여성전용', '남성전용', '예약', '무료', '셔틀']

REVIEW_KW = ['추천', '최고', '별로', '실망', '만족', '좋아', '좋음', '좋았',
             '최악', '갈만', '아쉬', '대박', '혜자', '가성비', '핫플', '인생',
             '신세계', '감동', '괜찮', '훌륭', '완벽', '꿀팁', '강추']


def extract_tags(text):
    tags = set()
    for tag, kws in TAG_KEYWORDS.items():
        for kw in kws:
            if kw in text:
                tags.add(tag)
                break
    return tags


def extract_quality(text, facility_name):
    """시설명이 같은 줄/문단에 있는 수질 관련 문장만 추출."""
    snippets = []
    for line in text.split('\n'):
        # 시설명이 있는 문장이거나, 시설명이 전체 텍스트에 있고 수질 키워드가 있는 줄
        has_quality = any(kw in line for kw in QUALITY_KW)
        if has_quality:
            clean = line.strip()[:100]
            if clean and clean not in snippets:
                snippets.append(clean)
    return snippets[:3]


def extract_prices(text):
    prices = []
    # "입장료 N원", "대인 N원", "세신 N원" 등
    for m in re.finditer(r'(입장료|요금|대인|소인|세신|이용료)\s*[:：]?\s*([\d,.]+)\s*원', text):
        prices.append(f"{m.group(1)} {m.group(2)}원")
    # "N만원" (1~20만원 범위)
    for m in re.finditer(r'(\d{1,2})[.]?(\d)?\s*만\s*원', text):
        if m.group(2):
            prices.append(f"{m.group(1)}.{m.group(2)}만원")
        else:
            val = int(m.group(1))
            if 0 < val <= 30:
                prices.append(f"{m.group(1)}만원")
    # "N,000원"
    for m in re.finditer(r'(\d{1,3}[,]?\d{3})\s*원', text):
        val = m.group(1).replace(',', '')
        # 가격 범위: 3000~100000원
        if 3000 <= int(val) <= 100000:
            formatted = f"{int(val):,}원"
            if formatted not in prices:
                prices.append(formatted)
    return list(dict.fromkeys(prices))[:4]


def extract_special(text):
    snippets = []
    for line in text.split('\n'):
        for kw in SPECIAL_KW:
            if kw in line.lower():
                clean = line.strip()[:100]
                if clean and clean not in snippets:
                    snippets.append(clean)
                break
    return snippets[:3]


def extract_reviews(text):
    found = set()
    for kw in REVIEW_KW:
        if kw in text:
            found.add(kw)
    return found


def discover_new_facilities(messages):
    """새로운 시설명 발견 (최소 2회 이상 언급, 일반명사 제외)."""
    counts = defaultdict(int)
    for msg in messages:
        text = msg['message']
        for m in re.finditer(r'([가-힣]{2,12}(?:사우나|온천|스파|목욕탕|불가마|찜질방|스파랜드))', text):
            name = m.group(1)
            if name not in EXCLUDE_NAMES and len(name) >= 4:
                counts[name] += 1
    # 고유명사: 특정 이름 패턴 + 최소 2회
    return {n for n, c in counts.items() if c >= 2}


def main():
    messages = read_messages(INPUT_PATH)
    print(f"Messages: {len(messages)}")

    new_fac = discover_new_facilities(messages)
    # 시드에 이미 있는 것 제거
    seed_set = set(SEED_FACILITIES)
    new_fac -= seed_set
    # 스파디움 (스파디움24 변형) 도 시드에 포함
    new_fac.discard('스파디움')

    all_facilities = sorted(seed_set | new_fac | {'스파디움'})

    print(f"Seed: {len(seed_set)}, New discovered: {len(new_fac)}")
    if new_fac:
        print(f"New: {sorted(new_fac)}")

    results = {}

    for facility in all_facilities:
        if facility in EXCLUDE_NAMES:
            continue

        # 시설명 직접 언급 메시지 찾기
        mention_indices = [i for i, m in enumerate(messages) if facility in m['message']]
        if not mention_indices:
            continue

        all_temps = {'온탕': '', '열탕': '', '냉탕': '', '건식': '', '습식': ''}
        all_tags = set()
        all_quality = []
        all_prices = []
        all_special = []
        all_reviews = set()

        for idx in mention_indices:
            # 시설명이 직접 언급된 메시지 + 동일 유저 연속 메시지
            related_text = get_related_messages(messages, idx)

            # 온도: 직접 메시지에서만 (가장 엄격)
            direct_msg = messages[idx]['message']
            temps = extract_temps(direct_msg)
            # 없으면 관련 메시지에서
            for k in temps:
                if not temps[k]:
                    related_temps = extract_temps(related_text)
                    if related_temps[k]:
                        temps[k] = related_temps[k]
            for k in temps:
                if temps[k] and not all_temps[k]:
                    all_temps[k] = temps[k]

            all_tags |= extract_tags(related_text)
            all_quality.extend(extract_quality(related_text, facility))
            all_prices.extend(extract_prices(related_text))
            all_special.extend(extract_special(related_text))
            all_reviews |= extract_reviews(related_text)

        # 중복 제거
        all_quality = list(dict.fromkeys(all_quality))[:3]
        all_prices = list(dict.fromkeys(all_prices))[:4]
        all_special = list(dict.fromkeys(all_special))[:3]

        results[facility] = {
            '시설명': facility,
            '온탕온도': all_temps['온탕'],
            '열탕온도': all_temps['열탕'],
            '냉탕온도': all_temps['냉탕'],
            '건식온도': all_temps['건식'],
            '습식온도': all_temps['습식'],
            '시설태그': ','.join(sorted(all_tags)),
            '수질/청결메모': ' | '.join(all_quality),
            '가격': ' / '.join(all_prices),
            '특이사항': ' | '.join(all_special),
            '후기키워드': ','.join(sorted(all_reviews)),
            '_mentions': len(mention_indices),
            '_is_seed': facility in seed_set or facility == '스파디움',
        }

    # 출력 — 시드 먼저, 그다음 새 발견
    print(f"\nTotal facilities with data: {len(results)}")
    print("\n=== SEED FACILITIES ===")
    for name in sorted(results, key=lambda x: -results[x]['_mentions']):
        d = results[name]
        if not d['_is_seed']:
            continue
        _print_facility(name, d)

    print("\n=== NEW DISCOVERIES ===")
    for name in sorted(results, key=lambda x: -results[x]['_mentions']):
        d = results[name]
        if d['_is_seed']:
            continue
        _print_facility(name, d)

    # CSV 저장
    fieldnames = ['시설명', '온탕온도', '열탕온도', '냉탕온도', '건식온도', '습식온도',
                   '시설태그', '수질/청결메모', '가격', '특이사항', '후기키워드']

    with open(OUTPUT_PATH, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for name in sorted(results.keys()):
            writer.writerow(results[name])

    print(f"\nCSV saved: {OUTPUT_PATH}")
    print(f"Total: {len(results)} facilities")


def _print_facility(name, d):
    has_info = any([d['온탕온도'], d['열탕온도'], d['냉탕온도'], d['건식온도'], d['습식온도'],
                    d['시설태그'], d['수질/청결메모'], d['가격'], d['특이사항']])
    marker = '★' if has_info else '  '
    temps = '/'.join(filter(None, [
        f"온{d['온탕온도']}" if d['온탕온도'] else '',
        f"열{d['열탕온도']}" if d['열탕온도'] else '',
        f"냉{d['냉탕온도']}" if d['냉탕온도'] else '',
        f"건{d['건식온도']}" if d['건식온도'] else '',
        f"습{d['습식온도']}" if d['습식온도'] else '',
    ]))
    print(f"{marker} [{name}] x{d['_mentions']}", end='')
    if temps:
        print(f"  T:{temps}", end='')
    print()
    if d['시설태그']:
        print(f"    tags: {d['시설태그']}")
    if d['수질/청결메모']:
        print(f"    수질: {d['수질/청결메모'][:120]}")
    if d['가격']:
        print(f"    가격: {d['가격'][:100]}")
    if d['특이사항']:
        print(f"    특이: {d['특이사항'][:120]}")
    if d['후기키워드']:
        print(f"    후기: {d['후기키워드']}")


if __name__ == '__main__':
    main()
