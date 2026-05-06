import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { formatBytes } from '../utils/format.js'
import StorageCard from '../components/StorageCard.jsx'

export default function FtpServer() {
  const [status, setStatus] = useState(null)
  const [folders, setFolders] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const [s, f] = await Promise.all([api.get('/server/status'), api.get('/server/folders')])
    setStatus(s.data)
    setFolders(f.data)
  }

  useEffect(() => {
    load()
  }, [])

  async function doAction(fn) {
    setBusy(true)
    try {
      await fn()
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[22px] font-bold text-bc-text">Servidor FTP</div>
        <div className="mt-1 text-[13px] text-bc-text3">Status do servidor e acoes manuais.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner xl:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-[12px] font-semibold text-bc-textWeak">Nome do servidor</div>
              <div className="mt-1 text-[13px] font-semibold text-bc-text2">{status?.server_name || '-'}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-bc-textWeak">IP</div>
              <div className="mt-1 text-[13px] font-semibold text-bc-text2">{status?.server_ip || '-'}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-bc-textWeak">Sistema operacional</div>
              <div className="mt-1 text-[13px] font-semibold text-bc-text2">{status?.os || '-'}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-bc-textWeak">Pasta raiz dos backups</div>
              <div className="mt-1 break-all text-[13px] font-semibold text-bc-text2">{status?.ftp_root || '-'}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-bc-textWeak">Equipamentos</div>
              <div className="mt-1 text-[13px] font-semibold text-bc-text2">{status?.counts?.equipments ?? '-'}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-bc-textWeak">Backups</div>
              <div className="mt-1 text-[13px] font-semibold text-bc-text2">{status?.counts?.backups ?? '-'}</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-bc-textWeak">Ultima varredura</div>
              <div className="mt-1 text-[13px] font-semibold text-bc-text2">
                {status?.last_scan_at ? new Date(status.last_scan_at).toLocaleString('pt-BR') : '-'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover disabled:opacity-50"
              disabled={busy}
              onClick={() =>
                doAction(() => api.post('/server/test-permission').then((r) => {
                  if (!r.data.ok) throw new Error('Falha de permissao')
                  alert('Permissao OK (leitura/escrita).')
                }))
              }
            >
              Testar permissao de leitura/escrita
            </button>
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover disabled:opacity-50"
              disabled={busy}
              onClick={() => doAction(() => api.post('/server/scan'))}
            >
              Forcar varredura manual
            </button>
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover disabled:opacity-50"
              disabled={busy}
              onClick={() => doAction(() => api.post('/server/recreate-folders'))}
            >
              Recriar pastas ausentes
            </button>
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover disabled:opacity-50"
              disabled={busy}
              onClick={() => doAction(() => load())}
            >
              Atualizar status
            </button>
          </div>
        </div>

        <StorageCard storage={status?.storage} />
      </div>

      <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
        <div className="text-[14px] font-semibold text-bc-text2">Pastas</div>
        <div className="mt-2 text-[12px] text-bc-textWeak">{folders?.root || ''}</div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {folders?.folders?.map((f) => (
            <div key={f.name} className="rounded-table border border-bc-border bg-bc-card2 p-3 shadow-inner">
              <div className="text-[13px] font-semibold text-bc-text">{f.name}/</div>
              <div className="mt-1 text-[12px] text-bc-text3">{formatBytes(f.size_bytes || 0)}</div>
              <div className="mt-1 break-all text-[12px] text-bc-textWeak">{f.abs_path}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
