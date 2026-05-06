import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  HardDrive,
  Database,
  Bell,
  Server,
  FileText,
  Settings,
} from 'lucide-react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

const items = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/equipments', label: 'Equipamentos', Icon: HardDrive },
  { to: '/backups', label: 'Backups', Icon: Database },
  { to: '/alerts', label: 'Alertas', Icon: Bell },
  { to: '/server', label: 'Servidor FTP', Icon: Server },
  { to: '/reports', label: 'Relatorios', Icon: FileText },
  { to: '/settings', label: 'Configuracoes', Icon: Settings },
]

export default function Sidebar({ serverStatus }) {
  const uptime = (() => {
    const s = Number(serverStatus?.uptime_seconds)
    if (!Number.isFinite(s) || s <= 0) return null
    const days = Math.floor(s / 86400)
    const hours = Math.floor((s % 86400) / 3600)
    const mins = Math.floor((s % 3600) / 60)
    return `${days} dias, ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  })()

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-bc-border bg-bc-bg2 xl:block">
      <div className="flex h-full flex-col">
        <div className="px-5 py-5">
          <div className="text-[12px] font-semibold tracking-wide text-bc-textWeak">MENU</div>
        </div>

        <nav className="flex-1 px-3">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'mb-2 flex items-center gap-3 rounded-card border px-4 py-3 text-[13px] font-semibold',
                  isActive
                    ? 'border-[rgba(59,130,246,0.35)] bg-[linear-gradient(135deg,rgba(59,130,246,0.35),rgba(37,99,235,0.20))] text-bc-text'
                    : 'border-transparent text-bc-text2 hover:border-bc-border hover:bg-bc-hover'
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4">
          <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-bc-text">Servidor Online</div>
              <div className="h-2 w-2 rounded-full bg-bc-ok" />
            </div>
            <div className="mt-2 text-[12px] text-bc-text3">{serverStatus?.os || 'Ubuntu'}</div>
            <div className="mt-1 text-[12px] text-bc-text3">Uptime: {uptime || '-'}</div>
            <div className="mt-1 text-[12px] text-bc-text3">IP: {serverStatus?.server_ip || '-'}</div>
            <div className="mt-1 text-[12px] text-bc-textWeak">Usuario: backup_admin</div>
            <Link to="/server" className="mt-3 block text-[12px] font-semibold text-bc-info">
              Ver detalhes do servidor
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
