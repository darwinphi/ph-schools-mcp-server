const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { URL } = require('url');
const {
  DEFAULT_DATASET_TAG,
  getCanonicalDatasetUrl,
  resolveDefaultDataPath,
} = require('./constants');

function resolveSyncOptions(options = {}) {
  const envTag = process.env.PH_SCHOOLS_DATA_TAG || DEFAULT_DATASET_TAG;
  const tag = options.tag || envTag;

  const dataUrl =
    options.dataUrl ||
    process.env.PH_SCHOOLS_DATA_URL ||
    getCanonicalDatasetUrl(tag);

  const outputPath =
    options.outputPath ||
    process.env.PH_SCHOOLS_DATA_PATH ||
    resolveDefaultDataPath();

  const timeoutMs =
    options.timeoutMs === undefined
      ? 30_000
      : Number(options.timeoutMs);

  return {
    tag,
    dataUrl,
    outputPath,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30_000,
    maxRedirects: options.maxRedirects ?? 5,
  };
}

function downloadText(url, { timeoutMs = 30_000, maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    let completed = false;

    const visit = (currentUrl, redirectCount) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(currentUrl);
      } catch (error) {
        reject(new Error(`Invalid data URL: ${currentUrl}. ${error.message}`));
        return;
      }

      const client = parsedUrl.protocol === 'https:' ? https : parsedUrl.protocol === 'http:' ? http : null;
      if (!client) {
        reject(new Error(`Unsupported URL protocol: ${parsedUrl.protocol}`));
        return;
      }

      const request = client.get(parsedUrl, (response) => {
        const status = response.statusCode || 0;

        if (status >= 300 && status < 400 && response.headers.location) {
          if (redirectCount >= maxRedirects) {
            response.resume();
            reject(new Error('Too many redirects while downloading dataset.'));
            return;
          }

          const nextUrl = new URL(response.headers.location, parsedUrl).toString();
          response.resume();
          visit(nextUrl, redirectCount + 1);
          return;
        }

        if (status < 200 || status >= 300) {
          response.resume();
          reject(new Error(`Failed to download dataset. HTTP status: ${status}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          if (completed) return;
          completed = true;
          resolve(Buffer.concat(chunks).toString('utf-8'));
        });
      });

      request.setTimeout(timeoutMs, () => {
        request.destroy(new Error(`Request timed out after ${timeoutMs}ms.`));
      });

      request.on('error', (error) => {
        if (completed) return;
        completed = true;
        reject(error);
      });
    };

    visit(url, 0);
  });
}

async function syncDataset(options = {}) {
  const resolved = resolveSyncOptions(options);
  const downloadImpl = options.downloadImpl || downloadText;

  let raw;
  try {
    raw = await downloadImpl(resolved.dataUrl, {
      timeoutMs: resolved.timeoutMs,
      maxRedirects: resolved.maxRedirects,
    });
  } catch (error) {
    throw new Error(`Unable to download dataset from ${resolved.dataUrl}. ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Downloaded payload is not valid JSON. ${error.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Downloaded payload is not a JSON array.');
  }

  const resolvedOutput = path.resolve(resolved.outputPath);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');

  return {
    tag: resolved.tag,
    dataUrl: resolved.dataUrl,
    outputPath: resolvedOutput,
    recordCount: parsed.length,
  };
}

module.exports = {
  resolveSyncOptions,
  downloadText,
  syncDataset,
};
