import { parseISO, isPast, differenceInDays } from 'date-fns'
import { ShieldCheck, Clock, AlertCircle } from 'lucide-react'

/**
 * 🛡️ Core Business Logic: Determines athlete status based on expiry
 */
export const getStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'Active', class: 'status-active', icon: ShieldCheck }

    const exp = parseISO(expiryDate)
    const today = new Date()
    const diff = differenceInDays(exp, today)

    if (isPast(exp) && diff < 0) {
        return { label: 'Expired', class: 'status-expired', icon: AlertCircle }
    }

    if (diff <= 7) {
        return { label: 'Expiring Soon', class: 'status-expiring', icon: Clock }
    }

    return { label: 'Active', class: 'status-active', icon: ShieldCheck }
}
