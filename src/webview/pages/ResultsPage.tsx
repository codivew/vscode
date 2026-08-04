/** @jsxImportSource react */
import React, { useMemo, useState } from 'react';
import { t } from '../../shared/localization.js';
import { useAppSelector } from '../app/hooks.js';
import { vscode } from '../app/vscode-api.js';
import type { ReviewIssueSummary } from '../../shared/protocol.js';
import styles from './ResultsPage.module.css';

type SeverityFilter = 'all' | ReviewIssueSummary['severity'];

const ResultsPage = (): React.JSX.Element => {
  const result = useAppSelector((state) => state.review.result);
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

  if (result === undefined) return <div className={styles.empty}>{t('results.noIssues')}</div>;

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
                  <IssueCard key={issue.index} issue={issue} reviewId={result.reviewId} />
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

      <button
        className={styles.reportButton}
        type="button"
        onClick={() => vscode.postMessage({ type: 'openReport' })}
      >
        {t('results.openReport')}
      </button>
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
}: {
  issue: ReviewIssueSummary;
  reviewId: string;
}): React.JSX.Element => (
  <article className={styles.issue} data-severity={issue.severity}>
    <div className={styles.issueMeta}>
      <span className={styles.severity}>{severityLabel(issue.severity)}</span>
      <span>{locationLabel(issue)}</span>
      <span>{t('results.confidence', { value: Math.round(issue.confidence * 100) })}</span>
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
    <button
      className={styles.openButton}
      type="button"
      onClick={() => vscode.postMessage({ type: 'openIssue', reviewId, issueIndex: issue.index })}
    >
      {t('results.openIssue')}
    </button>
  </article>
);

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
