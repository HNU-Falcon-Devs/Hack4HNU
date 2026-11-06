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
        'role' => $_SESSION['role']
    ];
}

function getOptionalAuth() {
    ensureSessionStarted();
    if (!empty($_SESSION['user_id'])) {
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ];
    }
    return null;
}

