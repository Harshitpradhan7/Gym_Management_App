import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/tests/setup.js',
        include: ['src/tests/**/*.test.js'],
        pool: 'forks', // More stable on Windows
        isolate: false,
    },
})
