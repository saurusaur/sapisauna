#!/usr/bin/env python3
"""
영업중 목욕장업 CSV → Supabase places / place_sources 시드 스크립트

입력 : data/생활_목욕장업_영업중.csv (지방행정 인허가 데이터, 영업중만 필터됨)
출력 : Supabase places + place_sources 테이블에 적재

매핑
  places         : country_code='KR', latitude/longitude(좌표 변환), facility_type='public-bath',
                   bath_policy='gender-bath', coordinate_source='manual', status='active'
  place_sources  : source='manual', name_original=사업장명, address_original=도로명주소(없으면 지번),
                   external_id=관리번호, latitude/longitude

좌표 : CSV 좌표정보(X/Y) 는 EPSG:5174(중부원점 TM, Bessel) → WGS84(EPSG:4326) 로 변환.
       빈 좌표는 NULL (지도에 안 찍힘, 목록엔 표시).

연결 : .env.local 의 NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (RLS 우회) 사용.
       PostgREST 로 벌크 insert (id 는 클라이언트 생성 UUID → places/place_sources 연결).

사용 : python3 scripts/seed_baths_from_csv.py [--keep] [--dry-run]
  --keep    : 기존 manual 소스 데이터를 지우지 않고 추가 (기본은 manual 재적재 = 멱등)
  --dry-run : DB 미기록, 파싱·변환·건수만 출력
"""
import csv
import json
import math
import os
import sys
import uuid
import urllib.request
import urllib.error

CSV_PATH = "data/생활_목욕장업_영업중.csv"
ENV_PATH = ".env.local"
SRC_EPSG = "EPSG:5174"   # 지방행정 인허가 좌표계
CHUNK = 1000             # 벌크 insert 청크 크기
DEDUP_RADIUS_M = 100     # 기존(non-manual) 장소 이 거리 이내면 중복으로 보고 스킵


def load_env(path):
    env = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def rest(method, url, key, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def haversine_m(la1, lo1, la2, lo2):
    r = 6371000.0
    p1, p2 = math.radians(la1), math.radians(la2)
    dp = math.radians(la2 - la1)
    dl = math.radians(lo2 - lo1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


def fetch_existing_nonmanual(base, key):
    """기존에 있던 non-manual(naver/google/수동입력 등) 장소의 좌표 목록.
    naver/google 샘플과 govdata가 겹치지 않도록 중복 판정 기준으로 쓴다."""
    url = (f"{base}/rest/v1/places?select=latitude,longitude"
           "&or=(coordinate_source.neq.manual,coordinate_source.is.null)"
           "&latitude=not.is.null")
    st, body = rest("GET", url, key)
    if st not in (200, 206):
        print(f"  ⚠️ 기존 장소 조회 실패 HTTP {st} — 교차중복 스킵 생략")
        return []
    return [(r["latitude"], r["longitude"]) for r in json.loads(body)]


def main():
    keep = "--keep" in sys.argv
    dry = "--dry-run" in sys.argv

    env = load_env(ENV_PATH)
    base = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        sys.exit("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없습니다")

    from pyproj import Transformer
    tf = Transformer.from_crs(SRC_EPSG, "EPSG:4326", always_xy=True)

    places, sources = [], []
    n_total = n_coord = n_nocoord = n_dup_internal = 0
    seen_na = set()  # (이름, 주소) 내부 완전중복 제거용

    with open(CSV_PATH, encoding="utf-8", newline="") as f:
        r = csv.reader(f)
        h = next(r)
        ix = {c: i for i, c in enumerate(h)}
        for row in r:
            name = row[ix["사업장명"]].strip()
            if not name:
                continue
            n_total += 1
            road = row[ix["도로명주소"]].strip()
            jibun = row[ix["지번주소"]].strip()
            address = road or jibun or None

            key_na = (name, address or "")
            if key_na in seen_na:
                n_dup_internal += 1
                continue
            seen_na.add(key_na)

            lat = lng = None
            sx = row[ix["좌표정보(X)"]].strip()
            sy = row[ix["좌표정보(Y)"]].strip()
            if sx and sy:
                try:
                    lon_, lat_ = tf.transform(float(sx), float(sy))
                    # 한반도 범위 sanity check
                    if 33 <= lat_ <= 39 and 124 <= lon_ <= 132:
                        lat, lng = round(lat_, 7), round(lon_, 7)
                        n_coord += 1
                    else:
                        n_nocoord += 1
                except ValueError:
                    n_nocoord += 1
            else:
                n_nocoord += 1

            pid = str(uuid.uuid4())
            places.append({
                "id": pid,
                "country_code": "KR",
                "latitude": lat,
                "longitude": lng,
                "facilities": [],
                "is_24h": False,
                "facility_type": "public-bath",
                "bath_policy": "gender-bath",
                "coordinate_source": "manual",
                "status": "active",
            })
            sources.append({
                "place_id": pid,
                "source": "manual",
                "external_id": row[ix["관리번호"]].strip() or None,
                "name_original": name,
                "address_original": address,
                "latitude": lat,
                "longitude": lng,
            })

    print(f"파싱: {n_total}행 → 적재대상 {len(places)}곳 "
          f"(좌표 {n_coord} / 무좌표 {n_nocoord} / 내부중복 스킵 {n_dup_internal})")
    if dry:
        print("--dry-run: DB 미기록 종료")
        print("샘플:", json.dumps(sources[0], ensure_ascii=False))
        return

    # 멱등: 기존 manual 데이터 정리 (place_sources → places 순서, FK 안전)
    if not keep:
        s1, _ = rest("DELETE", f"{base}/rest/v1/place_sources?source=eq.manual", key)
        s2, _ = rest("DELETE", f"{base}/rest/v1/places?coordinate_source=eq.manual", key)
        print(f"기존 manual 정리: place_sources HTTP {s1}, places HTTP {s2}")

    # 교차중복 제거: 기존 non-manual(naver/google 등) 장소 DEDUP_RADIUS_M 이내 후보 스킵
    existing = fetch_existing_nonmanual(base, key)
    if existing:
        kept_p, kept_s, n_dup_cross = [], [], 0
        for p, s in zip(places, sources):
            if p["latitude"] is not None and any(
                haversine_m(p["latitude"], p["longitude"], ela, elo) < DEDUP_RADIUS_M
                for ela, elo in existing
            ):
                n_dup_cross += 1
                continue
            kept_p.append(p)
            kept_s.append(s)
        places, sources = kept_p, kept_s
        print(f"기존 장소 {DEDUP_RADIUS_M}m 교차중복 스킵: {n_dup_cross} (기존 {len(existing)}곳 기준)")

    def bulk(table, rows):
        ok = 0
        for i in range(0, len(rows), CHUNK):
            chunk = rows[i:i + CHUNK]
            st, body = rest("POST", f"{base}/rest/v1/{table}", key, chunk)
            if st in (200, 201):
                ok += len(chunk)
            else:
                print(f"  ✗ {table} chunk {i}~{i+len(chunk)} HTTP {st}: {body[:300]}")
                sys.exit(1)
        return ok

    p_ok = bulk("places", places)
    print(f"places 적재: {p_ok}")
    s_ok = bulk("place_sources", sources)
    print(f"place_sources 적재: {s_ok}")
    print("완료.")


if __name__ == "__main__":
    main()
