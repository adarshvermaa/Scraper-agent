import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { McpServer } from './mcp.server';

@Controller('mcp')
export class McpController {
    constructor(private readonly mcpServer: McpServer) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async handleRpc(@Body() request: any) {
        return this.mcpServer.processRequest(request);
    }
}
