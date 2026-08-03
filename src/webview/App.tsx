/** @jsxImportSource react */
import React from 'react';
import NavigationTabs from './features/navigation/components/NavigationTabs.js';
import ReviewTab from './features/review/components/ReviewTab.js';
import SettingsTab from './features/settings/components/SettingsTab.js';
import { useAppSelector } from './app/hooks.js';
import styles from './App.module.css';

const App = (): React.JSX.Element => {
  const activeTab = useAppSelector((state) => state.navigation.activeTab);
  const setupComplete = useAppSelector((state) => state.settings.setupComplete);
  return (
    <main className={styles.reviewView}>
      <header className={styles.hero}>
        <div className={styles.eyebrow}>Local AI code review</div>
        <h1>Codivew</h1>
        <p className={styles.lead}>
          {setupComplete
            ? '변경사항을 선택하고 리뷰를 직접 시작하세요.'
            : '리뷰를 시작하기 전에 실행 환경을 설정하세요.'}
        </p>
      </header>
      {setupComplete && <NavigationTabs />}
      {!setupComplete || activeTab === 'settings' ? <SettingsTab /> : <ReviewTab />}
    </main>
  );
};

export default App;
