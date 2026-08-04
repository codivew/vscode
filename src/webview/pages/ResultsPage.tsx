/** @jsxImportSource react */
import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { t } from '../../shared/localization.js';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { vscode } from '../app/vscode-api.js';
import type { ReviewIssueSummary } from '../../shared/protocol.js';
import { issueSkipChanged } from '../features/review/reviewSlice.js';
import styles from './ResultsPage.module.css';

type SeverityFilter = 'all' | ReviewIssueSummary['severity'];

const ResultsPage = (): React.JSX.Element => {
  const result = useAppSelector((state) => state.review.result);
  const skippedIssueIndexes = useAppSelector((state) => state.review.skippedIssueIndexes);
  const editedIssueIndexes = useAppSelector((state) => state.review.editedIssueIndexes);
  const diagnosticsHidden = useAppSelector((state) => state.review.diagnosticsHidden);
  const reviewStatus = useAppSelector((state) => state.review.status);
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const groups = useMemo(() => {
    if (result === undefined) return [];
    const issues =
      filter === 'all' ? result.issues : result.issues.filter((issue) => issue.severity === filter);
    const byFile = new Map<string, ReviewIssueSummary[]>();
    for (const issue of issues) {
      const group = byFile.get(issue.file) ?? [];
      group.push(issue);
      byFile.set(issue.file, group);
    }
    return [...byFile.entries()];
  }, [filter, result]);

  if (result === undefined) return <Navigate to="/review" replace />;

  const editedFiles = new Set(
    result.issues
      .filter(
        (issue) =>
          editedIssueIndexes.includes(issue.index) && !skippedIssueIndexes.includes(issue.index),
      )
      .map((issue) => issue.file),
  );

  return (
    <section className={styles.results} aria-labelledby="results-title">
      <header className={styles.heading}>
        <h2 id="results-title">{t('results.title')}</h2>
        <div className={styles.metrics}>
          <Metric label={t('results.verdict')} value={result.verdict} />
          <Metric label={t('results.risk')} value={riskLabel(result.risk)} />
          <Metric label={t('results.files')} value={result.reviewedFileCount} />
          <Metric label={t('results.issues')} value={result.issueCount} />
        </div>
      </header>

      <section className={styles.summary}>
        <h3>{t('results.summary')}</h3>
        <p>{result.summary}</p>
      </section>

      {result.issues.length > 0 && (
        <label className={styles.filter} htmlFor="severity-filter">
          <span>{t('results.filter')}</span>
          <select
            id="severity-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as SeverityFilter)}
          >
            <option value="all">{t('results.allSeverities')}</option>
            <option value="must_fix">{t('results.mustFix')}</option>
            <option value="should_fix">{t('results.shouldFix')}</option>
            <option value="suggestion">{t('results.suggestion')}</option>
          </select>
        </label>
      )}

      {result.issues.length === 0 ? (
        <div className={styles.empty}>{t('results.noIssues')}</div>
      ) : groups.length === 0 ? (
        <div className={styles.empty}>{t('results.noFilteredIssues')}</div>
      ) : (
        <div className={styles.fileGroups}>
          {groups.map(([file, issues]) => (
            <section className={styles.fileGroup} key={file}>
              <h3 title={file}>{file}</h3>
              <div className={styles.issueList}>
                {issues.map((issue) => (
                  <IssueCard
                    key={issue.index}
                    issue={issue}
                    reviewId={result.reviewId}
                    skipped={skippedIssueIndexes.includes(issue.index)}
                    edited={editedIssueIndexes.includes(issue.index)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {result.tests.length > 0 && (
        <section className={styles.tests}>
          <h3>{t('results.tests')}</h3>
          <ul>
            {result.tests.map((test, index) => (
              <li key={`${index}-${test}`}>{test}</li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.resultActions}>
        {editedFiles.size > 0 && (
          <button
            className={styles.reviewEditedButton}
            type="button"
            disabled={reviewStatus === 'running'}
            onClick={() => vscode.postMessage({ type: 'reviewEditedFiles' })}
          >
            {reviewStatus === 'running'
              ? t('results.reviewingEditedFiles')
              : t('results.reviewEditedFiles')}
          </button>
        )}
        <button
          className={styles.clearButton}
          type="button"
          onClick={() =>
            vscode.postMessage({ type: 'setDiagnosticsHidden', hidden: !diagnosticsHidden })
          }
        >
          {diagnosticsHidden ? t('results.restoreUnderlines') : t('results.clearUnderlines')}
        </button>
        <button
          className={styles.reportButton}
          type="button"
          onClick={() => vscode.postMessage({ type: 'openReport' })}
        >
          {t('results.openReport')}
        </button>
      </div>
    </section>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }): React.JSX.Element => (
  <div>
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

const IssueCard = ({
  issue,
  reviewId,
  skipped,
  edited,
}: {
  issue: ReviewIssueSummary;
  reviewId: string;
  skipped: boolean;
  edited: boolean;
}): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const setSkipped = (): void => {
    const nextSkipped = !skipped;
    dispatch(issueSkipChanged({ issueIndex: issue.index, skipped: nextSkipped }));
    vscode.postMessage({
      type: 'skipIssue',
      reviewId,
      issueIndex: issue.index,
      skipped: nextSkipped,
    });
  };

  return (
    <article
      className={styles.issue}
      data-severity={issue.severity}
      data-skipped={skipped}
      data-edited={edited}
    >
      <div className={styles.issueMeta}>
        <span className={styles.severity}>{severityLabel(issue.severity)}</span>
        <span>{locationLabel(issue)}</span>
        <span>{t('results.confidence', { value: Math.round(issue.confidence * 100) })}</span>
        {skipped && <span className={styles.skipped}>{t('results.skipped')}</span>}
        {!skipped && edited && <span className={styles.edited}>{t('results.edited')}</span>}
      </div>
      <h4>{issue.title}</h4>
      <p>{issue.description}</p>
      {issue.impact !== undefined && <Detail label={t('results.impact')} value={issue.impact} />}
      {issue.suggestion !== undefined && (
        <Detail label={t('results.fixSuggestion')} value={issue.suggestion} />
      )}
      {issue.codeSnippet !== undefined && (
        <div className={styles.code}>
          <strong>{t('results.codeSnippet')}</strong>
          <pre>
            <code>{issue.codeSnippet}</code>
          </pre>
        </div>
      )}
      <div className={styles.issueActions}>
        <button
          className={styles.openButton}
          type="button"
          onClick={() =>
            vscode.postMessage({ type: 'openIssue', reviewId, issueIndex: issue.index })
          }
        >
          {t('results.openIssue')}
        </button>
        <button className={styles.skipButton} type="button" onClick={setSkipped}>
          {skipped ? t('results.restoreIssue') : t('results.skipIssue')}
        </button>
      </div>
    </article>
  );
};

const Detail = ({ label, value }: { label: string; value: string }): React.JSX.Element => (
  <div className={styles.detail}>
    <strong>{label}</strong>
    <p>{value}</p>
  </div>
);

function severityLabel(severity: ReviewIssueSummary['severity']): string {
  return {
    must_fix: t('results.mustFix'),
    should_fix: t('results.shouldFix'),
    suggestion: t('results.suggestion'),
  }[severity];
}

function riskLabel(risk: 'low' | 'medium' | 'high'): string {
  return {
    low: t('results.lowRisk'),
    medium: t('results.mediumRisk'),
    high: t('results.highRisk'),
  }[risk];
}

function locationLabel(issue: ReviewIssueSummary): string {
  return issue.endLine !== undefined && issue.endLine !== issue.line
    ? t('results.lineRange', { start: issue.line, end: issue.endLine })
    : t('results.line', { line: issue.line });
}

export default ResultsPage;
