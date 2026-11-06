<?php
/**
 * HNU CTF - Announcements API Endpoint
 * Handles publishing, listing, and managing competition announcements.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/admin.php';

setupCorsHeaders();
ensureSessionStarted();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? 'create' : 'list');
$dbConnected = isDatabaseConnected();
$pdo = getDatabaseConnection();

switch ($action) {
    case 'list':
        if ($dbConnected && $pdo) {
            $stmt = $pdo->query("
                SELECT a.id, a.title, a.content, a.category, a.is_pinned, a.created_at, u.username as author
                FROM announcements a
                JOIN users u ON a.author_id = u.id
                ORDER BY a.is_pinned DESC, a.created_at DESC
            ");
            $announcements = $stmt->fetchAll();
            sendJsonResponse(['status' => 'success', 'announcements' => $announcements]);
        } else {
            sendJsonResponse([
                'status' => 'success',
                'is_demo' => true,
                'announcements' => [
                    [
                        'id' => 1,
                        'title' => 'Welcome to HNU CTF 2026',
                        'content' => 'Welcome participants to Holy Name University Cyber Security Challenge Platform! The competition is live. Flags format: HNU{flag}.',
                        'category' => 'Competition',
                        'is_pinned' => 1,
                        'created_at' => date('Y-m-d H:i:s', time() - 86400),
                        'author' => 'admin'
                    ],
                    [
                        'id' => 2,
                        'title' => 'Brute-Force & Automated Scanning Notice',
                        'content' => 'Automated brute-forcing of flags will trigger SOC alerts and IP rate-limiting. Analyze challenges methodically.',
                        'category' => 'Rules & Reminders',
                        'is_pinned' => 1,
                        'created_at' => date('Y-m-d H:i:s', time() - 43200),
                        'author' => 'admin'
                    ],
                    [
                        'id' => 3,
                        'title' => 'Hack4Gov 2026 Region 7 Challenges Released',
                        'content' => 'All 22 authentic Hack4Gov 2026 Region 7 challenges are now available across Web, OSINT, Network, Forensics, Steganography, and Miscellaneous categories. Investigate files and submit your flags!',
                        'category' => 'Challenge Release',
                        'is_pinned' => 0,
                        'created_at' => date('Y-m-d H:i:s', time() - 21600),
                        'author' => 'admin'
                    ]
                ]
            ]);
        }
        break;

    case 'create':
        $admin = requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $title = trim($input['title'] ?? '');
        $content = trim($input['content'] ?? '');
        $category = trim($input['category'] ?? 'Competition');
        $isPinned = isset($input['is_pinned']) ? (int)$input['is_pinned'] : 0;

        if (empty($title) || empty($content)) {
            sendJsonResponse(['status' => 'error', 'message' => 'Title and content are required.'], 400);
        }

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("
                INSERT INTO announcements (title, content, category, author_id, is_pinned, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$title, $content, $category, $admin['id'], $isPinned]);
            sendJsonResponse(['status' => 'success', 'message' => 'Announcement published successfully']);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => 'Published in demo mode']);
        }
        break;

    case 'delete':
        requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $id = (int)($input['id'] ?? 0);

        if (!$id) {
            sendJsonResponse(['status' => 'error', 'message' => 'Announcement ID required'], 400);
        }

        if ($dbConnected && $pdo) {
            $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ?");
            $stmt->execute([$id]);
            sendJsonResponse(['status' => 'success', 'message' => 'Announcement deleted']);
        } else {
            sendJsonResponse(['status' => 'success', 'message' => 'Deleted in demo mode']);
        }
        break;

    default:
        sendJsonResponse(['status' => 'error', 'message' => 'Unknown action'], 400);
}

