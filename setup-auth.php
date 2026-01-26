<?php
/**
 * Setup Authentication for Superplanner
 *
 * This script creates an admin user and API key for ClaudeBot.
 * Upload this file to your Hostinger server and access it via browser.
 *
 * IMPORTANT: Delete this file after use for security!
 */

// Database configuration - CHANGE THESE VALUES
$DB_HOST = 'localhost';
$DB_USER = 'u341245456_SPlanner';  // Your Hostinger DB user
$DB_PASSWORD = 'w>gG$$rXVz4P'; // Your Hostinger DB password
$DB_NAME = 'u341245456_SP'; // Your Hostinger DB name

// Generate random password and API key
function generateRandomString($length = 16) {
    return bin2hex(random_bytes($length / 2));
}

function generateApiKey() {
    return 'sk_' . bin2hex(random_bytes(32));
}

try {
    // Connect to database
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    echo "<h1>🚀 Superplanner Authentication Setup</h1>";
    echo "<hr>";

    // Check if user already exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();

    if ($userCount > 0) {
        echo "<h2>⚠️ User already exists</h2>";
        echo "<p>Skipping user creation. Only creating new API key...</p>";
    } else {
        // Generate admin user credentials
        $username = 'admin';
        $email = 'admin@superplanner.local';
        $password = generateRandomString(16);
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        // Insert admin user
        $stmt = $pdo->prepare("
            INSERT INTO users (username, email, password_hash, is_active)
            VALUES (?, ?, ?, true)
        ");
        $stmt->execute([$username, $email, $passwordHash]);

        echo "<h2>✅ Admin User Created</h2>";
        echo "<div style='background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
        echo "<h3>👤 Your Login Credentials:</h3>";
        echo "<p><strong>Username:</strong> <code style='background: white; padding: 4px 8px; border-radius: 4px;'>" . htmlspecialchars($username) . "</code></p>";
        echo "<p><strong>Password:</strong> <code style='background: white; padding: 4px 8px; border-radius: 4px;'>" . htmlspecialchars($password) . "</code></p>";
        echo "<p style='color: #dc2626;'><strong>⚠️ SAVE THESE CREDENTIALS NOW! They won't be shown again.</strong></p>";
        echo "</div>";
    }

    // Generate API key for ClaudeBot
    $apiKey = generateApiKey();
    $apiKeyHash = password_hash($apiKey, PASSWORD_BCRYPT, ['cost' => 10]);

    // Insert API key
    $stmt = $pdo->prepare("
        INSERT INTO api_keys (key_hash, name, description, is_active)
        VALUES (?, ?, ?, true)
    ");
    $stmt->execute([$apiKeyHash, 'ClaudeBot', 'API key for Claude Code agent']);

    echo "<h2>✅ API Key Created</h2>";
    echo "<div style='background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h3>🔑 Your API Key for ClaudeBot:</h3>";
    echo "<p style='word-break: break-all;'><code style='background: white; padding: 8px 12px; border-radius: 4px; display: block;'>" . htmlspecialchars($apiKey) . "</code></p>";
    echo "<p style='color: #dc2626;'><strong>⚠️ SAVE THIS KEY NOW! It won't be shown again.</strong></p>";
    echo "<p>Use this in HTTP headers: <code>Authorization: Bearer " . htmlspecialchars($apiKey) . "</code></p>";
    echo "</div>";

    echo "<hr>";
    echo "<h2>📝 Next Steps</h2>";
    echo "<ol>";
    echo "<li>Save your credentials in a secure place</li>";
    echo "<li><strong style='color: #dc2626;'>DELETE this setup-auth.php file from your server!</strong></li>";
    echo "<li>Go to <a href='https://sp.thewebmaster.pro'>https://sp.thewebmaster.pro</a> and login</li>";
    echo "<li>Use the API key in ClaudeBot requests</li>";
    echo "</ol>";

    echo "<hr>";
    echo "<p style='background: #fee2e2; padding: 12px; border-radius: 6px; border-left: 4px solid #dc2626;'>";
    echo "<strong>🔒 SECURITY WARNING:</strong> Delete this file immediately after saving your credentials!<br>";
    echo "Run: <code>rm setup-auth.php</code> or delete it via File Manager.";
    echo "</p>";

} catch (PDOException $e) {
    echo "<h2 style='color: red;'>❌ Database Error</h2>";
    echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Please check your database credentials in this file.</p>";
}
?>

<style>
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        max-width: 800px;
        margin: 40px auto;
        padding: 20px;
        background: #f9fafb;
    }
    h1 { color: #1f2937; }
    h2 { color: #374151; margin-top: 30px; }
    code {
        font-family: 'Courier New', monospace;
        font-size: 14px;
    }
    a { color: #2563eb; }
</style>
