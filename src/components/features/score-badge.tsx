import React from 'react'
import { EXPLORE } from '@/constants/content'

interface ScoreBadgeProps {
    score: number
    count?: number // 장소 카드용 (평균 평점 표시 시 기록 수)
    descriptor?: string // 점수 옆 설명 텍스트 (예: "꼭 가야해요!")
    showMax?: boolean // /5 표시 여부 (기본 true)
    className?: string
}

export default function ScoreBadge({ score, count, descriptor, showMax = true, className = '' }: ScoreBadgeProps) {
    return (
        <div className={`flex items-center gap-1 text-xs ${className}`}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)', fontSize: '14px' }}>move</span>
            <span className="font-medium" style={{ color: 'var(--color-accent)' }}>
                {score}{showMax && '/5'}
            </span>

            {descriptor && (
                <>
                    <span className="text-stone-300">·</span>
                    <span className="font-medium" style={{ color: 'var(--color-accent)' }}>{descriptor}</span>
                </>
            )}

            {count !== undefined && (
                <>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-500">{count}건의 기록</span>
                </>
            )}
        </div>
    )
}
