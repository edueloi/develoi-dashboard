import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Settings, Trash2, Users, Calendar, Rocket, Briefcase, ArrowRight,
  BookOpen, ChevronDown, ChevronUp, Monitor, Globe, Kanban, MessageSquare,
  ShieldCheck, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Zap, List, BarChart2, Star, Lock, Unlock, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge, ProgressBar, ConfirmModal, EmptyState, Button } from '../ui';
import type { Project } from './types';
import { cn } from '../../lib/utils';

interface ProjectsListProps {
  projects: Project[];
  onSelect: (p: Project) => void;
  onEdit: (p: Project) => void;
}

// ─── Manual do Sistema ────────────────────────────────────────────────────────

const SYSTEM_MODULES = [
  {
    icon: Monitor,
    color: '#0D1F4E',
    bg: 'rgba(13,31,78,0.08)',
    title: 'Visão Geral',
    desc: 'Painel central com métricas dos projetos ativos, concluídos e em espera. Exibe projetos recentes, progresso e próximas entregas em tempo real.',
  },
  {
    icon: Briefcase,
    color: '#C49A2A',
    bg: 'rgba(196,154,42,0.1)',
    title: 'Projetos',
    desc: 'Gerencie todos os projetos da Develoi. Crie, edite, acompanhe progresso, defina prazos e controle a visibilidade por cliente.',
  },
  {
    icon: List,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.1)',
    title: 'Backlog',
    desc: 'Lista de funcionalidades e tarefas pendentes. Priorize histórias de usuário, bugs, tarefas e demandas com pontuação de story points.',
  },
  {
    icon: Kanban,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.1)',
    title: 'Quadro Kanban',
    desc: 'Visualização drag-and-drop das funcionalidades por status: A Fazer, Em Progresso, Em Teste e Concluído.',
  },
  {
    icon: Calendar,
    color: '#0891B2',
    bg: 'rgba(8,145,178,0.1)',
    title: 'Cronograma',
    desc: 'Linha do tempo visual dos projetos com datas de início, prazo e marcos de entrega para cada funcionalidade.',
  },
  {
    icon: ShieldCheck,
    color: '#15803D',
    bg: 'rgba(21,128,61,0.1)',
    title: 'Controle de Qualidade',
    desc: 'Módulo de QA com cenários de teste, validação de funcionalidades, registro de bugs e aprovação de entregas.',
  },
  {
    icon: Users,
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.1)',
    title: 'Área de Membros',
    desc: 'Gerencie os membros da equipe, seus papéis, permissões e acesso aos projetos.',
  },
  {
    icon: MessageSquare,
    color: '#0D1F4E',
    bg: 'rgba(13,31,78,0.08)',
    title: 'Chat',
    desc: 'Comunicação interna por projeto. Troca de mensagens em tempo real entre membros da equipe.',
  },
  {
    icon: Globe,
    color: '#C49A2A',
    bg: 'rgba(196,154,42,0.1)',
    title: 'Portfólio Público',
    desc: 'Gerencie os cases de sucesso exibidos no site público da Develoi. Controle imagens, descrições e destaques.',
  },
  {
    icon: FileText,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.1)',
    title: 'Blog',
    desc: 'Editor completo para publicação de artigos no blog da Develoi. Suporte a rich text, imagens e categorias.',
  },
  {
    icon: BarChart2,
    color: '#15803D',
    bg: 'rgba(21,128,61,0.1)',
    title: 'Módulo Comercial',
    desc: 'Controle de vendas, catálogo de produtos e planos, e gerenciamento de contato com clientes potenciais.',
  },
  {
    icon: Zap,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.1)',
    title: 'Bot de Atendimento',
    desc: 'Configure o bot de atendimento automático do WhatsApp. Defina respostas, fluxos e mensagens de boas-vindas.',
  },
];

const ACCESS_STEPS = [
  { step: '01', title: 'Faça o login', desc: 'Acesse com seu e-mail e senha cadastrados. Use a tela de login em /login.' },
  { step: '02', title: 'Selecione o projeto', desc: 'No topo da sidebar, selecione o projeto em que irá trabalhar no seletor de projetos.' },
  { step: '03', title: 'Navegue pelos módulos', desc: 'Use a sidebar esquerda para navegar entre Backlog, Quadro, Cronograma e Chat do projeto.' },
  { step: '04', title: 'Gerencie funcionalidades', desc: 'Crie tickets pelo botão "+ Nova Funcionalidade", arraste entre colunas no Kanban e valide entregas no QA.' },
  { step: '05', title: 'Acompanhe o progresso', desc: 'O progresso de cada projeto é atualizado em tempo real. Confira na Visão Geral ou no card do projeto.' },
];

function SystemManual() {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="rounded-3xl border overflow-hidden"
      style={{ borderColor: 'rgba(13,31,78,0.1)', background: 'white', boxShadow: '0 2px 20px rgba(13,31,78,0.06)' }}
    >
      {/* Header clicável */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-8 py-6 transition-colors hover:bg-slate-50/60 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,31,78,0.07)' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#0D1F4E' }} />
          </div>
          <div>
            <p className="font-black text-base tracking-tight" style={{ color: '#0D1F4E' }}>Manual de Acesso & Visão do Sistema</p>
            <p className="text-xs text-slate-400 mt-0.5">O que é o Develoi Hub, como usar e o que cada módulo faz</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl hidden sm:block" style={{ background: 'rgba(13,31,78,0.06)', color: '#0D1F4E' }}>
            {SYSTEM_MODULES.length} módulos
          </span>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="manual"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-8 pb-8 space-y-10" style={{ borderTop: '1px solid rgba(13,31,78,0.06)' }}>

              {/* Hero banner com imagem local */}
              <div className="relative rounded-2xl overflow-hidden mt-6" style={{ minHeight: 220 }}>
                <img
                  src="/capa-header.png"
                  alt="Develoi Hub"
                  className="w-full h-full object-cover"
                  style={{ maxHeight: 280, objectPosition: 'center top' }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(6,17,43,0.88) 40%, rgba(6,17,43,0.3))' }} />
                <div className="absolute inset-0 flex flex-col justify-center px-10 py-8">
                  <div className="flex items-center gap-3 mb-4">
                    <img src="/LOGO-MENU-BRANCO.png" alt="Develoi" className="h-8 object-contain" />
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight tracking-tight mb-2">
                    Develoi Hub<br />
                    <span style={{ color: 'var(--brand-gold, #C49A2A)' }}>Plataforma de Gestão Digital</span>
                  </h2>
                  <p className="text-sm text-white/65 max-w-md leading-relaxed">
                    Sistema interno da Develoi para gerenciamento completo de projetos, equipe, entregas e comunicação com clientes.
                  </p>
                </div>
              </div>

              {/* O que é o sistema */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-4 h-[2px] rounded-full" style={{ background: '#C49A2A' }} />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: '#C49A2A' }}>Para que serve</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: Rocket, title: 'Gestão de Projetos', desc: 'Planeje, acompanhe e entregue projetos de desenvolvimento com metodologia ágil, cronograma e controle de qualidade integrados.' },
                    { icon: TrendingUp, title: 'Controle Comercial', desc: 'Gerencie vendas, proposta de produtos e planos, e o relacionamento com leads e clientes em um único lugar.' },
                    { icon: Globe, title: 'Site Público', desc: 'Alimente o conteúdo do site da Develoi diretamente pelo hub: portfólio, blog, equipe, valores e cases de sucesso.' },
                  ].map((item) => (
                    <div key={item.title} className="p-5 rounded-2xl border flex flex-col gap-3" style={{ borderColor: 'rgba(13,31,78,0.08)', background: 'rgba(240,242,248,0.4)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(13,31,78,0.07)' }}>
                        <item.icon className="w-4 h-4" style={{ color: '#0D1F4E' }} />
                      </div>
                      <p className="font-black text-sm" style={{ color: '#0D1F4E' }}>{item.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Como acessar */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-4 h-[2px] rounded-full" style={{ background: '#C49A2A' }} />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: '#C49A2A' }}>Como usar</p>
                </div>
                <div className="relative">
                  {/* Linha vertical conectora */}
                  <div className="absolute left-[19px] top-6 bottom-6 w-px" style={{ background: 'rgba(13,31,78,0.08)' }} />
                  <div className="space-y-4">
                    {ACCESS_STEPS.map((s) => (
                      <div key={s.step} className="flex items-start gap-4 relative">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[11px] flex-shrink-0 relative z-10"
                          style={{ background: '#0D1F4E', color: '#C49A2A' }}
                        >
                          {s.step}
                        </div>
                        <div className="pt-1.5 pb-2">
                          <p className="font-black text-sm mb-0.5" style={{ color: '#0D1F4E' }}>{s.title}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Módulos */}
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-4 h-[2px] rounded-full" style={{ background: '#C49A2A' }} />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: '#C49A2A' }}>Módulos do sistema</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SYSTEM_MODULES.map((mod) => (
                    <div key={mod.title} className="flex items-start gap-3 p-4 rounded-2xl border transition-all" style={{ borderColor: 'rgba(13,31,78,0.07)', background: 'white' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: mod.bg }}>
                        <mod.icon className="w-4 h-4" style={{ color: mod.color }} />
                      </div>
                      <div>
                        <p className="font-black text-xs mb-1" style={{ color: '#0D1F4E' }}>{mod.title}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{mod.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Níveis de acesso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl flex items-start gap-4 border" style={{ background: 'rgba(13,31,78,0.03)', borderColor: 'rgba(13,31,78,0.08)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,154,42,0.12)' }}>
                    <Star className="w-5 h-5" style={{ color: '#C49A2A' }} />
                  </div>
                  <div>
                    <p className="font-black text-sm mb-1" style={{ color: '#0D1F4E' }}>Perfil Admin</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Acesso completo a todos os projetos, configurações do sistema, gerenciamento de equipe e módulos comerciais.</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl flex items-start gap-4 border" style={{ background: 'rgba(13,31,78,0.03)', borderColor: 'rgba(13,31,78,0.08)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,99,235,0.1)' }}>
                    <Lock className="w-5 h-5" style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <p className="font-black text-sm mb-1" style={{ color: '#0D1F4E' }}>Perfil Cliente / Membro</p>
                    <p className="text-xs text-slate-500 leading-relaxed">Acesso apenas aos projetos atribuídos. Pode acompanhar progresso, histórico e comunicação do projeto.</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, index, onSelect, onEdit, onDelete }: {
  project: Project;
  index: number;
  onSelect: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  const statusMap: Record<string, { label: string; color: any; barColor: string; dotColor: string }> = {
    active:    { label: 'Ativo',     color: 'success', barColor: '#15803D', dotColor: '#22c55e' },
    completed: { label: 'Concluído', color: 'info',    barColor: '#2563EB', dotColor: '#60a5fa' },
    'on-hold': { label: 'Em Espera', color: 'warning', barColor: '#C49A2A', dotColor: '#fbbf24' },
  };
  const s = statusMap[project.status] ?? statusMap['on-hold'];
  const prog = project.progress ?? 0;

  const headerGradient =
    project.status === 'active'    ? 'linear-gradient(135deg, #0D1F4E, #1A3070)' :
    project.status === 'completed' ? 'linear-gradient(135deg, #1e3a5f, #2563EB)' :
                                     'linear-gradient(135deg, #78350f, #C49A2A)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(project)}
      className="group relative rounded-3xl border cursor-pointer flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'white',
        borderColor: 'rgba(13,31,78,0.1)',
        boxShadow: '0 2px 16px rgba(13,31,78,0.06)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(13,31,78,0.14)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(13,31,78,0.06)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,31,78,0.1)';
      }}
    >
      {/* Top banner com gradiente */}
      <div className="relative px-6 pt-6 pb-10" style={{ background: headerGradient }}>
        {/* Dots decorativos */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 flex items-start justify-between">
          {/* Avatar do projeto */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)', color: '#C49A2A', backdropFilter: 'blur(4px)' }}>
            {project.name[0]}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={e => { e.stopPropagation(); onEdit(project); }}
              className="p-2 rounded-xl transition-all hover:bg-white/20"
              title="Editar projeto"
            >
              <Settings className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(project); }}
              className="p-2 rounded-xl transition-all hover:bg-red-500/20"
              title="Remover projeto"
            >
              <Trash2 className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="relative z-10 mt-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(4px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dotColor }} />
            {s.label}
          </span>
        </div>
      </div>

      {/* Conteúdo principal — levemente sobrepostos ao banner */}
      <div className="-mt-5 mx-4 px-5 pt-5 pb-6 flex flex-col flex-1 rounded-2xl border bg-white z-10 relative" style={{ borderColor: 'rgba(13,31,78,0.07)' }}>
        {/* Nome e descrição */}
        <h3 className="font-black text-base leading-tight tracking-tight mb-1.5 group-hover:text-[#C49A2A] transition-colors" style={{ color: '#0D1F4E' }}>
          {project.name}
        </h3>
        <p className="text-xs leading-relaxed mb-5 line-clamp-2" style={{ color: '#64748b' }}>
          {project.description || 'Nenhuma descrição adicionada para este projeto.'}
        </p>

        {/* Progress */}
        <div className="mb-5 p-4 rounded-2xl border space-y-2.5" style={{ background: 'rgba(240,242,248,0.5)', borderColor: 'rgba(13,31,78,0.06)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso</span>
            <span className="text-sm font-black" style={{ color: s.barColor }}>{prog}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prog}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 + 0.3 }}
              className="h-full rounded-full"
              style={{ background: s.barColor }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              {prog === 0 ? 'Não iniciado' : prog < 30 ? 'Iniciando' : prog < 70 ? 'Em andamento' : prog < 100 ? 'Quase lá' : 'Concluído'}
            </span>
            {prog === 100 && (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#15803D' }} />
            )}
          </div>
        </div>

        {/* Rodapé com meta-info */}
        <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(13,31,78,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,31,78,0.07)' }}>
              <Users className="w-3 h-3" style={{ color: '#0D1F4E' }} />
            </div>
            <span className="text-xs font-bold text-slate-500 truncate max-w-[100px]">{project.clientName || 'Geral'}</span>
          </div>

          <div className="flex items-center gap-2">
            {project.deadline && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400">
                  {format(new Date(project.deadline), 'dd MMM', { locale: ptBR })}
                </span>
              </div>
            )}
            {project.visibility === 'private' && (
              <span title="Projeto privado"><Lock className="w-3 h-3 text-slate-300" /></span>
            )}
          </div>
        </div>

        {/* Hover CTA */}
        <motion.div
          className="absolute bottom-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
          style={{ background: '#0D1F4E', boxShadow: '0 4px 14px rgba(13,31,78,0.3)' }}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProjectsList({ projects, onSelect, onEdit }: ProjectsListProps) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'on-hold'>('all');

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
      setProjectToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const counts = {
    all: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    'on-hold': projects.filter(p => p.status === 'on-hold').length,
  };

  const filters: { key: typeof filter; label: string; icon: any; color: string; bg: string }[] = [
    { key: 'all',       label: 'Todos',     icon: Briefcase,    color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)' },
    { key: 'active',    label: 'Ativos',    icon: Rocket,       color: '#15803D', bg: 'rgba(21,128,61,0.1)' },
    { key: 'completed', label: 'Concluídos',icon: CheckCircle2, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
    { key: 'on-hold',   label: 'Em Espera', icon: AlertCircle,  color: '#C49A2A', bg: 'rgba(196,154,42,0.1)' },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* Manual do sistema — accordion */}
      <SystemManual />

      {/* Filtros rápidos */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 border"
            style={filter === f.key
              ? { background: f.color, color: 'white', borderColor: f.color, boxShadow: `0 4px 14px ${f.color}35` }
              : { background: 'white', color: '#64748b', borderColor: 'rgba(13,31,78,0.1)' }
            }
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
            <span
              className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black"
              style={filter === f.key
                ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                : { background: f.bg, color: f.color }
              }
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid de projetos */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={Briefcase}
              title="Nenhum projeto encontrado"
              description="Crie um novo projeto ou ajuste o filtro acima."
              className="py-28"
            />
          </motion.div>
        ) : (
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={setProjectToDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Arquivar Projeto"
        message={`Tem certeza que deseja remover o projeto "${projectToDelete?.name}"? Todas as funcionalidades e logs serão movidos para o lixo.`}
      />
    </div>
  );
}
