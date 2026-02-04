<?php
session_start();
if (!isset($_SESSION['mover_auth'])) {
    http_response_code(403);
    exit(json_encode(['ok' => false, 'error' => 'Unauthorized']));
}

$input = json_decode(file_get_contents('php://input'), true);
$page = $_GET['page'] ?? 'index';

// Валидация (whitelist)
if (!preg_match('/^[a-z0-9_-]+$/', $page)) {
    exit(json_encode(['ok' => false, 'error' => 'Invalid page']));
}

$file = __DIR__ . '/../content/' . $page . '.json';

// Backup преди overwrite
if (file_exists($file)) {
    copy($file, $file . '.bak.' . time());
}

// Atomic write
$tmp = $file . '.tmp';
file_put_contents($tmp, json_encode($input, JSON_PRETTY_PRINT));
rename($tmp, $file);

echo json_encode(['ok' => true]);
?>