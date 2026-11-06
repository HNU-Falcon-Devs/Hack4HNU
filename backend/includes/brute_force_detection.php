<?php
/**
 * HNU CTF - Brute-Force & Anomaly Detection Engine
 * Evaluates flag submission patterns against configurable thresholds.
 * Classifies threat levels and triggers automated defenses.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/audit_logger.php';

function getDetectionThresholds($pdo) {
    $defaults = [
        'threshold_1min_suspicious' => DEFAULT_THRESHOLD_1MIN_SUSPICIOUS,
        'threshold_5min_highrisk'   => DEFAULT_THRESHOLD_5MIN_HIGHRISK,
        'threshold_10min_critical'  => DEFAULT_THRESHOLD_10MIN_CRITICAL,
        'enforce_ip_blocking'       => DEFAULT_ENFORCE_BLOCKING
    ];

    if (!$pdo) {
        return $defaults;
    }

    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
        $rows = $stmt->fetchAll();
        foreach ($rows as $row) {
            if (isset($defaults[$row['setting_key']])) {
                $defaults[$row['setting_key']] = (int)$row['setting_value'];
            }
        }
    } catch (Exception $e) {
        error_log("Failed to fetch thresholds: " . $e->getMessage());
    }

    return $defaults;
}

/**
 * Run anomaly checks on an incorrect submission.
 */
function analyzeFlagFailure($userId, $username, $challengeId, $challengeName, $ip) {
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        return;
    }

    $thresholds = getDetectionThresholds($pdo);
    $now = date('Y-m-d H:i:s');

    try {
        // 1. Count failed attempts from this IP within 1 minute, 5 minutes, 10 minutes
        $stmt1m = $pdo->prepare("SELECT COUNT(*) FROM submissions WHERE ip_address = ? AND is_correct = 0 AND submitted_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)");
        $stmt1m->execute([$ip]);
        $fails1m = (int)$stmt1m->fetchColumn();

        $stmt5m = $pdo->prepare("SELECT COUNT(*) FROM submissions WHERE ip_address = ? AND is_correct = 0 AND submitted_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
        $stmt5m->execute([$ip]);
        $fails5m = (int)$stmt5m->fetchColumn();

        $stmt10m = $pdo->prepare("SELECT COUNT(*) FROM submissions WHERE ip_address = ? AND is_correct = 0 AND submitted_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)");
        $stmt10m->execute([$ip]);
        $fails10m = (int)$stmt10m->fetchColumn();

        // 2. Count distinct challenges targeted by this IP within 10 minutes
        $stmtCh = $pdo->prepare("SELECT COUNT(DISTINCT challenge_id) FROM submissions WHERE ip_address = ? AND submitted_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)");
        $stmtCh->execute([$ip]);
        $uniqueChallenges = (int)$stmtCh->fetchColumn();

        // 3. Count distinct user accounts submitting from this IP within 10 minutes
        $stmtUsr = $pdo->prepare("SELECT COUNT(DISTINCT user_id) FROM submissions WHERE ip_address = ? AND submitted_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)");
        $stmtUsr->execute([$ip]);
        $uniqueUsers = (int)$stmtUsr->fetchColumn();

        // 4. Repeated failed attempts against this same challenge by this user
        $stmtUserCh = $pdo->prepare("SELECT COUNT(*) FROM submissions WHERE user_id = ? AND challenge_id = ? AND is_correct = 0 AND submitted_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
        $stmtUserCh->execute([$userId, $challengeId]);
        $targetUserFails = (int)$stmtUserCh->fetchColumn();

        // Evaluate threat level and detection reason
        $threatLevel = 'Low';
        $status = 'normal';
        $detectionReasons = [];

        if ($fails10m >= $thresholds['threshold_10min_critical']) {
            $threatLevel = 'Critical';
            $status = 'rate_limited';
            $detectionReasons[] = "{$fails10m} failed submissions in 10 minutes exceeded critical limit ({$thresholds['threshold_10min_critical']})";
        } elseif ($fails5m >= $thresholds['threshold_5min_highrisk']) {
            $threatLevel = 'High';
            $status = 'suspicious';
            $detectionReasons[] = "{$fails5m} failed submissions in 5 minutes exceeded high-risk limit ({$thresholds['threshold_5min_highrisk']})";
        } elseif ($fails1m >= $thresholds['threshold_1min_suspicious']) {
            $threatLevel = 'Medium';
            $status = 'suspicious';
            $detectionReasons[] = "{$fails1m} failed submissions in 1 minute exceeded burst threshold ({$thresholds['threshold_1min_suspicious']})";
        }

        if ($uniqueChallenges >= 4) {
            if ($threatLevel === 'Low') $threatLevel = 'Medium';
            $detectionReasons[] = "Broad challenge scanning: {$uniqueChallenges} different challenges targeted from same IP within 10 minutes";
        }

        if ($uniqueUsers > 1) {
            if ($threatLevel !== 'Critical') $threatLevel = 'High';
            $status = 'suspicious';
            $detectionReasons[] = "Credential sharing or proxy hopping: {$uniqueUsers} different user accounts submitting from IP {$ip}";
        }

        if ($targetUserFails >= 6) {
            if ($threatLevel === 'Low') $threatLevel = 'Medium';
            $detectionReasons[] = "Targeted brute-force on '{$challengeName}': {$targetUserFails} incorrect guesses in 5 minutes";
        }

        // Fetch existing IP record to preserve whitelist or blocked state
        $checkIp = $pdo->prepare("SELECT id, status, threat_level, failed_attempts_count, is_enforced FROM ip_security WHERE ip_address = ?");
        $checkIp->execute([$ip]);
        $existingIp = $checkIp->fetch();

        $enforceBlocking = $thresholds['enforce_ip_blocking'];

        if ($existingIp) {
            // Do not override if manually whitelisted or manually blocked
            $newStatus = $existingIp['status'];
            if ($existingIp['status'] !== 'whitelisted' && $existingIp['status'] !== 'blocked') {
                if ($status === 'rate_limited') {
                    $newStatus = 'rate_limited';
                } elseif ($status === 'suspicious') {
                    $newStatus = 'suspicious';
                }
            }

            // Keep highest threat level
            $levels = ['Low' => 1, 'Medium' => 2, 'High' => 3, 'Critical' => 4];
            $curLevelVal = $levels[$existingIp['threat_level']] ?? 1;
            $newLevelVal = $levels[$threatLevel] ?? 1;
            $finalThreatLevel = ($newLevelVal > $curLevelVal) ? $threatLevel : $existingIp['threat_level'];

            $combinedReason = !empty($detectionReasons) ? implode('; ', $detectionReasons) : "Failed flag submission on {$challengeName}";

            $updateStmt = $pdo->prepare("
                UPDATE ip_security 
                SET failed_attempts_count = failed_attempts_count + 1,
                    last_attempt_at = NOW(),
                    threat_level = ?,
                    status = ?,
                    reason = ?
                WHERE id = ?
            ");
            $updateStmt->execute([$finalThreatLevel, $newStatus, $combinedReason, $existingIp['id']]);
        } else {
            $combinedReason = !empty($detectionReasons) ? implode('; ', $detectionReasons) : "Failed flag attempt";
            $insertStmt = $pdo->prepare("
                INSERT INTO ip_security (ip_address, status, threat_level, failed_attempts_count, reason, is_enforced, first_attempt_at, last_attempt_at)
                VALUES (?, ?, ?, 1, ?, ?, NOW(), NOW())
            ");
            $insertStmt->execute([$ip, $status, $threatLevel, $combinedReason, $enforceBlocking]);
        }

        // If high risk or critical, log dedicated security incident
        if ($threatLevel === 'Critical') {
            logSecurityEvent(
                'BRUTE_FORCE_CRITICAL',
                'TRIGGERED',
                'Critical',
                implode('; ', $detectionReasons),
                $userId,
                $username,
                $ip,
                $challengeId,
                $challengeName
            );
        } elseif ($threatLevel === 'High') {
            logSecurityEvent(
                'BRUTE_FORCE_HIGH_RISK',
                'TRIGGERED',
                'High',
                implode('; ', $detectionReasons),
                $userId,
                $username,
                $ip,
                $challengeId,
                $challengeName
            );
        } elseif ($threatLevel === 'Medium') {
            logSecurityEvent(
                'BRUTE_FORCE_SUSPICIOUS',
                'TRIGGERED',
                'Medium',
                implode('; ', $detectionReasons),
                $userId,
                $username,
                $ip,
                $challengeId,
                $challengeName
            );
        }

    } catch (Exception $e) {
        error_log("Brute force detection processing error: " . $e->getMessage());
    }
}

