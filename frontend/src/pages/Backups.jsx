import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { api, apiUrl } from '../services/api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatBytes } from '../utils/format.js'

export default function Backups() {
  const { search } = useOutletContext()
  const [params] = useSearchParams()
  const equipmentId = params.get('equipment_id')

  const [rows, setRows] = useState([])
  const [equipments, setEquipments] = useState([])
  const [filters, setFilters] = useState({
    equipment_id: equipmentId || '',
    status: '',
    from: '',
    to: '',
  })

  async function load() {
    const eq = await api.get('/equipments')
    setEquipments(eq.data)
    const q = new URLSearchParams()
    if (filters.equipment_id) q.set('equipment_id', filters.equipment_id)
    if (filters.status) q.set('status', filters.status)
    if (filters.from) q.set('from', filters.from)
    if (filters.to) q.set('to', filters.to)
    const r = await api.get(`/backups?${q.toString()}`)
    setRows(r.data)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      return (
        String(r.equipment_name || '').toLowerCase().includes(q) ||
        String(r.file_name || '').toLowerCase().includes(q) ||
        String(r.file_path || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  async function onDownload(row) {
    window.open(apiUrl(`/backups/${row.id}/download`), '_blank')
  }

  async function onDelete(row) {
    if (!confirm(`Excluir arquivo "${row.file_name}"?`)) return
    await api.delete(`/backups/${row.id}`)
    await load()
  }

  async function onApply() {
    await load()
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[22px] font-bold text-bc-text">Backups</div>
        <div className="mt-1 text-[13px] text-bc-text3">Lista de arquivos detectados no FTP.</div>
      </div>

      <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <label className="md:col-span-2">
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Equipamento</div>
            <select
              value={filters.equipment_id}
              onChange={(e) => setFilters((s) => ({ ...s, equipment_id: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            >
              <option value="">Todos</option>
              {equipments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Status</div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            >
              <option value="">Todos</option>
              <option value="valid">Validos</option>
              <option value="invalid">Invalidos</option>
            </select>
          </label>
          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Data inicial</div>
            <input
              type="datetime-local"
              value={filters.from}
              onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>
          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Data final</div>
            <input
              type="datetime-local"
              value={filters.to}
              onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover"
            onClick={onApply}
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      <div className="flex flex-col rounded-card border border-bc-border bg-bc-card shadow-inner max-h-[420px]">
        <div className="overflow-auto bc-scrollbar flex-1">
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[12px] font-semibold text-bc-textWeak">
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Recebido em</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3">Caminho</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-bc-border/80">
                  <td className="px-4 py-3 text-[13px] font-semibold text-bc-text">{r.equipment_name}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">{r.file_name}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">
                    {r.received_at ? new Date(r.received_at).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-bc-text2">{formatBytes(r.file_size)}</td>
                  <td className="px-4 py-3 text-[12px] text-bc-textWeak">{r.file_path}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status === 'valid' ? 'ok' : 'failed'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                        onClick={() => onDownload(r)}
                      >
                        Baixar
                      </button>
                      <button
                        type="button"
                        className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-bad hover:bg-bc-hover"
                        onClick={() => onDelete(r)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-bc-text3">
                    Nenhum backup encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
