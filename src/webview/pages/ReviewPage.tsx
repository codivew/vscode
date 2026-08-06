/** @jsxImportSource react */
import React, { useCallback, useEffect, type FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { vscode } from '../app/vscode-api.js';
import Field from '../shared/components/Field.js';
import {
  baseBranchChanged,
  branchesRequested,
  currentBranchRequested,
  diffStatsInvalidated,
  diffStatsRequested,
  modeChanged,
} from '../features/review/reviewSlice.js';
import type { ReviewState } from '../features/review/reviewSlice.js';
import ReviewTargets from '../features/review/components/ReviewTargets.js';
import styles from './ReviewPage.module.css';
import { t } from '../../shared/localization.js';

let nextStatsRequestId = 0;
let nextBranchRequestId = 0;
let nextBranchesRequestId = 0;

const ReviewPage = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const review = useAppSelector((state) => state.review);
  const ollama = useAppSelector((state) => state.ollama);
  const maxDiffChars = useAppSelector((state) => state.settings.maxDiffChars);
  const running = review.status === 'running';
  const hasWorkspace = review.workspaces.length > 0;
  const hasModel = ollama.model.trim().length > 0;
  const workspace = review.workspaces.find((item) => item.index === review.workspaceIndex);
  const diffTooLarge = review.diffStats.filteredCharCount > review.diffStats.maxDiffChars;

  const refreshRepository = useCallback((): void => {
    const branchRequestId = ++nextBranchRequestId;
    dispatch(currentBranchRequested({ requestId: branchRequestId }));
    vscode.postMessage({
      type: 'loadCurrentBranch',
      workspaceIndex: review.workspaceIndex,
      requestId: branchRequestId,
    });

    const branchesRequestId = ++nextBranchesRequestId;
    dispatch(branchesRequested({ requestId: branchesRequestId }));
    vscode.postMessage({
      type: 'loadBranches',
      workspaceIndex: review.workspaceIndex,
      requestId: branchesRequestId,
    });
  }, [dispatch, review.workspaceIndex]);

  useEffect(() => {
    refreshRepository();
    window.addEventListener('focus', refreshRepository);
    return (): void => window.removeEventListener('focus', refreshRepository);
  }, [refreshRepository]);

  useEffect(() => {
    const requestId = ++nextStatsRequestId;
    if (review.workspaceIndex < 0) {
      dispatch(
        diffStatsInvalidated({
          requestId,
          message: t('review.selectWorkspace'),
          maxDiffChars,
        }),
      );
      return;
    }
    if (review.mode === 'branch' && review.branchesStatus !== 'loaded') {
      dispatch(
        diffStatsInvalidated({
          requestId,
          message:
            review.branchesStatus === 'error'
              ? t('review.branchesUnavailable')
              : t('review.branchesLoading'),
          maxDiffChars,
        }),
      );
      return;
    }
    if (review.mode === 'branch' && review.baseBranch.length === 0) {
      dispatch(
        diffStatsInvalidated({
          requestId,
          message: t('review.enterBaseBranch'),
          maxDiffChars,
        }),
      );
      return;
    }

    dispatch(diffStatsRequested({ requestId, maxDiffChars }));
    const timeout = window.setTimeout(() => {
      vscode.postMessage({
        type: 'loadDiffStats',
        workspaceIndex: review.workspaceIndex,
        mode: review.mode,
        baseBranch: review.baseBranch,
        requestId,
        maxDiffChars,
      });
    }, 300);
    return (): void => window.clearTimeout(timeout);
  }, [
    dispatch,
    maxDiffChars,
    review.baseBranch,
    review.branchesStatus,
    review.mode,
    review.workspaceIndex,
  ]);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    vscode.postMessage({
      type: 'review',
      workspaceIndex: review.workspaceIndex,
      ollamaUrl: ollama.url,
      model: ollama.model,
      mode: review.mode,
      baseBranch: review.baseBranch,
      maxDiffChars,
      selectedFiles: review.selectedFiles,
    });
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <section className={styles.reviewEnvironment} aria-label={t('review.environment')}>
        <div>
          <span>{t('review.environment')}</span>
          <strong>{workspace?.name ?? t('review.noWorkspace')}</strong>
          <small>{ollama.model || t('review.noModel')}</small>
        </div>
        <button
          className={styles.textButton}
          type="button"
          disabled={running}
          onClick={() => void navigate('/settings')}
        >
          {t('review.change')}
        </button>
      </section>

      <Field label={t('review.currentBranch')} htmlFor="current-branch">
        <div className={styles.branchControl}>
          <input
            id="current-branch"
            value={currentBranchLabel(review)}
            title={review.currentBranch}
            readOnly
          />
          <button
            className={`${styles.textButton} ${styles.iconButton}`}
            type="button"
            aria-label={t('review.refreshCurrentBranch')}
            title={t('review.refreshCurrentBranch')}
            disabled={
              workspace === undefined ||
              running ||
              review.currentBranchStatus === 'loading' ||
              review.branchesStatus === 'loading'
            }
            onClick={refreshRepository}
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>
      </Field>

      <Field label={t('review.scope')} htmlFor="mode">
        <select
          id="mode"
          value={review.mode}
          disabled={running}
          onChange={(event) => dispatch(modeChanged(event.target.value))}
        >
          <option value="working">{t('review.modeWorking')}</option>
          <option value="staged">{t('review.modeStaged')}</option>
          <option value="branch">{t('review.modeBranch')}</option>
        </select>
      </Field>

      <Field label={t('review.baseBranch')} htmlFor="base-branch">
        <select
          id="base-branch"
          value={review.branchesStatus === 'loaded' ? review.baseBranch : ''}
          disabled={
            review.mode !== 'branch' ||
            running ||
            review.branchesStatus !== 'loaded' ||
            review.availableBranches.length === 0
          }
          onChange={(event) => dispatch(baseBranchChanged(event.target.value))}
          required={review.mode === 'branch'}
        >
          {review.branchesStatus !== 'loaded' || review.availableBranches.length === 0 ? (
            <option value="">{branchesPlaceholder(review)}</option>
          ) : (
            review.availableBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))
          )}
        </select>
      </Field>

      <ReviewTargets review={review} disabled={running} />

      <div className={styles.actions}>
        <button
          type="submit"
          disabled={
            !hasWorkspace ||
            !hasModel ||
            review.diffStatsStatus !== 'loaded' ||
            review.diffStats.fileCount === 0 ||
            diffTooLarge ||
            running
          }
        >
          {t('review.start')}
        </button>
        {running && (
          <button
            className={styles.secondary}
            type="button"
            onClick={() => vscode.postMessage({ type: 'cancel' })}
          >
            {t('review.cancel')}
          </button>
        )}
      </div>

      <div className={styles.status} data-status={review.status} role="status" aria-live="polite">
        {review.statusMessage}
      </div>

      {review.result !== undefined && (
        <section className={styles.result}>
          <div className={styles.metrics}>
            <Metric value={review.result.verdict} label={t('review.verdict')} />
            <Metric value={review.result.reviewedFileCount} label={t('review.files')} />
            <Metric value={review.result.issueCount} label={t('review.items')} />
          </div>
          <button
            className={`${styles.secondary} ${styles.reportButton}`}
            type="button"
            onClick={() => vscode.postMessage({ type: 'openReport' })}
          >
            {t('review.openReport')}
          </button>
        </section>
      )}
    </form>
  );
};

function currentBranchLabel(review: ReviewState): string {
  if (review.currentBranchStatus === 'idle' || review.currentBranchStatus === 'loading') {
    return t('review.currentBranchLoading');
  }
  if (review.currentBranchStatus === 'error') return t('review.currentBranchUnavailable');
  return review.currentBranch ?? t('review.detachedHead');
}

function branchesPlaceholder(review: ReviewState): string {
  return review.branchesStatus === 'error' || review.branchesStatus === 'loaded'
    ? t('review.branchesUnavailable')
    : t('review.branchesLoading');
}

const Metric = ({ value, label }: { value: string | number; label: string }): React.JSX.Element => {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
};

export default ReviewPage;
