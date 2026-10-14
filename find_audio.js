const https = require('https');
const fs = require('fs');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const res = await fetchPage('https://www.myinstants.com/en/instant/emergency-meeting-among-us-5641/');
    console.log('Status:', res.status);
    const matches = res.data.match(/https?:\/\/[^"'\s]+\.mp3/gi) || res.data.match(/\/media\/sounds\/[^"'\s]+\.mp3/gi);
    console.log('MP3 matches:', matches);
  } catch (err) {
    console.error(err);
  }
}

run();
