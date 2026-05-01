import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, MessageSquare, Settings, LogOut, Plus,
  Search, CheckCircle2, Clock, AlertCircle, Send, ChevronRight,
  ShieldCheck, Rocket, Users, Calendar, MoreVertical, Trash2,
  ArrowRight, Briefcase, ChevronUp, ChevronDown, Edit2, Target,
  TrendingUp, Share2, MoreHorizontal, Link2, History,
  Globe, Heart, Star, Save, X, ExternalLink, UserPlus, Pencil, Eye,
  Sparkles, Image, BookOpen, Moon, Sun, Menu, FolderOpen, ListTodo, Users2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
const DraggableComponent = Draggable as any;
const DroppableComponent = Droppable as any;
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';

// UI components
import { 
  Button, 
  Modal, 
  ConfirmModal, 
  Badge, 
  ProgressBar,
  SectionTitle,
  StatGrid,
  StatCard,
  PanelCard,
  ContentCard,
  Divider,
  GridTable,
  Input,
  Select,
  Textarea,
  EmptyState,
  Column
} from '../components/ui';

// Dashboard feature components
import { ChatRoom } from '../components/dashboard/ChatRoom';
import { MembersArea } from '../components/dashboard/MembersArea';
import { TestModule } from '../components/dashboard/TestModule';
import { ProjectsList } from '../components/dashboard/ProjectsList';
import { PortfolioManager } from '../components/dashboard/PortfolioManager';
import { TeamManager } from '../components/dashboard/TeamManager';
import { SiteValuesManager } from '../components/dashboard/SiteValuesManager';
import { BlogManager } from '../components/dashboard/BlogManager';
import { CasesManager } from '../components/dashboard/CasesManager';
import { AgileManager } from '../components/dashboard/AgileManager';
import { TimelineView } from '../components/dashboard/TimelineView';
import { BotConfigTab } from '../components/dashboard/BotConfigTab';

// Types
import type { Project, Feature, Message, ActiveTab } from '../components/dashboard/types';
import { PostCreatorTab } from '../components/dashboard/PostCreatorTab';

// ─── Shared helpers ───────────────────────────────────────────────────────────

enum OperationType { CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write' }

function handleApiError(error: unknown, op: OperationType, path: string | null) {
  console.error(`API Error (${op}) on ${path}:`, error);
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

// ─── URL ↔ Tab mapping ────────────────────────────────────────────────────────

const TAB_TO_PATH: Record<ActiveTab, string> = {
  overview:      '/dashboard',
  summary:       '/dashboard/resumo',
  projects:      '/dashboard/projetos',
  backlog:       '/dashboard/backlog',
  board:         '/dashboard/quadro',
  timeline:      '/dashboard/cronograma',
  tests:         '/dashboard/qualidade',
  members:       '/dashboard/membros',
  chat:          '/dashboard/chat',
  portfolio:     '/dashboard/portfolio',
  team:          '/dashboard/equipe',
  'site-values': '/dashboard/valores',
  blog:          '/dashboard/blog',
  cases:         '/dashboard/cases',
  bot:           '/dashboard/bot',
  posts:         '/dashboard/postagens',
};

const PATH_TO_TAB: Record<string, ActiveTab> = Object.fromEntries(
  Object.entries(TAB_TO_PATH).map(([tab, path]) => [path, tab as ActiveTab])
);

function pathToTab(pathname: string): ActiveTab {
  return PATH_TO_TAB[pathname] ?? 'overview';
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = pathToTab(location.pathname);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restore selected project from URL param ?projeto=ID
  const searchParams = new URLSearchParams(location.search);
  const projetoParam = searchParams.get('projeto');

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!profile) return;
    const fetchProjects = async () => {
      try {
        const isAdmin = profile.role === 'admin' || profile.email?.toLowerCase() === 'admin@develoi.com.br' || profile.email?.toLowerCase() === 'edueloi.ee@gmail.com';
        const response = await fetch(`/api/projects?userId=${profile.uid}&isAdmin=${isAdmin}`);
        const data = await response.json();
        setProjects(data);
        
        if (data.length > 0 && !hasLoadedRef.current) {
          hasLoadedRef.current = true;
          const currentParams = new URLSearchParams(window.location.search);
          const currentProjParam = currentParams.get('projeto');
          const fromUrl = currentProjParam ? data.find((p: Project) => p.id === currentProjParam) : null;
          setSelectedProject(fromUrl || data[0]);
        } else if (data.length > 0) {
          // Keep selectedProject up to date with new data (like progress/status changes) without overriding selection
          setSelectedProject(prev => {
            if (!prev) return null;
            return data.find((p: Project) => p.id === prev.id) || prev;
          });
        }
      } catch (error) {
        handleApiError(error, OperationType.LIST, 'projects');
      }
    };
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const goTo = (tab: ActiveTab, project?: Project | null) => {
    const proj = project !== undefined ? project : selectedProject;
    const path = TAB_TO_PATH[tab];
    const needsProject: ActiveTab[] = ['backlog', 'board', 'timeline', 'tests', 'chat', 'summary'];
    const qs = needsProject.includes(tab) && proj ? `?projeto=${proj.id}` : '';
    navigate(path + qs);
    setSidebarOpen(false);
  };

  const tabTitles: Record<ActiveTab, string> = {
    overview: 'Para você',
    summary: `Resumo: ${selectedProject?.name ?? ''}`,
    backlog: 'Backlog',
    board: 'Quadro',
    timeline: 'Cronograma',
    projects: 'Todos os Projetos',
    tests: 'Controle de Qualidade',
    members: 'Área de Membros',
    chat: 'Comunicação Interna',
    portfolio: 'Portfólio Público',
    team: 'Nossa Equipe',
    'site-values': 'Missão & Valores',
    blog: 'Blog da Develoi',
    cases: 'Cases de Sucesso',
    bot: 'Bot de Atendimento',
    posts: 'Criador de Postagens',
  };

  const hideSelectorTabs: ActiveTab[] = ['projects', 'members', 'portfolio', 'team', 'site-values', 'blog', 'cases', 'bot', 'posts'];

  return (
    <div className={`min-h-screen flex font-sans ${isDark ? 'dark' : ''}`} style={{ background: isDark ? '#0B1120' : '#F0F2F8' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — navy sólido */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-40 lg:z-auto
        w-64 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#06112B' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--brand-gold)', boxShadow: '0 4px 12px rgba(196,154,42,0.4)' }}
            >
              <span className="text-[#0D1F4E] font-black text-sm">D</span>
            </div>
            <div>
              <p className="font-black text-sm text-white tracking-tight leading-none">DEVELOI</p>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(196,154,42,0.7)' }}>Hub</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          <NavSection label="Geral">
            <NavItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'overview'} onClick={() => goTo('overview')} />
            {selectedProject && <NavItem icon={Briefcase} label="Resumo Projeto" active={activeTab === 'summary'} onClick={() => goTo('summary')} />}
            <NavItem icon={FolderOpen} label="Projetos" active={activeTab === 'projects'} onClick={() => goTo('projects')} />
          </NavSection>

          {selectedProject && (
            <NavSection label={selectedProject.name}>
              <NavItem icon={ListTodo} label="Backlog" active={activeTab === 'backlog'} onClick={() => goTo('backlog')} />
              <NavItem icon={Kanban} label="Quadro" active={activeTab === 'board'} onClick={() => goTo('board')} />
              <NavItem icon={Calendar} label="Cronograma" active={activeTab === 'timeline'} onClick={() => goTo('timeline')} />
            </NavSection>
          )}

          <NavSection label="Equipe">
            <NavItem icon={ShieldCheck} label="Qualidade" active={activeTab === 'tests'} onClick={() => goTo('tests')} />
            <NavItem icon={Users} label="Membros" active={activeTab === 'members'} onClick={() => goTo('members')} />
            <NavItem icon={MessageSquare} label="Chat" active={activeTab === 'chat'} onClick={() => goTo('chat')} />
          </NavSection>

          <NavSection label="Site Público">
            <NavItem icon={Globe} label="Portfólio" active={activeTab === 'portfolio'} onClick={() => goTo('portfolio')} />
            <NavItem icon={Users2} label="Nossa Equipe" active={activeTab === 'team'} onClick={() => goTo('team')} />
            <NavItem icon={Heart} label="Missão & Valores" active={activeTab === 'site-values'} onClick={() => goTo('site-values')} />
            <NavItem icon={BookOpen} label="Blog" active={activeTab === 'blog'} onClick={() => goTo('blog')} />
            <NavItem icon={Star} label="Nossos Projetos" active={activeTab === 'cases'} onClick={() => goTo('cases')} />
          </NavSection>

          <NavSection label="Sistema">
            <NavItem icon={Image} label="Criador de Postagens" active={activeTab === 'posts'} onClick={() => goTo('posts')} />
            <NavItem icon={MessageSquare} label="Bot de Atendimento" active={activeTab === 'bot'} onClick={() => goTo('bot')} />
          </NavSection>
        </nav>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 mb-3">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-9 h-9 rounded-xl object-cover ring-2 ring-white/10" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: 'var(--brand-gold)' }}>
                <span style={{ color: '#0D1F4E' }}>{profile?.displayName?.[0]?.toUpperCase() ?? 'D'}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.displayName}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(196,154,42,0.7)' }}>{profile?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDark ? 'Claro' : 'Escuro'}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.2)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top header */}
        <header className="bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-white/5 px-4 lg:px-6 py-3.5 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#0D1F4E] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black tracking-tight truncate" style={{ color: '#0D1F4E' }}>{tabTitles[activeTab]}</h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {activeTab === 'overview' ? `Bem-vindo de volta, ${profile?.displayName?.split(' ')[0]}` : 'Develoi Hub'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!hideSelectorTabs.includes(activeTab) && projects.length > 0 && (
              <select
                value={selectedProject?.id}
                onChange={(e) => {
                  const proj = projects.find(p => p.id === e.target.value) || null;
                  setSelectedProject(proj);
                  goTo(activeTab, proj);
                }}
                className="text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0D1F4E] transition-colors max-w-[200px]"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {activeTab === 'projects' && (
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90"
                style={{ background: '#0D1F4E' }}
              >
                <Plus className="w-3.5 h-3.5" /> Novo Projeto
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: isDark ? '#0B1120' : '#F0F2F8' }}>
          <div className="p-4 lg:p-6 pb-12">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">

                  {/* Saudação */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                        Olá, {profile?.displayName?.split(' ')[0]} 👋
                      </h2>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsNewProjectModalOpen(true)}
                      className="hidden sm:flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: '#0D1F4E', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo Projeto
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Projetos Ativos', value: projects.filter(p => p.status === 'active').length, icon: Rocket, color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)', sub: 'em andamento' },
                      { label: 'Concluídos', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle2, color: '#15803D', bg: 'rgba(21,128,61,0.08)', sub: 'projetos entregues' },
                      { label: 'Tickets Abertos', value: 12, icon: AlertCircle, color: '#C49A2A', bg: 'rgba(196,154,42,0.08)', sub: 'pendentes' },
                      { label: 'Horas Totais', value: '164h', icon: Clock, color: '#2563EB', bg: 'rgba(37,99,235,0.08)', sub: 'registradas' },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="bg-white dark:bg-white/5 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-white/10 group hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: s.bg }}
                          >
                            <s.icon className="w-5 h-5" style={{ color: s.color }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.sub}</span>
                        </div>
                        <p className="text-2xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{s.value}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Linha média: Projetos recentes + Entregas */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* Projetos recentes — col span 3 */}
                    <div className="lg:col-span-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(13,31,78,0.08)' }}>
                            <FolderOpen className="w-4 h-4" style={{ color: '#0D1F4E' }} />
                          </div>
                          <div>
                            <p className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Projetos Recentes</p>
                            <p className="text-[10px] text-slate-400">Últimos atualizados</p>
                          </div>
                        </div>
                        <button
                          onClick={() => goTo('projects')}
                          className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors hover:opacity-70"
                          style={{ color: '#0D1F4E' }}
                        >
                          Ver todos <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {projects.slice(0, 4).length === 0 ? (
                          <div className="px-6 py-8 text-center text-sm text-slate-400">Nenhum projeto ainda.</div>
                        ) : projects.slice(0, 4).map((proj, i) => (
                          <button
                            key={proj.id}
                            onClick={() => { setSelectedProject(proj); goTo('summary', proj); }}
                            className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group/row"
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                              style={{ background: ['#0D1F4E','#C49A2A','#15803D','#2563EB'][i % 4] }}
                            >
                              {proj.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{proj.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">{proj.clientName || 'Cliente'}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="hidden sm:block w-20">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[10px] font-bold text-slate-400">{proj.progress ?? 0}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${proj.progress ?? 0}%`, background: proj.status === 'completed' ? '#15803D' : '#C49A2A' }}
                                  />
                                </div>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide ${
                                proj.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                                proj.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                                'bg-yellow-50 text-yellow-600'
                              }`}>
                                {proj.status === 'active' ? 'Ativo' : proj.status === 'completed' ? 'Entregue' : 'Espera'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Próximas entregas — col span 2 */}
                    <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,154,42,0.1)' }}>
                          <Calendar className="w-4 h-4" style={{ color: '#C49A2A' }} />
                        </div>
                        <div>
                          <p className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Próximas Entregas</p>
                          <p className="text-[10px] text-slate-400">Sprints em andamento</p>
                        </div>
                      </div>
                      <div className="p-6 space-y-5">
                        {[
                          { name: 'Sprint Agendelle #12', pct: 85, color: '#15803D' },
                          { name: 'Refatoração MySQL', pct: 40, color: '#C49A2A' },
                          { name: 'Módulo Relatórios', pct: 20, color: '#2563EB' },
                        ].map((item) => (
                          <div key={item.name}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold truncate max-w-[140px]" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{item.name}</p>
                              <span className="text-[10px] font-black" style={{ color: item.color }}>{item.pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.pct}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="h-full rounded-full"
                                style={{ background: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Atividade recente */}
                  <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.08)' }}>
                        <History className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Atividade Recente</p>
                        <p className="text-[10px] text-slate-400">Últimas movimentações</p>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {[
                        { title: 'Ajuste de layout do dashboard', key: 'DEV-1024', status: 'Concluído', color: 'emerald' },
                        { title: 'Implementação de filtros no backlog', key: 'DEV-1025', status: 'Em Progresso', color: 'blue' },
                        { title: 'Correção de bug no módulo de chat', key: 'DEV-1026', status: 'Em Teste', color: 'yellow' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            item.color === 'emerald' ? 'bg-emerald-500' :
                            item.color === 'blue' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`} />
                          <p className="text-sm font-medium flex-1 truncate" style={{ color: isDark ? '#fff' : '#1e293b' }}>{item.title}</p>
                          <span className="text-[10px] font-black text-slate-400 hidden sm:block">{item.key}</span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wide flex-shrink-0 ${
                            item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                            item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                            'bg-yellow-50 text-yellow-600'
                          }`}>{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}

              {activeTab === 'summary' && selectedProject && (
                <ProjectSummary project={selectedProject} />
              )}

              {activeTab === 'projects' && (
                <ProjectsList
                  projects={projects}
                  onSelect={(p) => { setSelectedProject(p); goTo('summary', p); }}
                  onEdit={(p) => setEditingProject(p)}
                />
              )}

              {activeTab === 'backlog' && (
                selectedProject
                  ? <AgileManager projectId={selectedProject.id} view="backlog" />
                  : <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )}

              {activeTab === 'board' && (
                selectedProject
                  ? <AgileManager projectId={selectedProject.id} view="board" />
                  : <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )}

              {activeTab === 'tests' && (
                selectedProject
                  ? <TestModule projectId={selectedProject.id} />
                  : <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )}

              {activeTab === 'members' && <MembersArea />}

              {activeTab === 'timeline' && (
                selectedProject
                  ? <TimelineView projectId={selectedProject.id} />
                  : <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )}

              {activeTab === 'chat' && (
                selectedProject
                  ? <ChatRoom projectId={selectedProject.id} />
                  : <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )}

              {activeTab === 'portfolio' && <PortfolioManager projects={projects} />}
              {activeTab === 'team' && <TeamManager />}
              {activeTab === 'site-values' && <SiteValuesManager />}
              {activeTab === 'blog' && <BlogManager />}
              {activeTab === 'cases' && <CasesManager />}
              {activeTab === 'bot' && <BotConfigTab />}
              {activeTab === 'posts' && <PostCreatorTab />}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modals */}
      {isNewProjectModalOpen && <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} />}
      {editingProject && <EditProjectModal project={editingProject} onClose={() => setEditingProject(null)} />}
    </div>
  );
}

// ─── Shared UI sub-components ────────────────────────────────────────────────

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] px-3 mb-1 mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, badge }: {
  icon: any; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left"
      style={{
        background: active ? 'rgba(196,154,42,0.15)' : 'transparent',
        color: active ? 'var(--brand-gold)' : 'rgba(255,255,255,0.5)',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0 transition-colors"
        style={{ color: active ? 'var(--brand-gold)' : 'rgba(255,255,255,0.35)' }}
      />
      <span className="text-sm flex-1 truncate font-medium">{label}</span>
      {badge && (
        <span className="w-5 h-5 text-[#0D1F4E] text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-gold)' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {active && (
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--brand-gold)' }} />
      )}
    </button>
  );
}

function EmptyProjectState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(13,31,78,0.08)' }}>
        <Briefcase className="w-8 h-8" style={{ color: '#0D1F4E' }} />
      </div>
      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-1.5">Nenhum Projeto Selecionado</h3>
      <p className="text-slate-400 text-sm mb-7 max-w-xs text-center">Crie um novo projeto ou selecione um existente para começar.</p>
      <button
        onClick={onAction}
        className="flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all hover:opacity-90"
        style={{ background: '#0D1F4E', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
      >
        <Plus className="w-4 h-4" /> CRIAR PRIMEIRO PROJETO
      </button>
    </div>
  );
}


// ─── ProjectSummary ───────────────────────────────────────────────────────────

function ProjectSummary({ project }: { project: Project }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{project.name}</h2>
            <Badge color={project.status === 'active' ? 'success' : 'warning'} dot>
              {project.status === 'active' ? 'Ativo' : project.status === 'completed' ? 'Concluído' : 'Em Espera'}
            </Badge>
          </div>
          <p className="text-sm font-medium text-zinc-400">Espaço de software • Gerenciado por Equipe Develoi</p>
        </div>
        <Button variant="outline" iconLeft={<Settings className="w-4 h-4" />} onClick={() => setIsEditModalOpen(true)}>
          CONFIGURAÇÕES DO PROJETO
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PanelCard 
            title="Descrição do Projeto" 
            icon={Briefcase}
            className="h-full"
          >
            <p className="text-zinc-600 leading-relaxed font-medium">
              {project.description || 'Nenhuma descrição detalhada fornecida para este projeto.'}
            </p>
          </PanelCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PanelCard title="Metas & Objetivos" icon={Target}>
              <ul className="space-y-3">
                {project.goals && project.goals.length > 0 ? project.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:scale-150 transition-transform" />
                    <span className="text-sm font-bold text-zinc-700 leading-tight">{goal}</span>
                  </li>
                )) : <li className="text-sm text-zinc-400 italic">Nenhuma meta definida.</li>}
              </ul>
            </PanelCard>

            <PanelCard title="Financeiro & Orçamento" icon={TrendingUp}>
              <div className="text-sm font-bold text-zinc-700 whitespace-pre-wrap leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                {project.financials || 'Informações financeiras não disponíveis.'}
              </div>
            </PanelCard>
          </div>

          <PanelCard title="História & Contexto" icon={History}>
            <div className="text-sm font-medium text-zinc-600 leading-relaxed whitespace-pre-wrap">
              {project.history || 'O histórico deste projeto ainda não foi registrado.'}
            </div>
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Detalhes Rápidos" noPadding>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Cliente</span>
                <span className="text-sm font-black text-zinc-900">{project.clientName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-50">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Prazo Final</span>
                <span className="text-sm font-black text-zinc-900">
                  {project.deadline ? format(new Date(project.deadline), 'dd/MM/yyyy') : 'Não definido'}
                </span>
              </div>
              
              <div className="pt-4">
                <ProgressBar 
                  progress={project.progress ?? 0} 
                  color="bg-gradient-to-r from-amber-400 to-amber-600"
                  size="lg"
                />
              </div>
            </div>
          </PanelCard>

          <div className="p-8 rounded-2xl relative overflow-hidden group" style={{ background: 'linear-gradient(135deg, #0D1F4E 0%, #1A3070 100%)', boxShadow: '0 12px 40px rgba(13,31,78,0.25)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl opacity-30" style={{ background: 'var(--brand-gold)' }} />
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), rgba(196,154,42,0.2))' }} />
            <div className="relative z-10 space-y-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-gold)' }}>
                <Rocket className="w-5 h-5" style={{ color: '#0D1F4E' }} />
              </div>
              <h4 className="text-lg font-black text-white leading-tight">Pronto para a próxima fase?</h4>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Acompanhe as entregas e valide as funcionalidades no Quadro Kanban.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && <EditProjectModal project={project} onClose={() => setIsEditModalOpen(false)} />}
    </motion.div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goals, setGoals] = useState('');
  const [financials, setFinancials] = useState('');
  const [history, setHistory] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setMembers).catch(console.error);
  }, []);

  const toggleUser = (uid: string) => setAllowedUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uuidv4(), name, clientName: client, description: desc, deadline, visibility, allowedUsers: visibility === 'private' ? allowedUsers : [], status: 'active', progress: 0, goals: goals.split('\n').filter(g => g.trim()), financials, history }),
      });
      onClose();
    } catch (error) {
      handleApiError(error, OperationType.CREATE, 'projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Novo Projeto" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Nome do Projeto" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: PsiFlux" />
          <Input label="Cliente" required value={client} onChange={e => setClient(e.target.value)} placeholder="Ex: João Silva" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select label="Visibilidade" value={visibility} onChange={e => setVisibility(e.target.value as any)}>
            <option value="public">Público (Todos veem)</option>
            <option value="private">Privado (Apenas selecionados)</option>
          </Select>
          <Input label="Prazo Final" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>

        {visibility === 'private' && (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Quem pode ver?</p>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50/50 rounded-3xl border border-slate-100 custom-scrollbar">
              {members.map(member => (
                <button 
                  key={member.uid} 
                  type="button" 
                  onClick={() => toggleUser(member.uid)} 
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-2xl border transition-all text-left group/user",
                    allowedUsers.includes(member.uid) 
                      ? "bg-amber-50 border-amber-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-slate-300"
                  )}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">
                        {member.displayName?.[0]}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-bold truncate",
                    allowedUsers.includes(member.uid) ? "text-amber-700" : "text-slate-600"
                  )}>
                    {member.displayName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Qual o objetivo principal deste projeto?" rows={2} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea label="Metas (Uma por linha)" value={goals} onChange={e => setGoals(e.target.value)} placeholder="Meta 1&#10;Meta 2" rows={3} />
          <Textarea label="Financeiro" value={financials} onChange={e => setFinancials(e.target.value)} placeholder="Status de pagamento, orçamento..." rows={3} />
        </div>

        <Textarea label="História & Contexto" value={history} onChange={e => setHistory(e.target.value)} placeholder="Conte um pouco sobre como este projeto surgiu..." rows={2} />

        <Button type="submit" loading={loading} fullWidth size="lg">CRIAR PROJETO</Button>
      </form>
    </Modal>
  );
}

function EditProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.clientName);
  const [desc, setDesc] = useState(project.description);
  const [deadline, setDeadline] = useState(project.deadline || '');
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress || 0);
  const [goals, setGoals] = useState(project.goals?.join('\n') || '');
  const [financials, setFinancials] = useState(project.financials || '');
  const [history, setHistory] = useState(project.history || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(project.visibility || 'public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>(project.allowedUsers || []);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setMembers).catch(console.error);
  }, []);

  const toggleUser = (uid: string) => setAllowedUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, clientName: client, description: desc, deadline, status, progress, visibility, allowedUsers: visibility === 'private' ? allowedUsers : [], goals: goals.split('\n').filter(g => g.trim()), financials, history }),
      });
      onClose();
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Projeto" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Nome do Projeto" required value={name} onChange={e => setName(e.target.value)} />
          <Input label="Cliente" required value={client} onChange={e => setClient(e.target.value)} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="active">Ativo</option>
            <option value="completed">Concluído</option>
            <option value="on-hold">Em Espera</option>
          </Select>
          <Input label="Progresso (%)" type="number" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} />
          <Input label="Prazo Final" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>

        <Select label="Visibilidade" value={visibility} onChange={e => setVisibility(e.target.value as any)}>
          <option value="public">Público</option>
          <option value="private">Privado</option>
        </Select>

        {visibility === 'private' && (
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Quem pode ver?</p>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50/50 rounded-3xl border border-slate-100 custom-scrollbar">
              {members.map(member => (
                <button 
                  key={member.uid} 
                  type="button" 
                  onClick={() => toggleUser(member.uid)} 
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-2xl border transition-all text-left group/user",
                    allowedUsers.includes(member.uid) 
                      ? "bg-amber-50 border-amber-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-slate-300"
                  )}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">
                        {member.displayName?.[0]}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-bold truncate",
                    allowedUsers.includes(member.uid) ? "text-amber-700" : "text-slate-600"
                  )}>
                    {member.displayName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} rows={2} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea label="Metas (Uma por linha)" value={goals} onChange={e => setGoals(e.target.value)} rows={3} />
          <Textarea label="Financeiro" value={financials} onChange={e => setFinancials(e.target.value)} rows={3} />
        </div>

        <Textarea label="História & Contexto" value={history} onChange={e => setHistory(e.target.value)} rows={2} />

        <Button type="submit" loading={loading} fullWidth size="lg">SALVAR ALTERAÇÕES</Button>
      </form>
    </Modal>
  );
}

function FeatureDetailModal({ feature, onClose }: { feature: Feature; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="" size="xl">
      <div className="flex flex-col h-[85vh]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Briefcase className="w-3 h-3" />
            <span>Projetos</span>
            <span>/</span>
            <span className="text-indigo-600 font-bold uppercase">{feature.key || feature.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Share2 className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{feature.title}</h2>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">Descrição</h3>
                <div className="text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  {feature.description || 'Nenhuma descrição fornecida.'}
                </div>
              </section>

              {feature.testScenarios && (
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Cenários de Teste</h3>
                  <div className="text-sm text-slate-600 bg-amber-50/50 p-4 rounded-xl border border-amber-100 leading-relaxed whitespace-pre-wrap">{feature.testScenarios}</div>
                </section>
              )}

              {feature.businessRules && (
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Regras de Negócio</h3>
                  <div className="text-sm text-slate-600 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 leading-relaxed whitespace-pre-wrap">{feature.businessRules}</div>
                </section>
              )}
            </div>

            <div className="space-y-5">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                  <Badge color={feature.status === 'done' ? 'success' : feature.status === 'testing' ? 'warning' : 'info'}>
                    {feature.status === 'todo' ? 'A FAZER' : feature.status === 'in-progress' ? 'EM PROGRESSO' : feature.status === 'testing' ? 'EM TESTE' : 'CONCLUÍDO'}
                  </Badge>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Responsável</label>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">{feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}</div>
                    <span className="text-xs font-medium text-slate-700">{feature.assignedTo || 'Não atribuído'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Prioridade</label>
                  <Badge color={feature.priority === 'critical' ? 'danger' : feature.priority === 'high' ? 'warning' : 'info'}>{feature.priority || 'Média'}</Badge>
                </div>
                {feature.tags && feature.tags.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {feature.tags.map((tag, i) => <span key={i} className="text-[9px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase">{tag}</span>)}
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={onClose} className="w-full" variant="outline">FECHAR</Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function NewFeatureModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tests, setTests] = useState('');
  const [rules, setRules] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [type, setType] = useState<'story' | 'task' | 'bug' | 'epic'>('task');
  const [points, setPoints] = useState(1);
  const [tags, setTags] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const featureKey = `${projectId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uuidv4(), key: featureKey, projectId, title, description: desc, testScenarios: tests, businessRules: rules, priority, type, points, tags: tags.split(',').map(t => t.trim()).filter(t => t), deadline, status: 'todo', isValidated: 0, reporter: profile?.displayName || profile?.email }),
      });
      onClose();
    } catch (error) {
      handleApiError(error, OperationType.CREATE, `projects/${projectId}/features`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Funcionalidade" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Título do Ticket" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Login Social com Google" />
          <Select label="Nível de Prioridade" value={priority} onChange={e => setPriority(e.target.value as any)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica (Blocker)</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Tipo de Ticket" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="task">Tarefa</option>
            <option value="story">História de Usuário</option>
            <option value="bug">Bug / Defeito</option>
            <option value="epic">Épico</option>
          </Select>
          <Input label="Pontos (Story Points)" type="number" min="1" value={points} onChange={e => setPoints(Number(e.target.value))} />
          <Input label="Prazo Estimado" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>

        <Input label="Tags (separadas por vírgula)" value={tags} onChange={e => setTags(e.target.value)} placeholder="Ex: frontend, api, urgente" />

        <Textarea label="Descrição do Ticket" value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que deve ser desenvolvido?" rows={2} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea label="Cenários de Teste" value={tests} onChange={e => setTests(e.target.value)} placeholder="1. Dado que o usuário está na tela de login...&#10;2. Quando ele clica no botão..." rows={4} />
          <Textarea label="Regras de Negócio" value={rules} onChange={e => setRules(e.target.value)} placeholder="O usuário deve ter email verificado antes de permitir o login..." rows={4} />
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">LANÇAR FUNCIONALIDADE</Button>
      </form>
    </Modal>
  );
}

function EditFeatureModal({ projectId, feature, onClose }: { projectId: string; feature: Feature; onClose: () => void }) {
  const [title, setTitle] = useState(feature.title);
  const [desc, setDesc] = useState(feature.description);
  const [tests, setTests] = useState(feature.testScenarios || '');
  const [rules, setRules] = useState(feature.businessRules || '');
  const [priority, setPriority] = useState(feature.priority || 'medium');
  const [type, setType] = useState(feature.type || 'task');
  const [points, setPoints] = useState(feature.points || 1);
  const [tags, setTags] = useState(feature.tags?.join(', ') || '');
  const [deadline, setDeadline] = useState(feature.deadline || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, testScenarios: tests, businessRules: rules, priority, type, points, tags: tags.split(',').map(t => t.trim()).filter(t => t), deadline }),
      });
      onClose();
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `projects/${projectId}/features/${feature.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Funcionalidade" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Tipo" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="task">Tarefa</option>
            <option value="story">História</option>
            <option value="bug">Bug</option>
            <option value="epic">Épico</option>
          </Select>
          <Select label="Prioridade" value={priority} onChange={e => setPriority(e.target.value as any)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </Select>
          <Input label="Pontos" type="number" min="1" value={points} onChange={e => setPoints(Number(e.target.value))} />
        </div>

        <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} />

        <Input label="Tags (separadas por vírgula)" value={tags} onChange={e => setTags(e.target.value)} />

        <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea label="Cenários de Teste" value={tests} onChange={e => setTests(e.target.value)} rows={4} />
          <Textarea label="Regras de Negócio" value={rules} onChange={e => setRules(e.target.value)} rows={4} />
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">SALVAR ALTERAÇÕES</Button>
      </form>
    </Modal>
  );
}
