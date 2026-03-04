import SelectButton from '@/components/ui/select-button'

// 칩 선택 컴포넌트 (deep/page, place/add/page 공유)
// multiple=true: 복수 선택 (selected는 string[])
// multiple=false(기본): 단일 선택 (selected는 string | null)
export default function ChipSelect({
  options,
  selected,
  onSelect,
  multiple = false,
}: {
  options: readonly { id: string; label: string; icon: string }[]
  selected: string | string[] | null
  onSelect: (id: string) => void
  multiple?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = multiple
          ? (selected as string[])?.includes(option.id)
          : selected === option.id

        return (
          <SelectButton
            key={option.id}
            label={option.label}
            icon={option.icon}
            selected={isSelected}
            onClick={() => onSelect(option.id)}
          />
        )
      })}
    </div>
  )
}
