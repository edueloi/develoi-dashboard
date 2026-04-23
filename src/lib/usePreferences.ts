import { useState, useEffect } from 'react';

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50, 100];

export function usePreferences<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(`pref_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(`pref_${key}`, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
