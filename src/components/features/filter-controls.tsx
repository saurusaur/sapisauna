'use client'

import { ICONS, EXPLORE, EXPLORE_FILTERS, FACILITY_ICON_MAP } from '@/constants/content'
import { getFacilityLabel } from '@/lib/utils'
import type { SortType } from '@/hooks/use-explore-filters'
import Chip from '@/components/ui/chip'
import ToggleSwitch from '@/components/ui/toggle-switch'

interface FilterControlsProps {
    // Filter state
    showFilters: boolean
    onToggleFilters: () => void
    selectedFilters: string[]
    onToggleFilter: (filterId: string) => void
    onResetFilters: () => void
    // 24h toggle
    is24hOnly: boolean
    onToggle24h: (value: boolean) => void
    // Sort
    sortType: SortType
    onSortChange: (type: SortType) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function FilterControls({
    showFilters,
    onToggleFilters,
    selectedFilters,
    onToggleFilter,
    onResetFilters,
    is24hOnly,
    onToggle24h,
    sortType,
    onSortChange,
}: FilterControlsProps) {
    const filterCount = selectedFilters.length + (is24hOnly ? 1 : 0)
    const hasActiveFilters = filterCount > 0

    return (
        <>
            {/* 필터 버튼 + 정렬 */}
            <div className="flex items-center gap-2 mb-4">
                {/* 필터 버튼 */}
                <button
                    onClick={onToggleFilters}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all relative ${hasActiveFilters
                        ? 'text-white shadow-md'
                        : 'glass-card-light text-stone-600'
                        }`}
                    style={hasActiveFilters ? { backgroundColor: 'var(--color-green)' } : {}}
                >
                    필터
                    {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 bg-white text-stone-600 w-4 h-4 rounded-full text-[10px] font-medium flex items-center justify-center shadow-sm border border-stone-200">
                            {filterCount}
                        </span>
                    )}
                </button>

                {/* 초기화 */}
                {hasActiveFilters && (
                    <button
                        onClick={onResetFilters}
                        className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        초기화
                    </button>
                )}

                {/* 정렬 토글 */}
                <div className="flex items-center gap-1 ml-auto">
                    {([
                        { key: 'recommended' as const, label: EXPLORE.SORT.RECOMMENDED },
                        { key: 'popular' as const, label: EXPLORE.SORT.POPULAR },
                    ]).map((s) => (
                        <button
                            key={s.key}
                            onClick={() => onSortChange(s.key)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${sortType === s.key
                                ? 'text-white shadow-md'
                                : 'glass-card-light text-stone-500 hover:text-stone-700'
                                }`}
                            style={sortType === s.key ? { backgroundColor: 'var(--color-primary)' } : {}}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 필터 패널 */}
            {showFilters && (
                <div className="glass-card p-4 mb-4 space-y-4">
                    {(Object.entries(EXPLORE_FILTERS) as [string, { label: string; options: readonly string[] }][]).map(
                        ([key, section], index) => (
                            <div key={key}>
                                {/* Section header */}
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-stone-700">
                                        {section.label}
                                    </label>
                                    {index === 0 && (
                                        <button
                                            onClick={onToggleFilters}
                                            className="w-5 h-5 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all"
                                            aria-label="Close filters"
                                        >
                                            <span className="material-symbols-outlined text-base">{ICONS.CLOSE}</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {section.options.map((optionId) => (
                                        <Chip
                                            key={optionId}
                                            label={getFacilityLabel(optionId)}
                                            icon={FACILITY_ICON_MAP[optionId]}
                                            selected={selectedFilters.includes(optionId)}
                                            onClick={() => onToggleFilter(optionId)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    {/* 24시 토글 */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">schedule</span>
                            {EXPLORE.TOGGLE_24H}
                        </label>
                        <ToggleSwitch checked={is24hOnly} onChange={onToggle24h} />
                    </div>
                </div>
            )}
        </>
    )
}
