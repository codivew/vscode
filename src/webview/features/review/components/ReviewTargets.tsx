/** @jsxImportSource react */
import React from 'react';
import { formatNumber } from '../../../shared/format.js';
import type { ReviewState } from '../reviewSlice.js';
import { allFilesSelectionChanged, fileSelectionChanged } from '../reviewSlice.js';
import styles from './ReviewTargets.module.css';
import { t } from '../../../../shared/localization.js';
import { useAppDispatch } from '../../../app/hooks.js';
import { vscode } from '../../../app/vscode-api.js';

const ReviewTargets = ({
  review,
  disabled,
}: {
  review: Pick<
    ReviewState,
    'workspaceIndex' | 'diffStats' | 'diffStatsStatus' | 'diffStatsMessage' | 'selectedFiles'
  >;
  disabled: boolean;
}): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const { diffStats, diffStatsStatus, diffStatsMessage, selectedFiles } = review;
  const diffTooLarge = diffStats.filteredCharCount > diffStats.maxDiffChars;
  const allSelected = diffStats.files.length > 0 && selectedFiles.length === diffStats.files.length;
  return (
    <section
      className={styles.diffSummary}
      data-status={diffStatsStatus}
      data-over-limit={diffTooLarge}
    >
      <div className={styles.diffSummaryHeader}>
        <span>{t('targets.title')}</span>
        <small>{diffStatsMessage}</small>
      </div>
      {diffStatsStatus === 'loading' && (
        <div className={styles.diffPlaceholder} aria-live="polite">
          {t('targets.loading')}
        </div>
      )}
      {diffStatsStatus === 'error' && (
        <div className={`${styles.diffPlaceholder} ${styles.error}`} aria-live="polite">
          {t('targets.error')}
        </div>
      )}
      {diffStatsStatus === 'loaded' && diffStats.files.length === 0 && (
        <div className={styles.diffPlaceholder} aria-live="polite">
          {t('targets.empty')}
        </div>
      )}
      {diffStatsStatus === 'loaded' && diffStats.files.length > 0 && (
        <>
          <div className={styles.selectionControls}>
            <span>
              {t('targets.selectedCount', {
                selected: formatNumber(selectedFiles.length),
                total: formatNumber(diffStats.files.length),
              })}
            </span>
            <div>
              <button
                type="button"
                disabled={disabled || allSelected}
                onClick={() => dispatch(allFilesSelectionChanged(true))}
              >
                {t('targets.selectAll')}
              </button>
              <button
                type="button"
                disabled={disabled || selectedFiles.length === 0}
                onClick={() => dispatch(allFilesSelectionChanged(false))}
              >
                {t('targets.clearAll')}
              </button>
            </div>
          </div>
          <div className={styles.fileSummary} aria-live="polite">
            <strong>
              {diffStats.fileCount === 1
                ? t('targets.singleFile')
                : t('targets.fileCount', { count: formatNumber(diffStats.fileCount) })}
            </strong>
            <span>
              {t('targets.lineCount', { count: formatNumber(diffStats.changedLineCount) })}
            </span>
            {diffStats.additions > 0 && (
              <span className={styles.additions}>+{formatNumber(diffStats.additions)}</span>
            )}
            {diffStats.deletions > 0 && (
              <span className={styles.deletions}>-{formatNumber(diffStats.deletions)}</span>
            )}
          </div>
          <ul className={styles.fileList}>
            {diffStats.files.map((file) => (
              <FileRow
                key={file.path}
                path={file.path}
                checked={selectedFiles.includes(file.path)}
                disabled={disabled}
                onOpen={() =>
                  vscode.postMessage({
                    type: 'openFile',
                    workspaceIndex: review.workspaceIndex,
                    path: file.path,
                  })
                }
                onChange={(selected) =>
                  dispatch(fileSelectionChanged({ path: file.path, selected }))
                }
              />
            ))}
          </ul>
          {selectedFiles.length === 0 && (
            <div className={styles.selectionError}>{t('targets.noSelection')}</div>
          )}
          <DiffSize stats={diffStats} tooLarge={diffTooLarge} />
        </>
      )}
    </section>
  );
};

const DiffSize = ({
  stats,
  tooLarge,
}: {
  stats: ReviewState['diffStats'];
  tooLarge: boolean;
}): React.JSX.Element => {
  return (
    <div className={styles.diffSize}>
      <div className={styles.diffSizeLabel}>
        <span>{t('targets.filteredDiff')}</span>
        <strong>
          {formatNumber(stats.filteredCharCount)} /{' '}
          {t('targets.characters', { count: formatNumber(stats.maxDiffChars) })}
        </strong>
      </div>
      <div
        className={styles.diffSizeTrack}
        role="progressbar"
        aria-label={t('targets.diffSize')}
        aria-valuenow={stats.filteredCharCount}
        aria-valuemin={0}
        aria-valuemax={stats.maxDiffChars}
      >
        <div
          className={styles.diffSizeValue}
          style={{
            width: `${Math.min(100, (stats.filteredCharCount / stats.maxDiffChars) * 100)}%`,
          }}
        />
      </div>
      {tooLarge && (
        <div className={styles.diffSizeError}>
          {t('targets.overLimit', {
            count: formatNumber(stats.filteredCharCount - stats.maxDiffChars),
          })}
        </div>
      )}
    </div>
  );
};

const FileRow = ({
  path,
  checked,
  disabled,
  onOpen,
  onChange,
}: {
  path: string;
  checked: boolean;
  disabled: boolean;
  onOpen: () => void;
  onChange: (selected: boolean) => void;
}): React.JSX.Element => {
  const separator = path.lastIndexOf('/');
  const directory = separator < 0 ? '' : path.slice(0, separator);
  const name = separator < 0 ? path : path.slice(separator + 1);
  return (
    <li title={path} data-selected={checked}>
      <label>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <svg className={styles.fileIcon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 1.5h6l4 4V14.5H3z" />
          <path d="M9 1.5v4h4" />
        </svg>
        <span className={styles.filePath}>
          {directory !== '' && <span className={styles.fileDirectory}>{directory}/</span>}
          <span className={styles.fileName}>{name}</span>
        </span>
      </label>
      <button
        className={styles.openFileButton}
        type="button"
        title={t('targets.openFile')}
        aria-label={t('targets.openFileNamed', { path })}
        onClick={onOpen}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M9.5 2.5h4v4" />
          <path d="m13.25 2.75-6 6" />
          <path d="M12.5 9v3.5h-9v-9H7" />
        </svg>
      </button>
    </li>
  );
};

export default ReviewTargets;
