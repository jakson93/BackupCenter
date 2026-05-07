import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Database, CalendarCheck2, AlertTriangle, PieChart } from 'lucide-react'
import MetricCard from '../components/MetricCard.jsx'
import EquipmentTable from '../components/EquipmentTable.jsx'
import AlertPanel from '../components/AlertPanel.jsx'
import FtpFolderTree from '../components/FtpFolderTree.jsx'

import { api } from '../services/api.js'
import { formatBytes, formatNumber, formatRelativeTime } from '../utils/format.js'

function lastBackupLabel(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return sameDay ? `Hoje, ${time}` : d.toLocaleString('pt-BR')
}

export default function Dashboard() {
  const { search } = useOutletContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/dashboard')
      setData(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  const equipments = useMemo(() => {
    const rows = data?.equipments || []
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      return (
        String(r.name || '').toLowerCase().includes(q) ||
        String(r.ip_address || '').toLowerCase().includes(q) ||
        String(r.ftp_folder || '').toLowerCase().includes(q)
      )
    })
  }, [data, search])

  const metrics = data?.metrics
  const storage = metrics?.storage

  const onEquipmentAction = async (action, row) => {
    if (action === 'scan') {
      await api.post(`/equipments/${row.id}/scan`)
      await load()
      return
    }
    if (action === 'delete') {
      if (!confirm(`Excluir equipamento "${row.name}"?`)) return
      await api.delete(`/equipments/${row.id}`)
      await load()
      return
    }
    if (action === 'open-folder') {
      alert('Abertura de pasta via web depende do ambiente. Use a tela Servidor FTP para visualizar pastas.')
      return
    }
    if (action === 'history') {
      window.location.href = `/backups?equipment_id=${row.id}`
      return
    }
    if (action === 'edit') {
      window.location.href = `/equipments?edit=${row.id}`
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Backups ativos"
          value={formatNumber(metrics?.activeBackups || 0)}
          icon={Database}
          variant="blue"
        />
        <MetricCard
          title="Ultimo backup realizado"
          value={metrics?.lastBackup?.receivedAt ? formatRelativeTime(metrics.lastBackup.receivedAt) : 'Sem dados'}
          subtitle={metrics?.lastBackup?.equipment ? `${metrics.lastBackup.equipment} ${lastBackupLabel(metrics.lastBackup.receivedAt)}` : ''}
          icon={CalendarCheck2}
          variant="green"
        />
        <MetricCard
          title="Equipamentos com alerta"
          value={formatNumber(metrics?.alertEquipments || 0)}
          subtitle="Atencao necessaria"
          icon={AlertTriangle}
          variant="orange"
        />
        <MetricCard
          title="Armazenamento usado"
          value={storage ? formatBytes(storage.used) : 'Sem dados'}
          subtitle={storage ? `de ${formatBytes(storage.total)} (${storage.percent}%)` : ''}
          icon={PieChart}
          variant="purple"
          progress={storage?.percent || 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-2">
          <EquipmentTable rows={equipments} onAction={onEquipmentAction} />
          <button className="self-start text-[13px] font-semibold text-bc-info hover:underline">
            Ver todos os equipamentos ({data?.metrics?.activeBackups || 0})
          </button>
        </div>
        <AlertPanel alerts={data?.alerts || []} />
      </div>

      <FtpFolderTree
        rootLabel="/backups"
        folders={data?.folders?.items || []}
        storage={storage}
      />

      {loading ? <div className="text-[13px] text-bc-text3">Carregando...</div> : null}
    </div>
  )
}
