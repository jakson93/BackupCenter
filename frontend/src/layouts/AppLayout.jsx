import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import MobileSidebar from '../components/MobileSidebar.jsx'
import { api } from '../services/api.js'

export default function AppLayout() {
  const [search, setSearch] = useState('')
  const [serverStatus, setServerStatus] = useState(null)
  const [alertsCount, setAlertsCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let stop = false
    async function checkAuth() {
      try {
        const me = await api.get('/auth/me')
        if (stop) return
        setUser(me.data?.user || null)
        if (me.data?.user?.must_change_password && location.pathname !== '/settings') {
          navigate('/settings')
        }
      } catch {
        if (stop) return
        setUser(null)
      }
    }
    checkAuth()
    return () => {
      stop = true
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    let stop = false
    async function tick() {
      try {
        const [srv, alerts] = await Promise.all([
          api.get('/server/status'),
          api.get('/alerts/count?status=open'),
        ])
        if (stop) return
        setServerStatus(srv.data)
        setAlertsCount(Number(alerts.data?.count || 0))
      } catch {
        if (stop) return
        setServerStatus(null)
        setAlertsCount(0)
      }
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => {
      stop = true
      clearInterval(id)
    }
  }, [])

  const ctx = useMemo(() => ({ search, setSearch }), [search])

  return (
    <div className="min-h-screen bg-bc-bg text-bc-text">
      <div className="flex min-h-screen">
        <Sidebar serverStatus={serverStatus} />
        <div className="min-w-0 flex-1">
          <Header
            search={search}
            onSearchChange={setSearch}
            serverStatus={serverStatus}
            alertsCount={alertsCount}
            onOpenMenu={() => setMenuOpen(true)}
          />
          <main className="px-6 py-6">
            <Outlet context={ctx} />
          </main>
        </div>
      </div>
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
