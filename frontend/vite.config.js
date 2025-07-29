// =============================================================================
// FIXED VITE CONFIGURATION - PRODUCTION READY
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
    
    // Build configuration with comprehensive chunking strategy
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      
      // COMPREHENSIVE CHUNK SPLITTING STRATEGY
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal loading
          manualChunks: (id) => {
            // =============================================================================
            // CORE REACT - HIGHEST PRIORITY
            // =============================================================================
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            
            // =============================================================================
            // VENDOR LIBRARIES - GROUPED BY USAGE PATTERN
            // =============================================================================
            
            // Router - static import, but separate chunk
            if (id.includes('react-router')) {
              return 'router';
            }
            
            // Firebase - separate from other vendors due to size
            if (id.includes('firebase') || id.includes('@firebase')) {
              // Only include essential Firebase modules
              if (id.includes('auth') || id.includes('firestore') || id.includes('app')) {
                return 'firebase';
              }
              // Exclude unused Firebase modules by not chunking them
              return 'vendor';
            }
            
            // Framer Motion - large animation library
            if (id.includes('framer-motion')) {
              return 'animations';
            }
            
            // HTTP client
            if (id.includes('axios')) {
              return 'http-client';
            }
            
            // UI components and utilities
            if (id.includes('lucide-react') || id.includes('@headlessui') || 
                id.includes('react-dropzone')) {
              return 'ui-components';
            }
            
            // Small utilities
            if (id.includes('prop-types') || id.includes('classnames')) {
              return 'utils';
            }
            
            // All other node_modules
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
          dead_code: true,
          unused: true
        },
        mangle: {
          safari10: true
        }
      } : {},
      
      // Chunk size warning limits
      chunkSizeWarningLimit: 500,
      
      // Target modern browsers for smaller bundles
      target: env.VITE_BUILD_TARGET || (isProduction ? 'es2020' : 'esnext'),
      
      // Enable CSS code splitting
      cssCodeSplit: true
    },
    
    // DEPENDENCY PRE-BUNDLING OPTIMIZATION
    optimizeDeps: {
      // Include critical dependencies that should be pre-bundled
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'prop-types'
      ],
      // Exclude large dependencies that benefit from lazy loading
      exclude: [
        // Don't exclude these as we're not dynamically importing them anymore
        // 'framer-motion',
        // 'axios',
        // 'firebase'
      ],
      // Force re-optimization
      force: false
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@assets': resolve(__dirname, 'src/assets')
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
      __VERSION__: JSON.stringify(process.env.npm_package_version)
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