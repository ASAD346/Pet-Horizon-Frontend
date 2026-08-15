import * as Notifications from 'expo-notifications';
import { cancelTaskNotifications, cleanupPendingNotifications } from './notificationSetup';
import { log } from '@/lib/log';

export async function runNotificationSystemAudit() {
  log.info('Audit', '=== STARTING NOTIFICATION SYSTEM VERIFICATION AUDIT ===');
  
  const testScheduleId = `test-audit-${Date.now()}`;
  const testNotifId = `walk-done-${testScheduleId}`;
  
  try {
    log.info('Audit', `1. Simulating notification scheduling for ID: ${testNotifId}`);
    
    // Check if permission is granted
    const { status } = await Notifications.getPermissionsAsync();
    log.info('Audit', `Current permission status: ${status}`);
    
    // Schedule a test notification 1 hour from now
    await Notifications.scheduleNotificationAsync({
      identifier: testNotifId,
      content: {
        title: 'Pet Horizon Audit 🐾',
        body: 'This is a test notification for the verification audit.',
        sound: true,
        data: { screen: '/explore' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3600,
      },
    });
    
    log.info('Audit', '2. Retrieving all scheduled notifications to verify registration...');
    const scheduledBefore = await Notifications.getAllScheduledNotificationsAsync();
    const foundBefore = scheduledBefore.find(n => n.identifier === testNotifId);
    
    if (foundBefore) {
      log.ok('Audit', `Successfully registered notification in system scheduled list: ${foundBefore.identifier}`);
    } else {
      log.warn('Audit', `Notification ${testNotifId} not found in scheduled list (permissions might be disabled, or on web/emulator limit)`);
    }

    log.info('Audit', `3. Triggering cancelTaskNotifications(${testScheduleId})...`);
    await cancelTaskNotifications(testScheduleId);
    
    log.info('Audit', '4. Verifying cancellation by querying scheduled notifications list again...');
    const scheduledAfter = await Notifications.getAllScheduledNotificationsAsync();
    const foundAfter = scheduledAfter.find(n => n.identifier === testNotifId);
    
    if (!foundAfter) {
      log.ok('Audit', `Successfully verified: Notification ${testNotifId} has been removed/cancelled!`);
    } else {
      log.fail('Audit', `Notification ${testNotifId} is still present in system scheduled list!`);
    }

    log.info('Audit', '5. Testing cleanupPendingNotifications with active schedule ID excluded...');
    const ghostScheduleId = `ghost-audit-${Date.now()}`;
    const ghostNotifId = `feeding-${ghostScheduleId}`;
    await Notifications.scheduleNotificationAsync({
      identifier: ghostNotifId,
      content: { title: 'Ghost Alert', body: 'Test', data: { screen: '/explore' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3600,
      },
    });

    const scheduledBeforeCleanup = await Notifications.getAllScheduledNotificationsAsync();
    log.info('Audit', 'Scheduled notifications before cleanup', scheduledBeforeCleanup.map(n => n.identifier).join(', '));

    // Run cleanup, excluding the ghost ID from the active list
    await cleanupPendingNotifications([]);
    
    const scheduledAfterCleanup = await Notifications.getAllScheduledNotificationsAsync();
    log.info('Audit', 'Scheduled notifications after cleanup', scheduledAfterCleanup.map(n => n.identifier).join(', '));
    
    const ghostFound = scheduledAfterCleanup.find(n => n.identifier === ghostNotifId);
    if (!ghostFound) {
      log.ok('Audit', `Successfully verified cleanup: Ghost notification ${ghostNotifId} was cleaned up!`);
    } else {
      log.fail('Audit', `Ghost notification ${ghostNotifId} was not cleaned up!`);
    }

  } catch (error) {
    log.fail('Audit', 'Error occurred during notification audit', error instanceof Error ? error.message : String(error));
  }
  
  log.info('Audit', '=== NOTIFICATION SYSTEM VERIFICATION AUDIT COMPLETE ===');
}
