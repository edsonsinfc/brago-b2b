const http = require('http');

const PORT = process.env.PORT || 3000;

console.log('--- MINIMAL SERVER STARTING ---');
console.log(`PORT Env Var: ${process.env.PORT}`);
console.log(`Resolved PORT: ${PORT}`);

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Hello from Minimal Server! Node Version: ${process.version}`);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Prevent immediate exit
setInterval(() => {}, 1000);
