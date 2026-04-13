import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import './styles/Chatbot.css';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', text: 'Chào bạn! Mình là Trợ lý ảo của Lam Trà 🧋 Bạn muốn uống gì hôm nay?' }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    const maxHistoryLength = 6;

    // Format history for Groq API
    const contextMessages = [...messages, userMessage].slice(-maxHistoryLength)?.map(m => ({
      role: m.role,
      content: m.text
    }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Xin lỗi, hiện tại tôi đang bận pha trà, bạn đợi chút nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <h3>Lam Trà Assistant</h3>
              <p>🟢 Trực tuyến</p>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}><FiX size={20} /></button>
          </div>

          <div className="chatbot-messages">
            {messages?.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role === 'assistant' ? 'model' : 'user'}`}>
                <div className="chat-bubble-text">{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message model">
                <div className="chat-bubble-text typing">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}>
              <FiSend size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Chat Bubble trigger */}
      {!isOpen && (
        <div className="chatbot-bubble" onClick={() => setIsOpen(true)}>
          <FiMessageSquare size={28} />
        </div>
      )}
    </div>
  );
};

export default Chatbot;
