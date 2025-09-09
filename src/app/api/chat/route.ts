import { NextRequest, NextResponse } from 'next/server';
import { getHTTPMCPClient, MCPTool, MCPToolCall } from '@/lib/http-mcp-client';

// Helper function to initialize MCP connection
async function initializeMCP() {
  try {
    const mcpClient = await getHTTPMCPClient();
    
    if (!mcpClient.isClientConnected()) {
      const serverUrl = process.env.MCP_SERVER_URL;
      if (serverUrl) {
        console.log('Attempting to connect to HTTP MCP server:', serverUrl);
        await mcpClient.connect(serverUrl);
        return mcpClient;
      } else {
        console.log('No MCP server URL configured');
        return null;
      }
    }
    
    return mcpClient;
  } catch (error) {
    console.warn('Failed to initialize MCP connection:', error);
    return null;
  }
}

// Helper function to get available tools
async function getAvailableTools(mcpClient: any): Promise<string> {
  try {
    if (!mcpClient || !mcpClient.isClientConnected()) {
      return '';
    }
    
    const tools = await mcpClient.listTools();
    if (tools.length === 0) {
      return '';
    }
    
    const toolDescriptions = tools.map((tool: MCPTool) => 
      `- ${tool.name}: ${tool.description || 'No description available'}`
    ).join('\n');
    
    return `\n\nAvailable tools:\n${toolDescriptions}\n\nTo use a tool, include a request like "Please use the [tool_name] tool to [action]" in your response.`;
  } catch (error) {
    console.warn('Failed to get available tools:', error);
    return '';
  }
}

// Helper function to parse tool calls from AI response
function parseToolCalls(response: string): MCPToolCall[] {
  // More flexible regex that captures JSON objects even with nested braces
  const toolCallRegex = /\[TOOL_CALL\]\s*(\{(?:[^{}]|{[^{}]*})*\})/g;
  const toolCalls: MCPToolCall[] = [];
  let match;
  
  while ((match = toolCallRegex.exec(response)) !== null) {
    try {
      let jsonStr = match[1];
      
      // Try to fix common JSON issues
      if (!jsonStr.endsWith('}')) {
        // If missing closing brace, try to add it
        jsonStr += '}';
      }
      
      const toolCall = JSON.parse(jsonStr);
      if (toolCall.name && typeof toolCall.arguments === 'object') {
        toolCalls.push({
          name: toolCall.name,
          arguments: toolCall.arguments || {}
        });
      }
    } catch (error) {
      console.warn('Failed to parse tool call:', match[1], 'Error:', error);
      
      // Try a more lenient approach - extract name and create empty arguments
      try {
        const nameMatch = match[1].match(/"name":\s*"([^"]+)"/);
        if (nameMatch) {
          toolCalls.push({
            name: nameMatch[1],
            arguments: {}
          });
          console.log('Recovered tool call with empty arguments:', nameMatch[1]);
        }
      } catch (fallbackError) {
        console.warn('Could not recover tool call:', fallbackError);
      }
    }
  }
  
  return toolCalls;
}

export async function POST(request: NextRequest) {
  try {
    const { message, useTools = true } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Initialize MCP connection if tools are enabled
    let mcpClient = null;
    let toolsInfo = '';
    
    if (useTools) {
      try {
        mcpClient = await initializeMCP();
        if (mcpClient && mcpClient.isClientConnected()) {
          toolsInfo = await getAvailableTools(mcpClient);
          console.log('MCP tools available:', toolsInfo ? 'Yes' : 'No tools found');
        }
      } catch (error) {
        console.warn('MCP initialization failed, continuing without tools:', error);
        mcpClient = null;
      }
    }

    // Define system prompt with tool information
    const systemPrompt = `Your name is Mohssen. You are a Proximox Virtualization Engineer Working at DOIT Company with expertise in virtualization technologies, VM management, cluster administration, and infrastructure optimization. You help users with Proximox-related tasks, troubleshooting, and best practices. Always be helpful, professional, and provide accurate technical guidance. When you need to think through a problem or show your reasoning process, wrap your thoughts in <think></think> tags.${toolsInfo}${toolsInfo ? '\n\nWhen you need to use a tool, format your tool call EXACTLY as: [TOOL_CALL] {"name": "tool_name", "arguments": {"param": "value"}}\n\nIMPORTANT: Always include complete JSON with proper closing braces. If no arguments are needed, use empty object: {"name": "tool_name", "arguments": {}}' : ''}`;
    
    // Combine system prompt with user message
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nMohssen:`;

    // Call Ollama API using environment variable
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const ollamaResponse = await fetch(`${ollamaHost}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen3:32b',
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          max_tokens: 2048,
        }
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('Ollama API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from Ollama. Make sure Ollama is running and the gpt-oss:20b model is available.' },
        { status: 500 }
      );
    }

    const data = await ollamaResponse.json();
    let finalResponse = data.response || 'No response generated';
    const toolResults: any[] = [];

    // Process tool calls if MCP is available and tools were found in response
    if (mcpClient && mcpClient.isClientConnected()) {
      const toolCalls = parseToolCalls(finalResponse);
      
      for (const toolCall of toolCalls) {
        try {
          const result = await mcpClient.callTool(toolCall);
          toolResults.push({
            toolName: toolCall.name,
            arguments: toolCall.arguments,
            result: result.content,
            isError: result.isError
          });
          
          // Replace tool call in response with result
          const toolCallPattern = new RegExp(`\\[TOOL_CALL\\]\\s*\\{[^}]*"name":\\s*"${toolCall.name}"[^}]*\\}`, 'g');
          const resultText = result.content
            .filter(content => content.type === 'text')
            .map(content => content.text)
            .join('\n');
          
          finalResponse = finalResponse.replace(toolCallPattern, `\n[TOOL_RESULT: ${toolCall.name}]\n${resultText}\n`);
        } catch (error) {
          console.error(`Failed to execute tool ${toolCall.name}:`, error);
          toolResults.push({
            toolName: toolCall.name,
            arguments: toolCall.arguments,
            result: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
            isError: true
          });
        }
      }
    }
    
    return NextResponse.json({
      response: finalResponse,
      model: 'qwen3:32b',
      done: data.done,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      mcpConnected: mcpClient?.isClientConnected() || false
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: `Internal server error. Please check if Ollama is running on ${process.env.OLLAMA_HOST || 'localhost:11434'}` },
      { status: 500 }
    );
  }
}