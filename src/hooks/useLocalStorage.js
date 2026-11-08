import { useState, useEffect } from 'react';

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
      window.localStorage.setItem(key, JSON.stringify(storedValue));
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

  return [storedValue, setStoredValue, storageError];
}
