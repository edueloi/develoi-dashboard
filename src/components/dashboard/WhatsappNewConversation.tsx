import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, History, MessageSquareText, Phone } from 'lucide-react';
import { Button, Input, Select, Textarea } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { WA_PATHS, isRealPhone, formatPhone } from './WhatsappInbox';
import type { ReadyMessage } from './types';

interface Sector { id: string; name: string }
interface Recent { id: string; clientPhone: string; clientName?: string | null }

// Tela "Iniciar conversa": o atendente digita o número, escreve a primeira mensagem e a conversa já nasce em atendimento
export function WhatsappNewConversation() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const text = isDark ? '#fff' : '#0D1F4E';

  const [form, setForm] = useState({ phone: '', name: '', sectorId: '', message: '' });
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [recents, setRecents] = useState<Recent[]>([]);
  const [templates, setTemplates] = useState<ReadyMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bot/sectors').then(r => r.json()).then(d => setSectors(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/admin/bot/conversations?status=closed,active').then(r => r.json()).then((rows: Recent[]) => {
      // contatos recentes sem repetir, só com telefone de verdade
      const seen = new Set<string>();
      setRecents((Array.isArray(rows) ? rows : []).filter(r => isRealPhone(r.clientPhone) && !seen.has(r.clientPhone) && seen.add(r.clientPhone)).slice(0, 10));
    }).catch(() => {});
    fetch(`/api/ready-messages?userId=${profile?.uid ?? ''}`).then(r => r.json()).then(d => setTemplates(Array.isArray(d) ? d : [])).catch(() => {});
  }, [profile?.uid]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/admin/bot/conversations/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sectorId: form.sectorId || null, attendantId: profile?.uid, attendantName: profile?.displayName || 'Atendente' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao iniciar a conversa');
      toast('Conversa iniciada', 'success');
      navigate(`${WA_PATHS.active}?c=${data.id}`);
    } catch (err: any) { toast(err.message, 'error'); }
    setSending(false);
  };

  return (
    <div className="space-y-5 dashboard-density">
      <div>
        <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>Iniciar conversa</h2>
        <p className="text-xs text-slate-400 mt-0.5">Fale com um cliente pelo WhatsApp digitando o número. As respostas dele aparecem em <b>Em atendimento</b>.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        <form onSubmit={submit} className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Telefone com DDD" required autoFocus type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(15) 99999-9999" />
            <Input label="Nome (opcional)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Como o cliente se chama" />
          </div>
          {sectors.length > 0 && (
            <Select label="Setor (opcional)" value={form.sectorId} onChange={e => setForm({ ...form, sectorId: e.target.value })}
              options={[{ value: '', label: 'Sem setor' }, ...sectors.map(s => ({ value: s.id, label: s.name }))]} />
          )}

          {templates.length > 0 && (
            <Select label="Usar uma mensagem pronta (opcional)" value="" onChange={e => { const t = templates.find(x => x.id === e.target.value); if (t) setForm(f => ({ ...f, message: t.body })); }}
              options={[{ value: '', label: 'Escolher…' }, ...templates.map(t => ({ value: t.id, label: t.title }))]} />
          )}

          <Textarea label="Primeira mensagem" required rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Olá! Aqui é da Develoi…" />
          <p className="text-[11px] text-slate-400">A mensagem sai com o seu nome em negrito. O sistema confere se o número tem WhatsApp antes de enviar.</p>
          <Button type="submit" loading={sending} fullWidth size="lg" iconLeft={<Send className="w-4 h-4" />}>ENVIAR E INICIAR CONVERSA</Button>
        </form>

        <aside className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 text-sm font-black" style={{ color: text }}>
            <History className="w-4 h-4" /> Contatos recentes
          </div>
          {recents.length === 0 ? (
            <p className="px-4 py-6 text-xs text-slate-400 text-center">Quando você atender alguém, o contato aparece aqui para falar de novo com um clique.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {recents.map(r => (
                <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, phone: r.clientPhone, name: r.clientName ?? f.name }))}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate" style={{ color: text }}>{r.clientName || formatPhone(r.clientPhone)}</span>
                    {r.clientName && <span className="block text-[11px] text-slate-400">{formatPhone(r.clientPhone)}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
            <MessageSquareText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> Mensagens prontas vêm de <b>Contato com Clientes</b>.
          </div>
        </aside>
      </div>
    </div>
  );
}
