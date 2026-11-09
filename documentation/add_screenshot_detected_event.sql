-- Add the screenshot event type to an existing HNU CTF database.
ALTER TABLE security_logs
  MODIFY event_type ENUM(
    'FLAG_ATTEMPT_FAILED',
    'FLAG_ATTEMPT_SUCCESS',
    'BRUTE_FORCE_SUSPICIOUS',
    'BRUTE_FORCE_HIGH_RISK',
    'BRUTE_FORCE_CRITICAL',
    'RATE_LIMITED',
    'IP_BLOCKED_ACCESS',
    'AUTH_FAILED',
    'AUTH_SUCCESS',
    'ADMIN_ACTION',
    'SCREENSHOT_DETECTED'
  ) NOT NULL;
