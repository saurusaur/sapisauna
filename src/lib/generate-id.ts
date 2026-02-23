/**
 * 기록 고유 ID 생성 유틸리티
 *
 * 포맷 (15자리):
 * [Type 1][Country 4][YY 2][MM 2][DD 2][HH 2][mm 2]
 *
 * Type:    saunner=1, bather=2, jimi=3
 * Country: 장소 주소 기반 국가코드 4자리 (0082=한국, 0081=일본, 0852=홍콩, 0886=대만)
 *
 * 예시: 100822602231430
 *   → saunner(1) + 한국(0082) + 2026년(26) + 02월 + 23일 + 14시 + 30분
 *
 * ※ 내부 참조용 — UI에 표시하지 않음
 */

import type { TribeId } from '@/types'

// 지원하는 국가코드 (장소 주소 기반)
const COUNTRY_CODES: Record<string, string> = {
  KR: '0082', // 대한민국
  JP: '0081', // 일본
  HK: '0852', // 홍콩
  TW: '0886', // 대만
}

// Type 코드
const TYPE_CODES: Record<TribeId, string> = {
  saunner: '1',
  bather: '2',
  jimi: '3',
}

/**
 * DummyPlace.countryCode(ISO 2자리) → 전화 국가코드 4자리 변환
 * countryCode 없으면 한국(0082) 기본값
 */
export function getCountryDialCode(isoCode?: string): string {
  if (!isoCode) return COUNTRY_CODES.KR
  return COUNTRY_CODES[isoCode.toUpperCase()] ?? COUNTRY_CODES.KR
}

/**
 * 기록 고유 ID 생성 (15자리)
 * @param tribeId  - 사용자 타입
 * @param isoCode  - 장소 국가 ISO 코드 (예: 'KR', 'JP') — 없으면 한국 기본값
 * @param date     - 기록 일시 (기본값: 현재 시각)
 */
export function generateDisplayId(
  tribeId: TribeId,
  isoCode?: string,
  date: Date = new Date()
): string {
  const typeCode    = TYPE_CODES[tribeId]
  const countryCode = getCountryDialCode(isoCode)
  const yy  = String(date.getFullYear()).slice(2)
  const mm  = String(date.getMonth() + 1).padStart(2, '0')
  const dd  = String(date.getDate()).padStart(2, '0')
  const hh  = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')

  return `${typeCode}${countryCode}${yy}${mm}${dd}${hh}${min}` // 15자리
}
