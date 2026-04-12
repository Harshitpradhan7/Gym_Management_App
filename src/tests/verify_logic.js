// 🛡️ High-Speed Node Diagnostic for Athlete Status
import { getStatus } from '../lib/status.js'
import { format, addDays, subDays } from 'date-fns'

const testCases = [
    {
        name: "Active Member (30 Days Left)",
        input: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        expected: 'Active'
    },
    {
        name: "Expiring Soon (5 Days Left)",
        input: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
        expected: 'Expiring Soon'
    },
    {
        name: "Expired Member (2 Days Ago)",
        input: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
        expected: 'Expired'
    },
    {
        name: "New Member (No Date Yet)",
        input: null,
        expected: 'Active'
    }
]

console.log('🚀 Launching Bajrang Gym Production Integrity Check...\n')

let passed = 0
testCases.forEach(tc => {
    try {
        const result = getStatus(tc.input)
        if (result.label === tc.expected) {
            console.log(`✅ PASS: ${tc.name}`)
            passed++
        } else {
            console.log(`❌ FAIL: ${tc.name} (Expected ${tc.expected}, got ${result.label})`)
        }
    } catch (err) {
        console.log(`❌ CRASH: ${tc.name} (${err.message})`)
    }
})

console.log(`\n📊 Final Score: ${passed}/${testCases.length} Tests Passed.`)
if (passed === testCases.length) {
    console.log('🏆 SYSTEM IS PRODUCTION-READY!')
} else {
    console.log('⚠️ SYSTEM REQUIRES MAINTENANCE!')
    process.exit(1)
}
