/** @jsxImportSource react */
import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import NavigationTabs from './features/navigation/components/NavigationTabs.js';
import ReviewPage from './pages/ReviewPage.js';
import ResultsPage from './pages/ResultsPage.js';
import SettingsPage from './pages/SettingsPage.js';
import { useAppSelector } from './app/hooks.js';
import './global.css';

const App = (): React.JSX.Element => {
  const locale = useAppSelector((state) => state.settings.locale);
  return (
    <main className="app" lang={locale}>
      <NavigationTabs />
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route element={<SetupGuard />}>
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/review" replace />} />
        </Route>
      </Routes>
    </main>
  );
};

const SetupGuard = (): React.JSX.Element => {
  const setupComplete = useAppSelector((state) => state.settings.setupComplete);
  return setupComplete ? <Outlet /> : <Navigate to="/settings" replace />;
};

export default App;
