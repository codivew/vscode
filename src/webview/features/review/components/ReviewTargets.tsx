/** @jsxImportSource react */
import React from 'react';
import { formatNumber } from '../../../shared/format.js';
import type { ReviewState } from '../reviewSlice.js';
import styles from './ReviewTargets.module.css';

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
        <span>리뷰 대상</span>
        <small>{diffStatsMessage}</small>
      </div>
      {diffStatsStatus === 'loading' && (
        <div className={styles.diffPlaceholder} aria-live="polite">
          파일 목록을 불러오는 중...
        </div>
      )}
      {diffStatsStatus === 'error' && (
        <div className={`${styles.diffPlaceholder} ${styles.error}`} aria-live="polite">
          변경 파일을 불러오지 못했습니다.
        </div>
      )}
      {diffStatsStatus === 'loaded' && diffStats.files.length === 0 && (
        <div className={styles.diffPlaceholder} aria-live="polite">
          리뷰할 변경 파일이 없습니다.
        </div>
      )}
      {diffStatsStatus === 'loaded' && diffStats.files.length > 0 && (
        <>
          <div className={styles.fileSummary} aria-live="polite">
            <strong>{formatNumber(diffStats.fileCount)}개 파일</strong>
            <span>{formatNumber(diffStats.changedLineCount)}줄 변경</span>
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
        <span>필터링된 Diff</span>
        <strong>
          {formatNumber(stats.filteredCharCount)} / {formatNumber(stats.maxDiffChars)}자
        </strong>
      </div>
      <div
        className={styles.diffSizeTrack}
        role="progressbar"
        aria-label="필터링된 Diff 크기"
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
          최대 크기를 {formatNumber(stats.filteredCharCount - stats.maxDiffChars)}자 초과했습니다.
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
