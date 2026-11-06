<?php
/**
 * HNU CTF - Administrator IP Management API Endpoint
 * Provides IP listing, blocking, unblocking, whitelisting,
 * backend enforcement toggling, and action logging.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../includes/audit_logger.php';

setupCorsHeaders();
ensureSessionStarted();

$admin = requireAdmin();
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        $filter = $_GET['filter'] ?? 'all'; // all, blocked, suspicious, whitelisted
        if ($dbConnected && $pdo) {
            $sql = "SELECT * FROM ip_security WHERE 1=1";
            $params = [];
            if ($filter !== 'all') {
                $sql .= " AND status = ?";
                $params[] = $filter;
            }
            $sql .= " ORDER BY last_attempt_at DESC, failed_attempts_count DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $ips = $stmt->fetchAll();

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'ips' => $ips
            ]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'db_connected' => false,
                'is_demo' => true,
                'ips' => [
                    [
                        'id' => 1,
                        'ip_address' => '192.168.10.45',
                        'status' => 'blocked',
                        'threat_level' => 'Critical',
                        'failed_attempts_count' => 28,
                        'reason' => 'Exceeded 20 failed submissions in 10 minutes',
                        'is_enforced' => 1,
                        'first_attempt_at' => date('Y-m-d H:i:s', time() - 3600),
                        'last_attempt_at' => date('Y-m-d H:i:s', time() - 120),
                        'blocked_at' => date('Y-m-d H:i:s', time() - 100)
                    ],
                    [
                        'id' => 2,
                        'ip_address' => '192.168.10.88',
                        'status' => 'rate_limited',
                        'threat_level' => 'High',
                        'failed_attempts_count' => 14,
                        'reason' => '10 failed attempts within 5 minutes',
                        'is_enforced' => 1,
                        'first_attempt_at' => date('Y-m-d H:i:s', time() - 2400),
                        'last_attempt_at' => date('Y-m-d H:i:s', time() - 300),
                        'blocked_at' => null
                    ],
                    [
                        'id' => 3,
                        'ip_address' => '172.16.105.42',
                        'status' => 'suspicious',
                        'threat_level' => 'Medium',
                        'failed_attempts_count' => 7,
                        'reason' => 'Burst flag submissions',
                        'is_enforced' => 1,
                        'first_attempt_at' => date('Y-m-d H:i:s', time() - 1200),
                        'last_attempt_at' => date('Y-m-d H:i:s', time() - 600),
                        'blocked_at' => null
                    ],
                    [
                        'id' => 4,
                        'ip_address' => '127.0.0.1',
                        'status' => 'whitelisted',
                        'threat_level' => 'Low',
                        'failed_attempts_count' => 0,
                        'reason' => 'Trusted Localhost Host',
                        'is_enforced' => 1,
                        'first_attempt_at' => date('Y-m-d H:i:s', time() - 86400),
                        'last_attempt_at' => date('Y-m-d H:i:s', time() - 60),
                        'blocked_at' => null
                    ]
                ]
            ]);
        }
        break;

    case 'block':
    case 'unblock':
    case 'whitelist':
    case 'reset':
        if ($method !== 'POST') {
            sendJsonResponse(['status' => 'error', 'message' => 'POST method required'], 405);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $ip = trim($input['ip_address'] ?? '');
        $notes = trim($input['notes'] ?? '');
        $enforce = isset($input['is_enforced']) ? (int)$input['is_enforced'] : 1;

        if (empty($ip) || !filter_var($ip, FILTER_VALIDATE_IP)) {
            sendJsonResponse(['status' => 'error', 'message' => 'Valid IP address is required.'], 400);
        }

        $newStatus = ($action === 'block') ? 'blocked' : (($action === 'whitelist') ? 'whitelisted' : 'normal');
        $threatLevel = ($action === 'block') ? 'Critical' : (($action === 'whitelist') ? 'Low' : 'Low');

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("
                INSERT INTO ip_security (ip_address, status, threat_level, reason, is_enforced, blocked_at, updated_at)
                VALUES (?, ?, ?, ?, ?, " . ($action === 'block' ? 'NOW()' : 'NULL') . ", NOW())
                ON DUPLICATE KEY UPDATE 
                    status = VALUES(status),
                    threat_level = VALUES(threat_level),
                    reason = VALUES(reason),
                    is_enforced = VALUES(is_enforced),
                    blocked_at = " . ($action === 'block' ? 'NOW()' : 'NULL') . ",
                    updated_at = NOW()
            ");
            $reason = "Administrator action: {$action}. " . ($notes ? "Notes: {$notes}" : "");
            $stmt->execute([$ip, $newStatus, $threatLevel, $reason, $enforce]);

            logAdminAction($admin['id'], $ip, $action, $notes);

            sendJsonResponse([
                'status' => 'success',
                'message' => "IP {$ip} status updated to '{$newStatus}' (Enforced: " . ($enforce ? 'Yes' : 'Marked only') . ")",
                'ip_address' => $ip,
                'new_status' => $newStatus,
                'is_enforced' => $enforce
            ]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'message' => "IP {$ip} set to '{$newStatus}' (Demo Mode)",
                'ip_address' => $ip,
                'new_status' => $newStatus,
                'is_enforced' => $enforce
            ]);
        }
        break;

    case 'history':
        if ($dbConnected && $pdo) {
            $stmt = $pdo->query("
                SELECT l.id, l.ip_address, l.action, l.notes, l.created_at, u.username as admin_username
                FROM ip_actions_log l
                JOIN users u ON l.admin_id = u.id
                ORDER BY l.created_at DESC
                LIMIT 100
            ");
            $history = $stmt->fetchAll();
            sendJsonResponse(['status' => 'success', 'history' => $history]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'history' => [
                    ['id' => 1, 'ip_address' => '192.168.10.45', 'action' => 'block', 'notes' => 'Critical brute-forcing confirmed', 'created_at' => date('Y-m-d H:i:s', time() - 3600), 'admin_username' => 'admin']
                ]
            ]);
        }
        break;

    default:
        sendJsonResponse(['status' => 'error', 'message' => 'Unknown IP management action'], 400);
}

