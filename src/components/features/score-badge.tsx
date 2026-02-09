import React from 'react'
import { EXPLORE } from '@/constants/content'

interface ScoreBadgeProps {
    score: number
    count?: number // 장소 카드용 (평균 평점 표시 시 기록 수)
    className?: string
}

export default function ScoreBadge({ score, count, className = '' }: ScoreBadgeProps) {
    // "또 갈래요" 텍스트 사용 (constants에서 가져옴)
    const label = EXPLORE.REVISIT_LABEL

    return (
        <div className={`flex items-center gap-1 text-xs ${className}`}>
            <span className="font-medium" style={{ color: 'var(--color-orange)' }}>
                {label} {score}
            </span>

            {count !== undefined && (
                <>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-500">{count}건의 기록</span>
                </>
            )}
        </div>
    )
}
