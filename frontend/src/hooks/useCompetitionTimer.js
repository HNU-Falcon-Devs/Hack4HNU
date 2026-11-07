import { useState, useEffect } from 'react';

/**
 * Competition Countdown Timer Hook
 * Synchronizes with the Admin Dashboard Timer (`hnu_admin_timer`) across all participant tabs.
 * Falls back to 7-hour timer if the admin has not configured a custom timer.
 */
const ADMIN_TIMER_KEY = 'hnu_admin_timer';
const FALLBACK_TIMER_KEY = 'hnu_ctf_timer_start';

export function useCompetitionTimer(defaultDurationSeconds = 25200) {
  const getTimerData = () => {
    // 1. Check for shared Admin Timer in localStorage
    try {
      const raw = localStorage.getItem(ADMIN_TIMER_KEY);
      if (raw) {
        const adminState = JSON.parse(raw);
        let remMs = Number(adminState.remainingMs ?? adminState.totalMs ?? 25200000);
        if (adminState.running && adminState.startedAt) {
          const elapsed = Date.now() - adminState.startedAt;
          remMs = Math.max(0, remMs - elapsed);
        }
        const totalSec = Math.floor(Math.max(0, remMs) / 1000);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        return {
          secondsRemaining: totalSec,
          formatted: [
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0')
          ].join(':'),
          hours,
          minutes,
          seconds,
          isExpired: totalSec <= 0,
          isRunning: !!adminState.running && totalSec > 0
        };
      }
    } catch { }

    // 2. Fallback to local 7-hour persistence
    let start = localStorage.getItem(FALLBACK_TIMER_KEY);
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem(FALLBACK_TIMER_KEY, start);
    }
    const elapsed = Math.floor((Date.now() - parseInt(start, 10)) / 1000);
    const totalSec = Math.max(0, defaultDurationSeconds - elapsed);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return {
      secondsRemaining: totalSec,
      formatted: [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
      ].join(':'),
      hours,
      minutes,
      seconds,
      isExpired: totalSec <= 0,
      isRunning: totalSec > 0
    };
  };

  const [state, setState] = useState(getTimerData);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getTimerData());
    }, 500);

    const onStorage = (e) => {
      if (e.key === ADMIN_TIMER_KEY || e.key === FALLBACK_TIMER_KEY) {
        setState(getTimerData());
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [defaultDurationSeconds]);

  return state;
}


