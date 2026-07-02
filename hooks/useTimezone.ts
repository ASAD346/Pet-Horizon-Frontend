import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './useAuth';
import { updateTimezone } from '@/services/users/userApi';
import { log } from '@/lib/log';

const SCOPE = 'useTimezone';

export function useTimezone() {
  const { user, token, isAuthenticated, setSession } = useAuth();
  const [synced, setSynced] = useState(false);
  const appState = useRef(AppState.currentState);

  const syncTimezone = () => {
    if (!isAuthenticated || !token || !user) return;

    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    
    if (user.timezone === localTimezone && synced) {
      return;
    }

    log.info(SCOPE, 'Syncing timezone...', { localTimezone, storedTimezone: user?.timezone });

    updateTimezone(token, localTimezone)
      .then((updatedUser) => {
        setSession({
          token,
          user: updatedUser,
        });
        setSynced(true);
        log.ok(SCOPE, 'Timezone synced successfully', { localTimezone });
      })
      .catch((err) => {
        log.fail(SCOPE, 'Timezone sync failed', err);
      });
  };

  useEffect(() => {
    syncTimezone();
  }, [isAuthenticated, token, user?.timezone]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        log.info(SCOPE, 'App foregrounded. Triggering timezone validation...');
        syncTimezone();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, token, user?.timezone, synced]);

  return {
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    synced: synced || (isAuthenticated && user?.timezone === (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')),
  };
}
