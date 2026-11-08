<?php
/**
 * HNU CTF - Competition Timer API Endpoint
 * Synchronizes the countdown timer across Admin and all Participants in real-time.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/admin.php';

setupCorsHeaders();
ensureSessionStarted();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'POST' ? 'update' : 'get');

$defaultTimer = [
    'running' => false,
    'remainingMs' => 7 * 3600 * 1000,
    'startedAt' => null,
    'totalMs' => 7 * 3600 * 1000
];

$storageFile = __DIR__ . '/../../storage/timer_state.json';

function getStoredTimer($pdo, $defaultTimer, $storageFile) {
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'competition_timer'");
            $stmt->execute();
            $val = $stmt->fetchColumn();
            if ($val) {
                $decoded = json_decode($val, true);
                if (is_array($decoded) && isset($decoded['remainingMs'])) {
                    return $decoded;
                }
            }
        } catch (Exception $e) { }
    }

    if (file_exists($storageFile)) {
        $raw = file_get_contents($storageFile);
        $decoded = json_decode($raw, true);
        if (is_array($decoded) && isset($decoded['remainingMs'])) {
            return $decoded;
        }
    }

    return $defaultTimer;
}

function saveStoredTimer($pdo, $timerState, $storageFile) {
    $json = json_encode($timerState);
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO system_settings (setting_key, setting_value, description)
                VALUES ('competition_timer', ?, 'Competition Countdown Timer State')
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            ");
            $stmt->execute([$json]);
        } catch (Exception $e) { }
    }

    @file_put_contents($storageFile, $json);
}

$pdo = getDatabaseConnection();

if ($action === 'update') {
    // Admin Only
    $user = requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        sendJsonResponse(['status' => 'error', 'message' => 'Invalid JSON input'], 400);
    }

    $current = getStoredTimer($pdo, $defaultTimer, $storageFile);

    $running = isset($input['running']) ? (bool)$input['running'] : $current['running'];
    $remainingMs = isset($input['remainingMs']) ? (int)$input['remainingMs'] : $current['remainingMs'];
    $totalMs = isset($input['totalMs']) ? (int)$input['totalMs'] : $current['totalMs'];
    $startedAt = isset($input['startedAt']) ? ($input['startedAt'] ? (int)$input['startedAt'] : null) : $current['startedAt'];

    $next = [
        'running' => $running,
        'remainingMs' => max(0, $remainingMs),
        'startedAt' => $running ? ($startedAt ?: (int)(microtime(true) * 1000)) : null,
        'totalMs' => max(1000, $totalMs)
    ];

    saveStoredTimer($pdo, $next, $storageFile);

    sendJsonResponse([
        'status' => 'success',
        'timer' => $next,
        'server_time' => (int)(microtime(true) * 1000)
    ]);
} else {
    // GET timer - Accessible to anyone (participants, admins, guests)
    $timer = getStoredTimer($pdo, $defaultTimer, $storageFile);

    sendJsonResponse([
        'status' => 'success',
        'timer' => $timer,
        'server_time' => (int)(microtime(true) * 1000)
    ]);
}

