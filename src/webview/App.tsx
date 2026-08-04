/** @jsxImportSource react */
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import NavigationTabs from './features/navigation/components/NavigationTabs.js';
import ReviewPage from './pages/ReviewPage.js';
import ResultsPage from './pages/ResultsPage.js';
import SettingsPage from './pages/SettingsPage.js';
import { useAppSelector } from './app/hooks.js';
import './global.css';
import { t } from '../shared/localization.js';

const App = (): React.JSX.Element => {
  const { locale, setupComplete } = useAppSelector((state) => state.settings);
  const hasResult = useAppSelector((state) => state.review.result !== undefined);
  return (
    <main className="app" lang={locale}>
      <header className="appHero">
        <div className="appEyebrow">{t('app.eyebrow')}</div>
        <h1>Codivew</h1>
        <p className="appLead">{setupComplete ? t('app.ready') : t('app.setup')}</p>
      </header>
      {setupComplete && <NavigationTabs />}
      <Routes>
        <Route
          path="/review"
          element={setupComplete ? <ReviewPage /> : <Navigate to="/settings" replace />}
        />
        <Route
          path="/results"
          element={
            !setupComplete ? (
              <Navigate to="/settings" replace />
            ) : hasResult ? (
              <ResultsPage />
            ) : (
              <Navigate to="/review" replace />
            )
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={<Navigate to={setupComplete ? '/review' : '/settings'} replace />}
        />
      </Routes>
    </main>
  );
};

export default App;
