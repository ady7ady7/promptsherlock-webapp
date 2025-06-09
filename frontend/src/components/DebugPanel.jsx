// frontend/src/components/DebugPanel.jsx
/**
 * Frontend Debug Panel Component
 * Tests API connectivity and displays detailed error information
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RefreshCw, 
  Globe, 
  Server,
  Wifi,
  Settings,
  Eye,
  Code
} from 'lucide-react';
import axios from 'axios';

const DebugPanel = ({ apiUrl, onClose }) => {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, total: 0 });

  // =============================================================================
  // TEST FUNCTIONS
  // =============================================================================

  const runTest = async (name, testFn) => {
    const testId = Date.now() + Math.random();
    
    // Add test to list with "running" status
    setTests(prev => [...prev, {
      id: testId,
      name,
      status: 'running',
      startTime: Date.now()
    }]);

    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;

      // Update test with success
      setTests(prev => prev.map(test => 
        test.id === testId ? {
          ...test,
          status: 'success',
          duration,
          result,
          endTime: Date.now()
        } : test
      ));

      return { success: true, result };

    } catch (error) {
      // Update test with error
      setTests(prev => prev.map(test => 
        test.id === testId ? {
          ...test,
          status: 'error',
          error: error.message,
          details: error.response?.data || error.toString(),
          endTime: Date.now()
        } : test
      ));

      return { success: false, error };
    }
  };

  const testBasicConnectivity = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DebugPanel/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - cannot reach backend (CORS or URL issue)');
      }
      throw error;
    }
  };

  const testCorsHeaders = async () => {
    const response = await axios.options(`${apiUrl}/api/analyze`, {
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 10000
    });

    return {
      status: response.status,
      corsHeaders: {
        'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
        'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
      }
    };
  };

  const testAnalyzeEndpoint = async () => {
    const response = await axios.post(`${apiUrl}/api/analyze`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      timeout: 10000,
      validateStatus: () => true
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  };

  const testFileUpload = async () => {
    // Create a test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple test pattern
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(25, 25, 50, 50);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TEST', 50, 55);

    // Convert to blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });

    const formData = new FormData();
    formData.append('images', blob, 'debug-test.png');
    formData.append('prompt', 'This is a debug test image from the frontend debug panel');

    const response = await axios.post(`${apiUrl}/api/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Origin': window.location.origin
      },
      timeout: 60000,
      validateStatus: () => true
    });

    return {
      status: response.status,
      success: response.data?.success,
      analysis: response.data?.analysis,
      error: response.data?.error,
      metadata: response.data?.metadata
    };
  };

  const testEnvironmentConfiguration = async () => {
    const frontendConfig = {
      apiUrl: apiUrl,
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      environment: import.meta.env.MODE,
      viteApiUrl: import.meta.env.VITE_API_URL
    };

    try {
      const backendResponse = await axios.get(`${apiUrl}/api/analyze/config`);
      return {
        frontend: frontendConfig,
        backend: backendResponse.data,
        match: {
          apiUrlConfigured: !!import.meta.env.VITE_API_URL,
          urlsMatch: import.meta.env.VITE_API_URL === apiUrl
        }
      };
    } catch (error) {
      return {
        frontend: frontendConfig,
        backend: null,
        error: error.message
      };
    }
  };

  // =============================================================================
  // MAIN TEST RUNNER
  // =============================================================================

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);
    setSummary({ passed: 0, failed: 0, total: 0 });

    const testSuite = [
      ['Basic Connectivity', testBasicConnectivity],
      ['Environment Config', testEnvironmentConfiguration],
      ['CORS Headers', testCorsHeaders],
      ['Analyze Endpoint', testAnalyzeEndpoint],
      ['File Upload Test', testFileUpload]
    ];

    let passed = 0;
    let failed = 0;

    for (const [name, testFn] of testSuite) {
      const result = await runTest(name, testFn);
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
    }

    setSummary({ passed, failed, total: passed + failed });
    setIsRunning(false);
  };

  // Run tests on mount
  useEffect(() => {
    runAllTests();
  }, [apiUrl]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full opacity-50" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'border-blue-400/50 bg-blue-500/10';
      case 'success': return 'border-green-400/50 bg-green-500/10';
      case 'error': return 'border-red-400/50 bg-red-500/10';
      default: return 'border-gray-400/50 bg-gray-500/10';
    }
  };

  const renderTestResult = (test) => (
    <motion.div
      key={test.id}
      className={`p-4 rounded-lg border ${getStatusColor(test.status)} mb-3`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {getStatusIcon(test.status)}
          <span className="font-medium text-white">{test.name}</span>
        </div>
        {test.duration && (
          <span className="text-sm text-gray-400">{test.duration}ms</span>
        )}
      </div>

      {/* Success Details */}
      {test.status === 'success' && test.result && (
        <div className="mt-3 p-3 bg-black/20 rounded-lg">
          <details className="text-sm">
            <summary className="cursor-pointer text-green-400 mb-2">
              ✅ Success Details
            </summary>
            <pre className="text-gray-300 text-xs overflow-x-auto">
              {JSON.stringify(test.result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Error Details */}
      {test.status === 'error' && (
        <div className="mt-3 space-y-2">
          <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
            <p className="text-red-300 text-sm font-medium">❌ {test.error}</p>
            {test.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-red-400 text-xs">
                  Show Details
                </summary>
                <pre className="text-red-200 text-xs mt-2 overflow-x-auto">
                  {typeof test.details === 'object' 
                    ? JSON.stringify(test.details, null, 2)
                    : test.details
                  }
                </pre>
              </details>
            )}
          </div>

          {/* Specific troubleshooting for common errors */}
          {test.error.includes('Network error') && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
              <p className="text-yellow-300 text-sm">
                💡 <strong>Likely Cause:</strong> CORS or backend URL issue
              </p>
              <ul className="text-yellow-200 text-xs mt-2 space-y-1">
                <li>• Check if VITE_API_URL is correctly set in Netlify</li>
                <li>• Verify backend is deployed and running on Render</li>
                <li>• Ensure FRONTEND_URL is set in backend environment</li>
              </ul>
            </div>
          )}

          {test.error.includes('CORS') && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
              <p className="text-yellow-300 text-sm">
                💡 <strong>CORS Issue:</strong> Backend doesn't allow this origin
              </p>
              <ul className="text-yellow-200 text-xs mt-2 space-y-1">
                <li>• Add your Netlify URL to backend FRONTEND_URL</li>
                <li>• Check CORS middleware configuration</li>
                <li>• Verify Origin header matches expected domain</li>
              </ul>
            </div>
          )}

          {test.error.includes('500') && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
              <p className="text-yellow-300 text-sm">
                💡 <strong>Server Error:</strong> Backend configuration issue
              </p>
              <ul className="text-yellow-200 text-xs mt-2 space-y-1">
                <li>• Check Render deployment logs for errors</li>
                <li>• Verify GEMINI_API_KEY is set correctly</li>
                <li>• Ensure all environment variables are configured</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderSummary = () => (
    <div className="glass-effect p-6 rounded-xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-400" />
          Debug Summary
        </h3>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="btn-outline px-4 py-2 text-sm flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Rerun Tests</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{summary.passed}</div>
          <div className="text-sm text-gray-400">Passed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{summary.failed}</div>
          <div className="text-sm text-gray-400">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{summary.total}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">API URL: {apiUrl}</span>
        <span className="text-gray-400">Origin: {window.location.origin}</span>
      </div>
    </div>
  );

  const renderQuickFixes = () => (
    <div className="glass-effect p-6 rounded-xl">
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Code className="w-5 h-5 mr-2 text-purple-400" />
        Quick Fixes
      </h4>

      <div className="space-y-4">
        {/* Environment Variables */}
        <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h5 className="font-medium text-blue-300 mb-2">🔧 Frontend Environment</h5>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Current VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'Not set'}</p>
            <p><strong>Expected format:</strong> https://your-backend.onrender.com</p>
            <p><strong>Set in Netlify:</strong> Site settings → Environment variables</p>
          </div>
        </div>

        {/* Backend CORS */}
        <div className="p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
          <h5 className="font-medium text-green-300 mb-2">🌐 Backend CORS</h5>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Set FRONTEND_URL in Render:</strong> {window.location.origin}</p>
            <p><strong>Render Dashboard:</strong> Environment tab</p>
            <p><strong>Redeploy after changes</strong></p>
          </div>
        </div>

        {/* Common URLs */}
        <div className="p-4 bg-purple-500/10 border border-purple-400/30 rounded-lg">
          <h5 className="font-medium text-purple-300 mb-2">📋 Common Deploy URLs</h5>
          <div className="text-xs text-gray-300 space-y-1">
            <p><strong>Netlify:</strong> https://your-site.netlify.app</p>
            <p><strong>Render:</strong> https://your-service.onrender.com</p>
            <p><strong>Note:</strong> URLs must match exactly (no trailing slashes)</p>
          </div>
        </div>
      </div>
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="min-h-screen p-4 flex items-start justify-center">
        <motion.div
          className="glass-effect-strong p-6 rounded-2xl max-w-4xl w-full my-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text">Debug Panel</h2>
                <p className="text-gray-400">API connectivity diagnostics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Summary */}
          {renderSummary()}

          {/* Test Results */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Wifi className="w-5 h-5 mr-2 text-blue-400" />
                Test Results
              </h3>
              <div className="space-y-3">
                {tests.map(renderTestResult)}
              </div>
            </div>

            {/* Quick Fixes */}
            {renderQuickFixes()}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DebugPanel;