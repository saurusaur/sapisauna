'use client'

import { useState } from 'react'
import { PLACE_SPECS, PLACE_VENUE_TYPE, PLACE_BATH_POLICY, isInputVisibleOption } from '@/constants/content'
import ChipSelect from '@/components/ui/chip-select'
import ConfirmModal from '@/components/ui/confirm-modal'
import SelectButton from '@/components/ui/select-button'
import ToggleSwitch from '@/components/ui/toggle-switch'
import type { BathPolicy, FacilityType } from '@/types'

const FACILITY_SECTIONS = ['HEAT', 'ICE', 'PAUSE', 'BEYOND', 'AMENITIES'] as const

interface PlaceFacilityEditorProps {
  selectedFacilities: string[]
  onFacilitiesChange: (next: string[]) => void
  is24h: boolean
  onIs24hChange: (next: boolean) => void
  venueType: FacilityType
  onVenueTypeChange: (next: FacilityType) => void
  bathPolicy: BathPolicy
  onBathPolicyChange: (next: BathPolicy) => void
  countryCode: string
}

export default function PlaceFacilityEditor({
  selectedFacilities,
  onFacilitiesChange,
  is24h,
  onIs24hChange,
  venueType,
  onVenueTypeChange,
  bathPolicy,
  onBathPolicyChange,
  countryCode,
}: PlaceFacilityEditorProps) {
  const [showTattooModal, setShowTattooModal] = useState(false)

  const updateFacilities = (updater: (prev: string[]) => string[]) => {
    onFacilitiesChange(updater(selectedFacilities))
  }

  const handleFacilitySelect = (id: string) => {
    if (id === 'tattoo-friendly') {
      if (selectedFacilities.includes('tattoo-friendly') || selectedFacilities.includes('tattoo-cover')) {
        updateFacilities(prev => prev.filter(x => x !== 'tattoo-friendly' && x !== 'tattoo-cover'))
      } else if (countryCode === 'JP') {
        setShowTattooModal(true)
      } else {
        updateFacilities(prev => [...prev, 'tattoo-friendly'])
      }
      return
    }

    updateFacilities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectedForDisplay = selectedFacilities.includes('tattoo-cover')
    ? [...selectedFacilities, 'tattoo-friendly']
    : selectedFacilities

  return (
    <>
      <div className="glass-card-light rounded-xl p-4 space-y-5">
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
                onClick={() => onVenueTypeChange(option.id as FacilityType)}
              />
            ))}
          </div>
        </div>

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
                onClick={() => onBathPolicyChange(option.id as BathPolicy)}
              />
            ))}
          </div>
        </div>

        {FACILITY_SECTIONS.map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {PLACE_SPECS[key].label}
            </label>
            <ChipSelect
              options={PLACE_SPECS[key].options.filter(isInputVisibleOption)}
              selected={selectedForDisplay}
              onSelect={handleFacilitySelect}
              multiple
            />
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">schedule</span>
            24시 영업
          </label>
          <ToggleSwitch checked={is24h} onChange={onIs24hChange} />
        </div>
      </div>

      {showTattooModal && (
        <ConfirmModal
          message="타투 커버가 필요한가요?"
          confirmLabel="예, 커버 필요"
          cancelLabel="아니오"
          onConfirm={() => {
            updateFacilities(prev => [...prev, 'tattoo-cover'])
            setShowTattooModal(false)
          }}
          onCancel={() => {
            updateFacilities(prev => [...prev, 'tattoo-friendly'])
            setShowTattooModal(false)
          }}
        />
      )}
    </>
  )
}
