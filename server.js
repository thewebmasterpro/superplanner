require('dotenv').config();
const http = require('http');
const url = require('url');
const { getTasks, createTask } = require('./api/tasks');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Routes
  if (pathname === '/api' || pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Superplanner API v1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        tasks: '/api/tasks',
        health: '/api/health'
      }
    }));
  } else if (pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString()
    }));
  } else if (pathname === '/api/tasks') {
    if (method === 'GET') {
      getTasks(req, res);
    } else if (method === 'POST') {
      createTask(req, res);
    } else {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

server.listen(port, hostname, () => {
  console.log(`🚀 Superplanner server running at http://${hostname}:${port}/`);
  console.log(`📊 API docs: http://${hostname}:${port}/api`);
});
