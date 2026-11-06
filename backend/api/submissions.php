<?php
/**
 * HNU CTF - Flag Submission API Endpoint
 * Verifies flags, awards points, prevents duplicates,
 * and passes failed attempts to the SOC brute-force detection engine.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../includes/flag_verification.php';
require_once __DIR__ . '/../includes/brute_force_detection.php';

setupCorsHeaders();
ensureSessionStarted();

$user = requireAuth();
checkIpSecurityEnforcement();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? 'submit' : 'history');
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

switch ($action) {
    case 'submit':
        if ($method !== 'POST') {
            sendJsonResponse(['status' => 'error', 'message' => 'Method not allowed'], 405);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $challengeId = (int)($input['challenge_id'] ?? 0);
        $flag = trim($input['flag'] ?? '');

        if (!$challengeId || empty($flag)) {
            sendJsonResponse(['status' => 'error', 'message' => 'Challenge ID and flag are required.'], 400);
        }

        if ($dbConnected && $pdo) {
            $result = verifyAndProcessFlag($user['id'], $user['username'], $challengeId, $flag);
            $statusCode = ($result['status'] === 'success') ? 200 : ($result['code'] === 'INVALID_FORMAT' ? 400 : 200);
            sendJsonResponse($result, $statusCode);
        } else {
            // Pre-database / Demo Mode Verification
            if (!isValidFlagFormat($flag)) {
                sendJsonResponse([
                    'status' => 'error',
                    'code' => 'INVALID_FORMAT',
                    'message' => 'Invalid flag format. Flags must follow the standard pattern: HNU{...}'
                ], 400);
            }

            // Load fallback challenges to test
            $manifestPath = __DIR__ . '/../../storage/challenges_data.json';
            $challenges = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
            $target = null;
            foreach ($challenges as $c) {
                if ($c['id'] === $challengeId) {
                    $target = $c;
                    break;
                }
            }

            if (!$target) {
                sendJsonResponse(['status' => 'error', 'message' => 'Challenge not found'], 404);
            }

            if (!isset($_SESSION['demo_solves'])) {
                $_SESSION['demo_solves'] = [];
            }

            if (in_array($target['slug'], $_SESSION['demo_solves'])) {
                sendJsonResponse([
                    'status' => 'info',
                    'code' => 'ALREADY_SOLVED',
                    'message' => 'You have already solved this challenge. Duplicate points are not awarded.'
                ]);
            }

            if (strcmp($flag, $target['correct_flag']) === 0) {
                $_SESSION['demo_solves'][] = $target['slug'];
                sendJsonResponse([
                    'status' => 'success',
                    'code' => 'CORRECT_FLAG',
                    'message' => "Congratulations! That is the correct flag for '{$target['title']}'! (Demo Mode)",
                    'points_awarded' => (int)$target['points']
                ]);
            } else {
                // Record failed count in session for demo brute force testing
                $_SESSION['demo_failed_attempts'] = ($_SESSION['demo_failed_attempts'] ?? 0) + 1;
                sendJsonResponse([
                    'status' => 'error',
                    'code' => 'INCORRECT_FLAG',
                    'message' => 'Incorrect flag. Please analyze the materials and try again.'
                ]);
            }
        }
        break;

    case 'history':
        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("
                SELECT s.id, s.submitted_flag, s.is_correct, s.points_awarded, s.submitted_at, c.title as challenge_title, c.category
                FROM submissions s
                JOIN challenges c ON s.challenge_id = c.id
                WHERE s.user_id = ?
                ORDER BY s.submitted_at DESC
                LIMIT 50
            ");
            $stmt->execute([$user['id']]);
            $history = $stmt->fetchAll();

            sendJsonResponse([
                'status' => 'success',
                'submissions' => $history
            ]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'submissions' => []
            ]);
        }
        break;

    default:
        sendJsonResponse(['status' => 'error', 'message' => 'Invalid action'], 400);
}

