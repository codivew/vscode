/** @jsxImportSource react */
import React, { type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks.js';
import { vscode } from '../../app/vscode-api.js';
import { Field } from '../../shared/field.js';
import { formatNumber } from '../../shared/format.js';
import { draftMaxDiffCharsChanged, settingsSaveRequested } from './settings-slice.js';

const PRESETS = [60_000, 120_000, 240_000];

export function SettingsTab(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    dispatch(settingsSaveRequested());
    vscode.postMessage({ type: 'saveSettings', maxDiffChars: settings.draftMaxDiffChars });
  };

  return (
    <form className="card settings-card" onSubmit={submit}>
      <div className="settings-heading">
        <span className="settings-icon" aria-hidden="true">
          Aa
        </span>
        <div>
          <h2>리뷰 크기 제한</h2>
          <p>큰 Diff로 인한 컨텍스트 초과와 응답 지연을 방지합니다.</p>
        </div>
      </div>

      <Field label="최대 Diff 문자 수" htmlFor="max-diff-chars">
        <input
          id="max-diff-chars"
          type="number"
          min={1_000}
          step={1_000}
          value={settings.draftMaxDiffChars}
          onChange={(event) => dispatch(draftMaxDiffCharsChanged(Number(event.target.value)))}
          required
        />
        <div className="hint">필터링이 끝난 Diff의 문자 수를 기준으로 계산합니다.</div>
      </Field>

      <div className="presets" aria-label="Diff 크기 프리셋">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className={settings.draftMaxDiffChars === value ? 'selected' : ''}
            onClick={() => dispatch(draftMaxDiffCharsChanged(value))}
          >
            {formatNumber(value)}자
          </button>
        ))}
      </div>

      <div
        className="settings-status"
        data-status={settings.status}
        role="status"
        aria-live="polite"
      >
        {settings.message}
      </div>
      <button
        className="settings-save"
        type="submit"
        disabled={settings.status === 'saving' || settings.draftMaxDiffChars < 1_000}
      >
        {settings.status === 'saving' ? '저장 중...' : '설정 저장'}
      </button>
    </form>
  );
}
