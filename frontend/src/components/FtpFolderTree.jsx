import { Folder, RefreshCcw } from 'lucide-react'
import { formatBytes } from '../utils/format.js'

export default function FtpFolderTree({ rootLabel = '/backups', folders = [], storage }) {
  return (
    <div className="flex h-full flex-col rounded-card border border-bc-border bg-bc-card shadow-inner">
      <div className="flex items-center justify-between border-b border-bc-border px-4 py-3">
        <div className="text-[14px] font-semibold text-bc-text2">Pastas no Servidor FTP</div>
        <button className="text-bc-text3 hover:text-bc-text">
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 bc-scrollbar">
        <div className="flex items-center gap-2 px-2 py-2 text-[12px] font-semibold text-bc-text">
          <span className="text-bc-warn">📂</span> {rootLabel}
        </div>
        {folders?.map((f) => (
          <div
            key={f.name}
            className="flex items-center justify-between gap-3 rounded-table border border-transparent px-2 py-1.5 hover:bg-bc-hover"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Folder className="h-4 w-4 fill-bc-warn text-bc-warn" />
              <div className="truncate text-[13px] font-medium text-bc-text2">{f.name}/</div>
            </div>
            <div className="shrink-0 text-[12px] font-medium text-bc-text3">
              {f.size_bytes > 0 ? formatBytes(f.size_bytes) : '--'}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-bc-border p-4">
        {storage ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12px] font-medium">
              <span className="text-bc-text2">
                Total usado: <span className="text-bc-text">{formatBytes(storage.used)}</span> de {formatBytes(storage.total)}
              </span>
              <span className="text-bc-text2">{storage.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bc-bg2 border border-bc-border">
              <div
                className="h-full bg-bc-info transition-all"
                style={{ width: `${storage.percent}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-bc-text3 text-center">Execute uma varredura para calcular uso.</div>
        )}
      </div>
    </div>
  )
}
