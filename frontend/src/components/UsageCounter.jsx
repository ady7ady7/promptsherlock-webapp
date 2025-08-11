// frontend/src/components/UsageCounter.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { SimpleMotion } from './SimpleMotion';

const UsageCounter = ({ onUsageUpdate }) => {
  const [usageStats, setUsageStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, loading } = useAuth();

  const fetchUsage = async () => {
    if (!currentUser || loading) {
      console.log('🔍 UsageCounter: Skipping fetch - no user or still loading');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 UsageCounter: Starting fetch...');
      console.log('🔍 User ID:', currentUser.uid);
      console.log('🔍 API URL:', import.meta.env.VITE_API_URL);

      const token = await currentUser.getIdToken();
      console.log('🔍 Got token:', token.substring(0, 30) + '...');

      const url = `${import.meta.env.VITE_API_URL}/api/analyze/my-usage`;
      console.log('🔍 Full URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Request headers sent:', {
        'Authorization': `Bearer ${token.substring(0, 50)}...`,
        'Content-Type': 'application/json'
      });
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response URL:', response.url);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ UsageCounter: Success!', data);
        
        if (data.success) {
          setUsageStats(data.usage);
          if (onUsageUpdate) {
            onUsageUpdate(data.usage);
          }
        } else {
          setError('Invalid response format');
          console.log('❌ Invalid response:', data);
        }
      } else {
        const errorText = await response.text();
        setError(`HTTP ${response.status}`);
        console.log('❌ HTTP Error:', response.status, errorText);
      }
    } catch (err) {
      setError('Network error');
      console.log('❌ Network Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch usage on mount and when user changes
  useEffect(() => {
    console.log('🔍 UsageCounter: useEffect triggered', { 
      currentUser: !!currentUser, 
      loading 
    });
    fetchUsage();
  }, [currentUser, loading]);

  // Increment usage locally (called from parent)
  const incrementUsage = () => {
    if (usageStats && typeof usageStats.current === 'number') {
      setUsageStats(prev => ({
        ...prev,
        current: prev.current + 1,
        remaining: prev.remaining === 'unlimited' ? 'unlimited' : Math.max(0, prev.remaining - 1)
      }));
    }
  };

  // Expose increment function to parent
  useEffect(() => {
    if (onUsageUpdate) {
      onUsageUpdate({ incrementUsage });
    }
  }, [usageStats]);

  // Don't render anything if user not authenticated
  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm mb-4">
        <Clock className="w-4 h-4 mr-2 animate-spin" />
        <span>Loading user data...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <SimpleMotion
        className="flex items-center justify-center text-red-400 text-sm mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        <span>⚠️ Failed to load usage: {error}</span>
        <button 
          onClick={fetchUsage}
          className="ml-2 text-blue-400 hover:text-blue-300 underline"
        >
          Retry
        </button>
      </SimpleMotion>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm mb-4">
        <Clock className="w-4 h-4 mr-2 animate-spin" />
        <span>Fetching usage data...</span>
      </div>
    );
  }

  // Show usage stats
  if (usageStats) {
    return (
      <SimpleMotion
        className="flex items-center justify-center text-gray-400 text-sm mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
        <span>
          {usageStats.current} / {usageStats.limit === 'unlimited' ? '∞' : usageStats.limit} uses
          {usageStats.remaining !== 'unlimited' && usageStats.remaining !== undefined && (
            <span className="ml-2 text-green-400">
              • {usageStats.remaining} remaining
            </span>
          )}
          {usageStats.isPro && (
            <span className="ml-2 text-purple-400">• Pro</span>
          )}
          {usageStats.isAnonymous && (
            <span className="ml-2 text-yellow-400">• Anonymous</span>
          )}
        </span>
      </SimpleMotion>
    );
  }

  // Fallback - no stats available
  return (
    <div className="flex items-center justify-center text-orange-400 text-sm mb-4">
      <span>⚠️ Usage stats not available</span>
    </div>
  );
};

export default UsageCounter;