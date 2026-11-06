<?php
/**
 * HNU CTF - Challenge Attachment Upload Handler
 * Safely processes administrator-uploaded challenge attachments.
 */

require_once __DIR__ . '/../config/database.php';

function handleAttachmentUpload($challengeId, $slug, $file) {
    if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['status' => 'error', 'message' => 'File upload error or no file provided.'];
    }

    $allowedExtensions = ['pcap', 'pcapng', 'zip', 'png', 'jpg', 'jpeg', 'txt', 'py'];
    $filename = basename($file['name']);
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    // Handle special files without extension (like the raw hash in sweeperswipper)
    if (empty($ext) && preg_match('/^[a-f0-9]{40}$/i', $filename)) {
        // Valid git/sha hash filename
    } elseif (!in_array($ext, $allowedExtensions)) {
        return ['status' => 'error', 'message' => "File type '{$ext}' is not permitted. Allowed: " . implode(', ', $allowedExtensions)];
    }

    $targetDir = __DIR__ . '/../../storage/challenges/' . $slug . '/attachments/';
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $destination = $targetDir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return ['status' => 'error', 'message' => 'Failed to move uploaded file to protected storage.'];
    }

    $fileSize = filesize($destination);
    $mimeType = mime_content_type($destination) ?: 'application/octet-stream';
    $relativePath = $slug . '/attachments/' . $filename;

    $pdo = getDatabaseConnection();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO challenge_attachments (challenge_id, filename, relative_path, file_size, mime_type, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$challengeId, $filename, $relativePath, $fileSize, $mimeType]);
        } catch (Exception $e) {
            error_log("Failed to insert attachment record: " . $e->getMessage());
        }
    }

    return [
        'status' => 'success',
        'filename' => $filename,
        'file_size' => $fileSize,
        'mime_type' => $mimeType,
        'relative_path' => $relativePath
    ];
}

