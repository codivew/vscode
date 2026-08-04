const assert = require('node:assert/strict');
const path = require('node:path');
const vscode = require('vscode');

async function run() {
  const extensionRoot = path.resolve(__dirname, '../..');
  const extension = vscode.extensions.all.find(
    (candidate) => path.resolve(candidate.extensionPath) === extensionRoot,
  );
  assert.ok(extension, 'Codivew extension should be available in the Extension Host.');

  await extension.activate();
  const commands = await vscode.commands.getCommands(true);
  assert.ok(commands.includes('codivew.reviewWorking'));
  assert.ok(commands.includes('codivew.reviewStaged'));
  assert.ok(commands.includes('codivew.reviewBranch'));
  assert.ok(commands.includes('codivew.openIssue'));
  assert.ok(commands.includes('codivew.reviewView.focus'));
  console.log('✓ activates and registers review commands');

  const ollamaUrl = process.env.CODIVEW_TEST_OLLAMA_URL;
  assert.ok(ollamaUrl, 'Mock Ollama URL should be provided by the test runner.');
  const configuration = vscode.workspace.getConfiguration('codivew');
  await configuration.update('ollamaUrl', ollamaUrl, vscode.ConfigurationTarget.Global);
  await configuration.update('model', 'codivew-test-model', vscode.ConfigurationTarget.Global);
  await configuration.update('maxDiffChars', 120_000, vscode.ConfigurationTarget.Global);
  assert.equal(configuration.get('maxDiffChars'), 120_000);

  await vscode.commands.executeCommand('codivew.reviewView.focus');
  console.log('✓ opens the configured Codivew Activity Bar view');

  await vscode.commands.executeCommand('codivew.reviewWorking');
  const diagnostics = vscode.languages
    .getDiagnostics()
    .flatMap(([, items]) => items)
    .filter((diagnostic) => diagnostic.source === 'Codivew');
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].code, 'suggestion');
  assert.match(diagnostics[0].message, /변경값 확인/);
  console.log('✓ reviews a Git change and publishes a diagnostic');

  await vscode.commands.executeCommand('codivew.openIssue', 0);
  const editor = vscode.window.activeTextEditor;
  assert.ok(editor, 'Review issue should open an editor.');
  assert.equal(path.basename(editor.document.uri.fsPath), 'value.ts');
  assert.equal(editor.selection.start.line, 0);
  console.log('✓ opens a review issue at its source line');
}

module.exports = { run };
