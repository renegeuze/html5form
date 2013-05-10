<?php

$filename = $_GET['file'] . '.js';


header('X-Content-Type-Options: nosniff');
header('Content-Type: application/javascript');
header('Cache-Control: max-age=86400');

if (!empty($_SERVER['HTTP_REFERER'])) {
    $uri = parse_url($_SERVER['HTTP_REFERER']);
    $log  = date('Y-m-d H:i:s', time()) . " {$uri['host']} accessed {$filename}\n";
    file_put_contents('access.log', $log, FILE_APPEND);
}
if (file_exists($filename)) {
    echo file_get_contents($filename);
} else {
    echo "/* {$filename} does not exist. */";
}
