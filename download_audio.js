const https = require('https');
const fs = require('fs');
const path = require('path');

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
    console.log('Downloading emergency-meeting.mp3...');
    await download('https://www.myinstants.com/media/sounds/emergency-meeting.mp3', path.join(__dirname, 'emergency_meeting.mp3'));
    const stats = fs.statSync(path.join(__dirname, 'emergency_meeting.mp3'));
    console.log('Downloaded successfully! Size:', stats.size, 'bytes');
  } catch (e) {
    console.error('Download error:', e);
  }
}

run();
