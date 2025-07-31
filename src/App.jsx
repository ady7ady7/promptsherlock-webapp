// =============================================================================
// WEBAPP APP.JSX - ANALYSIS TOOL FOCUSED
// File: webapp/src/App.jsx - REPLACE EXISTING  
// =============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  Zap, 
  Shield, 
  Sparkles,
  Clock,
  Target,
  ArrowRight,
  Upload
} from 'lucide-react';

// Import components (will be created in Phase 2)
import AnalysisForm from './components/AnalysisForm';
import Navigation from './components/Navigation';
import { useAuth } from './components/AuthContext';
import { SimpleMotion, preloadMotion } from './components/SimpleMotion';

// =============================================================================
// MAIN WEBAPP COMPONENT - ANALYSIS FOCUSED
// =============================================================================

function App() {
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const { currentUser, loading, isOfflineMode } = useAuth();

  // Preload motion after component mounts
  useEffect(() => {
    preloadMotion();
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleAnalysisComplete = (results) => {
    setHasAnalysis(true);
    setTimeout(() => {
      document.querySelector('#analysis-results')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  const scrollToUpload = useCallback(() => {
    document.querySelector('#upload-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }, []);

  // =============================================================================
  // WEBAPP FEATURES DATA
  // =============================================================================

  const webappFeatures = [
    {
      icon: Search,
      title: 'AI Image Analysis',
      description: 'Advanced AI examines your images for style, composition, lighting, and subject matter.',
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: Zap,
      title: 'Instant Prompts',
      description: 'Get detailed, ready-to-use prompts for any AI art generator in seconds.',
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500/20 to-orange-500/20'
    },
    {
      icon: Target,
      title: 'Multi-Engine Support',
      description: 'Optimized prompts for Midjourney, DALL·E, Stable Diffusion, and more.',
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Images are deleted immediately after analysis. No data retention.',
      color: 'text-green-400',
      bgGradient: 'from-green-500/20 to-emerald-500/20'
    }
  ];

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading WebApp...</p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN WEBAPP RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Analysis Focused */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Content */}
          <SimpleMotion type="fadeIn" delay={0.2}>
            <div className="mb-12">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
                🔍 <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  PromptSherlock
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-3xl mx-auto">
                AI-Powered Image Analysis Tool
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-8"></div>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Upload your images and get detailed AI prompts for Midjourney, DALL·E, Stable Diffusion, and more. 
                Turn any image into the perfect AI art prompt.
              </p>
            </div>
          </SimpleMotion>

          {/* CTA Button */}
          <SimpleMotion type="slideUp" delay={0.4}>
            <button 
              onClick={scrollToUpload}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg rounded-2xl 
                         transition-all duration-300 hover:scale-105 hover:shadow-glow group"
            >
              <Upload className="w-6 h-6 mr-3 group-hover:animate-bounce" />
              Start Analyzing Images
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </SimpleMotion>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <SimpleMotion type="slideUp" delay={0.6}>
            <h2 className="text-4xl font-bold text-white text-center mb-4">
              Powerful Analysis Features
            </h2>
            <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
              Everything you need to create perfect AI art prompts from your images
            </p>
          </SimpleMotion>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {webappFeatures.map((feature, index) => (
              <SimpleMotion key={feature.title} type="slideUp" delay={0.2 * (index + 4)}>
                <div className={`glass-effect p-6 rounded-2xl hover:scale-105 transition-all duration-300
                                group cursor-pointer bg-gradient-to-br ${feature.bgGradient}`}>
                  <div className="flex items-center justify-center mb-4">
                    <feature.icon className={`w-12 h-12 ${feature.color} group-hover:scale-110 transition-transform`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-center text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </SimpleMotion>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis Form Section */}
      <section id="upload-section" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <SimpleMotion type="slideUp" delay={0.8}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Upload & Analyze Your Images
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Drop your images below and let our AI create detailed prompts for your favorite AI art generators.
              </p>
            </div>
          </SimpleMotion>

          {/* Analysis Form Component */}
          <SimpleMotion type="slideUp" delay={1.0}>
            <div className="glass-effect p-8 rounded-3xl">
              <AnalysisForm 
                apiUrl={import.meta.env.VITE_API_URL}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          </SimpleMotion>
        </div>
      </section>

      {/* Results Section - Shows after analysis */}
      {hasAnalysis && (
        <section id="analysis-results" className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <SimpleMotion type="slideUp">
              <div className="glass-effect p-8 rounded-3xl">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse-glow" />
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Analysis Complete!
                  </h2>
                  <p className="text-gray-300">
                    Your AI prompts are ready. Scroll down to see the results.
                  </p>
                </div>
              </div>
            </SimpleMotion>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-blue-400 mr-3" />
            <span className="text-2xl font-bold text-white">PromptSherlock WebApp</span>
          </div>
          <p className="text-gray-400 mb-6">
            Advanced AI image analysis for creative professionals
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="https://promptsherlock.ai" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
              Landing Page
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;