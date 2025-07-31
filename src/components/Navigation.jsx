// =============================================================================
// WEBAPP MINIMAL COMPONENTS - FOR BUILD SUCCESS
// Create these as separate files in src/components/
// =============================================================================

// FILE: src/components/Navigation.jsx
import React from 'react';
import { Search } from 'lucide-react';

const Navigation = () => (
  <nav className="fixed top-0 w-full z-50 nav-glass p-4">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center">
        <Search className="w-8 h-8 text-blue-400 mr-3" />
        <span className="text-2xl font-bold text-white">PromptSherlock</span>
      </div>
      <div className="text-sm text-gray-300">WebApp</div>
    </div>
  </nav>
);

export default Navigation;

// =============================================================================

// FILE: src/components/AnalysisForm.jsx
import React from 'react';
import { Upload, Sparkles } from 'lucide-react';

const AnalysisForm = ({ apiUrl, onAnalysisComplete }) => (
  <div className="text-center p-8">
    <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
    <h3 className="text-3xl font-bold text-white mb-4">Analysis Form</h3>
    <p className="text-gray-300 mb-6">
      Components will be migrated in Phase 2!
    </p>
    <div className="glass-effect p-6 rounded-xl">
      <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
      <p className="text-white">
        Ready for image upload and AI analysis functionality.
      </p>
    </div>
  </div>
);

export default AnalysisForm;

// =============================================================================

// FILE: src/pages/Privacy.jsx
import React from 'react';

const Privacy = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 pt-20 p-4">
    <div className="max-w-4xl mx-auto">
      <div className="glass-effect p-8 rounded-2xl">
        <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>
        <p className="text-gray-300">Privacy policy content coming soon...</p>
      </div>
    </div>
  </div>
);

export default Privacy;

// =============================================================================

// FILE: src/pages/Terms.jsx
import React from 'react';

const Terms = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 pt-20 p-4">
    <div className="max-w-4xl mx-auto">
      <div className="glass-effect p-8 rounded-2xl">
        <h1 className="text-4xl font-bold text-white mb-6">Terms of Service</h1>
        <p className="text-gray-300">Terms of service content coming soon...</p>
      </div>
    </div>
  </div>
);

export default Terms;

// =============================================================================

// FILE: src/pages/NotFound.jsx
import React from 'react';
import { Search } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
    <div className="text-center">
      <Search className="w-24 h-24 text-blue-400 mx-auto mb-6" />
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-xl text-gray-300 mb-8">Page not found</p>
      <a 
        href="/"
        className="btn-primary inline-block"
      >
        Back to WebApp
      </a>
    </div>
  </div>
);

export default NotFound;