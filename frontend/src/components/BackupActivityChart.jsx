import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function BackupActivityChart({ data }) {
  return (
    <div className="rounded-card border border-bc-border bg-bc-card p-4 shadow-inner">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-bc-text2">Atividade de Backups (Últimos 7 dias)</div>
        <button className="flex items-center gap-2 rounded-lg border border-bc-border bg-bc-bg2 px-3 py-1.5 text-[12px] font-medium text-bc-text2 hover:bg-bc-hover">
          Últimos 7 dias
          <span className="text-[10px]">▼</span>
        </button>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || []} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(31,51,77,0.8)" vertical={false} />
            <XAxis dataKey="day" stroke="#64748B" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#0B1628',
                border: '1px solid #1F334D',
                borderRadius: 12,
                color: '#F8FAFC',
              }}
              labelStyle={{ color: '#CBD5E1' }}
            />
            <Legend wrapperStyle={{ color: '#CBD5E1', fontSize: 12 }} />
            <Bar dataKey="success" name="Sucesso" stackId="a" fill="#22C55E" radius={[6, 6, 0, 0]} />
            <Bar dataKey="fail" name="Falha" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
