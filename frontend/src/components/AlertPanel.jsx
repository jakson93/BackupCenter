import { AlertTriangle } from 'lucide-react'
import { formatRelativeTime } from '../utils/format.js'

function severityTone(severity) {
  if (severity === 'critical') return 'border-l-bc-bad'
  return 'border-l-bc-warn'
}

export default function AlertPanel({ alerts }) {
  return (
    <div className="flex flex-col h-full rounded-card border border-bc-border bg-bc-card shadow-inner">
      <div className="flex items-center justify-between border-b border-bc-border px-4 py-3">
        <div className="text-[14px] font-semibold text-bc-text2">Alertas</div>
        <button className="text-[12px] font-semibold text-bc-info hover:underline">Ver todos</button>
      </div>
      <div className="flex-1 overflow-auto p-2 bc-scrollbar">
        {alerts?.length ? (
          alerts.map((a) => (
            <div
              key={a.id}
              className="mb-3 rounded-table border border-transparent px-2 py-1 hover:bg-bc-hover"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(245,158,11,0.1)] text-bc-warn">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-[13px] font-bold text-bc-warn">{a.equipment_name || 'Servidor'}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[12px] text-bc-textWeak">{a.created_at ? formatRelativeTime(a.created_at) : ''}</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-bc-bad"></div>
                    </div>
                  </div>
                  <div className="mt-0.5 text-[13px] font-bold text-bc-text">{a.message}</div>
                  <div className="text-[12px] text-bc-text3 leading-tight">
                    Último backup há mais de 24 horas.
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-[13px] text-bc-text3">Nenhum alerta aberto.</div>
        )}
      </div>
      <div className="border-t border-bc-border p-3">
        <button className="flex items-center gap-1 text-[13px] font-semibold text-bc-info hover:underline">
          Ver todos os alertas
          <span className="text-bc-info">›</span>
        </button>
      </div>
    </div>
  )
}
