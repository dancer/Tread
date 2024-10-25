import { useState, useEffect, useCallback } from "react";

export default function useTypingTest(snippet: string) {
  const [typed, setTyped] = useState("");
  const [errors, setErrors] = useState(0);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [wpm, setWpm] = useState(0);

  const startTest = useCallback(() => {
    setIsRunning(true);
    setTyped("");
    setErrors(0);
    setTime(0);
    setWpm(0);
  }, []);

  const resetTest = useCallback(() => {
    setIsRunning(false);
    setTyped("");
    setErrors(0);
    setTime(0);
    setWpm(0);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isRunning) return;

      if (e.key === snippet[typed.length]) {
        setTyped((prev) => prev + e.key);
      } else {
        setErrors((prev) => prev + 1);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [isRunning, snippet, typed]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
        setWpm(Math.round(typed.length / 5 / (time / 60)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, time, typed.length]);

  return { typed, errors, time, wpm, startTest, resetTest };
}
