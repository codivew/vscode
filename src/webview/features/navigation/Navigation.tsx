/** @jsxImportSource react */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks.js';
import styles from './Navigation.module.css';
import { t } from '../../../shared/localization.js';
import { selectIsSetupComplete } from '../settings/settingsSlice.js';
import { selectHasResult } from '../review/reviewSlice.js';

const NavigationTabs = (): React.JSX.Element | null => {
  const { pathname } = useLocation();
  const setupComplete = useAppSelector(selectIsSetupComplete);
  const hasResult = useAppSelector(selectHasResult);

  if (!setupComplete) return null;

  const tabs = [
    { path: '/review', label: t('nav.review'), disabled: false },
    { path: '/results', label: t('nav.results'), disabled: !hasResult },
    { path: '/settings', label: t('nav.settings'), disabled: false },
  ];
  return (
    <nav className={styles.tabs} role="tablist" aria-label={t('nav.menu')}>
      {tabs.map((tab) =>
        tab.disabled ? (
          <span
            key={tab.path}
            role="tab"
            aria-selected="false"
            aria-disabled="true"
            className={styles.disabled}
          >
            {tab.label}
          </span>
        ) : (
          <NavLink
            key={tab.path}
            to={tab.path}
            role="tab"
            aria-selected={pathname === tab.path}
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            {tab.label}
          </NavLink>
        ),
      )}
    </nav>
  );
};

export default NavigationTabs;
