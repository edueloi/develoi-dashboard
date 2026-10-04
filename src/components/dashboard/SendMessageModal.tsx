import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Headphones, Copy, Phone } from 'lucide-react';
import { Modal, Select, Textarea } from '../ui';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { WA_PATHS } from './WhatsappInbox';

export interface MessageTemplate { id: string; label: string; text: string }
export interface SendTarget { name: string; subtitle?: string; phone: string; leadId?: string; contactId?: string; source?: string; refId?: string }

// Envio de mensagem pronta para um contato: pela BiIA (ela continua o papo se a pessoa responder),
// iniciando uma conversa de atendimento (você conversa) ou abrindo o WhatsApp Web/aplicativo.
export const SendMessageModal: React.FC<{
  target: SendTarget; templates: MessageTemplate[]; initialId?: string; title?: string;
  onClose: () => void; onSent: (via: 'bot' | 'attendant' | 'link') => void;
}> = ({ target, templates, initialId, title = 'Enviar mensagem', onClose, onSent }) => {
  const { show: toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tplId, setTplId] = useState(initialId ?? templates[0]?.id ?? '');
  const [text, setText] = useState(templates.find(t => t.id === (initialId ?? templates[0]?.id))?.text ?? '');
  const [busy, setBusy] = useState<'bot' | 'attendant' | null>(null);
  const digits = target.phone.replace(/\D/g, '');

  const pick = (id: string) => { setTplId(id); setText(templates.find(t => t.id === id)?.text ?? ''); };

  const send = async (mode: 'bot' | 'attendant') => {
    if (!text.trim()) return toast('Escreva a mensagem', 'error');
    setBusy(mode);
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, phone: target.phone, name: target.name, message: text, leadId: target.leadId, contactId: target.contactId, source: target.source, refId: target.refId, attendantId: profile?.uid, attendantEmail: profile?.email, attendantName: profile?.displayName || 'Atendente' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar');
      toast(mode === 'bot' ? 'Mensagem enviada pela BiIA' : 'Conversa iniciada', 'success');
      onSent(mode);
      onClose();
      if (mode === 'attendant' && data.conversationId) navigate(`${WA_PATHS.active}?c=${data.conversationId}`);
    } catch (e: any) { toast(e.message, 'error'); }
    setBusy(null);
  };

  return (
    <Modal isOpen onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 dark:bg-green-900/20">
          <div className="w-10 h-10 rounded-xl bg-green-200 dark:bg-green-700 flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-green-700 dark:text-green-200" /></div>
          <div className="min-w-0">
            <p className="text-sm font-black truncate text-slate-900 dark:text-white">{target.name}</p>
            <p className="text-xs text-slate-500 truncate">{[target.subtitle, target.phone].filter(Boolean).join(' · ')}</p>
          </div>
        </div>

        <Select label="Mensagem pronta" value={tplId} onChange={e => pick(e.target.value)} placeholder="Escolha uma mensagem…"
          options={templates.map(t => ({ value: t.id, label: t.label }))} />
        <Textarea label="Mensagem (pode editar antes de enviar)" rows={8} value={text} onChange={e => setText(e.target.value)} />

        <div className="grid sm:grid-cols-2 gap-2">
          <button type="button" disabled={!!busy} onClick={() => send('bot')}
            className="text-left rounded-2xl p-3 text-white disabled:opacity-60" style={{ background: '#0D1F4E' }}>
            <div className="flex items-center gap-2 font-black text-sm"><Bot className="w-4 h-4" />{busy === 'bot' ? 'ENVIANDO…' : 'ENVIAR PELA BiIA'}</div>
            <p className="text-[11px] opacity-80 mt-1">Sai do WhatsApp da Develoi. Se a pessoa responder, a BiIA continua o papo e chama o time quando precisar.</p>
          </button>
          <button type="button" disabled={!!busy} onClick={() => send('attendant')}
            className="text-left rounded-2xl p-3 text-white disabled:opacity-60" style={{ background: '#C49A2A' }}>
            <div className="flex items-center gap-2 font-black text-sm"><Headphones className="w-4 h-4" />{busy === 'attendant' ? 'ABRINDO…' : 'INICIAR CONVERSA'}</div>
            <p className="text-[11px] opacity-90 mt-1">Abre a conversa em Em atendimento, no seu nome. As respostas dele chegam para você.</p>
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { navigator.clipboard.writeText(text); toast('Copiado!', 'success'); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"><Copy className="w-3.5 h-3.5" />Copiar</button>

        </div>
      </div>
    </Modal>
  );
};

// Preenche os marcadores das mensagens prontas ([Nome], [Estabelecimento], {nome}…)
export const fillPlaceholders = (body: string, v: { nome?: string; empresa?: string; produto?: string; atendente?: string }) =>
  body
    .replace(/\[(Nome|nome)\]|\{nome\}/g, v.nome ?? '')
    .replace(/\[(Estabelecimento|Empresa)\]|\{empresa\}/g, v.empresa ?? '')
    .replace(/\[Produto\]|\{produto\}/g, v.produto ?? 'nossos sistemas')
    .replace(/\[Seu Nome\]/g, v.atendente ?? 'Equipe Develoi');
