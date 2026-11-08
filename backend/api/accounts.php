<?php
/**
 * HNU CTF - Accounts Management API
 * Admin-only. Manages participant teams and accounts.
 * Supports: list all teams+members, create team, delete team, create individual account, 
 * delete account, suspend/unsuspend team and user.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/admin.php';

setupCorsHeaders();
ensureSessionStarted();

$action = $_GET['action'] ?? 'list';
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

requireAdmin();

// Initialize demo suspension session array if needed
if (!isset($_SESSION['demo_suspensions'])) {
    $_SESSION['demo_suspensions'] = [
        'users' => [],
        'teams' => []
    ];
}

switch ($action) {

    // ── List all teams and their members ────────────────────────────────────
    case 'list':
        if ($dbConnected && $pdo) {
            // Fetch teams
            $teamsStmt = $pdo->query("SELECT id, name, suspended_until, suspension_reason FROM teams ORDER BY name ASC");
            $teams = $teamsStmt->fetchAll(PDO::FETCH_ASSOC);

            $result = [];
            $nowTs = time();

            foreach ($teams as $team) {
                $teamSuspended = !empty($team['suspended_until']) && strtotime($team['suspended_until']) > $nowTs;
                $teamRemaining = $teamSuspended ? (strtotime($team['suspended_until']) - $nowTs) : 0;

                $membersStmt = $pdo->prepare("
                    SELECT id, username, role, created_at, 
                           COALESCE(plain_password, 'Participant123!') AS plain_password,
                           suspended_until, suspension_reason
                    FROM users
                    WHERE team_id = ?
                    ORDER BY id ASC
                ");
                $membersStmt->execute([$team['id']]);
                $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

                $formattedMembers = [];
                foreach ($members as $m) {
                    $mSuspended = (!empty($m['suspended_until']) && strtotime($m['suspended_until']) > $nowTs) || $teamSuspended;
                    $mRemaining = $mSuspended 
                        ? max(
                            !empty($m['suspended_until']) ? (strtotime($m['suspended_until']) - $nowTs) : 0,
                            $teamRemaining
                          ) 
                        : 0;

                    $formattedMembers[] = [
                        'id' => (int)$m['id'],
                        'username' => $m['username'],
                        'role' => $m['role'],
                        'created_at' => $m['created_at'],
                        'plain_password' => $m['plain_password'],
                        'is_suspended' => $mSuspended,
                        'suspension_remaining' => $mRemaining,
                        'suspension_reason' => $m['suspension_reason'] ?: ($team['suspension_reason'] ?: "You're suspended for 30mins.... you're doing something not in the rules")
                    ];
                }

                $result[] = [
                    'team_id'              => (int)$team['id'],
                    'team_name'            => $team['name'],
                    'is_suspended'         => $teamSuspended,
                    'suspension_remaining' => $teamRemaining,
                    'suspension_reason'    => $team['suspension_reason'],
                    'members'              => $formattedMembers,
                ];
            }

            // Fetch admins
            $adminsStmt = $pdo->query("
                SELECT id, username, role, created_at, COALESCE(plain_password, 'Admin@HNU2026!') AS plain_password
                FROM users
                WHERE role = 'admin'
                ORDER BY id ASC
            ");
            $admins = $adminsStmt ? $adminsStmt->fetchAll(PDO::FETCH_ASSOC) : [];

            sendJsonResponse([
                'status' => 'success',
                'teams'  => $result,
                'admins' => $admins,
            ]);
        } else {
            // Demo fallback with session-persisted suspensions
            $nowTs = time();
            $demoTeams = [
                [
                    'team_id'   => 1,
                    'team_name' => 'Team Alpha',
                    'members'   => [
                        ['id' => 2, 'username' => 'cyberspartan',  'role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                        ['id' => 3, 'username' => 'alpha_hunter',  'role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                        ['id' => 4, 'username' => 'alpha_sentry',  'role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                        ['id' => 5, 'username' => 'alpha_vanguard','role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                    ],
                ],
                [
                    'team_id'   => 2,
                    'team_name' => 'Team Bravo',
                    'members'   => [
                        ['id' => 6, 'username' => 'bravo_falcon', 'role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                        ['id' => 7, 'username' => 'bravo_shadow', 'role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                        ['id' => 8, 'username' => 'bravo_cipher', 'role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                        ['id' => 9, 'username' => 'bravo_specter','role' => 'participant', 'created_at' => '2026-11-01', 'plain_password' => 'Participant123!'],
                    ],
                ],
            ];

            // Filter out deleted demo teams / users
            $deletedTeams = $_SESSION['demo_deleted_teams'] ?? [];
            $deletedUsers = $_SESSION['demo_deleted_users'] ?? [];

            $finalTeams = [];
            foreach ($demoTeams as $t) {
                if (in_array($t['team_id'], $deletedTeams)) continue;
                $tSusp = $_SESSION['demo_suspensions']['teams'][$t['team_id']] ?? null;
                $isTSusp = ($tSusp && $tSusp['until'] > $nowTs);
                $tRem = $isTSusp ? ($tSusp['until'] - $nowTs) : 0;

                $filteredMembers = [];
                foreach ($t['members'] as $m) {
                    if (in_array($m['id'], $deletedUsers)) continue;
                    $mSusp = $_SESSION['demo_suspensions']['users'][$m['id']] ?? null;
                    $isMSusp = ($mSusp && $mSusp['until'] > $nowTs) || $isTSusp;
                    $mRem = $isMSusp ? max($mSusp ? ($mSusp['until'] - $nowTs) : 0, $tRem) : 0;

                    $filteredMembers[] = array_merge($m, [
                        'is_suspended' => $isMSusp,
                        'suspension_remaining' => $mRem,
                        'suspension_reason' => $mSusp['reason'] ?? ($tSusp['reason'] ?? "You're suspended for 30mins.... you're doing something not in the rules")
                    ]);
                }

                $finalTeams[] = [
                    'team_id' => $t['team_id'],
                    'team_name' => $t['team_name'],
                    'is_suspended' => $isTSusp,
                    'suspension_remaining' => $tRem,
                    'suspension_reason' => $tSusp['reason'] ?? null,
                    'members' => $filteredMembers
                ];
            }

            sendJsonResponse([
                'status' => 'success',
                'teams'  => $finalTeams,
                'admins' => [
                    ['id' => 1, 'username' => 'admin', 'role' => 'admin', 'created_at' => '2026-11-01', 'plain_password' => 'Admin@HNU2026!'],
                ],
            ]);
        }
        break;

    // ── Create a new team with up to 4 members ──────────────────────────────
    case 'create_team':
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $teamName = trim($input['team_name'] ?? '');
        $members  = $input['members'] ?? [];

        if (!$teamName) {
            sendJsonResponse(['status' => 'error', 'message' => 'Team name is required'], 400);
        }

        if ($dbConnected && $pdo) {
            $existStmt = $pdo->prepare("SELECT id FROM teams WHERE name = ?");
            $existStmt->execute([$teamName]);
            if ($existStmt->fetch()) {
                sendJsonResponse(['status' => 'error', 'message' => "Team \"$teamName\" already exists"], 409);
            }

            $pdo->prepare("INSERT INTO teams (name) VALUES (?)")->execute([$teamName]);
            $teamId = $pdo->lastInsertId();

            $created = [];
            $errors  = [];

            foreach (array_slice($members, 0, 4) as $m) {
                $username = trim($m['username'] ?? '');
                $password = $m['password'] ?? '';

                if (!$username || !$password) continue;

                $uStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
                $uStmt->execute([$username]);
                if ($uStmt->fetch()) {
                    $errors[] = "Username \"$username\" already exists – skipped.";
                    continue;
                }

                $hash = password_hash($password, PASSWORD_BCRYPT);
                try {
                    $pdo->prepare("
                        INSERT INTO users (username, password_hash, plain_password, role, team_id, team_name, created_at)
                        VALUES (?, ?, ?, 'participant', ?, ?, NOW())
                    ")->execute([$username, $hash, $password, $teamId, $teamName]);
                } catch (Exception $insEx) {
                    $pdo->prepare("
                        INSERT INTO users (username, password_hash, role, team_id, team_name, created_at)
                        VALUES (?, ?, 'participant', ?, ?, NOW())
                    ")->execute([$username, $hash, $teamId, $teamName]);
                }
                $created[] = $username;
            }

            sendJsonResponse([
                'status'    => 'success',
                'message'   => "Team \"$teamName\" created with " . count($created) . " members.",
                'team_id'   => $teamId,
                'created'   => $created,
                'warnings'  => $errors,
            ]);
        } else {
            sendJsonResponse([
                'status'  => 'success',
                'message' => "Team \"$teamName\" created (demo mode – not persisted).",
                'team_id' => rand(10, 99),
            ]);
        }
        break;

    // ── Delete an entire team and its members ────────────────────────────────
    case 'delete_team':
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $teamId = (int)($input['team_id'] ?? 0);

        if (!$teamId) {
            sendJsonResponse(['status' => 'error', 'message' => 'Team ID required'], 400);
        }

        if ($dbConnected && $pdo) {
            // Fetch member IDs
            $memStmt = $pdo->prepare("SELECT id FROM users WHERE team_id = ?");
            $memStmt->execute([$teamId]);
            $memberIds = $memStmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($memberIds as $mid) {
                $pdo->prepare("DELETE FROM solves WHERE user_id = ?")->execute([$mid]);
                $pdo->prepare("DELETE FROM submissions WHERE user_id = ?")->execute([$mid]);
                $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$mid]);
            }

            $pdo->prepare("DELETE FROM teams WHERE id = ?")->execute([$teamId]);

            sendJsonResponse([
                'status'  => 'success', 
                'message' => 'Team and all associated members removed successfully'
            ]);
        } else {
            $_SESSION['demo_deleted_teams'] = array_unique(array_merge(
                $_SESSION['demo_deleted_teams'] ?? [], 
                [$teamId]
            ));
            sendJsonResponse(['status' => 'success', 'message' => 'Team removed (demo mode)']);
        }
        break;

    // ── Delete a single account ─────────────────────────────────────────────
    case 'delete_account':
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = (int)($input['id'] ?? 0);

        if (!$userId) {
            sendJsonResponse(['status' => 'error', 'message' => 'User ID required'], 400);
        }

        // Don't allow deleting yourself
        $me = requireAuth();
        if ((int)$me['id'] === $userId) {
            sendJsonResponse(['status' => 'error', 'message' => 'You cannot delete your own account'], 403);
        }

        if ($dbConnected && $pdo) {
            $pdo->prepare("DELETE FROM solves WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM submissions WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
            sendJsonResponse(['status' => 'success', 'message' => 'Member account deleted successfully']);
        } else {
            $_SESSION['demo_deleted_users'] = array_unique(array_merge(
                $_SESSION['demo_deleted_users'] ?? [], 
                [$userId]
            ));
            sendJsonResponse(['status' => 'success', 'message' => 'Member deleted (demo mode)']);
        }
        break;

    // ── Suspend a user (Default: 30 minutes) ─────────────────────────────────
    case 'suspend_user':
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId   = (int)($input['user_id'] ?? 0);
        $minutes  = (int)($input['minutes'] ?? 30);
        $reason   = trim($input['reason'] ?? '') ?: "You're suspended for 30mins.... you're doing something not in the rules";

        if (!$userId) {
            sendJsonResponse(['status' => 'error', 'message' => 'User ID required'], 400);
        }

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("
                UPDATE users 
                SET suspended_until = DATE_ADD(NOW(), INTERVAL ? MINUTE), 
                    suspension_reason = ? 
                WHERE id = ?
            ");
            $stmt->execute([$minutes, $reason, $userId]);
            sendJsonResponse([
                'status'  => 'success', 
                'message' => "Participant has been suspended for {$minutes} minutes."
            ]);
        } else {
            $_SESSION['demo_suspensions']['users'][$userId] = [
                'until' => time() + ($minutes * 60),
                'reason' => $reason
            ];
            sendJsonResponse([
                'status'  => 'success', 
                'message' => "Participant suspended for {$minutes} minutes (demo mode)."
            ]);
        }
        break;

    // ── Unsuspend a user ────────────────────────────────────────────────────
    case 'unsuspend_user':
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $userId = (int)($input['user_id'] ?? 0);

        if (!$userId) {
            sendJsonResponse(['status' => 'error', 'message' => 'User ID required'], 400);
        }

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("
                UPDATE users 
                SET suspended_until = NULL, 
                    suspension_reason = NULL 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            sendJsonResponse(['status' => 'success', 'message' => 'Participant suspension lifted.']);
        } else {
            unset($_SESSION['demo_suspensions']['users'][$userId]);
            sendJsonResponse(['status' => 'success', 'message' => 'Suspension lifted (demo mode).']);
        }
        break;

    // ── Suspend an entire team (30 minutes) ──────────────────────────────────
    case 'suspend_team':
        $input   = json_decode(file_get_contents('php://input'), true) ?? [];
        $teamId  = (int)($input['team_id'] ?? 0);
        $minutes = (int)($input['minutes'] ?? 30);
        $reason  = trim($input['reason'] ?? '') ?: "You're suspended for 30mins.... you're doing something not in the rules";

        if (!$teamId) {
            sendJsonResponse(['status' => 'error', 'message' => 'Team ID required'], 400);
        }

        if ($dbConnected && $pdo) {
            // Update team
            $tStmt = $pdo->prepare("
                UPDATE teams 
                SET suspended_until = DATE_ADD(NOW(), INTERVAL ? MINUTE), 
                    suspension_reason = ? 
                WHERE id = ?
            ");
            $tStmt->execute([$minutes, $reason, $teamId]);

            // Also update all users in that team
            $uStmt = $pdo->prepare("
                UPDATE users 
                SET suspended_until = DATE_ADD(NOW(), INTERVAL ? MINUTE), 
                    suspension_reason = ? 
                WHERE team_id = ?
            ");
            $uStmt->execute([$minutes, $reason, $teamId]);

            sendJsonResponse([
                'status'  => 'success', 
                'message' => "Entire team and its members have been suspended for {$minutes} minutes."
            ]);
        } else {
            $_SESSION['demo_suspensions']['teams'][$teamId] = [
                'until' => time() + ($minutes * 60),
                'reason' => $reason
            ];
            sendJsonResponse([
                'status'  => 'success', 
                'message' => "Team suspended for {$minutes} minutes (demo mode)."
            ]);
        }
        break;

    // ── Unsuspend an entire team ────────────────────────────────────────────
    case 'unsuspend_team':
        $input  = json_decode(file_get_contents('php://input'), true) ?? [];
        $teamId = (int)($input['team_id'] ?? 0);

        if (!$teamId) {
            sendJsonResponse(['status' => 'error', 'message' => 'Team ID required'], 400);
        }

        if ($dbConnected && $pdo) {
            $tStmt = $pdo->prepare("
                UPDATE teams 
                SET suspended_until = NULL, 
                    suspension_reason = NULL 
                WHERE id = ?
            ");
            $tStmt->execute([$teamId]);

            $uStmt = $pdo->prepare("
                UPDATE users 
                SET suspended_until = NULL, 
                    suspension_reason = NULL 
                WHERE team_id = ?
            ");
            $uStmt->execute([$teamId]);

            sendJsonResponse(['status' => 'success', 'message' => 'Team suspension lifted for all members.']);
        } else {
            unset($_SESSION['demo_suspensions']['teams'][$teamId]);
            sendJsonResponse(['status' => 'success', 'message' => 'Team suspension lifted (demo mode).']);
        }
        break;

    // ── Create a single account (admin or participant) ──────────────────────
    case 'create_account':
        $input    = json_decode(file_get_contents('php://input'), true) ?? [];
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';
        $role     = in_array($input['role'] ?? '', ['admin','participant']) ? $input['role'] : 'participant';

        if (!$username || !$password) {
            sendJsonResponse(['status' => 'error', 'message' => 'Username and password are required'], 400);
        }

        if ($dbConnected && $pdo) {
            $existStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $existStmt->execute([$username]);
            if ($existStmt->fetch()) {
                sendJsonResponse(['status' => 'error', 'message' => "Username \"$username\" already exists"], 409);
            }

            $hash = password_hash($password, PASSWORD_BCRYPT);
            try {
                $pdo->prepare("
                    INSERT INTO users (username, password_hash, plain_password, role, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                ")->execute([$username, $hash, $password, $role]);
            } catch (Exception $insEx) {
                $pdo->prepare("
                    INSERT INTO users (username, password_hash, role, created_at)
                    VALUES (?, ?, ?, NOW())
                ")->execute([$username, $hash, $role]);
            }

            sendJsonResponse(['status' => 'success', 'message' => "Account \"$username\" ($role) created."]);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => "Account created (demo mode – not persisted)."]);
        }
        break;

    default:
        sendJsonResponse(['status' => 'error', 'message' => 'Invalid action'], 400);
}
