import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import type { Message } from './types';

export function ChatRoom({ projectId }: { projectId: string }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          senderId: profile?.uid,
          senderName: profile?.displayName,
          text: newMessage,
        }),
      });
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white h-[calc(100vh-220px)] min-h-[500px] rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-500">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
          <Send className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Chat do Projeto</p>
          <p className="text-indigo-200 text-[10px] font-medium">Comunicação em tempo real</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-indigo-200 text-[10px] font-bold">AO VIVO</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Send className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
            <p className="text-xs">Seja o primeiro a falar!</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === profile?.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[72%] group`}>
                <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 px-1 ${isMe ? 'text-right text-indigo-400' : 'text-slate-400'}`}>
                  {msg.senderName}
                </p>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 flex-shrink-0 border border-indigo-100">
          {profile?.displayName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <input
          type="text"
          placeholder="Escreva sua mensagem..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="w-10 h-10 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center shadow-md shadow-indigo-100 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
