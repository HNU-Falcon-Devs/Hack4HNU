<?php
/**
 * HNU CTF - Secure File Download Endpoint
 * Controls access to original challenge artifacts through PHP.
 * Validates authentication and prevents directory traversal attacks.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/rate_limit.php';

setupCorsHeaders();
ensureSessionStarted();

// Require user to be authenticated to download challenge attachments
$currentUser = requireAuth();
checkIpSecurityEnforcement();

$fileId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$slug = trim($_GET['slug'] ?? '');
$filename = trim($_GET['file'] ?? '');

$pdo = getDatabaseConnection();
$filePath = null;
$downloadFilename = null;
$mimeType = 'application/octet-stream';

if ($fileId && isDatabaseConnected() && $pdo) {
    $stmt = $pdo->prepare("
        SELECT a.filename, a.relative_path, a.mime_type, c.is_enabled
        FROM challenge_attachments a
        JOIN challenges c ON a.challenge_id = c.id
        WHERE a.id = ? LIMIT 1
    ");
    $stmt->execute([$fileId]);
    $record = $stmt->fetch();

    if ($record) {
        if (!$record['is_enabled'] && $currentUser['role'] !== 'admin') {
            sendJsonResponse(['status' => 'error', 'message' => 'Challenge is currently disabled'], 403);
        }
        $filePath = realpath(__DIR__ . '/../../storage/challenges/' . $record['relative_path']);
        $downloadFilename = $record['filename'];
        $mimeType = $record['mime_type'];
    }
} elseif (!empty($slug) && !empty($filename)) {
    // Sanitization against path traversal
    $cleanSlug = preg_replace('/[^a-zA-Z0-9\-_]/', '', $slug);
    $cleanFilename = basename($filename);

    $candidate = __DIR__ . '/../../storage/challenges/' . $cleanSlug . '/attachments/' . $cleanFilename;
    if (file_exists($candidate)) {
        $filePath = realpath($candidate);
        $downloadFilename = $cleanFilename;
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
    }
}

// Security Check: Verify file is strictly inside storage/challenges/
$storageBase = realpath(__DIR__ . '/../../storage/challenges');
if (!$filePath || !file_exists($filePath) || strpos($filePath, $storageBase) !== 0) {
    sendJsonResponse(['status' => 'error', 'message' => 'Requested challenge file was not found or access is restricted.'], 404);
}

// Deliver file stream
header('Content-Description: File Transfer');
header('Content-Type: ' . $mimeType);
header('Content-Disposition: attachment; filename="' . addslashes($downloadFilename) . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($filePath));
readfile($filePath);
exit;

