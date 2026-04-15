import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, X, Lock, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SecurityDialog({ isOpen, onClose, onVerified, title = "Security Required" }) {
    const [pin, setPin] = useState(['', '', '', ''])
    const [error, setError] = useState(false)
    const inputRefs = [useRef(), useRef(), useRef(), useRef()]

    // 🛡️ DEFAULT MASTER PIN (Change this in production)
    const MASTER_PIN = "2468"

    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', ''])
            setError(false)
            setTimeout(() => inputRefs[0].current?.focus(), 100)
        }
    }, [isOpen])

    const handleChange = (index, value) => {
        if (isNaN(value)) return

        const newPin = [...pin]
        newPin[index] = value.slice(-1)
        setPin(newPin)

        // Move to next input
        if (value && index < 3) {
            inputRefs[index + 1].current?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus()
        }
    }

    const handleSubmit = (e) => {
        if (e) e.preventDefault()
        const enteredPin = pin.join('')

        if (enteredPin === MASTER_PIN) {
            onVerified()
            onClose()
        } else {
            setError(true)
            setPin(['', '', '', ''])
            inputRefs[0].current?.focus()
            // Dynamic shake effect could be added here
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                >
                    {/* Accent Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-red shadow-[0_0_20px_#ff3e3e]"></div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red mb-6 shadow-inner">
                            <ShieldCheck size={32} strokeWidth={2.5} />
                        </div>

                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-[var(--theme-text)] mb-2">{title}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-8">Enter Master PIN to Authorize Action</p>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex gap-4 justify-center">
                                {pin.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={inputRefs[i]}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className={`w-14 h-16 bg-[var(--theme-surface-soft)] border ${error ? 'border-rose-500 animate-shake' : 'border-[var(--theme-border)]'} rounded-2xl text-center text-2xl font-black text-[var(--theme-text)] focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all shadow-inner`}
                                    />
                                ))}
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 text-rose-500"
                                >
                                    <AlertCircle size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Access Denied</span>
                                </motion.div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl bg-[var(--theme-surface-soft)] border border-[var(--theme-border)] text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] hover:text-brand-red transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={pin.some(d => !d)}
                                    className="flex-1 py-4 rounded-2xl bg-brand-red text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_10px_30px_rgba(255,62,62,0.3)] disabled:opacity-30 transition-all shadow-lg"
                                >
                                    Authorize
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
