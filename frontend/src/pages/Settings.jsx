import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import Modal from '../components/Modal.jsx'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const [runtime, setRuntime] = useState(null)
  const [auth, setAuth] = useState(null)

  const [users, setUsers] = useState([])
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user', enabled: true })
  const [resetUser, setResetUser] = useState(null)
  const [resetPassword, setResetPassword] = useState('')

  const [cfg, setCfg] = useState({
    SCAN_INTERVAL_SECONDS: 60,
    DEFAULT_BACKUP_FREQUENCY_HOURS: 24,
    STORAGE_WARNING_PERCENT: 80,
    STORAGE_CRITICAL_PERCENT: 90,
    SERVER_NAME: '',
    SERVER_IP: '',
    FTP_BACKUP_ROOT: '',
  })

  const [pw, setPw] = useState({
    current_password: '',
    new_password: '',
    confirm: '',
    new_username: '',
  })

  async function load() {
    setLoading(true)
    setErr('')
    setMsg('')
    try {
      const r = await api.get('/settings')
      setRuntime(r.data.runtime)
      setAuth(r.data.auth)
      setCfg({
        SCAN_INTERVAL_SECONDS: r.data.runtime.SCAN_INTERVAL_SECONDS,
        DEFAULT_BACKUP_FREQUENCY_HOURS: r.data.runtime.DEFAULT_BACKUP_FREQUENCY_HOURS,
        STORAGE_WARNING_PERCENT: r.data.runtime.STORAGE_WARNING_PERCENT,
        STORAGE_CRITICAL_PERCENT: r.data.runtime.STORAGE_CRITICAL_PERCENT,
        SERVER_NAME: r.data.runtime.SERVER_NAME,
        SERVER_IP: r.data.runtime.SERVER_IP,
        FTP_BACKUP_ROOT: r.data.runtime.FTP_BACKUP_ROOT,
      })
      setPw((s) => ({ ...s, new_username: r.data.auth.username }))

      if (r.data.auth?.role === 'master') {
        try {
          const u = await api.get('/users')
          setUsers(u.data || [])
        } catch {
          setUsers([])
        }
      } else {
        setUsers([])
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Falha ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onSaveConfig() {
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      if (Number(cfg.STORAGE_WARNING_PERCENT) >= Number(cfg.STORAGE_CRITICAL_PERCENT)) {
        setErr('storage_warning_percent deve ser menor que storage_critical_percent')
        return
      }
      await api.put('/settings', {
        SCAN_INTERVAL_SECONDS: Number(cfg.SCAN_INTERVAL_SECONDS),
        DEFAULT_BACKUP_FREQUENCY_HOURS: Number(cfg.DEFAULT_BACKUP_FREQUENCY_HOURS),
        STORAGE_WARNING_PERCENT: Number(cfg.STORAGE_WARNING_PERCENT),
        STORAGE_CRITICAL_PERCENT: Number(cfg.STORAGE_CRITICAL_PERCENT),
        SERVER_NAME: cfg.SERVER_NAME,
        SERVER_IP: cfg.SERVER_IP,
        FTP_BACKUP_ROOT: cfg.FTP_BACKUP_ROOT,
      })
      setMsg('Configuracoes salvas.')
      await load()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function onChangePassword(e) {
    e.preventDefault()
    setErr('')
    setMsg('')

    if (!pw.new_password || pw.new_password.length < 8) {
      setErr('A nova senha deve ter no minimo 8 caracteres')
      return
    }
    if (pw.new_password !== pw.confirm) {
      setErr('Confirmacao de senha nao confere')
      return
    }

    setSaving(true)
    try {
      const r = await api.post('/auth/change-password', {
        current_password: pw.current_password || undefined,
        new_password: pw.new_password,
        new_username: pw.new_username || undefined,
      })
      if (r.data?.token) localStorage.setItem('bc_token', r.data.token)
      setPw({ current_password: '', new_password: '', confirm: '', new_username: pw.new_username })
      setMsg('Senha atualizada com sucesso.')
      await load()
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Falha ao trocar senha')
    } finally {
      setSaving(false)
    }
  }

  async function onLogout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('bc_token')
      window.location.href = '/login'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[22px] font-bold text-bc-text">Configuracoes</div>
          <div className="mt-1 text-[13px] text-bc-text3">Parametros do sistema e seguranca.</div>
        </div>
        <button
          type="button"
          className="h-10 rounded-btn border border-bc-border bg-bc-card2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover"
          onClick={onLogout}
        >
          Sair
        </button>
      </div>

      {auth?.must_change_password ? (
        <div className="rounded-card border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.10)] p-4 text-[13px] text-bc-text2">
          Troca de senha obrigatoria no primeiro acesso.
        </div>
      ) : null}

      {err ? <div className="text-[13px] font-semibold text-bc-bad">{err}</div> : null}
      {msg ? <div className="text-[13px] font-semibold text-bc-ok">{msg}</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-card border border-bc-border bg-bc-card p-5 shadow-inner">
          <div className="text-[14px] font-semibold text-bc-text2">Sistema</div>
          <div className="mt-1 text-[12px] text-bc-textWeak">Algumas mudancas entram em vigor imediatamente.</div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">SCAN_INTERVAL_SECONDS</div>
              <input
                type="number"
                min={5}
                value={cfg.SCAN_INTERVAL_SECONDS}
                onChange={(e) => setCfg((s) => ({ ...s, SCAN_INTERVAL_SECONDS: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">DEFAULT_BACKUP_FREQUENCY_HOURS</div>
              <input
                type="number"
                min={1}
                value={cfg.DEFAULT_BACKUP_FREQUENCY_HOURS}
                onChange={(e) => setCfg((s) => ({ ...s, DEFAULT_BACKUP_FREQUENCY_HOURS: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">STORAGE_WARNING_PERCENT</div>
              <input
                type="number"
                min={1}
                max={99}
                value={cfg.STORAGE_WARNING_PERCENT}
                onChange={(e) => setCfg((s) => ({ ...s, STORAGE_WARNING_PERCENT: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">STORAGE_CRITICAL_PERCENT</div>
              <input
                type="number"
                min={1}
                max={100}
                value={cfg.STORAGE_CRITICAL_PERCENT}
                onChange={(e) => setCfg((s) => ({ ...s, STORAGE_CRITICAL_PERCENT: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
            <label className="md:col-span-2">
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">SERVER_NAME</div>
              <input
                value={cfg.SERVER_NAME}
                onChange={(e) => setCfg((s) => ({ ...s, SERVER_NAME: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
            <label className="md:col-span-2">
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">SERVER_IP</div>
              <input
                value={cfg.SERVER_IP}
                onChange={(e) => setCfg((s) => ({ ...s, SERVER_IP: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
            <label className="md:col-span-2">
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">FTP_BACKUP_ROOT (Diretorio Raiz)</div>
              <input
                value={cfg.FTP_BACKUP_ROOT}
                onChange={(e) => setCfg((s) => ({ ...s, FTP_BACKUP_ROOT: e.target.value }))}
                placeholder="/srv/ftp/backups"
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="h-10 rounded-btn border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(34,197,94,0.20)] disabled:opacity-50"
              onClick={onSaveConfig}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar configuracoes'}
            </button>
          </div>

          <div className="mt-4 rounded-table border border-bc-border bg-bc-bg2 p-3 text-[12px] text-bc-text3">
            FTP_BACKUP_ROOT: <span className="text-bc-text2">{runtime?.FTP_BACKUP_ROOT || '-'}</span>
            <br />
            DATABASE_PATH: <span className="text-bc-text2">{runtime?.DATABASE_PATH || '-'}</span>
          </div>
        </div>

        <div className="rounded-card border border-bc-border bg-bc-card p-5 shadow-inner">
          <div className="text-[14px] font-semibold text-bc-text2">Seguranca</div>
          <div className="mt-1 text-[12px] text-bc-textWeak">Troca de senha do usuario logado.</div>

          <form onSubmit={onChangePassword} className="mt-4 grid grid-cols-1 gap-3">
            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Usuario</div>
              <input
                value={pw.new_username}
                onChange={(e) => setPw((s) => ({ ...s, new_username: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>

            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Senha atual</div>
              <input
                type="password"
                value={pw.current_password}
                onChange={(e) => setPw((s) => ({ ...s, current_password: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>

            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Nova senha</div>
              <input
                type="password"
                value={pw.new_password}
                onChange={(e) => setPw((s) => ({ ...s, new_password: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>
            <label>
              <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Confirmar nova senha</div>
              <input
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))}
                className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
              />
            </label>

            <button
              type="submit"
              className="h-10 rounded-btn border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(59,130,246,0.20)] disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        </div>
      </div>

      {auth?.role === 'master' ? (
        <div className="rounded-card border border-bc-border bg-bc-card p-5 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[14px] font-semibold text-bc-text2">Usuarios</div>
              <div className="mt-1 text-[12px] text-bc-textWeak">Criar e administrar usuarios do painel.</div>
            </div>
            <button
              type="button"
              className="h-10 rounded-btn border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(59,130,246,0.20)]"
              onClick={() => {
                setNewUser({ username: '', password: '', role: 'user', enabled: true })
                setUserModalOpen(true)
              }}
            >
              Novo usuario
            </button>
          </div>

          <div className="mt-4 overflow-x-auto bc-scrollbar">
            <table className="w-full min-w-[880px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[12px] font-semibold text-bc-textWeak">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Ativo</th>
                  <th className="px-4 py-3">Ultimo login</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-bc-border/80">
                    <td className="px-4 py-3 text-[13px] font-semibold text-bc-text">{u.username}</td>
                    <td className="px-4 py-3 text-[13px] text-bc-text2">{u.role}</td>
                    <td className="px-4 py-3 text-[13px] text-bc-text2">{u.enabled ? 'Sim' : 'Nao'}</td>
                    <td className="px-4 py-3 text-[13px] text-bc-text2">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                          onClick={async () => {
                            await api.put(`/users/${u.id}`, { enabled: !u.enabled })
                            await load()
                          }}
                        >
                          {u.enabled ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          className="h-9 rounded-btn border border-bc-border bg-bc-card2 px-3 text-[12px] font-semibold text-bc-text2 hover:bg-bc-hover"
                          onClick={() => {
                            setResetUser(u)
                            setResetPassword('')
                          }}
                        >
                          Reset senha
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[13px] text-bc-text3">
                      Nenhum usuario.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Modal
        open={userModalOpen}
        title="Criar novo usuario"
        onClose={() => setUserModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-bg2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover"
              onClick={() => setUserModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="h-10 rounded-btn border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(34,197,94,0.20)]"
              onClick={async () => {
                setErr('')
                setMsg('')
                try {
                  await api.post('/users', newUser)
                  setUserModalOpen(false)
                  setMsg('Usuario criado.')
                  await load()
                } catch (e) {
                  setErr(e?.response?.data?.error || 'Falha ao criar usuario')
                }
              }}
            >
              Criar
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="md:col-span-2">
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Usuario</div>
            <input
              value={newUser.username}
              onChange={(e) => setNewUser((s) => ({ ...s, username: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>
          <label className="md:col-span-2">
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Senha (min 8)</div>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            />
          </label>
          <label>
            <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Role</div>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}
              className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
            >
              <option value="user">user</option>
              <option value="master">master</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newUser.enabled}
              onChange={(e) => setNewUser((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <div className="text-[13px] text-bc-text2">Ativo</div>
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(resetUser)}
        title={resetUser ? `Reset senha: ${resetUser.username}` : 'Reset senha'}
        onClose={() => setResetUser(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="h-10 rounded-btn border border-bc-border bg-bc-bg2 px-4 text-[13px] font-semibold text-bc-text2 hover:bg-bc-hover"
              onClick={() => setResetUser(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="h-10 rounded-btn border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.14)] px-4 text-[13px] font-semibold text-bc-text hover:bg-[rgba(245,158,11,0.20)]"
              onClick={async () => {
                setErr('')
                setMsg('')
                try {
                  if (!resetPassword || resetPassword.length < 8) {
                    setErr('A senha deve ter no minimo 8 caracteres')
                    return
                  }
                  await api.put(`/users/${resetUser.id}`, { password: resetPassword })
                  setResetUser(null)
                  setMsg('Senha resetada.')
                  await load()
                } catch (e) {
                  setErr(e?.response?.data?.error || 'Falha ao resetar senha')
                }
              }}
            >
              Reset
            </button>
          </div>
        }
      >
        <label className="block">
          <div className="mb-1 text-[12px] font-semibold text-bc-textWeak">Nova senha (min 8)</div>
          <input
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 px-3 text-[13px] text-bc-text"
          />
        </label>
      </Modal>

      {loading ? <div className="text-[13px] text-bc-text3">Carregando...</div> : null}
    </div>
  )
}
