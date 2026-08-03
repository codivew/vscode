/** @jsxImportSource react */
import React, { useEffect, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks.js';
import { vscode } from '../../app/vscode-api.js';
import Field from '../../shared/Field.js';
import OllamaFields from '../ollama/OllamaFields.js';
import {
  baseBranchChanged,
  diffStatsInvalidated,
  diffStatsRequested,
  modeChanged,
  workspaceChanged,
} from './reviewSlice.js';
import ReviewTargets from './ReviewTargets.js';

let nextStatsRequestId = 0;

const ReviewTab = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const review = useAppSelector((state) => state.review);
  const ollama = useAppSelector((state) => state.ollama);
  const maxDiffChars = useAppSelector((state) => state.settings.maxDiffChars);
  const running = review.status === 'running';
  const hasWorkspace = review.workspaces.length > 0;
  const hasModels = ollama.status === 'loaded' && ollama.models.length > 0;
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
    <form className="card" onSubmit={submit}>
      <Field label="워크스페이스" htmlFor="workspace">
        <select
          id="workspace"
          disabled={!hasWorkspace || running}
          value={review.workspaceIndex}
          onChange={(event) => dispatch(workspaceChanged(Number(event.target.value)))}
        >
          {!hasWorkspace && <option value={-1}>열린 워크스페이스가 없습니다</option>}
          {review.workspaces.map((workspace) => (
            <option key={workspace.index} value={workspace.index}>
              {workspace.name} · {workspace.path}
            </option>
          ))}
        </select>
      </Field>

      <OllamaFields disabled={running} />

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

      <div className="actions">
        <button
          type="submit"
          disabled={
            !hasWorkspace ||
            !hasModels ||
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
            className="secondary"
            type="button"
            onClick={() => vscode.postMessage({ type: 'cancel' })}
          >
            취소
          </button>
        )}
      </div>

      <div className="status" data-status={review.status} role="status" aria-live="polite">
        {review.statusMessage}
      </div>

      {review.result !== undefined && (
        <section className="result">
          <div className="metrics">
            <Metric value={review.result.verdict} label="판정" />
            <Metric value={review.result.reviewedFileCount} label="파일" />
            <Metric value={review.result.issueCount} label="항목" />
          </div>
          <button
            className="secondary report-button"
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
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
};

export default ReviewTab;
