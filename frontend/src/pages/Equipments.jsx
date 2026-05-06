import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatBytes } from '../utils/format.js'

function emptyForm() {
  return {
    name: '',
    hostname: '',
    ip_address: '',
    type: 'Router',
    vendor: 'Outro',
    model: '',
    expected_frequency_hours: 24,
    ftp_folder: '',
    notes: '',
    enabled: true,
  }
}

export default function Equipments() {
  const { search } = useOutletContext()
  const [params] = useSearchParams()
  const editId = params.get('edit') ? Number(params.get('edit')) : null

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/equipments')
      setRows(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!editId) return
    const row = rows.find((r) => r.id === editId)
    if (!row) return
    onEdit(row)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, rows])

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      return (
        String(r.name || '').toLowerCase().includes(q) ||
        String(r.ip_address || '').toLowerCase().includes(q) ||
        String(r.ftp_folder || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  function onNew() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function onEdit(row) {
    setEditing(row)
    setForm({
      name: row.name || '',
      hostname: row.hostname || '',
      ip_address: row.ip_address || '',
      type: row.type || 'Router',
      vendor: row.vendor || 'Outro',
      model: row.model || '',
      expected_frequency_hours: row.expected_frequency_hours || 24,
      ftp_folder: row.ftp_folder || '',
      notes: row.notes || '',
      enabled: Boolean(row.enabled),
    })
    setModalOpen(true)
  }

  async function onSubmit(e) {
    e.preventDefault()
    const payload = {
      ...form,
      expected_frequency_hours: Number(form.expected_frequency_hours),
    }
    if (editing) {
      await api.put(`/equipments/${editing.id}`, payload)
    } else {
      await api.post('/equipments', payload)
    }
    setModalOpen(false)
    await load()
  }

  async function onDelete(row) {
    if (!confirm(`Excluir equipamento "${row.name}"?`)) return
    await api.delete(`/equipments/${row.id}`)
    await load()
  }

  async function onRecreateFolder(row) {
    await api.post(`/equipments/${row.id}/recreate-folder`)
    await load()
  }

  async function onScan(row) {
    await api.post(`/equipments/${row.id}/scan`)
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[22px] font-bold text-bc-text">Equipamentos</div>
          <div className="mt-1 text-[13px] text-bc-text3">Cadastro, edicao e monitoramento.</div>
        </div>
        <button
          type="button"
          className="h-10 rounded-btn border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(59,130,246,0.20)]"
          onClick={onNew}
        >
          Cadastrar equipamento
        </button>
      </div>

      <div className="rounded-card border border-bc-border bg-bc-card shadow-inner">
        <div className="overflow-x-auto bc-scrollbar">
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[12px] font-semibold text-bc-textWeak">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pasta FTP</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const stats = r.stats
                return (
                  <tr key={r.id} className="border-t border-bc-border/80">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold text-bc-text">{r.name}</div>
                      <div className="text-[12px] text-bc-textWeak">{r.vendor || ''} {r.model || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-bc-text2">{r.ip_address || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={stats?.status || 'backup_missing'} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-bc-text2 font-mono">{r.resolved_path}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-bc-text2">
                      {formatBytes(stats?.folder_size_bytes || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                          onClick={() => onScan(r)}
                        >
                          Varredura
                        </button>
                        <button
                          type="button"
                          className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                          onClick={() => onRecreateFolder(r)}
                        >
                          Recriar pasta
                        </button>
                        <button
                          type="button"
                          className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                          onClick={() => onEdit(r)}
                        >
                          Editar
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
                )
              })}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-bc-text3">
                    {loading ? 'Carregando...' : 'Nenhum equipamento encontrado.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar equipamento' : 'Cadastrar equipamento'}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-bg2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              form="equipment-form"
              type="submit"
              className="h-10 rounded-btn border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(34,197,94,0.20)]"
            >
              Salvar
            </button>
          </div>
        }
      >
        <form id="equipment-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="md:col-span-2">
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Nome do equipamento</div>
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text focus:outline-none focus:ring-2 focus:ring-[rgba(59,130,246,0.30)]"
              required
            />
          </label>

          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Hostname</div>
            <input
              value={form.hostname}
              onChange={(e) => setForm((s) => ({ ...s, hostname: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>
          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">IP</div>
            <input
              value={form.ip_address}
              onChange={(e) => setForm((s) => ({ ...s, ip_address: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>

          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Tipo</div>
            <select
              value={form.type}
              onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            >
              {['Router', 'Switch', 'OLT', 'Firewall', 'AP', 'Servidor', 'Outro'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Fabricante</div>
            <select
              value={form.vendor}
              onChange={(e) => setForm((s) => ({ ...s, vendor: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            >
              {['Huawei', 'MikroTik', 'ZTE', 'Cisco', 'Intelbras', 'Juniper', 'Outro'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Modelo</div>
            <input
              value={form.model}
              onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>

          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Frequencia esperada (horas)</div>
            <input
              type="number"
              value={form.expected_frequency_hours}
              onChange={(e) => setForm((s) => ({ ...s, expected_frequency_hours: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              min={1}
            />
          </label>

          <label className="md:col-span-2">
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Pasta FTP (opcional)</div>
            <input
              value={form.ftp_folder}
              onChange={(e) => setForm((s) => ({ ...s, ftp_folder: e.target.value }))}
              placeholder="Ex: olt-huawei-01 (se vazio, o sistema gera automaticamente)"
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>

          <label className="md:col-span-2">
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Observacoes</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
              className="min-h-[90px] w-full rounded-input border border-bc-border bg-bc-bg2 px-3 py-2 text-[13px] text-bc-text"
            />
          </label>

          <label className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <div className="text-[13px] text-bc-text2">Ativo</div>
          </label>
        </form>
      </Modal>
    </div>
  )
}
