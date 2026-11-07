<?php
/**
 * HNU CTF - Challenges API Endpoint
 * Handles challenge browsing, category filtering, solver stats,
 * and administrative challenge management (add, edit, toggle flags).
 * Never exposes correct flags in public participant queries.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/admin.php';

setupCorsHeaders();
ensureSessionStarted();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();
$currentUser = getOptionalAuth();

// Pre-packaged authentic HNU CTF challenge fallback dataset
function getFallbackChallenges() {
    static $cached = null;
    if ($cached !== null) return $cached;
    $manifestPath = __DIR__ . '/../../storage/challenges_data.json';
    if (file_exists($manifestPath)) {
        $cached = json_decode(file_get_contents($manifestPath), true);
        return $cached;
    }
    return [];
}

switch ($action) {
    case 'list':
        $category = $_GET['category'] ?? null;
        $difficulty = $_GET['difficulty'] ?? null;
        $search = trim($_GET['search'] ?? '');
        $statusFilter = $_GET['status'] ?? null; // 'solved' or 'unsolved'

        if ($dbConnected && $pdo) {
            $isAdmin = ($currentUser && $currentUser['role'] === 'admin');
            
            // Determine solve subqueries based on user & team
            if ($currentUser && !empty($currentUser['team_id'])) {
                $teamId = (int)$currentUser['team_id'];
                $solveSql = "
                    (SELECT COUNT(*) FROM solves s2 JOIN users u2 ON s2.user_id = u2.id WHERE s2.challenge_id = c.id AND u2.team_id = {$teamId}) as is_solved,
                    (SELECT u3.username FROM solves s3 JOIN users u3 ON s3.user_id = u3.id WHERE s3.challenge_id = c.id AND u3.team_id = {$teamId} ORDER BY s3.solved_at ASC LIMIT 1) as solved_by_username
                ";
            } elseif ($currentUser) {
                $uid = (int)$currentUser['id'];
                $solveSql = "
                    (SELECT COUNT(*) FROM solves s2 WHERE s2.challenge_id = c.id AND s2.user_id = {$uid}) as is_solved,
                    (SELECT u3.username FROM solves s3 JOIN users u3 ON s3.user_id = u3.id WHERE s3.challenge_id = c.id AND s3.user_id = {$uid} LIMIT 1) as solved_by_username
                ";
            } else {
                $solveSql = "0 as is_solved, NULL as solved_by_username";
            }

            // Build query
            $sql = "
                SELECT 
                    c.id, c.slug, c.title, c.category, c.difficulty, c.points, 
                    c.description, c.target_info, c.is_enabled, c.image_path, c.created_at,
                    " . ($isAdmin ? "c.correct_flag," : "") . "
                    (SELECT COUNT(*) FROM solves s WHERE s.challenge_id = c.id) as solve_count,
                    {$solveSql}
                FROM challenges c
                WHERE 1=1
            ";

            $params = [];

            if (!$isAdmin) {
                $sql .= " AND c.is_enabled = 1";
            }

            if (!empty($category) && $category !== 'All') {
                $sql .= " AND c.category = ?";
                $params[] = $category;
            }

            if (!empty($difficulty) && $difficulty !== 'All') {
                $sql .= " AND c.difficulty = ?";
                $params[] = $difficulty;
            }

            if (!empty($search)) {
                $sql .= " AND (c.title LIKE ? OR c.description LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }

            $sql .= " ORDER BY c.category ASC, c.points ASC, c.id ASC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $challenges = $stmt->fetchAll();

            // Fetch attachments for these challenges
            $attachStmt = $pdo->query("SELECT id, challenge_id, filename, file_size, mime_type FROM challenge_attachments");
            $attachmentsByChallenge = [];
            while ($att = $attachStmt->fetch()) {
                $attachmentsByChallenge[$att['challenge_id']][] = [
                    'id' => (int)$att['id'],
                    'filename' => $att['filename'],
                    'file_size' => (int)$att['file_size'],
                    'mime_type' => $att['mime_type']
                ];
            }

            $output = [];
            foreach ($challenges as $ch) {
                $ch['id'] = (int)$ch['id'];
                $ch['points'] = (int)$ch['points'];
                $ch['is_enabled'] = (bool)$ch['is_enabled'];
                $isSolved = ((int)$ch['is_solved']) > 0;
                $ch['is_solved'] = $isSolved;
                $ch['solved_by_team'] = $isSolved;
                $solver = $ch['solved_by_username'] ?? null;
                $ch['solved_by_username'] = $solver;
                $ch['solved_by_teammate'] = ($isSolved && $currentUser && $solver && $solver !== $currentUser['username']);
                $ch['solve_count'] = (int)$ch['solve_count'];
                $ch['attachments'] = $attachmentsByChallenge[$ch['id']] ?? [];

                // Filter by solved/unsolved if requested
                if ($statusFilter === 'solved' && !$ch['is_solved']) continue;
                if ($statusFilter === 'unsolved' && $ch['is_solved']) continue;

                $output[] = $ch;
            }

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'count' => count($output),
                'challenges' => $output
            ]);
        } else {
            // Offline / Pre-database setup mode
            $fallback = getFallbackChallenges();
            $teamKey = 'team_' . ($currentUser['team_id'] ?? 'solo_' . ($currentUser['id'] ?? 'guest'));
            $demoTeamSolves = $_SESSION['demo_team_solves'][$teamKey] ?? [];
            $legacySolves = $_SESSION['demo_solves'] ?? [];

            $filtered = [];
            foreach ($fallback as $ch) {
                if (!empty($category) && $category !== 'All' && strcasecmp($ch['category'], $category) !== 0) continue;
                if (!empty($difficulty) && $difficulty !== 'All' && strcasecmp($ch['difficulty'], $difficulty) !== 0) continue;
                if (!empty($search) && stripos($ch['title'], $search) === false && stripos($ch['description'], $search) === false) continue;

                $isSolved = isset($demoTeamSolves[$ch['slug']]) || in_array($ch['slug'], $legacySolves);
                $solver = isset($demoTeamSolves[$ch['slug']]) ? $demoTeamSolves[$ch['slug']]['solver'] : ($currentUser['username'] ?? 'cyberspartan');

                $ch['is_solved'] = $isSolved;
                $ch['solved_by_team'] = $isSolved;
                $ch['solved_by_username'] = $isSolved ? $solver : null;
                $ch['solved_by_teammate'] = ($isSolved && $currentUser && $solver !== $currentUser['username']);

                if ($statusFilter === 'solved' && !$ch['is_solved']) continue;
                if ($statusFilter === 'unsolved' && $ch['is_solved']) continue;

                // Strip correct_flag if not admin
                $isAdmin = ($currentUser && $currentUser['role'] === 'admin');
                if (!$isAdmin) {
                    unset($ch['correct_flag']);
                }

                $filtered[] = $ch;
            }

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => false,
                'is_demo' => true,
                'count' => count($filtered),
                'challenges' => $filtered
            ]);
        }
        break;

    case 'solvers':
        $challengeId = (int)($_GET['id'] ?? 0);
        if (!$challengeId) {
            sendJsonResponse(['status' => 'error', 'message' => 'Challenge ID is required'], 400);
        }

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("
                SELECT u.id, u.username, s.points, s.solved_at
                FROM solves s
                JOIN users u ON s.user_id = u.id
                WHERE s.challenge_id = ?
                ORDER BY s.solved_at ASC
            ");
            $stmt->execute([$challengeId]);
            $solvers = $stmt->fetchAll();

            sendJsonResponse([
                'status' => 'success',
                'challenge_id' => $challengeId,
                'solvers' => $solvers
            ]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'challenge_id' => $challengeId,
                'solvers' => [
                    ['id' => 2, 'username' => 'cyberspartan', 'points' => 100, 'solved_at' => date('Y-m-d H:i:s', time() - 3600)],
                    ['id' => 3, 'username' => 'bytehunter', 'points' => 100, 'solved_at' => date('Y-m-d H:i:s', time() - 1800)]
                ]
            ]);
        }
        break;

    case 'update':
        requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $challengeId = (int)($input['id'] ?? 0);

        if (!$challengeId) {
            sendJsonResponse(['status' => 'error', 'message' => 'Challenge ID required'], 400);
        }

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("
                UPDATE challenges SET
                    title = ?,
                    category = ?,
                    difficulty = ?,
                    points = ?,
                    description = ?,
                    target_info = ?,
                    correct_flag = ?,
                    is_enabled = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $input['title'],
                $input['category'],
                $input['difficulty'],
                (int)$input['points'],
                $input['description'],
                $input['target_info'] ?? '',
                $input['correct_flag'],
                isset($input['is_enabled']) ? (int)$input['is_enabled'] : 1,
                $challengeId
            ]);

            sendJsonResponse(['status' => 'success', 'message' => 'Challenge updated successfully']);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => 'Updated (Demo Mode: changes in memory)']);
        }
        break;

    case 'toggle':
        requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $challengeId = (int)($input['id'] ?? 0);

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("UPDATE challenges SET is_enabled = NOT is_enabled WHERE id = ?");
            $stmt->execute([$challengeId]);
            sendJsonResponse(['status' => 'success', 'message' => 'Challenge status toggled']);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => 'Toggled in demo mode']);
        }
        break;

    case 'create':
        requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($input['title']) || empty($input['correct_flag'])) {
            sendJsonResponse(['status' => 'error', 'message' => 'Title and correct flag are required'], 400);
        }
        if ($dbConnected && $pdo) {
            $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $input['title'])) . '-' . time();
            $stmt = $pdo->prepare("
                INSERT INTO challenges (title, slug, category, difficulty, points, description, target_info, correct_flag, is_enabled, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $input['title'],
                $slug,
                $input['category'] ?? 'Miscellaneous',
                $input['difficulty'] ?? 'Easy',
                (int)($input['points'] ?? 100),
                $input['description'] ?? '',
                $input['target_info'] ?? '',
                $input['correct_flag'],
                isset($input['is_enabled']) ? (int)$input['is_enabled'] : 1,
            ]);
            sendJsonResponse(['status' => 'success', 'message' => 'Challenge created', 'id' => $pdo->lastInsertId()]);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => 'Challenge created (demo mode)', 'id' => rand(100,999)]);
        }
        break;

    case 'delete':
        requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $challengeId = (int)($input['id'] ?? 0);
        if (!$challengeId) {
            sendJsonResponse(['status' => 'error', 'message' => 'Challenge ID required'], 400);
        }
        if ($dbConnected && $pdo) {
            $pdo->prepare("DELETE FROM solves WHERE challenge_id = ?")->execute([$challengeId]);
            $pdo->prepare("DELETE FROM challenges WHERE id = ?")->execute([$challengeId]);
            sendJsonResponse(['status' => 'success', 'message' => 'Challenge deleted']);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => 'Deleted (demo mode)']);
        }
        break;

    case 'image':
        $slug = $_GET['slug'] ?? '';
        if (!preg_match('/^[a-z0-9\-_]+$/i', $slug)) {
            http_response_code(400);
            exit('Invalid slug');
        }

        $imagePath = __DIR__ . '/../../storage/challenges/' . $slug;
        $files = glob($imagePath . '/*.png');
        if (!empty($files) && file_exists($files[0])) {
            header('Content-Type: image/png');
            readfile($files[0]);
            exit;
        }

        http_response_code(404);
        exit('Image not found');
        break;

    default:
        sendJsonResponse(['status' => 'error', 'message' => 'Invalid action'], 400);
}

