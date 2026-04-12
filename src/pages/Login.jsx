import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Dumbbell, Loader2, AlertCircle } from 'lucide-react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { user, signIn } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || "/"

    // 🛡️ Auto-redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(from, { replace: true })
        }
    }, [user, navigate, from])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await signIn({ email, password })
            if (error) throw error
            navigate(from, { replace: true })
        } catch (err) {
            setError(err.message || 'Failed to sign in. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md">
                <div className="flex flex-col items-center justify-center gap-4 mb-8">
                    <div className="w-24 h-24 rounded-full border-2 border-orange-600/20 overflow-hidden bg-slate-900/50 backdrop-blur-sm p-1 shadow-2xl shadow-orange-600/10">

                        <img
                            src="/logo.png"
                            alt="Bajrang Gym Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('flex', 'items-center', 'justify-center'); e.target.parentElement.innerHTML = '<span class="text-orange-600 text-4xl font-black italic">B</span>'; }}
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        BAJRANG <span className="text-orange-600">GYM 2.0</span>
                    </h1>
                </div>


                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-white">Manager Login</h2>
                        <p className="text-slate-400 mt-2">Enter your credentials to access the dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 transition-all"
                                placeholder="manager@gym.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-70 disabled:hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Access Dashboard'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center gap-2">
                        <p className="text-xs text-slate-500 text-center">
                            Internal Management System for Bajrang Gym 2.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
