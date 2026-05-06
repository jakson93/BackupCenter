import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  HardDrive,
  Database,
  Bell,
  Server,
  FileText,
  Settings,
  X,
} from 'lucide-react'
import clsx from 'clsx'

const items = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/equipments', label: 'Equipamentos', Icon: HardDrive },
  { to: '/backups', label: 'Backups', Icon: Database },
  { to: '/alerts', label: 'Alertas', Icon: Bell },
  { to: '/server', label: 'Servidor FTP', Icon: Server },
  { to: '/reports', label: 'Relatorios', Icon: FileText },
  { to: '/settings', label: 'Configuracoes', Icon: Settings },
]

export default function MobileSidebar({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 xl:hidden">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Fechar" />
      <div className="absolute left-0 top-0 h-full w-[320px] border-r border-bc-border bg-bc-bg2">
        <div className="flex items-center justify-between border-b border-bc-border px-4 py-4">
          <div className="text-[14px] font-semibold text-bc-text">Backup Center</div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-btn border border-bc-border bg-bc-card text-bc-text2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="p-3">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
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
      </div>
    </div>
  )
}
