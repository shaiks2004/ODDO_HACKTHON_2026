import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return <div className="pagination"><span>Showing <strong>{start}–{end}</strong> of <strong>{total}</strong></span><div><button className="page-button" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></button><span className="page-number">{page} <span>of</span> {pages}</span><button className="page-button" aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></button></div></div>
}