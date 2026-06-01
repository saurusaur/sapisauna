'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export type SortType = 'recommended' | 'popular' | 'nearby'

export interface UseExploreFiltersOptions {
    defaultSortType?: SortType
    // 동적 기본 정렬: 위치 권한 상태가 확정되면(resolved) 위치 가용 여부에 따라
    // nearby(위치 있음)/recommended(없음)를 1회 자동 선택. 사용자가 정렬을 직접 바꾸면
    // 더 이상 자동으로 덮어쓰지 않는다.
    dynamicDefault?: {
        locationAvailable: boolean
        resolved: boolean
    }
}

export interface UseExploreFiltersReturn {
    // Filter panel visibility
    showFilters: boolean
    setShowFilters: (show: boolean) => void
    toggleFiltersPanel: () => void

    // Selected facility filters
    selectedFilters: string[]
    toggleFilter: (filterId: string) => void

    // 24h toggle
    is24hOnly: boolean
    setIs24hOnly: (value: boolean) => void

    // Sort type
    sortType: SortType
    setSortType: (type: SortType) => void

    // Computed
    filterCount: number
    hasActiveFilters: boolean

    // Actions
    resetFilters: () => void
}

export function useExploreFilters(
    options: UseExploreFiltersOptions = {}
): UseExploreFiltersReturn {
    const { defaultSortType = 'recommended', dynamicDefault } = options

    const [showFilters, setShowFilters] = useState(false)
    const [selectedFilters, setSelectedFilters] = useState<string[]>([])
    // 첫 렌더에 이미 위치를 알 수 있으면(세션 캐시 등) 바로 nearby로 시작해 깜빡임 방지
    const [sortType, setSortTypeRaw] = useState<SortType>(() =>
        dynamicDefault?.locationAvailable ? 'nearby' : defaultSortType
    )
    const [is24hOnly, setIs24hOnly] = useState(false)

    // 사용자가 정렬을 직접 선택했는지 / 동적 기본값을 이미 1회 적용했는지
    const userPickedSortRef = useRef(false)
    const autoDefaultAppliedRef = useRef(false)

    const setSortType = useCallback((type: SortType) => {
        userPickedSortRef.current = true
        setSortTypeRaw(type)
    }, [])

    const dynEnabled = !!dynamicDefault
    const dynResolved = dynamicDefault?.resolved ?? false
    const dynLocationAvailable = dynamicDefault?.locationAvailable ?? false

    // 권한 상태 확정 시 1회 동적 기본 정렬 적용 (사용자가 아직 직접 안 바꿨을 때만)
    useEffect(() => {
        if (!dynEnabled || userPickedSortRef.current || autoDefaultAppliedRef.current) return
        if (!dynResolved) return
        autoDefaultAppliedRef.current = true
        setSortTypeRaw(dynLocationAvailable ? 'nearby' : 'recommended')
    }, [dynEnabled, dynResolved, dynLocationAvailable])

    const toggleFiltersPanel = useCallback(() => {
        setShowFilters((prev) => !prev)
    }, [])

    const toggleFilter = useCallback((filterId: string) => {
        setSelectedFilters((prev) =>
            prev.includes(filterId)
                ? prev.filter((f) => f !== filterId)
                : [...prev, filterId]
        )
    }, [])

    const resetFilters = useCallback(() => {
        setSelectedFilters([])
        setIs24hOnly(false)
    }, [])

    const filterCount = selectedFilters.length + (is24hOnly ? 1 : 0)
    const hasActiveFilters = filterCount > 0

    return {
        showFilters,
        setShowFilters,
        toggleFiltersPanel,
        selectedFilters,
        toggleFilter,
        is24hOnly,
        setIs24hOnly,
        sortType,
        setSortType,
        filterCount,
        hasActiveFilters,
        resetFilters,
    }
}
