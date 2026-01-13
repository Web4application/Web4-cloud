<?php
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Basic router
switch ($requestUri) {
    case '/':
        require __DIR__ . '/pages/home.php';
        break;
    case '/contact':
        require __DIR__ . '/pages/contact.php';
        break;
    default:
        http_response_code(404);
        require __DIR__ . '/pages/404.php';
}
?>
