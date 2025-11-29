import axios from 'axios';

export interface McpTool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface McpResponse<T = any> {
    jsonrpc: '2.0';
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: string | number | null;
}

export interface McpConfig {
    baseUrl: string;
    mode: 'proxy' | 'direct';
    apiKey?: string;
    defaultProvider?: 'openai' | 'anthropic' | 'gemini';
}

class McpClient {
    private config: McpConfig;

    constructor() {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
        this.config = {
            baseUrl: apiUrl,
            mode: 'proxy',
            defaultProvider: 'gemini',
        };

        // Load saved config
        const savedConfig = localStorage.getItem('mcp_config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            } catch (e) {
                console.error('Failed to load MCP config', e);
            }
        }
    }

    updateConfig(config: Partial<McpConfig>) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('mcp_config', JSON.stringify(this.config));
    }

    getConfig(): McpConfig {
        return { ...this.config };
    }

    async callTool<T = any>(method: string, params: any = {}): Promise<T> {
        if (this.config.mode === 'proxy') {
            return this.callViaProxy<T>(method, params);
        } else {
            // Direct mode not fully implemented yet, falling back to proxy or error
            // In a real direct implementation, this would use WebSocket or similar
            console.warn('Direct mode not implemented, falling back to proxy');
            return this.callViaProxy<T>(method, params);
        }
    }

    private async callViaProxy<T>(method: string, params: any): Promise<T> {
        const payload = {
            jsonrpc: '2.0',
            method,
            params,
            id: Date.now(),
        };

        try {
            // Ensure we don't have double slashes if baseUrl ends with /
            const baseUrl = this.config.baseUrl.replace(/\/$/, '');
            // If baseUrl includes /api, we might need to adjust. 
            // The backend controller is at /mcp. 
            // If VITE_API_URL is http://localhost:3004, then we want http://localhost:3004/mcp
            // If VITE_API_URL is http://localhost:3004/api, we might want http://localhost:3004/mcp or http://localhost:3004/api/mcp
            // Let's assume the controller is at root level /mcp based on the controller definition @Controller('mcp')
            // But usually NestJS has a global prefix. Let's check main.ts later. 
            // For now, I'll assume it's relative to the base URL.

            const url = `${baseUrl}/mcp`;

            const response = await axios.post<McpResponse<T>>(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {})
                }
            });

            if (response.data.error) {
                throw new Error(`MCP Error: ${response.data.error.message}`);
            }

            return response.data.result as T;
        } catch (error: any) {
            console.error('MCP Call Failed:', error);
            throw new Error(error.message || 'Failed to call MCP tool');
        }
    }

    async listTools(): Promise<McpTool[]> {
        return this.callTool<McpTool[]>('list_tools');
    }
}

export const mcpClient = new McpClient();
export default mcpClient;
