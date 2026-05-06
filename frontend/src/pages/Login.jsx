import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api.js'

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'

  const [username, setUsername] = useState('mov')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If already logged, go to app.
    let stop = false
    async function go() {
      if (localStorage.getItem('bc_token')) {
        navigate(next)
        return
      }
      try {
        await api.get('/auth/me')
        if (stop) return
        navigate(next)
      } catch {
        // stay on login
      }
    }
    go()
    return () => {
      stop = true
    }
  }, [navigate, next])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await api.post('/auth/login', { username, password })
      localStorage.setItem('bc_token', r.data.token)
      if (r.data?.user?.must_change_password) {
        navigate('/settings')
      } else {
        navigate(next)
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bc-bg text-bc-text">
      <div className="mx-auto flex min-h-screen max-w-[460px] items-center px-6">
        <div className="w-full rounded-card border border-bc-border bg-bc-card p-6 shadow-card">
          <div className="text-[24px] font-bold">Backup Center</div>
          <div className="mt-1 text-[13px] text-bc-text3">Acesso restrito</div>

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Usuario</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
                autoComplete="username"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Senha</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
                autoComplete="current-password"
              />
            </label>
            {error ? <div className="text-[12px] font-semibold text-bc-bad">{error}</div> : null}

            <div className="text-[12px] text-bc-textWeak">Se voce nao tem usuario/senha, solicite ao administrador.</div>

            <button
              type="submit"
              className="h-10 w-full rounded-btn border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] text-[13px] font-semibold text-bc-text hover:bg-[rgba(59,130,246,0.20)] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
