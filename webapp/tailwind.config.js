// =============================================================================
// WEBAPP TAILWIND CONFIGURATION - ANALYSIS TOOL FOCUSED
// File: webapp/tailwind.config.js
// =============================================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors for the analysis webapp
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        
        // Secondary purple colors  
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764'
        },
        
        // Success/error states
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a'
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626'
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706'
        },
        
        // Glass morphism backgrounds
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.15)',
          dark: 'rgba(0, 0, 0, 0.1)'
        }
      },
      
      // Custom animations for webapp interactions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'upload-bounce': 'uploadBounce 0.6s ease-out',
        'analysis-spin': 'analysisSpin 2s linear infinite',
        'result-reveal': 'resultReveal 0.8s ease-out'
      },
      
      // Custom keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' }
        },
        uploadBounce: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.05)' },
          '60%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        },
        analysisSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        resultReveal: {
          '0%': { 
            transform: 'translateY(30px) scale(0.95)', 
            opacity: '0' 
          },
          '50%': { 
            transform: 'translateY(-5px) scale(1.02)', 
            opacity: '0.8' 
          },
          '100%': { 
            transform: 'translateY(0) scale(1)', 
            opacity: '1' 
          }
        }
      },
      
      // Custom spacing for webapp layout
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      
      // Custom backdrop blur values
      backdropBlur: {
        xs: '2px',
        '4xl': '72px'
      },
      
      // Custom border radius for modern look
      borderRadius: {
        '4xl': '2rem'
      },
      
      // Custom typography for analysis content
      fontSize: {
        '2xs': '0.625rem',
        '3xl': '1.875rem'
      },
      
      // Custom shadows for glass morphism
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'upload-hover': '0 20px 40px -12px rgba(59, 130, 246, 0.25)'
      },
      
      // Custom gradients for webapp
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-webapp': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-analysis': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
      }
    },
  },
  plugins: [
    // Add custom utilities for webapp
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-effect': {
          'backdrop-filter': 'blur(16px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(16px) saturate(180%)',
          'background-color': 'rgba(255, 255, 255, 0.1)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-effect-strong': {
          'backdrop-filter': 'blur(24px) saturate(200%)',
          '-webkit-backdrop-filter': 'blur(24px) saturate(200%)',
          'background-color': 'rgba(255, 255, 255, 0.15)',
          'border': '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.upload-zone': {
          'transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'transform': 'translateY(0)',
        },
        '.upload-zone:hover': {
          'transform': 'translateY(-2px)',
          'box-shadow': '0 20px 40px -12px rgba(59, 130, 246, 0.25)',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}