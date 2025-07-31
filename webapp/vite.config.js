// =============================================================================
// WEBAPP VITE CONFIGURATION - OPTIMIZED FOR ANALYSIS TOOL
// File: webapp/vite.config.js
// =============================================================================

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const isDevelopment = mode === 'development'
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    
    // Development server configuration
    server: {
      port: 5174, // Different port from landing page (5173)
      open: true,
      cors: true,
      proxy: {
        // Proxy API calls to backend during development
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
        // Proxy health checks
        '/health': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      },
      // HMR configuration
      hmr: {
        overlay: isDevelopment
      }
    },
    
    // Preview server configuration (for local production testing)
    preview: {
      port: 4174, // Different port from landing page
      open: true,
      cors: true
    },
    
    // Build configuration optimized for webapp
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      target: 'es2020',
      
      // Optimized chunking for webapp
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React chunk
            'react-vendor': ['react', 'react-dom'],
            
            // Router chunk (smaller for webapp)
            'router': ['react-router-dom'],
            
            // Firebase chunk
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            
            // UI libraries chunk
            'ui-libs': ['framer-motion', 'lucide-react', '@headlessui/react'],
            
            // File handling chunk
            'file-handling': ['react-dropzone', 'axios'],
            
            // Utils chunk
            'utils': ['prop-types']
          }
        }
      },
      
      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
        },
        mangle: {
          safari10: true
        },
        format: {
          safari10: true
        }
      } : {},
      
      // Performance settings
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096
    },
    
    // CSS configuration
    css: {
      devSourcemap: isDevelopment,
      postcss: './postcss.config.js'
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@/components': resolve(__dirname, './src/components'),
        '@/pages': resolve(__dirname, './src/pages'),
        '@/utils': resolve(__dirname, './src/utils'),
        '@/hooks': resolve(__dirname, './src/hooks'),
        '@/firebase': resolve(__dirname, './src/firebase')
      }
    },
    
    // Define global constants
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'framer-motion',
        'lucide-react',
        'react-dropzone',
        '@headlessui/react'
      ],
      exclude: [
        'firebase' // Firebase should be bundled, not pre-bundled
      ]
    },
    
    // Environment variables prefix
    envPrefix: 'VITE_',
    
    // Base public path (for deployment)
    base: env.VITE_BASE_PATH || '/',
    
    // Additional configuration for production
    ...(isProduction && {
      esbuild: {
        legalComments: 'none'
      }
    })
  }
})