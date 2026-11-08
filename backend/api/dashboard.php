<?php
/**
 * HNU CTF - Participant Dashboard API Endpoint
 *
 * Provides:
 * - 7-Hour Competition Countdown Timer
 * - Team-centric statistics (team total score, team solved count, team members contribution)
 * - Strict isolation: Only team activity and announcements are returned
 * - Solved status for challenges by the 4 team participants
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setupCorsHeaders();
ensureSessionStarted();

$user = requireAuth();
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

$teamId = $user['team_id'] ?? null;
$teamName = $user['team_name'] ?? ($teamId ? "Team {$teamId}" : 'Team Alpha');

// Competition timer state (fetched from system_settings or storage fallback)
$defaultTimer = [
    'running' => false,
    'remainingMs' => 7 * 3600 * 1000,
    'startedAt' => null,
    'totalMs' => 7 * 3600 * 1000
];
$eventTimer = $defaultTimer;

if ($dbConnected && $pdo) {
    try {
        $tStmt = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'competition_timer'");
        $tVal = $tStmt->fetchColumn();
        if ($tVal) {
            $tDec = json_decode($tVal, true);
            if (is_array($tDec) && isset($tDec['remainingMs'])) {
                $eventTimer = $tDec;
            }
        }
    } catch (Exception $e) { }
}

$timerStorageFile = __DIR__ . '/../../storage/timer_state.json';
if ($eventTimer === $defaultTimer && file_exists($timerStorageFile)) {
    $tDec = json_decode(file_get_contents($timerStorageFile), true);
    if (is_array($tDec) && isset($tDec['remainingMs'])) {
        $eventTimer = $tDec;
    }
}

if ($dbConnected && $pdo) {
    // 1. Total available challenges
    $totalChallenges = (int)$pdo->query("SELECT COUNT(*) FROM challenges WHERE is_enabled = 1")->fetchColumn();

    // 2. Fetch team metrics
    $teamSolvedCount = 0;
    $teamTotalPoints = 0;
    $teamMembers = [];
    $recentActivity = [];
    $solvedSlugs = [];

    if ($teamId) {
        // Team solved challenges count and total team score
        $stmtTeamSolves = $pdo->prepare("
            SELECT COUNT(DISTINCT s.challenge_id), COALESCE(SUM(s.points), 0)
            FROM solves s
            JOIN users u ON s.user_id = u.id
            WHERE u.team_id = ?
        ");
        $stmtTeamSolves->execute([$teamId]);
        [$teamSolvedCount, $teamTotalPoints] = $stmtTeamSolves->fetch(PDO::FETCH_NUM);
        $teamSolvedCount = (int)$teamSolvedCount;
        $teamTotalPoints = (int)$teamTotalPoints;

        // Team members (the 4 participants)
        $stmtMembers = $pdo->prepare("
            SELECT u.id as user_id, u.username, COALESCE(SUM(s.points), 0) as points, COUNT(s.id) as solves
            FROM users u
            LEFT JOIN solves s ON u.id = s.user_id
            WHERE u.team_id = ? AND u.role = 'participant' AND u.is_active = 1
            GROUP BY u.id, u.username
            ORDER BY points DESC, u.id ASC
        ");
        $stmtMembers->execute([$teamId]);
        $teamMembers = $stmtMembers->fetchAll();

        // Solved slugs for fast category lookup
        $stmtSolvedSlugs = $pdo->prepare("
            SELECT DISTINCT c.slug
            FROM solves s
            JOIN challenges c ON s.challenge_id = c.id
            JOIN users u ON s.user_id = u.id
            WHERE u.team_id = ?
        ");
        $stmtSolvedSlugs->execute([$teamId]);
        $solvedSlugs = $stmtSolvedSlugs->fetchAll(PDO::FETCH_COLUMN);

        // Recent team activity (only from members of this team)
        $stmtActivity = $pdo->prepare("
            SELECT s.id, s.is_correct, s.points_awarded, s.submitted_at, c.title as challenge_title, c.category, u.username
            FROM submissions s
            JOIN challenges c ON s.challenge_id = c.id
            JOIN users u ON s.user_id = u.id
            WHERE u.team_id = ?
            ORDER BY s.submitted_at DESC
            LIMIT 10
        ");
        $stmtActivity->execute([$teamId]);
        $recentActivity = $stmtActivity->fetchAll();
    } else {
        // Fallback for single participant
        $stmtUserSolves = $pdo->prepare("SELECT COUNT(*), COALESCE(SUM(points), 0) FROM solves WHERE user_id = ?");
        $stmtUserSolves->execute([$user['id']]);
        [$teamSolvedCount, $teamTotalPoints] = $stmtUserSolves->fetch(PDO::FETCH_NUM);
        $teamSolvedCount = (int)$teamSolvedCount;
        $teamTotalPoints = (int)$teamTotalPoints;
    }

    $unsolvedCount = max(0, $totalChallenges - $teamSolvedCount);

    // 3. Announcements
    $announcements = $pdo->query("
        SELECT a.id, a.title, a.content, a.category, a.is_pinned, a.created_at, u.username as author
        FROM announcements a
        JOIN users u ON a.author_id = u.id
        ORDER BY a.is_pinned DESC, a.created_at DESC
        LIMIT 5
    ")->fetchAll();

    // 4. Category breakdown
    $catCounts = $pdo->query("
        SELECT category, COUNT(*) as count 
        FROM challenges 
        WHERE is_enabled = 1 
        GROUP BY category
    ")->fetchAll(PDO::FETCH_KEY_PAIR);

    // 5. Team Flag Accuracy & Submission Volume Timeline Charts
    $teamCharts = [
        'success_vs_failed' => [
            ['name' => 'Successful', 'value' => 48, 'fill' => '#10B981'],
            ['name' => 'Failed', 'value' => 94, 'fill' => '#EF4444']
        ],
        'submissions_over_time' => [
            ['hour_label' => '14:00', 'total' => 12, 'correct' => 4, 'incorrect' => 8],
            ['hour_label' => '15:00', 'total' => 25, 'correct' => 10, 'incorrect' => 15],
            ['hour_label' => '16:00', 'total' => 38, 'correct' => 12, 'incorrect' => 26],
            ['hour_label' => '17:00', 'total' => 18, 'correct' => 5, 'incorrect' => 13],
            ['hour_label' => '18:00', 'total' => 31, 'correct' => 9, 'incorrect' => 22],
            ['hour_label' => '19:00', 'total' => 18, 'correct' => 8, 'incorrect' => 10]
        ]
    ];

    if ($teamId) {
        $stmtSF = $pdo->prepare("
            SELECT 
                SUM(CASE WHEN s.is_correct = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN s.is_correct = 0 THEN 1 ELSE 0 END) as failed
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE u.team_id = ?
        ");
        $stmtSF->execute([$teamId]);
        $sfData = $stmtSF->fetch();
        $succ = (int)($sfData['successful'] ?? 0);
        $fail = (int)($sfData['failed'] ?? 0);
        if ($succ > 0 || $fail > 0) {
            $teamCharts['success_vs_failed'] = [
                ['name' => 'Successful', 'value' => $succ, 'fill' => '#10B981'],
                ['name' => 'Failed', 'value' => $fail, 'fill' => '#EF4444']
            ];
        }

        $stmtHourly = $pdo->prepare("
            SELECT 
                DATE_FORMAT(s.submitted_at, '%H:00') as hour_label,
                COUNT(*) as total,
                SUM(CASE WHEN s.is_correct = 1 THEN 1 ELSE 0 END) as correct,
                SUM(CASE WHEN s.is_correct = 0 THEN 1 ELSE 0 END) as incorrect
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE u.team_id = ? AND s.submitted_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
            GROUP BY DATE_FORMAT(s.submitted_at, '%H:00')
            ORDER BY hour_label ASC
        ");
        $stmtHourly->execute([$teamId]);
        $hRows = $stmtHourly->fetchAll();
        if (!empty($hRows)) {
            $teamCharts['submissions_over_time'] = $hRows;
        }
    }

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => true,
        'timer' => $eventTimer,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'team_id' => $teamId,
            'team_name' => $teamName
        ],
        'team' => [
            'id' => $teamId,
            'name' => $teamName,
            'total_points' => $teamTotalPoints,
            'solved_count' => $teamSolvedCount,
            'unsolved_count' => $unsolvedCount,
            'members' => array_map(function($m) {
                return [
                    'user_id' => (int)$m['user_id'],
                    'username' => $m['username'],
                    'points' => (int)$m['points'],
                    'solves' => (int)$m['solves']
                ];
            }, $teamMembers)
        ],
        'stats' => [
            'total_challenges' => $totalChallenges,
            'solved_challenges' => $teamSolvedCount,
            'unsolved_challenges' => $unsolvedCount,
            'total_points' => $teamTotalPoints,
            'solved_slugs' => $solvedSlugs,
            'category_counts' => $catCounts
        ],
        'charts' => $teamCharts,
        'recent_activity' => $recentActivity,
        'announcements' => $announcements
    ]);
} else {
    // Demo Mode Fallback (pre-MySQL import)
    $teamKey = 'team_' . ($teamId ?: 1);
    $demoTeamSolves = $_SESSION['demo_team_solves'][$teamKey] ?? [];

    if (empty($demoTeamSolves)) {
        $demoTeamSolves = [
            'dict-chatbot' => [
                'title' => 'DICT Chatbot',
                'category' => 'Web',
                'points' => 100,
                'solver' => 'cyberspartan',
                'submitted_at' => date('Y-m-d H:i:s', time() - 3600)
            ],
            'credential-vault' => [
                'title' => 'Credential Vault',
                'category' => 'Miscellaneous',
                'points' => 30,
                'solver' => 'alpha_hunter',
                'submitted_at' => date('Y-m-d H:i:s', time() - 1800)
            ]
        ];
    }

    $manifestPath = __DIR__ . '/../../storage/challenges_data.json';
    $allChallenges = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
    $totalCount = count($allChallenges) ?: 22;

    $solvedSlugs = array_keys($demoTeamSolves);
    $solvedCount = count($solvedSlugs);
    $unsolvedCount = max(0, $totalCount - $solvedCount);

    $teamPoints = 0;
    $memberStats = [
        'cyberspartan' => ['points' => 0, 'solves' => 0],
        'alpha_hunter' => ['points' => 0, 'solves' => 0],
        'alpha_sentry' => ['points' => 0, 'solves' => 0],
        'alpha_vanguard' => ['points' => 0, 'solves' => 0]
    ];

    if ($teamId == 2) {
        $memberStats = [
            'bravo_falcon' => ['points' => 0, 'solves' => 0],
            'bravo_shadow' => ['points' => 0, 'solves' => 0],
            'bravo_cipher' => ['points' => 0, 'solves' => 0],
            'bravo_specter' => ['points' => 0, 'solves' => 0]
        ];
    }

    $recentActivity = [];
    foreach ($demoTeamSolves as $slug => $s) {
        $pts = (int)($s['points'] ?? 100);
        $teamPoints += $pts;
        $solver = $s['solver'] ?? 'cyberspartan';
        if (isset($memberStats[$solver])) {
            $memberStats[$solver]['points'] += $pts;
            $memberStats[$solver]['solves'] += 1;
        }
        $recentActivity[] = [
            'id' => rand(100, 999),
            'is_correct' => 1,
            'points_awarded' => $pts,
            'submitted_at' => $s['submitted_at'] ?? date('Y-m-d H:i:s'),
            'challenge_title' => $s['title'] ?? $slug,
            'category' => $s['category'] ?? 'Web',
            'username' => $solver
        ];
    }

    $membersList = [];
    $uid = ($teamId == 2 ? 6 : 2);
    foreach ($memberStats as $mName => $mInfo) {
        $membersList[] = [
            'user_id' => $uid++,
            'username' => $mName,
            'points' => $mInfo['points'],
            'solves' => $mInfo['solves']
        ];
    }

    $catCounts = [
        'Web' => 2,
        'OSINT' => 4,
        'Network' => 4,
        'Forensics' => 4,
        'Steganography' => 4,
        'Miscellaneous' => 4
    ];

    sendJsonResponse([
        'status' => 'success',
        'db_connected' => false,
        'is_demo' => true,
        'timer' => $eventTimer,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'team_id' => $teamId ?: 1,
            'team_name' => $teamName ?: 'Team Alpha'
        ],
        'team' => [
            'id' => $teamId ?: 1,
            'name' => $teamName ?: 'Team Alpha',
            'total_points' => $teamPoints,
            'solved_count' => $solvedCount,
            'unsolved_count' => $unsolvedCount,
            'members' => $membersList
        ],
        'stats' => [
            'total_challenges' => $totalCount,
            'solved_challenges' => $solvedCount,
            'unsolved_challenges' => $unsolvedCount,
            'total_points' => $teamPoints,
            'solved_slugs' => $solvedSlugs,
            'category_counts' => $catCounts
        ],
        'charts' => [
            'success_vs_failed' => [
                ['name' => 'Successful', 'value' => 48, 'fill' => '#10B981'],
                ['name' => 'Failed', 'value' => 94, 'fill' => '#EF4444']
            ],
            'submissions_over_time' => [
                ['hour_label' => '14:00', 'total' => 12, 'correct' => 4, 'incorrect' => 8],
                ['hour_label' => '15:00', 'total' => 25, 'correct' => 10, 'incorrect' => 15],
                ['hour_label' => '16:00', 'total' => 38, 'correct' => 12, 'incorrect' => 26],
                ['hour_label' => '17:00', 'total' => 18, 'correct' => 5, 'incorrect' => 13],
                ['hour_label' => '18:00', 'total' => 31, 'correct' => 9, 'incorrect' => 22],
                ['hour_label' => '19:00', 'total' => 18, 'correct' => 8, 'incorrect' => 10]
            ]
        ],
        'recent_activity' => $recentActivity,
        'announcements' => [
            [
                'id' => 1,
                'title' => 'Welcome to HNU CTF 2026',
                'content' => 'Welcome participants to Holy Name University Cyber Security Challenge Platform! Competition duration is 7 hours. Flags format: HNU{flag}. All 4 team members contribute to team points!',
                'category' => 'Competition',
                'is_pinned' => 1,
                'created_at' => date('Y-m-d H:i:s', time() - 86400),
                'author' => 'admin'
            ],
            [
                'id' => 2,
                'title' => 'Participant Confidentiality Notice',
                'content' => 'In accordance with HNU CTF rules, competitor rankings are confidential during the 7-hour contest. Focus on your team tasks and problem dynamics.',
                'category' => 'Rules & Reminders',
                'is_pinned' => 1,
                'created_at' => date('Y-m-d H:i:s', time() - 43200),
                'author' => 'admin'
            ]
        ]
    ]);
}
