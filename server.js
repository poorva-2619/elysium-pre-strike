const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

const server = http.createServer((req, res) => {
  let [rawPath, queryStr] = req.url.split('?');
  if (rawPath === '/' || rawPath === '') rawPath = '/index.html';
  if (rawPath === '/home') rawPath = '/index.html';
  if (rawPath === '/landing') rawPath = '/index.html';
  if (rawPath === '/register') rawPath = '/register.html';
  if (rawPath === '/postcards') rawPath = '/postcards.html';
  
  const filePath = path.join(__dirname, rawPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    };
    if (ext === '.pdf') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Elysium Postcard & Web Server running at http://localhost:${PORT}`);
});

