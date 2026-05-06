import clsx from 'clsx'

const variants = {
  blue: {
    wrap: 'border-[rgba(59,130,246,0.35)] bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(15,27,45,0.95))]',
    icon: 'bg-[rgba(59,130,246,0.16)] text-bc-info border-[rgba(59,130,246,0.35)]',
  },
  green: {
    wrap: 'border-[rgba(34,197,94,0.35)] bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(15,27,45,0.95))]',
    icon: 'bg-[rgba(34,197,94,0.16)] text-bc-ok border-[rgba(34,197,94,0.35)]',
  },
  orange: {
    wrap: 'border-[rgba(245,158,11,0.35)] bg-[linear-gradient(135deg,rgba(245,158,11,0.20),rgba(15,27,45,0.95))]',
    icon: 'bg-[rgba(245,158,11,0.16)] text-bc-warn border-[rgba(245,158,11,0.35)]',
  },
  purple: {
    wrap: 'border-[rgba(168,85,247,0.35)] bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(15,27,45,0.95))]',
    icon: 'bg-[rgba(168,85,247,0.16)] text-bc-purple border-[rgba(168,85,247,0.35)]',
  },
}

export default function MetricCard({ title, value, subtitle, icon: Icon, variant = 'blue', progress }) {
  const v = variants[variant] || variants.blue

  const renderSide = () => {
    if (progress !== undefined) {
      const radius = 20
      const circumference = 2 * Math.PI * radius
      const offset = circumference - (progress / 100) * circumference
      return (
        <div className="relative flex h-14 w-14 items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="opacity-10"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={clsx(
                variant === 'blue' && 'text-bc-info',
                variant === 'green' && 'text-bc-ok',
                variant === 'orange' && 'text-bc-warn',
                variant === 'purple' && 'text-bc-purple'
              )}
            />
          </svg>
          <span className="absolute text-[11px] font-bold text-bc-text">{Math.round(progress)}%</span>
        </div>
      )
    }

    if (Icon) {
      return (
        <div className={clsx('flex h-11 w-11 items-center justify-center rounded-full border', v.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      )
    }
    return null
  }

  const renderSubtitle = () => {
    if (!subtitle) return null
    if (typeof subtitle === 'string' && subtitle.startsWith('+')) {
      return <div className="mt-1 text-[13px] font-medium text-bc-ok">{subtitle}</div>
    }
    return <div className="mt-1 text-[13px] text-bc-text3">{subtitle}</div>
  }

  return (
    <div className={clsx('rounded-card border p-4 shadow-inner', v.wrap)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-bc-text2">{title}</div>
          <div className="mt-2 truncate text-[32px] font-extrabold leading-tight text-bc-text">{value}</div>
          {renderSubtitle()}
        </div>
        {renderSide()}
      </div>
    </div>
  )
}
