'use client'

import { useRouter } from 'next/navigation'
import { TYPE_EMOJI_MAP, TYPE_CATEGORY_MAP } from '@/constants/content'
import { formatDateTime, getTotonoLabel, getRevisitEmoji } from '@/lib/utils'

// 더미 데이터 (실제로는 id로 조회)
const DUMMY_LOG = {
  id: '1',
  place_name: '스파랜드',
  address: '서울 강남구',
  date: '2025-01-27T20:30:00',
  log_type: 'sauner' as const,
  sauna_temp: 95,
  cold_bath_temp: 15,
  sets: 3,
  totono: 4,
  revisit_score: 5,
  // Deep Log
  companion: 'friend',
  purpose: 'after-workout',
  cost: 12000,
  crowd: 'empty',
  memo: '노천탕 온도가 평소보다 낮아서 아쉬웠음',
}

// 레이블 맵 상수
const COMPANION_LABELS: Record<string, string> = {
  alone: '🧍 혼자',
  friend: '👯 친구',
  family: '👨‍👩‍👧 가족',
  partner: '💑 연인',
}
const PURPOSE_LABELS: Record<string, string> = {
  healing: '🧘 힐링',
  'after-workout': '💪 운동후',
  hangover: '🍺 숙취해소',
  work: '💻 작업',
}
const CROWD_LABELS: Record<string, string> = {
  empty: '😌 쾌적',
  moderate: '🙂 적당',
  busy: '😅 북적',
  full: '😵 자리없음',
}

export default function HistoryDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const log = DUMMY_LOG // 실제로는 params.id로 조회

  const renderRevisitScore = (score: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: i <= score ? 'var(--color-orange)' : '#e5e5e5' }}
        />
      ))}
    </div>
  )

  const handleDelete = () => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      // TODO: 실제 삭제 로직
      router.push('/history')
    }
  }

  return (
    <div className="min-h-screen bath-tile-bg pb-8">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">기록 상세</h1>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-stone-500 hover:text-stone-700 transition-colors">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-400 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* 장소 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="flex items-center justify-center gap-1 text-stone-500 mb-1">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="font-semibold text-lg text-stone-700">{log.place_name}</span>
          </div>
          <p className="text-sm text-stone-400 mb-2">{log.address}</p>
          <p className="text-sm text-stone-500">{formatDateTime(new Date(log.date))}</p>
        </div>

        {/* Quick Log 정보 */}
        <div>
          <h2 className="text-center text-sm font-bold text-stone-500 mb-3 flex items-center gap-2">
            <span className="w-full h-px bg-stone-200"></span>
            <span className="whitespace-nowrap px-2 flex items-center gap-1">
              {TYPE_EMOJI_MAP[log.log_type]} {TYPE_CATEGORY_MAP[log.log_type]}
            </span>
            <span className="w-full h-px bg-stone-200"></span>
          </h2>

          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {log.log_type === 'sauner' && (
              <>
                <div className="flex justify-between">
                  <span className="text-stone-500">사우나 온도</span>
                  <span className="font-medium text-stone-700">{log.sauna_temp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">냉탕 온도</span>
                  <span className="font-medium text-stone-700">{log.cold_bath_temp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">세트 수</span>
                  <span className="font-medium text-stone-700">{log.sets}세트</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">토토노이 강도</span>
                  <div className="flex items-center gap-2">
                    {renderRevisitScore(log.totono)}
                    <span className="text-sm text-stone-400">
                      {getTotonoLabel(log.totono)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
              <span className="text-stone-500">또 올래요</span>
              <div className="flex items-center gap-2">
                {renderRevisitScore(log.revisit_score)}
                <span className="text-lg">{getRevisitEmoji(log.revisit_score)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Log 정보 */}
        {(log.companion || log.purpose || log.cost || log.crowd) && (
          <div>
            <h2 className="text-center text-sm font-bold text-stone-500 mb-3 flex items-center gap-2">
              <span className="w-full h-px bg-stone-200"></span>
              <span className="whitespace-nowrap px-2">Deep Log</span>
              <span className="w-full h-px bg-stone-200"></span>
            </h2>

            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              {log.companion && (
                <div className="flex justify-between">
                  <span className="text-stone-500">동행자</span>
                  <span className="font-medium text-stone-700">{COMPANION_LABELS[log.companion]}</span>
                </div>
              )}
              {log.purpose && (
                <div className="flex justify-between">
                  <span className="text-stone-500">방문 목적</span>
                  <span className="font-medium text-stone-700">{PURPOSE_LABELS[log.purpose]}</span>
                </div>
              )}
              {log.cost && (
                <div className="flex justify-between">
                  <span className="text-stone-500">비용</span>
                  <span className="font-medium text-stone-700">{log.cost.toLocaleString()}원</span>
                </div>
              )}
              {log.crowd && (
                <div className="flex justify-between">
                  <span className="text-stone-500">혼잡도</span>
                  <span className="font-medium text-stone-700">{CROWD_LABELS[log.crowd]}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 메모 */}
        {log.memo && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-stone-500 mb-2">메모</label>
            <p className="text-stone-700">{log.memo}</p>
          </div>
        )}

        {/* 스토리 만들기 버튼 */}
        <button
          onClick={() => {
            localStorage.setItem('currentLog', JSON.stringify(log))
            router.push('/story')
          }}
          className="w-full py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
          style={{ backgroundColor: 'var(--color-orange)' }}
        >
          <span className="material-symbols-outlined">photo_camera</span>
          스토리 만들기
        </button>
      </main>
    </div>
  )
}
