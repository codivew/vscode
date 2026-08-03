/** @jsxImportSource react */
import React, { useEffect, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks.js';
import { vscode } from '../../../app/vscode-api.js';
import Field from '../../../shared/components/Field.js';
import { tabChanged } from '../../navigation/navigationSlice.js';
import {
  baseBranchChanged,
  diffStatsInvalidated,
  diffStatsRequested,
  modeChanged,
} from '../reviewSlice.js';
import ReviewTargets from './ReviewTargets.js';
import styles from './ReviewTab.module.css';
import { t } from '../../../../localization.js';

let nextStatsRequestId = 0;

const ReviewTab = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const review = useAppSelector((state) => state.review);
  const ollama = useAppSelector((state) => state.ollama);
  const maxDiffChars = useAppSelector((state) => state.settings.maxDiffChars);
  const running = review.status === 'running';
  const hasWorkspace = review.workspaces.length > 0;
  const hasModel = ollama.model.trim().length > 0;
  const workspace = review.workspaces.find((item) => item.index === review.workspaceIndex);
  const diffTooLarge = review.diffStats.filteredCharCount > review.diffStats.maxDiffChars;

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
    if (review.mode === 'branch' && review.baseBranch.trim().length === 0) {
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
  }, [dispatch, maxDiffChars, review.baseBranch, review.mode, review.workspaceIndex]);

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
          onClick={() => dispatch(tabChanged('settings'))}
        >
          {t('review.change')}
        </button>
      </section>

      <Field label={t('review.scope')} htmlFor="mode">
        <select
          id="mode"
          value={review.mode}
          disabled={running}
          onChange={(event) => dispatch(modeChanged(event.target.value))}
        >
          <option value="working">Working tree</option>
          <option value="staged">Staged changes</option>
          <option value="branch">Branch changes</option>
        </select>
      </Field>

      <Field label={t('review.baseBranch')} htmlFor="base-branch">
        <input
          id="base-branch"
          value={review.baseBranch}
          disabled={review.mode !== 'branch' || running}
          onChange={(event) => dispatch(baseBranchChanged(event.target.value))}
          required={review.mode === 'branch'}
        />
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

const Metric = ({ value, label }: { value: string | number; label: string }): React.JSX.Element => {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
};

export default ReviewTab;
