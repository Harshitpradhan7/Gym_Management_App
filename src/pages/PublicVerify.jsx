import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, Calendar, Zap, Crown, AlertCircle, Loader2, Award, Activity, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getStatus } from '../lib/status'
import { format, parseISO } from 'date-fns'

export default function PublicVerify() {
    const { id } = useParams()
    const [member, setMember] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPublicProfile() {
            try {
                const { data, error } = await supabase
                    .from('members')
                    .select('full_name, registration_no, plan_type, expiry_date, joining_date, photo_url')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setMember(data)
            } catch (err) {
                console.error('Verification Error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchPublicProfile()
    }, [id])

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-red" size={48} />
        </div>
    )

    if (!member) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-6">
                <XCircle size={48} />
            </div>
            <h1 className="text-2xl font-black uppercase italic text-white mb-2">Invalid Credential</h1>
            <p className="text-zinc-500 text-sm max-w-xs">This QR code does not match any registered athlete in the Bajrang Gym 2.0 database.</p>
        </div>
    )

    const status = getStatus(member.expiry_date)
    const StatusIcon = status.icon

    return (
        <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[40%] bg-brand-red/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-sm relative z-10">
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 p-2 mb-4 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter">Bajrang <span className="text-brand-red">Gym 2.0</span></h1>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Official Athlete Verification</p>
                </div>

                {/* Verification Card */}
                <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)]">
                    <div className="h-32 bg-gradient-to-br from-[#ff3e3e] to-[#400000] relative">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    </div>

                    <div className="px-8 pb-10">
                        {/* Photo Avatar */}
                        <div className="flex justify-center -mt-16 mb-6">
                            <div className="w-32 h-32 rounded-[2rem] bg-zinc-950 border-[6px] border-[#0a0a0a] overflow-hidden shadow-2xl ring-1 ring-white/5">
                                {member.photo_url ? (
                                    <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-5xl text-zinc-800 bg-zinc-900 italic">
                                        {member.full_name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <ShieldCheck size={18} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified Member</span>
                            </div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{member.full_name}</h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">{member.registration_no}</p>
                        </div>

                        {/* Status Grid */}
                        <div className={`p-6 rounded-3xl border mb-6 flex flex-col items-center gap-3 backdrop-blur-md transition-all ${status.class} bg-white/5`}>
                            <StatusIcon size={24} strokeWidth={3} />
                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">{status.label}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-center">
                                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Join Date</p>
                                <p className="text-xs font-black text-white">{format(parseISO(member.joining_date), 'dd/MM/yyyy')}</p>
                            </div>
                            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-center">
                                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1 text-brand-red/60">Expiry</p>
                                <p className="text-xs font-black text-brand-red">{format(parseISO(member.expiry_date), 'dd/MM/yyyy')}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-3">
                            <Award size={16} className="text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{member.plan_type} Athlete Rank</span>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.5em] mb-4">BajrangCore Verification Engine V2.0</p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-8 bg-white/10"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-red"></div>
                        <div className="h-[1px] w-8 bg-white/10"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
