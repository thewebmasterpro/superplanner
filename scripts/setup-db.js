require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function setupDatabase() {
  let connection;
  try {
    console.log('Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    console.log('Creating database if not exists...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);

    console.log('Creating tables...');
    await connection.execute(`USE ${dbConfig.database}`);

    // Projects table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tasks table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('todo', 'in_progress', 'done', 'blocked') DEFAULT 'todo',
        frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
        priority INT DEFAULT 1,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Clients table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Prayer schedule table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS prayer_schedule (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATE NOT NULL UNIQUE,
        fajr TIME NOT NULL,
        dhuhr TIME NOT NULL,
        asr TIME NOT NULL,
        maghrib TIME NOT NULL,
        isha TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database setup complete!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
