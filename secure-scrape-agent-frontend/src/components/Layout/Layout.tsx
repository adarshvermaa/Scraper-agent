import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import socketService from '@/services/websocket';

const navItems = [
  { path: '/feed', label: 'Feed', icon: '📰' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
  { path: '/playground', label: 'Playground', icon: '🧪' },
];

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    // Connect WebSocket on mount
    socketService.connect().catch(console.error);

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🔍</div>
              <h1 className="text-xl font-bold">Secure Scrape Agent</h1>
            </div>

            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-dark-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 Secure Scrape Agent. Built with ❤️ and AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
