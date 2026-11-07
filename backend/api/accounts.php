<?php
/**
 * HNU CTF - Accounts Management API
 * Admin-only. Manages participant teams and accounts.
 * Supports: list all teams+members, create team, create individual account, delete account.
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

// Ensure plain_password column exists if database is connected
if ($dbConnected && $pdo) {
    try {
        $colCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'plain_password'");
        if ($colCheck->rowCount() === 0) {
            $pdo->exec("ALTER TABLE users ADD COLUMN plain_password VARCHAR(255) NULL");
            $pdo->exec("UPDATE users SET plain_password = 'Participant123!' WHERE role = 'participant' AND (plain_password IS NULL OR plain_password = '')");
            $pdo->exec("UPDATE users SET plain_password = 'Admin@HNU2026!' WHERE role = 'admin' AND (plain_password IS NULL OR plain_password = '')");
        }
    } catch (Exception $e) {
        // Ignore column check errors
    }
}

switch ($action) {

    // ── List all teams and their members ────────────────────────────────────
    case 'list':
        if ($dbConnected && $pdo) {
            // Fetch teams
            $teamsStmt = $pdo->query("SELECT id, name FROM teams ORDER BY name ASC");
            $teams = $teamsStmt->fetchAll(PDO::FETCH_ASSOC);

            $result = [];
            foreach ($teams as $team) {
                $membersStmt = $pdo->prepare("
                    SELECT id, username, role, created_at, COALESCE(plain_password, 'Participant123!') AS plain_password
                    FROM users
                    WHERE team_id = ?
                    ORDER BY id ASC
                ");
                $membersStmt->execute([$team['id']]);
                $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

                $result[] = [
                    'team_id'   => $team['id'],
                    'team_name' => $team['name'],
                    'members'   => $members,
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
            // Demo fallback
            sendJsonResponse([
                'status' => 'success',
                'teams'  => [
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
                ],
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
            // Check team doesn't already exist
            $existStmt = $pdo->prepare("SELECT id FROM teams WHERE name = ?");
            $existStmt->execute([$teamName]);
            if ($existStmt->fetch()) {
                sendJsonResponse(['status' => 'error', 'message' => "Team \"$teamName\" already exists"], 409);
            }

            // Create team
            $pdo->prepare("INSERT INTO teams (name) VALUES (?)")->execute([$teamName]);
            $teamId = $pdo->lastInsertId();

            $created = [];
            $errors  = [];

            foreach (array_slice($members, 0, 4) as $m) {
                $username = trim($m['username'] ?? '');
                $password = $m['password'] ?? '';

                if (!$username || !$password) continue;

                // Check username unique
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

    // ── Delete an account ───────────────────────────────────────────────────
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
            // Clean up solves first
            $pdo->prepare("DELETE FROM solves WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM submissions WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
            sendJsonResponse(['status' => 'success', 'message' => 'Account deleted']);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => 'Deleted (demo mode)']);
        }
        break;

    default:
        sendJsonResponse(['status' => 'error', 'message' => 'Invalid action'], 400);
}
