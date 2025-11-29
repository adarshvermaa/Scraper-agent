import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load pages for code splitting
const FeedPage = lazy(() => import('./pages/Feed/FeedPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetail/JobDetailPage'));
const PlaygroundPage = lazy(() => import('./pages/Playground/PlaygroundPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/feed" replace />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="job/:id" element={<JobDetailPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
