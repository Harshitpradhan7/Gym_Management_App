import { useState, useEffect } from 'react'
import { Calendar, CreditCard, CheckCircle2, X, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { addMonths, format, parseISO, isAfter } from 'date-fns'

export default function RenewalModal({ isOpen, onClose, member, onRenewed }) {
    const [duration, setDuration] = useState(1)
    const [fees, setFees] = useState('')
    const [paymentMode, setPaymentMode] = useState('Cash')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate New Expiry Date
    const calculateNewExpiry = () => {
        if (!member) return new Date()
        const currentExpiry = parseISO(member.expiry_date)
        const today = new Date()

        // If already expired, start from today. Otherwise, append to existing time.
        const baseDate = isAfter(currentExpiry, today) ? currentExpiry : today
        return addMonths(baseDate, duration)
    }

    const newExpiryDate = calculateNewExpiry()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        const planMapping = {
            1: 'Monthly',
            3: 'Quarterly',
            6: 'Half Yearly',
            12: 'Annual'
        }

        const updateData = {
            expiry_date: format(newExpiryDate, 'yyyy-MM-dd'),
            fees_paid: parseInt(fees) || 0,
            payment_mode: paymentMode,
            plan_type: planMapping[duration]
        }

        await onRenewed(updateData)
        setIsSubmitting(false)
        onClose()
    }

    if (!isOpen || !member) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic uppercase text-[var(--theme-text)] tracking-tighter leading-none mb-1">Renew Subscription</h3>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{member.full_name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-[var(--theme-text-muted)] hover:text-brand-red transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Duration Matrix */}
                        <div>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Choose Duration</p>
                            <div className="grid grid-cols-4 gap-3">
                                {[1, 3, 6, 12].map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setDuration(m)}
                                        className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${duration === m ? 'bg-brand-red border-brand-red text-white shadow-[0_10px_30px_rgba(255,62,62,0.3)]' : 'bg-[var(--theme-surface-soft)] border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-brand-red'}`}
                                    >
                                        <span className="text-xl font-black italic uppercase leading-none">{m}</span>
                                        <span className="text-[8px] font-bold uppercase tracking-widest">{m === 1 ? 'Month' : 'Months'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fees & Payment */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Fees Collected</p>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={fees}
                                        onChange={(e) => setFees(e.target.value)}
                                        required
                                        placeholder="0"
                                        className="w-full pl-8 pr-4 py-4 bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] rounded-2xl text-[var(--theme-text)] font-black text-lg focus:border-brand-red outline-none shadow-inner"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Payment Mode</p>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="w-full px-4 py-4 bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] rounded-2xl text-[var(--theme-text)] font-black uppercase text-xs focus:border-brand-red outline-none appearance-none cursor-pointer"
                                >
                                    <option value="Cash">Cash Flow</option>
                                    <option value="UPI">UPI Digital</option>
                                    <option value="Card">Card Swipe</option>
                                </select>
                            </div>
                        </div>

                        {/* Dynamic Expiry Preview */}
                        <div className="p-6 bg-brand-red/5 border border-brand-red/20 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-brand-red/20 text-brand-red rounded-xl flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">New Expiry Extension</p>
                                    <p className="text-lg font-black text-[var(--theme-text)] italic uppercase tracking-tighter leading-none mt-1">
                                        {format(newExpiryDate, 'dd MMMM yyyy')}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="text-zinc-800" size={24} />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-6 btn-primary text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:shadow-[0_20px_50px_rgba(255,62,62,0.3)] disabled:opacity-50 transition-all shadow-xl"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={24} />}
                            {isSubmitting ? 'Synchronizing Wallet...' : 'Authorize Renewal'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
