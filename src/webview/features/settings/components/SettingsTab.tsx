/** @jsxImportSource react */
import React, { type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks.js';
import { vscode } from '../../../app/vscode-api.js';
import Field from '../../../shared/components/Field.js';
import { formatNumber } from '../../../shared/format.js';
import { validHttpUrl } from '../../../shared/url.js';
import OllamaFields from '../../ollama/components/OllamaFields.js';
import { workspaceChanged } from '../../review/reviewSlice.js';
import { draftMaxDiffCharsChanged, settingsSaveRequested } from '../settingsSlice.js';
import styles from './SettingsTab.module.css';

const PRESETS = [60_000, 120_000, 240_000];

const SettingsTab = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const review = useAppSelector((state) => state.review);
  const ollama = useAppSelector((state) => state.ollama);
  const hasWorkspace = review.workspaces.length > 0 && review.workspaceIndex >= 0;
  const hasModels = ollama.status === 'loaded' && ollama.models.length > 0;
  const validConfiguration =
    hasWorkspace &&
    validHttpUrl(ollama.url) !== undefined &&
    ollama.model.trim().length > 0 &&
    (settings.setupComplete || hasModels);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    dispatch(settingsSaveRequested());
    vscode.postMessage({
      type: 'saveSettings',
      workspaceIndex: review.workspaceIndex,
      ollamaUrl: ollama.url,
      model: ollama.model,
      maxDiffChars: settings.draftMaxDiffChars,
    });
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <div className={styles.heading}>
        <span className={styles.icon} aria-hidden="true">
          AI
        </span>
        <div>
          <h2>{settings.setupComplete ? '리뷰 환경 설정' : 'Codivew 시작하기'}</h2>
          <p>리뷰할 프로젝트와 로컬 AI 모델을 선택합니다.</p>
        </div>
      </div>

      <Field label="기본 워크스페이스" htmlFor="workspace" className={styles.field}>
        <select
          id="workspace"
          disabled={!hasWorkspace || settings.status === 'saving'}
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
        <div className={styles.hint}>리뷰 화면에서 기본으로 사용할 프로젝트입니다.</div>
      </Field>

      <OllamaFields disabled={settings.status === 'saving'} fieldClassName={styles.field} />

      <div className={styles.divider} />

      <div className={styles.sectionTitle}>
        <h3>리뷰 크기 제한</h3>
        <p>큰 Diff로 인한 컨텍스트 초과와 응답 지연을 방지합니다.</p>
      </div>

      <Field label="최대 Diff 문자 수" htmlFor="max-diff-chars" className={styles.field}>
        <input
          id="max-diff-chars"
          type="number"
          min={1_000}
          step={1_000}
          value={settings.draftMaxDiffChars}
          onChange={(event) => dispatch(draftMaxDiffCharsChanged(Number(event.target.value)))}
          required
        />
        <div className={styles.hint}>필터링이 끝난 Diff의 문자 수를 기준으로 계산합니다.</div>
      </Field>

      <div className={styles.presets} aria-label="Diff 크기 프리셋">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className={settings.draftMaxDiffChars === value ? styles.selected : undefined}
            onClick={() => dispatch(draftMaxDiffCharsChanged(value))}
          >
            {formatNumber(value)}자
          </button>
        ))}
      </div>

      <div className={styles.status} data-status={settings.status} role="status" aria-live="polite">
        {settings.message}
      </div>
      <button
        className={styles.save}
        type="submit"
        disabled={
          settings.status === 'saving' || settings.draftMaxDiffChars < 1_000 || !validConfiguration
        }
      >
        {settings.status === 'saving'
          ? '저장 중...'
          : settings.setupComplete
            ? '설정 저장'
            : '설정 저장하고 시작'}
      </button>
    </form>
  );
};

export default SettingsTab;
