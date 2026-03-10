'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { TRIBE_COLORS, MESSAGES } from '@/constants/content'
import type { LogWithPlace } from '@/types'

// 요일 헤더 (월요일 시작)
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

interface HomeCalendarProps {
  logs: LogWithPlace[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

// 월요일 시작 기준으로 해당 날짜가 속한 주의 7일 반환
function getWeekDays(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() + mondayOffset)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

// 해당 월의 캘린더 그리드 생성 (월요일 시작)
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const grid: Date[] = []

  // 이전 달 날짜 채우기
  for (let i = startOffset - 1; i >= 0; i--) {
    grid.push(new Date(year, month, -i))
  }

  // 현재 달
  for (let d = 1; d <= lastDay.getDate(); d++) {
    grid.push(new Date(year, month, d))
  }

  // 다음 달 날짜 채우기 (7의 배수로)
  const remaining = 7 - (grid.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      grid.push(new Date(year, month + 1, i))
    }
  }

  return grid
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HomeCalendar({ logs, selectedDate, onSelectDate }: HomeCalendarProps) {
  const [expanded, setExpanded] = useState(false)
  const [weekBase, setWeekBase] = useState(() => new Date())
  const [monthView, setMonthView] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // 터치 스와이프 tracking
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  // 날짜→로그 매핑
  const logsByDate = useMemo(() => {
    const map: Record<string, LogWithPlace[]> = {}
    logs.forEach((log) => {
      const key = log.date.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(log)
    })
    return map
  }, [logs])

  const today = new Date()
  const todayKey = toDateKey(today)

  // 주간/월간 데이터
  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase])

  // 주간 뷰 기준 월
  // - 월 걸침 없음 → 그 월 고정
  // - 월 걸침 + 선택 날짜가 이 주에 있음 → 선택 날짜 기준
  // - 월 걸침 + 선택 날짜가 이 주에 없음 → 과반 월 (목요일 기준)
  const weekMonth = useMemo(() => {
    const monMonth = weekDays[0].getMonth()
    const sunMonth = weekDays[6].getMonth()
    if (monMonth === sunMonth) return monMonth
    // 월 걸침 → 선택 날짜가 이 주에 있는지 확인
    const weekKeys = weekDays.map(toDateKey)
    if (weekKeys.includes(selectedDate)) {
      return new Date(selectedDate + 'T00:00:00').getMonth()
    }
    return weekDays[3].getMonth()
  }, [weekDays, selectedDate])
  const monthGrid = useMemo(
    () => getMonthGrid(monthView.year, monthView.month),
    [monthView.year, monthView.month]
  )

  // 네비게이션
  const goToPrevWeek = useCallback(() => {
    setWeekBase((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }, [])

  const goToNextWeek = useCallback(() => {
    setWeekBase((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }, [])

  const goToPrevMonth = useCallback(() => {
    setMonthView((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: prev.month - 1 }
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setMonthView((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: prev.month + 1 }
    })
  }, [])

  const goToToday = () => {
    const now = new Date()
    onSelectDate(toDateKey(now))
    setWeekBase(now)
    setMonthView({ year: now.getFullYear(), month: now.getMonth() })
  }

  // 스와이프 — 달력 영역만 반응, 페이지 스크롤 차단
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current)
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)
    // 수평 이동이 수직보다 크면 스와이프로 판단 → 페이지 스크롤 차단
    if (deltaX > 10 && deltaX > deltaY) {
      isSwiping.current = true
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 50) {
      if (expanded) {
        deltaX > 0 ? goToPrevMonth() : goToNextMonth()
      } else {
        deltaX > 0 ? goToPrevWeek() : goToNextWeek()
      }
    }
  }

  // 날짜 셀 렌더링
  const renderDateCell = (date: Date, referenceMonth: number) => {
    const key = toDateKey(date)
    const isSelected = selectedDate === key
    const isToday = key === todayKey
    const isOtherMonth = date.getMonth() !== referenceMonth
    const dayLogs = logsByDate[key] || []
    const uniqueTypes = Array.from(new Set(dayLogs.map((l) => l.tribe_id)))

    return (
      <button
        key={key}
        onClick={() => onSelectDate(key)}
        className={`py-1.5 flex flex-col items-center gap-0.5 rounded-lg transition-all ${
          isSelected ? 'bg-[var(--color-primary-light)]' : ''
        }`}
      >
        <span
          className={`text-sm ${
            isOtherMonth
              ? 'text-stone-300'
              : isToday
                ? 'font-bold'
                : isSelected
                  ? 'font-bold text-stone-700'
                  : 'text-stone-600'
          }`}
          style={isToday && !isOtherMonth ? { color: 'var(--color-primary)' } : undefined}
        >
          {date.getDate()}
        </span>

        <div className="flex gap-0.5 h-2 items-center">
          {uniqueTypes.map((type) => (
            <span
              key={type}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: TRIBE_COLORS[type] || '#d6d3d1' }}
            />
          ))}
        </div>
      </button>
    )
  }

  // 표시할 월 — 주간/월간 동일 형식
  const displayMonth = useMemo(() => {
    if (expanded) {
      return `${monthView.year}년 ${monthView.month + 1}월`
    }
    const refDate = weekDays.find(d => d.getMonth() === weekMonth) || weekDays[3]
    return `${refDate.getFullYear()}년 ${weekMonth + 1}월`
  }, [expanded, monthView, weekDays, weekMonth])

  return (
    <div className="glass-card px-4 pt-3 pb-1">
      {/* 상단: < 월 > + 오늘 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={expanded ? goToPrevMonth : goToPrevWeek}
            className="p-0.5 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <span className="font-bold text-stone-700 text-base min-w-[90px] text-center">{displayMonth}</span>
          <button
            onClick={expanded ? goToNextMonth : goToNextWeek}
            className="p-0.5 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="text-xs font-semibold px-2 py-1 rounded-md hover:bg-stone-100 transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          {MESSAGES.HOME.TODAY}
        </button>
      </div>

      {/* 달력 영역 — 스와이프 대상 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-stone-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* 주간 뷰 */}
        {!expanded && (
          <div className="grid grid-cols-7">
            {weekDays.map((date) => renderDateCell(date, weekMonth))}
          </div>
        )}

        {/* 월간 뷰 */}
        {expanded && (
          <div className="grid grid-cols-7">
            {monthGrid.map((date) => renderDateCell(date, monthView.month))}
          </div>
        )}
      </div>

      {/* 확장/축소 chevron */}
      <div className="flex justify-center pt-1">
        <button
          onClick={() => {
            if (!expanded) {
              const d = new Date(selectedDate + 'T00:00:00')
              setMonthView({ year: d.getFullYear(), month: d.getMonth() })
            } else {
              setWeekBase(new Date(selectedDate + 'T00:00:00'))
            }
            setExpanded(!expanded)
          }}
          className="p-1 transition-colors hover:bg-stone-100 rounded-full"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', color: 'var(--color-primary)' }}
          >
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
    </div>
  )
}
