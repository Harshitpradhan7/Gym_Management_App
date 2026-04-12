import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, UserPlus, LogOut, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Layout() {
  const { signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/members', label: 'Roster', icon: Users },
    { path: '/members/add', label: 'Add', icon: UserPlus },
  ]

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand-red selection:text-white relative overflow-x-hidden">
      {/* 🔴 SUBTLE LOGO WATERMARK (CENTERED) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] opacity-[0.03] pointer-events-none select-none z-0">
        <img src="/logo.png" alt="" className="w-full h-full object-contain" />
      </div>

      {/* 🔴 TOP NAV (Desktop Focused) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center backdrop-blur-xl shadow-inner group-hover:border-brand-red/50 transition-all duration-500">
              <img
                src="/logo.png"
                alt="Bajrang Gym"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-black italic uppercase tracking-tighter leading-tight">Bajrang <span className="text-brand-red">Gym 2.0</span></h1>
              <p className="text-[7px] md:text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-tight">Professional HQ</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-xs font-black uppercase tracking-widest hover:text-brand-red transition-all ${location.pathname === item.path ? 'text-brand-red' : 'text-zinc-500'}`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => signOut()}
              className="px-5 py-2.5 bg-zinc-900 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Sign Out
            </button>
          </div>

          <button onClick={() => signOut()} className="md:hidden text-zinc-500 p-2 hover:text-brand-red transition-colors"><LogOut size={18} /></button>
        </div>
      </nav>

      {/* 🔴 MAIN CONTENT */}
      <main className="pt-20 pb-28 md:pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 📱 MOBILE BOTTOM NAV (Built for Thumbs) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[85%] max-w-[320px]">
        <div className="bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[28px] p-1.5 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-1.5 py-3 px-5 transition-all duration-500 ${isActive ? 'text-white' : 'text-zinc-500'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-brand-red rounded-[22px] -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} className={isActive ? 'scale-110' : ''} />
                <span className="text-[7px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 🔴 WATERMARK (SUBTLE) */}
      <div className="fixed bottom-8 right-8 opacity-[0.02] pointer-events-none hidden lg:block select-none">
        <h2 className="text-[12rem] font-black italic uppercase leading-none">Bajrang</h2>
      </div>
    </div>
  )
}
