<?php

/**
 * Database Configuration
 * 
 * Returns database connection parameters from environment variables.
 */

require_once __DIR__ . '/config.php';

return [
    'host' => Config::get('DB_HOST', 'localhost'),
    'port' => Config::get('DB_PORT', '3306'),
    'database' => Config::get('DB_NAME', 'creativia'),
    'username' => Config::get('DB_USER', 'root'),
    'password' => Config::get('DB_PASSWORD', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
