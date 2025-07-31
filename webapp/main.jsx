import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          PromptSherlock WebApp
        </h1>
        <p className="text-xl text-blue-200 mb-8">
          🚧 Under Construction - Phase 1.1 Complete!
        </p>
        <div className="glass-effect p-8 rounded-2xl">
          <p className="text-white">
            WebApp foundation is ready. Components coming next!
          </p>
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