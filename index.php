<?php
/**
 * HNU CTF - Root Redirection Gateway
 * Automatically directs browsers to the built React single-page application.
 */

if (file_exists(__DIR__ . '/frontend/dist/index.html')) {
    header("Location: frontend/dist/");
    exit;
} else {
    header("Content-Type: text/html; charset=utf-8");
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>HNU CTF - Starting Platform</title>
        <style>
            body { background: #080D18; color: #F8FAFC; font-family: monospace; padding: 40px; text-align: center; }
            .card { background: #111827; border: 1px solid #1E293B; border-radius: 12px; padding: 30px; max-width: 600px; margin: 40px auto; }
            h1 { color: #00D4FF; }
            a { color: #00D4FF; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>HNU CTF Platform</h1>
            <p>Frontend production bundle is preparing...</p>
            <p>If running locally in dev mode, navigate to <a href="http://localhost:5173">http://localhost:5173</a>.</p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

