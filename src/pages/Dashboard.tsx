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

  const [projectsLoaded, setProjectsLoaded] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const fetchProjects = async () => {
      try {
        const isAdmin = profile.role === 'admin' || profile.email?.toLowerCase() === 'admin@develoi.com.br' || profile.email?.toLowerCase() === 'edueloi.ee@gmail.com';
        const response = await fetch(`/api/projects?userId=${profile.uid}&isAdmin=${isAdmin}`);
        const data = await response.json();
        setProjects(data);
        if (data.length > 0 && !projectsLoaded) {
          setProjectsLoaded(true);
          const fromUrl = projetoParam ? data.find((p: Project) => p.id === projetoParam) : null;
          setSelectedProject(fromUrl || data[0]);
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
  };

  const hideSelectorTabs: ActiveTab[] = ['projects', 'members', 'portfolio', 'team', 'site-values', 'blog', 'cases', 'bot'];

  return (
    <div className={`min-h-screen flex dash-bg font-sans ${isDark ? 'dark' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-40 lg:z-auto
        w-72 flex flex-col
        dash-surface border-r dash-border
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b dash-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-base">D</span>
            </div>
            <div>
              <p className="font-black text-sm dash-text tracking-tight">DEVELOI</p>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Hub</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg dash-text-2 hover:dash-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {/* Geral */}
          <NavSection label="Geral">
            <NavItem icon={LayoutDashboard} label="Visão Geral" active={activeTab === 'overview'} onClick={() => goTo('overview')} />
            {selectedProject && <NavItem icon={Briefcase} label="Resumo Projeto" active={activeTab === 'summary'} onClick={() => goTo('summary')} />}
            <NavItem icon={FolderOpen} label="Projetos" active={activeTab === 'projects'} onClick={() => goTo('projects')} />
          </NavSection>

          {/* Projeto selecionado */}
          {selectedProject && (
            <NavSection label={selectedProject.name}>
              <NavItem icon={ListTodo} label="Backlog" active={activeTab === 'backlog'} onClick={() => goTo('backlog')} />
              <NavItem icon={Kanban} label="Quadro" active={activeTab === 'board'} onClick={() => goTo('board')} />
              <NavItem icon={Calendar} label="Cronograma" active={activeTab === 'timeline'} onClick={() => goTo('timeline')} />
            </NavSection>
          )}

          {/* Equipe */}
          <NavSection label="Equipe">
            <NavItem icon={ShieldCheck} label="Qualidade" active={activeTab === 'tests'} onClick={() => goTo('tests')} />
            <NavItem icon={Users} label="Membros" active={activeTab === 'members'} onClick={() => goTo('members')} />
            <NavItem icon={MessageSquare} label="Chat" active={activeTab === 'chat'} onClick={() => goTo('chat')} />
          </NavSection>

          {/* Site Público */}
          <NavSection label="Site Público">
            <NavItem icon={Globe} label="Portfólio" active={activeTab === 'portfolio'} onClick={() => goTo('portfolio')} />
            <NavItem icon={Users2} label="Nossa Equipe" active={activeTab === 'team'} onClick={() => goTo('team')} />
            <NavItem icon={Heart} label="Missão & Valores" active={activeTab === 'site-values'} onClick={() => goTo('site-values')} />
            <NavItem icon={BookOpen} label="Blog" active={activeTab === 'blog'} onClick={() => goTo('blog')} />
            <NavItem icon={Star} label="Cases de Sucesso" active={activeTab === 'cases'} onClick={() => goTo('cases')} />
          </NavSection>

          {/* Sistema */}
          <NavSection label="Sistema">
            <NavItem icon={MessageSquare} label="Bot de Atendimento" active={activeTab === 'bot'} onClick={() => goTo('bot')} />
          </NavSection>
        </nav>

        {/* User footer */}
        <div className="p-4 border-t dash-border">
          <div className="flex items-center gap-3 mb-3">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {profile?.displayName?.[0]?.toUpperCase() ?? 'D'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold dash-text truncate">{profile?.displayName}</p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{profile?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border dash-border dash-text-2 hover:border-indigo-400 hover:text-indigo-500 transition-all text-xs font-bold dash-surface-2"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl border dash-border dash-text-2 hover:border-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top header */}
        <header className="dash-surface border-b dash-border px-4 lg:px-6 py-3.5 flex items-center gap-4 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl border dash-border dash-text-2 hover:text-indigo-600 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black dash-text truncate">{tabTitles[activeTab]}</h1>
            <p className="text-xs dash-text-muted hidden sm:block">
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
                className="text-xs font-bold dash-surface border dash-border dash-text rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 transition-colors max-w-[200px]"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {activeTab === 'projects' && (
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Projeto
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-6 pb-12">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
                  {/* Global Stats Grid */}
                  <StatGrid cols={3}>
                    <StatCard
                      title="Projetos Ativos"
                      value={projects.filter(p => p.status === 'active').length}
                      icon={Rocket}
                      color="success"
                      delay={0.1}
                    />
                    <StatCard
                      title="Tickets Pendentes"
                      value={12}
                      icon={AlertCircle}
                      color="warning"
                      trend={{ value: 5, isUp: false }}
                      delay={0.2}
                    />
                    <StatCard
                      title="Horas Totais"
                      value="164h"
                      icon={Clock}
                      color="info"
                      delay={0.3}
                    />
                  </StatGrid>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Activity Feed */}
                    <PanelCard
                      title="Atividade Recente"
                      icon={History}
                      description="Últimas movimentações no seu ecossistema"
                    >
                      <div className="divide-y divide-zinc-100 dark:divide-white/5">
                        {[1, 2].map((_, i) => (
                          <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors rounded-xl px-2 -mx-2">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", i === 0 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600")}>
                              {i === 0 ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold dash-text truncate">{i === 0 ? 'Ajuste de layout do dashboard' : 'Implementação de filtros no backlog'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] dash-text-muted uppercase font-black tracking-widest">DEV-102{4+i}</span>
                                <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-white/20" />
                                <Badge color={i === 0 ? "success" : "info"} size="sm">{i === 0 ? 'Concluído' : 'Em Progresso'}</Badge>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 dash-text-muted" />
                          </div>
                        ))}
                      </div>
                    </PanelCard>

                    {/* Deliveries Timeline */}
                    <PanelCard
                      title="Próximas Entregas"
                      icon={Calendar}
                      description="Cronograma das próximas 48 horas"
                    >
                      <div className="space-y-6">
                        {[1, 2].map((_, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-black dash-text uppercase tracking-wide">{i === 0 ? 'Sprint Agendelle #12' : 'Refatoração MySQL'}</h4>
                              <span className="text-[10px] font-bold text-indigo-600">{i === 0 ? '85%' : '40%'}</span>
                            </div>
                            <ProgressBar progress={i === 0 ? 85 : 40} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </PanelCard>
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
    <div className="mb-2">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] dash-text-muted px-3 mb-1 mt-3">{label}</p>
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left ${
        active
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold'
          : 'dash-text-2 hover:dash-surface-2 hover:dash-text font-medium'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'dash-text-muted group-hover:dash-text-2'}`} />
      <span className="text-sm flex-1 truncate">{label}</span>
      {badge && (
        <span className="w-5 h-5 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">{badge > 9 ? '9+' : badge}</span>
      )}
      {active && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
    </button>
  );
}

function EmptyProjectState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
        <Briefcase className="w-10 h-10 text-indigo-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum Projeto Selecionado</h3>
      <p className="text-slate-500 text-sm mb-8 max-w-xs text-center">Crie um novo projeto ou selecione um existente para começar.</p>
      <Button onClick={onAction}><Plus className="w-4 h-4 mr-2" /> CRIAR PRIMEIRO PROJETO</Button>
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

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/20 transition-colors" />
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-black text-white leading-tight">Pronto para a próxima fase?</h4>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed">
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
