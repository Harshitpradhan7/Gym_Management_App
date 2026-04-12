import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { addMonths, format, parseISO } from 'date-fns'

export default function EditMember() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    photo_url: '',
    plan_type: '',
    joining_date: '',
    expiry_date: ''
  })

  useEffect(() => {
    async function fetchMember() {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error(error)
        navigate('/members')
      } else {
        // Ensure missing payment fields have defaults
        setFormData({
          ...data,
          fees_paid: data.fees_paid || '',
          payment_mode: data.payment_mode || 'Cash'
        })
      }
      setLoading(false)
    }
    fetchMember()
  }, [id, navigate])

  const planDurations = {
    'Monthly': 1,
    'Quarterly': 3,
    'Half Yearly': 6,
    'Annual': 12
  }

  // Update expiry when plan or joining date changes
  useEffect(() => {
    if (formData.joining_date && formData.plan_type && !loading) {
      const joining = new Date(formData.joining_date)
      const months = planDurations[formData.plan_type]
      const expiry = addMonths(joining, months)
      setFormData(prev => ({ ...prev, expiry_date: format(expiry, 'yyyy-MM-dd') }))
    }
  }, [formData.joining_date, formData.plan_type, loading])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('members')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          photo_url: formData.photo_url,
          plan_type: formData.plan_type,
          joining_date: formData.joining_date,
          expiry_date: formData.expiry_date,
          fees_paid: formData.fees_paid,
          payment_mode: formData.payment_mode
        })
        .eq('id', id)

      if (error) throw error
      navigate(`/members/${id}`)
    } catch (err) {
      console.error('Update error:', err)
      alert('Failed to update member.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-red" size={40} /></div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-black uppercase italic">Edit <span className="text-brand-red">Profile</span></h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase font-black text-zinc-500 tracking-widest">Full Name</label>
            <input 
              required
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-red outline-none font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-black text-zinc-500 tracking-widest">Phone Number</label>
            <input 
              required
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-red outline-none font-bold text-brand-red"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase font-black text-zinc-500 tracking-widest">Photo URL</label>
            <input 
              name="photo_url"
              value={formData.photo_url || ''}
              onChange={handleInputChange}
              className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-red outline-none text-sm font-mono text-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-brand-red tracking-widest flex items-center gap-2">💰 Fees Paid (₹)</label>
              <input 
                required
                name="fees_paid"
                value={formData.fees_paid || ''}
                onChange={handleInputChange}
                type="number" 
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-red outline-none font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-brand-red tracking-widest flex items-center gap-2">💳 Mode</label>
              <select 
                name="payment_mode"
                value={formData.payment_mode || 'Cash'}
                onChange={handleInputChange}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-red outline-none font-bold italic"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-zinc-500 tracking-widest">Plan</label>
              <select 
                name="plan_type"
                value={formData.plan_type}
                onChange={handleInputChange}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-red outline-none font-bold"
              >
                {Object.keys(planDurations).map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-zinc-500 tracking-widest">Joined On</label>
              <input 
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleInputChange}
                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-red outline-none font-bold"
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
             <p className="text-[10px] uppercase font-black text-zinc-500 mb-1">Membership Expiry</p>
             <p className="text-xl font-black text-brand-red italic">{formData.expiry_date ? format(parseISO(formData.expiry_date), 'dd MMMM yyyy') : '--'}</p>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className={`btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 ${saving ? 'opacity-50' : ''}`}
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Update Records'}
          </button>
        </div>
      </form>
    </div>
  )
}
