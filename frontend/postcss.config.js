export default {
  plugins: {
    // Tailwind CSS - must be first
    tailwindcss: {},
    
    // Autoprefixer for vendor prefixes
    autoprefixer: {},
    
    // Additional PostCSS plugins for production optimization
    ...(process.env.NODE_ENV === 'production' && {
      // CSS Nano for minification in production
      cssnano: {
        preset: ['default', {
          // Preserve important comments
          discardComments: {
            removeAll: false,
          },
          // Preserve CSS custom properties
          reduceIdents: false,
          // Preserve z-index values
          zindex: false,
          // Safe minification options
          mergeIdents: false,
          mergeRules: false,
          mergeLonghand: false,
          discardUnused: false,
        }],
      },
      
      // PurgeCSS for removing unused styles (optional)
      '@fullhuman/postcss-purgecss': {
        content: [
          './index.html',
          './src/**/*.{js,ts,jsx,tsx}',
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        safelist: [
          // Preserve dynamic classes
          /^animate-/,
          /^glass-/,
          /^glow-/,
          /^gradient-/,
          /^backdrop-/,
          /^spinner/,
          /^dropzone/,
          /^btn-/,
          /^form-/,
          /^text-/,
          // Preserve responsive classes
          /^sm:/,
          /^md:/,
          /^lg:/,
          /^xl:/,
          /^2xl:/,
          // Preserve state classes
          /^hover:/,
          /^focus:/,
          /^active:/,
          /^disabled:/,
          // Preserve dark mode classes
          /^dark:/,
        ],
      },
    }),
  },
}