import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Copy, Send, Search, Phone, MessageSquare,
  CheckCircle2, Clock, XCircle, BookOpen, User, PhoneCall, PhoneMissed,
  PhoneOff, RotateCcw, ThumbsDown, Star, Eye, Sparkles, AlertCircle,
} from 'lucide-react';
import { Button, Modal, ConfirmModal, Input, Select, Textarea, EmptyState } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { ReadyMessage, ClientContact, MessageCategory, ContactStatus, Product } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Configs ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<MessageCategory, { label: string; color: string; bg: string }> = {
  approach:   { label: 'Abordagem',   color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  followup:   { label: 'Follow-up',   color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  proposal:   { label: 'Proposta',    color: '#C49A2A', bg: 'rgba(196,154,42,0.12)' },
  closing:    { label: 'Fechamento',  color: '#15803D', bg: 'rgba(21,128,61,0.12)' },
  support:    { label: 'Suporte',     color: '#0891B2', bg: 'rgba(8,145,178,0.12)' },
  onboarding: { label: 'Onboarding',  color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  recovery:   { label: 'Recuperação', color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  upsell:     { label: 'Upsell',      color: '#EA580C', bg: 'rgba(234,88,12,0.12)' },
  general:    { label: 'Geral',       color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
};

const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string; bg: string }> = {
  new:            { label: 'Novo',          color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  pending:        { label: 'Pendente',      color: '#C49A2A', bg: 'rgba(196,154,42,0.1)' },
  contacted:      { label: 'Contatado',     color: '#0891B2', bg: 'rgba(8,145,178,0.1)' },
  no_answer:      { label: 'Não Atendeu',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  callback:       { label: 'Retornar',      color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  interested:     { label: 'Interessado',   color: '#15803D', bg: 'rgba(21,128,61,0.1)' },
  negotiation:    { label: 'Negociando',    color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  won:            { label: 'Cliente',       color: '#15803D', bg: 'rgba(21,128,61,0.15)' },
  not_interested: { label: 'Sem Interesse', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  invalid:        { label: 'Inválido',      color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  closed:         { label: 'Encerrado',     color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

// Chips de filtro de mensagens — igual Agendelle
const MSG_FILTER_CHIPS: { key: 'all' | MessageCategory | 'favorites'; label: string }[] = [
  { key: 'all',       label: 'TODAS' },
  { key: 'favorites', label: '⭐ FAVORITAS' },
  { key: 'approach',  label: 'ABORDAGEM' },
  { key: 'followup',  label: 'RETORNO / FOLLOW-UP' },
  { key: 'proposal',  label: 'PROPOSTA' },
  { key: 'closing',   label: 'FECHAMENTO' },
  { key: 'recovery',  label: 'RECUPERAÇÃO' },
  { key: 'upsell',    label: 'UPSELL' },
  { key: 'onboarding',label: 'ONBOARDING' },
  { key: 'support',   label: 'SUPORTE' },
  { key: 'general',   label: 'GERAL' },
];

const SEGMENT_OPTIONS = [
  'Barbearia', 'Salão de Beleza', 'Restaurante / Lanchonete',
  'Clínica / Saúde', 'Academia / Bem-estar', 'Loja / Varejo',
  'Escritório / Serviços', 'Imobiliária', 'Contabilidade / Advocacia',
  'Construção / Reformas', 'Educação / Cursos', 'Outro',
];

// Mensagens padrão — carregadas se banco vazio
const DEFAULT_MESSAGES: Omit<ReadyMessage, 'id' | 'createdAt' | 'userId'>[] = [
  { title: 'Abordagem inicial fria', category: 'approach', isDefault: true, isFavorite: false, tags: ['abordagem'],
    body: `Oi, tudo bem? 👋\n\nVi o perfil de vocês e achei muito bonito o trabalho! Estou entrando em contato porque temos uma plataforma feita para negócios como o seu, que vai muito além de uma agenda online.\n\nReúne em um só lugar:\n• Site profissional próprio\n• Automação de WhatsApp\n• Controle de clientes\n• Tudo sem precisar de um TI\n\nPosso te mandar o link para conhecer? São 30 dias grátis, sem precisar de cartão. 😊` },
  { title: 'Abordagem mais curta', category: 'approach', isDefault: true, isFavorite: false, tags: ['abordagem', 'rápida'],
    body: `Oi, tudo bem? Vi o trabalho de vocês e queria apresentar algo que pode organizar o negócio de vez.\n\nA Develoi cria sites, sistemas e chatbots para negócios que querem crescer com tecnologia.\n\nPosso te mandar o link? É rápido e gratuito para conhecer! 🚀` },
  { title: 'Foco no site profissional', category: 'approach', isDefault: true, isFavorite: false, tags: ['site', 'abordagem'],
    body: `Oi, [Nome]! Tudo bem? 😊\n\nPassando porque vi que [estabelecimento] ainda não tem um site profissional — e hoje isso faz toda a diferença para atrair clientes pelo Google.\n\nCriamos sites modernos, responsivos e com integração direta no WhatsApp.\n\n📱 Os clientes te encontram, clicam e já falam com você.\n\nPosso te mostrar alguns exemplos? São só 5 minutos!` },
  { title: 'Foco no chatbot WhatsApp', category: 'approach', isDefault: true, isFavorite: false, tags: ['chatbot', 'whatsapp'],
    body: `Oi, [Nome]! 👋\n\nImagina seu WhatsApp respondendo sozinho fora do horário, qualificando clientes e mandando propostas automáticas — sem você fazer nada.\n\nÉ exatamente isso que fazemos na Develoi com nossos chatbots.\n\nNegócios que usam economizam horas por semana e não perdem mais nenhum cliente.\n\nQuer ver como funciona?` },
  { title: 'Follow-up — 1 dia depois', category: 'followup', isDefault: true, isFavorite: false, tags: ['followup'],
    body: `Oi, [Nome]! Tudo bem? 😊\n\nOntem te mandei uma mensagem sobre como podemos ajudar [estabelecimento] com tecnologia.\n\nSei que a rotina é corrida — só passei para ver se teve chance de ver.\n\nQualquer dúvida é só falar! Fico no aguardo. 🙏` },
  { title: 'Follow-up — após proposta', category: 'followup', isDefault: true, isFavorite: false, tags: ['followup', 'proposta'],
    body: `Olá, [Nome]! Tudo bem?\n\nEnviei a proposta há alguns dias e queria saber se teve a chance de ver. 😊\n\nSe tiver alguma dúvida sobre os valores, o que está incluso ou o prazo, estou à disposição para explicar tudo!\n\nO que achou?` },
  { title: 'Proposta — Site Institucional', category: 'proposal', isDefault: true, isFavorite: false, tags: ['proposta', 'site'],
    body: `Olá, [Nome]! 😊\n\nComo combinado, segue a proposta:\n\n🖥️ *Site Institucional Profissional*\n✅ Design exclusivo e moderno\n✅ 100% responsivo (celular + desktop)\n✅ Otimizado para o Google (SEO)\n✅ Integração com WhatsApp\n✅ Formulário de contato\n✅ Hospedagem + domínio 1 ano\n✅ Suporte por 30 dias\n\n💰 Investimento: R$ [valor]\n⏱️ Prazo: [X] dias úteis\n\nQuer agendar uma conversa rápida para tirar dúvidas? 🚀` },
  { title: 'Proposta — Chatbot WhatsApp', category: 'proposal', isDefault: true, isFavorite: false, tags: ['proposta', 'chatbot'],
    body: `Olá, [Nome]! 😊\n\nSegue a proposta para o chatbot do WhatsApp:\n\n🤖 *Chatbot Profissional*\n✅ Atendimento automático 24h/7 dias\n✅ Menu personalizado\n✅ Respostas para dúvidas frequentes\n✅ Transferência para atendente humano\n✅ Configuração completa incluída\n\n💰 Investimento: R$ [valor]\n⚡ Ativação em [X] dias\n\nPosso fazer uma demonstração ao vivo? É gratuita! 😊` },
  { title: 'Fechamento — condição especial', category: 'closing', isDefault: true, isFavorite: false, tags: ['fechamento', 'urgência'],
    body: `Oi, [Nome]! 😊\n\nTemos uma condição especial disponível esta semana:\n\n🎯 [Desconto ou benefício]\n📅 Válido até [data]\n\nSeria uma pena perder! Posso reservar uma vaga para você?\n\nMe avisa que acertamos os detalhes rapidinho. 🚀` },
  { title: 'Recuperação — cliente que sumiu', category: 'recovery', isDefault: true, isFavorite: false, tags: ['recuperação'],
    body: `Oi, [Nome]! Faz um tempo que não conversamos! 😊\n\nTudo bem por aí?\n\nQueria ver se você teve chance de pensar na proposta, ou se tem interesse em conhecer alguma novidade que lançamos.\n\nEstamos com projetos muito legais! Posso te mostrar?` },
  { title: 'Não atendeu — deixar recado', category: 'followup', isDefault: true, isFavorite: false, tags: ['não atendeu', 'recado'],
    body: `Oi, [Nome]! Tentei te ligar agora mas não consegui falar.\n\nSou [Seu Nome] da Develoi — entro em contato sobre uma solução digital para [estabelecimento].\n\nQuando tiver um momento, pode me retornar? 😊\n\n📞 [Seu número]` },
  { title: 'Onboarding — boas-vindas', category: 'onboarding', isDefault: true, isFavorite: false, tags: ['onboarding'],
    body: `Bem-vindo(a) à Develoi, [Nome]! 🎉🚀\n\nFicamos muito felizes em ter você como cliente!\n\nNos próximos dias você vai receber:\n📋 Formulário de briefing\n📅 Confirmação do prazo\n💬 Acesso ao painel do projeto\n\nQualquer dúvida, é só chamar! Estamos juntos. 💪` },
  { title: 'Upsell — para cliente ativo', category: 'upsell', isDefault: true, isFavorite: false, tags: ['upsell'],
    body: `Olá, [Nome]! Tudo bem? 😊\n\nEspero que esteja satisfeito com [produto atual]!\n\nTinha uma novidade que acho que vai te interessar: [novo produto/funcionalidade].\n\nPode complementar muito o que você já tem e trazer resultados ainda melhores. 💡\n\nPosso te apresentar em 10 minutos?` },
  { title: 'Suporte — resposta a problema', category: 'support', isDefault: true, isFavorite: false, tags: ['suporte'],
    body: `Olá, [Nome]! Obrigado por entrar em contato. 😊\n\nRecebi sua mensagem sobre [problema/dúvida] e já estou verificando.\n\nRetornarei em breve com a solução. Se precisar de algo enquanto isso, pode me chamar!\n\nEstamos aqui para ajudar. 🙏` },
];

type TabView = 'contacts' | 'messages';

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ClientContactManager() {
  const { isDark } = useTheme();
  const { profile } = useAuth();
  const { show: toast } = useToast();

  const userId = profile?.uid ?? '';

  const [tabView, setTabView] = useState<TabView>('contacts');
  const [messages, setMessages] = useState<ReadyMessage[]>([]);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros contatos
  const [contactSearch, setContactSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ContactStatus>('all');

  // filtros mensagens
  const [msgSearch, setMsgSearch] = useState('');
  const [msgChip, setMsgChip] = useState<'all' | MessageCategory | 'favorites'>('all');

  // modais
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [viewingContact, setViewingContact] = useState<ClientContact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [sendingContact, setSendingContact] = useState<ClientContact | null>(null);

  const [isMsgFormOpen, setIsMsgFormOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<ReadyMessage | null>(null);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [previewMsg, setPreviewMsg] = useState<ReadyMessage | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [msgRes, contactRes, prodRes] = await Promise.all([
        fetch(`/api/ready-messages?userId=${userId}`),
        fetch(`/api/client-contacts?userId=${userId}`),
        fetch('/api/products'),
      ]);
      const msgs: ReadyMessage[] = await msgRes.json();
      setContacts(await contactRes.json());
      setProducts(await prodRes.json());

      // Seed de mensagens padrão se vazio
      if (msgs.length === 0) {
        const created = await Promise.all(
          DEFAULT_MESSAGES.map(m =>
            fetch('/api/ready-messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...m, id: uuidv4(), createdAt: new Date().toISOString() }),
            }).then(r => r.json())
          )
        );
        setMessages(created);
      } else {
        setMessages(msgs);
      }
    } catch {
      toast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Contatos ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (contact: ClientContact, status: ContactStatus) => {
    try {
      const r = await fetch(`/api/client-contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, lastContactAt: new Date().toISOString(), contactCount: (contact.contactCount ?? 0) + 1 }),
      });
      const updated = await r.json();
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
      if (viewingContact?.id === updated.id) setViewingContact(updated);
    } catch { toast('Erro ao atualizar', 'error'); }
  };

  const handleDeleteContact = async () => {
    if (!deletingContactId) return;
    try {
      await fetch(`/api/client-contacts/${deletingContactId}`, { method: 'DELETE' });
      setContacts(prev => prev.filter(c => c.id !== deletingContactId));
      toast('Contato removido', 'success');
    } catch { toast('Erro ao remover', 'error'); }
    finally { setDeletingContactId(null); }
  };

  const filteredContacts = useMemo(() => contacts.filter(c => {
    const q = contactSearch.toLowerCase();
    const match = !q || [c.clientName, c.establishmentName, c.ownerName, c.clientPhone, c.city, c.segment]
      .some(v => v?.toLowerCase().includes(q));
    const stMatch = filterStatus === 'all' || c.status === filterStatus;
    return match && stMatch;
  }), [contacts, contactSearch, filterStatus]);

  // ─── Mensagens ────────────────────────────────────────────────────────────

  const handleToggleFavorite = async (msg: ReadyMessage) => {
    try {
      const r = await fetch(`/api/ready-messages/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !msg.isFavorite }),
      });
      const updated = await r.json();
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch { toast('Erro', 'error'); }
  };

  const handleDeleteMsg = async () => {
    if (!deletingMsgId) return;
    try {
      await fetch(`/api/ready-messages/${deletingMsgId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== deletingMsgId));
      toast('Mensagem removida', 'success');
    } catch { toast('Erro ao remover', 'error'); }
    finally { setDeletingMsgId(null); }
  };

  const filteredMessages = useMemo(() => messages.filter(m => {
    const q = msgSearch.toLowerCase();
    const matchSearch = !q || m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q);
    const matchChip = msgChip === 'all' ? true : msgChip === 'favorites' ? m.isFavorite : m.category === msgChip;
    return matchSearch && matchChip;
  }), [messages, msgSearch, msgChip]);

  const stats = useMemo(() => ({
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    pending: contacts.filter(c => c.status === 'pending' || c.status === 'callback').length,
    interested: contacts.filter(c => c.status === 'interested' || c.status === 'negotiation').length,
    won: contacts.filter(c => c.status === 'won').length,
    noAnswer: contacts.filter(c => c.status === 'no_answer').length,
  }), [contacts]);

  const pendingBadge = stats.new + stats.pending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
            Contato com Clientes
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Minha lista de prospecção e mensagens prontas</p>
        </div>
        <Button
          iconLeft={<Plus className="w-4 h-4" />}
          onClick={() => {
            if (tabView === 'contacts') { setEditingContact(null); setIsContactFormOpen(true); }
            else { setEditingMsg(null); setIsMsgFormOpen(true); }
          }}
        >
          {tabView === 'contacts' ? 'NOVO CONTATO' : 'NOVA MENSAGEM'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Total',       value: stats.total,      color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)' },
          { label: 'Novos',       value: stats.new,        color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
          { label: 'A Contatar',  value: stats.pending,    color: '#C49A2A', bg: 'rgba(196,154,42,0.1)' },
          { label: 'Não Atendeu', value: stats.noAnswer,   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Interessados',value: stats.interested, color: '#15803D', bg: 'rgba(21,128,61,0.1)' },
          { label: 'Clientes',    value: stats.won,        color: '#059669', bg: 'rgba(5,150,105,0.1)' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white dark:bg-white/5 rounded-xl p-3 shadow-sm border border-slate-200/60 dark:border-white/10 flex flex-col items-center text-center"
          >
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs — estilo Agendelle */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
        {([
          ['contacts', 'Minha Lista de Contatos', pendingBadge],
          ['messages', 'Mensagens Prontas', 0],
        ] as const).map(([id, label, badge]) => (
          <button
            key={id}
            onClick={() => setTabView(id)}
            className={`relative px-5 py-2.5 text-sm font-bold transition-all ${
              tabView === id
                ? 'text-[#0D1F4E] dark:text-white'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {label}
            {badge > 0 && (
              <span className="ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: '#C49A2A' }}>
                {badge}
              </span>
            )}
            {tabView === id && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#C49A2A' }} />
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════ ABA: CONTATOS ═══════════════ */}
      <AnimatePresence mode="wait">
        {tabView === 'contacts' ? (
          <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                  placeholder="Nome, telefone ou cidade..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:border-[#0D1F4E]"
                  style={{ color: isDark ? '#fff' : '#1e293b' }}
                />
              </div>
              <select
                value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none font-medium"
                style={{ color: isDark ? '#fff' : '#1e293b' }}
              >
                <option value="all">Todos os Status</option>
                {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="text-center py-12 text-sm text-slate-400">Carregando...</div>
            ) : filteredContacts.length === 0 ? (
              <EmptyState icon={User} title="Nenhum contato encontrado"
                description="Adicione clientes e prospects para acompanhar sua prospecção."
                action={<Button onClick={() => setIsContactFormOpen(true)}>ADICIONAR CONTATO</Button>} />
            ) : (
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                {/* Header tabela */}
                <div className="hidden md:grid px-6 py-3 border-b border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                  style={{ gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr 0.7fr auto' }}>
                  {['Contato', 'WhatsApp', 'Cidade', 'Status', 'Notas', 'Ações'].map(h => <span key={h}>{h}</span>)}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredContacts.map((contact, i) => {
                    const stCfg = STATUS_CONFIG[contact.status];
                    const displayName = contact.establishmentName || contact.clientName;
                    const sub = contact.ownerName && contact.ownerName !== displayName ? contact.ownerName : contact.segment;
                    return (
                      <motion.div key={contact.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className="grid grid-cols-1 md:px-6 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group items-center gap-2"
                        style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,0.7fr) auto' }}
                      >
                        {/* Nome */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 text-white"
                            style={{ background: stCfg.color }}>
                            {displayName[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{displayName}</p>
                            {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
                          </div>
                        </div>

                        {/* Telefone */}
                        <p className="text-sm text-slate-500 dark:text-slate-300 truncate">{contact.clientPhone ?? '—'}</p>

                        {/* Cidade */}
                        <p className="text-sm text-slate-500 dark:text-slate-300 truncate">{contact.city ?? '—'}</p>

                        {/* Status — select inline igual Agendelle */}
                        <div>
                          <select
                            value={contact.status}
                            onChange={e => handleStatusChange(contact, e.target.value as ContactStatus)}
                            className="px-2 py-1 text-[10px] font-black rounded-lg border cursor-pointer uppercase tracking-widest focus:outline-none w-full"
                            style={{ background: stCfg.bg, color: stCfg.color, borderColor: `${stCfg.color}30` }}
                          >
                            {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Notas */}
                        <p className="text-xs text-slate-400 truncate">{contact.notes ? contact.notes.slice(0, 30) + (contact.notes.length > 30 ? '…' : '') : '—'}</p>

                        {/* Ações */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewingContact(contact)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors" title="Ver">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {contact.clientPhone && (
                            <button onClick={() => setSendingContact(contact)}
                              className="p-1.5 rounded-lg text-white transition-colors" style={{ background: '#15803D' }} title="Enviar WA">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => { setEditingContact(contact); setIsContactFormOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors" title="Editar">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingContactId(contact.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

        ) : (
          /* ═══════════════ ABA: MENSAGENS ═══════════════ */
          <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Chips de categoria — igual Agendelle */}
            <div className="flex flex-wrap gap-2 items-center">
              {MSG_FILTER_CHIPS.map(chip => (
                <button key={chip.key}
                  onClick={() => setMsgChip(chip.key as any)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${
                    msgChip === chip.key
                      ? 'text-white border-transparent'
                      : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:border-slate-300'
                  }`}
                  style={msgChip === chip.key ? { background: '#0D1F4E' } : {}}
                >
                  {chip.label}
                </button>
              ))}
              <div className="ml-auto relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)}
                  placeholder="Buscar mensagem..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none"
                  style={{ color: isDark ? '#fff' : '#1e293b' }} />
              </div>
            </div>

            {/* Grid de mensagens */}
            {loading ? (
              <div className="text-center py-12 text-sm text-slate-400">Carregando...</div>
            ) : filteredMessages.length === 0 ? (
              <EmptyState icon={MessageSquare} title="Nenhuma mensagem encontrada"
                description="Crie uma mensagem pronta personalizada."
                action={<Button onClick={() => setIsMsgFormOpen(true)}>CRIAR MENSAGEM</Button>} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMessages.map((msg, i) => {
                  const catCfg = CATEGORY_CONFIG[msg.category];
                  return (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        {/* Categoria + ações */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
                            style={{ background: catCfg.bg, color: catCfg.color }}>
                            {catCfg.label}
                          </span>
                          <div className="flex gap-1">
                            {/* Favorito */}
                            <button onClick={() => handleToggleFavorite(msg)}
                              className={`p-1.5 rounded-lg transition-colors ${msg.isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}>
                              <Star className="w-3.5 h-3.5" fill={msg.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            {!msg.isDefault && (
                              <button onClick={() => { setEditingMsg(msg); setIsMsgFormOpen(true); }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => setDeletingMsgId(msg.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Título */}
                        <h3 className="font-black text-sm" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                          {msg.title}
                          {msg.isDefault && (
                            <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-400 uppercase align-middle">padrão</span>
                          )}
                        </h3>

                        {/* Preview */}
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 flex-1 whitespace-pre-wrap">{msg.body}</p>
                      </div>

                      {/* Botões — igual Agendelle */}
                      <div className="flex border-t border-slate-100 dark:border-white/5">
                        <button
                          onClick={() => setPreviewMsg(msg)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-r border-slate-100 dark:border-white/5"
                        >
                          <Eye className="w-3.5 h-3.5" /> VER
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(msg.body); toast('Mensagem copiada!', 'success'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-r border-slate-100 dark:border-white/5"
                        >
                          <Copy className="w-3.5 h-3.5" /> COPIAR
                        </button>
                        <button
                          onClick={() => { setSendingContact(null); setPreviewMsg(msg); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black text-white transition-all hover:opacity-90"
                          style={{ background: '#15803D' }}
                        >
                          <Send className="w-3.5 h-3.5" /> ENVIAR WA
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modais ─── */}

      {isContactFormOpen && (
        <ContactFormModal
          contact={editingContact} products={products} messages={messages} userId={userId}
          onClose={() => setIsContactFormOpen(false)}
          onSaved={c => {
            setContacts(prev => editingContact ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]);
            setIsContactFormOpen(false);
            toast(editingContact ? 'Contato atualizado!' : 'Contato adicionado!', 'success');
          }}
        />
      )}

      {viewingContact && (
        <ContactDetailModal
          contact={viewingContact} messages={messages}
          onClose={() => setViewingContact(null)}
          onEdit={() => { setEditingContact(viewingContact); setViewingContact(null); setIsContactFormOpen(true); }}
          onSend={() => { setSendingContact(viewingContact); setViewingContact(null); }}
          onStatusChange={handleStatusChange}
        />
      )}

      {sendingContact && (
        <WhatsAppSendModal
          contact={sendingContact} messages={messages}
          onClose={() => setSendingContact(null)}
          onSent={() => { handleStatusChange(sendingContact, 'contacted'); setSendingContact(null); }}
        />
      )}

      {/* Preview / Enviar mensagem da aba mensagens */}
      {previewMsg && !sendingContact && (
        <MsgPreviewModal
          message={previewMsg}
          contacts={contacts}
          onClose={() => setPreviewMsg(null)}
          onCopy={() => { navigator.clipboard.writeText(previewMsg.body); toast('Copiado!', 'success'); setPreviewMsg(null); }}
          onSend={contact => { setSendingContact(contact); setPreviewMsg(null); }}
        />
      )}

      {isMsgFormOpen && (
        <MessageFormModal
          message={editingMsg} products={products} userId={userId}
          onClose={() => setIsMsgFormOpen(false)}
          onSaved={m => {
            setMessages(prev => editingMsg ? prev.map(x => x.id === m.id ? m : x) : [m, ...prev]);
            setIsMsgFormOpen(false);
            toast(editingMsg ? 'Mensagem atualizada!' : 'Mensagem criada!', 'success');
          }}
        />
      )}

      {deletingContactId && (
        <ConfirmModal isOpen title="Remover Contato" message="Tem certeza? Esta ação não pode ser desfeita."
          confirmLabel="REMOVER" variant="danger"
          onConfirm={handleDeleteContact} onClose={() => setDeletingContactId(null)} />
      )}
      {deletingMsgId && (
        <ConfirmModal isOpen title="Remover Mensagem" message="Tem certeza que deseja remover esta mensagem?"
          confirmLabel="REMOVER" variant="danger"
          onConfirm={handleDeleteMsg} onClose={() => setDeletingMsgId(null)} />
      )}
    </div>
  );
}

// ─── ContactFormModal ─────────────────────────────────────────────────────────

function ContactFormModal({ contact, products, messages, userId, onClose, onSaved }: {
  contact: ClientContact | null; products: Product[]; messages: ReadyMessage[];
  userId: string; onClose: () => void; onSaved: (c: ClientContact) => void;
}) {
  const { show: toast } = useToast();
  const [f, setF] = useState({
    clientName: contact?.clientName ?? '',
    establishmentName: contact?.establishmentName ?? '',
    ownerName: contact?.ownerName ?? '',
    clientPhone: contact?.clientPhone ?? '',
    clientPhone2: contact?.clientPhone2 ?? '',
    clientEmail: contact?.clientEmail ?? '',
    city: contact?.city ?? '',
    segment: contact?.segment ?? '',
    productName: contact?.productName ?? '',
    messageId: contact?.messageId ?? '',
    channel: contact?.channel ?? 'whatsapp',
    status: contact?.status ?? 'new',
    priority: contact?.priority ?? 'medium',
    notes: contact?.notes ?? '',
    scheduledAt: contact?.scheduledAt ? contact.scheduledAt.slice(0, 16) : '',
  });
  const [loading, setLoading] = useState(false);
  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedMessage = messages.find(m => m.id === f.messageId);
      const body: ClientContact = {
        id: contact?.id ?? uuidv4(),
        userId,
        clientName: f.establishmentName || f.ownerName || f.clientName,
        establishmentName: f.establishmentName || undefined,
        ownerName: f.ownerName || undefined,
        clientPhone: f.clientPhone || undefined,
        clientPhone2: f.clientPhone2 || undefined,
        clientEmail: f.clientEmail || undefined,
        city: f.city || undefined,
        segment: f.segment || undefined,
        productName: f.productName || undefined,
        messageId: f.messageId || undefined,
        messageTitle: selectedMessage?.title,
        channel: f.channel as any, status: f.status as any, priority: f.priority as any,
        notes: f.notes || undefined,
        scheduledAt: f.scheduledAt ? new Date(f.scheduledAt).toISOString() : undefined,
        lastContactAt: contact?.lastContactAt,
        contactCount: contact?.contactCount ?? 0,
        createdAt: contact?.createdAt ?? new Date().toISOString(),
      };
      const url = contact ? `/api/client-contacts/${contact.id}` : '/api/client-contacts';
      const r = await fetch(url, {
        method: contact ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.status === 409) {
        const data = await r.json();
        toast(`⚠️ ${data.message}`, 'error');
        setLoading(false);
        return;
      }
      onSaved(await r.json());
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={contact ? 'Editar Contato' : 'Novo Contato'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estabelecimento</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome do Estabelecimento" value={f.establishmentName} onChange={up('establishmentName')} placeholder="Ex: Barbearia do João" />
          <Input label="Nome do Dono / Responsável" value={f.ownerName} onChange={up('ownerName')} placeholder="Ex: João Silva" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Segmento" value={f.segment} onChange={up('segment')}>
            <option value="">Selecionar segmento</option>
            {SEGMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Cidade" value={f.city} onChange={up('city')} placeholder="Ex: Tatuí, SP" />
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">Contato</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="WhatsApp principal" value={f.clientPhone} onChange={up('clientPhone')} placeholder="(15) 99999-0000" />
          <Input label="Telefone 2 (opcional)" value={f.clientPhone2} onChange={up('clientPhone2')} placeholder="(15) 99999-1111" />
        </div>
        <Input label="E-mail (opcional)" type="email" value={f.clientEmail} onChange={up('clientEmail')} placeholder="contato@email.com" />

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">Prospecção</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Status" value={f.status} onChange={up('status')}>
            {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </Select>
          <Select label="Prioridade" value={f.priority} onChange={up('priority')}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </Select>
          <Select label="Canal" value={f.channel} onChange={up('channel')}>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Ligação</option>
            <option value="email">E-mail</option>
            <option value="other">Outro</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Produto / Interesse" value={f.productName} onChange={up('productName')} placeholder="Ex: Site, Chatbot..." />
          <Input label="Agendar contato para" type="datetime-local" value={f.scheduledAt} onChange={up('scheduledAt')} />
        </div>
        <Textarea label="Observações / Histórico" value={f.notes} onChange={up('notes')}
          placeholder="Contexto, histórico, detalhes relevantes..." rows={3} />

        <Button type="submit" loading={loading} fullWidth size="lg">
          {contact ? 'SALVAR CONTATO' : 'ADICIONAR CONTATO'}
        </Button>
      </form>
    </Modal>
  );
}

// ─── ContactDetailModal ───────────────────────────────────────────────────────

function ContactDetailModal({ contact, messages, onClose, onEdit, onSend, onStatusChange }: {
  contact: ClientContact; messages: ReadyMessage[];
  onClose: () => void; onEdit: () => void; onSend: () => void;
  onStatusChange: (c: ClientContact, s: ContactStatus) => void;
}) {
  const { isDark } = useTheme();
  const stCfg = STATUS_CONFIG[contact.status];
  const displayName = contact.establishmentName || contact.clientName;

  return (
    <Modal isOpen onClose={onClose} title="Detalhes do Contato" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: stCfg.bg }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0" style={{ background: stCfg.color }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{displayName}</p>
            {contact.ownerName && <p className="text-sm text-slate-500">{contact.ownerName}</p>}
            {contact.segment && <p className="text-xs font-bold uppercase tracking-wide" style={{ color: stCfg.color }}>{contact.segment}</p>}
          </div>
          <span className="text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.7)', color: stCfg.color }}>{stCfg.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            ['Telefone', contact.clientPhone],
            ['Telefone 2', contact.clientPhone2],
            ['E-mail', contact.clientEmail],
            ['Cidade', contact.city],
            ['Interesse', contact.productName],
            ['Contatos', String(contact.contactCount ?? 0)],
            ['Último contato', contact.lastContactAt ? format(new Date(contact.lastContactAt), "dd/MM/yy HH:mm", { locale: ptBR }) : null],
          ].filter(r => r[1]).map(([label, value]) => (
            <div key={label as string} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="text-sm font-bold truncate mt-0.5" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{value}</p>
            </div>
          ))}
        </div>

        {contact.notes && (
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-400/20">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Observações</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
          </div>
        )}

        {/* Status rápido */}
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Atualizar Status</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const active = contact.status === s;
              return (
                <button key={s} onClick={() => onStatusChange(contact, s)}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border"
                  style={{ background: active ? cfg.bg : 'transparent', color: active ? cfg.color : '#94a3b8', borderColor: active ? `${cfg.color}40` : 'transparent' }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
            <Edit2 className="w-4 h-4" /> Editar
          </button>
          {contact.clientPhone && (
            <button onClick={onSend} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-black text-sm hover:opacity-90 transition-all" style={{ background: '#15803D' }}>
              <Send className="w-4 h-4" /> Enviar WA
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── MsgPreviewModal (aba mensagens → ENVIAR WA) ──────────────────────────────

function MsgPreviewModal({ message, contacts, onClose, onCopy, onSend }: {
  message: ReadyMessage; contacts: ClientContact[];
  onClose: () => void; onCopy: () => void; onSend: (c: ClientContact) => void;
}) {
  const catCfg = CATEGORY_CONFIG[message.category];
  const [selectedContactId, setSelectedContactId] = useState('');
  const contactsWithPhone = contacts.filter(c => c.clientPhone);

  return (
    <Modal isOpen onClose={onClose} title={message.title} size="md">
      <div className="space-y-4">
        <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest" style={{ background: catCfg.bg, color: catCfg.color }}>
          {catCfg.label}
        </span>
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
          {message.body}
        </div>
        {contactsWithPhone.length > 0 && (
          <Select label="Enviar para um contato da lista" value={selectedContactId} onChange={e => setSelectedContactId(e.target.value)}>
            <option value="">Selecionar contato...</option>
            {contactsWithPhone.map(c => (
              <option key={c.id} value={c.id}>{c.establishmentName ?? c.clientName} — {c.clientPhone}</option>
            ))}
          </Select>
        )}
        <div className="flex gap-2">
          <button onClick={onCopy} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <Copy className="w-4 h-4" /> Copiar
          </button>
          {selectedContactId ? (
            <button onClick={() => onSend(contacts.find(c => c.id === selectedContactId)!)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-black text-sm hover:opacity-90 transition-all" style={{ background: '#15803D' }}>
              <Send className="w-4 h-4" /> Enviar WA
            </button>
          ) : (
            <a href={`https://wa.me/?text=${encodeURIComponent(message.body)}`} target="_blank" rel="noopener noreferrer"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-black text-sm hover:opacity-90 transition-all" style={{ background: '#15803D' }}>
              <Send className="w-4 h-4" /> Abrir WA
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── WhatsAppSendModal ────────────────────────────────────────────────────────

function WhatsAppSendModal({ contact, messages, onClose, onSent }: {
  contact: ClientContact; messages: ReadyMessage[]; onClose: () => void; onSent: () => void;
}) {
  const { show: toast } = useToast();
  const linkedMsg = messages.find(m => m.id === contact.messageId);
  const [selectedMsgId, setSelectedMsgId] = useState(linkedMsg?.id ?? '');

  const buildText = (msg?: ReadyMessage) => {
    if (!msg) return '';
    return msg.body
      .replace(/\[Nome\]/g, contact.ownerName ?? contact.clientName ?? '')
      .replace(/\[Estabelecimento\]/g, contact.establishmentName ?? '');
  };

  const [text, setText] = useState(buildText(linkedMsg));

  useEffect(() => {
    const m = messages.find(m => m.id === selectedMsgId);
    setText(buildText(m));
  }, [selectedMsgId]);

  const phone = contact.clientPhone?.replace(/\D/g, '') ?? '';
  const displayName = contact.establishmentName ?? contact.clientName;

  return (
    <Modal isOpen onClose={onClose} title="Enviar via WhatsApp" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-green-200 dark:bg-green-700 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-green-700 dark:text-green-200" />
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: '#0D1F4E' }}>{displayName}</p>
            <p className="text-xs text-slate-400">{contact.clientPhone}</p>
          </div>
        </div>

        <Select label="Usar mensagem pronta (opcional)" value={selectedMsgId} onChange={e => setSelectedMsgId(e.target.value)}>
          <option value="">— Digitar livremente —</option>
          {messages.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </Select>

        <Textarea label="Mensagem" value={text} onChange={e => setText(e.target.value)} rows={8} />

        <div className="flex gap-2">
          <button onClick={() => { navigator.clipboard.writeText(text); toast('Copiado!', 'success'); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            <Copy className="w-4 h-4" /> Copiar
          </button>
          <a href={`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
            onClick={onSent}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-black text-sm hover:opacity-90 transition-all" style={{ background: '#15803D' }}>
            <Send className="w-4 h-4" /> Abrir WhatsApp
          </a>
        </div>
      </div>
    </Modal>
  );
}

// ─── MessageFormModal ─────────────────────────────────────────────────────────

const MSG_TEMPLATES: Record<MessageCategory, string> = {
  approach:   'Oi, [Nome]! Tudo bem? 😊\n\nMeu nome é [Seu Nome], sou da Develoi.\n\nVi o trabalho de vocês e queria apresentar uma solução que pode ajudar muito [Estabelecimento].\n\nPosso te contar mais?',
  followup:   'Oi, [Nome]! 😊\n\nSó passando para ver se teve chance de ver a mensagem que enviei.\n\nQualquer dúvida é só falar! 🙏',
  proposal:   'Olá, [Nome]! 😊\n\nSegue a proposta:\n\n✅ [Benefício 1]\n✅ [Benefício 2]\n\n💰 R$ [valor]\n⏱️ [Prazo]\n\nQuer conversar?',
  closing:    'Oi, [Nome]! Ainda dá tempo de aproveitar a condição especial. 🎯\n\nMe avisa que acertamos agora!',
  support:    'Olá, [Nome]! Recebi seu contato e já estou verificando. 😊\n\nRetorno em breve!',
  onboarding: 'Bem-vindo(a) à Develoi, [Nome]! 🎉\n\nFicamos felizes em ter você. Em breve entraremos em contato com os próximos passos!',
  recovery:   'Oi, [Nome]! Faz um tempo que não conversamos. 😊\n\nTudo bem? Temos novidades que podem te interessar!',
  upsell:     'Olá, [Nome]! 😊\n\nTinha uma novidade que acho que vai te interessar muito.\n\nPosso te apresentar rapidinho?',
  general:    'Olá, [Nome]! 😊\n\n[Mensagem]\n\nEstou à disposição!\nDeveloi',
};

function MessageFormModal({ message, products, userId, onClose, onSaved }: {
  message: ReadyMessage | null; products: Product[]; userId: string;
  onClose: () => void; onSaved: (m: ReadyMessage) => void;
}) {
  const [title, setTitle] = useState(message?.title ?? '');
  const [category, setCategory] = useState<MessageCategory>(message?.category ?? 'approach');
  const [productId, setProductId] = useState(message?.productId ?? '');
  const [body, setBody] = useState(message?.body ?? MSG_TEMPLATES.approach);
  const [tags, setTags] = useState(message?.tags?.join(', ') ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sp = products.find(p => p.id === productId);
      const data: ReadyMessage = {
        id: message?.id ?? uuidv4(), userId,
        title, category,
        productId: productId || undefined,
        productName: sp?.name,
        body, isDefault: false, isFavorite: message?.isFavorite ?? false,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: message?.createdAt ?? new Date().toISOString(),
      };
      const url = message ? `/api/ready-messages/${message.id}` : '/api/ready-messages';
      const r = await fetch(url, {
        method: message ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      onSaved(await r.json());
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={message ? 'Editar Mensagem' : 'Nova Mensagem Pronta'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Abordagem para barbearias" />
          <Select label="Categoria" value={category} onChange={e => { setCategory(e.target.value as MessageCategory); if (!message) setBody(MSG_TEMPLATES[e.target.value as MessageCategory]); }}>
            {(Object.keys(CATEGORY_CONFIG) as MessageCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
            ))}
          </Select>
        </div>
        {!message && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Templates rápidos</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_CONFIG) as MessageCategory[]).map(c => (
                <button key={c} type="button"
                  onClick={() => { setCategory(c); setBody(MSG_TEMPLATES[c]); }}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all"
                  style={{ background: category === c ? CATEGORY_CONFIG[c].bg : 'transparent', color: CATEGORY_CONFIG[c].color, borderColor: CATEGORY_CONFIG[c].color + '40' }}>
                  {CATEGORY_CONFIG[c].label}
                </button>
              ))}
            </div>
          </div>
        )}
        <Select label="Produto / Plano (opcional)" value={productId} onChange={e => setProductId(e.target.value)}>
          <option value="">Genérica</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Textarea label="Texto da Mensagem" required value={body} onChange={e => setBody(e.target.value)}
          placeholder="Use [Nome] e [Estabelecimento] como variáveis." rows={8} />
        <Input label="Tags (separadas por vírgula)" value={tags} onChange={e => setTags(e.target.value)} placeholder="barbearia, site, abordagem" />
        <Button type="submit" loading={loading} fullWidth size="lg">
          {message ? 'SALVAR MENSAGEM' : 'CRIAR MENSAGEM'}
        </Button>
      </form>
    </Modal>
  );
}
