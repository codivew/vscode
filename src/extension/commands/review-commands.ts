import * as vscode from 'vscode';
import { ReviewMode } from 'codivew/core';
import { getLocale, t } from '../../shared/localization.js';
import { getStoredAuthentication } from '../authentication.js';
import { resolveApiUrl } from '../config.js';
import { listBaseBranches, type RepositoryBranches } from '../repository/branches.js';
import type { ReviewController } from '../review/review-controller.js';

export function registerReviewCommands(
  controller: ReviewController,
  secrets: vscode.SecretStorage,
): vscode.Disposable[] {
  return [
    registerReviewCommand('codivew.reviewWorking', ReviewMode.WORKING, controller, secrets),
    registerReviewCommand('codivew.reviewStaged', ReviewMode.STAGED, controller, secrets),
    registerReviewCommand('codivew.reviewBranch', ReviewMode.BRANCH, controller, secrets),
    vscode.commands.registerCommand('codivew.openLatestReport', () =>
      controller.openLatestReport(),
    ),
    vscode.commands.registerCommand('codivew.openIssue', (issueIndex: number) =>
      controller.openLatestIssue(issueIndex),
    ),
    vscode.commands.registerCommand('codivew.clearDiagnostics', () => {
      if (!controller.setDiagnosticsHidden(true)) {
        void vscode.window.showInformationMessage(t('host.noReport'));
      }
    }),
  ];
}

function registerReviewCommand(
  command: string,
  mode: ReviewMode,
  controller: ReviewController,
  secrets: vscode.SecretStorage,
): vscode.Disposable {
  return vscode.commands.registerCommand(command, async () => {
    const folder = await selectWorkspaceFolder();
    if (folder === undefined) return;

    const configuration = vscode.workspace.getConfiguration('codivew', folder.uri);
    const configuredBaseBranch = configuration.get('baseBranch', 'main');
    const baseBranch =
      mode === ReviewMode.BRANCH
        ? await selectBaseBranch(folder, configuredBaseBranch)
        : configuredBaseBranch;
    if (baseBranch === undefined) return;

    await controller.run({
      folder,
      locale: getLocale(),
      mode,
      baseBranch: baseBranch.trim(),
      projectContext: configuration.get<string[]>('projectContext', []),
      apiUrl: resolveApiUrl(configuration),
      model: configuration.get<string>('model'),
      maxDiffChars: configuration.get<number>('maxDiffChars'),
      authentication: await getStoredAuthentication(secrets),
      openReport: true,
    });
  });
}

async function selectBaseBranch(
  folder: vscode.WorkspaceFolder,
  configuredBranch: string,
): Promise<string | undefined> {
  try {
    const repository = await listBaseBranches(folder.uri.fsPath);
    if (repository.branches.length === 0) {
      await vscode.window.showWarningMessage(t('review.branchesUnavailable'));
      return undefined;
    }
    const preferred = preferredBaseBranch(configuredBranch, repository);
    const branches = [preferred, ...repository.branches.filter((branch) => branch !== preferred)];
    return vscode.window.showQuickPick(branches, {
      title: t('host.branchReview'),
      placeHolder: t('host.branchPrompt'),
    });
  } catch {
    await vscode.window.showWarningMessage(t('review.branchesUnavailable'));
    return undefined;
  }
}

function preferredBaseBranch(configuredBranch: string, repository: RepositoryBranches): string {
  const preferred = [
    configuredBranch,
    repository.defaultBranch,
    'main',
    'master',
    'origin/main',
    'origin/master',
  ];
  return (
    preferred.find((branch) => branch !== undefined && repository.branches.includes(branch)) ??
    repository.branches[0]
  );
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
