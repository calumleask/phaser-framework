import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';
import webpack from 'webpack';

const root = resolve(import.meta.dirname, '../..');
const temp = mkdtempSync(join(tmpdir(), 'phfw-consumer-'));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this check through npm run verify:consumer');

function npm(args, cwd = root) {
  return execFileSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

function findChrome() {
  const candidates = [
    process.env.PHFW_CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidates.find(path => path && existsSync(path));
}

async function runBrowser(packageRoot, bundledEntry) {
  const chrome = findChrome();
  assert.ok(chrome, 'Set PHFW_CHROME_PATH to a Chrome or Edge executable');
  const phaserScript = bundledEntry
    ? join(temp, 'empty.js')
    : join(temp, 'node_modules/phaser/dist/phaser.js');
  const frameworkScript = bundledEntry
    ? bundledEntry
    : join(packageRoot, 'dist/phfw.js');
  const files = new Map([
    ['/', [join(import.meta.dirname, 'browser.html'), 'text/html']],
    [
      '/fixture.mjs',
      [join(import.meta.dirname, 'browser.mjs'), 'text/javascript'],
    ],
    ['/framework.js', [frameworkScript, 'text/javascript']],
    ['/phaser.js', [phaserScript, 'text/javascript']],
  ]);
  const server = createServer((request, response) => {
    const [path, contentType] = files.get(request.url) || [];
    if (!path) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.setHeader('Content-Type', contentType);
    response.end(readFileSync(path));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    const output = await new Promise((resolveOutput, reject) => {
      const child = spawn(
        chrome,
        [
          '--headless=new',
          '--no-first-run',
          '--no-default-browser-check',
          '--enable-unsafe-swiftshader',
          '--use-gl=angle',
          '--use-angle=swiftshader',
          '--virtual-time-budget=12000',
          '--dump-dom',
          `--user-data-dir=${join(temp, 'chrome-profile')}`,
          `http://127.0.0.1:${address.port}/`,
        ],
        { windowsHide: true },
      );
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => (stdout += chunk));
      child.stderr.on('data', chunk => (stderr += chunk));
      const timeout = globalThis.setTimeout(() => {
        child.kill();
        reject(new Error(`Browser timed out: ${stderr.slice(-1000)}`));
      }, 30000);
      child.on('error', error => {
        globalThis.clearTimeout(timeout);
        reject(error);
      });
      child.on('close', code => {
        globalThis.clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Browser exited ${code}: ${stderr.slice(-1000)}`));
        } else {
          resolveOutput(stdout);
        }
      });
    });
    assert.match(output, /id="result" data-result="pass"/, output.slice(-2000));
  } finally {
    await new Promise(resolveClose => server.close(resolveClose));
  }
}

try {
  const packed = JSON.parse(
    npm(['pack', '--json', '--pack-destination', temp]),
  );
  const metadata = Array.isArray(packed)
    ? packed[0]
    : packed['phaser-framework'];
  assert.ok(metadata?.filename, 'npm pack did not produce package metadata');
  const tarball = join(temp, basename(metadata.filename));
  npm(
    [
      'install',
      '--prefix',
      temp,
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      tarball,
    ],
    temp,
  );
  const packageRoot = join(temp, 'node_modules/phaser-framework');
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json')));
  assert.equal(manifest.types, './dist/types/index.d.ts');
  assert.equal(manifest.module, './dist/phfw.mjs');
  assert.equal(manifest.peerDependencies.phaser, '4.2.1');
  assert.ok(existsSync(join(packageRoot, manifest.main)));
  assert.ok(existsSync(join(packageRoot, manifest.module)));
  assert.ok(existsSync(join(packageRoot, manifest.types)));
  assert.ok(!existsSync(join(packageRoot, 'types/phfw.d.ts')));

  copyFileSync(
    join(import.meta.dirname, 'fixture.ts'),
    join(temp, 'consumer.ts'),
  );
  writeFileSync(
    join(temp, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        lib: ['ES2022', 'DOM'],
        types: [],
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      files: ['consumer.ts'],
    }),
  );
  execFileSync(
    process.execPath,
    [join(root, 'node_modules/typescript/bin/tsc')],
    {
      cwd: temp,
      stdio: 'inherit',
    },
  );
  writeFileSync(join(temp, 'empty.js'), '');
  writeFileSync(
    join(temp, 'consumer-entry.js'),
    "import * as Phaser from 'phaser';\nimport framework from 'phaser-framework';\nglobalThis.Phaser = Phaser;\nglobalThis.phfw = { default: framework };\n",
  );
  const bundlePath = join(temp, 'consumer.js');
  await new Promise((resolveBuild, reject) => {
    webpack(
      {
        mode: 'development',
        devtool: false,
        entry: join(temp, 'consumer-entry.js'),
        output: { path: temp, filename: 'consumer.js' },
      },
      (error, stats) => {
        if (error || stats?.hasErrors()) {
          reject(
            error || new Error(stats.toString({ all: false, errors: true })),
          );
        } else {
          resolveBuild();
        }
      },
    );
  });
  await runBrowser(packageRoot);
  await runBrowser(packageRoot, bundlePath);
  process.stdout.write(
    'Packed consumer types, UMD Chrome runtime, and bundled Chrome runtime passed.\n',
  );
} finally {
  const target = realpathSync(temp);
  assert.equal(dirname(target), realpathSync(tmpdir()));
  assert.ok(basename(target).startsWith('phfw-consumer-'));
  rmSync(target, { recursive: true, force: true });
}
