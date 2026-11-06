<?php
/**
 * HNU CTF - Leaderboard API Endpoint
 * Computes live rankings, total points, solved counts, and last activity timestamps.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setupCorsHeaders();
ensureSessionStarted();

$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

if ($dbConnected && $pdo) {
    // Only rank participant accounts (exclude admins)
    $sql = "
        SELECT 
            u.id as user_id,
            u.username,
            COALESCE(SUM(s.points), 0) as total_points,
            COUNT(s.id) as challenges_solved,
            MAX(s.solved_at) as last_activity
        FROM users u
        LEFT JOIN solves s ON u.id = s.user_id
        WHERE u.role = 'participant' AND u.is_active = 1
        GROUP BY u.id, u.username
        ORDER BY total_points DESC, last_activity ASC, u.id ASC
    ";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();

    $rank = 1;
    $leaderboard = [];
    foreach ($rows as $row) {
        $leaderboard[] = [
            'rank' => $rank++,
            'user_id' => (int)$row['user_id'],
            'username' => $row['username'],
            'total_points' => (int)$row['total_points'],
            'challenges_solved' => (int)$row['challenges_solved'],
            'last_activity' => $row['last_activity'] ?? 'No activity yet'
        ];
    }

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => true,
        'leaderboard' => $leaderboard
    ]);
} else {
    // Realistic fallback data when MySQL is not yet configured
    $demoSolves = $_SESSION['demo_solves'] ?? [];
    $myPoints = 0;
    $manifestPath = __DIR__ . '/../../storage/challenges_data.json';
    if (file_exists($manifestPath)) {
        $all = json_decode(file_get_contents($manifestPath), true);
        foreach ($all as $c) {
            if (in_array($c['slug'], $demoSolves)) {
                $myPoints += (int)$c['points'];
            }
        }
    }

    $currentUser = getOptionalAuth();
    $currentUsername = $currentUser['username'] ?? 'cyberspartan';

    $demoBoard = [
        ['rank' => 1, 'user_id' => 2, 'username' => 'cyberspartan', 'total_points' => max(420, $myPoints), 'challenges_solved' => max(4, count($demoSolves)), 'last_activity' => date('Y-m-d H:i:s', time() - 900)],
        ['rank' => 2, 'user_id' => 3, 'username' => 'bytehunter', 'total_points' => 310, 'challenges_solved' => 3, 'last_activity' => date('Y-m-d H:i:s', time() - 3600)],
        ['rank' => 3, 'user_id' => 4, 'username' => 'netrunner', 'total_points' => 170, 'challenges_solved' => 2, 'last_activity' => date('Y-m-d H:i:s', time() - 7200)],
        ['rank' => 4, 'user_id' => 5, 'username' => 'binaryghost', 'total_points' => 90, 'challenges_solved' => 1, 'last_activity' => date('Y-m-d H:i:s', time() - 14400)]
    ];

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => false,
        'is_demo' => true,
        'leaderboard' => $demoBoard
    ]);
}

