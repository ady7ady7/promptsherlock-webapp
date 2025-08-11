// =============================================================================
// CLEANED APP.JSX - CORE FUNCTIONALITY ONLY + USAGE COUNTER
// File: frontend/src/App.jsx - REPLACE EXISTING  
// =============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  Shield, 
  Heart, 
  Clock,
  TrendingUp // NEW: For usage counter
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
  const [usageStats, setUsageStats] = useState(null); // NEW: Usage stats state
  const { currentUser, loading, isOfflineMode } = useAuth();

  // Preload motion after component mounts
  useEffect(() => {
    preloadMotion();
  }, []);

  // NEW: Fetch usage stats on component mount
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze/live-stats`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUsageStats(data.stats);
          }
        }
      } catch (error) {
        console.log('Could not fetch usage stats:', error);
        // Silently fail - this is just for monitoring
      }
    };

    fetchUsageStats();
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleAnalysisComplete = (results) => {
    setHasAnalysis(true);
    
    // NEW: Update usage stats after successful analysis
    if (usageStats) {
      setUsageStats(prev => ({
        ...prev,
        totalAnalyses: prev.totalAnalyses + 1
      }));
    }
    
    setTimeout(() => {
      document.querySelector('#analysis-results')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  // Scroll to upload section (keeping for potential future use)
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

      {/* NEW: Subtle Usage Counter - Only show if we have stats */}
      {usageStats && (
        <SimpleMotion
          className="flex items-center justify-center text-gray-400 text-sm mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
          <span>
            {usageStats.totalAnalyses.toLocaleString()} analyses completed 
            {usageStats.activeUsers > 0 && (
              <span className="ml-2 text-blue-400">
                • {usageStats.activeUsers} active today
              </span>
            )}
          </span>
        </SimpleMotion>
      )}

      {/* Simple Offline Mode Notice - only show if needed */}
      {isOfflineMode && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
            <div className="flex items-center justify-center text-orange-300">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm">Running in offline mode - some features may be limited</span>
            </div>
          </div>
        </div>
      )}
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
        {/* Footer Content - Centered Privacy Only */}
        <div className="max-w-2xl mx-auto mb-8 text-center">
          {/* Privacy Statement */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center justify-center">
              <Shield className="w-5 h-5 mr-2 text-green-400" />
              Privacy Promise
            </h4>
            <p className="text-gray-400 text-sm">
              Your images are processed securely and deleted immediately after analysis. 
              We never store or share your data.
            </p>
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