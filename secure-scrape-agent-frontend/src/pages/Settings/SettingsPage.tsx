import McpSettings from '@/components/settings/McpSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <McpSettings />

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Configure API tokens and service endpoints. Tokens are encrypted and stored locally.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Backend API URL
            </label>
            <input
              type="text"
              className="input"
              placeholder="http://localhost:3000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              WebSocket URL
            </label>
            <input
              type="text"
              className="input"
              placeholder="ws://localhost:3000/ws"
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Rate Limits</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Scraping Concurrency
            </label>
            <input type="number" className="input" defaultValue="5" min="1" max="20" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Ingestion Batch Size
            </label>
            <input type="number" className="input" defaultValue="64" min="1" max="256" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">
          Save Changes
        </button>
      </div>
    </div>
  );
}
