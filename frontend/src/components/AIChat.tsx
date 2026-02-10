import React, { useState, useRef } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { API } = useAuth();
  const sessionId = useRef<string>(`session-${Date.now()}`);

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/ai/chat`, {
        message: input,
        session_id: sessionId.current
      });
      
      const aiMessage: Message = { role: 'assistant', content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          data-testid="open-chat-button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 p-4 bg-[#7C3AED] text-white rounded-full shadow-2xl hover:-translate-y-1 hover:shadow-3xl transition-all duration-300 z-[9999]"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div
          data-testid="chat-widget"
          className="fixed bottom-20 right-6 w-96 h-[600px] bg-white border border-[#0F2F24]/10 rounded-2xl shadow-2xl flex flex-col z-[9999]"
        >
          <div className="flex justify-between items-center p-4 border-b border-[#0F2F24]/10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <button
              data-testid="close-chat-button"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-[#7C3AED] mx-auto mb-3" />
                <p className="text-[#52525B]">Ask me anything about your school!</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                data-testid={`chat-message-${idx}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-[#0F2F24] text-white'
                      : 'bg-[#F5F5F0] text-[#1A1A1A]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#F5F5F0] px-4 py-3 rounded-2xl">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-[#0F2F24]/10">
            <div className="flex gap-2">
              <input
                data-testid="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-[#0F2F24]/20 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] bg-[#F5F5F0]"
                disabled={loading}
              />
              <button
                data-testid="send-message-button"
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 bg-[#7C3AED] text-white rounded-full hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChat;
