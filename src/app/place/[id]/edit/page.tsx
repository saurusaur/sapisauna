'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PLACE_SPECS, PLACE_VENUE_TYPE, PLACE_BATH_POLICY } from '@/constants/content'
import ChipSelect from '@/components/ui/chip-select'
import SelectButton from '@/components/ui/select-button'
import ToggleSwitch from '@/components/ui/toggle-switch'
import ConfirmModal from '@/components/ui/confirm-modal'
import { getPlaceById, updatePlace } from '@/lib/places-service'
import type { FacilityType, BathPolicy } from '@/types'
import BottomCTA from '@/components/ui/bottom-cta'

export default function EditPlace() {
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string

  const [placeName, setPlaceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // 편집 대상 필드
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [is24h, setIs24h] = useState(false)
  const [venueType, setVenueType] = useState<FacilityType>('public-bath')
  const [bathPolicy, setBathPolicy] = useState<BathPolicy>('gender-bath')

  // 원본 값 (변경 감지용)
  const [original, setOriginal] = useState<{ facilities: string[]; is24h: boolean; venueType: FacilityType; bathPolicy: BathPolicy } | null>(null)

  // 장소 데이터 로드
  useEffect(() => {
    const load = async () => {
      try {
        const place = await getPlaceById(placeId)
        if (!place) {
          router.replace('/explore')
          return
        }
        setPlaceName(place.name)
        setSelectedFacilities(place.facilities)
        setIs24h(place.is_24h)
        setVenueType(place.facility_type)
        setBathPolicy(place.bath_policy)
        setOriginal({ facilities: place.facilities, is24h: place.is_24h, venueType: place.facility_type, bathPolicy: place.bath_policy })
      } catch {
        router.replace('/explore')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [placeId, router])

  // 변경 감지
  useEffect(() => {
    if (!original) return
    const changed = JSON.stringify(selectedFacilities) !== JSON.stringify(original.facilities)
      || is24h !== original.is24h
      || venueType !== original.venueType
      || bathPolicy !== original.bathPolicy
    setIsDirty(changed)
  }, [selectedFacilities, is24h, venueType, bathPolicy, original])

  // 저장
  const handleSave = async () => {
    if (!isDirty) return
    setIsSaving(true)
    setSaveError(null)

    try {
      await updatePlace(placeId, {
        facilities: selectedFacilities,
        is_24h: is24h,
        facility_type: venueType,
        bath_policy: bathPolicy,
      })
      router.back()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장에 실패했어요')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bath-tile-bg flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-stone-300 animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bath-tile-bg pb-24">
      {/* 헤더 */}
      <header className="p-5 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => isDirty ? setShowBackConfirm(true) : router.back()}
            className="p-1 text-stone-500 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-2xl font-extrabold italic font-heading">
            EDIT PLACE
          </h1>
        </div>
        <p className="text-sm text-stone-400 mt-2 ml-10">{placeName}</p>
      </header>

      <main className="p-4">
        {saveError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-sm">error</span>
            {saveError}
          </div>
        )}

        <div className="glass-card-light rounded-xl p-4 space-y-5">
          {/* 시설 유형 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              시설 유형
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLACE_VENUE_TYPE.map((option) => (
                <SelectButton
                  key={option.id}
                  label={option.label}
                  icon={option.icon}
                  selected={venueType === option.id}
                  onClick={() => setVenueType(option.id as FacilityType)}
                />
              ))}
            </div>
          </div>

          {/* 탕 구분 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              탕 구분
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLACE_BATH_POLICY.map((option) => (
                <SelectButton
                  key={option.id}
                  label={option.label}
                  icon={option.icon}
                  selected={bathPolicy === option.id}
                  onClick={() => setBathPolicy(option.id as BathPolicy)}
                />
              ))}
            </div>
          </div>

          {/* 5개 섹션: HEAT → ICE → PAUSE → BEYOND → AMENITIES */}
          {(['HEAT', 'ICE', 'PAUSE', 'BEYOND', 'AMENITIES'] as const).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {PLACE_SPECS[key].label}
              </label>
              <ChipSelect
                options={PLACE_SPECS[key].options}
                selected={selectedFacilities}
                onSelect={(id) => {
                  setSelectedFacilities(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  )
                }}
                multiple
              />
            </div>
          ))}

          {/* 24시 영업 토글 */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">schedule</span>
              24시 영업
            </label>
            <ToggleSwitch checked={is24h} onChange={setIs24h} />
          </div>
        </div>
      </main>

      <BottomCTA onClick={handleSave} disabled={!isDirty || isSaving}>
        {isSaving ? (
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
        ) : (
          '저장'
        )}
      </BottomCTA>

      {showBackConfirm && (
        <ConfirmModal
          message="수정한 내용이 저장되지 않습니다. 나가시겠습니까?"
          confirmLabel="나가기"
          cancelLabel="계속 편집"
          onConfirm={() => router.back()}
          onCancel={() => setShowBackConfirm(false)}
        />
      )}
    </div>
  )
}
