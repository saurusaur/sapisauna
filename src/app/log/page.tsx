'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TYPE_EMOJI_MAP, TYPE_CATEGORY_MAP, QUICK_LOG } from '@/constants/content'
import { Slider, Counter } from '@/components/slider'

type LogType = 'bather' | 'saunner' | 'jimi'

export default function QuickLog() {
  const router = useRouter()
  const [placeName, setPlaceName] = useState('장소')
  const [logType, setLogType] = useState<LogType>('saunner')
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
      ...(logType === 'saunner' && { sauna_temp: saunaTemp, cold_bath_temp: coldBathTemp, sets, totono }),
      ...(logType === 'jimi' && { rest_quality: restQuality, cleanliness }),
      revisit_score: revisit,
    }

    localStorage.setItem('currentLog', JSON.stringify(logData))
    router.push('/story')
  }

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
              {(['bather', 'saunner', 'jimi'] as LogType[]).map((type) => (
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
                label={QUICK_LOG.BATHER.WATER_QUALITY.label}
                value={waterQuality}
                min={QUICK_LOG.BATHER.WATER_QUALITY.min}
                max={QUICK_LOG.BATHER.WATER_QUALITY.max}
                steps={QUICK_LOG.BATHER.WATER_QUALITY.steps}
                onChange={setWaterQuality}
              />
              <Slider
                label={QUICK_LOG.BATHER.HOT_BATH_TEMP.label}
                value={hotBathTemp}
                min={QUICK_LOG.BATHER.HOT_BATH_TEMP.min}
                max={QUICK_LOG.BATHER.HOT_BATH_TEMP.max}
                unit={QUICK_LOG.BATHER.HOT_BATH_TEMP.unit}
                steps={QUICK_LOG.BATHER.HOT_BATH_TEMP.steps}
                onChange={setHotBathTemp}
              />
            </>
          )}

          {/* 사우너파 입력 항목 */}
          {logType === 'saunner' && (
            <>
              <Slider
                label={QUICK_LOG.SAUNER.SAUNA_TEMP.label}
                value={saunaTemp}
                min={QUICK_LOG.SAUNER.SAUNA_TEMP.min}
                max={QUICK_LOG.SAUNER.SAUNA_TEMP.max}
                unit={QUICK_LOG.SAUNER.SAUNA_TEMP.unit}
                steps={QUICK_LOG.SAUNER.SAUNA_TEMP.steps}
                onChange={setSaunaTemp}
              />
              <Slider
                label={QUICK_LOG.SAUNER.COLD_BATH_TEMP.label}
                value={coldBathTemp}
                min={QUICK_LOG.SAUNER.COLD_BATH_TEMP.min}
                max={QUICK_LOG.SAUNER.COLD_BATH_TEMP.max}
                unit={QUICK_LOG.SAUNER.COLD_BATH_TEMP.unit}
                steps={QUICK_LOG.SAUNER.COLD_BATH_TEMP.steps}
                onChange={setColdBathTemp}
              />
              <Counter label={QUICK_LOG.SAUNER.SETS.label} value={sets} min={QUICK_LOG.SAUNER.SETS.min} max={QUICK_LOG.SAUNER.SETS.max} onChange={setSets} />
              <Slider
                label={QUICK_LOG.SAUNER.TOTONO.label}
                value={totono}
                min={QUICK_LOG.SAUNER.TOTONO.min}
                max={QUICK_LOG.SAUNER.TOTONO.max}
                steps={QUICK_LOG.SAUNER.TOTONO.steps}
                onChange={setTotono}
              />
            </>
          )}

          {/* 찜질파 입력 항목 */}
          {logType === 'jimi' && (
            <>
              <Slider
                label={QUICK_LOG.JIMI.REST_QUALITY.label}
                value={restQuality}
                min={QUICK_LOG.JIMI.REST_QUALITY.min}
                max={QUICK_LOG.JIMI.REST_QUALITY.max}
                steps={QUICK_LOG.JIMI.REST_QUALITY.steps}
                onChange={setRestQuality}
              />
              <Slider
                label={QUICK_LOG.JIMI.CLEANLINESS.label}
                value={cleanliness}
                min={QUICK_LOG.JIMI.CLEANLINESS.min}
                max={QUICK_LOG.JIMI.CLEANLINESS.max}
                steps={QUICK_LOG.JIMI.CLEANLINESS.steps}
                onChange={setCleanliness}
              />
            </>
          )}

          {/* 공통: 또 올래요 */}
          <Slider
            label={QUICK_LOG.COMMON.REVISIT.label}
            value={revisit}
            min={QUICK_LOG.COMMON.REVISIT.min}
            max={QUICK_LOG.COMMON.REVISIT.max}
            steps={QUICK_LOG.COMMON.REVISIT.steps}
            onChange={setRevisit}
          />
        </div>
      </main>
    </div>
  )
}
