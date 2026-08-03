/** @jsxImportSource react */
import React from 'react';
import NavigationTabs from './features/navigation/components/NavigationTabs.js';
import ReviewTab from './features/review/components/ReviewTab.js';
import SettingsTab from './features/settings/components/SettingsTab.js';
import { useAppSelector } from './app/hooks.js';
import styles from './App.module.css';
import { t } from '../localization.js';

const App = (): React.JSX.Element => {
  const activeTab = useAppSelector((state) => state.navigation.activeTab);
  const setupComplete = useAppSelector((state) => state.settings.setupComplete);
  return (
    <main className={styles.reviewView}>
      <header className={styles.hero}>
        <div className={styles.eyebrow}>{t('app.eyebrow')}</div>
        <h1>Codivew</h1>
        <p className={styles.lead}>{setupComplete ? t('app.ready') : t('app.setup')}</p>
      </header>
      {setupComplete && <NavigationTabs />}
      {!setupComplete || activeTab === 'settings' ? <SettingsTab /> : <ReviewTab />}
    </main>
  );
};

export default App;
