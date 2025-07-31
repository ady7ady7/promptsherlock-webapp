// =============================================================================
// WEBAPP AUTH CONTEXT - ESSENTIAL FOR BUILD
// File: src/components/AuthContext.jsx
// =============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// AUTH CONTEXT SETUP
// =============================================================================

const AuthContext = createContext();

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth Provider Component - Minimal implementation for now
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode] = useState(false);

  // Initialize auth (placeholder for now)
  useEffect(() => {
    setLoading(false);
    console.log('🔐 Auth initialized (placeholder mode)');
  }, []);

  const value = {
    currentUser,
    loading,
    isOfflineMode,
    // Placeholder methods
    signIn: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
    signUp: () => Promise.resolve()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthProvider;