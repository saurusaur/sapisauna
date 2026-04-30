'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ConfirmModal from '@/components/ui/confirm-modal'
import PlaceFacilityEditor from '@/components/features/place-facility-editor'
import ErrorBanner from '@/components/ui/error-banner'
import { getPlaceById, updatePlace } from '@/lib/places-service'
import { useConfirmableExit } from '@/hooks/use-confirmable-exit'
import type { FacilityType, BathPolicy } from '@/types'
import BottomCTA from '@/components/ui/bottom-cta'

export default function EditPlace() {
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string

  const [placeName, setPlaceName] = useState('')
  const [countryCode, setCountryCode] = useState('KR')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // 편집 대상 필드
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [is24h, setIs24h] = useState(false)
  const [venueType, setVenueType] = useState<FacilityType>('public-bath')
  const [bathPolicy, setBathPolicy] = useState<BathPolicy>('gender-bath')

  // 원본 값 (변경 감지용)
  const [original, setOriginal] = useState<{ facilities: string[]; is24h: boolean; venueType: FacilityType; bathPolicy: BathPolicy } | null>(null)
  const exitConfirm = useConfirmableExit({
    shouldConfirm: isDirty,
    onExit: () => router.back(),
  })

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
        setCountryCode(place.country_code)
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
            onClick={exitConfirm.requestExit}
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
        {saveError && <ErrorBanner message={saveError} className="mb-4" />}

        <PlaceFacilityEditor
          selectedFacilities={selectedFacilities}
          onFacilitiesChange={setSelectedFacilities}
          is24h={is24h}
          onIs24hChange={setIs24h}
          venueType={venueType}
          onVenueTypeChange={setVenueType}
          bathPolicy={bathPolicy}
          onBathPolicyChange={setBathPolicy}
          countryCode={countryCode}
        />
      </main>

      <BottomCTA onClick={handleSave} disabled={!isDirty || isSaving}>
        {isSaving ? (
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
        ) : (
          '저장'
        )}
      </BottomCTA>

      {exitConfirm.confirmOpen && (
        <ConfirmModal
          message={"수정한 내용이 저장되지 않습니다.\n나가시겠습니까?"}
          confirmLabel="나가기"
          cancelLabel="계속 편집"
          onConfirm={exitConfirm.confirmExit}
          onCancel={exitConfirm.cancelExit}
        />
      )}
    </div>
  )
}
