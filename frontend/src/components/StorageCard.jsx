import { formatBytes } from '../utils/format.js'

export default function StorageCard({ storage }) {
  if (!storage) {
    return (
      <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
        <div className="text-[14px] font-semibold text-bc-text2">Armazenamento</div>
        <div className="mt-2 text-[13px] text-bc-text3">Sem dados (execute uma varredura)</div>
      </div>
    )
  }

  const percent = Number(storage.percent) || 0
  return (
    <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold text-bc-text2">Armazenamento</div>
        <div className="text-[12px] font-semibold text-bc-text3">{percent}%</div>
      </div>
      <div className="mt-2 text-[24px] font-bold text-bc-text">{formatBytes(storage.used)}</div>
      <div className="mt-1 text-[13px] text-bc-text3">de {formatBytes(storage.total)} (livre: {formatBytes(storage.free)})</div>
      <div className="mt-3 h-2 w-full rounded-full bg-bc-bg2">
        <div
          className="h-2 rounded-full bg-[linear-gradient(90deg,#A855F7,#3B82F6)]"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  )
}
