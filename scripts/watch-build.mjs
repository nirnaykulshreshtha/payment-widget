#!/usr/bin/env node
/**
 * @file watch-build.mjs
 * @description Watches the `src` directory and triggers `npm run build` whenever a file changes. The watcher
 *   coalesces rapid file events to avoid overlapping builds and logs each activity aggressively for debugging.
 */

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

const filePath = fileURLToPath(import.meta.url);
const scriptDirectory = dirname(filePath);
const projectRoot = resolve(scriptDirectory, '..');
const srcDirectory = resolve(projectRoot, 'src');

const isWindows = process.platform === 'win32';
let isBuilding = false;
let pendingReason = null;

/**
 * Queue a build execution while ensuring that only one `npm run build` process runs at a time.
 * If multiple file events arrive quickly, subsequent requests are coalesced and executed after the
 * current build finishes.
 *
 * @param {string} reason - Description of the file-system event that triggered the build.
 * @returns {Promise<void>} Resolves after the queued build completes.
 */
async function queueBuild(reason) {
  const formattedReason = reason.trim();

  if (pendingReason) {
    pendingReason = `${pendingReason}; ${formattedReason}`;
    log('info', `Coalescing build trigger: ${pendingReason}`);
  } else {
    pendingReason = formattedReason;
    log('info', `Build trigger received: ${pendingReason}`);
  }

  if (isBuilding) {
    log('info', 'Build already running; queued trigger will execute when the current build finishes.');
    return;
  }

  isBuilding = true;

  while (pendingReason) {
    const activeReason = pendingReason;
    pendingReason = null;
    await runBuild(activeReason);
  }

  isBuilding = false;
}

/**
 * Execute `npm run build` in the project root and stream its output. The promise resolves once the
 * child process exits, regardless of success, to guarantee the watcher keeps running.
 *
 * @param {string} reason - Human-readable explanation of why the build is running.
 * @returns {Promise<void>} Resolves when the build process completes.
 */
function runBuild(reason) {
  return new Promise((resolve) => {
    log('start', `Starting build for: ${reason}`);

    const child = spawn('npm', ['run', 'build'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: isWindows,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        log('warn', `Build process received signal ${signal}.`);
      } else if (code === 0) {
        log('success', 'Build completed successfully.');
      } else {
        log('error', `Build failed with exit code ${code}.`);
      }

      log('info', 'Watcher is ready for the next change.');
      resolve();
    });

    child.on('error', (error) => {
      log('error', `Failed to spawn build process: ${error.message}`);
      log('info', 'Watcher is ready for the next change.');
      resolve();
    });
  });
}

/**
 * Log messages with a consistent prefix and timestamp to simplify correlation in CI logs.
 *
 * @param {string} level - Log category (e.g. "info", "error").
 * @param {string} message - Descriptive message for the event being logged.
 */
function log(level, message) {
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[watch-build][${level.toUpperCase()}][${timestamp}] ${message}`);
}

log('info', `Watching directory: ${srcDirectory}`);

const watcher = chokidar.watch(srcDirectory, {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 250,
    pollInterval: 100,
  },
});

watcher.on('all', (event, path) => {
  queueBuild(`${event} -> ${path}`);
});

watcher.on('error', (error) => {
  log('error', `Watcher error encountered: ${error.message}`);
});

const shutdown = async (signal) => {
  log('info', `Received ${signal}; shutting down watcher.`);
  await watcher.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

log('info', 'Watcher initialized and standing by for changes.');

