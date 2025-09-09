import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: any;
}

export interface MCPToolCall {
  name: string;
  arguments: any;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    url?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

class MCPClientManager {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;
  
  async connect(serverCommand: string, serverArgs: string[] = []): Promise<void> {
    try {
      console.log('Starting MCP server with:', { command: serverCommand, args: serverArgs });
      
      // Create transport that will spawn and manage the process
      this.transport = new StdioClientTransport({
        command: serverCommand,
        args: serverArgs,
        stderr: 'pipe',
        cwd: process.cwd()
      });

      // Create the client
      this.client = new Client(
        {
          name: 'mohssen-chat',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      // Set up error handling for the transport
      this.transport.onerror = (error: Error) => {
        console.error('MCP transport error:', error);
        this.isConnected = false;
      };

      this.transport.onclose = () => {
        console.log('MCP transport closed');
        this.isConnected = false;
      };

      // Connect the client (this will automatically start the transport)
      console.log('Connecting MCP client...');
      
      const connectPromise = this.client.connect(this.transport);
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('MCP connection timeout')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);

      // Log stderr if available (after connection is established)
      const stderrStream = this.transport.stderr;
      if (stderrStream) {
        stderrStream.on('data', (data) => {
          console.log('MCP server stderr:', data.toString());
        });
      }
      this.isConnected = true;
      
      console.log('MCP Client connected successfully');
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
    } catch (error) {
      console.error('Error during MCP disconnect:', error);
    } finally {
      this.isConnected = false;
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.listTools();
      return response.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));
    } catch (error) {
      console.error('Failed to list tools:', error);
      throw error;
    }
  }

  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.callTool({
        name: toolCall.name,
        arguments: toolCall.arguments
      });

      return {
        content: response.content,
        isError: response.isError
      };
    } catch (error) {
      console.error('Failed to call tool:', error);
      return {
        content: [{
          type: 'text',
          text: `Error calling tool ${toolCall.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Global MCP client instance
let mcpClient: MCPClientManager | null = null;

export async function getMCPClient(): Promise<MCPClientManager> {
  if (!mcpClient) {
    mcpClient = new MCPClientManager();
  }
  return mcpClient;
}

export async function connectToMCPServer(serverCommand: string, serverArgs: string[] = []): Promise<void> {
  const client = await getMCPClient();
  await client.connect(serverCommand, serverArgs);
}

export async function disconnectMCPServer(): Promise<void> {
  if (mcpClient) {
    await mcpClient.disconnect();
  }
}

export { MCPClientManager };