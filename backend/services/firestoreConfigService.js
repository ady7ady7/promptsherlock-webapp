// backend/services/firestoreConfigService.js
/**
 * Firestore Configuration Service - UPDATED FOR NEW TIER SCHEME
 * Manages dynamic configuration and limits from Firestore database
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
   * Get limits for a specific user by UID (NEW TIER-BASED)
   * @param {string} userId - User UID
   * @returns {Object} User's limits
   */
  async getUserLimits(userId) {
    try {
      const config = await this.getConfig();
      
      // Get user data from Firestore to determine actual tier
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() || {};
      
      // Determine user tier from new scheme
      let userTier = userData.tier || 'free';
      
      // Handle legacy users during migration (TEMPORARY)
      if (!userData.tier && (userData.isPro || userData.isAdmin)) {
        if (userData.isAdmin) {
          userTier = 'admin';
        } else if (userData.isPro) {
          userTier = 'pro';
        }
        
        // Optionally migrate legacy user to new scheme
        console.log(`🔄 Migrating legacy user ${userId} to tier: ${userTier}`);
        await db.collection('users').doc(userId).update({ tier: userTier });
      }

      const tierLimits = config.tiers?.[userTier] || config.tiers?.free;
      
      return {
        tier: userTier,
        anonymousLimit: config.anonymousLimit || 3,
        dailyLimit: tierLimits?.dailyLimit || 3,
        weeklyLimit: tierLimits?.weeklyLimit || 15,
        monthlyLimit: tierLimits?.monthlyLimit || 50,
        isUnlimited: userTier === 'admin' || (userTier === 'pro' && tierLimits?.dailyLimit === -1)
      };
    } catch (error) {
      console.error('❌ Error getting user limits:', error);
      // Return safe defaults
      return {
        tier: 'free',
        anonymousLimit: 3,
        dailyLimit: 3,
        weeklyLimit: 15,
        monthlyLimit: 50,
        isUnlimited: false
      };
    }
  }

  /**
   * Check if user has exceeded any limits (NEW TIER-BASED)
   * @param {string} userId - User ID
   * @param {Object} limits - User's limits (optional, will fetch if not provided)
   * @returns {Object} Limit check result
   */
  async checkUserLimits(userId, limits = null) {
    try {
      // Get limits if not provided
      if (!limits) {
        limits = await this.getUserLimits(userId);
      }

      if (limits.isUnlimited) {
        return { allowed: true, reason: 'unlimited' };
      }

      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() || {};
      const userTier = userData.tier || 'free';

      // For anonymous/free users, check against their daily usage
      const dailyUsage = userData.dailyUsage || 0;
      const weeklyUsage = userData.weeklyUsage || 0;
      const monthlyUsage = userData.monthlyUsage || 0;

      // Check daily limit
      if (limits.dailyLimit > 0 && dailyUsage >= limits.dailyLimit) {
        return {
          allowed: false,
          reason: 'daily_limit_exceeded',
          current: dailyUsage,
          limit: limits.dailyLimit,
          resetTime: this.getNextResetTime('daily')
        };
      }

      // Check weekly limit
      if (limits.weeklyLimit > 0 && weeklyUsage >= limits.weeklyLimit) {
        return {
          allowed: false,
          reason: 'weekly_limit_exceeded',
          current: weeklyUsage,
          limit: limits.weeklyLimit,
          resetTime: this.getNextResetTime('weekly')
        };
      }

      // Check monthly limit
      if (limits.monthlyLimit > 0 && monthlyUsage >= limits.monthlyLimit) {
        return {
          allowed: false,
          reason: 'monthly_limit_exceeded',
          current: monthlyUsage,
          limit: limits.monthlyLimit,
          resetTime: this.getNextResetTime('monthly')
        };
      }

      return {
        allowed: true,
        usage: {
          daily: dailyUsage,
          weekly: weeklyUsage,
          monthly: monthlyUsage,
          total: userData.usageCount || 0
        },
        limits: limits,
        remaining: {
          daily: Math.max(0, limits.dailyLimit - dailyUsage),
          weekly: Math.max(0, limits.weeklyLimit - weeklyUsage),
          monthly: Math.max(0, limits.monthlyLimit - monthlyUsage)
        }
      };

    } catch (error) {
      console.error('❌ Error checking user limits:', error);
      // On error, allow but log
      return { allowed: true, error: error.message };
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
   * Get default configuration structure (NEW TIER-BASED)
   */
  getDefaultConfig() {
    return {
      enabled: true,
      maintenanceMode: false,
      anonymousLimit: 3,
      resetHour: 0,
      resetDay: 1,
      resetDate: 1,
      lastDailyReset: new Date(),
      lastWeeklyReset: new Date(),
      lastMonthlyReset: new Date(),
      maxFileSize: 10485760,
      maxFiles: 10,
      supportedFormats: ["jpeg", "jpg", "png", "gif", "webp"],
      tiers: {
        free: {
          name: "Free",
          dailyLimit: 3,
          weeklyLimit: 15,
          monthlyLimit: 50,
          maxFileSize: 5242880,
          maxFiles: 5,
          features: ["basic_analysis"],
          stripePriceId: null
        },
        pro: {
          name: "Pro",
          dailyLimit: 50,
          weeklyLimit: 300,
          monthlyLimit: 1000,
          maxFileSize: 10485760,
          maxFiles: 10,
          features: ["basic_analysis", "advanced_prompts", "history"],
          stripePriceId: "price_1ABC..."
        },
        admin: {
          name: "Admin",
          dailyLimit: -1,
          weeklyLimit: -1,
          monthlyLimit: -1,
          maxFileSize: 52428800,
          maxFiles: 20,
          features: ["all"],
          stripePriceId: null
        }
      },
      analytics: {
        trackUsage: true,
        trackErrors: true,
        retentionDays: 90
      },
      lastUpdated: new Date().toISOString(),
      version: '2.0.0'
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
   * Get all users usage statistics (UPDATED FOR NEW SCHEME)
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
          tier: data.tier || 'free',
          usageCount: data.usageCount || 0,
          dailyUsage: data.dailyUsage || 0,
          weeklyUsage: data.weeklyUsage || 0,
          monthlyUsage: data.monthlyUsage || 0,
          subscriptionId: data.subscriptionId || '',
          subscriptionStatus: data.subscriptionStatus || '',
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
   * Get usage statistics summary (UPDATED FOR NEW SCHEME)
   * @returns {Object} Usage summary
   */
  async getUsageSummary() {
    try {
      const usersSnapshot = await db.collection('users').get();
      
      let totalUsers = 0;
      let totalUsage = 0;
      let tierCounts = { free: 0, pro: 0, admin: 0 };
      let activeUsers = 0;
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        totalUsers++;
        totalUsage += data.usageCount || 0;
        
        const tier = data.tier || 'free';
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        
        if (data.lastLogin && data.lastLogin.toDate() > yesterday) {
          activeUsers++;
        }
      });

      return {
        totalUsers,
        totalUsage,
        tierCounts,
        activeUsers,
        averageUsagePerUser: totalUsers > 0 ? Math.round(totalUsage / totalUsers) : 0,
        timestamp: now.toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting usage summary:', error);
      return null;
    }
  }

  /**
   * Migrate legacy user to new tier scheme
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async migrateLegacyUser(userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData || userData.tier) {
        return true; // Already migrated or doesn't exist
      }

      let tier = 'free';
      if (userData.isAdmin) {
        tier = 'admin';
      } else if (userData.isPro) {
        tier = 'pro';
      }

      const updateData = {
        tier: tier,
        subscriptionId: '',
        subscriptionStatus: '',
        subscriptionEnd: new Date('2099-12-31'),
        dailyUsage: 0,
        weeklyUsage: 0,
        monthlyUsage: 0,
        lastDailyReset: new Date(),
        lastWeeklyReset: new Date(),
        lastMonthlyReset: new Date()
      };

      await db.collection('users').doc(userId).update(updateData);
      console.log(`✅ Migrated user ${userId} to tier: ${tier}`);
      return true;

    } catch (error) {
      console.error(`❌ Error migrating user ${userId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const firestoreConfigService = new FirestoreConfigService();