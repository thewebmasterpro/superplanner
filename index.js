const http = require('http');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Superplanner API - Coming Soon',
    timestamp: new Date().toISOString()
  }));
});

server.listen(port, hostname, () => {
  console.log(`Superplanner server running at http://${hostname}:${port}/`);
});
