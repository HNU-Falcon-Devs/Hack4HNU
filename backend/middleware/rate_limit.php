<?php
/**
 * IP Security & Rate Limiting Enforcement Middleware
 * Inspects incoming IP against blocked and rate-limited tables in MySQL.
 */

require_once __DIR__ . '/../config/database.php';

function checkIpSecurityEnforcement() {
    $ip = getClientIP();
    $pdo = getDatabaseConnection();

    if (!$pdo) {
        return; // Pass through if DB is not connected
    }

    try {
        $stmt = $pdo->prepare("SELECT status, threat_level, reason, is_enforced, last_attempt_at FROM ip_security WHERE ip_address = ? LIMIT 1");
        $stmt->execute([$ip]);
        $record = $stmt->fetch();

        if (!$record) {
            return;
        }

        // Whitelisted IPs always bypass
        if ($record['status'] === 'whitelisted') {
            return;
        }

        // Blocked status check
        if ($record['status'] === 'blocked') {
            if ($record['is_enforced']) {
                sendJsonResponse([
                    'status' => 'error',
                    'code' => 'IP_BLOCKED',
                    'ip' => $ip,
                    'reason' => $record['reason'] ?? 'IP blocked by administrator security policy',
                    'threat_level' => $record['threat_level'],
                    'message' => 'Access denied: Your IP address is blocked by the HNU CTF SOC.'
                ], 403);
            }
        }

        // Rate-limited check (cooldown within 60 seconds of last critical strike)
        if ($record['status'] === 'rate_limited') {
            $lastTime = strtotime($record['last_attempt_at'] ?? 'now');
            $elapsed = time() - $lastTime;
            $cooldown = 60; // 60 seconds cooldown

            if ($elapsed < $cooldown) {
                $remaining = $cooldown - $elapsed;
                sendJsonResponse([
                    'status' => 'error',
                    'code' => 'RATE_LIMITED',
                    'ip' => $ip,
                    'cooldown_remaining' => $remaining,
                    'message' => "High submission frequency detected. Rate limit active. Please wait {$remaining}s."
                ], 429);
            } else {
                // Cooldown expired; downgrade status from rate_limited to suspicious
                $update = $pdo->prepare("UPDATE ip_security SET status = 'suspicious' WHERE ip_address = ?");
                $update->execute([$ip]);
            }
        }
    } catch (Exception $e) {
        error_log("IP security check error: " . $e->getMessage());
    }
}

