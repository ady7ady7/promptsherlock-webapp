// =============================================================================
// SIMPLE WEBAPP MAIN.JSX - FOR TESTING DEPLOYMENT
// File: webapp/src/main.jsx
// =============================================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">
            🔍 PromptSherlock
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            WebApp
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Status Card */}
        <div className="glass-effect p-8 rounded-2xl mb-8 animate-slide-up">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
            <span className="text-green-400 font-semibold">Phase 1.1 Complete</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            🚧 Foundation Ready!
          </h2>
          
          <p className="text-gray-300 mb-6">
            WebApp infrastructure is set up and deployed successfully. 
            Ready for component migration in Phase 2!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="text-green-400 font-semibold">✅ Completed</div>
              <div className="text-gray-300">Build System</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="text-green-400 font-semibold">✅ Completed</div>
              <div className="text-gray-300">Deployment</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="text-yellow-400 font-semibold">🔄 Next</div>
              <div className="text-gray-300">Components</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="text-yellow-400 font-semibold">🔄 Next</div>
              <div className="text-gray-300">API Integration</div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-gray-400 text-sm">
          <p>Environment: {import.meta.env.MODE}</p>
          <p>Build: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)