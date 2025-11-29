import React, { useState, useEffect } from 'react';
import mcpClient, { McpConfig, McpTool } from '@/services/mcp-client';

export default function McpSettings() {
  const [config, setConfig] = useState<McpConfig>(mcpClient.getConfig());
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tools, setTools] = useState<McpTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<string>('{}');
  const [toolResult, setToolResult] = useState<string>('');
  const [callingTool, setCallingTool] = useState(false);

  useEffect(() => {
    setConfig(mcpClient.getConfig());
  }, []);

  const handleSave = () => {
    mcpClient.updateConfig(config);
    setMessage('Settings saved successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleTestConnection = async () => {
    setStatus('testing');
    setMessage('');
    setTools([]);
    
    try {
      // Save config first to ensure we test with latest values
      mcpClient.updateConfig(config);
      
      const toolsList = await mcpClient.listTools();
      setTools(toolsList);
      setStatus('connected');
      setMessage(`Successfully connected! Found ${toolsList.length} tools.`);
    } catch (error: any) {
      setStatus('error');
      setMessage(`Connection failed: ${error.message}`);
    }
  };

  const handleCallTool = async () => {
    if (!selectedTool) return;
    
    setCallingTool(true);
    setToolResult('');
    
    try {
      let params = {};
      try {
        params = JSON.parse(toolParams);
      } catch (e) {
        throw new Error('Invalid JSON parameters');
      }

      const result = await mcpClient.callTool(selectedTool, params);
      setToolResult(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setToolResult(`Error: ${error.message}`);
    } finally {
      setCallingTool(false);
    }
  };

  const getSelectedToolSchema = () => {
    const tool = tools.find(t => t.name === selectedTool);
    return tool ? JSON.stringify(tool.parameters, null, 2) : '';
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">MCP Server Configuration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Configure connection to the Model Context Protocol (MCP) server.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Server URL
            </label>
            <input
              type="text"
              className="input w-full p-2 border rounded"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="http://localhost:3004"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Connection Mode
            </label>
            <select 
              className="input w-full p-2 border rounded"
              value={config.mode}
              onChange={(e) => setConfig({ ...config, mode: e.target.value as 'proxy' | 'direct' })}
            >
              <option value="proxy">Proxy (via Backend API)</option>
              <option value="direct">Direct (WebSocket - Experimental)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Default AI Provider
            </label>
            <select 
              className="input w-full p-2 border rounded"
              value={config.defaultProvider || 'openai'}
              onChange={(e) => setConfig({ ...config, defaultProvider: e.target.value as any })}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              API Key (Optional)
            </label>
            <input
              type="password"
              className="input w-full p-2 border rounded"
              value={config.apiKey || ''}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Secret Token"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Settings
              </button>
              <button 
                onClick={handleTestConnection}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Test Connection
              </button>
            </div>
            
            {message && (
              <span className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>

      {status === 'connected' && (
        <div className="card p-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Tools Playground</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Tool</label>
              <select 
                className="input w-full p-2 border rounded mb-4"
                value={selectedTool}
                onChange={(e) => {
                  const newTool = e.target.value;
                  setSelectedTool(newTool);
                  
                  // Pre-fill params based on tool definition and config
                  const toolDef = tools.find(t => t.name === newTool);
                  let initialParams: any = {};
                  
                  if (toolDef?.parameters?.properties?.provider) {
                    initialParams.provider = config.defaultProvider || 'openai';
                  }
                  
                  // Add other required fields as empty strings to help user
                  if (toolDef?.parameters?.required) {
                    toolDef.parameters.required.forEach(req => {
                      if (!initialParams[req]) initialParams[req] = "";
                    });
                  }

                  setToolParams(JSON.stringify(initialParams, null, 2));
                  setToolResult('');
                }}
              >
                <option value="">-- Select a tool --</option>
                {tools.map(tool => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name} - {tool.description}
                  </option>
                ))}
              </select>

              {selectedTool && (
                <>
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Parameters Schema</span>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                      {getSelectedToolSchema()}
                    </pre>
                  </div>

                  <label className="block text-sm font-medium mb-2 mt-4">Parameters (JSON)</label>
                  <textarea
                    className="input w-full p-2 border rounded h-32 font-mono text-sm"
                    value={toolParams}
                    onChange={(e) => setToolParams(e.target.value)}
                  />
                  
                  <button 
                    onClick={handleCallTool}
                    disabled={callingTool}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {callingTool ? 'Running...' : 'Call Tool'}
                  </button>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Result</label>
              <div className="bg-gray-900 text-green-400 p-4 rounded h-full min-h-[300px] overflow-auto font-mono text-sm whitespace-pre-wrap">
                {toolResult || '// Result will appear here...'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
