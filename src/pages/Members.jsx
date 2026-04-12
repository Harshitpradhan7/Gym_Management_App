import { useState } from 'react'
import { Search, UserPlus, Phone, Calendar, ArrowUpRight, Filter, Grid, List as ListIcon, ShieldCheck, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
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
          <p className="text-zinc-500 font-bold uppercase text-xs tracking-[0.3em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
            Total Roster: {totalCount} Athletes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
          <Link to="/members/add" className="btn-primary flex items-center gap-2 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-red/20 group">
            <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> Add Athlete
          </Link>
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
              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === f.id ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative group w-full mx-auto">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-brand-red transition-all duration-300 z-10">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder="Quick search by name or contact..."
            className="w-full bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl py-4 !pl-14 !pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red/50 focus:border-brand-red/40 transition-all duration-300 font-medium"
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
            <div key={i} className="h-48 bg-zinc-900/40 animate-pulse rounded-3xl border border-white/5"></div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-600 font-black uppercase italic tracking-[0.3em] text-xs">No Athletes Found</p>
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
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden shadow-inner group-hover:border-brand-red/30 transition-all">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-xl md:text-2xl text-zinc-800 italic uppercase bg-zinc-950">{member.full_name.charAt(0)}</div>
                          )}
                        </div>
                        <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-sm ${status.class}`}>
                          <StatusIcon size={10} /> {status.label}
                        </div>
                      </div>

                      <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tight text-white mb-0.5 group-hover:text-brand-red transition-colors">{member.full_name}</h3>
                      <p className="text-zinc-600 font-bold text-[9px] tracking-widest uppercase mb-4 opacity-80 group-hover:opacity-100 transition-opacity">ID: {member.registration_no || 'BG-' + member.id.toString().slice(-4)}</p>

                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold text-left">
                          <Phone size={12} className="text-brand-red opacity-40" /> {member.phone}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold text-left">
                          <Calendar size={12} className="text-brand-red opacity-40" /> Joined: {format(parseISO(member.joining_date || member.created_at), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold text-left">
                          <ShieldCheck size={12} className="text-brand-red opacity-40" /> Expires: {format(parseISO(member.expiry_date || new Date().toISOString()), 'dd/MM/yyyy')}
                        </div>
                      </div>

                      <Link
                        to={`/members/${member.id}`}
                        className="flex items-center justify-between w-full p-3.5 bg-zinc-900/50 border border-white/5 rounded-2xl group/btn hover:bg-brand-red transition-all duration-500 shadow-inner"
                      >
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover/btn:text-white">Profile Details</span>
                        <ArrowUpRight size={16} className="text-brand-red group-hover/btn:text-white transition-all transform group-hover/btn:scale-110" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-12 px-8 py-4 text-[12px] font-black uppercase tracking-[0.15em] text-zinc-400 border-b border-white/10">
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
                  <div key={member.id} className="flex sm:grid sm:grid-cols-12 items-center gap-4 sm:gap-0 px-4 sm:px-8 py-4 sm:py-5 bg-zinc-900/30 border border-white/5 rounded-2xl hover:bg-zinc-900/50 transition-all group">
                    <div className="sm:col-span-1 flex-shrink-0">
                      <div className="w-10 h-10 bg-zinc-950 rounded-xl overflow-hidden border border-white/5">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-xs text-zinc-800">{member.full_name?.[0]}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 sm:col-span-3 text-left">
                      <h4 className="text-sm sm:text-base font-black italic uppercase tracking-tight text-white group-hover:text-brand-red transition-colors leading-tight">{member.full_name}</h4>
                      <p className="text-[8px] sm:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{member.plan_type || 'Active'} Athlete</p>
                    </div>
                    <div className="hidden md:block col-span-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{member.registration_no || '-'}</div>
                    <div className="hidden md:block col-span-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{format(parseISO(member.joining_date || member.created_at), 'dd/MM/yyyy')}</div>
                    <div className="hidden sm:block col-span-2 text-[10px] font-bold text-zinc-400">{member.phone}</div>
                    <div className="col-span-1 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-md border text-[7px] font-black uppercase tracking-widest ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="sm:col-span-2 text-right flex-shrink-0">
                      <Link to={`/members/${member.id}`} className="inline-flex items-center justify-center w-10 h-10 bg-zinc-950 rounded-xl border border-white/5 text-zinc-500 hover:text-white hover:bg-brand-red transition-all">
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
                className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${page === i ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-zinc-900/50 text-zinc-600 hover:text-white'}`}
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
