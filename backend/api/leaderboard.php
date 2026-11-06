<?php
/**
 * HNU CTF - Leaderboard API Endpoint
 *
 * Privacy & Isolation Enforcement:
 * - Participants: Can ONLY view their own team's scores and their own team's solved problems.
 *                 They CANNOT view or see other teams' scores or other participants.
 * - Administrators: Can view ALL scores: both team scores (rankings of all teams)
 *                   and individual participant scorings across all teams.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

setupCorsHeaders();
ensureSessionStarted();

$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();
$currentUser = getOptionalAuth();

$isAdmin = ($currentUser && $currentUser['role'] === 'admin');

if ($dbConnected && $pdo) {
    if (!$isAdmin) {
        // Participant View: strictly isolate to their team
        $teamId = $currentUser['team_id'] ?? null;
        $userId = $currentUser['id'] ?? null;

        if (!$teamId && $userId) {
            $stmt = $pdo->prepare("SELECT team_id, team_name FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $uRow = $stmt->fetch();
            $teamId = $uRow['team_id'] ?? null;
        }

        if ($teamId) {
            // 1. Fetch team members (the 4 participants)
            $memStmt = $pdo->prepare("
                SELECT 
                    u.id as user_id,
                    u.username,
                    COALESCE(SUM(s.points), 0) as individual_points,
                    COUNT(s.id) as individual_solves
                FROM users u
                LEFT JOIN solves s ON u.id = s.user_id
                WHERE u.team_id = ? AND u.role = 'participant' AND u.is_active = 1
                GROUP BY u.id, u.username
                ORDER BY individual_points DESC, u.id ASC
            ");
            $memStmt->execute([$teamId]);
            $members = $memStmt->fetchAll();

            // 2. Fetch solved challenges by this team
            $solveStmt = $pdo->prepare("
                SELECT 
                    c.id as challenge_id,
                    c.title,
                    c.category,
                    c.difficulty,
                    s.points,
                    s.solved_at,
                    u.username as solved_by
                FROM solves s
                JOIN users u ON s.user_id = u.id
                JOIN challenges c ON s.challenge_id = c.id
                WHERE u.team_id = ?
                ORDER BY s.solved_at DESC
            ");
            $solveStmt->execute([$teamId]);
            $solvedChallenges = $solveStmt->fetchAll();

            $teamName = $currentUser['team_name'] ?? 'Team ' . $teamId;
            $teamPoints = 0;
            foreach ($solvedChallenges as $sc) {
                $teamPoints += (int)$sc['points'];
            }

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
                'view' => 'participant_isolated',
                'is_admin' => false,
                'privacy_notice' => 'Confidential Competition Mode: In accordance with HNU CTF rules, competitor standings are kept private during competition. Only your team\'s points and verified solves are visible.',
                'charts' => $teamCharts,
                'team' => [
                    'team_id' => (int)$teamId,
                    'team_name' => $teamName,
                    'total_points' => $teamPoints,
                    'challenges_solved' => count($solvedChallenges),
                    'members' => array_map(function($m) {
                        return [
                            'user_id' => (int)$m['user_id'],
                            'username' => $m['username'],
                            'points' => (int)$m['individual_points'],
                            'solves' => (int)$m['individual_solves']
                        ];
                    }, $members),
                    'solved_challenges' => array_map(function($sc) {
                        return [
                            'challenge_id' => (int)$sc['challenge_id'],
                            'title' => $sc['title'],
                            'category' => $sc['category'],
                            'difficulty' => $sc['difficulty'],
                            'points' => (int)$sc['points'],
                            'solved_by' => $sc['solved_by'],
                            'solved_at' => $sc['solved_at']
                        ];
                    }, $solvedChallenges)
                ]
            ]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'view' => 'participant_isolated',
                'is_admin' => false,
                'privacy_notice' => 'No team assigned. Competitor scores are confidential.',
                'team' => null
            ]);
        }
    } else {
        // Admin View: Can view ALL team scores and ALL individual scoring
        // 1. All Teams Ranking
        $teamSql = "
            SELECT 
                COALESCE(u.team_id, 0) as team_id,
                COALESCE(u.team_name, 'Independent Participants') as team_name,
                COALESCE(SUM(s.points), 0) as total_points,
                COUNT(DISTINCT s.id) as challenges_solved,
                COUNT(DISTINCT u.id) as member_count,
                MAX(s.solved_at) as last_activity
            FROM users u
            LEFT JOIN solves s ON u.id = s.user_id
            WHERE u.role = 'participant' AND u.is_active = 1
            GROUP BY u.team_id, u.team_name
            ORDER BY total_points DESC, last_activity ASC
        ";
        $teamStmt = $pdo->query($teamSql);
        $teamsRaw = $teamStmt->fetchAll();

        $rank = 1;
        $teams = [];
        foreach ($teamsRaw as $t) {
            $teams[] = [
                'rank' => $rank++,
                'team_id' => (int)$t['team_id'],
                'team_name' => $t['team_name'],
                'total_points' => (int)$t['total_points'],
                'challenges_solved' => (int)$t['challenges_solved'],
                'member_count' => (int)$t['member_count'],
                'last_activity' => $t['last_activity'] ?? 'No activity yet'
            ];
        }

        // 2. All Individuals Ranking
        $indSql = "
            SELECT 
                u.id as user_id,
                u.username,
                u.team_name,
                COALESCE(SUM(s.points), 0) as total_points,
                COUNT(s.id) as challenges_solved,
                MAX(s.solved_at) as last_activity
            FROM users u
            LEFT JOIN solves s ON u.id = s.user_id
            WHERE u.role = 'participant' AND u.is_active = 1
            GROUP BY u.id, u.username, u.team_name
            ORDER BY total_points DESC, last_activity ASC, u.id ASC
        ";
        $indStmt = $pdo->query($indSql);
        $indsRaw = $indStmt->fetchAll();

        $indRank = 1;
        $individuals = [];
        foreach ($indsRaw as $i) {
            $individuals[] = [
                'rank' => $indRank++,
                'user_id' => (int)$i['user_id'],
                'username' => $i['username'],
                'team_name' => $i['team_name'] ?? 'None',
                'total_points' => (int)$i['total_points'],
                'challenges_solved' => (int)$i['challenges_solved'],
                'last_activity' => $i['last_activity'] ?? 'No activity yet'
            ];
        }

        sendJsonResponse([
            'status' => 'success',
            'db_connected' => true,
            'view' => 'admin_full',
            'is_admin' => true,
            'teams' => $teams,
            'individuals' => $individuals
        ]);
    }
} else {
    // Demo Fallback Mode (pre-MySQL import)
    $teamId = $currentUser['team_id'] ?? 1;
    $teamName = $currentUser['team_name'] ?? 'Team Alpha';

    if (!$isAdmin) {
        $teamKey = 'team_' . $teamId;
        $demoTeamSolves = $_SESSION['demo_team_solves'][$teamKey] ?? [];

        // Realistic seed solves for demo display if empty
        if (empty($demoTeamSolves)) {
            $demoTeamSolves = [
                'dict-chatbot' => ['title' => 'DICT Chatbot', 'category' => 'Web', 'points' => 100, 'solver' => 'cyberspartan', 'solved_at' => date('Y-m-d H:i:s', time() - 3600)],
                'credential-vault' => ['title' => 'Credential Vault', 'category' => 'Miscellaneous', 'points' => 30, 'solver' => 'alpha_hunter', 'solved_at' => date('Y-m-d H:i:s', time() - 1800)],
            ];
        }

        $solvedList = [];
        $totalPts = 0;
        $memberStats = [
            'cyberspartan' => ['points' => 0, 'solves' => 0],
            'alpha_hunter' => ['points' => 0, 'solves' => 0],
            'alpha_sentry' => ['points' => 0, 'solves' => 0],
            'alpha_vanguard' => ['points' => 0, 'solves' => 0],
        ];

        if ($teamId == 2) {
            $memberStats = [
                'bravo_falcon' => ['points' => 0, 'solves' => 0],
                'bravo_shadow' => ['points' => 0, 'solves' => 0],
                'bravo_cipher' => ['points' => 0, 'solves' => 0],
                'bravo_specter' => ['points' => 0, 'solves' => 0],
            ];
        }

        foreach ($demoTeamSolves as $slug => $sData) {
            $pts = (int)($sData['points'] ?? 100);
            $totalPts += $pts;
            $solver = $sData['solver'] ?? 'cyberspartan';
            if (isset($memberStats[$solver])) {
                $memberStats[$solver]['points'] += $pts;
                $memberStats[$solver]['solves'] += 1;
            }
            $solvedList[] = [
                'challenge_id' => 1,
                'title' => $sData['title'] ?? $slug,
                'category' => $sData['category'] ?? 'General',
                'difficulty' => 'Medium',
                'points' => $pts,
                'solved_by' => $solver,
                'solved_at' => $sData['solved_at'] ?? date('Y-m-d H:i:s')
            ];
        }

        $formattedMembers = [];
        $uid = ($teamId == 1 ? 2 : 6);
        foreach ($memberStats as $mName => $mInfo) {
            $formattedMembers[] = [
                'user_id' => $uid++,
                'username' => $mName,
                'points' => $mInfo['points'],
                'solves' => $mInfo['solves']
            ];
        }

        sendJsonResponse([
            'status' => 'success',
            'db_connected' => false,
            'is_demo' => true,
            'view' => 'participant_isolated',
            'is_admin' => false,
            'privacy_notice' => 'Confidential Competition Mode: In accordance with HNU CTF rules, competitor standings are kept private during competition. Only your team\'s points and verified solves are visible.',
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
            'team' => [
                'team_id' => $teamId,
                'team_name' => $teamName,
                'total_points' => $totalPts,
                'challenges_solved' => count($solvedList),
                'members' => $formattedMembers,
                'solved_challenges' => $solvedList
            ]
        ]);
    } else {
        // Admin full demo view
        $demoTeams = [
            ['rank' => 1, 'team_id' => 1, 'team_name' => 'Team Alpha', 'total_points' => 450, 'challenges_solved' => 5, 'member_count' => 4, 'last_activity' => date('Y-m-d H:i:s', time() - 300)],
            ['rank' => 2, 'team_id' => 2, 'team_name' => 'Team Bravo', 'total_points' => 380, 'challenges_solved' => 4, 'member_count' => 4, 'last_activity' => date('Y-m-d H:i:s', time() - 900)],
            ['rank' => 3, 'team_id' => 3, 'team_name' => 'Team Gamma', 'total_points' => 210, 'challenges_solved' => 2, 'member_count' => 4, 'last_activity' => date('Y-m-d H:i:s', time() - 2400)]
        ];

        $demoIndividuals = [
            ['rank' => 1, 'user_id' => 2, 'username' => 'cyberspartan', 'team_name' => 'Team Alpha', 'total_points' => 250, 'challenges_solved' => 3, 'last_activity' => date('Y-m-d H:i:s', time() - 300)],
            ['rank' => 2, 'user_id' => 6, 'username' => 'bravo_falcon', 'team_name' => 'Team Bravo', 'total_points' => 200, 'challenges_solved' => 2, 'last_activity' => date('Y-m-d H:i:s', time() - 900)],
            ['rank' => 3, 'user_id' => 7, 'username' => 'bravo_shadow', 'team_name' => 'Team Bravo', 'total_points' => 180, 'challenges_solved' => 2, 'last_activity' => date('Y-m-d H:i:s', time() - 1200)],
            ['rank' => 4, 'user_id' => 3, 'username' => 'alpha_hunter', 'team_name' => 'Team Alpha', 'total_points' => 150, 'challenges_solved' => 1, 'last_activity' => date('Y-m-d H:i:s', time() - 1500)],
            ['rank' => 5, 'user_id' => 10, 'username' => 'gamma_recon', 'team_name' => 'Team Gamma', 'total_points' => 120, 'challenges_solved' => 1, 'last_activity' => date('Y-m-d H:i:s', time() - 2400)],
            ['rank' => 6, 'user_id' => 11, 'username' => 'gamma_spark', 'team_name' => 'Team Gamma', 'total_points' => 90, 'challenges_solved' => 1, 'last_activity' => date('Y-m-d H:i:s', time() - 2700)],
            ['rank' => 7, 'user_id' => 4, 'username' => 'alpha_sentry', 'team_name' => 'Team Alpha', 'total_points' => 50, 'challenges_solved' => 1, 'last_activity' => date('Y-m-d H:i:s', time() - 3600)],
            ['rank' => 8, 'user_id' => 5, 'username' => 'alpha_vanguard', 'team_name' => 'Team Alpha', 'total_points' => 0, 'challenges_solved' => 0, 'last_activity' => 'No activity yet']
        ];

        sendJsonResponse([
            'status' => 'success',
            'db_connected' => false,
            'is_demo' => true,
            'view' => 'admin_full',
            'is_admin' => true,
            'teams' => $demoTeams,
            'individuals' => $demoIndividuals
        ]);
    }
}
