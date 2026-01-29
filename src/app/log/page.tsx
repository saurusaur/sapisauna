'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TYPE_EMOJI_MAP, TYPE_CATEGORY_MAP } from '@/constants/content'
import { getRevisitEmoji } from '@/lib/utils'

type LogType = 'bather' | 'sauner' | 'jimi'

export default function QuickLog() {
  const router = useRouter()
  const [placeName, setPlaceName] = useState('장소')
  const [logType, setLogType] = useState<LogType>('sauner')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  // 슬라이더 값들
  const [waterQuality, setWaterQuality] = useState(3)
  const [hotBathTemp, setHotBathTemp] = useState(40)
  const [saunaTemp, setSaunaTemp] = useState(80)
  const [coldBathTemp, setColdBathTemp] = useState(15)
  const [sets, setSets] = useState(3)
  const [totono, setTotono] = useState(3)
  const [restQuality, setRestQuality] = useState(3)
  const [cleanliness, setCleanliness] = useState(3)
  const [revisit, setRevisit] = useState(3)

  useEffect(() => {
    // localStorage에서 선택된 장소와 사용자 정보 가져오기
    const placeData = localStorage.getItem('selectedPlace')
    const userData = localStorage.getItem('user')

    if (placeData) {
      const place = JSON.parse(placeData)
      setPlaceName(place.name)
    }

    if (userData) {
      const user = JSON.parse(userData)
      if (user.primary_type) {
        setLogType(user.primary_type)
      }
    }
  }, [])

  // 저장 처리
  const handleSave = () => {
    // 로그 데이터 저장
    const logData = {
      place_name: placeName,
      log_type: logType,
      created_at: new Date().toISOString(),
      // 타입별 데이터
      ...(logType === 'bather' && { water_quality: waterQuality, hot_bath_temp: hotBathTemp }),
      ...(logType === 'sauner' && { sauna_temp: saunaTemp, cold_bath_temp: coldBathTemp, sets, totono }),
      ...(logType === 'jimi' && { rest_quality: restQuality, cleanliness }),
      revisit_score: revisit,
    }

    localStorage.setItem('currentLog', JSON.stringify(logData))
    router.push('/log/nudge')
  }

  // 슬라이더 컴포넌트
  const Slider = ({
    label,
    value,
    min,
    max,
    unit = '',
    leftLabel,
    rightLabel,
    onChange,
  }: {
    label: string
    value: number
    min: number
    max: number
    unit?: string
    leftLabel?: string
    rightLabel?: string
    onChange: (v: number) => void
  }) => (
    <div className="py-4 border-b border-stone-100">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-orange)' }}>
          {value}{unit}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {leftLabel && <span className="text-xs text-stone-400 w-12">{leftLabel}</span>}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
        />
        {rightLabel && <span className="text-xs text-stone-400 w-12 text-right">{rightLabel}</span>}
      </div>
    </div>
  )

  // 카운터 컴포넌트
  const Counter = ({
    label,
    value,
    min,
    max,
    onChange,
  }: {
    label: string
    value: number
    min: number
    max: number
    onChange: (v: number) => void
  }) => (
    <div className="py-4 border-b border-stone-100">
      <div className="flex justify-between items-center">
        <span className="font-medium text-stone-700">{label}</span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <span className="text-xl font-bold w-8 text-center" style={{ color: 'var(--color-orange)' }}>
            {value}
          </span>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bath-tile-bg">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-stone-700">{placeName}</h1>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-green)' }}
        >
          저장
        </button>
      </header>

      <main className="p-4">
        {/* 타입 선택 드롭다운 */}
        <div className="relative mb-4">
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between"
          >
            <span className="flex items-center gap-2 font-medium text-stone-700">
              <span className="text-xl">{TYPE_EMOJI_MAP[logType]}</span>
              {TYPE_CATEGORY_MAP[logType]}
            </span>
            <span className="material-symbols-outlined text-stone-400">expand_more</span>
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10">
              {(['bather', 'sauner', 'jimi'] as LogType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setLogType(type)
                    setShowTypeDropdown(false)
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{TYPE_EMOJI_MAP[type]}</span>
                    {TYPE_CATEGORY_MAP[type]}
                  </span>
                  {logType === type && (
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          {/* 목욕파 입력 항목 */}
          {logType === 'bather' && (
            <>
              <Slider
                label="수질"
                value={waterQuality}
                min={1}
                max={5}
                leftLabel="탁함"
                rightLabel="맑음"
                onChange={setWaterQuality}
              />
              <Slider
                label="목욕 온탕 온도"
                value={hotBathTemp}
                min={35}
                max={46}
                unit="°C"
                leftLabel="미지근"
                rightLabel="뜨거움"
                onChange={setHotBathTemp}
              />
            </>
          )}

          {/* 사우너파 입력 항목 */}
          {logType === 'sauner' && (
            <>
              <Slider
                label="건식 사우나 온도"
                value={saunaTemp}
                min={40}
                max={140}
                unit="°C"
                leftLabel="미지근"
                rightLabel="극한"
                onChange={setSaunaTemp}
              />
              <Slider
                label="냉탕 온도"
                value={coldBathTemp}
                min={0}
                max={30}
                unit="°C"
                leftLabel="얼음"
                rightLabel="미지근"
                onChange={setColdBathTemp}
              />
              <Counter label="세트 수" value={sets} min={1} max={10} onChange={setSets} />
              <Slider
                label="토토노이 강도"
                value={totono}
                min={1}
                max={5}
                leftLabel="약함"
                rightLabel="승천"
                onChange={setTotono}
              />
            </>
          )}

          {/* 찜질파 입력 항목 */}
          {logType === 'jimi' && (
            <>
              <Slider
                label="휴식 퀄리티"
                value={restQuality}
                min={1}
                max={5}
                leftLabel="별로"
                rightLabel="최고"
                onChange={setRestQuality}
              />
              <Slider
                label="청결도"
                value={cleanliness}
                min={1}
                max={5}
                leftLabel="별로"
                rightLabel="최고"
                onChange={setCleanliness}
              />
            </>
          )}

          {/* 공통: 또 올래요 */}
          <div className="py-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-stone-700">또 올래요</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getRevisitEmoji(revisit)}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-orange)' }}>{revisit}/5</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">😐</span>
              <input
                type="range"
                min={1}
                max={5}
                value={revisit}
                onChange={(e) => setRevisit(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg">😍</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
