/**
 * 공유 유틸 — navigator.share → clipboard fallback
 */

import type { SaList } from '@/types'

/** SA-리스트 공유. 성공 시 true, 실패 시 에러 메시지 문자열 반환 */
export async function shareList(list: SaList): Promise<true | string> {
  const shareId = list.slug || list.id
  const url = `${window.location.origin}/sa-list/${shareId}`
  const title = list.title || 'SA-리스트'

  try {
    if (navigator.share) {
      await navigator.share({ title, url })
      return true
    }
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return '링크 복사에 실패했어요'
    }
  }
}
