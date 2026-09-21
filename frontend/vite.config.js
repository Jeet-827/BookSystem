import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    esbuild: {
      // Clear console.log and debugger statements from production client bundles
      drop: isProd ? ['console', 'debugger'] : [],
    },
    // Force Vite to pre-bundle lucide-react in dev mode (tree-shakes 1MB → ~20KB)
    optimizeDeps: {
      include: ['lucide-react'],
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router') ||
                id.includes('react-router-dom')
              ) {
                return 'react-vendor';
              }
              if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
                return 'redux-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              if (id.includes('axios')) {
                return 'network-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/admin': {
          target: 'http://127.0.0.1:5001',
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: true,
    },
  };
});
