// backend/services/firestoreConfigService.js
/**
 * Firestore Configuration Service
 * Manages dynamic configuration and limits from Firestore database
 * ONLY ADDS LIMIT FETCHING - DOESN'T CHANGE EXISTING FUNCTIONALITY
 */

import { db } from '../server.js';

class FirestoreConfigService {
  constructor() {
    this.configCache = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    this.CONFIG_DOC_PATH = 'config/limits';
  }

  /**
   * Get configuration from Firestore with caching
   * @returns {Object} Configuration object
   */
  async getConfig() {
    try {
      // Return cached config if still valid
      if (this.configCache && this.cacheExpiry > Date.now()) {
        console.log('📋 Using cached Firestore config');
        return this.configCache;
      }

      console.log('🔄 Fetching fresh config from Firestore...');
      const configDoc = await db.doc(this.CONFIG_DOC_PATH).get();

      if (!configDoc.exists) {
        console.warn('⚠️ Config document not found, creating default...');
        await this.createDefaultConfig();
        return this.getDefaultConfig();
      }

      const config = configDoc.data();
      
      // Cache the config
      this.configCache = config;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      console.log('✅ Firestore config loaded:', {
        anonymousLimit: config.anonymousLimit,
        tiers: Object.keys(config.tiers || {}),
        cachedUntil: new Date(this.cacheExpiry).toISOString()
      });

      return config;
    } catch (error) {
      console.error('❌ Error fetching Firestore config:', error);
      // Return default config on error
      return this.getDefaultConfig();
    }
  }

  /**
   * Get limits for a specific user
   * @param {Object} user - User object with uid and tier info
   * @returns {Object} User's limits
   */
  async getUserLimits(user) {
    try {
      const config = await this.getConfig();
      
      // Determine user tier
      let userTier = 'free'; // default
      
      if (user.isPro) {
        userTier = 'pro';
      } else if (user.isAdmin) {
        userTier = 'admin';
      }

      const tierLimits = config.tiers?.[userTier] || config.tiers?.free;
      
      return {
        tier: userTier,
        anonymousLimit: config.anonymousLimit || 5,
        dailyLimit: tierLimits?.dailyLimit || 10,
        weeklyLimit: tierLimits?.weeklyLimit || 50,
        monthlyLimit: tierLimits?.monthlyLimit || 200,
        isUnlimited: userTier === 'admin' || (userTier === 'pro' && tierLimits?.dailyLimit === -1)
      };
    } catch (error) {
      console.error('❌ Error getting user limits:', error);
      // Return safe defaults
      return {
        tier: 'free',
        anonymousLimit: 5,
        dailyLimit: 10,
        weeklyLimit: 50,
        monthlyLimit: 200,
        isUnlimited: false
      };
    }
  }

  /**
   * Check if user has exceeded any limits
   * @param {string} userId - User ID
   * @param {Object} limits - User's limits
   * @returns {Object} Limit check result
   */
  async checkUserLimits(userId, limits) {
    try {
      if (limits.isUnlimited) {
        return { allowed: true, reason: 'unlimited' };
      }

      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() || {};

      // For anonymous users, just check the simple usage count
      if (!userData.isPro && !userData.isAdmin) {
        const currentUsage = userData.usageCount || 0;
        
        if (currentUsage >= limits.anonymousLimit) {
          return {
            allowed: false,
            reason: 'anonymous_limit_exceeded',
            current: currentUsage,
            limit: limits.anonymousLimit,
            resetTime: null
          };
        }
        
        return {
          allowed: true,
          current: currentUsage,
          limit: limits.anonymousLimit,
          remaining: limits.anonymousLimit - currentUsage
        };
      }

      // For pro/admin users, check time-based limits
      const now = new Date();
      const usage = await this.getUserUsageStats(userId, now);

      // Check daily limit
      if (limits.dailyLimit > 0 && usage.daily >= limits.dailyLimit) {
        return {
          allowed: false,
          reason: 'daily_limit_exceeded',
          current: usage.daily,
          limit: limits.dailyLimit,
          resetTime: this.getNextResetTime('daily', now)
        };
      }

      // Check weekly limit
      if (limits.weeklyLimit > 0 && usage.weekly >= limits.weeklyLimit) {
        return {
          allowed: false,
          reason: 'weekly_limit_exceeded',
          current: usage.weekly,
          limit: limits.weeklyLimit,
          resetTime: this.getNextResetTime('weekly', now)
        };
      }

      // Check monthly limit
      if (limits.monthlyLimit > 0 && usage.monthly >= limits.monthlyLimit) {
        return {
          allowed: false,
          reason: 'monthly_limit_exceeded',
          current: usage.monthly,
          limit: limits.monthlyLimit,
          resetTime: this.getNextResetTime('monthly', now)
        };
      }

      return {
        allowed: true,
        usage: usage,
        limits: limits,
        remaining: {
          daily: Math.max(0, limits.dailyLimit - usage.daily),
          weekly: Math.max(0, limits.weeklyLimit - usage.weekly),
          monthly: Math.max(0, limits.monthlyLimit - usage.monthly)
        }
      };

    } catch (error) {
      console.error('❌ Error checking user limits:', error);
      // On error, allow but log
      return { allowed: true, error: error.message };
    }
  }

  /**
   * Get user usage statistics for different time periods
   * @param {string} userId - User ID
   * @param {Date} now - Current date
   * @returns {Object} Usage statistics
   */
  async getUserUsageStats(userId, now = new Date()) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() || {};

      // For simple counting (current implementation)
      const totalUsage = userData.usageCount || 0;

      // Calculate time boundaries
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // If you want detailed time-based tracking, query usage collection
      // For now, we'll use the simple usageCount and distribute it
      // You can enhance this later with actual timestamp-based tracking

      return {
        total: totalUsage,
        daily: userData.dailyUsage || 0,
        weekly: userData.weeklyUsage || 0,
        monthly: userData.monthlyUsage || 0,
        lastReset: userData.lastUsageReset || null
      };

    } catch (error) {
      console.error('❌ Error getting usage stats:', error);
      return { total: 0, daily: 0, weekly: 0, monthly: 0 };
    }
  }

  /**
   * Update configuration in Firestore
   * @param {Object} newConfig - New configuration
   * @returns {boolean} Success status
   */
  async updateConfig(newConfig) {
    try {
      await db.doc(this.CONFIG_DOC_PATH).set(newConfig, { merge: true });
      
      // Clear cache to force refresh
      this.configCache = null;
      this.cacheExpiry = null;

      console.log('✅ Firestore config updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating Firestore config:', error);
      return false;
    }
  }

  /**
   * Create default configuration document
   */
  async createDefaultConfig() {
    const defaultConfig = this.getDefaultConfig();
    
    try {
      await db.doc(this.CONFIG_DOC_PATH).set(defaultConfig);
      console.log('✅ Default Firestore config created');
    } catch (error) {
      console.error('❌ Error creating default config:', error);
    }
  }

  /**
   * Get default configuration structure
   */
  getDefaultConfig() {
    return {
      anonymousLimit: 5,
      tiers: {
        free: {
          dailyLimit: 10,
          weeklyLimit: 50,
          monthlyLimit: 200
        },
        pro: {
          dailyLimit: 100,
          weeklyLimit: 500,
          monthlyLimit: 2000
        },
        admin: {
          dailyLimit: -1, // -1 means unlimited
          weeklyLimit: -1,
          monthlyLimit: -1
        }
      },
      features: {
        rateLimiting: {
          windowMs: 900000, // 15 minutes
          maxRequests: 100
        },
        fileUpload: {
          maxFileSize: 10485760, // 10MB
          maxFiles: 10
        }
      },
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Get next reset time for a given period
   */
  getNextResetTime(period, now = new Date()) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    switch (period) {
      case 'daily':
        return tomorrow;
      case 'weekly':
        const nextWeek = new Date(tomorrow);
        nextWeek.setDate(tomorrow.getDate() + (7 - tomorrow.getDay()));
        return nextWeek;
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      default:
        return tomorrow;
    }
  }

  /**
   * Force refresh config cache
   */
  refreshCache() {
    this.configCache = null;
    this.cacheExpiry = null;
    console.log('🔄 Firestore config cache cleared');
  }

  /**
   * Get all users usage statistics (for monitoring)
   * @param {number} limit - Number of users to fetch
   * @returns {Array} Users usage data
   */
  async getAllUsersUsage(limit = 100) {
    try {
      const usersSnapshot = await db.collection('users')
        .orderBy('usageCount', 'desc')
        .limit(limit)
        .get();

      const usersData = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        usersData.push({
          userId: doc.id,
          usageCount: data.usageCount || 0,
          isPro: data.isPro || false,
          isAdmin: data.isAdmin || false,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin
        });
      });

      return usersData;
    } catch (error) {
      console.error('❌ Error getting all users usage:', error);
      return [];
    }
  }

  /**
   * Get usage statistics summary
   * @returns {Object} Usage summary
   */
  async getUsageSummary() {
    try {
      const usersSnapshot = await db.collection('users').get();
      
      let totalUsers = 0;
      let totalUsage = 0;
      let proUsers = 0;
      let activeUsers = 0;
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        totalUsers++;
        totalUsage += data.usageCount || 0;
        
        if (data.isPro) proUsers++;
        if (data.lastLogin && data.lastLogin.toDate() > yesterday) {
          activeUsers++;
        }
      });

      return {
        totalUsers,
        totalUsage,
        proUsers,
        freeUsers: totalUsers - proUsers,
        activeUsers,
        averageUsagePerUser: totalUsers > 0 ? Math.round(totalUsage / totalUsers) : 0,
        timestamp: now.toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting usage summary:', error);
      return null;
    }
  }
}

// Export singleton instance
export const firestoreConfigService = new FirestoreConfigService();