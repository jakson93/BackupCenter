import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Alerts() {
  const { search } = useOutletContext()
  const [rows, setRows] = useState([])

  async function load() {
    const r = await api.get('/alerts?status=open&limit=200')
    setRows(r.data)
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      return (
        String(r.equipment_name || '').toLowerCase().includes(q) ||
        String(r.type || '').toLowerCase().includes(q) ||
        String(r.message || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  async function onResolve(row) {
    await api.put(`/alerts/${row.id}/resolve`)
    await load()
  }

  async function onScan(row) {
    if (!row.equipment_id) return
    await api.post(`/equipments/${row.equipment_id}/scan`)
    await load()
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[22px] font-bold text-bc-text">Alertas</div>
        <div className="mt-1 text-[13px] text-bc-text3">Alertas automaticos e resolucao manual.</div>
      </div>

      <div className="flex flex-col rounded-card border border-bc-border bg-bc-card shadow-inner max-h-[420px]">
        <div className="overflow-auto bc-scrollbar flex-1">
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[12px] font-semibold text-bc-textWeak">
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Severidade</th>
                <th className="px-4 py-3">Mensagem</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-bc-border/80">
                  <td className="px-4 py-3 text-[13px] font-semibold text-bc-text">{r.equipment_name || 'Servidor'}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">{r.type}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">{r.severity}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">{r.message}</td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">
                    {r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-bc-text2">{r.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                        onClick={() => onResolve(r)}
                      >
                        Resolver
                      </button>
                      <button
                        type="button"
                        className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                        onClick={() => onScan(r)}
                        disabled={!r.equipment_id}
                      >
                        Nova varredura
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-bc-text3">
                    Nenhum alerta aberto.
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
