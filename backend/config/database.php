<?php
/**
 * HNU CTF - Database Configuration
 * Editable placeholders for MySQL connection settings.
 * DO NOT modify database schema directly from this file.
 */

// Editable MySQL Database Connection Parameters
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'hnu_ctf');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Default brute force detection thresholds (used if settings table is unavailable)
define('DEFAULT_THRESHOLD_1MIN_SUSPICIOUS', 5);
define('DEFAULT_THRESHOLD_5MIN_HIGHRISK', 10);
define('DEFAULT_THRESHOLD_10MIN_CRITICAL', 20);
define('DEFAULT_ENFORCE_BLOCKING', 1);

/**
 * Get PDO database connection.
 * Returns PDO instance if successful, or null if connection fails.
 */
function getDatabaseConnection() {
    static $pdo = null;
    static $connectionAttempted = false;

    if ($pdo !== null) {
        return $pdo;
    }

    if ($connectionAttempted && $pdo === null) {
        return null;
    }

    $connectionAttempted = true;

    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Record error or return null for graceful fallback
        error_log("HNU CTF Database Connection Error: " . $e->getMessage());
        return null;
    }
}

/**
 * Check if the database connection is currently alive and tables exist.
 */
function isDatabaseConnected() {
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        return false;
    }
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'challenges'");
        return $stmt->rowCount() > 0;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Ensure PHP session is started with secure flags.
 */
function ensureSessionStarted() {
    if (session_status() === PHP_SESSION_NONE) {
        $lifetime = 60 * 60 * 24; // 24 hours
        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

/**
 * Get client IP address reliably.
 */
function getClientIP() {
    $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ipList = explode(',', $_SERVER[$key]);
            $ip = trim($ipList[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

/**
 * Helper to emit JSON response.
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Handle CORS headers for development/production.
 */
function setupCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

