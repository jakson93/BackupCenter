import clsx from 'clsx'

const variants = {
  ok: 'border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-bc-ok',
  late: 'border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.12)] text-bc-warn',
  failed: 'border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] text-bc-bad',
  backup_missing: 'border-[rgba(148,163,184,0.28)] bg-[rgba(148,163,184,0.10)] text-bc-text3',
  folder_missing: 'border-[rgba(239,68,68,0.35)] bg-[rgba(245,158,11,0.10)] text-bc-warn',
}

const labels = {
  ok: 'OK',
  late: 'Atrasado',
  failed: 'Falhou',
  backup_missing: 'Sem backup recente',
  folder_missing: 'Pasta nao encontrada',
}

export default function StatusBadge({ status }) {
  const key = variants[status] ? status : 'backup_missing'
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-badge border px-2 py-1 text-[11px] font-bold tracking-wide',
        variants[key]
      )}
    >
      {labels[key]}
    </span>
  )
}
