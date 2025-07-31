// =============================================================================
// WEBAPP POSTCSS CONFIGURATION - OPTIMIZED CSS PROCESSING
// File: webapp/postcss.config.js
// =============================================================================

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // CSS optimization for production builds
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyParams: true,
        }]
      }
    })
  },
}