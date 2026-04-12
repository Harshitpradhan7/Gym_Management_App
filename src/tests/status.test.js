import { describe, it, expect } from 'vitest'
import { getStatus } from '../lib/status'
import { format, addDays, subDays } from 'date-fns'

describe('Athlete Status Business Logic', () => {

    it('should return "Active" for athletes with far-future expiries', () => {
        const futureDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')
        const status = getStatus(futureDate)
        expect(status.label).toBe('Active')
        expect(status.class).toBe('status-active')
    })

    it('should return "Expiring Soon" for athletes with expiry within 7 days', () => {
        const soonDate = format(addDays(new Date(), 5), 'yyyy-MM-dd')
        const status = getStatus(soonDate)
        expect(status.label).toBe('Expiring Soon')
        expect(status.class).toBe('status-expiring')
    })

    it('should return "Expired" for athletes whose plan ended in the past', () => {
        const pastDate = format(subDays(new Date(), 2), 'yyyy-MM-dd')
        const status = getStatus(pastDate)
        expect(status.label).toBe('Expired')
        expect(status.class).toBe('status-expired')
    })

    it('should default to "Active" if no expiry date is provided (New Athlete)', () => {
        const status = getStatus(null)
        expect(status.label).toBe('Active')
    })
})
