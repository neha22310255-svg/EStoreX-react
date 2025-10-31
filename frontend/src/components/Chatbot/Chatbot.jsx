import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import chatbotConfig from '../../config/chatbot-config.json';

const STORAGE_KEYS = {
  CONVERSATION: 'chatbot_conversation',
};

const QUICK_CHIPS = [
  "Where's my order?",
  "Discount codes?",
  "Returns policy?",
];

// Messages Area Component
const MessagesArea = ({ messages, showWelcome, isLoading, messagesEndRef, onQuickChip }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {showWelcome && messages.length === 0 && (
      <div className="space-y-3">
        <div className="text-gray-300 text-sm">
          👋 Hello! How can I help you today?
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onQuickChip(chip)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full text-sm transition"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    )}

    {messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            message.role === 'user'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-700 text-gray-100'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    ))}

    {isLoading && (
      <div className="flex justify-start">
        <div className="bg-gray-700 text-gray-100 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )}

    <div ref={messagesEndRef} />
  </div>
);

// Input Area Component
const InputArea = ({ inputValue, setInputValue, onSend, isLoading, inputRef }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-700">
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
          className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-pink-500 focus:outline-none resize-none text-sm"
          rows={1}
          style={{ minHeight: '40px', maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
        />
        <button
          onClick={() => onSend()}
          disabled={isLoading || !inputValue.trim()}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// Header Component
const ChatHeader = ({ onResetConversation, onClose }) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-700">
    <h3 className="text-lg font-semibold text-white">Support Assistant</h3>
    <div className="flex items-center gap-2">
      <button
        onClick={onResetConversation}
        className="p-2 text-gray-400 hover:text-white transition"
        aria-label="Reset conversation"
        title="Reset conversation"
      >
        <RotateCcw size={20} />
      </button>
      <button
        onClick={onClose}
        className="p-2 text-gray-400 hover:text-white transition"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  </div>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load settings from config file and environment variables
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    setSettings({
      ...chatbotConfig,
      apiKey: apiKey,
    });
  }, []);

  // Load conversation from storage on mount
  useEffect(() => {
    if (!settings) return;

    const storage = settings.storageMode === 'localStorage' ? localStorage : sessionStorage;
    const savedConversation = storage.getItem(STORAGE_KEYS.CONVERSATION);
    
    if (savedConversation) {
      try {
        const conv = JSON.parse(savedConversation);
        setMessages(conv.messages || []);
        setShowWelcome(false);
      } catch (e) {
        console.error('Failed to load conversation:', e);
      }
    }
  }, [settings]);

  // Save conversation when messages change
  useEffect(() => {
    if (!settings) return;

    if (settings.storageMode === 'memory') {
      return; // Don't save if memory mode
    }

    const storage = settings.storageMode === 'localStorage' ? localStorage : sessionStorage;
    
    if (messages.length > 0) {
      const conversation = { messages };
      storage.setItem(STORAGE_KEYS.CONVERSATION, JSON.stringify(conversation));
    } else {
      storage.removeItem(STORAGE_KEYS.CONVERSATION);
    }
  }, [messages, settings]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleQuickChip = (text) => {
    setInputValue(text);
    setShowWelcome(false);
    setTimeout(() => {
      handleSend(text);
    }, 100);
  };

  const handleSend = async (text = null) => {
    if (!settings) return;

    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    if (!settings.apiKey) {
      alert('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setShowWelcome(false);
    setIsLoading(true);

    try {
      const messagesToSend = [
        { role: 'system', content: settings.systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageText },
      ];

      if (settings.stream) {
        await handleStreamingResponse(messagesToSend);
      } else {
        await handleRegularResponse(messagesToSend);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegularResponse = async (messagesToSend) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messagesToSend,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to get response');
    }

    const data = await response.json();
    const assistantMessage = {
      id: Date.now(),
      role: 'assistant',
      content: data.choices[0]?.message?.content || 'No response received.',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleStreamingResponse = async (messagesToSend) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messagesToSend,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to get response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const assistantMessage = {
      id: Date.now(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + delta,
                };
                return updated;
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  };

  const handleResetConversation = () => {
    setMessages([]);
    setShowWelcome(true);
    
    if (settings?.storageMode === 'sessionStorage') {
      sessionStorage.removeItem(STORAGE_KEYS.CONVERSATION);
    } else if (settings?.storageMode === 'localStorage') {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION);
    }
  };

  if (!settings) {
    return null; // Don't render until settings are loaded
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-pink-600 hover:bg-pink-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <>
          {/* Mobile: Full-width bottom sheet */}
          <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-gray-900 rounded-t-lg shadow-2xl flex flex-col border-t border-gray-700" style={{ height: '65vh' }}>
            <ChatHeader onResetConversation={handleResetConversation} onClose={() => setIsOpen(false)} />
            <MessagesArea
              messages={messages}
              showWelcome={showWelcome}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
              onQuickChip={handleQuickChip}
            />
            <InputArea
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSend={handleSend}
              isLoading={isLoading}
              inputRef={inputRef}
            />
          </div>

          {/* Desktop: Regular panel */}
          <div className="hidden md:flex md:fixed bottom-6 right-6 z-40 w-[400px] h-[65vh] max-h-[700px] bg-gray-900 rounded-lg shadow-2xl flex-col border border-gray-700">
            <ChatHeader onResetConversation={handleResetConversation} onClose={() => setIsOpen(false)} />
            <MessagesArea
              messages={messages}
              showWelcome={showWelcome}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
              onQuickChip={handleQuickChip}
            />
            <InputArea
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSend={handleSend}
              isLoading={isLoading}
              inputRef={inputRef}
            />
          </div>
        </>
      )}
    </>
  );
};

export default Chatbot;
