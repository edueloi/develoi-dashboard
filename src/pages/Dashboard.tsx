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
  ShoppingBag, BarChart2, PhoneCall, UserCircle, Zap, Camera, Loader2,
  DollarSign, Wallet, MessageCircle, Bell, Webhook, Compass,
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
  Column,
  Combobox,
  PageWrapper,
  IconButton
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
import { WhatsappInbox } from '../components/dashboard/WhatsappInbox';
import { WhatsappNewConversation } from '../components/dashboard/WhatsappNewConversation';
import { useWaCounts } from '../lib/useWaCounts';
import { PieChart } from 'lucide-react';
import { Bot as WaBotIcon, Clock as WaClockIcon, UserCheck as WaUserIcon, CheckCircle2 as WaDoneIcon, SendHorizonal as WaSendIcon } from 'lucide-react';
import { TeamNoticesTab } from '../components/dashboard/TeamNoticesTab';
import { WebhooksTab } from '../components/dashboard/WebhooksTab';

// Types
import type { Project, Feature, Message, ActiveTab, ProjectImage as ProjectImageType } from '../components/dashboard/types';
import { PostCreatorTab } from '../components/dashboard/PostCreatorTab';
import { SalesManager } from '../components/dashboard/SalesManager';
import { ClientsManager } from '../components/dashboard/ClientsManager';
import { ReceivablesManager } from '../components/dashboard/ReceivablesManager';
import { PayablesManager } from '../components/dashboard/PayablesManager';
import { LeadsManager } from '../components/dashboard/LeadsManager';
import { PartnersManager } from '../components/dashboard/PartnersManager';
import { BusinessPlanManager } from '../components/dashboard/BusinessPlanManager';
import { ProductsManager } from '../components/dashboard/ProductsManager';
import { ClientContactManager } from '../components/dashboard/ClientContactManager';
import { MyProfile } from '../components/dashboard/MyProfile';
import { ProjectAccessVault } from '../components/dashboard/ProjectAccessVault';
import { ProjectFormPage } from '../components/dashboard/ProjectFormPage';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { ProjectSummaryView } from '../components/dashboard/ProjectSummaryView';

// ─── Shared helpers ───────────────────────────────────────────────────────────

enum OperationType { CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write' }

function handleApiError(error: unknown, op: OperationType, path: string | null) {
  console.error(`API Error (${op}) on ${path}:`, error);
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

// ─── URL ↔ Tab mapping ────────────────────────────────────────────────────────

const TAB_TO_PATH: Record<ActiveTab, string> = {
  overview:        '/dashboard',
  summary:         '/dashboard/resumo',
  projects:        '/dashboard/projetos',
  backlog:         '/dashboard/backlog',
  board:           '/dashboard/quadro',
  timeline:        '/dashboard/cronograma',
  tests:           '/dashboard/qualidade',
  members:         '/dashboard/membros',
  chat:            '/dashboard/chat',
  portfolio:       '/dashboard/portfolio',
  team:            '/dashboard/equipe',
  'site-values':   '/dashboard/valores',
  blog:            '/dashboard/blog',
  cases:           '/dashboard/cases',
  bot:             '/dashboard/bot',
  'wa-inbox':      '/dashboard/atendimento',
  'wa-bot':        '/dashboard/atendimento/bot',
  'wa-queue':      '/dashboard/atendimento/fila',
  'wa-active':     '/dashboard/atendimento/em-andamento',
  'wa-closed':     '/dashboard/atendimento/finalizados',
  'wa-new':        '/dashboard/atendimento/nova',
  'team-notices':  '/dashboard/avisos',
  webhooks:        '/dashboard/webhooks',
  posts:           '/dashboard/postagens',
  sales:           '/dashboard/vendas',
  products:        '/dashboard/produtos',
  'client-contact':'/dashboard/contatos',
  clients:         '/dashboard/clientes',
  leads:           '/dashboard/prospeccao',
  receivables:     '/dashboard/contas-a-receber',
  payables:        '/dashboard/contas-a-pagar',
  partners:        '/dashboard/sociedade',
  'business-plan': '/dashboard/plano-de-negocio',
  'profile':       '/dashboard/perfil',
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
  const isAdmin = profile?.role === 'admin' || profile?.email?.toLowerCase() === 'admin@develoi.com.br' || profile?.email?.toLowerCase() === 'edueloi.ee@gmail.com';
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = pathToTab(location.pathname);
  const waCounts = useWaCounts();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);

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
          // projeto da URL > último projeto escolhido por este usuário > primeiro da lista
          let saved: string | null = null;
          try { saved = localStorage.getItem(`develoi:projeto:${profile.uid}`); } catch { /* sem storage */ }
          const fromSaved = saved ? data.find((p: Project) => p.id === saved) : null;
          setSelectedProject(fromUrl || fromSaved || data[0]);
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

  // lembra o projeto escolhido (por usuário) para não voltar ao primeiro da lista ao recarregar a página
  useEffect(() => {
    if (!profile || !selectedProject) return;
    try { localStorage.setItem(`develoi:projeto:${profile.uid}`, selectedProject.id); } catch { /* sem storage */ }
  }, [profile, selectedProject?.id]); // eslint-disable-line

  const projectIdsKey = projects.map(p => p.id).sort().join(',');

  useEffect(() => {
    if (!projectIdsKey) { setAllFeatures([]); return; }
    const fetchFeatures = async () => {
      try {
        const response = await fetch(`/api/features?projectIds=${projectIdsKey}`);
        const data = await response.json();
        setAllFeatures(data);
      } catch (error) {
        handleApiError(error, OperationType.LIST, 'features');
      }
    };
    fetchFeatures();
    const interval = setInterval(fetchFeatures, 5000);
    return () => clearInterval(interval);
  }, [projectIdsKey]);

  // o ticket é "meu" se sou o responsável (nome ou uid) ou estou em parceria
  const isMineFeature = (f: Feature) => {
    const me = profile?.displayName;
    const collab = (f as any).collaborators as string[] | null | undefined;
    return f.assignedTo === profile?.uid || (!!me && (f.assignedTo === me || (Array.isArray(collab) && collab.includes(me))));
  };
  const openProject = (p: Project, tab: ActiveTab) => { setSelectedProject(p); goTo(tab, p); };

  const goTo = (tab: ActiveTab, project?: Project | null) => {
    const proj = project !== undefined ? project : selectedProject;
    const path = TAB_TO_PATH[tab];
    const needsProject: ActiveTab[] = ['backlog', 'board', 'timeline', 'tests', 'chat', 'summary'];
    const qs = needsProject.includes(tab) && proj ? `?projeto=${proj.id}` : '';
    navigate(path + qs);
    setSidebarOpen(false);
  };

  const tabTitles: Record<ActiveTab, string> = {
    overview:        'Para você',
    summary:         `Resumo: ${selectedProject?.name ?? ''}`,
    backlog:         'Backlog',
    board:           'Quadro',
    timeline:        'Cronograma',
    projects:        'Todos os Projetos',
    tests:           'Controle de Qualidade',
    members:         'Área de Membros',
    chat:            'Comunicação Interna',
    portfolio:       'Portfólio Público',
    team:            'Nossa Equipe',
    'site-values':   'Missão & Valores',
    blog:            'Blog da Develoi',
    cases:           'Cases de Sucesso',
    bot:             'Bot de Atendimento',
    posts:           'Criador de Postagens',
    sales:           'Controle de Vendas',
    products:        'Produtos & Planos',
    'client-contact':'Contato com Clientes',
    clients:         'Clientes',
    leads:           'Prospecção',
    receivables:     'Contas a Receber',
    payables:        'Contas a Pagar',
    partners:        'Sociedade & Lucros',
    'business-plan': 'Plano de Negócio',
    'wa-inbox':      'Atendimento WhatsApp',
    'wa-bot':        'Atendimento · Bot',
    'wa-queue':      'Atendimento · Fila',
    'wa-active':     'Atendimento · Em atendimento',
    'wa-closed':     'Atendimento · Finalizados',
    'wa-new':        'Atendimento · Iniciar conversa',
    'team-notices':  'Avisos da equipe',
    webhooks:        'Webhooks',
    'profile':       'Meu Perfil',
  };

  const hideSelectorTabs: ActiveTab[] = ['projects', 'members', 'portfolio', 'team', 'site-values', 'blog', 'cases', 'bot', 'wa-inbox', 'wa-bot', 'wa-queue', 'wa-active', 'wa-closed', 'wa-new', 'team-notices', 'webhooks', 'posts', 'sales', 'products', 'leads', 'partners', 'client-contact', 'clients', 'receivables', 'payables', 'business-plan', 'profile'];

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
        w-60 flex flex-col
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#06112B' }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
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
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 custom-scrollbar">
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

          <NavSection label="Comercial">
            <NavItem icon={Target} label="Prospecção" active={activeTab === 'leads'} onClick={() => goTo('leads')} />
            <NavItem icon={BarChart2} label="Vendas" active={activeTab === 'sales'} onClick={() => goTo('sales')} />
            <NavItem icon={Users} label="Clientes" active={activeTab === 'clients'} onClick={() => goTo('clients')} />
            <NavItem icon={ShoppingBag} label="Produtos & Planos" active={activeTab === 'products'} onClick={() => goTo('products')} />
            <NavItem icon={PhoneCall} label="Contato com Clientes" active={activeTab === 'client-contact'} onClick={() => goTo('client-contact')} />
          </NavSection>

          <NavSection label="Financeiro">
            <NavItem icon={DollarSign} label="Contas a Receber" active={activeTab === 'receivables'} onClick={() => goTo('receivables')} />
            <NavItem icon={Wallet} label="Contas a Pagar" active={activeTab === 'payables'} onClick={() => goTo('payables')} />
            <NavItem icon={PieChart} label="Sociedade & Lucros" active={activeTab === 'partners'} onClick={() => goTo('partners')} />
            {isAdmin && <NavItem icon={Compass} label="Plano de Negócio" active={activeTab === 'business-plan'} onClick={() => goTo('business-plan')} />}
          </NavSection>

          <NavSection label="Atendimento WhatsApp">
            <NavItem icon={WaBotIcon} label="Bot" active={activeTab === 'wa-bot'} onClick={() => goTo('wa-bot')} badge={waCounts.bot || undefined} />
            <NavItem icon={WaClockIcon} label="Fila de espera" active={activeTab === 'wa-queue' || activeTab === 'wa-inbox'} onClick={() => goTo('wa-queue')} badge={waCounts.waiting || undefined} />
            <NavItem icon={WaUserIcon} label="Em atendimento" active={activeTab === 'wa-active'} onClick={() => goTo('wa-active')} badge={waCounts.active || undefined} />
            <NavItem icon={WaDoneIcon} label="Finalizados" active={activeTab === 'wa-closed'} onClick={() => goTo('wa-closed')} />
            <NavItem icon={WaSendIcon} label="Iniciar conversa" active={activeTab === 'wa-new'} onClick={() => goTo('wa-new')} />
          </NavSection>

          <NavSection label="Sistema">
            <NavItem icon={Image} label="Criador de Postagens" active={activeTab === 'posts'} onClick={() => goTo('posts')} />
            <NavItem icon={Webhook} label="Webhooks" active={activeTab === 'webhooks'} onClick={() => goTo('webhooks')} />
            <NavItem icon={Bell} label="Avisos da equipe" active={activeTab === 'team-notices'} onClick={() => goTo('team-notices')} />
            <NavItem icon={MessageSquare} label="Bot de Atendimento" active={activeTab === 'bot'} onClick={() => goTo('bot')} />
          </NavSection>

          <NavSection label="Conta">
            <NavItem icon={UserCircle} label="Meu Perfil" active={activeTab === 'profile'} onClick={() => goTo('profile')} />
          </NavSection>
        </nav>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
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
        <header className="bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-white/5 px-3 sm:px-4 lg:px-5 py-2.5 flex items-center gap-3 flex-shrink-0 shadow-sm">
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
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">Projeto</span>
                <Combobox
                  size="sm"
                  className="w-56"
                  placeholder="Selecionar projeto..."
                  searchPlaceholder="Buscar projeto..."
                  emptyMessage="Nenhum projeto encontrado."
                  value={selectedProject?.id}
                  options={projects.map(p => ({ value: p.id, label: p.name, subtitle: p.clientName || 'Sem cliente' }))}
                  onChange={(v) => {
                    const proj = projects.find(p => p.id === v) || null;
                    setSelectedProject(proj);
                    goTo(activeTab, proj);
                  }}
                />
              </div>
            )}
            {activeTab === 'projects' && !isNewProjectModalOpen && !editingProject && (
              <Button
                size="sm"
                onClick={() => setIsNewProjectModalOpen(true)}
                iconLeft={<Plus className="h-3.5 w-3.5" />}
              >
                Novo projeto
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ background: isDark ? '#0B1120' : '#F0F2F8' }}>
          <PageWrapper>
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>

              {activeTab === 'overview' && (
                <DashboardOverview
                  projects={projects}
                  features={allFeatures}
                  userId={profile?.uid}
                  userName={profile?.displayName}
                  onNewProject={() => setIsNewProjectModalOpen(true)}
                  onNavigate={goTo}
                />
              )}

              {activeTab === 'summary' && selectedProject && (
                <ProjectSummaryView
                  project={selectedProject}
                  gallery={<ProjectGallery projectId={selectedProject.id} />}
                  onEdit={() => {
                    setEditingProject(selectedProject);
                    goTo('projects');
                  }}
                  onNavigate={goTo}
                />
              )}

              {activeTab === 'projects' && (
                isNewProjectModalOpen ? (
                  <ProjectFormPage
                    onCancel={() => setIsNewProjectModalOpen(false)}
                    onSaved={(savedProject) => {
                      setProjects(current => [savedProject, ...current]);
                      setSelectedProject(savedProject);
                      setIsNewProjectModalOpen(false);
                    }}
                  />
                ) : editingProject ? (
                  <ProjectFormPage
                    project={editingProject}
                    onCancel={() => setEditingProject(null)}
                    onSaved={(savedProject) => {
                      setProjects(current => current.map(project => project.id === savedProject.id ? savedProject : project));
                      setSelectedProject(current => current?.id === savedProject.id ? savedProject : current);
                      setEditingProject(null);
                    }}
                  />
                ) : (
                  <ProjectsList
                    projects={projects}
                    onSelect={(p) => { setSelectedProject(p); goTo('summary', p); }}
                    onEdit={(p) => setEditingProject(p)}
                  />
                )
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
              {(activeTab === 'wa-inbox' || activeTab === 'wa-queue') && <WhatsappInbox view="waiting" />}
              {activeTab === 'wa-bot' && <WhatsappInbox view="bot" />}
              {activeTab === 'wa-active' && <WhatsappInbox view="active" />}
              {activeTab === 'wa-closed' && <WhatsappInbox view="closed" />}
              {activeTab === 'wa-new' && <WhatsappNewConversation />}
              {activeTab === 'team-notices' && <TeamNoticesTab />}
              {activeTab === 'webhooks' && <WebhooksTab />}
              {activeTab === 'posts' && <PostCreatorTab />}
              {activeTab === 'sales' && <SalesManager />}
              {activeTab === 'products' && <ProductsManager />}
              {activeTab === 'client-contact' && <ClientContactManager />}
              {activeTab === 'clients' && <ClientsManager />}
              {activeTab === 'receivables' && <ReceivablesManager />}
              {activeTab === 'payables' && <PayablesManager />}
              {activeTab === 'leads' && <LeadsManager />}
              {activeTab === 'partners' && <PartnersManager />}
              {activeTab === 'business-plan' && (isAdmin ? <BusinessPlanManager /> : (
                <EmptyState icon={ShieldCheck} title="Acesso restrito" description="Essa área é só para os sócios da Develoi." />
              ))}
              {activeTab === 'profile' && <MyProfile />}
            </motion.div>
          </PageWrapper>
        </main>
      </div>

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
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 group text-left"
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
      <span className="text-[13px] flex-1 truncate font-medium">{label}</span>
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
    <div className="flex flex-col items-center justify-center py-10 sm:py-12 bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(13,31,78,0.08)' }}>
        <Briefcase className="w-5 h-5" style={{ color: '#0D1F4E' }} />
      </div>
      <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white mb-1">Selecione um projeto</h3>
      <p className="text-slate-400 text-xs mb-4 max-w-xs text-center">Crie seu primeiro projeto para usar o quadro, backlog e chat.</p>
      <button
        onClick={onAction}
        className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all hover:opacity-90"
        style={{ background: '#0D1F4E', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
      >
        <Plus className="w-3.5 h-3.5" /> CRIAR PROJETO
      </button>
    </div>
  );
}


// ─── ProjectSummary ───────────────────────────────────────────────────────────


// ─── Modals ───────────────────────────────────────────────────────────────────

function ImageUploadField({ label, value, onChange, shape = 'banner' }: {
  label: string; value: string; onChange: (v: string) => void; shape?: 'banner' | 'square';
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => { onChange(reader.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[0.18em] mb-1.5 ml-1" style={{ color: '#64748b' }}>{label}</label>
      <div className="flex items-center gap-3">
        <div className={cn(
          'relative shrink-0 overflow-hidden border bg-slate-50 flex items-center justify-center',
          shape === 'banner' ? 'w-24 h-14 rounded-xl' : 'w-14 h-14 rounded-xl'
        )} style={{ borderColor: 'rgba(13,31,78,0.1)' }}>
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image className="w-4 h-4 text-slate-300" />
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-50"
          style={{ borderColor: 'rgba(13,31,78,0.12)', color: '#0D1F4E', background: 'white' }}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {uploading ? 'Carregando...' : value ? 'Trocar imagem' : 'Enviar imagem'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

const MAX_PROJECT_IMAGES = 8;

function ProjectGallery({ projectId }: { projectId: string }) {
  const [images, setImages] = useState<ProjectImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    try {
      const r = await fetch(`/api/projects/${projectId}/images`);
      const data = await r.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchImages(); }, [projectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_PROJECT_IMAGES) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await fetch(`/api/projects/${projectId}/images`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: reader.result as string }),
        });
        await fetchImages();
      } catch (err) { console.error(err); }
      finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
    };
    reader.readAsDataURL(file);
  };

  const handleCaptionChange = async (id: string, caption: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, caption } : img));
  };

  const handleCaptionBlur = async (id: string, caption: string) => {
    await fetch(`/api/projects/${projectId}/images/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/images/${id}`, { method: 'DELETE' });
    setImages(prev => prev.filter(img => img.id !== id));
  };

  if (loading) return null;

  return (
    <PanelCard
      icon={Image}
      title="Imagens do projeto"
      description="Referências, telas e materiais visuais"
      action={<Badge size="xs" color="default">{images.length}/{MAX_PROJECT_IMAGES}</Badge>}
    >
        {images.length === 0 && (
          <EmptyState className="mb-3" icon={Image} title="Nenhuma imagem adicionada" description="Envie até 8 imagens para documentar o projeto." />
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
              <button type="button" onClick={() => setViewerIndex(i)} className="block w-full aspect-square">
                <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
              </button>
              <IconButton
                type="button"
                onClick={() => handleDelete(img.id)}
                size="xs"
                variant="danger"
                className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100"
                aria-label="Remover imagem"
              >
                <X size={13} />
              </IconButton>
              <input
                type="text"
                value={img.caption || ''}
                onChange={e => handleCaptionChange(img.id, e.target.value)}
                onBlur={e => handleCaptionBlur(img.id, e.target.value)}
                placeholder="Adicionar descrição..."
                className="w-full border-t border-slate-100 bg-white px-2 py-1.5 text-[11px] text-slate-600 outline-none placeholder:text-slate-300 focus:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
              />
            </div>
          ))}

          {images.length < MAX_PROJECT_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:border-white/20"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-[10px] font-bold">{uploading ? 'Enviando...' : 'Adicionar foto'}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {viewerIndex !== null && images[viewerIndex] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6" onClick={() => setViewerIndex(null)}>
          <button onClick={() => setViewerIndex(null)} className="absolute top-5 right-5 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={images[viewerIndex].url} alt="" className="w-full max-h-[75vh] object-contain rounded-xl" />
            {images[viewerIndex].caption && (
              <p className="text-white/80 text-sm text-center mt-4">{images[viewerIndex].caption}</p>
            )}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setViewerIndex(v => (v! - 1 + images.length) % images.length)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all">
                  Anterior
                </button>
                <span className="text-white/50 text-xs">{viewerIndex + 1} / {images.length}</span>
                <button onClick={() => setViewerIndex(v => (v! + 1) % images.length)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all">
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PanelCard>
  );
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goals, setGoals] = useState('');
  const [financials, setFinancials] = useState('');
  const [history, setHistory] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
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
        body: JSON.stringify({
          id: uuidv4(), name, clientName: client, description: desc, deadline, visibility,
          allowedUsers: visibility === 'private' ? allowedUsers : [], status: 'active', progress: 0,
          goals: goals.split('\n').filter(g => g.trim()), financials, history,
          projectUrl: projectUrl || null, coverImage: coverImage || null, logoUrl: logoUrl || null,
        }),
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
          <Input label="Nome do Projeto" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Plaelo" />
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

        <Input label="URL do Projeto" iconLeft={<Link2 className="w-4 h-4" />} value={projectUrl} onChange={e => setProjectUrl(e.target.value)} placeholder="https://meuprojeto.com.br" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploadField label="Capa do Projeto" value={coverImage} onChange={setCoverImage} shape="banner" />
          <ImageUploadField label="Logo do Projeto" value={logoUrl} onChange={setLogoUrl} shape="square" />
        </div>

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
  const [projectUrl, setProjectUrl] = useState(project.projectUrl || '');
  const [coverImage, setCoverImage] = useState(project.coverImage || '');
  const [logoUrl, setLogoUrl] = useState(project.logoUrl || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(project.visibility || 'public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>(project.allowedUsers || []);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'geral' | 'detalhes' | 'acesso'>('geral');

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
        body: JSON.stringify({
          name, clientName: client, description: desc, deadline, status, progress, visibility,
          allowedUsers: visibility === 'private' ? allowedUsers : [], goals: goals.split('\n').filter(g => g.trim()), financials, history,
          projectUrl: projectUrl || null, coverImage: coverImage || null, logoUrl: logoUrl || null,
        }),
      });
      onClose();
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { key: 'geral'    as const, label: 'Geral',    icon: Briefcase },
    { key: 'detalhes' as const, label: 'Detalhes', icon: Target },
    { key: 'acesso'   as const, label: 'Acesso',   icon: Eye },
  ];

  const statusOptions = [
    { value: 'active',    label: 'Ativo',     dot: '#22c55e' },
    { value: 'completed', label: 'Concluído', dot: '#60a5fa' },
    { value: 'on-hold',   label: 'Em Espera', dot: '#fbbf24' },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title=""
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>CANCELAR</Button>
          <Button type="submit" form="edit-project-form" loading={loading} fullWidth size="lg">SALVAR ALTERAÇÕES</Button>
        </div>
      }
    >
      <form id="edit-project-form" onSubmit={handleSubmit}>

        {/* Header do modal */}
        <div className="relative rounded-2xl overflow-hidden mb-5 p-5" style={{ background: 'linear-gradient(135deg, #06112B, #0D1F4E)' }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #C49A2A, rgba(196,154,42,0.2))' }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(196,154,42,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0" style={{ background: 'rgba(196,154,42,0.15)', color: '#C49A2A' }}>
              {project.name[0]}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: 'rgba(196,154,42,0.7)' }}>Configurações do Projeto</p>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight">{project.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Cliente: {project.clientName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Tabs de seção */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl border sticky top-0 z-10 backdrop-blur" style={{ background: '#EEF1F8', borderColor: 'rgba(13,31,78,0.08)' }}>
          {sections.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveSection(s.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              style={activeSection === s.key
                ? { background: 'white', color: '#0D1F4E', boxShadow: '0 2px 8px rgba(13,31,78,0.1)' }
                : { color: '#94a3b8' }
              }
            >
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          ))}
        </div>

        {/* ── SEÇÃO GERAL ── */}
        {activeSection === 'geral' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome do Projeto" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Plaelo" />
              <Input label="Cliente" required value={client} onChange={e => setClient(e.target.value)} placeholder="Ex: João Silva" />
            </div>

            <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Qual o objetivo principal deste projeto?" rows={3} />

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Status Atual</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value as any)}
                    className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all"
                    style={status === opt.value
                      ? { background: 'rgba(13,31,78,0.06)', borderColor: '#0D1F4E', boxShadow: '0 2px 8px rgba(13,31,78,0.1)' }
                      : { background: 'white', borderColor: 'rgba(13,31,78,0.1)' }
                    }
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.dot }} />
                    <span className="text-xs font-black" style={{ color: status === opt.value ? '#0D1F4E' : '#94a3b8' }}>{opt.label}</span>
                    {status === opt.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" style={{ color: '#0D1F4E' }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Prazo Final" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Progresso: <span className="text-[#0D1F4E]">{progress}%</span></p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #0D1F4E ${progress}%, #e2e8f0 ${progress}%)` }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-slate-300 font-bold">0%</span>
                  <span className="text-[9px] text-slate-300 font-bold">100%</span>
                </div>
              </div>
            </div>

            <Input label="URL do Projeto" iconLeft={<Link2 className="w-4 h-4" />} value={projectUrl} onChange={e => setProjectUrl(e.target.value)} placeholder="https://meuprojeto.com.br" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField label="Capa do Projeto" value={coverImage} onChange={setCoverImage} shape="banner" />
              <ImageUploadField label="Logo do Projeto" value={logoUrl} onChange={setLogoUrl} shape="square" />
            </div>
          </div>
        )}

        {/* ── SEÇÃO DETALHES ── */}
        {activeSection === 'detalhes' && (
          <div className="space-y-5">
            <Textarea label="Metas (uma por linha)" value={goals} onChange={e => setGoals(e.target.value)} placeholder="Criar landing page de alta conversão&#10;Integrar com CRM&#10;Lançar em produção até junho" rows={5} />
            <Textarea label="Financeiro & Orçamento" value={financials} onChange={e => setFinancials(e.target.value)} placeholder="Valor total: R$ 12.000&#10;Pago: R$ 6.000 (50%)&#10;Parcela final: após entrega" rows={4} />
            <Textarea label="História & Contexto" value={history} onChange={e => setHistory(e.target.value)} placeholder="Como este projeto surgiu? Quais são as expectativas do cliente?" rows={4} />
          </div>
        )}

        {/* ── SEÇÃO ACESSO ── */}
        {activeSection === 'acesso' && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Visibilidade do Projeto</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'public', label: 'Público', desc: 'Todos os membros podem ver', icon: Eye },
                  { value: 'private', label: 'Privado', desc: 'Apenas membros selecionados', icon: ShieldCheck },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value as any)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all"
                    style={visibility === opt.value
                      ? { background: 'rgba(13,31,78,0.06)', borderColor: '#0D1F4E', boxShadow: '0 2px 8px rgba(13,31,78,0.1)' }
                      : { background: 'white', borderColor: 'rgba(13,31,78,0.1)' }
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <opt.icon className="w-4 h-4" style={{ color: visibility === opt.value ? '#0D1F4E' : '#94a3b8' }} />
                      {visibility === opt.value && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#0D1F4E' }} />}
                    </div>
                    <span className="text-sm font-black" style={{ color: visibility === opt.value ? '#0D1F4E' : '#94a3b8' }}>{opt.label}</span>
                    <span className="text-[10px] text-slate-400 leading-snug">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {visibility === 'private' && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">
                  Membros com acesso ({allowedUsers.length} selecionado{allowedUsers.length !== 1 ? 's' : ''})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar p-1">
                  {members.map(member => {
                    const selected = allowedUsers.includes(member.uid);
                    return (
                      <button
                        key={member.uid}
                        type="button"
                        onClick={() => toggleUser(member.uid)}
                        className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                        style={selected
                          ? { background: 'rgba(196,154,42,0.08)', borderColor: 'rgba(196,154,42,0.3)' }
                          : { background: 'white', borderColor: 'rgba(13,31,78,0.08)' }
                        }
                      >
                        <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: selected ? '#C49A2A' : 'transparent' }}>
                          {member.photoURL ? (
                            <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black" style={{ background: 'rgba(13,31,78,0.07)', color: '#0D1F4E' }}>
                              {member.displayName?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: selected ? '#C49A2A' : '#64748b' }}>{member.displayName}</p>
                          <p className="text-[9px] text-slate-300 truncate">{member.email}</p>
                        </div>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C49A2A' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
            <option value="epic">Demanda</option>
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
            <option value="epic">Demanda</option>
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
