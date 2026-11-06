import { useState, useEffect } from 'react';

/**
 * 7-Hour Competition Countdown Timer Hook
 * Total duration: 7 hours (25,200 seconds)
 * Persists start time in localStorage so refreshing or switching tabs retains exact timer progression.
 */
export function useCompetitionTimer(durationSeconds = 25200) {
  const getRemaining = () => {
    const key = 'hnu_ctf_timer_start';
    let start = localStorage.getItem(key);
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem(key, start);
    }
    const elapsed = Math.floor((Date.now() - parseInt(start, 10)) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  };

  const [secondsRemaining, setSecondsRemaining] = useState(getRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(getRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formatted = [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');

  return {
    secondsRemaining,
    formatted,
    hours,
    minutes,
    seconds,
    isExpired: secondsRemaining <= 0
  };
}

