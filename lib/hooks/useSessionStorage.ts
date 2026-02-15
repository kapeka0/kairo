import { useEffect, useState } from "react";

export const useSessionStorage = (key: string, initialValue: string) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const item = window.sessionStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error("Error reading sessionStorage", error);
      }
    }
  }, [key]);

  const setValue = (value: any) => {
    if (typeof window === "undefined") return;
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error setting sessionStorage", error);
    }
  };

  return [storedValue, setValue];
};
