import { TRIBE_EMOJI_MAP } from '@/constants/content'
import { formatShortDate, getDetailText } from '@/lib/utils'
import type { LogWithPlace } from '@/types'
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
            {/* Row1: 장소명 / 딥로그 아이콘 + 타입 이모지 */}
            <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-stone-700 truncate">{log.place_name}</span>
                <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {hasDeepLog && (
                        <span className="material-symbols-outlined text-stone-300" style={{ fontSize: '16px' }}>stacks</span>
                    )}
                    <span className="text-sm">{TRIBE_EMOJI_MAP[log.tribe_id]}</span>
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
