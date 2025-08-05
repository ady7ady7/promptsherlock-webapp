// =============================================================================
// CLEANED APP.JSX - CORE FUNCTIONALITY ONLY
// File: frontend/src/App.jsx - REPLACE EXISTING  
// =============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  Shield, 
  Heart, 
  Sparkles,
  Clock
} from 'lucide-react';

// Import components
import AnalysisForm from './components/AnalysisForm';
import Navigation from './components/Navigation';
import { useAuth } from './components/AuthContext';
import { SimpleMotion, preloadMotion } from './components/SimpleMotion';

// =============================================================================
// MAIN APP COMPONENT
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
  // RENDER COMPONENTS
  // =============================================================================

  const renderHeader = () => (
    <header className="text-center mb-16">
      {/* Logo and Brand */}
      <SimpleMotion
        className="flex items-center justify-center mb-6"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <SimpleMotion
          className="glass-effect p-4 rounded-2xl mr-4"
          whileHover={{ 
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
            scale: 1.1 
          }}
          transition={{ duration: 0.3 }}
        >
          <Search className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
        </SimpleMotion>
        
        <h1 className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold">
          Prompt Sherlock
        </h1>
      </SimpleMotion>

      {/* Core Description */}
      <div className="max-w-3xl mx-auto mb-8">
        <p className="text-blue-200 text-lg md:text-xl lg:text-2xl mb-4 italic">
          Turn any image into the perfect AI art prompt.
        </p>
      </div>

      {/* Main CTA Section */}
      <SimpleMotion
        className="max-w-4xl mx-auto mb-12 glass-effect p-8 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <p className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center">
          <strong className="gradient-text">Upload up to 10 images</strong> and let Prompt Sherlock instantly "investigate" every detail—style, mood, characters, composition, and more. Get ready-to-use prompts, tailored for top AI engines.
        </p>
        
        {/* Offline Mode Notice */}
        {isOfflineMode && (
          <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
            <div className="flex items-center justify-center text-orange-300">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm">Running in offline mode - some features may be limited</span>
            </div>
          </div>
        )}
        
        {/* CTA Button */}
        <div className="text-center">
          <SimpleMotion
            className="glass-button px-10 py-5 text-white font-bold text-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 border border-blue-400/30 mx-auto cursor-pointer inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={scrollToUpload}
          >
            Get Started Now
          </SimpleMotion>
          
          <p className="text-gray-400 text-sm mt-4">
            Upload Your First Image and See Sherlock in Action!
          </p>
        </div>
      </SimpleMotion>
    </header>
  );

  const renderMainContent = () => (
    <SimpleMotion
      className="main"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.0 }}
      id="upload-section"
    >
      <AnalysisForm
        onAnalysisComplete={handleAnalysisComplete}
        apiUrl={import.meta.env.VITE_API_URL}
      />
    </SimpleMotion>
  );

  const renderFooter = () => (
    <SimpleMotion
      className="mt-20 pt-12 border-t border-white/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.2 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <Search className="w-6 h-6 text-blue-400 mr-2" />
              <span className="gradient-text font-bold text-xl">Prompt Sherlock</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered tool that investigates images to create perfect AI art prompts.
            </p>
          </div>

          {/* Privacy Statement */}
          <div className="text-center">
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center">
              <Shield className="w-5 h-5 mr-2 text-green-400" />
              Privacy Promise
            </h4>
            <p className="text-gray-400 text-sm">
              Your images are processed securely and deleted immediately after analysis. 
              We never store or share your data.
            </p>
          </div>

          {/* Powered By */}
          <div className="text-center md:text-right">
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center md:justify-end">
              <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
              Powered By
            </h4>
            <div className="space-y-1 text-gray-400 text-sm">
              <p>Google Gemini</p>
              <p>React & Tailwind CSS</p>
              <p>Framer Motion</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <Navigation />

        {/* Copyright */}
        <div className="text-center py-6 border-t border-white/5 mt-8">
          <SimpleMotion 
            className="text-gray-500 text-sm flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Made with <Heart className="w-4 h-4 mx-1 text-red-400" /> for the creative community
          </SimpleMotion>
          <p className="text-gray-600 text-xs mt-2">
            © 2024 Prompt Sherlock. Privacy-focused AI prompt generation.
          </p>
        </div>
      </div>
    </SimpleMotion>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <SimpleMotion
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {renderHeader()}
          {renderMainContent()}
          {renderFooter()}
        </SimpleMotion>
      </div>
    </div>
  );
}

export default App;