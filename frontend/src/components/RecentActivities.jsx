import { Bell, CheckCircle2, FolderPlus, XCircle } from 'lucide-react'
import { formatRelativeTime } from '../utils/format.js'

function iconFor(type) {
  if (type === 'backup_received') return { Icon: CheckCircle2, cls: 'text-bc-ok' }
  if (type === 'folder_created') return { Icon: FolderPlus, cls: 'text-bc-info' }
  if (type === 'backup_failed' || type === 'permission_error') return { Icon: XCircle, cls: 'text-bc-bad' }
  return { Icon: Bell, cls: 'text-bc-warn' }
}

export default function RecentActivities({ activities }) {
  return (
    <div className="flex flex-col h-full rounded-card border border-bc-border bg-bc-card shadow-inner">
      <div className="border-b border-bc-border px-4 py-3">
        <div className="text-[14px] font-semibold text-bc-text2">Atividades Recentes</div>
      </div>
      <div className="flex-1 overflow-auto p-2 bc-scrollbar">
        {activities?.length ? (
          activities.map((a) => {
            const { Icon, cls } = iconFor(a.type)
            return (
              <div
                key={a.id}
                className="mb-1 flex items-start gap-3 rounded-table border border-transparent px-2 py-2 hover:bg-bc-hover"
              >
                <div className="mt-0.5 rounded-full border border-bc-border bg-bc-bg2 p-1.5 shrink-0">
                  <Icon className={`h-4 w-4 ${cls}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-bc-text">{a.title}</div>
                  <div className="mt-0.5 truncate text-[12px] text-bc-text3">{a.description || ''}</div>
                </div>
                <div className="shrink-0 text-[12px] text-bc-textWeak">
                  {a.created_at ? formatRelativeTime(a.created_at) : ''}
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-4 text-[13px] text-bc-text3">Sem atividades recentes.</div>
        )}
      </div>
      <div className="border-t border-bc-border p-3">
        <button className="flex items-center gap-1 text-[13px] font-semibold text-bc-info hover:underline">
          Ver todas as atividades
          <span className="text-bc-info">›</span>
        </button>
      </div>
    </div>
  )
}
