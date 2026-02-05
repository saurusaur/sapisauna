'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MESSAGES } from '@/constants/content'

// 더미 장소 데이터
// facilities: PLACE_SPECS 기반 시설 태그 (icon: Material Symbol, label: 표시명)
const DUMMY_PLACES = [
  { id: '1', name: '스파랜드', address: '서울 강남구', distance: '350m', facilities: [
    { icon: 'hot_tub', label: '온탕' },
    { icon: 'ac_unit', label: '냉탕' },
    { icon: 'local_fire_department', label: '건식' },
  ]},
  { id: '2', name: '실로암사우나', address: '서울 중구', distance: '1.2km', facilities: [
    { icon: 'local_fire_department', label: '건식' },
    { icon: 'water', label: '습식' },
  ]},
  { id: '3', name: '드래곤힐스파', address: '서울 용산구', distance: '2.5km', facilities: [
    { icon: 'hot_tub', label: '온탕' },
    { icon: 'ac_unit', label: '냉탕' },
    { icon: 'local_fire_department', label: '건식' },
    { icon: 'grain', label: '소금방' },
  ]},
]

export default function PlaceSelection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // 검색 필터링
  const filteredPlaces = DUMMY_PLACES.filter(place =>
    place.name.includes(searchQuery) || place.address.includes(searchQuery)
  )

  // 장소 선택
  const handlePlaceSelect = (placeId: string, placeName: string) => {
    // 선택한 장소 정보를 localStorage에 저장
    localStorage.setItem('selectedPlace', JSON.stringify({ id: placeId, name: placeName }))
    router.push('/log')
  }

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-700">{MESSAGES.LOG.SELECT_PLACE}</h1>
      </header>

      <main className="p-4">
        {/* 검색창 */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={MESSAGES.LOG.SEARCH_PLACEHOLDER}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-green text-stone-700 placeholder-stone-400"
          />
        </div>

        {/* 내 주변 라벨 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-stone-500">location_on</span>
          <span className="text-sm font-medium text-stone-500">{MESSAGES.LOG.NEARBY}</span>
        </div>

        {/* 장소 목록 */}
        <div className="space-y-3 mb-6">
          {filteredPlaces.map((place) => (
            <button
              key={place.id}
              onClick={() => handlePlaceSelect(place.id, place.name)}
              className="w-full bg-white p-4 rounded-xl shadow-sm text-left hover:shadow-md transition-all"
            >
              <div className="font-semibold text-stone-700 mb-1">{place.name}</div>
              <div className="text-sm text-stone-400 mb-2">{place.address} · {place.distance}</div>
              <div className="flex gap-2 flex-wrap">
                {place.facilities.map((facility, idx) => (
                  <span key={idx} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-stone-100 rounded-full text-xs text-stone-500">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{facility.icon}</span>
                    {facility.label}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* 직접 장소 추가 */}
        <button
          onClick={() => router.push('/place/add')}
          className="w-full py-4 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center gap-2 text-stone-500 hover:border-stone-400 hover:text-stone-600 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          <span>{MESSAGES.LOG.ADD_PLACE}</span>
        </button>
      </main>
    </div>
  )
}
