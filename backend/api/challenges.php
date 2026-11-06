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
            
            // Build query
            $sql = "
                SELECT 
                    c.id, c.slug, c.title, c.category, c.difficulty, c.points, 
                    c.description, c.target_info, c.is_enabled, c.image_path, c.created_at,
                    " . ($isAdmin ? "c.correct_flag," : "") . "
                    (SELECT COUNT(*) FROM solves s WHERE s.challenge_id = c.id) as solve_count,
                    " . ($currentUser ? "(SELECT COUNT(*) FROM solves s2 WHERE s2.challenge_id = c.id AND s2.user_id = " . (int)$currentUser['id'] . ") as is_solved" : "0 as is_solved") . "
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

            foreach ($challenges as &$ch) {
                $ch['id'] = (int)$ch['id'];
                $ch['points'] = (int)$ch['points'];
                $ch['is_enabled'] = (bool)$ch['is_enabled'];
                $ch['is_solved'] = (bool)$ch['is_solved'];
                $ch['solve_count'] = (int)$ch['solve_count'];
                $ch['attachments'] = $attachmentsByChallenge[$ch['id']] ?? [];

                // Filter by solved/unsolved if requested
                if ($statusFilter === 'solved' && !$ch['is_solved']) continue;
                if ($statusFilter === 'unsolved' && $ch['is_solved']) continue;
            }

            sendJsonResponse([
                'status' => 'success',
                'db_connected' => true,
                'count' => count($challenges),
                'challenges' => array_values($challenges)
            ]);
        } else {
            // Offline / Pre-database setup mode
            $fallback = getFallbackChallenges();
            $solvedSlugs = $_SESSION['demo_solves'] ?? [];

            $filtered = [];
            foreach ($fallback as $ch) {
                if (!empty($category) && $category !== 'All' && strcasecmp($ch['category'], $category) !== 0) continue;
                if (!empty($difficulty) && $difficulty !== 'All' && strcasecmp($ch['difficulty'], $difficulty) !== 0) continue;
                if (!empty($search) && stripos($ch['title'], $search) === false && stripos($ch['description'], $search) === false) continue;

                $ch['is_solved'] = in_array($ch['slug'], $solvedSlugs);
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

