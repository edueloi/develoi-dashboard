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
    <div className="bg-white h-[calc(100vh-150px)] min-h-[360px] rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-900">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-base tracking-tight">Hub de Comunicação</p>
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Sincronização em tempo real</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-white text-[9px] font-black tracking-wider uppercase">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40 custom-scrollbar">
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
                  "px-3 py-2 rounded-xl text-xs leading-relaxed shadow-sm transition-all hover:shadow-md",
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
      <div className="p-3 bg-white border-t border-slate-100">
        <form onSubmit={sendMessage} className="flex gap-2 items-center max-w-5xl mx-auto">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 flex-shrink-0 border border-indigo-100">
            {profile?.displayName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          
          <div className="flex-1">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escreva algo brilhante..."
              wrapperClassName="w-full"
              className="py-2 px-3 h-9 text-xs"
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
            className="h-9 w-9 min-w-0 p-0 flex items-center justify-center rounded-lg shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
