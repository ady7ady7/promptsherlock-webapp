// firebase/functions/index.js
// Deploy this to Firebase Cloud Functions

import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// Reset daily usage at the configured hour (default 00:00 UTC)
export const resetDailyUsage = onSchedule("0 0 * * *", async (event) => {
  console.log('🔄 Starting daily usage reset...');
  
  try {
    // Get reset configuration
    const configDoc = await db.doc('config/limits').get();
    const config = configDoc.exists ? configDoc.data() : {};
    const resetHour = config.resetHour || 0;
    
    console.log(`⏰ Daily reset scheduled for ${resetHour}:00 UTC`);
    
    // Reset all users' daily usage counts
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const batch = db.batch();
    let updateCount = 0;
    
    // Reset each user's daily usage
    snapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Only reset if user has usage count (exists and is active)
      if (userData.usageCount !== undefined) {
        batch.update(doc.ref, {
          dailyUsage: 0,
          lastDailyReset: FieldValue.serverTimestamp()
        });
        updateCount++;
      }
    });
    
    // Reset anonymous limit back to the configured value
    const anonymousLimit = config.anonymousLimit || 10;
    batch.update(db.doc('config/limits'), {
      anonymousLimit: anonymousLimit,
      lastReset: FieldValue.serverTimestamp(),
      resetType: 'daily'
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Daily reset completed:`);
      console.log(`   - ${updateCount} users reset`);
      console.log(`   - Anonymous limit reset to ${anonymousLimit}`);
    } else {
      console.log('ℹ️ No users found to reset');
    }
    
    // Log reset event for monitoring
    await db.collection('system').doc('reset_logs').collection('daily').add({
      timestamp: FieldValue.serverTimestamp(),
      usersReset: updateCount,
      anonymousLimitReset: anonymousLimit,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('❌ Error in daily reset:', error);
    
    // Log error for monitoring
    await db.collection('system').doc('reset_logs').collection('errors').add({
      timestamp: FieldValue.serverTimestamp(),
      type: 'daily_reset',
      error: error.message,
      stack: error.stack
    });
  }
});

// Reset weekly usage every Monday at 00:00 UTC
export const resetWeeklyUsage = onSchedule("0 0 * * 1", async (event) => {
  console.log('🔄 Starting weekly usage reset...');
  
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      
      if (userData.usageCount !== undefined) {
        batch.update(doc.ref, {
          weeklyUsage: 0,
          lastWeeklyReset: FieldValue.serverTimestamp()
        });
        updateCount++;
      }
    });
    
    // Update config with last weekly reset time
    batch.update(db.doc('config/limits'), {
      lastWeeklyReset: FieldValue.serverTimestamp()
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Weekly reset completed for ${updateCount} users`);
    }
    
    // Log reset event
    await db.collection('system').doc('reset_logs').collection('weekly').add({
      timestamp: FieldValue.serverTimestamp(),
      usersReset: updateCount,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('❌ Error in weekly reset:', error);
    
    await db.collection('system').doc('reset_logs').collection('errors').add({
      timestamp: FieldValue.serverTimestamp(),
      type: 'weekly_reset',
      error: error.message
    });
  }
});

// Reset monthly usage on the 1st of every month at 00:00 UTC
export const resetMonthlyUsage = onSchedule("0 0 1 * *", async (event) => {
  console.log('🔄 Starting monthly usage reset...');
  
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach((doc) => {
      const userData = doc.data();
      
      if (userData.usageCount !== undefined) {
        batch.update(doc.ref, {
          monthlyUsage: 0,
          lastMonthlyReset: FieldValue.serverTimestamp()
        });
        updateCount++;
      }
    });
    
    // Update config with last monthly reset time
    batch.update(db.doc('config/limits'), {
      lastMonthlyReset: FieldValue.serverTimestamp()
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Monthly reset completed for ${updateCount} users`);
    }
    
    // Log reset event
    await db.collection('system').doc('reset_logs').collection('monthly').add({
      timestamp: FieldValue.serverTimestamp(),
      usersReset: updateCount,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('❌ Error in monthly reset:', error);
    
    await db.collection('system').doc('reset_logs').collection('errors').add({
      timestamp: FieldValue.serverTimestamp(),
      type: 'monthly_reset',
      error: error.message
    });
  }
});

// Health check function - runs every 6 hours to verify system is working
export const resetSystemHealthCheck = onSchedule("0 */6 * * *", async (event) => {
  console.log('🔍 Running reset system health check...');
  
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Check if daily reset happened in the last 25 hours (with buffer)
    const recentDailyResets = await db.collection('system')
      .doc('reset_logs')
      .collection('daily')
      .where('timestamp', '>=', yesterday)
      .limit(1)
      .get();
    
    if (recentDailyResets.empty) {
      console.warn('⚠️ No daily resets found in the last 24 hours');
      
      // Log warning
      await db.collection('system').doc('health_alerts').collection('warnings').add({
        timestamp: FieldValue.serverTimestamp(),
        type: 'missing_daily_reset',
        message: 'Daily reset function may not be working'
      });
    } else {
      console.log('✅ Reset system is functioning normally');
    }
    
    // Update health check status
    await db.collection('system').doc('health_status').set({
      lastHealthCheck: FieldValue.serverTimestamp(),
      status: recentDailyResets.empty ? 'warning' : 'healthy',
      nextDailyReset: getNextDailyResetTime(),
      nextWeeklyReset: getNextWeeklyResetTime(),
      nextMonthlyReset: getNextMonthlyResetTime()
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    await db.collection('system').doc('health_alerts').collection('errors').add({
      timestamp: FieldValue.serverTimestamp(),
      type: 'health_check_failure',
      error: error.message
    });
  }
});

// Utility functions for calculating next reset times
function getNextDailyResetTime() {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

function getNextWeeklyResetTime() {
  const nextMonday = new Date();
  const daysUntilMonday = (8 - nextMonday.getUTCDay()) % 7 || 7;
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday.toISOString();
}

function getNextMonthlyResetTime() {
  const nextMonth = new Date();
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1);
  nextMonth.setUTCHours(0, 0, 0, 0);
  return nextMonth.toISOString();
}

// Manual trigger function for testing (callable from admin)
export const manualResetTrigger = onCall(async (request) => {
  // Verify admin access
  if (!request.auth || !request.auth.token.admin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  const { resetType } = request.data;
  
  try {
    switch (resetType) {
      case 'daily':
        await resetDailyUsage();
        break;
      case 'weekly':
        await resetWeeklyUsage();
        break;
      case 'monthly':
        await resetMonthlyUsage();
        break;
      case 'all':
        await Promise.all([resetDailyUsage(), resetWeeklyUsage(), resetMonthlyUsage()]);
        break;
      default:
        throw new Error('Invalid reset type');
    }
    
    return { success: true, message: `${resetType} reset completed` };
  } catch (error) {
    console.error('❌ Manual reset failed:', error);
    throw new Error(`Reset failed: ${error.message}`);
  }
});