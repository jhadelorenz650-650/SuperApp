import { useState, useEffect } from 'react';

// Broadcast storage changes within the current window and across tabs
export function broadcastStorageChange(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('superapp-storage-sync', {
        detail: { key, value },
      })
    );
  } catch {
    // Ignore
  }
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });
  const [storageError, setStorageError] = useState(null);

  useEffect(() => {
    try {
      const serialized = JSON.stringify(storedValue);
      const currentInStorage = window.localStorage.getItem(key);
      if (currentInStorage !== serialized) {
        window.localStorage.setItem(key, serialized);
        broadcastStorageChange(key, storedValue);
      }
      setStorageError((prev) => (prev ? null : prev));
    } catch (error) {
      const isQuota =
        error?.name === 'QuotaExceededError' ||
        error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error?.code === 22;
      console.warn(`Error writing localStorage key "${key}":`, error);
      setStorageError({
        type: isQuota ? 'quota' : 'write',
        message: isQuota
          ? 'Browser storage is full — recent edits may not persist after refresh.'
          : 'Unable to save recent edits to browser storage.',
      });
    }
  }, [key, storedValue]);

  // Sync across tabs and with custom events dispatched in the same window
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStoredValue(parsed);
        } catch {}
      }
    };

    const handleCustomSync = (e) => {
      if (e.detail?.key === key) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw !== null) {
            const parsed = JSON.parse(raw);
            setStoredValue(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('superapp-storage-sync', handleCustomSync);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('superapp-storage-sync', handleCustomSync);
    };
  }, [key]);

  return [storedValue, setStoredValue, storageError];
}
