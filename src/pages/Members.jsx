import { useState } from 'react'
import { Search, UserPlus, Phone, Calendar, ArrowUpRight, Filter, Grid, List as ListIcon, ShieldCheck, Clock, AlertCircle, ChevronLeft, ChevronRight, Upload, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { format, parseISO, subDays, startOfMonth, startOfYear } from 'date-fns'
import { getStatus } from '../lib/status'

export default function Members() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [timeFilter, setTimeFilter] = useState('all')
  const [page, setPage] = useState(0)
  const pageSize = 10

  // 🔄 Professional Server-Side Pagination & Filter
  const { data, isLoading, error } = useQuery({
    queryKey: ['members', searchTerm, timeFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*', { count: 'exact' })
        .order('joining_date', { ascending: false, nullsFirst: true })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,registration_no.ilike.%${searchTerm}%`)
      }

      if (timeFilter !== 'all') {
        if (timeFilter === 'today') query = query.gte('joining_date', subDays(new Date(), 1).toISOString().split('T')[0])
        if (timeFilter === 'week') query = query.gte('joining_date', subDays(new Date(), 7).toISOString().split('T')[0])
        if (timeFilter === 'month') query = query.gte('joining_date', startOfMonth(new Date()).toISOString().split('T')[0])
        if (timeFilter === 'year') query = query.gte('joining_date', startOfYear(new Date()).toISOString().split('T')[0])
      }

      const { data, error, count } = await query
      if (error) throw error
      return { members: data || [], total: count || 0 }
    }
  })

  const filteredMembers = data?.members || []
  const totalCount = data?.total || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-8 animate-page pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-3 whitespace-nowrap">
            Athlete <span className="text-brand-red">Directory</span>
          </h1>
          <p className="text-[var(--theme-text-muted)] font-bold uppercase text-xs tracking-[0.3em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
            Total Roster: {totalCount} Athletes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--theme-surface-soft)]/50 p-1 rounded-2xl border border-[var(--theme-border)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-xl' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-xl' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/members/bulk-import"
              className="flex items-center gap-2 px-6 py-3.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-brand-red hover:border-brand-red/30 transition-all"
            >
              <Upload size={16} /> Bulk Upload
            </Link>
            <Link to="/members/add" className="btn-primary flex items-center gap-2 px-8 py-3.5">
              <Plus size={20} className="hover:rotate-90 transition-transform" /> Add Athlete
            </Link>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Roster' },
            { id: 'today', label: 'Joined Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setTimeFilter(f.id); setPage(0); }}
              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === f.id ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-[var(--theme-surface-soft)]/50 border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative group w-full mx-auto">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[var(--theme-text-muted)] group-focus-within:text-brand-red transition-all duration-300 z-10">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder="Quick search by name or contact..."
            className="w-full bg-[var(--theme-surface-soft)]/40 backdrop-blur-md border border-[var(--theme-border)] rounded-2xl py-4 !pl-14 !pr-14 text-[var(--theme-text)] placeholder:text-[var(--theme-text-muted)] focus:outline-none focus:ring-1 focus:ring-brand-red/50 focus:border-brand-red/40 transition-all duration-300 font-medium"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {error && (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center">
          <AlertCircle className="mx-auto mb-4 text-rose-500" size={40} />
          <p className="text-rose-500 font-black uppercase italic tracking-widest">Connection Error: {error.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-[var(--theme-surface-soft)] animate-pulse rounded-3xl border border-[var(--theme-border)]"></div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[var(--theme-text-muted)] font-black uppercase text-[10px] tracking-widest leading-none mb-4 italic">No active athletes found in this sector</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredMembers.map(member => {
                const status = getStatus(member.expiry_date)
                const StatusIcon = status.icon
                return (
                  <div key={member.id} className="card group hover:-translate-y-1 transition-all duration-500 overflow-hidden text-left">
                    <div className="p-5 md:p-6 text-left">
                      <div className="flex items-start justify-between mb-4 md:mb-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--theme-surface)] rounded-2xl border border-[var(--theme-border)] overflow-hidden shadow-inner group-hover:border-brand-red/30 transition-all">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-xl md:text-2xl text-[var(--theme-text-muted)] italic uppercase bg-[var(--theme-surface-soft)]">{member.full_name.charAt(0)}</div>
                          )}
                        </div>
                        <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-sm ${status.class}`}>
                          <StatusIcon size={10} /> {status.label}
                        </div>
                      </div>

                      <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tight text-[var(--theme-text)] mb-0.5 group-hover:text-brand-red transition-colors">{member.full_name}</h3>
                      <p className="text-[var(--theme-text-muted)] font-bold text-[9px] tracking-widest uppercase mb-4 opacity-80 group-hover:opacity-100 transition-opacity">ID: {member.registration_no || 'BG-' + member.id.toString().slice(-4)}</p>

                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-[var(--theme-text-muted)] text-[10px] font-bold text-left">
                          <Phone size={12} className="text-brand-red opacity-40" /> {member.phone}
                        </div>
                        <div className="flex items-center gap-2 text-[var(--theme-text-muted)] text-[10px] font-bold text-left">
                          <Calendar size={12} className="text-brand-red opacity-40" /> Joined: {format(parseISO(member.joining_date || member.created_at), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-[var(--theme-text-muted)] text-[10px] font-bold text-left">
                          <ShieldCheck size={12} className="text-brand-red opacity-40" /> Expires: {format(parseISO(member.expiry_date || new Date().toISOString()), 'dd/MM/yyyy')}
                        </div>
                      </div>

                      <Link
                        to={`/members/${member.id}`}
                        className="flex items-center justify-between w-full p-3.5 bg-[var(--theme-surface-soft)]/50 border border-[var(--theme-border)] rounded-2xl group/btn hover:bg-brand-red transition-all duration-500 shadow-inner"
                      >
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] group-hover/btn:text-white">Profile Details</span>
                        <ArrowUpRight size={16} className="text-brand-red group-hover/btn:text-white transition-all transform group-hover/btn:scale-110" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-12 px-8 py-4 text-[12px] font-black uppercase tracking-[0.15em] text-[var(--theme-text-muted)] border-b border-[var(--theme-border)]">
                <div className="col-span-1">Img</div>
                <div className="col-span-3">Athlete Details</div>
                <div className="col-span-1">Reg ID</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filteredMembers.map(member => {
                const status = getStatus(member.expiry_date)
                return (
                  <div key={member.id} className="flex sm:grid sm:grid-cols-12 items-center gap-4 sm:gap-0 px-4 sm:px-8 py-4 sm:py-5 bg-[var(--theme-surface-soft)]/30 border border-[var(--theme-border)] rounded-2xl hover:bg-[var(--theme-surface-soft)]/50 transition-all group">
                    <div className="sm:col-span-1 flex-shrink-0">
                      <div className="w-10 h-10 bg-[var(--theme-surface)] rounded-xl overflow-hidden border border-[var(--theme-border)]">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-xs text-[var(--theme-text-muted)]">{member.full_name?.[0]}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 sm:col-span-3 text-left">
                      <h4 className="text-sm sm:text-base font-black italic uppercase tracking-tight text-[var(--theme-text)] group-hover:text-brand-red transition-colors leading-tight">{member.full_name}</h4>
                      <p className="text-[8px] sm:text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">{member.plan_type || 'Active'} Athlete</p>
                    </div>
                    <div className="hidden md:block col-span-1 text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">{member.registration_no || '-'}</div>
                    <div className="hidden md:block col-span-2 text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">{format(parseISO(member.joining_date || member.created_at), 'dd/MM/yyyy')}</div>
                    <div className="hidden sm:block col-span-2 text-[10px] font-bold text-[var(--theme-text-muted)]">{member.phone}</div>
                    <div className="col-span-1 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-md border text-[7px] font-black uppercase tracking-widest ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="sm:col-span-2 text-right flex-shrink-0">
                      <Link to={`/members/${member.id}`} className="inline-flex items-center justify-center w-10 h-10 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-white hover:bg-brand-red transition-all">
                        <ArrowUpRight size={18} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 🔄 Classic Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12 pb-10">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-3 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${page === i ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-[var(--theme-surface-soft)]/50 text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-soft)] hover:text-[var(--theme-text)]'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
