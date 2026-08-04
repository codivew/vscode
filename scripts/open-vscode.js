import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';

const extensionRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const executablePath = await downloadAndUnzipVSCode();
const vscode = spawn(
  executablePath,
  [
    `--extensionDevelopmentPath=${extensionRoot}`,
    `--user-data-dir=${resolve(extensionRoot, '.vscode-test', 'dev-user-data')}`,
    `--extensions-dir=${resolve(extensionRoot, '.vscode-test', 'dev-extensions')}`,
    '--disable-workspace-trust',
    '--new-window',
    extensionRoot,
  ],
  { stdio: 'inherit' },
);

process.exitCode = await new Promise((resolveExit, reject) => {
  vscode.once('error', reject);
  vscode.once('exit', (code) => resolveExit(code ?? 0));
});
