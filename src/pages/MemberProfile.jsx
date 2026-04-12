import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trash2, Edit3, ArrowLeft, Phone, Calendar, Clock, Download, CheckCircle, AlertCircle, Loader2, ShieldCheck, Zap, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'
import * as screenshot from 'modern-screenshot'
import { getStatus } from '../lib/status'

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef()

  const downloadIDCard = async () => {
    if (!cardRef.current || !member) return
    setDownloading(true)

    try {
      const dataUrl = await screenshot.domToPng(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        width: 600,
        height: 380,
      })

      const link = document.createElement('a')
      link.download = `${member.full_name}-BajrangGym-VIP.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download error:', err)
      alert("Download failed. Please try again.")
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

  const deleteMember = async () => {
    if (window.confirm(`Are you sure you want to delete ${member.full_name}'s record? This cannot be undone.`)) {
      try {
        const { error } = await supabase.from('members').delete().eq('id', id)
        if (error) throw error
        navigate('/members')
      } catch (err) {
        console.error('Delete error:', err)
      }
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
    <div className="max-w-2xl mx-auto pb-24 px-4 h-full relative z-10">
      {/* 🔴 ACTION HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all hover:border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/members/edit/${id}`)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-brand-red transition-all hover:border-brand-red/20 shadow-lg">
            <Edit3 size={20} />
          </button>
          <button onClick={deleteMember} className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl text-rose-500/50 hover:text-rose-500 transition-all hover:border-rose-500/20 shadow-lg">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* 🔴 PROFILE CARD */}
      <div className="card overflow-hidden border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
        {/* Cover with Glowing Gradient */}
        <div className="h-40 bg-gradient-to-br from-[#ff3e3e] to-[#800000] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,white,transparent)]"></div>
          <div className="absolute top-4 right-6 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <Award size={12} className="text-amber-400" />
            <span className="text-[10px] font-black tracking-widest uppercase text-white">VIP Athlete</span>
          </div>

          <div className="w-36 h-36 bg-zinc-900 rounded-3xl border-[8px] border-[#000000] overflow-hidden relative z-10 shadow-2xl flex items-center justify-center absolute -bottom-18 left-8 ring-1 ring-white/10">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-5xl text-zinc-800 font-black uppercase italic">{member.full_name.charAt(0)}</div>
            )}
          </div>
        </div>

        <div className="mt-20 px-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2 text-white">{member.full_name}</h2>
              <p className="flex items-center gap-2 text-zinc-500 font-bold tracking-widest uppercase text-xs">
                <Zap size={14} className="text-brand-red" />
                {member.registration_no || `ATHLETE-ID: ${member.id.toString().slice(-4)}`}
              </p>
            </div>
            <div className={`px-5 py-2 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg border ${status.class}`}>
              <StatusIcon size={14} /> {status.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-zinc-900/60 border border-white/5 rounded-3xl flex flex-col items-center group hover:border-brand-red/30 transition-all">
              <Calendar size={20} className="mb-3 text-zinc-700 group-hover:text-brand-red transition-colors" />
              <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mb-1">Joined Date</p>
              <p className="font-bold text-white uppercase italic text-lg tracking-tight">{format(parseISO(member.joining_date), 'dd/MM/yyyy')}</p>
            </div>
            <div className="p-5 bg-zinc-900/60 border border-white/5 rounded-3xl flex flex-col items-center group hover:border-brand-red/30 transition-all">
              <Clock size={20} className="mb-3 text-zinc-700 group-hover:text-brand-red transition-colors" />
              <p className="text-[10px] uppercase font-black text-zinc-600 tracking-widest mb-1">Expiry Date</p>
              <p className="font-bold text-brand-red uppercase italic text-lg tracking-tight">{format(parseISO(member.expiry_date), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div className="p-6 bg-zinc-950/80 border border-white/5 rounded-3xl flex items-center justify-around shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-brand-red/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <div className="text-center relative z-10">
              <p className="text-[10px] uppercase font-black text-zinc-600 mb-2 tracking-widest">Fees Contribution</p>
              <p className="text-3xl font-black text-white italic tracking-tighter">₹{member.fees_paid || '0'}</p>
            </div>
            <div className="h-12 w-px bg-white/5"></div>
            <div className="text-center relative z-10">
              <p className="text-[10px] uppercase font-black text-zinc-600 mb-2 tracking-widest">Payment Meta</p>
              <p className="text-sm font-black text-brand-red uppercase italic tracking-[0.2em]">{member.payment_mode || 'Cash Flow'}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={downloadIDCard}
        disabled={downloading}
        className="mt-10 btn-primary w-full py-6 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 disabled:opacity-50 group"
      >
        {downloading ? <Loader2 className="animate-spin text-white" size={24} /> : <Download size={22} className="group-hover:scale-125 transition-transform" />}
        {downloading ? 'Authenticating & Generating...' : 'Download Official VIP Card'}
      </button>

      {/* 🔴 HIDDEN VIP ID CARD DESIGN */}
      <div className="fixed top-[-9999px] left-[-9999px]">
        <div ref={cardRef} className="w-[600px] h-[380px] bg-white text-black p-0 border border-zinc-200 rounded-[2rem] overflow-hidden flex flex-col relative font-sans">

          <div className="absolute inset-0 bg-zinc-50"></div>

          {/* Top Bar Branding */}
          <div className="h-20 bg-black flex items-center justify-between px-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/20">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-white font-black italic uppercase tracking-tighter text-xl leading-none">Bajrang <span className="text-brand-red">Gym 2</span></h1>
            </div>
            <div className="text-white text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Official VIP Credential</div>
          </div>

          <div className="p-8 flex-1 flex flex-col relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff3e3e] mb-1">Athlete Name</p>
                <h2 className="text-[42px] font-black uppercase italic tracking-tighter leading-none text-black mb-6 max-w-[380px] break-words">
                  {member.full_name}
                </h2>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Phone Number</p>
                    <p className="text-xl font-black italic tracking-tighter text-black">{member.phone}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Athlete ID</p>
                    <p className="text-xl font-black italic tracking-tighter text-black">{member.registration_no || 'BJG-' + member.id.toString().slice(-4)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-3 border-2 border-zinc-100 rounded-2xl shadow-xl">
                  <QRCodeSVG value={member.qr_code_data} size={110} level="H" />
                </div>
                <div className="px-4 py-1.5 bg-zinc-950 rounded-full text-white text-[8px] font-black uppercase tracking-[0.3em]">Scannable ID</div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-zinc-100 flex justify-between items-center px-2">
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Join Date: {format(parseISO(member.joining_date), 'dd/MM/yy')}</span>
                <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-red">Valid Until: {format(parseISO(member.expiry_date), 'dd/MM/yy')}</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-200"></div>
                <div className="w-2 h-2 rounded-full bg-zinc-100"></div>
              </div>
            </div>
          </div>

          {/* Decorative Corner */}
          <div className="absolute bottom-[-40px] right-[-40px] w-40 h-40 bg-brand-red rotate-45 opacity-5"></div>
        </div>
      </div>
    </div>
  )
}
