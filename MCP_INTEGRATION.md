# MCP Integration Guide

This project integrates with a Model Context Protocol (MCP) server to provide advanced AI capabilities.

## Overview

The integration consists of:
1.  **Backend MCP Server**: A TCP-based server running on port 3005 (configurable) that handles JSON-RPC requests.
2.  **Backend Proxy**: An HTTP endpoint (`POST /mcp`) in the NestJS backend that forwards requests to the MCP logic.
3.  **Frontend Client**: A TypeScript client (`McpClient`) that communicates with the backend proxy.
4.  **Settings UI**: A configuration page to manage connection settings and test tools.

## Configuration

### Backend
The MCP server configuration is managed in `secure-scrape-agent-backend/.env`:
```env
MCP_PORT=3005
MCP_HOST=0.0.0.0
```

### Frontend
The frontend connects to the backend API. Ensure `VITE_API_URL` is set correctly in `secure-scrape-agent-frontend/.env` (or `.env.local`).

## Usage

1.  Navigate to the **Settings** page in the frontend.
2.  Locate the **MCP Server Configuration** section.
3.  Ensure the **Server URL** points to your backend API (e.g., `http://localhost:3004`).
4.  Select **Proxy** mode.
5.  Click **Test Connection**.
6.  If successful, the **Tools Playground** will appear.

## Tools Playground

The Tools Playground allows you to interactively test MCP tools:
1.  Select a tool from the dropdown (e.g., `search_jobs`).
2.  View the required parameters schema.
3.  Enter parameters in JSON format.
4.  Click **Call Tool**.
5.  View the result in the output console.

## AI Providers

The MCP server supports multiple AI providers for summarization and chat:
- **OpenAI** (default)
- **Anthropic** (Claude)
- **Gemini** (Google)

You can specify the provider when calling tools like `summarize_job`.

## Adding New Tools

To add new tools to the MCP server:
1.  Open `secure-scrape-agent-backend/src/modules/mcp/mcp.server.ts`.
2.  Add a new method for the tool logic.
3.  Add the tool definition to the `listTools()` method.
4.  Add a case to the `processRequest()` switch statement.

## Direct Connection (Experimental)

The frontend supports a "Direct" mode intended for WebSocket connections. Currently, the backend exposes MCP via TCP and HTTP Proxy. To use Direct mode, a WebSocket-to-TCP bridge or a native WebSocket implementation in the backend is required.
