import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import NotFound from './pages/NotFound.jsx';
import './index.css';
import { AuthProvider } from './components/AuthContext'; 

/**
 * Main Application Router Setup
 * 
 * Features:
 * - React Router configuration
 * - Route definitions for all pages
 * - 404 error handling
 * - Clean URL structure
 */
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Main Application Route */}
        <Route path="/" element={<App />} />
        
        {/* Legal Pages */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* 404 Error Page - Must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>,
);