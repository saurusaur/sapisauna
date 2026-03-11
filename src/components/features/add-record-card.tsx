import { BUTTONS } from '@/constants/content'

interface AddRecordCardProps {
    onClick: () => void
}

export default function AddRecordCard({ onClick }: AddRecordCardProps) {
    return (
        <button
            onClick={onClick}
            className="w-full py-12 mb-8 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
            <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--color-primary)' }}>add</span>
            <span className="font-semibold text-lg" style={{ color: 'var(--color-primary)' }}>{BUTTONS.ADD_RECORD}</span>
        </button>
    )
}
