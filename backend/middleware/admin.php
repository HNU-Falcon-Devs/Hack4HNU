<?php
/**
 * Administrator Role Verification Middleware
 * Prevents participants from accessing SOC and administrative endpoints.
 */

require_once __DIR__ . '/auth.php';

function requireAdmin() {
    $user = requireAuth();

    if ($user['role'] !== 'admin') {
        sendJsonResponse([
            'status' => 'error',
            'code' => 'FORBIDDEN',
            'message' => 'Access denied. Administrator privileges required.'
        ], 403);
    }

    return $user;
}

