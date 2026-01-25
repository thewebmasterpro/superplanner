const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function getTasks(req, res) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [tasks] = await connection.execute('SELECT * FROM tasks ORDER BY due_date ASC');
    await connection.end();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tasks));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function createTask(req, res) {
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const data = JSON.parse(body);
      const connection = await mysql.createConnection(dbConfig);

      await connection.execute(
        'INSERT INTO tasks (project_id, title, description, status, frequency, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.project_id, data.title, data.description, data.status || 'todo', data.frequency, data.priority || 1, data.due_date]
      );

      await connection.end();

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Task created' }));
    });
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

module.exports = { getTasks, createTask };
