import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Calendar, Phone, Image as ImageIcon, ArrowLeft, Loader2, Upload, BadgeAlert, Coins, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logAction } from '../lib/audit'
import { addMonths, format, parseISO } from 'date-fns'

// 🛡️ Bulletproof Validation Schema
const memberSchema = z.object({
  full_name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  photo_url: z.string().optional().nullable(),
  plan_type: z.enum(['Monthly', 'Quarterly', 'Half Yearly', 'Annual']),
  joining_date: z.string(),
  fees_paid: z.string().transform((val) => Number(val)).refine((n) => n >= 0, 'Fees cannot be negative'),
  payment_mode: z.string()
})

const planDurations = {
  'Monthly': 1,
  'Quarterly': 3,
  'Half Yearly': 6,
  'Annual': 12
}

export default function AddMember() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [expiryPreview, setExpiryPreview] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      joining_date: format(new Date(), 'yyyy-MM-dd'),
      plan_type: 'Monthly',
      payment_mode: 'Cash'
    }
  })

  // 🔄 Real-time Expiry Auto-Calculation
  const watchedDates = watch(['joining_date', 'plan_type'])
  useEffect(() => {
    const [joiningStr, plan] = watchedDates
    if (joiningStr && plan) {
      const joining = parseISO(joiningStr)
      const months = planDurations[plan]
      const expiry = addMonths(joining, months)
      setExpiryPreview(format(expiry, 'yyyy-MM-dd'))
    }
  }, [watchedDates])

  // 🚀 React Query Mutation for Data Sync
  const mutation = useMutation({
    mutationFn: async (newData) => {
      const qrData = `BG-${Date.now()}-${newData.phone}`
      const regNo = `BJG-${format(new Date(), 'yy')}-${Math.floor(1000 + Math.random() * 9000)}`

      const { data, error } = await supabase
        .from('members')
        .insert([{
          ...newData,
          expiry_date: expiryPreview,
          status: 'active',
          qr_code_data: qrData,
          registration_no: regNo
        }])

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      logAction('MEMBER_ENROLLED', {
        name: variables.full_name,
        phone: variables.phone,
        plan: variables.plan_type
      })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      alert('Athlete Enrolled Successfully!')
      navigate('/members')
    },
    onError: (err) => {
      console.error(err)
      alert(`System Error: ${err.message}`)
    }
  })

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('File too large (Max 2MB)')

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { error } = await supabase.storage.from('members_photo').upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('members_photo').getPublicUrl(fileName)
      setValue('photo_url', publicUrl)
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter whitespace-nowrap">Become <span className="text-brand-red">Legendary</span></h2>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Athlete Registration</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <div className="card p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">

            {/* Identity Group */}
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] flex items-center gap-2 italic">
                  <UserPlus size={14} className="text-brand-red" /> Full Athlete Name
                </label>
                <input
                  {...register('full_name')}
                  placeholder="John Doe"
                  className={`w-full bg-zinc-950 border ${errors.full_name ? 'border-red-500' : 'border-white/5'} rounded-2xl py-4 px-5 focus:border-brand-red outline-none transition-all font-bold placeholder:opacity-30`}
                />
                {errors.full_name && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-1">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] flex items-center gap-2 italic">
                  <Phone size={14} className="text-brand-red" /> Contact Number
                </label>
                <input
                  {...register('phone')}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`w-full bg-zinc-950 border ${errors.phone ? 'border-red-500' : 'border-white/5'} rounded-2xl py-4 px-5 focus:border-brand-red outline-none transition-all font-bold placeholder:opacity-30`}
                />
                {errors.phone && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-1">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] flex items-center gap-2 italic">
                  <Upload size={14} className="text-brand-red" /> Profile Portrait
                </label>
                <div className="flex items-center gap-4 group">
                  <div className="w-24 h-24 bg-zinc-950 border border-white/5 rounded-3xl flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-red/30">
                    {watch('photo_url') ? (
                      <img src={watch('photo_url')} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-zinc-800" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="photo-v2" />
                    <label htmlFor="photo-v2" className={`w-full py-4 px-6 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 ${uploading ? 'opacity-50' : ''}`}>
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploading ? 'Processing Portrait...' : 'Select Face Image'}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Financials & Plan Group */}
            <div className="space-y-8 h-full flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-brand-red tracking-[0.2em] flex items-center gap-2 italic">
                    <Coins size={14} /> Fees (₹)
                  </label>
                  <input
                    {...register('fees_paid')}
                    type="number"
                    placeholder="1200"
                    className={`w-full bg-zinc-950 border ${errors.fees_paid ? 'border-red-500' : 'border-white/5'} rounded-2xl py-4 px-5 focus:border-brand-red outline-none transition-all font-bold placeholder:opacity-30`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] flex items-center gap-2 italic">
                    <CreditCard size={14} /> Settlement
                  </label>
                  <select {...register('payment_mode')} className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-5 focus:border-brand-red outline-none transition-all font-bold appearance-none cursor-pointer">
                    <option value="Cash">Cash Only</option>
                    <option value="UPI">UPI Digital</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] italic">Plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(planDurations).map(plan => (
                    <label key={plan} className={`relative flex items-center justify-center p-4 border rounded-2xl cursor-pointer transition-all ${watch('plan_type') === plan ? 'bg-brand-red/10 border-brand-red text-white' : 'bg-black/40 border-white/5 text-zinc-600 hover:border-white/10'}`}>
                      <input type="radio" {...register('plan_type')} value={plan} className="hidden" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{plan}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-zinc-600 tracking-[0.2em] flex items-center gap-2 italic">
                  <Calendar size={14} className="text-brand-red" /> Start Date
                </label>
                <input
                  {...register('joining_date')}
                  type="date"
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-5 focus:border-brand-red outline-none transition-all font-bold"
                />
              </div>

              <div className="p-6 bg-brand-red border border-brand-red/50 rounded-3xl shadow-2xl shadow-brand-red/20 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-white/60 font-black uppercase tracking-widest mb-1 italic">Renewal Deadline</p>
                  <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{expiryPreview ? format(parseISO(expiryPreview), 'dd MMM yyyy') : '--'}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <BadgeAlert size={28} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || uploading}
            className={`mt-12 w-full py-6 flex items-center justify-center gap-3 bg-white text-black rounded-3xl font-black uppercase tracking-[0.4em] text-xs hover:bg-brand-red hover:text-white transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(255,62,62,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group`}
          >
            {mutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <div className="p-1 bg-black text-white rounded-lg group-hover:bg-white group-hover:text-brand-red transition-colors"><UserPlus size={18} /></div>}
            {mutation.isPending ? 'Enrolling Athlete...' : 'Confirm Enrollment'}
          </button>
        </div>
      </form>
    </div>
  )
}
