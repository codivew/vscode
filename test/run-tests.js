import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runTests } from '@vscode/test-electron';

const extensionRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);
const fixtureRepository = await createFixtureRepository();
const api = await startMockApi();
try {
  await runTests({
    extensionDevelopmentPath: extensionRoot,
    extensionTestsPath: resolve(extensionRoot, 'test/suite/index.cjs'),
    extensionTestsEnv: { CODIVEW_TEST_API_URL: api.url },
    launchArgs: [fixtureRepository, '--disable-workspace-trust'],
  });
} catch (error) {
  console.error('VS Code extension tests failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await api.close();
  await rm(fixtureRepository, { recursive: true, force: true });
}

async function createFixtureRepository() {
  const repository = await mkdtemp(resolve(tmpdir(), 'codivew-vscode-test-'));
  const git = (args) => execFileAsync('git', args, { cwd: repository });
  await git(['init', '--quiet']);
  await git(['config', 'user.email', 'codivew@example.com']);
  await git(['config', 'user.name', 'Codivew Test']);
  await writeFile(resolve(repository, 'value.ts'), 'export const value = 1;\n');
  await git(['add', 'value.ts']);
  await git(['commit', '--quiet', '-m', 'initial']);
  await writeFile(resolve(repository, 'value.ts'), 'export const value = 2;\n');
  return repository;
}

async function startMockApi() {
  let modelsRequestCount = 0;
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    if (request.method === 'GET' && request.url === '/v1/models') {
      modelsRequestCount += 1;
      response.end(JSON.stringify({ data: [{ id: 'codivew-test-model' }] }));
      return;
    }
    if (request.method === 'GET' && request.url === '/test/state') {
      response.end(JSON.stringify({ modelsRequestCount }));
      return;
    }
    response.end(
      JSON.stringify({
        message: {
          content: JSON.stringify({
            verdict: 'comment',
            risk: 'low',
            summary: '테스트 리뷰입니다.',
            issues: [
              {
                severity: 'suggestion',
                confidence: 0.95,
                file: 'value.ts',
                line: 1,
                title: '변경값 확인',
                description: '의도한 값 변경인지 확인하세요.',
              },
            ],
            tests: [],
          }),
        },
      }),
    );
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('Mock Ollama port missing.');

  return {
    url: `http://127.0.0.1:${address.port}/v1`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}
