import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <label className="relative block w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bc-textWeak" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-input border border-bc-border bg-bc-bg2 pl-9 pr-3 text-[14px] text-bc-text placeholder:text-bc-textWeak focus:outline-none focus:ring-2 focus:ring-[rgba(59,130,246,0.30)]"
      />
    </label>
  )
}
