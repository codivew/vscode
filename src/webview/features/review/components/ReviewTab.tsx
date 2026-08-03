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
          message: '워크스페이스를 선택하세요.',
          maxDiffChars,
        }),
      );
      return;
    }
    if (review.mode === 'branch' && review.baseBranch.trim().length === 0) {
      dispatch(
        diffStatsInvalidated({
          requestId,
          message: '기준 브랜치를 입력하세요.',
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
    });
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <section className={styles.reviewEnvironment} aria-label="현재 리뷰 환경">
        <div>
          <span>현재 리뷰 환경</span>
          <strong>{workspace?.name ?? '워크스페이스 없음'}</strong>
          <small>{ollama.model || '모델 미설정'}</small>
        </div>
        <button
          className={styles.textButton}
          type="button"
          disabled={running}
          onClick={() => dispatch(tabChanged('settings'))}
        >
          변경
        </button>
      </section>

      <Field label="리뷰 범위" htmlFor="mode">
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

      <Field label="기준 브랜치" htmlFor="base-branch">
        <input
          id="base-branch"
          value={review.baseBranch}
          disabled={review.mode !== 'branch' || running}
          onChange={(event) => dispatch(baseBranchChanged(event.target.value))}
          required={review.mode === 'branch'}
        />
      </Field>

      <ReviewTargets review={review} />

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
          리뷰 시작
        </button>
        {running && (
          <button
            className={styles.secondary}
            type="button"
            onClick={() => vscode.postMessage({ type: 'cancel' })}
          >
            취소
          </button>
        )}
      </div>

      <div className={styles.status} data-status={review.status} role="status" aria-live="polite">
        {review.statusMessage}
      </div>

      {review.result !== undefined && (
        <section className={styles.result}>
          <div className={styles.metrics}>
            <Metric value={review.result.verdict} label="판정" />
            <Metric value={review.result.reviewedFileCount} label="파일" />
            <Metric value={review.result.issueCount} label="항목" />
          </div>
          <button
            className={`${styles.secondary} ${styles.reportButton}`}
            type="button"
            onClick={() => vscode.postMessage({ type: 'openReport' })}
          >
            전체 리포트 열기
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
