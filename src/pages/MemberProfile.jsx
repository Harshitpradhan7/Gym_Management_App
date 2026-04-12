import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trash2, Edit3, ArrowLeft, Calendar, Clock, Download, Loader2, ShieldCheck, Zap, Award, User, Crown, Activity, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { format, parseISO } from 'date-fns'
import * as screenshot from 'modern-screenshot'
import { getStatus } from '../lib/status'
import SecurityDialog from '../components/SecurityDialog'

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [isPinOpen, setIsPinOpen] = useState(false)
  const cardRef = useRef()

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
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all hover:scale-105 shadow-xl">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-4">
          <button onClick={() => navigate(`/members/edit/${id}`)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-brand-red transition-all hover:scale-105 shadow-xl">
            <Edit3 size={20} />
          </button>
          <button onClick={handleDeleteTrigger} className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl text-rose-500/40 hover:text-rose-500 transition-all hover:scale-105 shadow-xl">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* 🔴 PROFILE CARD */}
      <div className="card overflow-hidden border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)] bg-zinc-950">
        {/* Cover with Sleek Gradient & Watermark */}
        <div className="h-48 bg-gradient-to-br from-[#ff3e3e] to-[#400000] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

          <div className="absolute top-6 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 shadow-2xl">
            <Crown size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">{member.plan_type} Athlete</span>
          </div>

          <div className="absolute -bottom-1 w-full flex justify-start px-10">
            <div className="w-40 h-40 bg-zinc-950 rounded-[2.5rem] border-[6px] border-[#0a0a0a] overflow-hidden relative z-10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center ring-1 ring-white/5 transform translate-y-1/3">
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
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-3 text-white drop-shadow-2xl">{member.full_name}</h2>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 border border-brand-red/20 rounded-lg text-[10px] font-black uppercase text-brand-red tracking-widest leading-none">
                  <Zap size={10} fill="currentColor" /> {member.registration_no || 'Pending ID'}
                </span>
                <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{member.phone}</span>
              </div>
            </div>
            <div className={`px-6 py-2.5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl border backdrop-blur-md ${status.class}`}>
              <StatusIcon size={16} strokeWidth={3} /> {status.label}
            </div>
          </div>

          {/* DASHBOARD GRID */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl group hover:border-brand-red/20 transition-all flex flex-col items-center">
              <Calendar size={22} className="mb-3 text-zinc-700 group-hover:text-brand-red transition-colors" />
              <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mb-1.5 opacity-50">Join Date</p>
              <p className="font-black text-white uppercase italic text-xl tracking-tighter">{format(parseISO(member.joining_date), 'dd/MM/yyyy')}</p>
            </div>
            <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl group hover:border-brand-red/20 transition-all flex flex-col items-center">
              <Clock size={22} className="mb-3 text-zinc-700 group-hover:text-amber-500 transition-colors" />
              <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mb-1.5 opacity-50">Expiry Date</p>
              <p className="font-black text-brand-red uppercase italic text-xl tracking-tighter">{format(parseISO(member.expiry_date), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 text-zinc-400 transform group-hover:rotate-12 transition-transform">
                <Activity size={40} />
              </div>
              <p className="text-[10px] uppercase font-black text-zinc-600 mb-2 tracking-widest relative z-10">Fees Contribution</p>
              <p className="text-4xl font-black text-white italic tracking-tighter relative z-10">₹{member.fees_paid || '0'}</p>
            </div>
            <div className="p-6 bg-zinc-950 border border-white/5 rounded-3xl shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 text-zinc-400 transform group-hover:-rotate-12 transition-transform">
                <ShieldCheck size={40} />
              </div>
              <p className="text-[10px] uppercase font-black text-zinc-600 mb-2 tracking-widest relative z-10">Payment Method</p>
              <p className="text-lg font-black text-brand-red uppercase italic tracking-[0.2em] relative z-10">{member.payment_mode || 'Cash Flow'}</p>
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
        <div ref={cardRef} className="w-[640px] h-[400px] bg-white text-black p-0 rounded-[3rem] overflow-hidden flex flex-col relative font-sans shadow-2xl">
          <div className="absolute inset-0 bg-white"></div>

          {/* Header Branding */}
          <div className="h-24 bg-black flex items-center justify-between px-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
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

          <div className="p-10 flex-1 flex flex-col relative z-10">
            {/* Background Pattern Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
              <h1 className="text-[120px] font-black uppercase italic tracking-tighter rotate-[-15deg] whitespace-nowrap">BAJRANG GYM</h1>
            </div>

            <div className="flex justify-between items-start h-full">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Registered Athlete</p>
                  <h2 className="text-[48px] font-black uppercase italic tracking-tighter leading-tight text-black max-w-[400px] break-words -mt-2">
                    {member.full_name}
                  </h2>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-10">
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 leading-none">Status Rank</p>
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-brand-red" />
                      <p className="text-lg font-black italic tracking-tighter text-black uppercase">{member.plan_type} Athlete</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 leading-none">Mobile Link</p>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-zinc-600" />
                      <p className="text-lg font-black italic tracking-tighter text-black uppercase">{member.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-white p-4 border-2 border-zinc-50 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.1)] relative">
                  <QRCodeSVG value={member.qr_code_data} size={140} level="H" bgColor="#ffffff" fgColor="#000000" marginSize={0} />
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-brand-red rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 px-5 py-2 bg-black rounded-2xl text-white text-[9px] font-black uppercase tracking-[0.3em] shadow-lg">
                  Verified Identity
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[7px] font-black uppercase text-zinc-400 mb-0.5">Enrolled</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-black">{format(parseISO(member.joining_date), 'dd/MM/yyyy')}</span>
                </div>
                <div>
                  <p className="text-[7px] font-black uppercase text-brand-red mb-0.5">Valid Thru</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">{format(parseISO(member.expiry_date), 'dd/MM/yyyy')}</span>
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
    </div>
  )
}
