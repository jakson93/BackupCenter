export function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (!Number.isFinite(b) || b <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(b) / Math.log(1024)))
  const v = b / 1024 ** i
  const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2
  const num = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v)
  return `${num} ${units[i]}`
}

export function formatNumber(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return String(n ?? '')
  return new Intl.NumberFormat('pt-BR').format(v)
}

export function formatRelativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const t = d.getTime()
  if (Number.isNaN(t)) return ''

  const diffSec = Math.floor((Date.now() - t) / 1000)
  if (diffSec < 0) return 'agora'

  if (diffSec < 10) return 'agora'
  if (diffSec < 60) return `ha ${diffSec} s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `ha ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `ha ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  return `ha ${diffD} dias`
}
