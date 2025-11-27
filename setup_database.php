<?php
/**
 * Database Setup Script
 * Imports the schema to the database
 */

// Load configuration
require_once __DIR__ . '/app/config/config.php';
Config::load();

// Database credentials
$host = Config::get('DB_HOST');
$port = Config::get('DB_PORT', '3306');
$dbname = Config::get('DB_NAME');
$username = Config::get('DB_USER');
$password = Config::get('DB_PASSWORD');

echo "Connecting to database...\n";
echo "Host: $host\n";
echo "Database: $dbname\n";
echo "User: $username\n\n";

try {
    // Connect to database
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "✓ Connected successfully!\n\n";

    // Read schema file
    $schemaFile = __DIR__ . '/database/schema.sql';

    if (!file_exists($schemaFile)) {
        die("Error: schema.sql not found at $schemaFile\n");
    }

    $sql = file_get_contents($schemaFile);

    // Remove USE database statement since we're already connected
    $sql = preg_replace('/USE\s+\w+;/i', '', $sql);
    $sql = preg_replace('/CREATE DATABASE.*?;/i', '', $sql);

    // Split into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function ($stmt) {
            return !empty($stmt); }
    );

    echo "Executing schema...\n";

    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $pdo->exec($statement);
                // Extract table name for feedback
                if (preg_match('/CREATE TABLE\s+(\w+)/i', $statement, $matches)) {
                    echo "✓ Created table: {$matches[1]}\n";
                }
            } catch (PDOException $e) {
                // Ignore "table already exists" errors
                if (strpos($e->getMessage(), 'already exists') === false) {
                    echo "✗ Error: " . $e->getMessage() . "\n";
                }
            }
        }
    }

    echo "\n✓ Database setup complete!\n";

    // Verify tables
    echo "\nVerifying tables...\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tables as $table) {
        echo "  - $table\n";
    }

    echo "\n✓ All done! Database is ready.\n";

} catch (PDOException $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
    exit(1);
}
