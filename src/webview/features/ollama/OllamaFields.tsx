/** @jsxImportSource react */
import React, { useEffect } from 'react';
import { vscode } from '../../app/vscode-api.js';
import { useAppDispatch, useAppSelector } from '../../app/hooks.js';
import { Field } from '../../shared/FieldComponent.js';
import { validHttpUrl } from '../../shared/url.js';
import { modelChanged, modelsInvalidated, modelsRequested, urlChanged } from './ollamaSlice.js';

let nextRequestId = 0;

export function OllamaFields({ disabled }: { disabled: boolean }): React.JSX.Element {
  const dispatch = useAppDispatch();
  const ollama = useAppSelector((state) => state.ollama);
  const hasModels = ollama.status === 'loaded' && ollama.models.length > 0;

  useEffect(() => {
    const requestId = ++nextRequestId;
    const validUrl = validHttpUrl(ollama.url);
    if (validUrl === undefined) {
      dispatch(
        modelsInvalidated({
          requestId,
          message: '올바른 HTTP 또는 HTTPS Ollama URL을 입력하세요.',
        }),
      );
      return;
    }

    dispatch(modelsRequested(requestId));
    const timeout = window.setTimeout(() => {
      vscode.postMessage({ type: 'loadModels', ollamaUrl: validUrl, requestId });
    }, 400);
    return (): void => window.clearTimeout(timeout);
  }, [dispatch, ollama.url]);

  return (
    <>
      <Field label="Ollama URL" htmlFor="ollama-url">
        <input
          id="ollama-url"
          type="url"
          value={ollama.url}
          placeholder="http://localhost:11434"
          disabled={disabled}
          onChange={(event) => dispatch(urlChanged(event.target.value))}
          required
        />
        <div className="hint">입력한 주소는 Codivew 사용자 설정에 저장됩니다.</div>
      </Field>

      <Field label="모델" htmlFor="model">
        <select
          id="model"
          value={ollama.model}
          disabled={disabled || !hasModels}
          onChange={(event) => dispatch(modelChanged(event.target.value))}
          required
        >
          {!hasModels && (
            <option value="">
              {ollama.status === 'loading' ? '모델 조회 중...' : '선택 가능한 모델이 없습니다'}
            </option>
          )}
          {ollama.models.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className="hint" data-status={ollama.status}>
          {ollama.message}
        </div>
      </Field>
    </>
  );
}
