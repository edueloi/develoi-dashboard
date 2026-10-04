import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bot, Headphones, Check, X } from 'lucide-react';
import { Modal, Input, Textarea } from '../ui';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { WA_PATHS } from './WhatsappInbox';
import { fillPlaceholders } from './SendMessageModal';
import type { UContact } from './UnifiedContacts';
import type { ReadyMessage } from './types';

// Enviar uma mensagem pronta: escolha alguém da lista de contatos (prospecção, clientes, vendas, manuais) ou digite o telefone.
// O envio sai sempre pelo WhatsApp da Develoi (pela BiIA, ou abrindo uma conversa em atendimento no seu nome).
export const SendFromMessageModal: React.FC<{ message: ReadyMessage; onClose: () => void; onSent: () => void }> = ({ message, onClose, onSent }) => {
  const { show: toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'list' | 'phone'>('list');
  const [contacts, setContacts] = useState<UContact[]>([]);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<UContact | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState(message.body);
  const [busy, setBusy] = useState<'bot' | 'attendant' | null>(null);

  useEffect(() => {
    fetch(`/api/outreach/contacts?userId=${profile?.uid ?? ''}`).then(r => r.json()).then(d => setContacts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [profile?.uid]);

  const atendente = profile?.displayName?.split(' ')[0];
  const fill = (nome: string, empresa: string) => fillPlaceholders(message.body, { nome, empresa, atendente });

  // ao trocar de destinatário, a mensagem é preenchida com o nome dele
  useEffect(() => {
    if (picked) setText(fill(picked.name.split(' ')[0], picked.company ?? ''));
    else if (mode === 'phone') setText(fill(name.split(' ')[0], ''));
  }, [picked, mode]); // eslint-disable-line

  const list = useMemo(() => {
    const s = q.trim().toLowerCase(), dg = s.replace(/\D/g, '');
    return contacts.filter(c => !s || c.name.toLowerCase().includes(s) || (c.company ?? '').toLowerCase().includes(s) || (dg.length >= 3 && c.key.includes(dg))).slice(0, 40);
  }, [contacts, q]);

  const target = picked
    ? { phone: picked.phone, name: picked.company || picked.name, leadId: picked.refs.leadId, contactId: picked.refs.contactId, source: picked.refs.clientId ? 'client' : picked.refs.saleId ? 'sale' : undefined, refId: picked.refs.clientId || picked.refs.saleId }
    : { phone, name: name || undefined, leadId: undefined, contactId: undefined, source: undefined, refId: undefined };
  const ready = !!target.phone.replace(/\D/g, '').length && !!text.trim();

  const send = async (via: 'bot' | 'attendant') => {
    if (!ready) return toast(picked || phone ? 'Escreva a mensagem' : 'Escolha um contato ou digite o telefone', 'error');
    setBusy(via);
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: via, ...target, message: text, attendantId: profile?.uid, attendantEmail: profile?.email, attendantName: profile?.displayName || 'Atendente' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar');
      toast(via === 'bot' ? 'Mensagem enviada pela BiIA' : 'Conversa iniciada', 'success');
      onSent(); onClose();
      if (via === 'attendant' && data.conversationId) navigate(`${WA_PATHS.active}?c=${data.conversationId}`);
    } catch (e: any) { toast(e.message, 'error'); }
    setBusy(null);
  };

  const tab = (id: 'list' | 'phone', label: string) => (
    <button type="button" onClick={() => { setMode(id); if (id === 'phone') setPicked(null); }}
      className="flex-1 py-2 rounded-xl text-xs font-black border"
      style={mode === id ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E' } : { borderColor: 'rgba(100,116,139,0.3)', color: '#64748B' }}>{label}</button>
  );

  return (
    <Modal isOpen onClose={onClose} title={`Enviar: ${message.title}`} size="lg">
      <div className="space-y-4">
        <div>
          <div className="ds-label mb-1.5">Para quem?</div>
          <div className="flex gap-2 mb-2">{tab('list', 'DA MINHA LISTA')}{tab('phone', 'DIGITAR TELEFONE')}</div>

          {mode === 'list' ? (
            picked ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 dark:bg-green-900/20">
                <Check className="w-4 h-4 text-green-700 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black truncate text-slate-900 dark:text-white">{picked.company || picked.name}</p>
                  <p className="text-xs text-slate-500 truncate">{[picked.company ? picked.name : null, picked.phone].filter(Boolean).join(' · ')}</p>
                </div>
                <button type="button" onClick={() => setPicked(null)} className="p-1.5 rounded-lg hover:bg-green-100 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, empresa ou telefone…" className="pl-9" />
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5">
                  {list.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Nenhum contato encontrado.</p>}
                  {list.map(c => (
                    <button type="button" key={c.key} onClick={() => setPicked(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
                      <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{c.company || c.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {[c.company ? c.name : null, c.phone].filter(Boolean).join(' · ')} · {c.sources.map(s => s.label).join(', ')}{c.lastContactAt ? '' : ' · sem contato ainda'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Telefone com DDD" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(15) 99999-9999" />
              <Input label="Nome (opcional)" value={name} onChange={e => setName(e.target.value)} placeholder="Para preencher o [Nome]" onBlur={() => setText(fill(name.split(' ')[0], ''))} />
            </div>
          )}
        </div>

        <Textarea label="Mensagem (pode editar antes de enviar)" rows={9} value={text} onChange={e => setText(e.target.value)} />

        <div className="grid sm:grid-cols-2 gap-2">
          <button type="button" disabled={!!busy} onClick={() => send('bot')} className="text-left rounded-2xl p-3 text-white disabled:opacity-60" style={{ background: '#0D1F4E' }}>
            <div className="flex items-center gap-2 font-black text-sm"><Bot className="w-4 h-4" />{busy === 'bot' ? 'ENVIANDO…' : 'ENVIAR PELA BiIA'}</div>
            <p className="text-[11px] opacity-80 mt-1">Se a pessoa responder, a BiIA continua o papo e chama o time quando precisar.</p>
          </button>
          <button type="button" disabled={!!busy} onClick={() => send('attendant')} className="text-left rounded-2xl p-3 text-white disabled:opacity-60" style={{ background: '#C49A2A' }}>
            <div className="flex items-center gap-2 font-black text-sm"><Headphones className="w-4 h-4" />{busy === 'attendant' ? 'ABRINDO…' : 'INICIAR CONVERSA'}</div>
            <p className="text-[11px] opacity-90 mt-1">Abre em Em atendimento, no seu nome, e as respostas chegam para você.</p>
          </button>
        </div>
      </div>
    </Modal>
  );
};
