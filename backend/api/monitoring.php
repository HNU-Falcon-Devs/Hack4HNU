<?php
/**
 * HNU CTF - Administrator SOC & Attack Monitoring API Endpoint
 * Aggregates live SOC metrics, attack trends, brute-force detections,
 * and individual IP investigation histories.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../includes/audit_logger.php';
require_once __DIR__ . '/../includes/brute_force_detection.php';

setupCorsHeaders();
ensureSessionStarted();

// Strict Administrator verification
$admin = requireAdmin();
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

$action = $_GET['action'] ?? 'stats';

switch ($action) {
    case 'stats':
        if ($dbConnected && $pdo) {
            // 1. Total participants
            $totalParticipants = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'participant'")->fetchColumn();

            // 2. Active participants (logged in or submitted within 24h)
            $activeParticipants = (int)$pdo->query("
                SELECT COUNT(DISTINCT u.id) 
                FROM users u 
                LEFT JOIN submissions s ON u.id = s.user_id 
                WHERE u.role = 'participant' AND (u.last_login_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) OR s.submitted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR))
            ")->fetchColumn();

            // 3. Total submissions
            $totalSubmissions = (int)$pdo->query("SELECT COUNT(*) FROM submissions")->fetchColumn();

            // 4. Correct submissions
            $correctSubmissions = (int)$pdo->query("SELECT COUNT(*) FROM submissions WHERE is_correct = 1")->fetchColumn();

            // 5. Incorrect submissions
            $incorrectSubmissions = (int)$pdo->query("SELECT COUNT(*) FROM submissions WHERE is_correct = 0")->fetchColumn();

            // 6. Suspicious IP addresses (status IN ('suspicious', 'rate_limited', 'blocked') or threat_level != 'Low')
            $suspiciousIPs = (int)$pdo->query("SELECT COUNT(*) FROM ip_security WHERE status IN ('suspicious', 'rate_limited', 'blocked') OR threat_level != 'Low'")->fetchColumn();

            // 7. Detected brute force attempts
            $detectedBruteForce = (int)$pdo->query("SELECT COUNT(*) FROM security_logs WHERE event_type LIKE 'BRUTE_FORCE_%'")->fetchColumn();

            // 8. Currently active suspicious activity (events within the last 15 minutes)
            $activeSuspicious = (int)$pdo->query("
                SELECT COUNT(*) FROM security_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) AND threat_level IN ('Medium', 'High', 'Critical')
            ")->fetchColumn();

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'stats' => [
                    'total_participants' => $totalParticipants,
                    'active_participants' => $activeParticipants,
                    'total_submissions' => $totalSubmissions,
                    'correct_submissions' => $correctSubmissions,
                    'incorrect_submissions' => $incorrectSubmissions,
                    'suspicious_ips' => $suspiciousIPs,
                    'detected_brute_force' => $detectedBruteForce,
                    'active_suspicious_activity' => $activeSuspicious
                ]
            ]);
        } else {
            // Realistic pre-database demo statistics
            sendJsonResponse([
                'status' => 'success',
                'db_connected' => false,
                'is_demo' => true,
                'stats' => [
                    'total_participants' => 18,
                    'active_participants' => 12,
                    'total_submissions' => 142,
                    'correct_submissions' => 48,
                    'incorrect_submissions' => 94,
                    'suspicious_ips' => 4,
                    'detected_brute_force' => 7,
                    'active_suspicious_activity' => 2
                ]
            ]);
        }
        break;

    case 'charts':
        if ($dbConnected && $pdo) {
            // Chart 1: Successful vs Failed submissions
            $stmtSuccessFail = $pdo->query("
                SELECT 
                    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as failed
                FROM submissions
            ");
            $sfData = $stmtSuccessFail->fetch();
            $successVsFailed = [
                ['name' => 'Successful', 'value' => (int)($sfData['successful'] ?? 0), 'fill' => '#22C55E'],
                ['name' => 'Failed', 'value' => (int)($sfData['failed'] ?? 0), 'fill' => '#EF4444']
            ];

            // Chart 2: Submissions over time (hourly last 12 hours)
            $stmtTime = $pdo->query("
                SELECT DATE_FORMAT(submitted_at, '%H:00') as hour_label,
                       COUNT(*) as total,
                       SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
                       SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) as incorrect
                FROM submissions
                WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
                GROUP BY DATE_FORMAT(submitted_at, '%H:00')
                ORDER BY hour_label ASC
            ");
            $submissionsOverTime = $stmtTime->fetchAll();

            // Chart 3: Top suspicious IP addresses
            $stmtTopIps = $pdo->query("
                SELECT ip_address, failed_attempts_count as failed_attempts, threat_level, status
                FROM ip_security
                ORDER BY failed_attempts_count DESC
                LIMIT 5
            ");
            $topSuspiciousIps = $stmtTopIps->fetchAll();

            // Chart 4: Most targeted challenges
            $stmtTargeted = $pdo->query("
                SELECT c.title as name, COUNT(s.id) as attempts,
                       SUM(CASE WHEN s.is_correct = 0 THEN 1 ELSE 0 END) as failed_attempts
                FROM submissions s
                JOIN challenges c ON s.challenge_id = c.id
                GROUP BY c.id, c.title
                ORDER BY attempts DESC
                LIMIT 5
            ");
            $mostTargetedChallenges = $stmtTargeted->fetchAll();

            // Chart 5: Most active participants
            $stmtActiveUsers = $pdo->query("
                SELECT u.username, COUNT(s.id) as submissions_count
                FROM submissions s
                JOIN users u ON s.user_id = u.id
                GROUP BY u.id, u.username
                ORDER BY submissions_count DESC
                LIMIT 5
            ");
            $mostActiveParticipants = $stmtActiveUsers->fetchAll();

            // Chart 6: Failed submissions by hour (24 hours breakdown)
            $stmtFailedHour = $pdo->query("
                SELECT DATE_FORMAT(submitted_at, '%H:00') as hour, COUNT(*) as failed_count
                FROM submissions
                WHERE is_correct = 0 AND submitted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY DATE_FORMAT(submitted_at, '%H:00')
                ORDER BY hour ASC
            ");
            $failedByHour = $stmtFailedHour->fetchAll();

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'charts' => [
                    'success_vs_failed' => $successVsFailed,
                    'submissions_over_time' => $submissionsOverTime,
                    'top_suspicious_ips' => $topSuspiciousIps,
                    'most_targeted_challenges' => $mostTargetedChallenges,
                    'most_active_participants' => $mostActiveParticipants,
                    'failed_by_hour' => $failedByHour
                ]
            ]);
        } else {
            // Realistic charts demo fallback
            sendJsonResponse([
                'status' => 'success',
                'db_connected' => false,
                'is_demo' => true,
                'charts' => [
                    'success_vs_failed' => [
                        ['name' => 'Successful', 'value' => 48, 'fill' => '#22C55E'],
                        ['name' => 'Failed', 'value' => 94, 'fill' => '#EF4444']
                    ],
                    'submissions_over_time' => [
                        ['hour_label' => '14:00', 'total' => 12, 'correct' => 4, 'incorrect' => 8],
                        ['hour_label' => '15:00', 'total' => 25, 'correct' => 10, 'incorrect' => 15],
                        ['hour_label' => '16:00', 'total' => 38, 'correct' => 12, 'incorrect' => 26],
                        ['hour_label' => '17:00', 'total' => 18, 'correct' => 5, 'incorrect' => 13],
                        ['hour_label' => '18:00', 'total' => 31, 'correct' => 9, 'incorrect' => 22],
                        ['hour_label' => '19:00', 'total' => 18, 'correct' => 8, 'incorrect' => 10]
                    ],
                    'top_suspicious_ips' => [
                        ['ip_address' => '192.168.10.45', 'failed_attempts' => 28, 'threat_level' => 'Critical', 'status' => 'blocked'],
                        ['ip_address' => '192.168.10.88', 'failed_attempts' => 14, 'threat_level' => 'High', 'status' => 'rate_limited'],
                        ['ip_address' => '172.16.105.42', 'failed_attempts' => 9, 'threat_level' => 'Medium', 'status' => 'suspicious'],
                        ['ip_address' => '10.0.4.15', 'failed_attempts' => 6, 'threat_level' => 'Low', 'status' => 'normal']
                    ],
                    'most_targeted_challenges' => [
                        ['name' => 'Bypass the Firewall', 'attempts' => 42, 'failed_attempts' => 34],
                        ['name' => 'DICT Chatbot', 'attempts' => 31, 'failed_attempts' => 21],
                        ['name' => 'Race Royale', 'attempts' => 28, 'failed_attempts' => 19],
                        ['name' => 'Credential Vault', 'attempts' => 19, 'failed_attempts' => 11],
                        ['name' => 'Domeng\'s Logic', 'attempts' => 14, 'failed_attempts' => 9]
                    ],
                    'most_active_participants' => [
                        ['username' => 'cyberspartan', 'submissions_count' => 34],
                        ['username' => 'bytehunter', 'submissions_count' => 29],
                        ['username' => 'netrunner', 'submissions_count' => 22],
                        ['username' => 'hexdaemon', 'submissions_count' => 18],
                        ['username' => 'packetwizard', 'submissions_count' => 15]
                    ],
                    'failed_by_hour' => [
                        ['hour' => '10:00', 'failed_count' => 5],
                        ['hour' => '12:00', 'failed_count' => 12],
                        ['hour' => '14:00', 'failed_count' => 8],
                        ['hour' => '16:00', 'failed_count' => 26],
                        ['hour' => '18:00', 'failed_count' => 22],
                        ['hour' => '20:00', 'failed_count' => 14]
                    ]
                ]
            ]);
        }
        break;

    case 'attacks':
        if ($dbConnected && $pdo) {
            // Build the live attack monitoring table query
            $sql = "
                SELECT 
                    COALESCE(u.username, 'Anonymous') as participant,
                    s.ip_address,
                    COALESCE(c.title, 'Multiple / Unspecified') as challenge,
                    COUNT(s.id) as failed_attempts,
                    MIN(s.submitted_at) as first_attempt,
                    MAX(s.submitted_at) as last_attempt,
                    COALESCE(sec.threat_level, 'Low') as threat_level,
                    COALESCE(sec.status, 'normal') as status,
                    COALESCE(sec.is_enforced, 1) as is_enforced,
                    sec.reason as detection_reason
                FROM submissions s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN challenges c ON s.challenge_id = c.id
                LEFT JOIN ip_security sec ON s.ip_address = sec.ip_address
                WHERE s.is_correct = 0
                GROUP BY s.ip_address, s.user_id, s.challenge_id
                ORDER BY last_attempt DESC
                LIMIT 50
            ";
            $stmt = $pdo->query($sql);
            $attacks = $stmt->fetchAll();

            // Compute frequency (e.g. attempts per minute)
            foreach ($attacks as &$att) {
                $first = strtotime($att['first_attempt']);
                $last = strtotime($att['last_attempt']);
                $diffSec = max(1, $last - $first);
                $diffMin = max(0.1, $diffSec / 60);
                $rate = round($att['failed_attempts'] / $diffMin, 1);
                $att['frequency'] = ($rate > 1) ? "{$rate} attempts/min" : "Sporadic ({$att['failed_attempts']} in " . round($diffMin) . "m)";
            }

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'attacks' => $attacks
            ]);
        } else {
            // Realistic fallback attack monitoring table
            $attacks = [
                [
                    'participant' => 'cyberspartan',
                    'ip_address' => '192.168.10.45',
                    'challenge' => 'Bypass the Firewall',
                    'failed_attempts' => 24,
                    'first_attempt' => date('Y-m-d H:i:s', time() - 600),
                    'last_attempt' => date('Y-m-d H:i:s', time() - 30),
                    'frequency' => '2.4 attempts/min',
                    'threat_level' => 'Critical',
                    'status' => 'blocked',
                    'is_enforced' => 1,
                    'detection_reason' => '24 failed submissions in 10 minutes exceeded critical limit (20)'
                ],
                [
                    'participant' => 'bytehunter',
                    'ip_address' => '192.168.10.88',
                    'challenge' => 'Race Royale',
                    'failed_attempts' => 12,
                    'first_attempt' => date('Y-m-d H:i:s', time() - 300),
                    'last_attempt' => date('Y-m-d H:i:s', time() - 45),
                    'frequency' => '2.4 attempts/min',
                    'threat_level' => 'High',
                    'status' => 'rate_limited',
                    'is_enforced' => 1,
                    'detection_reason' => '12 failed submissions in 5 minutes exceeded high-risk limit (10)'
                ],
                [
                    'participant' => 'netrunner',
                    'ip_address' => '172.16.105.42',
                    'challenge' => 'DICT Chatbot',
                    'failed_attempts' => 7,
                    'first_attempt' => date('Y-m-d H:i:s', time() - 60),
                    'last_attempt' => date('Y-m-d H:i:s', time() - 10),
                    'frequency' => '7.0 attempts/min',
                    'threat_level' => 'Medium',
                    'status' => 'suspicious',
                    'is_enforced' => 1,
                    'detection_reason' => '7 failed submissions in 1 minute exceeded burst threshold (5)'
                ],
                [
                    'participant' => 'binaryghost',
                    'ip_address' => '10.0.4.15',
                    'challenge' => 'Credential Vault',
                    'failed_attempts' => 2,
                    'first_attempt' => date('Y-m-d H:i:s', time() - 1800),
                    'last_attempt' => date('Y-m-d H:i:s', time() - 1200),
                    'frequency' => 'Sporadic (2 in 10m)',
                    'threat_level' => 'Low',
                    'status' => 'normal',
                    'is_enforced' => 1,
                    'detection_reason' => 'Normal incorrect flag attempts'
                ]
            ];

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => false,
                'is_demo' => true,
                'attacks' => $attacks
            ]);
        }
        break;

    case 'investigate_ip':
        $ip = trim($_GET['ip'] ?? '');
        if (empty($ip)) {
            sendJsonResponse(['status' => 'error', 'message' => 'IP address parameter is required'], 400);
        }

        if ($dbConnected && $pdo) {
            // Get IP profile
            $stmtIp = $pdo->prepare("SELECT * FROM ip_security WHERE ip_address = ?");
            $stmtIp->execute([$ip]);
            $ipProfile = $stmtIp->fetch();

            // Get complete submission history for this IP
            $stmtSubs = $pdo->prepare("
                SELECT s.id, s.submitted_flag, s.is_correct, s.points_awarded, s.ip_address, s.user_agent, s.submitted_at,
                       u.username, c.title as challenge_title, c.category
                FROM submissions s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN challenges c ON s.challenge_id = c.id
                WHERE s.ip_address = ?
                ORDER BY s.submitted_at DESC
                LIMIT 100
            ");
            $stmtSubs->execute([$ip]);
            $history = $stmtSubs->fetchAll();

            // Get security log events for this IP
            $stmtSec = $pdo->prepare("
                SELECT id, event_type, result, threat_level, detection_reason, created_at
                FROM security_logs
                WHERE ip_address = ?
                ORDER BY created_at DESC
                LIMIT 50
            ");
            $stmtSec->execute([$ip]);
            $secEvents = $stmtSec->fetchAll();

            // Get administrator action history for this IP
            $stmtActs = $pdo->prepare("
                SELECT l.id, l.action, l.notes, l.created_at, u.username as admin_username
                FROM ip_actions_log l
                JOIN users u ON l.admin_id = u.id
                WHERE l.ip_address = ?
                ORDER BY l.created_at DESC
            ");
            $stmtActs->execute([$ip]);
            $actions = $stmtActs->fetchAll();

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'ip' => $ip,
                'profile' => $ipProfile ?: [
                    'ip_address' => $ip,
                    'status' => 'normal',
                    'threat_level' => 'Low',
                    'failed_attempts_count' => count($history),
                    'is_enforced' => 1,
                    'reason' => 'No active alerts'
                ],
                'submission_history' => $history,
                'security_events' => $secEvents,
                'admin_actions' => $actions
            ]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'db_connected' => false,
                'is_demo' => true,
                'ip' => $ip,
                'profile' => [
                    'ip_address' => $ip,
                    'status' => 'suspicious',
                    'threat_level' => 'High',
                    'failed_attempts_count' => 14,
                    'is_enforced' => 1,
                    'reason' => 'Repeated burst submissions'
                ],
                'submission_history' => [
                    ['id' => 101, 'submitted_flag' => 'HNU{guess_flag_1}', 'is_correct' => 0, 'submitted_at' => date('Y-m-d H:i:s', time() - 30), 'username' => 'cyberspartan', 'challenge_title' => 'Bypass the Firewall', 'category' => 'Web'],
                    ['id' => 100, 'submitted_flag' => 'HNU{guess_flag_2}', 'is_correct' => 0, 'submitted_at' => date('Y-m-d H:i:s', time() - 40), 'username' => 'cyberspartan', 'challenge_title' => 'Bypass the Firewall', 'category' => 'Web'],
                    ['id' => 99,  'submitted_flag' => 'HNU{guess_flag_3}', 'is_correct' => 0, 'submitted_at' => date('Y-m-d H:i:s', time() - 55), 'username' => 'cyberspartan', 'challenge_title' => 'Bypass the Firewall', 'category' => 'Web'],
                ],
                'security_events' => [
                    ['id' => 1, 'event_type' => 'BRUTE_FORCE_HIGH_RISK', 'result' => 'TRIGGERED', 'threat_level' => 'High', 'detection_reason' => 'Burst submissions threshold triggered', 'created_at' => date('Y-m-d H:i:s', time() - 50)]
                ],
                'admin_actions' => []
            ]);
        }
        break;

    case 'thresholds':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $t1 = max(1, (int)($input['threshold_1min_suspicious'] ?? 5));
            $t5 = max(1, (int)($input['threshold_5min_highrisk'] ?? 10));
            $t10 = max(1, (int)($input['threshold_10min_critical'] ?? 20));
            $enforce = isset($input['enforce_ip_blocking']) ? (int)$input['enforce_ip_blocking'] : 1;

            if ($dbConnected && $pdo) {
                $upsert = $pdo->prepare("
                    INSERT INTO system_settings (setting_key, setting_value, description)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                ");
                $upsert->execute(['threshold_1min_suspicious', (string)$t1, '1-minute burst limit']);
                $upsert->execute(['threshold_5min_highrisk', (string)$t5, '5-minute high risk limit']);
                $upsert->execute(['threshold_10min_critical', (string)$t10, '10-minute critical limit']);
                $upsert->execute(['enforce_ip_blocking', (string)$enforce, 'Enforce blocking in backend']);

                logSecurityEvent(
                    'ADMIN_ACTION',
                    'INFO',
                    'Low',
                    "Administrator updated brute-force thresholds: 1m={$t1}, 5m={$t5}, 10m={$t10}, enforce={$enforce}",
                    $admin['id'],
                    $admin['username'],
                    getClientIP()
                );

                sendJsonResponse(['status' => 'success', 'message' => 'Detection thresholds updated successfully']);
            } else {
                sendJsonResponse(['status' => 'success', 'message' => 'Thresholds updated (Demo Mode)']);
            }
        } else {
            // GET thresholds
            if ($dbConnected && $pdo) {
                $thresholds = getDetectionThresholds($pdo);
                sendJsonResponse(['status' => 'success', 'thresholds' => $thresholds]);
            } else {
                sendJsonResponse([
                    'status' => 'success',
                    'thresholds' => [
                        'threshold_1min_suspicious' => 5,
                        'threshold_5min_highrisk' => 10,
                        'threshold_10min_critical' => 20,
                        'enforce_ip_blocking' => 1
                    ]
                ]);
            }
        }
        break;

    default:
        sendJsonResponse(['status' => 'error', 'message' => 'Invalid monitoring action'], 400);
}

