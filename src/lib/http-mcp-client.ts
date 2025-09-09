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

class HTTPMCPClientManager {
  private serverUrl: string | null = null;
  private isConnected: boolean = false;
  
  async connect(serverUrl: string): Promise<void> {
    try {
      this.serverUrl = serverUrl;
      console.log('Connecting to MCP server via HTTP:', serverUrl);
      
      // Initialize the connection
      const response = await fetch(`${serverUrl}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize MCP connection: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('MCP initialization result:', result);
      
      this.isConnected = true;
      console.log('HTTP MCP Client connected successfully');
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      throw error;
    }
  }
  
  isClientConnected(): boolean {
    return this.isConnected;
  }
  
  async listTools(): Promise<MCPTool[]> {
    if (!this.isConnected || !this.serverUrl) {
      throw new Error('MCP client not connected');
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/list-tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(`MCP error: ${result.error.message}`);
      }
      
      return result.result?.tools || [];
    } catch (error) {
      console.error('Failed to list tools:', error);
      throw error;
    }
  }
  
  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.isConnected || !this.serverUrl) {
      throw new Error('MCP client not connected');
    }
    
    try {
      console.log('Calling tool via HTTP:', toolCall);
      
      const response = await fetch(`${this.serverUrl}/call-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toolCall.name,
          arguments: toolCall.arguments
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to call tool: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        return {
          content: [{ type: 'text', text: `Error: ${result.error.message}` }],
          isError: true
        };
      }
      
      return {
        content: result.result?.content || [{ type: 'text', text: 'No content returned' }],
        isError: false
      };
    } catch (error) {
      console.error('Failed to call tool:', error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true
      };
    }
  }
  
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.serverUrl = null;
    console.log('HTTP MCP Client disconnected');
  }
}

// Singleton instance
const httpMCPClient = new HTTPMCPClientManager();

export async function getHTTPMCPClient(): Promise<HTTPMCPClientManager> {
  return httpMCPClient;
}