import { ICONS } from '@/constants/content'
import { getFacilityLabel } from '@/lib/utils'
import type { Place } from '@/types'
import { usePlaceStats } from '@/hooks/use-places'
import Chip from '@/components/ui/chip'
import ScoreBadge from './score-badge'

interface PlaceCardProps {
    place: Place
    isFavorited: boolean
    onToggleFavorite: () => void
    onClick: () => void
    variant?: 'default' | 'minimal'
}

// 기본 시설 — 카드 표시에서 후순위로 밀기 (상세 페이지에서는 전체 표시)
const BASIC_FACILITIES = new Set(['hot-bath', 'very-hot-bath', 'cold-bath'])

function sortFacilities(facilities: string[]): string[] {
    const special = facilities.filter((f) => !BASIC_FACILITIES.has(f))
    const basic = facilities.filter((f) => BASIC_FACILITIES.has(f))
    return [...special, ...basic]
}

export default function PlaceCard({
    place,
    isFavorited,
    onToggleFavorite,
    onClick,
    variant = 'default',
}: PlaceCardProps) {
    const { stats } = usePlaceStats(place.id)

    if (variant === 'minimal') {
        return (
            <button
                onClick={onClick}
                className="w-full bg-white p-3 rounded-xl shadow-sm text-left hover:shadow-md transition-all flex items-start justify-between"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-700 text-sm truncate">{place.name}</span>
                        {place.is_24h && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium flex-shrink-0">
                                24h
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{place.short_address || place.address}</p>
                    {stats.count > 0 && (
                        <div className="mt-1">
                            <ScoreBadge score={stats.avg} count={stats.count} />
                        </div>
                    )}
                </div>
                <div
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite()
                    }}
                    className="p-1 flex-shrink-0 ml-2"
                >
                    <span
                        className="material-symbols-outlined text-lg"
                        style={{ color: isFavorited ? 'var(--color-green)' : '#d6d3d1' }}
                    >
                        {isFavorited ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
                    </span>
                </div>
            </button>
        )
    }

    // Default Variant
    return (
        <button
            onClick={onClick}
            className="w-full bg-white p-3 rounded-xl shadow-sm text-left hover:shadow-md transition-all"
        >
            <div className="flex items-start justify-between mb-1">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-stone-700">{place.name}</span>
                        {place.is_24h && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">
                                24h
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{place.short_address || place.address}</p>
                </div>
                <div
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite()
                    }}
                    className="p-1"
                >
                    <span
                        className="material-symbols-outlined text-lg"
                        style={{ color: isFavorited ? 'var(--color-green)' : '#d6d3d1' }}
                    >
                        {isFavorited ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
                    </span>
                </div>
            </div>

            <div className="flex gap-1 mb-1">
                {sortFacilities(place.facilities).slice(0, 4).map((f) => (
                    <Chip
                        key={f}
                        label={getFacilityLabel(f)}
                        size="sm"
                    />
                ))}
                {place.facilities.length > 4 && (
                    <Chip label={`+${place.facilities.length - 4}`} size="sm" />
                )}
            </div>

            {stats.count > 0 && (
                <ScoreBadge score={stats.avg} count={stats.count} />
            )}
        </button>
    )
}
