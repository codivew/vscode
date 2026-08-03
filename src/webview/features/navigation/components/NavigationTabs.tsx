/** @jsxImportSource react */
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks.js';
import { tabChanged, type NavigationTab } from '../navigationSlice.js';
import styles from './NavigationTabs.module.css';

const TABS: Array<{ id: NavigationTab; label: string }> = [
  { id: 'review', label: '리뷰' },
  { id: 'settings', label: '설정' },
];

const NavigationTabs = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.navigation.activeTab);
  return (
    <nav className={styles.tabs} role="tablist" aria-label="Codivew 메뉴">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? styles.active : undefined}
          onClick={() => dispatch(tabChanged(tab.id))}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default NavigationTabs;
