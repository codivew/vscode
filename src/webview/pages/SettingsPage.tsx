/** @jsxImportSource react */
import React, { type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks.js';
import { vscode } from '../app/vscode-api.js';
import Field from '../shared/components/Field.js';
import { formatNumber } from '../shared/format.js';
import { validHttpUrl } from '../shared/url.js';
import ModelFields from '../features/model/components/ModelFields.js';
import { workspaceChanged } from '../features/review/reviewSlice.js';
import {
  draftLanguageChanged,
  draftMaxDiffCharsChanged,
  settingsSaveRequested,
} from '../features/settings/settingsSlice.js';
import styles from './SettingsPage.module.css';
import { t } from '../../shared/localization.js';

const PRESETS = [60_000, 120_000, 240_000];

const SettingsPage = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const review = useAppSelector((state) => state.review);
  const model = useAppSelector((state) => state.model);
  const hasWorkspace = review.workspaces.length > 0 && review.workspaceIndex >= 0;
  const hasModels = model.status === 'loaded' && model.models.length > 0;
  const validConfiguration =
    hasWorkspace &&
    validHttpUrl(model.url) !== undefined &&
    model.model.trim().length > 0 &&
    (settings.isSetupComplete || hasModels);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    dispatch(settingsSaveRequested());
    vscode.postMessage({
      type: 'saveSettings',
      workspaceIndex: review.workspaceIndex,
      apiUrl: model.url,
      apiKey: model.apiKey,
      model: model.model,
      maxDiffChars: settings.draftMaxDiffChars,
      language: settings.draftLanguage,
    });
  };

  return (
    <form className={styles.card} onSubmit={submit}>
      <div className={styles.heading}>
        <span className={styles.icon} aria-hidden="true">
          AI
        </span>
        <div>
          <h2>{settings.isSetupComplete ? t('settings.title') : t('settings.getStarted')}</h2>
          <p>{t('settings.description')}</p>
        </div>
      </div>

      <Field label={t('settings.workspace')} htmlFor="workspace" className={styles.field}>
        <select
          id="workspace"
          disabled={!hasWorkspace || settings.status === 'saving'}
          value={review.workspaceIndex}
          onChange={(event) => dispatch(workspaceChanged(Number(event.target.value)))}
        >
          {!hasWorkspace && <option value={-1}>{t('settings.noOpenWorkspace')}</option>}
          {review.workspaces.map((workspace) => (
            <option key={workspace.index} value={workspace.index}>
              {workspace.name} · {workspace.path}
            </option>
          ))}
        </select>
        <div className={styles.hint}>{t('settings.workspaceHint')}</div>
      </Field>

      <Field label={t('settings.language')} htmlFor="language" className={styles.field}>
        <select
          id="language"
          disabled={settings.status === 'saving'}
          value={settings.draftLanguage}
          onChange={(event) =>
            dispatch(draftLanguageChanged(event.target.value as 'auto' | 'en' | 'ko-KR'))
          }
        >
          <option value="auto">{t('settings.languageAuto')}</option>
          <option value="en">{t('settings.languageEnglish')}</option>
          <option value="ko-KR">{t('settings.languageKorean')}</option>
        </select>
        <div className={styles.hint}>{t('settings.languageHint')}</div>
      </Field>

      <ModelFields disabled={settings.status === 'saving'} fieldClassName={styles.field} />

      <div className={styles.divider} />

      <div className={styles.sectionTitle}>
        <h3>{t('settings.sizeTitle')}</h3>
        <p>{t('settings.sizeDescription')}</p>
      </div>

      <Field label={t('settings.maxDiff')} htmlFor="max-diff-chars" className={styles.field}>
        <input
          id="max-diff-chars"
          type="number"
          min={1_000}
          step={1_000}
          value={settings.draftMaxDiffChars}
          onChange={(event) => dispatch(draftMaxDiffCharsChanged(Number(event.target.value)))}
          required
        />
        <div className={styles.hint}>{t('settings.maxDiffHint')}</div>
      </Field>

      <div className={styles.presets} aria-label={t('settings.presets')}>
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className={settings.draftMaxDiffChars === value ? styles.selected : undefined}
            onClick={() => dispatch(draftMaxDiffCharsChanged(value))}
          >
            {t('targets.characters', { count: formatNumber(value) })}
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
          ? t('settings.saving')
          : settings.isSetupComplete
            ? t('settings.save')
            : t('settings.saveAndStart')}
      </button>
    </form>
  );
};

export default SettingsPage;
