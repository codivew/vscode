/** @jsxImportSource react */
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks.js';
import { vscode } from '../../../app/vscode-api.js';
import Field from '../../../shared/components/Field.js';
import { validHttpUrl } from '../../../shared/url.js';
import { modelChanged, modelsInvalidated, modelsRequested, urlChanged } from '../ollamaSlice.js';
import styles from './OllamaFields.module.css';
import { t } from '../../../../shared/localization.js';

let nextRequestId = 0;

const OllamaFields = ({
  disabled,
  fieldClassName,
}: {
  disabled: boolean;
  fieldClassName?: string;
}): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const ollama = useAppSelector((state) => state.ollama);
  const settings = useAppSelector((state) => state.settings);
  const hasModels = ollama.status === 'loaded' && ollama.models.length > 0;

  useEffect(() => {
    const requestId = ++nextRequestId;
    const validUrl = validHttpUrl(ollama.url);
    if (validUrl === undefined) {
      dispatch(
        modelsInvalidated({
          requestId,
          message: t('ollama.invalidUrl'),
        }),
      );
      return;
    }

    dispatch(modelsRequested(requestId));
    const timeout = window.setTimeout(() => {
      vscode.postMessage({
        type: 'loadModels',
        ollamaUrl: validUrl,
        authenticationType: settings.authenticationType,
        apiKey: settings.apiKey,
        username: settings.username,
        password: settings.password,
        requestId,
      });
    }, 400);
    return (): void => window.clearTimeout(timeout);
  }, [
    dispatch,
    ollama.url,
    settings.apiKey,
    settings.authenticationType,
    settings.password,
    settings.username,
  ]);

  return (
    <>
      <Field label="API URL" htmlFor="ollama-url" className={fieldClassName}>
        <input
          id="ollama-url"
          type="url"
          value={ollama.url}
          placeholder="http://localhost:11434/v1"
          disabled={disabled}
          onChange={(event) => dispatch(urlChanged(event.target.value))}
          required
        />
        <div className={styles.hint}>{t('ollama.urlHint')}</div>
      </Field>

      <Field label={t('ollama.model')} htmlFor="model" className={fieldClassName}>
        <select
          id="model"
          value={ollama.model}
          disabled={disabled || !hasModels}
          onChange={(event) => dispatch(modelChanged(event.target.value))}
          required
        >
          {!hasModels && (
            <option value="">
              {ollama.status === 'loading' ? t('ollama.loading') : t('ollama.none')}
            </option>
          )}
          {ollama.models.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className={styles.hint} data-status={ollama.status}>
          {ollama.message}
        </div>
      </Field>
    </>
  );
};

export default OllamaFields;
