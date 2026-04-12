import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let timeout;
        const resetTimer = () => {
            if (timeout) clearTimeout(timeout);
            // 🛑 Auto-logout after 30 minutes of total inactivity
            timeout = setTimeout(() => {
                if (user) {
                    console.log("Inactivity detected. Locking session...");
                    supabase.auth.signOut();
                    setUser(null);
                }
            }, 30 * 60 * 1000);
        };

        // Listen for user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        // Initial session check
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
        }

        getSession()
        resetTimer();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
            resetTimer(); // Reset on auth changes too
        })

        return () => {
            subscription.unsubscribe();
            events.forEach(event => document.removeEventListener(event, resetTimer));
            if (timeout) clearTimeout(timeout);
        }
    }, [user])

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: async (data) => {
            const result = await supabase.auth.signInWithPassword(data)
            if (result.data?.user) {
                setUser(result.data.user)
            }
            return result
        },
        signOut: async () => {
            const result = await supabase.auth.signOut()
            setUser(null)
            return result
        },
        user,
    }


    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
