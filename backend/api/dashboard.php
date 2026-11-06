<?php
/**
 * HNU CTF - Participant Dashboard API Endpoint
 * Serves summary metrics, solve stats, rank, recent activity, and announcements.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setupCorsHeaders();
ensureSessionStarted();

$user = requireAuth();
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

if ($dbConnected && $pdo) {
    // 1. Total available challenges
    $totalChallenges = (int)$pdo->query("SELECT COUNT(*) FROM challenges WHERE is_enabled = 1")->fetchColumn();

    // 2. Solved challenges by this user
    $stmtSolved = $pdo->prepare("SELECT COUNT(*), COALESCE(SUM(points), 0) FROM solves WHERE user_id = ?");
    $stmtSolved->execute([$user['id']]);
    [$solvedCount, $totalPoints] = $stmtSolved->fetch(PDO::FETCH_NUM);
    $solvedCount = (int)$solvedCount;
    $totalPoints = (int)$totalPoints;
    $unsolvedCount = max(0, $totalChallenges - $solvedCount);

    // 3. Current user rank
    $rankQuery = "
        SELECT rank_num FROM (
            SELECT u.id, RANK() OVER (ORDER BY COALESCE(SUM(s.points), 0) DESC, MAX(s.solved_at) ASC) as rank_num
            FROM users u
            LEFT JOIN solves s ON u.id = s.user_id
            WHERE u.role = 'participant' AND u.is_active = 1
            GROUP BY u.id
        ) ranked WHERE id = ?
    ";
    $stmtRank = $pdo->prepare($rankQuery);
    $stmtRank->execute([$user['id']]);
    $userRank = (int)($stmtRank->fetchColumn() ?: 1);

    // 4. Recent activity (user's last 5 submissions)
    $stmtActivity = $pdo->prepare("
        SELECT s.id, s.is_correct, s.points_awarded, s.submitted_at, c.title as challenge_title, c.category
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        WHERE s.user_id = ?
        ORDER BY s.submitted_at DESC
        LIMIT 5
    ");
    $stmtActivity->execute([$user['id']]);
    $recentActivity = $stmtActivity->fetchAll();

    // 5. Announcements
    $announcements = $pdo->query("
        SELECT a.id, a.title, a.content, a.category, a.is_pinned, a.created_at, u.username as author
        FROM announcements a
        JOIN users u ON a.author_id = u.id
        ORDER BY a.is_pinned DESC, a.created_at DESC
        LIMIT 5
    ")->fetchAll();

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ],
        'stats' => [
            'total_challenges' => $totalChallenges,
            'solved_challenges' => $solvedCount,
            'unsolved_challenges' => $unsolvedCount,
            'total_points' => $totalPoints,
            'rank' => $userRank
        ],
        'recent_activity' => $recentActivity,
        'announcements' => $announcements
    ]);
} else {
    // Pre-database / Demo Mode Fallback
    $demoSolves = $_SESSION['demo_solves'] ?? [];
    $manifestPath = __DIR__ . '/../../storage/challenges_data.json';
    $allChallenges = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
    $totalCount = count($allChallenges) ?: 22;
    $solvedCount = count($demoSolves);
    $unsolvedCount = max(0, $totalCount - $solvedCount);

    $points = 0;
    foreach ($allChallenges as $c) {
        if (in_array($c['slug'], $demoSolves)) {
            $points += (int)$c['points'];
        }
    }

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => false,
        'is_demo' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ],
        'stats' => [
            'total_challenges' => $totalCount,
            'solved_challenges' => $solvedCount,
            'unsolved_challenges' => $unsolvedCount,
            'total_points' => $points,
            'rank' => 1
        ],
        'recent_activity' => [
            ['id' => 1, 'is_correct' => 1, 'points_awarded' => 100, 'submitted_at' => date('Y-m-d H:i:s', time() - 300), 'challenge_title' => 'DICT Chatbot', 'category' => 'Web']
        ],
        'announcements' => [
            [
                'id' => 1,
                'title' => 'Welcome to HNU CTF 2026',
                'content' => 'Welcome participants to Holy Name University Cyber Security Challenge Platform! The competition is live. Flags format: HNU{flag}.',
                'category' => 'Competition',
                'is_pinned' => 1,
                'created_at' => date('Y-m-d H:i:s', time() - 86400),
                'author' => 'admin'
            ],
            [
                'id' => 2,
                'title' => 'Brute-Force & Automated Scanning Notice',
                'content' => 'Automated brute-forcing of flags will trigger SOC alerts and IP rate-limiting. Analyze challenges methodically.',
                'category' => 'Rules & Reminders',
                'is_pinned' => 1,
                'created_at' => date('Y-m-d H:i:s', time() - 43200),
                'author' => 'admin'
            ]
        ]
    ]);
}

