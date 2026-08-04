import * as vscode from 'vscode';
import { ReviewMode } from 'codivew/core';
import { getLocale, t } from '../../shared/localization.js';
import type { ReviewController } from '../review/review-controller.js';

export function registerReviewCommands(controller: ReviewController): vscode.Disposable[] {
  return [
    registerReviewCommand('codivew.reviewWorking', ReviewMode.WORKING, controller),
    registerReviewCommand('codivew.reviewStaged', ReviewMode.STAGED, controller),
    registerReviewCommand('codivew.reviewBranch', ReviewMode.BRANCH, controller),
    vscode.commands.registerCommand('codivew.openLatestReport', () =>
      controller.openLatestReport(),
    ),
    vscode.commands.registerCommand('codivew.openIssue', (issueIndex: number) =>
      controller.openLatestIssue(issueIndex),
    ),
  ];
}

function registerReviewCommand(
  command: string,
  mode: ReviewMode,
  controller: ReviewController,
): vscode.Disposable {
  return vscode.commands.registerCommand(command, async () => {
    const folder = await selectWorkspaceFolder();
    if (folder === undefined) return;

    const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
    const configuredBaseBranch = configuration.get('baseBranch', 'main');
    const baseBranch =
      mode === ReviewMode.BRANCH
        ? await vscode.window.showInputBox({
            title: t('host.branchReview'),
            prompt: t('host.branchPrompt'),
            value: configuredBaseBranch,
            validateInput: (value) =>
              value.trim().length === 0 ? t('host.branchRequired') : undefined,
          })
        : configuredBaseBranch;
    if (baseBranch === undefined) return;

    await controller.run({
      folder,
      locale: getLocale(),
      mode,
      baseBranch: baseBranch.trim(),
      projectContext: configuration.get<string[]>('projectContext', []),
      ollamaUrl: configuration.get<string>('ollamaUrl'),
      model: configuration.get<string>('model'),
      maxDiffChars: configuration.get<number>('maxDiffChars'),
      openReport: true,
    });
  });
}

async function selectWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (folders === undefined || folders.length === 0) {
    await vscode.window.showWarningMessage(t('host.openWorkspace'));
    return undefined;
  }
  if (folders.length === 1) return folders[0];

  const selected = await vscode.window.showQuickPick(
    folders.map((folder) => ({ label: folder.name, description: folder.uri.fsPath, folder })),
    { title: t('host.selectWorkspace') },
  );
  return selected?.folder;
}
