/** @jsxImportSource react */
import React from 'react';
import { formatNumber } from '../../../shared/format.js';
import type { ReviewState } from '../reviewSlice.js';
import styles from './ReviewTargets.module.css';
import { t } from '../../../../localization.js';

const ReviewTargets = ({
  review,
}: {
  review: Pick<ReviewState, 'diffStats' | 'diffStatsStatus' | 'diffStatsMessage'>;
}): React.JSX.Element => {
  const { diffStats, diffStatsStatus, diffStatsMessage } = review;
  const diffTooLarge = diffStats.filteredCharCount > diffStats.maxDiffChars;
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
          <div className={styles.fileSummary} aria-live="polite">
            <strong>{t('targets.fileCount', { count: formatNumber(diffStats.fileCount) })}</strong>
            <span>
              {t('targets.lineCount', { count: formatNumber(diffStats.changedLineCount) })}
            </span>
            <span className={styles.additions}>+{formatNumber(diffStats.additions)}</span>
            <span className={styles.deletions}>-{formatNumber(diffStats.deletions)}</span>
          </div>
          <ul className={styles.fileList}>
            {diffStats.files.map((path) => (
              <FileRow key={path} path={path} />
            ))}
          </ul>
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

const FileRow = ({ path }: { path: string }): React.JSX.Element => {
  const separator = path.lastIndexOf('/');
  const directory = separator < 0 ? '' : path.slice(0, separator);
  const name = separator < 0 ? path : path.slice(separator + 1);
  return (
    <li title={path}>
      <svg className={styles.fileIcon} viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 1.5h6l4 4V14.5H3z" />
        <path d="M9 1.5v4h4" />
      </svg>
      <span className={styles.filePath}>
        {directory !== '' && <span className={styles.fileDirectory}>{directory}/</span>}
        <span className={styles.fileName}>{name}</span>
      </span>
    </li>
  );
};

export default ReviewTargets;
