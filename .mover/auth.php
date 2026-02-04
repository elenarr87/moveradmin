<?php
session_start();
$input = json_decode(file_get_contents('php://input'), true);

// Хардкодната парола (хеш)
$correct_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // hash for 'password'

if (password_verify($input['pass'], $correct_hash)) {
    $_SESSION['mover_auth'] = true;
    echo json_encode(['ok' => true, 'token' => session_id()]);
} else {
    echo json_encode(['ok' => false]);
}
?>