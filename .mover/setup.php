<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'];
    $hash = password_hash($password, PASSWORD_BCRYPT);
    echo "Hash: " . $hash;
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Setup Password Hash</title>
</head>
<body>
    <form method="post">
        <label>Enter Password:</label>
        <input type="password" name="password" required>
        <button type="submit">Generate Hash</button>
    </form>
</body>
</html>