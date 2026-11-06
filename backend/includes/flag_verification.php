<?php
/**
 * HNU CTF - Server-Side Flag Verification Engine
 * Strictly validates HNU{...} format, prevents duplicate solves,
 * securely verifies against backend stored flags, and triggers SOC monitoring.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/audit_logger.php';
require_once __DIR__ . '/brute_force_detection.php';

/**
 * Validate that submitted flag strictly follows HNU{...} format.
 */
function isValidFlagFormat($flag) {
    if (!is_string($flag)) {
        return false;
    }
    $trimmed = trim($flag);
    // Format: HNU{content} where content is at least 1 character
    return (bool)preg_match('/^HNU\{[^\r\n\{\}]+\}$/', $trimmed);
}

/**
 * Process a flag submission.
 */
function verifyAndProcessFlag($userId, $username, $challengeId, $submittedFlag, $teamId = null) {
    $pdo = getDatabaseConnection();
    $ip = getClientIP();
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

    if (!$pdo) {
        return [
            'status' => 'error',
            'code' => 'DB_UNAVAILABLE',
            'message' => 'Database connection unavailable. Please check system configuration.'
        ];
    }

    $submittedFlag = trim($submittedFlag);

    // 1. Validate flag format
    if (!isValidFlagFormat($submittedFlag)) {
        return [
            'status' => 'error',
            'code' => 'INVALID_FORMAT',
            'message' => 'Invalid flag format. Flags must follow the standard pattern: HNU{...}'
        ];
    }

    // 2. Fetch challenge details
    $stmt = $pdo->prepare("SELECT id, title, points, correct_flag, is_enabled FROM challenges WHERE id = ? LIMIT 1");
    $stmt->execute([$challengeId]);
    $challenge = $stmt->fetch();

    if (!$challenge || !$challenge['is_enabled']) {
        return [
            'status' => 'error',
            'code' => 'CHALLENGE_NOT_FOUND',
            'message' => 'Challenge is either unavailable or has been disabled by the administrator.'
        ];
    }

    // Resolve team if not passed
    if ($teamId === null) {
        $uStmt = $pdo->prepare("SELECT team_id, team_name FROM users WHERE id = ?");
        $uStmt->execute([$userId]);
        $uRow = $uStmt->fetch();
        if ($uRow && !empty($uRow['team_id'])) {
            $teamId = (int)$uRow['team_id'];
        }
    }

    // 3. Check if team or user has already solved this challenge
    if ($teamId) {
        $teamSolveCheck = $pdo->prepare("
            SELECT s.id, s.solved_at, u.username as solver_name
            FROM solves s
            JOIN users u ON s.user_id = u.id
            WHERE s.challenge_id = ? AND u.team_id = ?
            ORDER BY s.solved_at ASC
            LIMIT 1
        ");
        $teamSolveCheck->execute([$challengeId, $teamId]);
        $alreadySolved = $teamSolveCheck->fetch();

        if ($alreadySolved) {
            $isMe = ($alreadySolved['solver_name'] === $username);
            return [
                'status' => 'info',
                'code' => 'ALREADY_SOLVED_BY_TEAM',
                'message' => $isMe
                    ? 'You have already solved this challenge. Duplicate points are not awarded.'
                    : "This challenge has already been solved by your teammate '{$alreadySolved['solver_name']}'. Your team has already secured these points!",
                'solved_by' => $alreadySolved['solver_name'],
                'solved_at' => $alreadySolved['solved_at']
            ];
        }
    } else {
        $solveCheck = $pdo->prepare("SELECT id, solved_at FROM solves WHERE user_id = ? AND challenge_id = ? LIMIT 1");
        $solveCheck->execute([$userId, $challengeId]);
        $alreadySolved = $solveCheck->fetch();

        if ($alreadySolved) {
            return [
                'status' => 'info',
                'code' => 'ALREADY_SOLVED',
                'message' => 'You have already solved this challenge. Duplicate points are not awarded.',
                'solved_at' => $alreadySolved['solved_at']
            ];
        }
    }
    }

    // 4. Case-sensitive comparison
    $isCorrect = (strcmp($submittedFlag, $challenge['correct_flag']) === 0) ? 1 : 0;
    $pointsToAward = $isCorrect ? (int)$challenge['points'] : 0;

    // 5. Record the submission in submissions table
    $subStmt = $pdo->prepare("
        INSERT INTO submissions (user_id, challenge_id, submitted_flag, is_correct, ip_address, user_agent, points_awarded, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $subStmt->execute([
        $userId,
        $challengeId,
        $submittedFlag,
        $isCorrect,
        $ip,
        substr($userAgent, 0, 250),
        $pointsToAward
    ]);

    if ($isCorrect) {
        // Record the solve in solves table
        $solveStmt = $pdo->prepare("
            INSERT INTO solves (user_id, challenge_id, points, solved_at)
            VALUES (?, ?, ?, NOW())
        ");
        $solveStmt->execute([$userId, $challengeId, $pointsToAward]);

        // Security log for successful solve
        logSecurityEvent(
            'FLAG_ATTEMPT_SUCCESS',
            'CORRECT',
            'Low',
            "Participant '{$username}' successfully solved '{$challenge['title']}' (+{$pointsToAward} pts)",
            $userId,
            $username,
            $ip,
            $challengeId,
            $challenge['title']
        );

        return [
            'status' => 'success',
            'code' => 'CORRECT_FLAG',
            'message' => "Congratulations! That is the correct flag for '{$challenge['title']}'!",
            'points_awarded' => $pointsToAward
        ];
    } else {
        // Incorrect flag: trigger brute force detection analysis
        analyzeFlagFailure($userId, $username, $challengeId, $challenge['title'], $ip);

        // Security log for failed attempt (never logging exact password/flag plaintext for security)
        logSecurityEvent(
            'FLAG_ATTEMPT_FAILED',
            'INCORRECT',
            'Low',
            "Incorrect flag submission on '{$challenge['title']}' from {$ip}",
            $userId,
            $username,
            $ip,
            $challengeId,
            $challenge['title']
        );

        return [
            'status' => 'error',
            'code' => 'INCORRECT_FLAG',
            'message' => 'Incorrect flag. Please analyze the materials and try again.'
        ];
    }
}

