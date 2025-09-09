"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
    Trash2,
    ChevronDown,
    ChevronUp,
    Wrench,
    CheckCircle,
    AlertCircle,
    Mic,
    MicOff,
    Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";
import { useSpeechToText, SpeechToTextResult } from "@/hooks/use-speech-to-text";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div 
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

interface ParsedContent {
    thinking?: string;
    response: string;
}

interface MCPToolResult {
    toolName: string;
    arguments: any;
    result: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        url?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}

interface Message {
    id: string;
    content: string;
    parsedContent?: ParsedContent;
    toolResults?: MCPToolResult[];
    mcpConnected?: boolean;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export function AnimatedAIChat() {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
    const [collapsedThinking, setCollapsedThinking] = useState<Record<string, boolean>>({});
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Speech-to-text functionality
    const {
        isRecording,
        isProcessing,
        error: sttError,
        toggleRecording
    } = useSpeechToText({
        onTranscription: (result: SpeechToTextResult) => {
            setValue(prev => prev + (prev ? ' ' : '') + result.transcription);
            adjustHeight();
        },
        onError: (errorMessage: string) => {
            setError(`Speech recognition error: ${errorMessage}`);
        }
    });

    // Parse content to extract thinking sections
    const parseContent = (content: string): ParsedContent => {
        const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi;
        const matches = [...content.matchAll(thinkingRegex)];
        
        if (matches.length === 0) {
            return { response: content };
        }

        let thinking = '';
        let response = content;

        // Extract all thinking sections
        matches.forEach(match => {
            thinking += (thinking ? '\n\n' : '') + match[1].trim();
            response = response.replace(match[0], '').trim();
        });

        return {
            thinking: thinking || undefined,
            response: response || content
        };
    };

    const commandSuggestions: CommandSuggestion[] = [
        { 
            icon: <MonitorIcon className="w-4 h-4" />, 
            label: "Create VM", 
            description: "Generate a VM By One Click", 
            prefix: "/create-vm" 
        },
        { 
            icon: <MonitorIcon className="w-4 h-4" />, 
            label: "Create Cluster", 
            description: "Create Cluster By One Click", 
            prefix: "/create-cluster" 
        },
        { 
            icon: <MonitorIcon className="w-4 h-4" />, 
            label: "Shutdown VM", 
            description: "Shutdown VM By One Click", 
            prefix: "/shutdown-vm" 
        },
        { 
            icon: <Sparkles className="w-4 h-4" />, 
            label: "Start VM", 
            description: "Start VM By One Click", 
            prefix: "/start" 
        }
    ];

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        };
        
        // Use requestAnimationFrame to avoid blocking the UI
        const timeoutId = setTimeout(() => {
            requestAnimationFrame(scrollToBottom);
        }, 50);
        
        return () => clearTimeout(timeoutId);
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = async () => {
        if (!value.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: value.trim(),
            role: 'user',
            timestamp: new Date()
        };

        // Add user message to chat
        setMessages(prev => [...prev, userMessage]);
        setValue("");
        adjustHeight(true);
        setIsTyping(true);
        setError(null);
        setIsThinkingCollapsed(false); // Reset thinking state

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const parsedContent = parseContent(data.response);
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.response,
                parsedContent,
                toolResults: data.toolResults,
                mcpConnected: data.mcpConnected,
                role: 'assistant',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setError(error instanceof Error ? error.message : 'Failed to send message');
        } finally {
            setIsTyping(false);
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);
    };

    const clearConversation = () => {
        setMessages([]);
        setError(null);
        setCollapsedThinking({});
    };

    const toggleThinking = React.useCallback((messageId: string) => {
        setCollapsedThinking(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
    }, []);

    // Component for rendering MCP tool results
    const MCPToolResultsSection = React.memo(({ messageId, toolResults }: { messageId: string; toolResults: MCPToolResult[] }) => {
        const isCollapsed = collapsedThinking[`${messageId}-tools`] ?? true; // Collapsed by default
        
        return (
            <div className="mt-3 border-t border-border/50 pt-3">
                <button
                    onClick={() => toggleThinking(`${messageId}-tools`)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full"
                    style={{ transition: 'color 0.15s ease' }}
                >
                    <div className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        {isCollapsed ? 
                            <ChevronDown className="w-3 h-3" /> : 
                            <ChevronUp className="w-3 h-3" />
                        }
                        <span className="font-medium">MCP Tools Used ({toolResults.length})</span>
                    </div>
                </button>
                
                {!isCollapsed && (
                    <div className="mt-2 space-y-2">
                        {toolResults.map((toolResult, index) => (
                            <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/30">
                                <div className="flex items-center gap-2 mb-2">
                                    {toolResult.isError ? 
                                        <AlertCircle className="w-4 h-4 text-destructive" /> :
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    }
                                    <span className="font-mono text-xs font-medium">
                                        {toolResult.toolName}
                                    </span>
                                    {toolResult.isError && (
                                        <span className="text-xs text-destructive">Error</span>
                                    )}
                                </div>
                                
                                {/* Tool Arguments */}
                                <div className="mb-2">
                                    <div className="text-xs text-muted-foreground/80 mb-1">Arguments:</div>
                                    <pre className="text-xs bg-background/50 p-2 rounded border text-muted-foreground font-mono">
                                        {JSON.stringify(toolResult.arguments, null, 2)}
                                    </pre>
                                </div>
                                
                                {/* Tool Results */}
                                <div>
                                    <div className="text-xs text-muted-foreground/80 mb-1">Result:</div>
                                    <div className="text-xs bg-background/50 p-2 rounded border">
                                        {toolResult.result.map((content, contentIndex) => (
                                            <div key={contentIndex} className="mb-1 last:mb-0">
                                                {content.type === 'text' && (
                                                    <pre className="whitespace-pre-wrap font-mono text-muted-foreground">
                                                        {content.text}
                                                    </pre>
                                                )}
                                                {content.type === 'image' && content.data && (
                                                    <img 
                                                        src={`data:${content.mimeType || 'image/png'};base64,${content.data}`} 
                                                        alt="Tool result" 
                                                        className="max-w-full h-auto rounded"
                                                    />
                                                )}
                                                {content.type === 'resource' && content.url && (
                                                    <a 
                                                        href={content.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:underline"
                                                    >
                                                        {content.url}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    });

    // Memoized component for rendering thinking sections
    const ThinkingSection = React.memo(({ messageId, thinking }: { messageId: string; thinking: string }) => {
        const isCollapsed = collapsedThinking[messageId] ?? true; // Collapsed by default
        
        return (
            <div className="mt-3 border-t border-border/50 pt-3">
                <button
                    onClick={() => toggleThinking(messageId)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full"
                    style={{ transition: 'color 0.15s ease' }}
                >
                    <div className="flex items-center gap-1">
                        {isCollapsed ? 
                            <ChevronDown className="w-3 h-3" /> : 
                            <ChevronUp className="w-3 h-3" />
                        }
                        <span className="font-medium">AI's reasoning</span>
                    </div>
                </button>
                
                {!isCollapsed && (
                    <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                            {thinking}
                        </pre>
                    </div>
                )}
            </div>
        );
    });

    return (
        <div className="min-h-screen flex flex-col w-full items-center justify-center bg-transparent text-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>
            <div className="w-full max-w-2xl mx-auto relative">
                <motion.div 
                    className="relative z-10 space-y-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {/* Chat Messages */}
                    {messages.length > 0 && (
                        <div className="w-full max-h-96 overflow-y-auto space-y-4 mb-8 relative scroll-smooth">
                            <button
                                onClick={clearConversation}
                                className="absolute top-0 right-0 z-10 p-2 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm rounded-lg border border-border transition-colors"
                                title="Clear conversation"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex w-full",
                                        message.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[80%] p-4 rounded-2xl",
                                        message.role === 'user' 
                                            ? "bg-primary text-primary-foreground ml-12" 
                                            : "bg-card border border-border mr-12"
                                    )}>
                                        <div className="flex items-start gap-3">
                                            {message.role === 'assistant' && (
                                                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-xs font-bold text-white">M</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                {/* Show thinking section for assistant messages - ALWAYS ON TOP */}
                                                {message.role === 'assistant' && message.parsedContent?.thinking && (
                                                    <ThinkingSection 
                                                        messageId={message.id} 
                                                        thinking={message.parsedContent.thinking} 
                                                    />
                                                )}

                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {message.role === 'assistant' && message.parsedContent 
                                                        ? message.parsedContent.response 
                                                        : message.content}
                                                </p>
                                                
                                                {/* Show MCP tool results for assistant messages */}
                                                {message.role === 'assistant' && message.toolResults && message.toolResults.length > 0 && (
                                                    <MCPToolResultsSection 
                                                        messageId={message.id} 
                                                        toolResults={message.toolResults} 
                                                    />
                                                )}
                                                
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className={cn(
                                                        "text-xs opacity-60",
                                                        message.role === 'user' ? "text-primary-foreground/60" : "text-muted-foreground"
                                                    )}>
                                                        {message.timestamp.toLocaleTimeString()}
                                                    </p>
                                                    
                                                    {/* MCP Connection Status */}
                                                    {message.role === 'assistant' && message.mcpConnected && (
                                                        <div className="flex items-center gap-1 text-xs text-green-500">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span>MCP</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {messages.length === 0 && (
                        <div className="text-center space-y-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="inline-block"
                            >
                                <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground/90 to-foreground/40 pb-1">
                                    Hello Iam DOIT AI Assistant Your Trusty Agent.
                                </h1>
                                <motion.div 
                                    className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "100%", opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                />
                            </motion.div>
                            <motion.p 
                                className="text-sm text-muted-foreground"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                How can I help today? Type a command or ask a question
                            </motion.p>
                        </div>
                    )}

                    {/* Error Display */}
                    {(error || sttError) && (
                        <motion.div 
                            className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <p className="text-sm text-destructive">{error || sttError}</p>
                            <button 
                                onClick={() => setError(null)}
                                className="text-xs text-destructive/80 hover:text-destructive mt-1 underline"
                            >
                                Dismiss
                            </button>
                        </motion.div>
                    )}

                    {/* Recording Indicator */}
                    {isRecording && (
                        <motion.div 
                            className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex items-center gap-2">
                                <motion.div
                                    className="w-3 h-3 bg-red-500 rounded-full"
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                <p className="text-sm text-red-600">Recording... Click the microphone again to stop</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Processing Indicator */}
                    {isProcessing && (
                        <motion.div 
                            className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex items-center gap-2">
                                <LoaderIcon className="w-4 h-4 animate-spin text-blue-600" />
                                <p className="text-sm text-blue-600">Processing speech...</p>
                            </div>
                        </motion.div>
                    )}

                    <motion.div 
                        className="relative backdrop-blur-2xl bg-card/50 rounded-2xl border border-border shadow-2xl"
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div 
                                    ref={commandPaletteRef}
                                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-popover/95 rounded-lg z-[9999] shadow-lg border border-border overflow-hidden"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="py-1 bg-popover">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                    activeSuggestion === index 
                                                        ? "bg-accent text-accent-foreground" 
                                                        : "text-muted-foreground hover:bg-accent/50"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                                                    {suggestion.icon}
                                                </div>
                                                <div className="font-medium">{suggestion.label}</div>
                                                <div className="text-muted-foreground/60 text-xs ml-1">
                                                    {suggestion.prefix}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder={messages.length > 0 ? "Continue the conversation..." : "Ask AI a question..."}
                                containerClassName="w-full"
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    "text-foreground text-sm",
                                    "focus:outline-none",
                                    "placeholder:text-muted-foreground",
                                    "min-h-[60px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                                showRing={false}
                            />
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div 
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs bg-muted py-1.5 px-3 rounded-lg text-muted-foreground"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file}</span>
                                            <button 
                                                onClick={() => removeAttachment(index)}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 border-t border-border flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <motion.button
                                    type="button"
                                    onClick={handleAttachFile}
                                    whileTap={{ scale: 0.94 }}
                                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors relative group"
                                >
                                    <Paperclip className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-accent/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    data-command-button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommandPalette(prev => !prev);
                                    }}
                                    whileTap={{ scale: 0.94 }}
                                    className={cn(
                                        "p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors relative group",
                                        showCommandPalette && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Command className="w-4 h-4" />
                                    <motion.span
                                        className="absolute inset-0 bg-accent/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={toggleRecording}
                                    whileTap={{ scale: 0.94 }}
                                    disabled={isProcessing}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors relative group",
                                        isRecording 
                                            ? "bg-red-500 text-white hover:bg-red-600" 
                                            : "text-muted-foreground hover:text-foreground",
                                        isProcessing && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isRecording ? (
                                        <MicOff className="w-4 h-4" />
                                    ) : isProcessing ? (
                                        <LoaderIcon className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Mic className="w-4 h-4" />
                                    )}
                                    <motion.span
                                        className="absolute inset-0 bg-accent/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        layoutId="button-highlight"
                                    />
                                </motion.button>
                            </div>
                            
                            <motion.button
                                type="button"
                                onClick={handleSendMessage}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isTyping || !value.trim()}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    "flex items-center gap-2",
                                    value.trim()
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {isTyping ? (
                                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                ) : (
                                    <SendIcon className="w-4 h-4" />
                                )}
                                <span>Send</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-accent rounded-lg text-sm text-muted-foreground hover:text-accent-foreground transition-all relative group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {suggestion.icon}
                                <span>{suggestion.label}</span>
                                <motion.div
                                    className="absolute inset-0 border border-border rounded-lg"
                                    initial={false}
                                    animate={{
                                        opacity: [0, 1],
                                        scale: [0.98, 1],
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                    }}
                                />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {isTyping && (
                    <motion.div 
                        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 backdrop-blur-2xl bg-card/90 rounded-2xl shadow-lg border border-border overflow-hidden z-[9998]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <button
                            onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                        >
                            <div className="w-8 h-7 rounded-full bg-violet-500 flex items-center justify-center text-center">
                                <span className="text-xs font-medium text-white mb-0.5">M</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>AI is thinking</span>
                                {!isThinkingCollapsed && <TypingDots />}
                            </div>
                            <div className="ml-auto">
                                {isThinkingCollapsed ? 
                                    <ChevronUp className="w-4 h-lk4 text-muted-foreground" /> : 
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                }
                            </div>
                        </button>
                        
                        <AnimatePresence>
                            {!isThinkingCollapsed && (
                                <motion.div 
                                    className="px-4 pb-3 border-t border-border"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="text-xs text-muted-foreground/80 mt-2">
                                        Processing your request using Qwen3:14B model...
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-foreground/90 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}


const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}