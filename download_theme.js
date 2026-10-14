const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Failed status ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const page = await fetchPage('https://www.myinstants.com/en/instant/among-us-theme-song/');
    const m = page.data.match(/https?:\/\/[^"'\s]+\.mp3/gi);
    console.log('Matches:', m);
    if (m && m[0]) {
      console.log('Downloading theme song:', m[0]);
      await download(m[0], path.join(__dirname, 'among_us_theme.mp3'));
      console.log('Theme song downloaded!');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

run();
