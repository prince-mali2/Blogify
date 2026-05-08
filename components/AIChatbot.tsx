'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I am Blogify AI assistant. I can help you with writing tips, blog ideas, SEO advice, and anything about the platform. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!messagesEndRef.current || !chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Only auto-scroll if user is near bottom or it's the first few messages
    if (isNearBottom || messages.length <= 1) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process that. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (!isOpen) setUnread(prev => prev + 1);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    'Give me blog ideas',
    'How to improve SEO?',
    'Writing tips',
    'How to go live?',
  ];

  return (
    <>
      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .chat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 9999; }
        .chat-bubble-btn {
          width: 58px; height: 58px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(16,185,129,0.4);
          animation: chatPulse 2s infinite;
          transition: transform 0.2s;
          position: relative;
        }
        .chat-bubble-btn:hover { transform: scale(1.08); }
        .chat-window {
          position: absolute; bottom: 70px; right: 0;
          width: 360px; height: 520px;
          background: #0d1117;
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: chatSlideUp 0.3s ease forwards;
        }
        .chat-header {
          background: linear-gradient(135deg, #0d2818, #0a1f2e);
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px;
        }
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .msg-user {
          align-self: flex-end; max-width: 80%;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          color: #fff; padding: 10px 14px; border-radius: 16px 16px 4px 16px;
          font-size: 13px; line-height: 1.5;
        }
        .msg-ai {
          align-self: flex-start; max-width: 85%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          padding: 10px 14px; border-radius: 16px 16px 16px 4px;
          font-size: 13px; line-height: 1.6;
        }
        .typing-indicator {
          display: flex; gap: 4px; align-items: center; padding: 4px 0;
        }
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #10b981;
        }
        .chat-input-area {
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; gap: 8px; align-items: center;
        }
        .chat-input {
          flex: 1; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 10px 14px;
          color: #fff; font-size: 13px; outline: none;
          font-family: inherit;
        }
        .chat-input:focus {
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        .chat-input::placeholder { color: rgba(255,255,255,0.25); }
        .send-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .quick-btns {
          display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px;
        }
        .quick-btn {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 20px; padding: 5px 12px;
          color: #10b981; font-size: 11px; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .quick-btn:hover {
          background: rgba(16,185,129,0.2);
          border-color: rgba(16,185,129,0.4);
        }
        @media (max-width: 400px) {
          .chat-window { width: 320px; }
        }
      `}</style>

      <div className="chat-widget">
        {/* Chat Window */}
        {isOpen && (
          <div className="chat-window">
            {/* Header */}
            <div className="chat-header">
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', flexShrink: 0,
              }}>✦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                  Blogify AI
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Online — ready to help
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px', padding: '4px' }}
              >×</button>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="chat-messages"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.role === 'user' ? 'msg-user' : 'msg-ai'}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="msg-ai">
                  <div className="typing-indicator">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="typing-dot"
                        style={{ animation: `typingDot 1s ease infinite ${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="quick-btns">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    className="quick-btn"
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chat-input-area">
              <input
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={loading}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          className="chat-bubble-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="Chat with AI"
        >
          {isOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          )}
          {/* Unread badge */}
          {unread > 0 && !isOpen && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: '#ef4444', color: '#fff',
              fontSize: '11px', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unread}
            </div>
          )}
        </button>
      </div>
    </>
  );
}
