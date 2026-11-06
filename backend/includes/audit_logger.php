<?php
/**
 * SOC Audit & Security Logger
 * Records security events, submission outcomes, and administrative actions.
 * Never stores plaintext passwords or unnecessarily exposes raw flags in logs.
 */

require_once __DIR__ . '/../config/database.php';

function logSecurityEvent($eventType, $result, $threatLevel, $detectionReason, $userId = null, $username = null, $ip = null, $challengeId = null, $challengeName = null) {
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        return;
    }

    $ip = $ip ?? getClientIP();

    try {
        $stmt = $pdo->prepare("
            INSERT INTO security_logs 
            (user_id, username, ip_address, challenge_id, challenge_name, event_type, result, threat_level, detection_reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $username,
            $ip,
            $challengeId,
            $challengeName,
            $eventType,
            $result,
            $threatLevel,
            $detectionReason
        ]);
    } catch (Exception $e) {
        error_log("Failed to insert security log: " . $e->getMessage());
    }
}

function logAdminAction($adminId, $ipAddress, $action, $notes = '') {
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        return;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO ip_actions_log (admin_id, ip_address, action, notes, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$adminId, $ipAddress, $action, $notes]);

        logSecurityEvent(
            'ADMIN_ACTION',
            'INFO',
            'Low',
            "Administrator (ID: {$adminId}) performed '{$action}' on IP {$ipAddress}. Notes: {$notes}",
            $adminId,
            $_SESSION['username'] ?? 'admin',
            getClientIP()
        );
    } catch (Exception $e) {
        error_log("Failed to record admin action log: " . $e->getMessage());
    }
}

