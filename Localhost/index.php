<?php
// Simple environment check
echo '<p>PHP version: ' . PHP_VERSION . '</p>';

// Detailed info (development only)
phpinfo(); // Do NOT enable this on production
?>
  <?php
$projects = [
    'Blog' => '/blog/',
    'Shop' => '/shop/',
    'API'  => ':8000', // e.g. http://localhost:8000
];
?>
<h1>Localhost Projects</h1>
<ul>
  <?php foreach ($projects as $name => $path): ?>
    <li><a href="<?= htmlspecialchars($path, ENT_QUOTES) ?>"><?= htmlspecialchars($name) ?></a></li>
  <?php endforeach; ?>
</ul>
