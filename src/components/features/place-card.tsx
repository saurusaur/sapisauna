import { ICONS } from '@/constants/content'
import { getFacilityLabel } from '@/lib/utils'
import type { Place } from '@/types'
import { usePlaceStats } from '@/hooks/use-places'
import Chip from '@/components/ui/chip'

/**
 * Badge24h — 24시 영업 배지 (PlaceCard 내부 + 외부 export)
 *
 * PlaceCard 내에서 자동 표시되므로 별도 import 불필요.
 * explore/[id] 같은 상세 페이지에서는 직접 import하여 사용.
 */
export function Badge24h() {
    return (
        <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
        >
            24H
        </span>
    )
}

interface PlaceCardProps {
    place: Place
    onClick: () => void
    variant?: 'default' | 'minimal'
    // favorite는 선택적 — place/page.tsx처럼 favorite 없는 곳에서도 사용 가능
    isFavorited?: boolean
    onToggleFavorite?: () => void
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
    onClick,
    variant = 'default',
    isFavorited,
    onToggleFavorite,
}: PlaceCardProps) {
    const { stats } = usePlaceStats(place.id)
    const showFavorite = onToggleFavorite !== undefined

    // 공통: 이름 + 24h + 주소 헤더
    const placeHeader = (
        <>
            <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-stone-700 truncate">{place.name}</span>
                {place.is_24h && <Badge24h />}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{place.short_address || place.address}</p>
        </>
    )

    // 공통: 즐겨찾기 버튼
    const favoriteButton = showFavorite && (
        <div
            onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
            }}
            className="p-1 flex-shrink-0 ml-2"
        >
            <span
                className="material-symbols-outlined text-lg"
                style={{ color: isFavorited ? 'var(--color-primary)' : '#d6d3d1' }}
            >
                {isFavorited ? ICONS.FAVORITE : ICONS.FAVORITE_BORDER}
            </span>
        </div>
    )

    // 공통: 시설 칩
    const facilityChips = place.facilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
            {sortFacilities(place.facilities).slice(0, 4).map((f) => (
                <Chip key={f} label={getFacilityLabel(f)} size="sm" />
            ))}
            {place.facilities.length > 4 && (
                <Chip label={`+${place.facilities.length - 4}`} size="sm" />
            )}
        </div>
    )

    // 공통: 평점
    const scoreDisplay = stats.count > 0 && (
        <div className="flex items-center gap-1 text-xs">
            <span className="font-medium" style={{ color: 'var(--color-accent)' }}>
                ★ {stats.avg}
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500">{stats.count}건의 기록</span>
        </div>
    )

    if (variant === 'minimal') {
        return (
            <button
                onClick={onClick}
                className="w-full glass-card p-3 text-left hover:shadow-md transition-all flex items-start justify-between"
            >
                <div className="flex-1 min-w-0">
                    {placeHeader}
                    {stats.count > 0 && <div className="mt-1">{scoreDisplay}</div>}
                </div>
                {favoriteButton}
            </button>
        )
    }

    // Default Variant
    return (
        <button
            onClick={onClick}
            className="w-full glass-card p-3 text-left hover:shadow-md transition-all"
        >
            <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">{placeHeader}</div>
                {favoriteButton}
            </div>
            {facilityChips}
            {scoreDisplay}
        </button>
    )
}
