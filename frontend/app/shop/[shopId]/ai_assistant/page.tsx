"use client";

import { useState, useRef, useEffect, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { aiAssistantApi, AiChatMessage } from "../../../utils/api/aiAssistant";
import { Bot, Send, Trash2, Sparkles, Loader2 } from "lucide-react";

export default function AiAssistantPage({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = params.shopId;
  const { getToken } = useAuth();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your **Onbillo AI Shop Assistant** powered by Groq. I can help you with:\n\n- **Shop details** – get the shop's name, address, tax settings, etc.\n- **Inventory** – view product list, prices, stock levels, and low-stock alerts.\n- **Bills** – fetch recent sales bills and their totals.\n- **Analytics summary** – quick overview of revenue, bills, product count, and low-stock status.\n- **Staff** – list staff members and pending join requests.\n- **Custom SQL** – run read-only queries for more advanced reports (e.g., date ranges, top-N items).\n\nAsk me anything about your shop!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AiChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const token = await getToken();
      const history = messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0);

      const result = await aiAssistantApi.sendMessage(
        shopId,
        userMessage.content,
        history,
        token
      );

      const assistantMessage: AiChatMessage = {
        role: "assistant",
        content: result.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: AiChatMessage = {
        role: "assistant",
        content: `⚠️ Sorry, I encountered an error: ${error?.message || "Unknown error"}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you with your shop today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Render simple markdown-like formatting for assistant messages
  const renderMessageContent = (content: string, role: "user" | "assistant") => {
    if (role === "user") {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    }

    // Basic markdown: bold (**text**), bullet points (- or *), line breaks
    const lines = content.split("\n");
    return (
      <div className="text-sm space-y-1.5">
        {lines.map((line, i) => {
          if (!line) return <br key={i} />;

          // Bold text formatting
          const formatted = line.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          // Bullet point
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5 shrink-0">•</span>
                <span>{formatted.slice(1)}</span>
              </div>
            );
          }

          return <p key={i}>{formatted}</p>;
        })}
      </div>
    );
  };

  const suggestedPrompts = [
    "Show me low stock items",
    "Summarize today's sales",
    "How many products do I have?",
    "Show shop analytics",
  ];

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">AI Shop Assistant</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-mute font-medium">Powered by Groq · OpenAI Agents SDK</span>
            </div>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-mute hover:text-error hover:bg-error-soft border border-hairline rounded-lg transition-all duration-150 cursor-pointer outline-none"
          title="Clear chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === "assistant"
                  ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primary"
                  : "bg-canvas border border-hairline text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-3.5 h-3.5" />
              ) : (
                "U"
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-canvas border border-hairline text-foreground rounded-tl-sm"
                  : "bg-brand-primary text-white rounded-tr-sm"
              }`}
            >
              {renderMessageContent(msg.content, msg.role)}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-canvas border border-hairline rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-brand-primary animate-spin" />
                <span className="text-xs text-mute">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (only shown when minimal conversation) */}
      {messages.length <= 1 && !isLoading && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setInput(prompt);
                textareaRef.current?.focus();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/15 rounded-full transition-all duration-150 cursor-pointer outline-none"
            >
              <Sparkles className="w-3 h-3" />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="shrink-0 bg-canvas border border-hairline rounded-2xl p-3 shadow-level-2">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your inventory, sales, staff..."
            rows={1}
            className="flex-1 text-sm text-foreground placeholder-mute bg-transparent resize-none outline-none leading-relaxed max-h-40"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer outline-none"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-mute mt-2">
          Press <kbd className="bg-canvas-soft border border-hairline px-1 rounded text-[10px]">Enter</kbd> to send, <kbd className="bg-canvas-soft border border-hairline px-1 rounded text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
