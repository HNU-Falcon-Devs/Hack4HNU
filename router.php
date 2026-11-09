<?php
/**
 * HNU CTF - Unified Web Server Router
 * Enables PHP built-in server (`php -S 0.0.0.0:8000 router.php`) to resolve
 * both the frontend single page app and all backend API requests seamlessly.
 */

// Allow CORS in local network and development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$root = __DIR__;
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Block direct access to storage directory (files must be downloaded through api/download.php)
if (strpos($path, '/storage/') === 0 || strpos($path, 'storage/') === 0) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['status' => 'error', 'message' => 'Direct access forbidden. Use /backend/api/download.php']);
    exit;
}

function getMimeType($file) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $mimes = [
        'js'    => 'application/javascript; charset=utf-8',
        'mjs'   => 'application/javascript; charset=utf-8',
        'css'   => 'text/css; charset=utf-8',
        'html'  => 'text/html; charset=utf-8',
        'htm'   => 'text/html; charset=utf-8',
        'json'  => 'application/json; charset=utf-8',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'ico'   => 'image/x-icon',
        'webp'  => 'image/webp',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
    ];
    return $mimes[$ext] ?? 'application/octet-stream';
}

// Candidate search locations for files
$candidates = [
    $root . $path,
    $root . '/frontend/dist' . $path,
    $root . '/backend' . $path,
    $root . preg_replace('#^/backend#', '', $path),
];

foreach ($candidates as $target) {
    if (is_file($target)) {
        if (substr($target, -4) === '.php') {
            require $target;
            exit;
        }
        // Direct serve static files with proper MIME header
        header('Content-Type: ' . getMimeType($target));
        readfile($target);
        exit;
    }

    if (is_dir($target)) {
        $indexPath = rtrim($target, '/') . '/index.html';
        if (is_file($indexPath)) {
            header('Content-Type: text/html; charset=utf-8');
            readfile($indexPath);
            exit;
        }
        $indexPhp = rtrim($target, '/') . '/index.php';
        if (is_file($indexPhp)) {
            require $indexPhp;
            exit;
        }
    }
}

// Root path or SPA fallback (serve frontend/dist/index.html)
$distIndex = $root . '/frontend/dist/index.html';
if (file_exists($distIndex) && !preg_match('#^/(backend|api)/#', $path)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($distIndex);
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
