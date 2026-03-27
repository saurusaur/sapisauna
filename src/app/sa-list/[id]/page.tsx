/**
 * SA-리스트 상세 페이지 — 서버 컴포넌트 (OG 메타데이터 생성용)
 * 실제 UI는 sa-list-detail-client.tsx에서 렌더링
 */

import type { Metadata } from 'next'
import { getListByIdServer } from '@/lib/lists-service-server'
import SaListDetailClient from './sa-list-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const list = await getListByIdServer(id)

    if (!list) {
      return { title: 'SA-리스트' }
    }

    const description = list.description
      || `장소 ${list.place_count}개 · 구독 ${list.subscriber_count}명`

    return {
      title: `${list.title} — SA-리스트`,
      description,
      openGraph: {
        title: `${list.title} — SA-리스트`,
        description,
        url: `/sa-list/${list.slug || list.id}`,
        type: 'website',
      },
    }
  } catch {
    return { title: 'SA-리스트' }
  }
}

export default function SaListDetailPage() {
  return <SaListDetailClient />
}
