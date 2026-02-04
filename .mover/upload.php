<?php
session_start();
if (!isset($_SESSION['mover_auth'])) {
    http_response_code(403);
    exit(json_encode(['ok' => false]));
}

$allowed = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($_FILES['image']['type'], $allowed)) {
    exit(json_encode(['ok' => false, 'error' => 'Invalid type']));
}

// Уникално име (timestamp + random)
$ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
$name = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$path = __DIR__ . '/../assets/uploads/' . $name;

if (move_uploaded_file($_FILES['image']['tmp_name'], $path)) {
    echo json_encode([
        'ok' => true,
        'url' => '/assets/uploads/' . $name
    ]);
} else {
    echo json_encode(['ok' => false, 'error' => 'Upload failed']);
}
?>