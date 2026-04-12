import { TRIBE_COLORS } from '@/constants/content'
import { formatShortDate, getDetailText } from '@/lib/utils'
import type { LogWithPlace, TribeId } from '@/types'
import ScoreBadge from './score-badge'

interface RecordCardProps {
    log: LogWithPlace
    onClick: () => void
}

export default function RecordCard({ log, onClick }: RecordCardProps) {

    const hasDeepLog = Boolean(log.deep_log)

    return (
        <button
            onClick={onClick}
            className="w-full glass-card-light p-3 text-left hover:shadow-md active:scale-[0.98] transition-all"
        >
            {/* Row1: 장소명 / 트라이브 점 (딥로그: 테두리 점) */}
            <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-stone-700 truncate">{log.place_name}</span>
                <span className="flex items-center justify-center flex-shrink-0 ml-2">
                    {hasDeepLog ? (
                        <span
                            className="w-3 h-3 flex items-center justify-center rounded-full ring-1 ring-stone-300/80"
                            style={{ boxShadow: `0 0 0 1px ${TRIBE_COLORS[log.tribe_id as TribeId]}33 inset` }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TRIBE_COLORS[log.tribe_id as TribeId] }} />
                        </span>
                    ) : (
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TRIBE_COLORS[log.tribe_id as TribeId] }} />
                    )}
                </span>
            </div>

            {/* Row2: 상세 텍스트 */}
            <p className="text-xs text-stone-400 mb-1">{getDetailText(log)}</p>

            {/* Row3: ScoreBadge / 날짜 */}
            <div className="flex items-center justify-between">
                <ScoreBadge score={log.revisit_score} />
                <span className="text-xs text-stone-400 truncate text-right">
                    {log.user_nickname && <>{log.user_nickname} · </>}
                    {formatShortDate(new Date(log.date))}
                </span>
            </div>
        </button>
    )
}
