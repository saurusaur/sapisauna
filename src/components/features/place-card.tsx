import { ICONS } from '@/constants/content'
import { getFacilityLabel } from '@/lib/utils'
import type { Place } from '@/types'
import { usePlaceStats } from '@/hooks/use-places'
import Chip from '@/components/ui/chip'
import ScoreBadge from '@/components/features/score-badge'

/**
 * Badge24h — 24시 영업 배지 (PlaceCard 내부 + 외부 export)
 *
 * PlaceCard 내에서 자동 표시되므로 별도 import 불필요.
 * explore/[id] 같은 상세 페이지에서는 직접 import하여 사용.
 */
export function Badge24h() {
    return (
        <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
            24H
        </span>
    )
}

interface PlaceCardProps {
    place: Place
    onClick: () => void
    variant?: 'default' | 'minimal' | 'collection'
    // 저장 상태 — 아무 리스트에든 들어있으면 true (heart_check)
    isSaved?: boolean
    onToggleSave?: () => void
    // collection variant 전용: 리스트 생성자의 장소별 메모
    collectionMemo?: string
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
    isSaved,
    onToggleSave,
    collectionMemo,
}: PlaceCardProps) {
    const { stats } = usePlaceStats(place.id)
    const showSave = onToggleSave !== undefined

    // 공통: 이름 + 24h + 좋아요 + 주소 헤더
    const placeHeader = (
        <>
            <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-stone-700 truncate">{place.name}</span>
                {(place.bath_policy === 'male-only' || place.bath_policy === 'female-only') && (
                    <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{
                            backgroundColor: place.bath_policy === 'male-only' ? 'var(--color-male-light)' : 'var(--color-female-light)',
                            color: place.bath_policy === 'male-only' ? 'var(--color-male)' : 'var(--color-female)',
                        }}
                    >
                        {place.bath_policy === 'male-only' ? '♂' : '♀'}
                    </span>
                )}
                {place.is_24h && <Badge24h />}
                {showSave && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleSave()
                        }}
                        className="ml-auto flex-shrink-0"
                    >
                        <span
                            className="material-symbols-outlined text-sm"
                            style={{
                                color: isSaved ? 'var(--color-primary)' : 'var(--color-icon-inactive)',
                                fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
                            }}
                        >
                            bookmark_heart
                        </span>
                    </div>
                )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{place.short_address || place.address}</p>
        </>
    )

    // 공통: 시설 칩
    const facilityChips = place.facilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
            {sortFacilities(place.facilities).slice(0, 3).map((f) => (
                <Chip key={f} label={getFacilityLabel(f)} size="sm" />
            ))}
            {place.facilities.length > 3 && (
                <Chip label={`+${place.facilities.length - 3}`} size="sm" />
            )}
        </div>
    )

    // 공통: 평점
    const scoreDisplay = stats.count > 0 && (
        <ScoreBadge score={stats.avg} count={stats.count} />
    )

    // 장소별 메모 블록 (collection variant 전용)
    const memoBlock = collectionMemo && (
        <div className="my-1.5 pl-2 border-l-2 text-xs text-stone-500" style={{ borderColor: 'var(--color-primary)' }}>
            {collectionMemo}
        </div>
    )

    if (variant === 'minimal') {
        return (
            <button
                onClick={onClick}
                className="w-full glass-card-light p-3 text-left hover:shadow-md active:scale-[0.98] transition-all"
            >
                {placeHeader}
                {stats.count > 0 && <div className="mt-1">{scoreDisplay}</div>}
            </button>
        )
    }

    if (variant === 'collection') {
        return (
            <button
                onClick={onClick}
                className="w-full glass-card-light p-3 text-left hover:shadow-md active:scale-[0.98] transition-all"
            >
                <div className="mb-1">{placeHeader}</div>
                {facilityChips}
                {memoBlock}
                {scoreDisplay}
            </button>
        )
    }

    // Default Variant
    return (
        <button
            onClick={onClick}
            className="w-full glass-card-light p-3 text-left hover:shadow-md active:scale-[0.98] transition-all"
        >
            <div className="mb-1">{placeHeader}</div>
            {facilityChips}
            {scoreDisplay}
        </button>
    )
}
