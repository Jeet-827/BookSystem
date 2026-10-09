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
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
            'icons-vendor': ['lucide-react'],
            'network-vendor': ['axios'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
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
