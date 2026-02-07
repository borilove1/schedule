import { useState, useRef, useCallback } from 'react';

export function useActionGuard() {
  const [inProgress, setInProgress] = useState(false);
  const guardRef = useRef(false);

  const execute = useCallback(async (action) => {
    if (guardRef.current) return;
    guardRef.current = true;
    setInProgress(true);
    try {
      return await action();
    } finally {
      guardRef.current = false;
      setInProgress(false);
    }
  }, []);

  const isGuarded = useCallback(() => guardRef.current, []);

  const reset = useCallback(() => {
    guardRef.current = false;
    setInProgress(false);
  }, []);

  return { inProgress, execute, isGuarded, reset };
}
