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
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom'],
            animations: ['framer-motion'],
            ui: ['lucide-react', '@headlessui/react'],
            utils: ['axios', 'react-dropzone'],
          },
          // Asset file naming
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
      
      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info']
        },
        mangle: true
      } : {},
      
      // Size warning limit
      chunkSizeWarningLimit: 1000,
      
      // Target modern browsers
      target: env.VITE_BUILD_TARGET || (isProduction ? 'es2015' : 'esnext'),
      
      // CSS code splitting
      cssCodeSplit: true
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'framer-motion',
        'lucide-react',
        'axios',
        'react-dropzone',
        '@headlessui/react'
      ],
      // Exclude problematic dependencies
      exclude: []
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
    
    // CSS configuration
    css: {
      postcss: './postcss.config.js',
      devSourcemap: isDevelopment
    },
    
    // Environment variables
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
      __VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    
    // Base URL for deployment
    base: env.VITE_BASE_URL || '/',
    
    // ESBuild configuration
    esbuild: {
      target: 'esnext',
      drop: isProduction ? ['console', 'debugger'] : []
    }
  }
})