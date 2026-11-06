<?php
/**
 * HNU CTF - Administrator SOC Security Logs API Endpoint
 * Provides searching, event filtering, threat level filtering, date range filtering,
 * and paginated access to detailed security audit logs.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/admin.php';

setupCorsHeaders();
ensureSessionStarted();

$admin = requireAdmin();
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(100, max(10, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$search = trim($_GET['search'] ?? '');
$eventType = trim($_GET['event_type'] ?? '');
$threatLevel = trim($_GET['threat_level'] ?? '');
$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');

if ($dbConnected && $pdo) {
    $where = ["1=1"];
    $params = [];

    if (!empty($search)) {
        $where[] = "(username LIKE ? OR ip_address LIKE ? OR challenge_name LIKE ? OR detection_reason LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if (!empty($eventType) && $eventType !== 'ALL') {
        $where[] = "event_type = ?";
        $params[] = $eventType;
    }

    if (!empty($threatLevel) && $threatLevel !== 'ALL') {
        $where[] = "threat_level = ?";
        $params[] = $threatLevel;
    }

    if (!empty($startDate)) {
        $where[] = "created_at >= ?";
        $params[] = $startDate . " 00:00:00";
    }

    if (!empty($endDate)) {
        $where[] = "created_at <= ?";
        $params[] = $endDate . " 23:59:59";
    }

    $whereClause = implode(" AND ", $where);

    // Count total matching logs
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM security_logs WHERE $whereClause");
    $countStmt->execute($params);
    $totalLogs = (int)$countStmt->fetchColumn();

    // Fetch paginated logs
    $sql = "
        SELECT id, user_id, username, ip_address, challenge_id, challenge_name, 
               event_type, result, threat_level, detection_reason, created_at
        FROM security_logs
        WHERE $whereClause
        ORDER BY created_at DESC
        LIMIT $limit OFFSET $offset
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => true,
        'page' => $page,
        'limit' => $limit,
        'total' => $totalLogs,
        'total_pages' => ceil($totalLogs / $limit),
        'logs' => $logs
    ]);
} else {
    // Realistic fallback security logs in demo mode
    $demoLogs = [
        [
            'id' => 105,
            'user_id' => 2,
            'username' => 'cyberspartan',
            'ip_address' => '192.168.10.45',
            'challenge_id' => 2,
            'challenge_name' => 'Bypass the Firewall',
            'event_type' => 'BRUTE_FORCE_CRITICAL',
            'result' => 'TRIGGERED',
            'threat_level' => 'Critical',
            'detection_reason' => '24 failed submissions in 10 minutes exceeded critical limit (20)',
            'created_at' => date('Y-m-d H:i:s', time() - 30)
        ],
        [
            'id' => 104,
            'user_id' => 2,
            'username' => 'cyberspartan',
            'ip_address' => '192.168.10.45',
            'challenge_id' => 2,
            'challenge_name' => 'Bypass the Firewall',
            'event_type' => 'FLAG_ATTEMPT_FAILED',
            'result' => 'INCORRECT',
            'threat_level' => 'Low',
            'detection_reason' => 'Incorrect flag submission on Bypass the Firewall',
            'created_at' => date('Y-m-d H:i:s', time() - 40)
        ],
        [
            'id' => 103,
            'user_id' => 3,
            'username' => 'bytehunter',
            'ip_address' => '192.168.10.88',
            'challenge_id' => 4,
            'challenge_name' => 'Race Royale',
            'event_type' => 'BRUTE_FORCE_HIGH_RISK',
            'result' => 'TRIGGERED',
            'threat_level' => 'High',
            'detection_reason' => '12 failed submissions in 5 minutes exceeded high-risk limit (10)',
            'created_at' => date('Y-m-d H:i:s', time() - 120)
        ],
        [
            'id' => 102,
            'user_id' => 4,
            'username' => 'netrunner',
            'ip_address' => '172.16.105.42',
            'challenge_id' => 1,
            'challenge_name' => 'DICT Chatbot',
            'event_type' => 'FLAG_ATTEMPT_SUCCESS',
            'result' => 'CORRECT',
            'threat_level' => 'Low',
            'detection_reason' => 'Participant netrunner successfully solved DICT Chatbot (+100 pts)',
            'created_at' => date('Y-m-d H:i:s', time() - 600)
        ],
        [
            'id' => 101,
            'user_id' => 1,
            'username' => 'admin',
            'ip_address' => '127.0.0.1',
            'challenge_id' => null,
            'challenge_name' => null,
            'event_type' => 'AUTH_SUCCESS',
            'result' => 'CORRECT',
            'threat_level' => 'Low',
            'detection_reason' => 'User admin logged in successfully as admin',
            'created_at' => date('Y-m-d H:i:s', time() - 3600)
        ]
    ];

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => false,
        'is_demo' => true,
        'page' => 1,
        'limit' => 20,
        'total' => count($demoLogs),
        'total_pages' => 1,
        'logs' => $demoLogs
    ]);
}

