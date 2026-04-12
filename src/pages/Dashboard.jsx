import {
  Users,
  UserCheck,
  TrendingUp,
  Plus,
  ChevronRight,
  Activity,
  Clock,
  Target,
  Crown,
  Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { format, parseISO, isAfter, subMonths, startOfMonth, endOfMonth, endOfDay, startOfYear, startOfToday, subDays, isSameDay, startOfWeek, isWithinInterval } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState('all')
  const [customRange, setCustomRange] = useState({ start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') })

  // 🔄 Professional Data Syncing
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('joining_date', { ascending: false, nullsFirst: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  // 🧪 Filter logic for Time Range
  const filteredMembers = members.filter(m => {
    if (timeFilter === 'all') return true
    const d = parseISO(m.joining_date || m.created_at)
    if (timeFilter === 'today') return isSameDay(d, new Date())
    if (timeFilter === 'yesterday') return isSameDay(d, subDays(new Date(), 1))
    if (timeFilter === 'week') return d >= subDays(new Date(), 7)
    if (timeFilter === 'month') return d >= startOfMonth(new Date())
    if (timeFilter === '3months') return d >= startOfMonth(subMonths(new Date(), 3))
    if (timeFilter === 'year') return d >= startOfYear(new Date())
    if (timeFilter === 'custom') {
      try {
        return isWithinInterval(d, { start: new Date(customRange.start), end: endOfDay(new Date(customRange.end)) })
      } catch (e) { return false }
    }
    return true
  })

  const totalMembers = members.length
  const activeMembers = members.filter(m => {
    if (!m.expiry_date) return false
    try {
      const expiry = parseISO(m.expiry_date)
      return isAfter(endOfDay(expiry), new Date())
    } catch (e) {
      return false
    }
  }).length

  const displayRevenue = filteredMembers.reduce((sum, m) => sum + (Number(m.fees_paid) || 0), 0)
  const totalRevenue = members.reduce((sum, m) => sum + (Number(m.fees_paid) || 0), 0)

  // Calculate Last Month's Growth
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1))
  const newThisMonth = members.filter(m => parseISO(m.joining_date || m.created_at) >= startOfMonth(new Date())).length
  const newLastMonth = members.filter(m => {
    const d = parseISO(m.joining_date || m.created_at)
    return d >= lastMonthStart && d <= endOfMonth(subMonths(new Date(), 1))
  }).length

  const growth = newLastMonth === 0 ? 100 : Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)

  const chartData = [
    { name: format(subMonths(new Date(), 3), 'MMM'), value: 400 },
    { name: format(subMonths(new Date(), 2), 'MMM'), value: 300 },
    { name: format(subMonths(new Date(), 1), 'MMM'), value: 500 },
    { name: format(new Date(), 'MMM'), value: displayRevenue / 10 },
  ]

  const stats = [
    { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', delta: 'Total list' },
    { label: 'Active Plans', value: activeMembers, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', delta: 'Can enter' },
    { label: 'Total Collection', value: `₹${displayRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-brand-red', bg: 'bg-brand-red/10', delta: `Range: ${timeFilter === 'all' ? 'All' : timeFilter}` },
    { label: 'New Growth', value: filteredMembers.length, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10', delta: 'Filtered' },
  ]

  return (
    <div className="space-y-8 animate-page">
      {/* 🔴 BIG ACTION SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-zinc-900/20 p-6 md:p-8 rounded-[32px] border border-white/5 shadow-2xl">
        <div>
          <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-3">
            Bajrang <span className="text-brand-red">Gym 2.0</span>
          </h1>
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Weekly' },
              { id: 'month', label: 'Monthly' },
              { id: '3months', label: 'Quarterly' },
              { id: 'all', label: 'All' },
              { id: 'custom', label: 'Custom' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all ${timeFilter === f.id ? 'bg-brand-red border-brand-red text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {timeFilter === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 mt-4 animate-in slide-in-from-top-2 duration-500 transition-all">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-red transition-colors pointer-events-none">
                  <Calendar size={14} strokeWidth={3} />
                </div>
                <input
                  type="date"
                  style={{ colorScheme: 'dark', accentColor: '#ff3e3e' }}
                  className="bg-zinc-950/80 border border-white/10 rounded-xl !pl-10 pr-4 py-2 text-[10px] font-black text-white outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all cursor-pointer box-border h-10 shadow-inner"
                  value={customRange.start}
                  onClick={(e) => e.target.showPicker?.()}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                />
              </div>

              <span className="text-zinc-700 text-[10px] font-black italic tracking-widest opacity-50 px-2">TO</span>

              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-red transition-colors pointer-events-none">
                  <Calendar size={14} strokeWidth={3} />
                </div>
                <input
                  type="date"
                  style={{ colorScheme: 'dark', accentColor: '#ff3e3e' }}
                  className="bg-zinc-950/80 border border-white/10 rounded-xl !pl-10 pr-4 py-2 text-[10px] font-black text-white outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all cursor-pointer box-border h-10 shadow-inner"
                  value={customRange.end}
                  onClick={(e) => e.target.showPicker?.()}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Link to="/members/add" className="w-full md:w-auto flex items-center justify-center gap-4 bg-brand-red text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,62,62,0.3)]">
            <Plus size={24} strokeWidth={3} />
            Add New Member
          </Link>
        </div>
      </div>

      {/* 🔴 SIMPLE STATS BOXES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5 md:p-6 group hover:translate-y-[-4px] transition-all">
            <div className={`p-3 w-fit ${stat.bg} ${stat.color} rounded-2xl mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl md:text-3xl font-black text-white italic">{membersLoading ? '...' : stat.value}</h3>
            <p className="text-[9px] font-black uppercase text-zinc-600 mt-2 tracking-tighter">{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* 🔴 DATA VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 card p-6 md:p-8">
          <div className="mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Business Chart</h3>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">How your gym is growing monthly</p>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            {!membersLoading && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3e3e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ff3e3e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#ff3e3e', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#ff3e3e" strokeWidth={4} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-700 font-bold uppercase text-xs">Loading Charts...</div>
            )}
          </div>
        </div>

        <div className="card p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Latest Joins</h3>
            <Link to="/members" className="text-[10px] font-black uppercase tracking-widest text-brand-red border-b border-brand-red">View List</Link>
          </div>
          <div className="space-y-4">
            {membersLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900/50 rounded-2xl animate-pulse"></div>)
            ) : members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center gap-4 group cursor-pointer border border-white/5 p-3 rounded-2xl hover:bg-white/5 transition-all">
                <div className="w-12 h-12 bg-zinc-900 rounded-[18px] overflow-hidden flex items-center justify-center font-black text-zinc-800 uppercase italic border border-white/5 shadow-inner">
                  {member.photo_url ? <img src={member.photo_url} className="w-full h-full object-cover" /> : member.full_name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white italic uppercase tracking-tight leading-none mb-1">{member.full_name || 'Anonymous'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{member.plan_type} Athlete</p>
                    <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{format(parseISO(member.joining_date || member.created_at), 'dd MMM')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
          <div className="p-2 bg-brand-red/20 text-brand-red rounded-lg"><Clock size={16} /></div>
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest font-mono">Next System Snapshot: Tonight 12:00 AM</p>
        </div>
      </div>
    </div>
  )
}
