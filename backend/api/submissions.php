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
            $result = verifyAndProcessFlag($user['id'], $user['username'], $challengeId, $flag, $user['team_id']);
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

            $teamKey = 'team_' . ($user['team_id'] ?? 'solo_' . $user['id']);
            if (!isset($_SESSION['demo_team_solves'])) {
                $_SESSION['demo_team_solves'] = [];
            }
            if (!isset($_SESSION['demo_team_solves'][$teamKey])) {
                $_SESSION['demo_team_solves'][$teamKey] = [];
            }

            // Check if solved by team
            if (isset($_SESSION['demo_team_solves'][$teamKey][$target['slug']])) {
                $solvedBy = $_SESSION['demo_team_solves'][$teamKey][$target['slug']]['solver'] ?? 'teammate';
                sendJsonResponse([
                    'status' => 'info',
                    'code' => 'ALREADY_SOLVED_BY_TEAM',
                    'message' => ($solvedBy === $user['username'])
                        ? 'You have already solved this challenge.'
                        : "This challenge has already been solved by your teammate '{$solvedBy}'. Your team has already secured these points!",
                    'solved_by' => $solvedBy
                ]);
            }

            if (strcmp($flag, $target['correct_flag']) === 0) {
                $_SESSION['demo_team_solves'][$teamKey][$target['slug']] = [
                    'solver' => $user['username'],
                    'solved_at' => date('Y-m-d H:i:s'),
                    'points' => (int)$target['points'],
                    'title' => $target['title']
                ];
                if (!isset($_SESSION['demo_solves'])) {
                    $_SESSION['demo_solves'] = [];
                }
                $_SESSION['demo_solves'][] = $target['slug'];

                sendJsonResponse([
                    'status' => 'success',
                    'code' => 'CORRECT_FLAG',
                    'message' => "Congratulations! That is the correct flag for '{$target['title']}'! Your team earned {$target['points']} points!",
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

