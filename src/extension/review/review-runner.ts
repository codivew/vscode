import { basename } from 'node:path';
import {
  createGitReviewInput,
  DEFAULT_API_TIMEOUT_MS,
  DEFAULT_API_URL,
  DEFAULT_MAX_DIFF_CHARS,
  DEFAULT_MODEL,
  DiffFilterService,
  HtmlRendererService,
  OpenAICompatibleService,
  ReviewMode,
  ReviewPromptService,
  ReviewsService,
  runReview,
  type Authentication,
  type Language,
  type ReviewProgressStage,
  type RunReviewResult,
} from 'codivew/core';
import { selectDiffFiles } from './diff-files.js';

export type RunInput = {
  cwd: string;
  locale: Language;
  mode: ReviewMode;
  baseBranch: string;
  projectContext: string[];
  apiUrl?: string;
  authentication?: Authentication;
  model?: string;
  maxDiffChars?: number;
  selectedFiles?: string[];
};

export async function executeReview(
  input: RunInput,
  signal: AbortSignal,
  onProgress: (stage: ReviewProgressStage) => void,
): Promise<RunReviewResult> {
  const options = { ...input, signal, onProgress };
  return input.selectedFiles === undefined
    ? runReview(options)
    : runReviewForFiles(options, input.selectedFiles);
}

async function runReviewForFiles(
  options: Omit<RunInput, 'selectedFiles'> & {
    signal: AbortSignal;
    onProgress: (stage: ReviewProgressStage) => void;
  },
  selectedFiles: string[],
): Promise<RunReviewResult> {
  options.onProgress('collecting-diff');
  const gitInput = await createGitReviewInput(options.cwd, {
    mode: options.mode,
    baseBranch: options.baseBranch,
    signal: options.signal,
  });
  const diff = selectDiffFiles(gitInput.diff, selectedFiles);
  const request = {
    repository: basename(gitInput.repositoryRoot),
    locale: options.locale,
    baseBranch: options.mode === ReviewMode.BRANCH ? options.baseBranch : undefined,
    mode: options.mode,
    commitSha: gitInput.commitSha,
    projectContext: options.projectContext.length === 0 ? undefined : options.projectContext,
    diff,
  };

  options.onProgress('generating-review');
  const reviews = new ReviewsService(
    options.maxDiffChars ?? DEFAULT_MAX_DIFF_CHARS,
    new DiffFilterService(),
    new ReviewPromptService(),
    new OpenAICompatibleService({
      baseUrl: options.apiUrl ?? DEFAULT_API_URL,
      model: options.model ?? DEFAULT_MODEL,
      authentication: options.authentication,
      timeoutMs: DEFAULT_API_TIMEOUT_MS,
      signal: options.signal,
    }),
    new HtmlRendererService(),
  );
  const generated = await reviews.createReview(request);
  options.onProgress('completed');
  return {
    ...generated,
    repositoryRoot: gitInput.repositoryRoot,
    request: generated.json.request,
  };
}
