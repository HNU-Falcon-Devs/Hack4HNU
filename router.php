<?php
/**
 * HNU CTF - Unified Web Server Router
 * Enables PHP built-in server (`php -S 127.0.0.1:8000 router.php`) to resolve
 * both the frontend single page app and all backend API requests seamlessly.
 */

// Allow CORS in development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Root path redirect to frontend
if ($path === '/' || $path === '') {
    if (file_exists(__DIR__ . '/frontend/dist/index.html')) {
        header("Location: /frontend/dist/");
        exit;
    } elseif (file_exists(__DIR__ . '/index.php')) {
        require __DIR__ . '/index.php';
        exit;
    }
}

// Block direct access to storage directory (files must be downloaded through api/download.php)
if (strpos($path, '/storage/') === 0 || strpos($path, 'storage/') === 0) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => 'Direct access forbidden. Use /backend/api/download.php']);
    exit;
}

// Candidate search locations for files
$root = __DIR__;
$candidates = [
    $root . $path,
    $root . '/backend' . $path,
    $root . preg_replace('#^/backend#', '', $path),
    dirname($root) . $path,
];

foreach ($candidates as $target) {
    if (is_file($target)) {
        if (substr($target, -4) === '.php') {
            require $target;
            exit;
        }
        // Let PHP serve static files (js, css, images, etc.)
        return false;
    }
    if (is_dir($target)) {
        if (is_file(rtrim($target, '/') . '/index.html')) {
            // If URL doesn't end with slash, redirect to add slash so relative assets work
            if (substr($path, -1) !== '/') {
                header("Location: " . $path . "/");
                exit;
            }
            return false;
        }
        if (is_file(rtrim($target, '/') . '/index.php')) {
            require rtrim($target, '/') . '/index.php';
            exit;
        }
    }
}

// For SPA routing under /frontend/dist/
if (strpos($path, '/frontend/dist') === 0 && file_exists($root . '/frontend/dist/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($root . '/frontend/dist/index.html');
    exit;
}

// If no file matched, output clean JSON 404
http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status' => 'error',
    'code' => 'NOT_FOUND',
    'message' => "Endpoint not found: {$path}",
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
