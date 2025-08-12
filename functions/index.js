// functions/index.js
// Firebase Cloud Functions for Usage Reset System

const { setGlobalOptions } = require('firebase-functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

// Set global options for cost control (keeping your existing setting)
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// =============================================================================
// SCHEDULED FUNCTIONS - AUTOMATIC RESETS
// =============================================================================

/**
 * Daily Reset Function - Runs every day at 00:00 UTC
 * Resets dailyUsage for all users
 */
exports.resetDailyUsage = onSchedule({
  schedule: '0 0 * * *', // Every day at midnight UTC
  timeZone: 'UTC',
  region: 'us-central1'
}, async (event) => {
  logger.info('🔄 Starting daily usage reset...');
  
  try {
    const resetTime = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    let userCount = 0;
    let batchCount = 0;
    
    // Get all users in batches (Firestore limit is 500 operations per batch)
    const usersSnapshot = await db.collection('users').get();
    
    logger.info(`📊 Found ${usersSnapshot.size} users to reset daily usage`);
    
    usersSnapshot.forEach((doc) => {
      // Reset daily usage and update reset timestamp
      batch.update(doc.ref, {
        dailyUsage: 0,
        lastDailyReset: resetTime
      });
      
      userCount++;
      batchCount++;
      
      // Commit batch every 400 operations (safe limit)
      if (batchCount >= 400) {
        batch.commit();
        batchCount = 0;
      }
    });
    
    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // Update global reset timestamp in config
    await db.doc('config/limits').update({
      lastDailyReset: resetTime
    });
    
    logger.info(`✅ Daily reset completed successfully for ${userCount} users`);
    
    return {
      success: true,
      usersReset: userCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('❌ Daily reset failed:', error);
    throw error;
  }
});

/**
 * Weekly Reset Function - Runs every Monday at 00:00 UTC
 * Resets weeklyUsage for all users
 */
exports.resetWeeklyUsage = onSchedule({
  schedule: '0 0 * * 1', // Every Monday at midnight UTC
  timeZone: 'UTC',
  region: 'us-central1'
}, async (event) => {
  logger.info('🔄 Starting weekly usage reset...');
  
  try {
    const resetTime = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    let userCount = 0;
    let batchCount = 0;
    
    const usersSnapshot = await db.collection('users').get();
    
    logger.info(`📊 Found ${usersSnapshot.size} users to reset weekly usage`);
    
    usersSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        weeklyUsage: 0,
        lastWeeklyReset: resetTime
      });
      
      userCount++;
      batchCount++;
      
      if (batchCount >= 400) {
        batch.commit();
        batchCount = 0;
      }
    });
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // Update global reset timestamp
    await db.doc('config/limits').update({
      lastWeeklyReset: resetTime
    });
    
    logger.info(`✅ Weekly reset completed successfully for ${userCount} users`);
    
    return {
      success: true,
      usersReset: userCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('❌ Weekly reset failed:', error);
    throw error;
  }
});

/**
 * Monthly Reset Function - Runs on 1st day of every month at 00:00 UTC
 * Resets monthlyUsage for all users
 */
exports.resetMonthlyUsage = onSchedule({
  schedule: '0 0 1 * *', // 1st day of every month at midnight UTC
  timeZone: 'UTC',
  region: 'us-central1'
}, async (event) => {
  logger.info('🔄 Starting monthly usage reset...');
  
  try {
    const resetTime = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    let userCount = 0;
    let batchCount = 0;
    
    const usersSnapshot = await db.collection('users').get();
    
    logger.info(`📊 Found ${usersSnapshot.size} users to reset monthly usage`);
    
    usersSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        monthlyUsage: 0,
        lastMonthlyReset: resetTime
      });
      
      userCount++;
      batchCount++;
      
      if (batchCount >= 400) {
        batch.commit();
        batchCount = 0;
      }
    });
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    // Update global reset timestamp
    await db.doc('config/limits').update({
      lastMonthlyReset: resetTime
    });
    
    logger.info(`✅ Monthly reset completed successfully for ${userCount} users`);
    
    return {
      success: true,
      usersReset: userCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('❌ Monthly reset failed:', error);
    throw error;
  }
});

// =============================================================================
// MANUAL TRIGGER FUNCTIONS - FOR TESTING AND ADMIN
// =============================================================================

/**
 * Manual Reset Trigger - HTTP Function for admin use
 * Allows manual triggering of resets for testing
 */
exports.manualReset = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { resetType, adminKey } = req.body;
  
  // Simple admin key check (you should set this in your environment)
  const expectedAdminKey = process.env.ADMIN_RESET_KEY || 'your-secret-admin-key';
  if (adminKey !== expectedAdminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    let result;
    
    switch (resetType) {
      case 'daily':
        result = await resetUsage('daily');
        break;
      case 'weekly':
        result = await resetUsage('weekly');
        break;
      case 'monthly':
        result = await resetUsage('monthly');
        break;
      case 'all':
        const daily = await resetUsage('daily');
        const weekly = await resetUsage('weekly');
        const monthly = await resetUsage('monthly');
        result = {
          daily: daily.usersReset,
          weekly: weekly.usersReset,
          monthly: monthly.usersReset,
          total: daily.usersReset
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid reset type' });
    }
    
    logger.info(`✅ Manual ${resetType} reset completed:`, result);
    
    res.json({
      success: true,
      resetType,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`❌ Manual ${resetType} reset failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health Check Function - Check if functions are working
 */
exports.healthCheck = onRequest({
  cors: true,
  region: 'us-central1'
}, async (req, res) => {
  try {
    // Check Firestore connection
    const configDoc = await db.doc('config/limits').get();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      firestoreConnected: configDoc.exists,
      functions: {
        resetDailyUsage: 'Scheduled: 0 0 * * * UTC',
        resetWeeklyUsage: 'Scheduled: 0 0 * * 1 UTC',
        resetMonthlyUsage: 'Scheduled: 0 0 1 * * UTC'
      },
      lastResets: configDoc.exists ? {
        daily: configDoc.data()?.lastDailyReset || null,
        weekly: configDoc.data()?.lastWeeklyReset || null,
        monthly: configDoc.data()?.lastMonthlyReset || null
      } : null
    });
    
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generic reset function used by manual triggers
 */
async function resetUsage(type) {
  const resetTime = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();
  let userCount = 0;
  let batchCount = 0;
  
  const usersSnapshot = await db.collection('users').get();
  
  const fieldMap = {
    daily: 'dailyUsage',
    weekly: 'weeklyUsage',
    monthly: 'monthlyUsage'
  };
  
  const resetFieldMap = {
    daily: 'lastDailyReset',
    weekly: 'lastWeeklyReset',
    monthly: 'lastMonthlyReset'
  };
  
  const configFieldMap = {
    daily: 'lastDailyReset',
    weekly: 'lastWeeklyReset',
    monthly: 'lastMonthlyReset'
  };
  
  usersSnapshot.forEach((doc) => {
    const updateData = {
      [fieldMap[type]]: 0,
      [resetFieldMap[type]]: resetTime
    };
    
    batch.update(doc.ref, updateData);
    
    userCount++;
    batchCount++;
    
    if (batchCount >= 400) {
      batch.commit();
      batchCount = 0;
    }
  });
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  // Update global config
  await db.doc('config/limits').update({
    [configFieldMap[type]]: resetTime
  });
  
  return {
    success: true,
    usersReset: userCount,
    resetType: type
  };
}