<?php
/**
 * Authentication Middleware
 * Validates session and checks role-based access.
 */

require_once __DIR__ . '/../config/database.php';

function requireAuth() {
    ensureSessionStarted();

    if (empty($_SESSION['user_id'])) {
        sendJsonResponse([
            'status' => 'error',
            'code' => 'UNAUTHENTICATED',
            'message' => 'Authentication required. Please log in.'
        ], 401);
    }

    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'],
        'team_id' => $_SESSION['team_id'] ?? null,
        'team_name' => $_SESSION['team_name'] ?? null
    ];
}

function getOptionalAuth() {
    ensureSessionStarted();
    if (!empty($_SESSION['user_id'])) {
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role'],
            'team_id' => $_SESSION['team_id'] ?? null,
            'team_name' => $_SESSION['team_name'] ?? null
        ];
    }
    return null;
}

