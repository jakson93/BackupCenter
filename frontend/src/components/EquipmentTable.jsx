import { FolderOpen, History, RefreshCcw, Settings2, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import { formatBytes } from '../utils/format.js'
import { formatRelativeTime } from '../utils/format.js'

function relTime(iso) {
  if (!iso) return 'Nunca'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Nunca'
  return formatRelativeTime(iso)
}

export default function EquipmentTable({ rows, onAction }) {
  return (
    <div className="rounded-card border border-bc-border bg-bc-card shadow-inner">
      <div className="flex items-center justify-between border-b border-bc-border px-4 py-3">
        <div className="text-[14px] font-semibold text-bc-text2">Status dos Equipamentos e Backups</div>
      </div>

      <div className="overflow-x-auto bc-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[12px] font-semibold text-bc-textWeak">
              <th className="px-4 py-3">Equipamento</th>
              <th className="hidden md:table-cell px-4 py-3">IP</th>
              <th className="px-4 py-3">Ultimo backup</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden lg:table-cell px-4 py-3">Pasta FTP</th>
              <th className="hidden md:table-cell px-4 py-3">Tamanho</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((r) => {
                const last = r.last_backup?.received_at
                return (
                  <tr key={r.id} className="border-t border-bc-border/80">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold text-bc-text">{r.name}</div>
                      <div className="text-[12px] text-bc-textWeak">{r.hostname || r.vendor || ''}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-[13px] text-bc-text2">{r.ip_address || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-bc-text2">{relTime(last)}</div>
                      <div className="text-[12px] text-bc-textWeak">{last ? new Date(last).toLocaleString('pt-BR') : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-[13px] text-bc-text2 font-mono">{r.resolved_path}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-[13px] font-semibold text-bc-text2">
                      {formatBytes(r.folder_size_bytes)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-bc-border bg-bc-card2 text-bc-text2 hover:bg-bc-hover"
                          title="Abrir pasta"
                          onClick={() => onAction?.('open-folder', r)}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-bc-border bg-bc-card2 text-bc-text2 hover:bg-bc-hover"
                          title="Ver historico"
                          onClick={() => onAction?.('history', r)}
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-bc-border bg-bc-card2 text-bc-text2 hover:bg-bc-hover"
                          title="Forcar varredura"
                          onClick={() => onAction?.('scan', r)}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-bc-border bg-bc-card2 text-bc-text2 hover:bg-bc-hover"
                          title="Editar equipamento"
                          onClick={() => onAction?.('edit', r)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-bc-border bg-bc-card2 text-bc-bad hover:bg-bc-hover"
                          title="Excluir equipamento"
                          onClick={() => onAction?.('delete', r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[13px] text-bc-text3">
                  Nenhum equipamento cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
