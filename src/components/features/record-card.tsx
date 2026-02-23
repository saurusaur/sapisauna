import { TRIBE_EMOJI_MAP } from '@/constants/content'
import { formatShortDate, getWaterQualityLabel, getCleanlinessLabel } from '@/lib/utils'
import type { DummyLog } from '@/data/dummy-logs'
import ScoreBadge from './score-badge'

interface RecordCardProps {
    log: DummyLog
    onClick: () => void
}

export default function RecordCard({ log, onClick }: RecordCardProps) {
    // 상세 정보 텍스트 생성 (TYPE별 상이)
    const getDetailText = (log: DummyLog) => {
        switch (log.tribe_id) {
            case 'saunner':
                return `사우나 ${log.sauna_temp}°C · 냉탕 ${log.cold_bath_temp}°C · ${log.repeat}세트`
            case 'bather':
                return `수질 ${getWaterQualityLabel(log.water_quality || 3)} · 온탕 ${log.hot_bath_temp}°C`
            case 'jimi':
                return log.jjim_temp
                    ? `한증막 ${log.jjim_temp}°C · 청결 ${getCleanlinessLabel(log.cleanliness || 3)}`
                    : `청결 ${getCleanlinessLabel(log.cleanliness || 3)}`
            default:
                return ''
        }
    }

    const hasDeepLog = Boolean(log.deep_log)

    return (
        <button
            onClick={onClick}
            className="w-full bg-white p-3 rounded-xl shadow-sm text-left hover:shadow-md transition-all"
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
                <span className="text-xs text-stone-400">{formatShortDate(new Date(log.date))}</span>
            </div>
        </button>
    )
}
