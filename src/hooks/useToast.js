import { useState, useRef, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  const showToast = useCallback((msg, type) => {
    setToast({ msg, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  return { toast, showToast };
}
