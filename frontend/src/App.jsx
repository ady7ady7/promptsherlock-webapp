import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            AI Image Analyzer
          </h1>
          <p className="text-blue-200 text-lg">
            Upload and analyze your images with AI-powered insights
          </p>
        </header>
        
        <div className="text-center">
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Development Mode
            </h2>
            <p className="text-blue-200 mb-6">
              Frontend is running successfully!
            </p>
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Count: {count}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App