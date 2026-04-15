import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trash2, Edit3, ArrowLeft, Calendar, Clock, Download, Loader2, ShieldCheck, Zap, Award, User, Crown, Activity, Phone, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { format, parseISO } from 'date-fns'
import * as screenshot from 'modern-screenshot'
import { getStatus } from '../lib/status'
import SecurityDialog from '../components/SecurityDialog'
import RenewalModal from '../components/RenewalModal'
import { logAction } from '../lib/audit'

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [isPinOpen, setIsPinOpen] = useState(false)
  const [isRenewalOpen, setIsRenewalOpen] = useState(false)
  const [payments, setPayments] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const cardRef = useRef()

  const fetchActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('target_member_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActivityLogs(data)
    } catch (err) {
      console.error('Fetch activity error:', err)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data)
    } catch (err) {
      console.error('Fetch payments error:', err)
    }
  }

  const handleRenew = async (updateData) => {
    try {
      // 🔄 Update Member Status
      const { data: updatedMember, error: memberError } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (memberError) throw memberError

      // 💸 Record Payment History
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          member_id: id,
          amount: updateData.fees_paid,
          plan_type: updatedMember.plan_type,
          payment_mode: updateData.payment_mode,
          expiry_date_after_payment: updateData.expiry_date
        }])

      if (paymentError) throw paymentError

      setMember(updatedMember)
      fetchPayments() // Refresh history
      fetchActivity() // Refresh activity log
      logAction('member_renew', { id, name: member.full_name, ...updateData })
    } catch (err) {
      console.error('Renewal error:', err)
      alert("Renewal Engine Failed. Check Database.")
    }
  }

  const downloadIDCard = async () => {
    if (!cardRef.current || !member) return
    setDownloading(true)

    try {
      const dataUrl = await screenshot.domToPng(cardRef.current, {
        scale: 4,
        backgroundColor: '#ffffff',
        width: 640,
        height: 400,
      })

      const link = document.createElement('a')
      link.download = `${member.full_name.replace(/\s+/g, '_')}_BajrangGym_ID.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download error:', err)
      alert("Encryption Engine Busy. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    async function fetchMember() {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setMember(data)
      } catch (err) {
        console.error(err)
        navigate('/members')
      } finally {
        setLoading(false)
      }
    }
    fetchMember()
    fetchPayments()
    fetchActivity()
  }, [id, navigate])

  const handleDeleteTrigger = () => {
    setIsPinOpen(true)
  }

  const deleteMember = async () => {
    try {
      const { error } = await supabase.from('members').delete().eq('id', id)
      if (error) throw error
      navigate('/members')
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-red" size={40} />
    </div>
  )

  if (!member) return <div className="text-center py-20 text-white font-black uppercase italic tracking-[0.3em]">Athlete Not Found</div>

  const status = getStatus(member.expiry_date)
  const StatusIcon = status.icon

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 h-full relative z-10 animate-page">
      {/* 🔴 ACTION HEADER */}
      <div className="mb-10 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] rounded-2xl text-[var(--theme-text-muted)] hover:text-brand-red transition-all hover:scale-105 shadow-xl">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => setIsRenewalOpen(true)}
            className="h-12 px-6 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 hover:bg-amber-500 hover:text-white transition-all hover:scale-105 shadow-xl font-black uppercase text-[10px] tracking-widest"
          >
            <Sparkles size={16} fill="currentColor" /> Renew
          </button>
          <button onClick={() => navigate(`/members/edit/${id}`)} className="w-12 h-12 flex items-center justify-center bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] rounded-2xl text-[var(--theme-text-muted)] hover:text-brand-red transition-all hover:scale-105 shadow-xl">
            <Edit3 size={20} />
          </button>
          <button onClick={handleDeleteTrigger} className="w-12 h-12 flex items-center justify-center bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] rounded-2xl text-rose-500/40 hover:text-rose-500 transition-all hover:scale-105 shadow-xl">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* 🔴 PROFILE CARD */}
      <div className="card overflow-hidden border-[var(--theme-border)] shadow-2xl bg-[var(--theme-surface)]">
        <div className="h-48 bg-gradient-to-br from-[#ff3e3e] to-[#400000] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 shadow-2xl">
            <Crown size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">{member.plan_type} Athlete</span>
          </div>

          <div className="absolute -bottom-1 w-full flex justify-start px-10">
            <div className="w-40 h-40 bg-[var(--theme-surface)] rounded-[2.5rem] border-[6px] border-[var(--theme-bg)] overflow-hidden relative z-10 shadow-2xl flex items-center justify-center ring-1 ring-[var(--theme-border)] transform translate-y-1/3">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-6xl text-zinc-800 uppercase italic bg-zinc-900">
                  {member.full_name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-24 px-10 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-3 text-[var(--theme-text)] drop-shadow-2xl">{member.full_name}</h2>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-lg text-[10px] font-black uppercase text-brand-red tracking-widest leading-none">
                  <Zap size={10} fill="currentColor" /> {member.registration_no || 'Pending ID'}
                </span>
                <span className="text-[var(--theme-text-muted)] text-[10px] font-bold uppercase tracking-widest">{member.phone}</span>
              </div>
            </div>
            <div className={`px-6 py-2.5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl border backdrop-blur-md ${status.class}`}>
              <StatusIcon size={16} strokeWidth={3} /> {status.label}
            </div>
          </div>

          {/* DASHBOARD GRID */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-6 bg-[var(--theme-surface-soft)]/40 border border-[var(--theme-border)] rounded-3xl group hover:border-brand-red/20 transition-all flex flex-col items-center">
              <Calendar size={22} className="mb-3 text-zinc-700 group-hover:text-brand-red transition-colors" />
              <p className="text-[10px] uppercase font-black text-[var(--theme-text-muted)] tracking-widest mb-1.5 opacity-80">Join Date</p>
              <p className="font-black text-[var(--theme-text)] uppercase italic text-xl tracking-tighter">{format(parseISO(member.joining_date), 'dd/MM/yyyy')}</p>
            </div>
            <div className="p-6 bg-[var(--theme-surface-soft)]/40 border border-[var(--theme-border)] rounded-3xl group hover:border-brand-red/20 transition-all flex flex-col items-center">
              <Clock size={22} className="mb-3 text-zinc-700 group-hover:text-amber-500 transition-colors" />
              <p className="text-[10px] uppercase font-black text-[var(--theme-text-muted)] tracking-widest mb-1.5 opacity-80">Expiry Date</p>
              <p className="font-black text-brand-red uppercase italic text-xl tracking-tighter">{format(parseISO(member.expiry_date), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-3xl shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 text-zinc-400 transform group-hover:rotate-12 transition-transform">
                <Activity size={40} />
              </div>
              <p className="text-[10px] uppercase font-black text-zinc-600 mb-2 tracking-widest relative z-10">Fees Contribution</p>
              <p className="text-4xl font-black text-[var(--theme-text)] italic tracking-tighter relative z-10">₹{member.fees_paid || '0'}</p>
            </div>
            <div className="p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-3xl shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 text-zinc-400 transform group-hover:-rotate-12 transition-transform">
                <ShieldCheck size={40} />
              </div>
              <p className="text-[10px] uppercase font-black text-[var(--theme-text-muted)] mb-2 tracking-widest relative z-10">Payment Method</p>
              <p className="text-lg font-black text-brand-red uppercase italic tracking-[0.2em] relative z-10">{member.payment_mode || 'Cash Flow'}</p>
            </div>

            {/* 💸 PAYMENT HISTORY TIMELINE */}
            <div className="col-span-1 md:col-span-2 p-8 bg-[var(--theme-surface-soft)]/80 border border-[var(--theme-border)] rounded-[2.5rem] shadow-2xl relative overflow-hidden group mt-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-base font-black italic uppercase text-[var(--theme-text)] tracking-tighter leading-none mb-1">Financial History</h4>
                  <p className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest leading-none">Subscription Transaction Log</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                  <Activity size={18} />
                </div>
              </div>

              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">No Transaction History Found</p>
                  </div>
                ) : (
                  payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl hover:bg-[var(--theme-surface-soft)] transition-all group/item">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/5">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-[var(--theme-text)] uppercase italic leading-none mb-1">₹{p.amount}</p>
                          <p className="text-[8px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest leading-none">{format(parseISO(p.payment_date), 'dd MMM yyyy')} • {p.payment_mode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-brand-red uppercase tracking-widest leading-none mb-1">{p.plan_type}</p>
                        <p className="text-[7px] font-bold text-zinc-700 uppercase tracking-widest leading-none">Validated Thru {format(parseISO(p.expiry_date_after_payment), 'dd/MM/yy')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 📋 ACTIVITY & LIFECYCLE LOG */}
            <div className="col-span-1 md:col-span-2 p-8 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2.5rem] shadow-2xl relative overflow-hidden group mt-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-base font-black italic uppercase text-[var(--theme-text)] tracking-tighter leading-none mb-1">Activity Tracking</h4>
                  <p className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest leading-none">Automatic Data Change Audit</p>
                </div>
                <div className="w-10 h-10 bg-brand-red/10 text-brand-red rounded-xl flex items-center justify-center">
                  <Activity size={18} />
                </div>
              </div>

              <div className="space-y-4">
                {activityLogs.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">No Activity Logs Found</p>
                  </div>
                ) : (
                  activityLogs.map((log, i) => (
                    <div key={i} className="flex gap-4 group/log border-l-2 border-[var(--theme-surface-soft)] pb-4 last:pb-0 pl-6 ml-2">
                      <div className="relative">
                        <div className="absolute top-0 -left-[31px] w-4 h-4 rounded-full bg-[var(--theme-surface-soft)] border-2 border-[var(--theme-bg)] group-hover/log:bg-brand-red transition-all shadow-[0_0_15px_rgba(255,62,62,0.2)]"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-black text-[var(--theme-text)] uppercase tracking-wider">{log.action_type.replace(/_/g, ' ')}</p>
                          <p className="text-[8px] font-bold text-[var(--theme-text-muted)] uppercase whitespace-nowrap">{format(parseISO(log.created_at), 'dd MMM HH:mm')}</p>
                        </div>
                        <div className="p-3 bg-[var(--theme-surface-soft)]/30 rounded-xl border border-[var(--theme-border)]">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase leading-relaxed italic">
                            {log.action_type === 'AUTO_DATA_CHANGE'
                              ? "Database Record Mutated (Snapshot Captured)"
                              : "Manager Interaction Event Registered"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2rem] shadow-inner relative overflow-hidden group col-span-1 md:col-span-2 flex items-center justify-between mt-4">
              <div>
                <p className="text-[10px] uppercase font-black text-zinc-600 mb-2 tracking-widest leading-none">ID Verification</p>
                <h4 className="text-lg font-black text-[var(--theme-text)] italic uppercase tracking-tighter leading-none mb-2">Scan Digital Key</h4>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest max-w-[140px]">Use this QR to verify entrance at the gym gate.</p>
              </div>
              <div className="p-4 bg-white rounded-[2rem] shadow-2xl transform group-hover:scale-110 transition-transform">
                <QRCodeSVG
                  value={`${window.location.origin}/verify/${id}`}
                  size={120}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={downloadIDCard}
        disabled={downloading}
        className="mt-12 btn-primary w-full py-7 text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-5 disabled:opacity-50 group hover:shadow-[0_20px_50px_rgba(255,62,62,0.3)] transition-all"
      >
        {downloading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} className="group-hover:-translate-y-1 transition-transform" />}
        {downloading ? 'Authenticating & Generating...' : 'Download Official Roster Card'}
      </button>

      {/* 🔴 ELITE ID CARD DESIGN (HIDDEN) */}
      <div className="fixed top-[-9999px] left-[-9999px]">
        <div ref={cardRef} className="w-[640px] h-[440px] bg-white text-black p-0 rounded-[3rem] overflow-hidden flex flex-col relative font-sans shadow-2xl">
          <div className="absolute inset-0 bg-white"></div>

          <div className="h-24 bg-black flex items-center justify-between px-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-lg p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-white font-black italic uppercase tracking-tighter text-2xl leading-none mb-1">Bajrang <span className="text-brand-red">Gym 2.0</span></h1>
                <p className="text-brand-red text-[8px] font-bold uppercase tracking-[0.5em] leading-none">Official Digital Credential</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white opacity-40 mb-1">License Plate</p>
              <p className="text-white font-black italic uppercase text-xs tracking-widest">{member.registration_no || 'BJG-SYS-99'}</p>
            </div>
          </div>

          <div className="p-10 pb-12 flex-1 flex flex-col relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none -rotate-12 translate-y-12">
              <h1 className="text-[120px] font-black uppercase italic tracking-tighter whitespace-nowrap">BAJRANG GYM</h1>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Registered Athlete</p>
                  <h2 className="text-[42px] font-black uppercase italic tracking-tighter leading-tight text-black max-w-[380px] break-words -mt-2">
                    {member.full_name}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2 leading-none">Status Rank</p>
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-brand-red" />
                      <p className="text-base font-black italic tracking-tighter text-black uppercase">{member.plan_type} Athlete</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2 leading-none">Mobile Link</p>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-zinc-600" />
                      <p className="text-base font-black italic tracking-tighter text-black uppercase">{member.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-white p-4 border-2 border-zinc-50 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.1)] relative">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/${id}`}
                    size={140}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-brand-red rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 px-5 py-2 bg-black rounded-2xl text-white text-[9px] font-black uppercase tracking-[0.3em] shadow-lg">
                  Verified Identity
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-zinc-100 flex justify-between items-end pb-2">
              <div className="flex items-center gap-10">
                <div>
                  <p className="text-[7px] font-black uppercase text-zinc-400 mb-1.5">Enrolled</p>
                  <span className="text-[12px] font-black uppercase tracking-widest text-black">{format(parseISO(member.joining_date), 'dd/MM/yyyy')}</span>
                </div>
                <div>
                  <p className="text-[7px] font-black uppercase text-brand-red mb-1.5">Valid Thru</p>
                  <span className="text-[12px] font-black uppercase tracking-widest text-brand-red">{format(parseISO(member.expiry_date), 'dd/MM/yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[8px] font-black uppercase italic tracking-widest text-zinc-300">BAJRANGCORE SYSTEM V2.0</p>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-red"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SecurityDialog
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        onVerified={deleteMember}
        title="Delete Athlete?"
      />

      <RenewalModal
        isOpen={isRenewalOpen}
        onClose={() => setIsRenewalOpen(false)}
        member={member}
        onRenewed={handleRenew}
      />
    </div>
  )
}
