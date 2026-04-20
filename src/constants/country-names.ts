/**
 * ISO 2-letter country code → display name (영어)
 *
 * short_address 조합용. 예: `${city}, ${COUNTRY_NAMES[cc]}`
 * 한국어로 전환하려면 이 맵만 교체하면 됨.
 */

export const COUNTRY_NAMES: Record<string, string> = {
  // Asia (우리 주요 타겟)
  JP: 'Japan',
  KR: 'South Korea',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  CN: 'China',
  TH: 'Thailand',
  SG: 'Singapore',
  MY: 'Malaysia',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',
  IN: 'India',

  // North America
  US: 'USA',
  CA: 'Canada',
  MX: 'Mexico',

  // Europe
  GB: 'UK',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  SE: 'Sweden',
  NO: 'Norway',
  FI: 'Finland',
  DK: 'Denmark',
  IE: 'Ireland',
  PT: 'Portugal',
  PL: 'Poland',
  CZ: 'Czech Republic',
  GR: 'Greece',
  HU: 'Hungary',
  RU: 'Russia',
  TR: 'Turkey',

  // Oceania
  AU: 'Australia',
  NZ: 'New Zealand',

  // Middle East
  AE: 'UAE',
  IL: 'Israel',
  SA: 'Saudi Arabia',

  // Americas (additional)
  BR: 'Brazil',
  AR: 'Argentina',
  CL: 'Chile',
}

/** cc → display name. 맵에 없으면 cc 그대로 반환 (fallback) */
export function countryName(cc: string | null | undefined): string {
  if (!cc) return ''
  return COUNTRY_NAMES[cc] ?? cc
}
