import React, { useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Input, Button, EmptyState } from '../ui';
import type { Message } from './types';
import { cn } from '../../lib/utils';

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
    <div className="bg-white h-[calc(100vh-220px)] min-h-[500px] rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-base tracking-tight">Hub de Comunicação</p>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Sincronização em tempo real</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-white text-[10px] font-black tracking-widest uppercase">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/40 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <EmptyState 
              icon={MessageSquare}
              title="Sem diálogos por aqui"
              description="A comunicação é a chave para o sucesso do projeto. Comece o debate!"
              className="border-none bg-transparent"
            />
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === profile?.uid;
          return (
            <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className="max-w-[75%] group">
                <div className={cn(
                  "flex items-center gap-2 mb-1.5 px-1",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    isMe ? "text-indigo-600" : "text-slate-400"
                  )}>
                    {msg.senderName}
                  </span>
                </div>
                <div className={cn(
                  "px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm transition-all hover:shadow-md",
                  isMe
                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none"
                    : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={sendMessage} className="flex gap-4 items-center max-w-5xl mx-auto">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-sm font-black text-indigo-600 flex-shrink-0 border border-indigo-100 shadow-sm">
            {profile?.displayName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          
          <div className="flex-1">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escreva algo brilhante..."
              wrapperClassName="w-full"
              className="py-3 px-6 h-12"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e as any);
                }
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="h-12 w-12 p-0 flex items-center justify-center rounded-2xl shadow-xl shadow-indigo-100"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
