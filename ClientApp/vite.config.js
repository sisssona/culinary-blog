import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:5011',
            '/uploads': 'http://localhost:5011',
            '/health': 'http://localhost:5011'
        }
    }
});