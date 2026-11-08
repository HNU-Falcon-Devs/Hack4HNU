import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const ADMIN_TIMER_KEY = 'hnu_admin_timer';

const DEFAULT_STATE = {
  running: false,
  remainingMs: 7 * 3600 * 1000,
  startedAt: null,
  totalMs: 7 * 3600 * 1000
};

function getLocalTimerState() {
  try {
    const raw = localStorage.getItem(ADMIN_TIMER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.remainingMs === 'number') {
        return parsed;
      }
    }
  } catch { }
  return DEFAULT_STATE;
}

function computeMetrics(timerState, serverOffset = 0) {
  if (!timerState) timerState = DEFAULT_STATE;
  let remMs = Number(timerState.remainingMs ?? timerState.totalMs ?? 25200000);
  if (timerState.running && timerState.startedAt) {
    const now = Date.now() + serverOffset;
    const elapsed = Math.max(0, now - timerState.startedAt);
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
    isRunning: !!timerState.running && totalSec > 0
  };
}

export function useCompetitionTimer(defaultDurationSeconds = 25200) {
  const timerStateRef = useRef(getLocalTimerState());
  const serverOffsetRef = useRef(0);
  const [metrics, setMetrics] = useState(() => computeMetrics(timerStateRef.current));

  useEffect(() => {
    // 1. Function to sync timer from server API
    const fetchServerTimer = async () => {
      try {
        const res = await api.getTimer();
        if (res?.status === 'success' && res.timer) {
          if (res.server_time) {
            serverOffsetRef.current = res.server_time - Date.now();
          }
          timerStateRef.current = res.timer;
          try {
            localStorage.setItem(ADMIN_TIMER_KEY, JSON.stringify(res.timer));
          } catch { }
          setMetrics(computeMetrics(res.timer, serverOffsetRef.current));
        }
      } catch { }
    };

    // Immediate initial sync from server
    fetchServerTimer();

    // Poll server every 2.5s to reflect admin start/pause/reset/time changes in real-time
    const pollInterval = setInterval(fetchServerTimer, 2500);

    // 2. High-frequency local ticker (smooth countdown when running)
    const tickInterval = setInterval(() => {
      setMetrics(computeMetrics(timerStateRef.current, serverOffsetRef.current));
    }, 250);

    // 3. Listen for storage & custom events for instant cross-tab / local updates
    const onStorage = (e) => {
      if (e.key === ADMIN_TIMER_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          timerStateRef.current = parsed;
          setMetrics(computeMetrics(parsed, serverOffsetRef.current));
        } catch { }
      }
    };

    const onCustomSync = (e) => {
      if (e.detail) {
        timerStateRef.current = e.detail;
        setMetrics(computeMetrics(e.detail, serverOffsetRef.current));
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('hnu_timer_sync', onCustomSync);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hnu_timer_sync', onCustomSync);
    };
  }, []);

  return metrics;
}
