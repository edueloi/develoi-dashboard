import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Settings, Trash2, Users, Calendar, Rocket, Briefcase, ArrowRight,
  BookOpen, ChevronDown, ChevronUp, Monitor, Globe, Kanban, MessageSquare,
  ShieldCheck, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Zap, List, BarChart2, Star, Lock, Unlock, Info, ExternalLink
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
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(project)}
      className="group relative rounded-2xl border cursor-pointer flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 h-full min-w-0"
      style={{
        background: 'white',
        borderColor: 'rgba(13,31,78,0.1)',
        boxShadow: '0 2px 12px rgba(13,31,78,0.05)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(13,31,78,0.12)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.35)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(13,31,78,0.05)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,31,78,0.1)';
      }}
    >
      {/* Top banner compacto */}
      <div className="relative px-4 pt-4 pb-6 bg-cover bg-center" style={{ background: project.coverImage ? undefined : headerGradient, backgroundImage: project.coverImage ? `linear-gradient(rgba(6,17,43,0.55), rgba(6,17,43,0.55)), url(${project.coverImage})` : undefined }}>
        {/* Dots decorativos */}
        {!project.coverImage && (
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        )}
        <div className="relative z-10 flex items-start justify-between gap-2">
          {/* Avatar / logo do projeto */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)', color: '#C49A2A', backdropFilter: 'blur(4px)' }}>
            {project.logoUrl ? (
              <img src={project.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              project.name[0]
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onEdit(project); }}
              className="p-1.5 rounded-lg transition-all hover:bg-white/20"
              title="Editar projeto"
            >
              <Settings className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(project); }}
              className="p-1.5 rounded-lg transition-all hover:bg-red-500/20"
              title="Remover projeto"
            >
              <Trash2 className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="relative z-10 mt-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(4px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dotColor }} />
            {s.label}
          </span>
        </div>
      </div>

      {/* Conteúdo principal — levemente sobrepostos ao banner */}
      <div className="-mt-4 mx-3 px-4 pt-4 pb-5 flex flex-col flex-1 min-w-0 rounded-2xl border bg-white z-10 relative" style={{ borderColor: 'rgba(13,31,78,0.07)' }}>
        {/* Nome e descrição */}
        <h3 className="font-black text-sm leading-tight tracking-tight mb-1.5 truncate group-hover:text-[#C49A2A] transition-colors" style={{ color: '#0D1F4E' }} title={project.name}>
          {project.name}
        </h3>
        <p className="text-xs leading-relaxed mb-4 line-clamp-2 min-h-[2.2em]" style={{ color: '#64748b' }}>
          {project.description || 'Nenhuma descrição adicionada para este projeto.'}
        </p>

        {/* Progress */}
        <div className="mb-4 p-3 rounded-xl border space-y-2" style={{ background: 'rgba(240,242,248,0.5)', borderColor: 'rgba(13,31,78,0.06)' }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">Progresso</span>
            <span className="text-xs font-black flex-shrink-0" style={{ color: s.barColor }}>{prog}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prog}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 + 0.2 }}
              className="h-full rounded-full"
              style={{ background: s.barColor }}
            />
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest truncate">
              {prog === 0 ? 'Não iniciado' : prog < 30 ? 'Iniciando' : prog < 70 ? 'Em andamento' : prog < 100 ? 'Quase lá' : 'Concluído'}
            </span>
            {prog === 100 && (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#15803D' }} />
            )}
          </div>
        </div>

        {/* Rodapé com meta-info */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3" style={{ borderTop: '1px solid rgba(13,31,78,0.06)' }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,31,78,0.07)' }}>
              <Users className="w-3 h-3" style={{ color: '#0D1F4E' }} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 truncate">{project.clientName || 'Geral'}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {project.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-300 flex-shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                  {format(new Date(project.deadline), 'dd MMM', { locale: ptBR })}
                </span>
              </div>
            )}
            {project.visibility === 'private' && (
              <span title="Projeto privado"><Lock className="w-3 h-3 text-slate-300 flex-shrink-0" /></span>
            )}
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title="Abrir projeto"
                className="text-slate-300 hover:text-[#0D1F4E] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Hover CTA */}
        <motion.div
          className="absolute bottom-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
          style={{ background: '#0D1F4E', boxShadow: '0 4px 14px rgba(13,31,78,0.3)' }}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ProjectGridCard({ project, index, onSelect, onEdit, onDelete }: {
  project: Project;
  index: number;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const config = {
    active: { label: 'Em andamento', color: '#15803D', bg: 'rgba(21,128,61,0.10)' },
    completed: { label: 'Concluído', color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
    'on-hold': { label: 'Em espera', color: '#C49A2A', bg: 'rgba(196,154,42,0.12)' },
  }[project.status] ?? { label: 'Em espera', color: '#C49A2A', bg: 'rgba(196,154,42,0.12)' };
  const progress = project.progress ?? 0;

  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} onClick={() => onSelect(project)} className="group flex min-w-0 cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0D1F4E]/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-[#0D1F4E]">{project.name.slice(0, 1).toUpperCase()}</span>
            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{project.category || 'Projeto digital'}</span>
          </div>
          <h3 className="truncate text-sm font-black tracking-tight text-[#0D1F4E]" title={project.name}>{project.name}</h3>
        </div>
        <span className="shrink-0 rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider" style={{ background: config.bg, color: config.color }}>{config.label}</span>
      </div>
      <p className="mt-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500 line-clamp-2">{project.description || 'Sem descrição cadastrada.'}</p>
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400"><span>Progresso</span><span style={{ color: config.color }}>{progress}%</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: index * 0.03 + 0.15 }} className="h-full rounded-full" style={{ background: config.color }} /></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="flex min-w-0 items-center gap-1.5 truncate"><Users className="h-3.5 w-3.5 text-slate-400" />{project.clientName || 'Interno'}</span>
        <span className="flex items-center justify-end gap-1.5 truncate">{project.deadline ? <><Calendar className="h-3.5 w-3.5 text-slate-400" />{format(new Date(project.deadline), 'dd/MM/yy', { locale: ptBR })}</> : <><Clock className="h-3.5 w-3.5 text-slate-400" />Sem prazo</>}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">{project.visibility === 'private' ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}{project.visibility === 'private' ? 'Privado' : 'Visível'}</span>
        <div className="flex items-center gap-1" onClick={event => event.stopPropagation()}>
          <button onClick={() => onEdit(project)} aria-label="Editar projeto" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#0D1F4E]"><Settings className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(project)} aria-label="Remover projeto" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
          <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#0D1F4E] text-white"><ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </motion.article>
  );
}

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
    <div className="space-y-4 pb-6">

      {/* Manual do sistema — accordion */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[#0D1F4E]">Projetos</h2>
          <p className="text-xs text-slate-400">Abra um projeto para acessar o resumo, backlog e quadro Kanban.</p>
        </div>
        <span className="text-xs font-bold text-slate-500">{counts.active} ativo{counts.active === 1 ? '' : 's'} de {counts.all}</span>
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 border"
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
              className="py-12"
            />
          </motion.div>
        ) : (
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {filtered.map((project, i) => (
              <ProjectGridCard
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
