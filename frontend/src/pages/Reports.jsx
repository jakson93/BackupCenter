import { useEffect, useMemo, useState } from 'react'
import { api, apiUrl } from '../services/api.js'
import BackupActivityChart from '../components/BackupActivityChart.jsx'
import { formatBytes } from '../utils/format.js'

function buildQuery(obj) {
  const q = new URLSearchParams()
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v == null || v === '') return
    q.set(k, String(v))
  })
  return q.toString()
}

export default function Reports() {
  const [days, setDays] = useState(7)
  const [summary, setSummary] = useState([])
  const [equipments, setEquipments] = useState([])

  const [bk, setBk] = useState({ equipment_id: '', status: '', from: '', to: '' })

  async function load() {
    const [s, e] = await Promise.all([
      api.get(`/reports/summary?days=${days}`),
      api.get('/equipments'),
    ])
    setSummary(s.data?.rows || [])
    setEquipments(e.data || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const latest = useMemo(() => {
    return (equipments || []).map((e) => {
      const st = e.stats
      return {
        id: e.id,
        name: e.name,
        ip: e.ip_address,
        folder: e.ftp_folder,
        last: st?.last_backup || null,
        size: st?.folder_size_bytes || 0,
        status: st?.status || '',
      }
    })
  }, [equipments])

  function download(url) {
    // Use same-origin cookie (set on login) for downloads.
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[22px] font-bold text-bc-text">Relatorios</div>
        <div className="mt-1 text-[13px] text-bc-text3">Exportacoes CSV e resumo por dia.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[14px] font-semibold text-bc-text2">Resumo por dia</div>
              <div className="mt-1 text-[12px] text-bc-textWeak">Sucesso/Falha</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`h-9 rounded-btn border px-3 text-[12px] font-semibold ${
                  days === 7
                    ? 'border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] text-bc-text'
                    : 'border-bc-border bg-bc-card2 text-bc-text2 hover:bg-bc-hover'
                }`}
                onClick={() => setDays(7)}
              >
                7 dias
              </button>
              <button
                type="button"
                className={`h-9 rounded-btn border px-3 text-[12px] font-semibold ${
                  days === 30
                    ? 'border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] text-bc-text'
                    : 'border-bc-border bg-bc-card2 text-bc-text2 hover:bg-bc-hover'
                }`}
                onClick={() => setDays(30)}
              >
                30 dias
              </button>
            </div>
          </div>
          <BackupActivityChart data={summary} title="Resumo por dia" subtitle={`Ultimos ${days} dias`} />
        </div>

        <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
          <div className="text-[14px] font-semibold text-bc-text2">Exportar CSV</div>
          <div className="mt-1 text-[12px] text-bc-textWeak">Backups, alertas e equipamentos.</div>

          <div className="mt-4 rounded-table border border-bc-border bg-bc-bg2 p-4">
            <div className="text-[13px] font-semibold text-bc-text2">Backups</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label>
                <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Equipamento</div>
                <select
                  value={bk.equipment_id}
                  onChange={(e) => setBk((s) => ({ ...s, equipment_id: e.target.value }))}
                  className="h-10 w-full rounded-input border border-bc-border bg-bc-card px-3 text-[13px] text-bc-text"
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
                  value={bk.status}
                  onChange={(e) => setBk((s) => ({ ...s, status: e.target.value }))}
                  className="h-10 w-full rounded-input border border-bc-border bg-bc-card px-3 text-[13px] text-bc-text"
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
                  value={bk.from}
                  onChange={(e) => setBk((s) => ({ ...s, from: e.target.value }))}
                  className="h-10 w-full rounded-input border border-bc-border bg-bc-card px-3 text-[13px] text-bc-text"
                />
              </label>
              <label>
                <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Data final</div>
                <input
                  type="datetime-local"
                  value={bk.to}
                  onChange={(e) => setBk((s) => ({ ...s, to: e.target.value }))}
                  className="h-10 w-full rounded-input border border-bc-border bg-bc-card px-3 text-[13px] text-bc-text"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="h-10 rounded-btn border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(59,130,246,0.20)]"
                onClick={() => download(apiUrl(`/reports/csv/backups?${buildQuery(bk)}`))}
              >
                Baixar CSV de backups
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover"
              onClick={() => download(apiUrl('/reports/csv/alerts'))}
            >
              Baixar CSV de alertas
            </button>
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover"
              onClick={() => download(apiUrl('/reports/csv/equipments'))}
            >
              Baixar CSV de equipamentos
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold text-bc-text2">Ultimo backup por equipamento</div>
            <div className="mt-1 text-[12px] text-bc-textWeak">Download rapido do ultimo arquivo detectado.</div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto bc-scrollbar">
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[12px] font-semibold text-bc-textWeak">
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Recebido em</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((r) => (
                <tr key={r.id} className="border-t border-bc-border/80">
                  <td className="px-4 py-3 text-[13px] font-semibold text-bc-text">{r.name}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">{r.ip || '-'}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">{r.last?.file_name || '-'}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">
                    {r.last?.received_at ? new Date(r.last.received_at).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-bc-text2">{formatBytes(r.last?.file_size || 0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover disabled:opacity-50"
                        disabled={!r.last?.id}
                        onClick={() => download(apiUrl(`/backups/${r.last.id}/download`))}
                      >
                        Baixar ultimo
                      </button>
                      <button
                        type="button"
                        className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                        onClick={() => (window.location.href = `/backups?equipment_id=${r.id}`)}
                      >
                        Ver historico
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!latest.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-bc-text3">
                    Nenhum equipamento cadastrado.
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
