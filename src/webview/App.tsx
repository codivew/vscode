/** @jsxImportSource react */
import React from 'react';
import NavigationTabs from './features/navigation/NavigationTabs.js';
import ReviewTab from './features/review/ReviewTab.js';
import SettingsTab from './features/settings/SettingsTab.js';
import { useAppSelector } from './app/hooks.js';

const App = (): React.JSX.Element => {
  const activeTab = useAppSelector((state) => state.navigation.activeTab);
  return (
    <main className="review-view">
      <header className="hero">
        <div className="eyebrow">Local AI code review</div>
        <h1>Codivew</h1>
        <p className="lead">변경사항을 선택하고 리뷰를 직접 시작하세요.</p>
      </header>
      <NavigationTabs />
      {activeTab === 'review' ? <ReviewTab /> : <SettingsTab />}
    </main>
  );
};

export default App;
