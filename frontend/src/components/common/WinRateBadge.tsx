import clsx from 'clsx'

interface Props {
  value: number // 0–1
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function WinRateBadge({ value, label, size = 'md' }: Props) {
  const pct = (value * 100).toFixed(1)
  const color =
    value >= 0.53 ? 'text-emerald-400' :
    value >= 0.50 ? 'text-yellow-400' :
    value >= 0.47 ? 'text-gray-300' :
    'text-red-400'

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl font-bold',
  }

  return (
    <span className={clsx(color, sizes[size], 'font-semibold tabular-nums')}>
      {pct}%{label && <span className="text-gray-500 font-normal ml-1 text-xs">{label}</span>}
    </span>
  )
}
