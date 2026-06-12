import { TRIBE_EMOJI_MAP } from '@/constants/content'
import { formatShortDate, getDetailText, hasLogDetail } from '@/lib/utils'
import type { LogWithPlace } from '@/types'
import ScoreBadge from './score-badge'

interface RecordCardProps {
    log: LogWithPlace
    onClick: () => void
}

export default function RecordCard({ log, onClick }: RecordCardProps) {

    const hasDeepLog = hasLogDetail(log)

    return (
        <button
            onClick={onClick}
            className="w-full glass-card-light p-3 text-left hover:shadow-md active:scale-[0.98] transition-all"
        >
            {/* Row1: 장소명 / 로그 점(스톤) + 트라이브 이모지 */}
            <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-stone-700 truncate">{log.place_name}</span>
                <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {hasDeepLog ? (
                        <span
                            className="relative rounded-full"
                            style={{ width: 12, height: 12, border: '1.5px solid #a8a29e' }}
                        >
                            <span
                                className="absolute rounded-full bg-stone-400"
                                style={{ width: 5, height: 5, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                            />
                        </span>
                    ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
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
