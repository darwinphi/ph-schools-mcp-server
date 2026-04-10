import fs from 'fs';
import path from 'path';
import https from 'https';

const DEFAULT_DATA_URL =
  'https://raw.githubusercontent.com/darwinphi/ph-schools-dataset/main/schools_masterlist_2020_2021.json';

const dataUrl = process.env.PH_SCHOOLS_DATA_URL || DEFAULT_DATA_URL;
const outputPath = process.env.PH_SCHOOLS_DATA_PATH || path.join(process.cwd(), 'data.json');

function download(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const status = res.statusCode || 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          if (redirectCount >= 5) {
            reject(new Error('Too many redirects while downloading dataset.'));
            res.resume();
            return;
          }
          res.resume();
          resolve(download(res.headers.location, redirectCount + 1));
          return;
        }

        if (status < 200 || status >= 300) {
          reject(new Error(`Failed to download dataset. HTTP status: ${status}`));
          res.resume();
          return;
        }

        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      })
      .on('error', reject);
  });
}

async function main() {
  console.log(`Downloading dataset from: ${dataUrl}`);
  const raw = await download(dataUrl);

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Downloaded payload is not a JSON array.');
  }

  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');

  console.log(`Saved ${parsed.length} records to: ${outputPath}`);
}

main().catch((error) => {
  console.error('sync-data failed:', error.message);
  process.exit(1);
});
