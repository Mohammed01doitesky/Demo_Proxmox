export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  description?: string;
  enabled: boolean;
}

// Default MCP server configurations
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'filesystem',
    command: 'bun',
    args: ['--bun', 'mcp-server-filesystem', '/path/to/allowed/directory'],
    description: 'File system operations server',
    enabled: false
  },
  {
    name: 'git',
    command: 'bun',
    args: ['--bun', 'mcp-server-git'],
    description: 'Git operations server',
    enabled: false
  },
  {
    name: 'web-search',
    command: 'bun',
    args: ['--bun', 'mcp-server-brave-search'],
    description: 'Web search capabilities',
    enabled: false
  },
  {
    name: 'sqlite',
    command: 'bun',
    args: ['--bun', 'mcp-server-sqlite', '/path/to/database.db'],
    description: 'SQLite database operations',
    enabled: false
  },
  {
    name: 'custom-local',
    command: 'node',
    args: ['./your-custom-mcp-server.js'],
    description: 'Custom local MCP server',
    enabled: true
  }
];

export function getMCPServerConfig(serverName: string): MCPServerConfig | undefined {
  return DEFAULT_MCP_SERVERS.find(server => server.name === serverName);
}

export function getEnabledMCPServers(): MCPServerConfig[] {
  return DEFAULT_MCP_SERVERS.filter(server => server.enabled);
}

// Environment-based configuration
export function getMCPServerFromEnv(): MCPServerConfig | null {
  const command = process.env.MCP_SERVER_COMMAND;
  const args = process.env.MCP_SERVER_ARGS;
  
  if (!command) {
    return null;
  }

  // Clean up the args string and split properly
  const cleanArgs = args ? args.trim().split(/\s+/).filter(arg => arg.length > 0) : [];

  return {
    name: 'env-server',
    command: command.trim(),
    args: cleanArgs,
    description: 'MCP server from environment variables',
    enabled: true
  };
}