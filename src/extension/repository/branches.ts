import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type RepositoryBranches = {
  branches: string[];
  defaultBranch?: string;
};

export async function readCurrentBranch(cwd: string): Promise<string | undefined> {
  const { stdout } = await git(cwd, ['branch', '--show-current'], 16_384);
  const branch = stdout.trim();
  return branch.length === 0 ? undefined : branch;
}

export async function listBaseBranches(cwd: string): Promise<RepositoryBranches> {
  const [{ stdout }, currentBranch, defaultBranch] = await Promise.all([
    git(
      cwd,
      ['for-each-ref', '--format=%(refname:short)%09%(symref)', 'refs/heads', 'refs/remotes'],
      256_000,
    ),
    readCurrentBranch(cwd),
    git(cwd, ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'], 16_384)
      .then((result) => result.stdout.trim())
      .catch(() => undefined),
  ]);
  const branches = [
    ...new Set(
      stdout.split('\n').flatMap((line) => {
        const [branch = '', symbolicTarget = ''] = line.split('\t');
        return symbolicTarget.length === 0 ? [branch.trim()] : [];
      }),
    ),
  ]
    .filter(
      (branch) =>
        branch.length > 0 &&
        branch !== currentBranch &&
        (currentBranch === undefined || !branch.endsWith(`/${currentBranch}`)),
    )
    .sort((left, right) => left.localeCompare(right));
  return {
    branches,
    ...(defaultBranch === undefined ? {} : { defaultBranch }),
  };
}

function git(cwd: string, args: string[], maxBuffer: number): Promise<{ stdout: string }> {
  return execFileAsync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    maxBuffer,
  });
}
