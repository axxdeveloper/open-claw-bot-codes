#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const { chromium } = require('/Users/openclaw-user/.openclaw/workspace/.tmp/playwright-automation/node_modules/playwright-core');

const DEFAULT_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEFAULT_CHROME_ROOT = '/Users/openclaw-user/Library/Application Support/Google/Chrome';
const DEFAULT_TMP_ROOT = '/Users/openclaw-user/.openclaw/workspace/.tmp';
const DEFAULT_OUTPUT = path.join(DEFAULT_TMP_ROOT, 'nblm_storage_state.json');
const REQUIRED_GOOGLE_ACCOUNT = process.env.OPENCLAW_REQUIRED_GOOGLE_ACCOUNT || 'zwl9999999@gmail.com';

function parseArgs(argv) {
  const args = {
    chromePath: DEFAULT_CHROME,
    chromeRoot: DEFAULT_CHROME_ROOT,
    output: DEFAULT_OUTPUT,
    profile: null,
    timeoutMs: 120000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--profile') args.profile = argv[++i];
    else if (arg === '--out') args.output = argv[++i];
    else if (arg === '--chrome-root') args.chromeRoot = argv[++i];
    else if (arg === '--chrome') args.chromePath = argv[++i];
    else if (arg === '--timeout-ms') args.timeoutMs = Number(argv[++i]);
    else if (arg === '-h' || arg === '--help') {
      console.log('Usage: export_notebooklm_storage_state.js --profile "Profile 2" [--out path]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.profile) {
    throw new Error('Missing --profile');
  }
  return args;
}

function profileAccountEmail(chromeRoot, profile) {
  const preferencesPath = path.join(chromeRoot, profile, 'Preferences');
  if (!fs.existsSync(preferencesPath)) return null;
  const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
  for (const item of preferences.account_info || []) {
    if (item.email) return item.email;
  }
  return null;
}

function assertAllowedGoogleProfile(chromeRoot, profile) {
  const email = profileAccountEmail(chromeRoot, profile);
  if (email !== REQUIRED_GOOGLE_ACCOUNT) {
    throw new Error(`Refusing Chrome profile ${profile}: ${email || 'no signed-in Google account'}; required ${REQUIRED_GOOGLE_ACCOUNT}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}; body=${data.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
  });
}

function removeIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
}

function prepareUserDataDir(chromeRoot, profile, tmpRoot) {
  const tmpDir = fs.mkdtempSync(path.join(tmpRoot, 'chrome-nblm-export-'));
  const sourceProfile = path.join(chromeRoot, profile);
  const sourceLocalState = path.join(chromeRoot, 'Local State');

  if (!fs.existsSync(sourceProfile)) {
    throw new Error(`Chrome profile does not exist: ${sourceProfile}`);
  }
  if (!fs.existsSync(sourceLocalState)) {
    throw new Error(`Chrome Local State does not exist: ${sourceLocalState}`);
  }

  fs.cpSync(sourceProfile, path.join(tmpDir, profile), { recursive: true, force: true });
  fs.copyFileSync(sourceLocalState, path.join(tmpDir, 'Local State'));

  for (const name of ['SingletonCookie', 'SingletonLock', 'SingletonSocket']) {
    removeIfExists(path.join(tmpDir, name));
    removeIfExists(path.join(tmpDir, profile, name));
  }

  return tmpDir;
}

async function waitForDevtoolsPort(tmpDir, timeoutMs) {
  const portFile = path.join(tmpDir, 'DevToolsActivePort');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(portFile)) {
      const [port] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
      if (port) return port;
    }
    await sleep(500);
  }
  throw new Error('Timed out waiting for DevToolsActivePort');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  assertAllowedGoogleProfile(args.chromeRoot, args.profile);

  const tmpDir = prepareUserDataDir(args.chromeRoot, args.profile, DEFAULT_TMP_ROOT);
  const chrome = spawn(args.chromePath, [
    `--user-data-dir=${tmpDir}`,
    `--profile-directory=${args.profile}`,
    '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1',
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  let stderr = '';
  chrome.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  try {
    const port = await waitForDevtoolsPort(tmpDir, args.timeoutMs);
    const version = await getJson(`http://127.0.0.1:${port}/json/version`);
    if (!version.webSocketDebuggerUrl) {
      throw new Error('Chrome did not expose a webSocketDebuggerUrl');
    }

    const browser = await chromium.connectOverCDP(version.webSocketDebuggerUrl);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    await page.goto('https://notebooklm.google.com/', { waitUntil: 'domcontentloaded', timeout: args.timeoutMs });
    await page.waitForTimeout(5000);

    const url = page.url();
    const title = await page.title().catch((err) => `ERR:${err.message}`);
    const bodyText = await page.locator('body').innerText({ timeout: 15000 }).catch((err) => `ERR:${err.message}`);
    const signedOut = /accounts\.google\.com/.test(url) || /Sign in|Choose an account|Signed out/.test(bodyText);

    await context.storageState({ path: args.output });
    const info = {
      ok: !signedOut,
      profile: args.profile,
      tmpDir,
      storagePath: args.output,
      url,
      title,
      textHead: String(bodyText).slice(0, 1000),
    };
    fs.writeFileSync(`${args.output}.info.json`, JSON.stringify(info, null, 2));
    await browser.close();

    console.log(JSON.stringify(info, null, 2));
    if (signedOut) {
      throw new Error(`Profile ${args.profile} is not signed in to NotebookLM`);
    }
  } catch (err) {
    const message = err && err.stack ? err.stack : String(err);
    throw new Error(`${message}\nChrome stderr: ${stderr.slice(0, 2000)}`);
  } finally {
    try {
      chrome.kill('SIGTERM');
    } catch {
      // Best effort cleanup.
    }
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
