<?php
/**
 * HNU CTF - Screenshot Detection API Endpoint
 * Records browser-reported PrintScreen events for the authenticated account.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setupCorsHeaders();
ensureSessionStarted();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
}

$user = requireAuth();
$pdo = getDatabaseConnection();

if (!$pdo) {
    sendJsonResponse(['status' => 'error', 'message' => 'Database connection is unavailable'], 503);
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO security_logs
            (user_id, username, ip_address, challenge_id, challenge_name, event_type, result, threat_level, detection_reason, created_at)
        VALUES (?, ?, ?, NULL, NULL, 'SCREENSHOT_DETECTED', 'INFO', 'Low', ?, NOW())
    ");
    $stmt->execute([
        (int)$user['id'],
        $user['username'],
        getClientIP(),
        'Browser detected the PrintScreen key while this account was signed in.'
    ]);

    sendJsonResponse(['status' => 'success', 'logged' => true]);
} catch (Throwable $error) {
    error_log('Failed to record screenshot detection: ' . $error->getMessage());
    sendJsonResponse(['status' => 'error', 'message' => 'Could not record screenshot event'], 500);
}
