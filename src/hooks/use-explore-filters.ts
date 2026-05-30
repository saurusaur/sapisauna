'use client'

import { useState, useCallback } from 'react'

export type SortType = 'recommended' | 'popular' | 'nearby'

export interface UseExploreFiltersOptions {
    defaultSortType?: SortType
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
    const { defaultSortType = 'recommended' } = options

    const [showFilters, setShowFilters] = useState(false)
    const [selectedFilters, setSelectedFilters] = useState<string[]>([])
    const [sortType, setSortType] = useState<SortType>(defaultSortType)
    const [is24hOnly, setIs24hOnly] = useState(false)

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
