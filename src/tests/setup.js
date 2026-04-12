import '@testing-library/jest-dom'
import { vi } from 'vitest'

// 🛡️ Guard against browser-specific features that fail in JSDOM
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mocking Supabase so we don't hit production in tests
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
                    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
        })),
    },
}))
