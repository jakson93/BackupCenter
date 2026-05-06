import { Bell, Menu, Server } from 'lucide-react'
import SearchBar from './SearchBar.jsx'

export default function Header({ search, onSearchChange, serverStatus, alertsCount, onOpenMenu }) {
  const online = Boolean(serverStatus)
  return (
    <header className="sticky top-0 z-20 border-b border-bc-border bg-bc-bg/80 backdrop-blur">
      <div className="flex items-center gap-4 px-6 py-4">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-btn border border-bc-border bg-bc-card text-bc-text2 hover:bg-bc-hover xl:hidden"
          onClick={() => onOpenMenu?.()}
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-bc-text">Backup Center</div>
          <div className="text-[12px] text-bc-textWeak">Gerenciador de Backups</div>
        </div>

        <div className="ml-2 hidden max-w-[520px] flex-1 lg:block">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar equipamentos, backups, pastas..."
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-btn border border-bc-border bg-bc-card px-3 py-2 text-[12px] text-bc-text2 md:flex">
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-bc-ok' : 'bg-bc-bad'}`} />
            <span className="font-semibold">Servidor Ubuntu FTP:</span>
            <span className={online ? 'text-bc-ok' : 'text-bc-bad'}>{online ? 'Online' : 'Offline'}</span>
          </div>

          <div className="relative">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-btn border border-bc-border bg-bc-card text-bc-text2 hover:bg-bc-hover"
              title="Notificacoes"
            >
              <Bell className="h-4 w-4" />
            </button>
            {alertsCount ? (
              <div className="absolute -right-1 -top-1 rounded-full bg-bc-bad px-2 py-0.5 text-[11px] font-bold text-white">
                {alertsCount}
              </div>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 rounded-btn border border-bc-border bg-bc-card px-3 py-2 text-[12px] text-bc-text2 lg:flex">
            <Server className="h-4 w-4 text-bc-info" />
            <span className="font-semibold">IP:</span>
            <span className="text-bc-text3">{serverStatus?.server_ip || '-'}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 lg:hidden">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar equipamentos, backups, pastas..."
        />
      </div>
    </header>
  )
}
