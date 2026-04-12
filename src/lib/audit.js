import { supabase } from './supabase'

/**
 * Professional Audit Logger
 * Tracks sensitive actions for accountability
 */
export const logAction = async (action, details, userId = null) => {
    try {
        const { error } = await supabase
            .from('audit_logs') // Ensure this table exists in your Supabase
            .insert([
                {
                    action,
                    details,
                    user_id: userId,
                    timestamp: new Date().toISOString()
                }
            ])

        if (error) {
            if (error.code === '42P01') {
                console.warn("🛡️ Audit Log Note: 'audit_logs' table doesn't exist yet. Action logged to console only.")
                console.log(`[AUDIT] Action: ${action} | Details:`, details)
            } else {
                throw error
            }
        }
    } catch (err) {
        console.error('❌ Audit System Error:', err)
    }
}
