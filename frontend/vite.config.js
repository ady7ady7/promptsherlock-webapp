// =============================================================================
// OPTIMIZED VITE CONFIGURATION WITH COMPREHENSIVE CHUNKING STRATEGY
// File: frontend/vite.config.js - REPLACE EXISTING
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
      port: 5173,
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
      port: 4173,
      open: true,
      cors: true
    },
    
    // Build configuration with advanced chunking strategy
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      
      // ADVANCED CHUNK SPLITTING STRATEGY
      rollupOptions: {
        output: {
          // Manual chunk splitting to prevent circular dependencies and optimize loading
          manualChunks: (id) => {
            // =============================================================================
            // CORE DEPENDENCIES - LOAD FIRST
            // =============================================================================
            
            // React core - highest priority, loaded immediately
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            
            // =============================================================================
            // DEFERRED CHUNKS - LOAD ON DEMAND
            // =============================================================================
            
            // Firebase - ONLY load Auth, exclude unused modules
            if (id.includes('firebase') || id.includes('@firebase')) {
              // Split Firebase into essential vs optional
              if (id.includes('auth') || id.includes('firestore')) {
                return 'firebase-essential';
              }
              // Exclude unused Firebase modules entirely
              if (id.includes('messaging') || id.includes('performance') || 
                  id.includes('remote-config') || id.includes('database') ||
                  id.includes('storage') || id.includes('functions')) {
                return 'firebase-unused'; // This will be tree-shaken out
              }
              return 'firebase-core';
            }
            
            // Framer Motion - SPLIT INTO COMPONENTS
            if (id.includes('framer-motion')) {
              // Core motion utilities
              if (id.includes('motion-dom') || id.includes('motion-utils')) {
                return 'motion-core';
              }
              // Animation components - lazy loaded
              if (id.includes('AnimatePresence') || id.includes('motion.')) {
                return 'motion-components';
              }
              return 'motion-main';
            }
            
            // Axios - lazy load only when form submission happens
            if (id.includes('axios')) {
              return 'http-client';
            }
            
            // React Router - split routing logic
            if (id.includes('react-router')) {
              return 'router';
            }
            
            // UI Components - group by usage pattern
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            
            if (id.includes('@headlessui')) {
              return 'ui-components';
            }
            
            if (id.includes('react-dropzone')) {
              return 'file-handling';
            }
            
            // =============================================================================
            // VENDOR DEPENDENCIES - COMMON CHUNKS
            // =============================================================================
            
            // Group small utilities together
            if (id.includes('prop-types') || id.includes('classnames') || 
                id.includes('lodash') || id.includes('uuid')) {
              return 'utils';
            }
            
            // Polyfills and browser compatibility
            if (id.includes('core-js') || id.includes('regenerator-runtime')) {
              return 'polyfills';
            }
            
            // Everything else that's not our code goes to vendor
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          
          // Asset file naming with better organization
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/css/i.test(ext)) {
              return `assets/styles/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      
      // Terser options for production with aggressive optimization
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.warn'],
          // Remove unused Firebase modules
          dead_code: true,
          unused: true
        },
        mangle: {
          safari10: true
        }
      } : {},
      
      // Lower chunk size warning for better monitoring
      chunkSizeWarningLimit: 500,
      
      // Target modern browsers for smaller bundles
      target: env.VITE_BUILD_TARGET || (isProduction ? 'es2020' : 'esnext'),
      
      // Enable CSS code splitting
      cssCodeSplit: true
    },
    
    // OPTIMIZED DEPENDENCY PRE-BUNDLING
    optimizeDeps: {
      // Include dependencies that should be pre-bundled
      include: [
        'react',
        'react-dom',
        'prop-types'
      ],
      // Exclude large dependencies that benefit from lazy loading
      exclude: [
        'framer-motion',
        'axios',
        'firebase',
        '@firebase/auth',
        '@firebase/firestore',
        'react-router-dom'
      ],
      // Force optimization of problematic dependencies
      force: true
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@lazy': resolve(__dirname, 'src/lazy') // New lazy loading directory
      }
    },
    
    // CSS configuration with optimization
    css: {
      postcss: './postcss.config.js',
      devSourcemap: isDevelopment,
      // Enable CSS modules for component-specific styles
      modules: {
        localsConvention: 'camelCase'
      }
    },
    
    // Environment variables
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
      __VERSION__: JSON.stringify(process.env.npm_package_version),
      // Feature flags for lazy loading
      __LAZY_LOAD_FRAMER__: true,
      __LAZY_LOAD_FIREBASE__: true,
      __LAZY_LOAD_AXIOS__: true
    },
    
    // Base URL for deployment
    base: env.VITE_BASE_URL || '/',
    
    // ESBuild configuration with tree-shaking
    esbuild: {
      target: 'esnext',
      drop: isProduction ? ['console', 'debugger'] : [],
      // Enable tree-shaking for better optimization
      treeShaking: true
    }
  }
})