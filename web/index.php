<?php
// index.php for a small custom site
require __DIR__ . '/config.php';
require __DIR__ . '/functions.php';

$page = $_GET['page'] ?? 'home';

if ($page === 'home') {
    require __DIR__ . '/pages/home.php';
} elseif ($page === 'contact') {
    require __DIR__ . '/pages/contact.php';
} else {
    http_response_code(404);
    require __DIR__ . '/pages/404.php';
}
?>
  
