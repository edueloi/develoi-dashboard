import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Kanban, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Plus, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  Rocket,
  Users,
  Calendar,
  MoreVertical,
  Trash2,
  Filter,
  ArrowRight,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Edit2,
  Target,
  TrendingUp,
  Share2,
  MoreHorizontal,
  Link2,
  History
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
const DraggableComponent = Draggable as any;
const DroppableComponent = Droppable as any;
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { v4 as uuidv4 } from 'uuid';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleApiError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`API Error (${operationType}) on ${path}:`, error);
  // You could add a toast notification here
}

// --- UI Components ---
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

// --- Types ---
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  clientName: string;
  category?: string;
  progress?: number;
  deadline?: string;
  visibility?: 'public' | 'private';
  allowedUsers?: string[];
  createdAt: any;
  goals?: string[];
  financials?: string;
  history?: string;
}

interface Feature {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'testing' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  deadline?: string;
  testScenarios?: string;
  businessRules?: string;
  assignedTo?: string;
  reporter?: string;
  isValidated?: boolean;
  validatedBy?: string;
  tags?: string[];
  points?: number;
  type?: 'story' | 'task' | 'bug' | 'epic';
  parentId?: string;
}

interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

// --- Components ---

export default function Dashboard() {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'summary' | 'backlog' | 'board' | 'timeline' | 'chat' | 'tests' | 'members'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const fetchProjects = async () => {
      try {
        const isAdmin = profile.role === 'admin' || profile.email?.toLowerCase() === 'admin@develoi.com.br' || profile.email?.toLowerCase() === 'edueloi.ee@gmail.com';
        const response = await fetch(`/api/projects?userId=${profile.uid}&isAdmin=${isAdmin}`);
        const data = await response.json();
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0]);
        }
      } catch (error) {
        handleApiError(error, OperationType.LIST, 'projects');
      }
    };

    fetchProjects();
    const interval = setInterval(fetchProjects, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    if (selectedProject && activeTab === 'overview') {
      setActiveTab('summary');
    }
  }, [selectedProject]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">DEVELOI <span className="text-indigo-600">HUB</span></span>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Visão Geral" 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
            />
            {selectedProject && (
              <SidebarItem 
                icon={CheckCircle2} 
                label="Resumo Projeto" 
                active={activeTab === 'summary'} 
                onClick={() => setActiveTab('summary')} 
              />
            )}
            <SidebarItem 
              icon={Briefcase} 
              label="Projetos" 
              active={activeTab === 'projects'} 
              onClick={() => setActiveTab('projects')} 
            />
            {selectedProject && (
              <>
                <SidebarItem 
                  icon={LayoutDashboard} 
                  label="Backlog" 
                  active={activeTab === 'backlog'} 
                  onClick={() => setActiveTab('backlog')} 
                />
                <SidebarItem 
                  icon={Kanban} 
                  label="Quadro" 
                  active={activeTab === 'board'} 
                  onClick={() => setActiveTab('board')} 
                />
                <SidebarItem 
                  icon={Calendar} 
                  label="Cronograma" 
                  active={activeTab === 'timeline'} 
                  onClick={() => setActiveTab('timeline')} 
                />
              </>
            )}
            <SidebarItem 
              icon={ShieldCheck} 
              label="Qualidade" 
              active={activeTab === 'tests'} 
              onClick={() => setActiveTab('tests')} 
            />
            <SidebarItem 
              icon={Users} 
              label="Membros" 
              active={activeTab === 'members'} 
              onClick={() => setActiveTab('members')} 
            />
            <SidebarItem 
              icon={MessageSquare} 
              label="Chat" 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-aurora-blue to-aurora-purple flex items-center justify-center text-white font-black text-sm">
                {profile?.displayName?.[0]?.toUpperCase() ?? 'D'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-slate-900 truncate">{profile?.displayName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-xs font-bold border border-slate-200"
          >
            <LogOut className="w-3.5 h-3.5" /> SAIR DA CONTA
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeTab === 'overview' && 'Para você'}
              {activeTab === 'summary' && `Resumo: ${selectedProject?.name}`}
              {activeTab === 'backlog' && 'Backlog'}
              {activeTab === 'board' && 'Quadro'}
              {activeTab === 'timeline' && 'Cronograma'}
              {activeTab === 'projects' && 'Todos os Projetos'}
              {activeTab === 'tests' && 'Controle de Qualidade'}
              {activeTab === 'members' && 'Área de Membros'}
              {activeTab === 'chat' && 'Comunicação Interna'}
            </h1>
            <p className="text-slate-500 text-xs font-medium">Gerencie a excelência da Develoi.</p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'projects' && activeTab !== 'members' && (
              <div className="relative">
                <select 
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  value={selectedProject?.id}
                  onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            )}
            <Button onClick={() => setIsNewProjectModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> NOVO PROJETO
            </Button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Espaços recomendados</h2>
                    <button onClick={() => setActiveTab('projects')} className="text-sm font-bold text-indigo-600 hover:underline">Visualizar todos os espaços</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {projects.slice(0, 4).map(project => (
                      <div 
                        key={project.id} 
                        onClick={() => { setSelectedProject(project); setActiveTab('summary'); }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                          <Briefcase className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{project.name}</h3>
                        <p className="text-xs text-slate-500 mb-4">Espaço de software</p>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                            {project.client ? project.client[0] : 'C'}
                          </div>
                          <span className="text-[10px] text-slate-400">Usado por {project.client || 'Equipe'}</span>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-500">Nenhum projeto recomendado ainda.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-6 border-b border-slate-100 pb-2">
                    <button className="text-sm font-bold text-indigo-600 border-b-2 border-indigo-600 pb-2">Trabalhado</button>
                    <button className="text-sm font-bold text-slate-400 hover:text-slate-600 pb-2 transition-colors">Visualizado</button>
                    <button className="text-sm font-bold text-slate-400 hover:text-slate-600 pb-2 transition-colors">Atribuído a mim</button>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoje</h4>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50 overflow-hidden">
                      <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">Ajuste de layout do dashboard</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">DEV-1024 • Projeto Alpha</p>
                        </div>
                        <Badge variant="success">Concluído</Badge>
                      </div>
                      <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">Implementação de filtros no backlog</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">DEV-1025 • Projeto Alpha</p>
                        </div>
                        <Badge variant="info">Em Progresso</Badge>
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'summary' && selectedProject && (
              <ProjectSummary project={selectedProject} />
            )}

            {activeTab === 'projects' && (
              <ProjectsList projects={projects} onSelect={(p) => { setSelectedProject(p); setActiveTab('summary'); }} />
            )}

            {activeTab === 'backlog' && (
              selectedProject ? (
                <BacklogView projectId={selectedProject.id} />
              ) : (
                <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )
            )}

            {activeTab === 'board' && (
              selectedProject ? (
                <KanbanBoard projectId={selectedProject.id} />
              ) : (
                <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )
            )}

            {activeTab === 'tests' && (
              selectedProject ? (
                <TestModule projectId={selectedProject.id} />
              ) : (
                <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )
            )}

            {activeTab === 'members' && (
              <MembersArea />
            )}

            {activeTab === 'timeline' && (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Cronograma do Projeto</h3>
                <p className="text-slate-500 max-w-md mx-auto">Visualize o cronograma e os prazos do seu projeto em uma linha do tempo interativa (Em breve).</p>
              </div>
            )}

            {activeTab === 'chat' && (
              selectedProject ? (
                <ChatRoom projectId={selectedProject.id} />
              ) : (
                <EmptyProjectState onAction={() => setIsNewProjectModalOpen(true)} />
              )
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} />
      )}
    </div>
  );
}

// --- Sub-components ---

function EmptyProjectState({ onAction }: { onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
        <Briefcase className="w-10 h-10 text-indigo-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum Projeto Selecionado</h3>
      <p className="text-slate-500 text-sm mb-8 max-w-xs text-center">
        Crie um novo projeto ou selecione um existente para começar a gerenciar suas tarefas.
      </p>
      <Button onClick={onAction}>
        <Plus className="w-4 h-4 mr-2" /> CRIAR PRIMEIRO PROJETO
      </Button>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-indigo-50 text-indigo-700 font-bold' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-4 h-4 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className="text-sm tracking-tight">{label}</span>
      {active && <div className="ml-auto w-1 h-4 bg-indigo-600 rounded-full" />}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{value}</p>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ActivityItem({ user, action, target, time }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
        {user[0]}
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-600">
          <span className="font-bold text-slate-900">{user}</span> {action} <span className="text-indigo-600 font-bold">{target}</span>
        </p>
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function TeamMember({ name, role, status, photoURL }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {photoURL ? (
          <img src={photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-100" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">
            {name[0]}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-slate-900">{name}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{role}</p>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
    </div>
  );
}

function BacklogView({ projectId }: { projectId: string }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [featureToView, setFeatureToView] = useState<Feature | null>(null);
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false);

  const fetchFeatures = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/features`);
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      handleApiError(error, OperationType.LIST, `projects/${projectId}/features`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
    const interval = setInterval(fetchFeatures, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const filteredFeatures = features.filter(f => 
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.key?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando backlog...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar no backlog..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsNewFeatureModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> CRIAR TICKET
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chave</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resumo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeatures.map(feature => (
                <tr 
                  key={feature.id} 
                  onClick={() => setFeatureToView(feature)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    {feature.type === 'bug' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {feature.type === 'story' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {feature.type === 'epic' && <Rocket className="w-4 h-4 text-purple-500" />}
                    {(!feature.type || feature.type === 'task') && <Briefcase className="w-4 h-4 text-blue-500" />}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-indigo-600 group-hover:underline">
                      {feature.key || feature.id.slice(0, 4).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{feature.title}</span>
                      {feature.tags && feature.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {feature.tags.map((tag, i) => (
                            <span key={i} className="text-[8px] font-bold px-1 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={feature.status === 'done' ? 'success' : feature.status === 'testing' ? 'warning' : 'info'}>
                      {feature.status === 'todo' ? 'A Fazer' : feature.status === 'in-progress' ? 'Em Progresso' : feature.status === 'testing' ? 'Em Teste' : 'Concluído'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={feature.priority === 'critical' ? 'danger' : feature.priority === 'high' ? 'warning' : 'info'}>
                      {feature.priority || 'Média'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                        {feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs text-slate-600">{feature.assignedTo || 'Não atribuído'}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFeatures.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                    Nenhum ticket encontrado no backlog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isNewFeatureModalOpen && <NewFeatureModal projectId={projectId} onClose={() => setIsNewFeatureModalOpen(false)} />}
      {featureToView && <FeatureDetailModal feature={featureToView} onClose={() => setFeatureToView(null)} />}
    </div>
  );
}

function ProjectsList({ projects, onSelect }: { projects: Project[], onSelect: (p: Project) => void }) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const handleDelete = async () => {
    if (projectToDelete) {
      try {
        await fetch(`/api/projects/${projectToDelete.id}`, {
          method: 'DELETE'
        });
        setProjectToDelete(null);
      } catch (error) {
        handleApiError(error, OperationType.DELETE, `projects/${projectToDelete.id}`);
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {projects.map(project => (
          <div 
            key={project.id} 
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all cursor-pointer group relative"
            onClick={() => onSelect(project)}
          >
            <div className="flex items-center justify-between mb-6">
              <Badge variant={project.status === 'active' ? 'success' : project.status === 'on-hold' ? 'warning' : 'default'}>
                {project.status === 'active' ? 'Ativo' : project.status === 'on-hold' ? 'Em Espera' : 'Concluído'}
              </Badge>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setProjectToEdit(project); }}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }}
                  className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
            <p className="text-sm text-slate-500 mb-8 line-clamp-2 leading-relaxed">{project.description}</p>
            
            <div className="space-y-6">
              <ProgressBar progress={project.progress || 0} />
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Equipe Elite</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">
                    {project.deadline ? format(new Date(project.deadline), 'dd MMM', { locale: ptBR }) : 'S/ Data'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {projectToEdit && (
        <EditProjectModal project={projectToEdit} onClose={() => setProjectToEdit(null)} />
      )}

      <ConfirmationModal 
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Projeto"
        message={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}

function MembersArea() {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        handleApiError(error, OperationType.LIST, 'users');
      }
    };
    fetchMembers();
    const interval = setInterval(fetchMembers, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {members.map(member => (
        <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center group hover:shadow-xl hover:shadow-indigo-100/50 transition-all">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {member.photoURL ? (
              <img src={member.photoURL} alt="" className="w-full h-full rounded-full border-4 border-white shadow-lg" />
            ) : (
              <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-2xl font-bold text-indigo-600 border-4 border-white shadow-lg">
                {member.displayName?.[0]}
              </div>
            )}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-1">{member.displayName}</h3>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-6">{member.role || 'Membro Elite'}</p>
          
          <div className="pt-6 border-t border-slate-50 flex justify-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">12</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Projetos</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-100" />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">48</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tasks</p>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function KanbanBoard({ projectId }: { projectId: string }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false);
  const [featureToEdit, setFeatureToEdit] = useState<Feature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<Feature | null>(null);
  const [featureToView, setFeatureToView] = useState<Feature | null>(null);

  const fetchFeatures = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/features`);
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      handleApiError(error, OperationType.LIST, `projects/${projectId}/features`);
    }
  };

  useEffect(() => {
    fetchFeatures();
    const interval = setInterval(fetchFeatures, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const columns = [
    { id: 'todo', label: 'A Fazer', dot: 'bg-slate-400' },
    { id: 'in-progress', label: 'Desenvolvimento', dot: 'bg-blue-500' },
    { id: 'testing', label: 'Testes', dot: 'bg-indigo-500' },
    { id: 'done', label: 'Concluído', dot: 'bg-emerald-500' }
  ];

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    try {
      await fetch(`/api/projects/${projectId}/features/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchFeatures();
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `projects/${projectId}/features/${draggableId}`);
    }
  };

  const handleDeleteFeature = async () => {
    if (featureToDelete) {
      try {
        await fetch(`/api/projects/${projectId}/features/${featureToDelete.id}`, {
          method: 'DELETE'
        });
        setFeatureToDelete(null);
        fetchFeatures();
      } catch (error) {
        handleApiError(error, OperationType.DELETE, `projects/${projectId}/features/${featureToDelete.id}`);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Fluxo de Trabalho</h2>
        <Button size="sm" onClick={() => setIsNewFeatureModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-2" /> NOVA FUNCIONALIDADE
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-6">
          {columns.map(col => (
            <DroppableComponent key={col.id} droppableId={col.id}>
              {(provided: any) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="min-w-[280px] flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {features.filter(f => f.status === col.id).length}
                    </span>
                  </div>
                  
                  <div className="space-y-3 min-h-[500px]">
                    {features.filter(f => f.status === col.id).map((feature, index) => (
                      <DraggableComponent key={feature.id} draggableId={feature.id} index={index}>
                        {(provided: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setFeatureToView(feature)}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative"
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-medium text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                    {feature.title}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-2">
                                    {feature.type === 'bug' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                                    {feature.type === 'story' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                    {feature.type === 'epic' && <Rocket className="w-3.5 h-3.5 text-purple-500" />}
                                    {(!feature.type || feature.type === 'task') && <Briefcase className="w-3.5 h-3.5 text-blue-500" />}
                                    
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      {feature.key || feature.id.slice(0, 4).toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {feature.priority === 'critical' && <ChevronUp className="w-3.5 h-3.5 text-red-600" />}
                                    {feature.priority === 'high' && <ChevronUp className="w-3.5 h-3.5 text-amber-600" />}
                                    {feature.priority === 'medium' && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                                    {feature.priority === 'low' && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                    
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white border-2 border-white shadow-sm">
                                      {feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setFeatureToEdit(feature); }}
                                  className="p-1.5 bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setFeatureToDelete(feature); }}
                                  className="p-1.5 bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-200 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                        )}
                      </DraggableComponent>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </DroppableComponent>
          ))}
        </div>
      </DragDropContext>

      {isNewFeatureModalOpen && (
        <NewFeatureModal projectId={projectId} onClose={() => setIsNewFeatureModalOpen(false)} />
      )}

      {featureToEdit && (
        <EditFeatureModal projectId={projectId} feature={featureToEdit} onClose={() => setFeatureToEdit(null)} />
      )}

      {featureToView && (
        <FeatureDetailModal feature={featureToView} onClose={() => setFeatureToView(null)} />
      )}

      <ConfirmationModal 
        isOpen={!!featureToDelete}
        onClose={() => setFeatureToDelete(null)}
        onConfirm={handleDeleteFeature}
        title="Excluir Funcionalidade"
        message={`Tem certeza que deseja excluir a funcionalidade "${featureToDelete?.title}"?`}
      />
    </motion.div>
  );
}

function TestModule({ projectId }: { projectId: string }) {
  const { profile } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);

  const fetchFeatures = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/features`);
      const data = await response.json();
      setFeatures(data.filter((f: any) => f.status === 'testing'));
    } catch (error) {
      handleApiError(error, OperationType.LIST, `projects/${projectId}/features`);
    }
  };

  useEffect(() => {
    fetchFeatures();
    const interval = setInterval(fetchFeatures, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const validateFeature = async (featureId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isValidated: 1,
          validatedBy: profile?.displayName,
          status: 'done'
        })
      });
      fetchFeatures();
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `projects/${projectId}/features/${featureId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {features.length === 0 ? (
          <div className="lg:col-span-2 text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum teste pendente</h3>
            <p className="text-slate-500 text-sm">Tudo validado ou em desenvolvimento.</p>
          </div>
        ) : (
          features.map(feature => (
            <div key={feature.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{feature.title}</h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase tracking-wider rounded-full border border-indigo-100">Aguardando Validação</span>
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Cenários de Teste</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 border border-slate-100 leading-relaxed">
                    {feature.testScenarios || 'Nenhum cenário definido.'}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Regras de Negócio</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 border border-slate-100 leading-relaxed">
                    {feature.businessRules || 'Nenhuma regra definida.'}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => validateFeature(feature.id)}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                <CheckCircle2 className="w-4 h-4" /> VALIDAR E ASSINAR
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function ChatRoom({ projectId }: { projectId: string }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      handleApiError(error, OperationType.LIST, `projects/${projectId}/messages`);
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
          text: newMessage
        })
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      handleApiError(error, OperationType.CREATE, `projects/${projectId}/messages`);
    }
  };

  return (
    <div className="bg-white h-[600px] rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === profile?.uid ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
              msg.senderId === profile?.uid 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
            }`}>
              <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
                msg.senderId === profile?.uid ? 'text-indigo-200' : 'text-slate-400'
              }`}>{msg.senderName}</p>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3">
        <input 
          type="text"
          placeholder="Escreva sua mensagem..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goals, setGoals] = useState('');
  const [financials, setFinancials] = useState('');
  const [history, setHistory] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        handleApiError(error, OperationType.LIST, 'users');
      }
    };
    fetchMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          name,
          clientName: client,
          description: desc,
          category,
          deadline,
          visibility,
          allowedUsers: visibility === 'private' ? allowedUsers : [],
          status: 'active',
          progress: 0,
          goals: goals.split('\n').filter(g => g.trim()),
          financials,
          history
        })
      });
      onClose();
    } catch (error) {
      handleApiError(error, OperationType.CREATE, 'projects');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (uid: string) => {
    setAllowedUsers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Novo Projeto" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome do Projeto</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: PsiFlux" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={client} onChange={e => setClient(e.target.value)} placeholder="Ex: Jefferson Pereira" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visibilidade</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={visibility}
              onChange={e => setVisibility(e.target.value as any)}
            >
              <option value="public">Público (Todos veem)</option>
              <option value="private">Privado (Apenas selecionados)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prazo Final</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>

        {visibility === 'private' && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quem pode ver este projeto?</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {members.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleUser(member.uid)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                    allowedUsers.includes(member.uid)
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                    {member.photoURL && <img src={member.photoURL} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="text-xs font-bold truncate">{member.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descrição</label>
          <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva o objetivo do projeto..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metas 2026 (Uma por linha)</label>
            <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={goals} onChange={e => setGoals(e.target.value)} placeholder="Meta 1&#10;Meta 2" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financeiro</label>
            <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={financials} onChange={e => setFinancials(e.target.value)} placeholder="Status de pagamento, orçamento..." />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">História & Contexto</label>
          <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={history} onChange={e => setHistory(e.target.value)} placeholder="Conte a história deste projeto..." />
        </div>
        
        <Button type="submit" loading={loading} className="w-full">CRIAR PROJETO</Button>
      </form>
    </Modal>
  );
}

function ProjectSummary({ project }: { project: Project }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h2>
          <p className="text-sm text-slate-500">Espaço de software • Gerenciado por Equipe Develoi</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
          <Settings className="w-3.5 h-3.5 mr-2" /> CONFIGURAÇÕES DO PROJETO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Descrição do Projeto</h3>
            <p className="text-slate-600 leading-relaxed">{project.description || 'Nenhuma descrição fornecida.'}</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" /> Metas 2026
              </h3>
              <ul className="space-y-3">
                {project.goals && project.goals.length > 0 ? (
                  project.goals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                      {goal}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-400 italic">Nenhuma meta definida.</li>
                )}
              </ul>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Financeiro
              </h3>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">
                {project.financials || 'Informações financeiras não disponíveis.'}
              </div>
            </section>
          </div>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" /> História & Contexto
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {project.history || 'Histórico do projeto ainda não registrado.'}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Detalhes</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Status</span>
                <Badge variant={project.status === 'active' ? 'success' : 'warning'}>
                  {project.status === 'active' ? 'Ativo' : 'Pendente'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Cliente</span>
                <span className="text-xs font-bold text-slate-900">{project.clientName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Prazo</span>
                <span className="text-xs font-bold text-slate-900">
                  {project.deadline ? format(new Date(project.deadline), 'dd/MM/yyyy') : 'Não definido'}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-medium">Progresso Geral</span>
                <span className="text-xs font-bold text-indigo-600">{project.progress || 0}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-1000" 
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg shadow-indigo-200 text-white space-y-4">
            <Rocket className="w-8 h-8 text-indigo-200" />
            <h4 className="font-bold text-lg">Pronto para decolar?</h4>
            <p className="text-indigo-100 text-xs leading-relaxed">Continue acompanhando o progresso e as entregas no Quadro Kanban.</p>
            <Button variant="secondary" size="sm" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none">
              IR PARA O QUADRO
            </Button>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditProjectModal project={project} onClose={() => setIsEditModalOpen(false)} />
      )}
    </motion.div>
  );
}

function EditProjectModal({ project, onClose }: { project: Project, onClose: () => void }) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.clientName);
  const [desc, setDesc] = useState(project.description);
  const [category, setCategory] = useState(project.category || '');
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
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        handleApiError(error, OperationType.LIST, 'users');
      }
    };
    fetchMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          clientName: client,
          description: desc,
          category,
          deadline,
          status,
          progress,
          visibility,
          allowedUsers: visibility === 'private' ? allowedUsers : [],
          goals: goals.split('\n').filter(g => g.trim()),
          financials,
          history
        })
      });
      onClose();
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `projects/${project.id}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (uid: string) => {
    setAllowedUsers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Projeto" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome do Projeto</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={client} onChange={e => setClient(e.target.value)} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="active">Ativo</option>
              <option value="completed">Concluído</option>
              <option value="on-hold">Em Espera</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progresso (%)</label>
            <input type="number" min="0" max="100" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={progress} onChange={e => setProgress(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visibilidade</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={visibility}
              onChange={e => setVisibility(e.target.value as any)}
            >
              <option value="public">Público (Todos veem)</option>
              <option value="private">Privado (Apenas selecionados)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prazo Final</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>

        {visibility === 'private' && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quem pode ver este projeto?</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {members.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleUser(member.uid)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                    allowedUsers.includes(member.uid)
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                    {member.photoURL && <img src={member.photoURL} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="text-xs font-bold truncate">{member.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descrição</label>
          <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metas 2026 (Uma por linha)</label>
            <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={goals} onChange={e => setGoals(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financeiro</label>
            <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={financials} onChange={e => setFinancials(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">História & Contexto</label>
          <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={history} onChange={e => setHistory(e.target.value)} />
        </div>
        
        <Button type="submit" loading={loading} className="w-full">SALVAR ALTERAÇÕES</Button>
      </form>
    </Modal>
  );
}

function FeatureDetailModal({ feature, onClose }: { feature: Feature, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  
  return (
    <Modal isOpen={true} onClose={onClose} title="" size="xl">
      <div className="flex flex-col h-[85vh]">
        {/* Header / Breadcrumbs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Briefcase className="w-3 h-3" />
            <span>Projetos</span>
            <span>/</span>
            <span className="text-indigo-600 font-bold uppercase">{feature.key || feature.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
                  {feature.title}
                </h2>
                <div className="flex items-center gap-2 mb-6">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors">
                    <Plus className="w-3 h-3" /> Adicionar anexo
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors">
                    <Link2 className="w-3 h-3" /> Vincular ticket
                  </button>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Descrição</h3>
                <div className="prose prose-slate max-w-none text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {feature.description || 'Nenhuma descrição fornecida.'}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Subtarefas
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">0% concluído</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-0 transition-all" />
                </div>
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-50">
                  <div className="p-3 text-xs text-slate-400 italic text-center">
                    Nenhuma subtarefa adicionada.
                  </div>
                </div>
                <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Criar subtarefa
                </button>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Atividade</h3>
                <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                  <button 
                    onClick={() => setActiveTab('comments')}
                    className={`text-xs font-bold pb-2 border-b-2 transition-colors ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                  >
                    Comentários
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`text-xs font-bold pb-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-transparent text-slate-500' : 'border-transparent text-slate-500'}`}
                  >
                    Histórico
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Adicionar um comentário..." 
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      <strong>Dica:</strong> aperte <strong>M</strong> para comentar
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                  <Badge variant={feature.status === 'done' ? 'success' : feature.status === 'testing' ? 'warning' : 'info'} className="text-xs py-1 px-3">
                    {feature.status === 'todo' ? 'A FAZER' : feature.status === 'in-progress' ? 'EM PROGRESSO' : feature.status === 'testing' ? 'EM TESTE' : 'CONCLUÍDO'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável</label>
                    <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                        {feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-medium text-slate-700">{feature.assignedTo || 'Não atribuído'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relator</label>
                    <div className="flex items-center gap-2 p-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                        {feature.reporter ? feature.reporter[0].toUpperCase() : 'R'}
                      </div>
                      <span className="text-xs font-medium text-slate-700">{feature.reporter || 'Sistema'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioridade</label>
                    <div className="flex items-center gap-2 p-2">
                      <Badge variant={feature.priority === 'critical' ? 'danger' : feature.priority === 'high' ? 'warning' : 'info'}>
                        {feature.priority || 'Média'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Story Points</label>
                    <div className="p-2">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {feature.points || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tags</label>
                    <div className="flex flex-wrap gap-1 p-2">
                      {feature.tags?.map((tag, i) => (
                        <span key={i} className="text-[9px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase">
                          {tag}
                        </span>
                      )) || <span className="text-xs text-slate-400 italic">Nenhuma tag</span>}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400">
                    Criado em 07 de abril de 2026
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Atualizado há 5 minutos
                  </p>
                </div>
              </div>
              
              <Button onClick={onClose} className="w-full" variant="outline">FECHAR</Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function NewFeatureModal({ projectId, onClose }: { projectId: string, onClose: () => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tests, setTests] = useState('');
  const [rules, setRules] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [type, setType] = useState<'story' | 'task' | 'bug' | 'epic'>('task');
  const [points, setPoints] = useState(1);
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
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
        body: JSON.stringify({
          id: uuidv4(),
          key: featureKey,
          projectId,
          title,
          description: desc,
          testScenarios: tests,
          businessRules: rules,
          priority,
          type,
          points,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          category,
          deadline,
          status: 'todo',
          isValidated: 0,
          reporter: profile?.displayName || profile?.email
        })
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
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Título</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Login Social" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prioridade</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={priority} onChange={e => setPriority(e.target.value as any)}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={type} onChange={e => setType(e.target.value as any)}>
              <option value="task">Tarefa</option>
              <option value="story">História</option>
              <option value="bug">Bug</option>
              <option value="epic">Épico</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prioridade</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={priority} onChange={e => setPriority(e.target.value as any)}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pontos (Esforço)</label>
            <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={points} onChange={e => setPoints(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categoria</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Auth" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tags (Separadas por vírgula)</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={tags} onChange={e => setTags(e.target.value)} placeholder="Ex: frontend, api, urgente" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prazo</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descrição</label>
          <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que deve ser feito?" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cenários de Teste</label>
            <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={tests} onChange={e => setTests(e.target.value)} placeholder="1. Clicar no botão... 2. Ver erro..." />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Regras de Negócio</label>
            <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={rules} onChange={e => setRules(e.target.value)} placeholder="O usuário deve ter email verificado..." />
          </div>
        </div>
        
        <Button type="submit" loading={loading} className="w-full">LANÇAR FUNCIONALIDADE</Button>
      </form>
    </Modal>
  );
}

function EditFeatureModal({ projectId, feature, onClose }: { projectId: string, feature: Feature, onClose: () => void }) {
  const [title, setTitle] = useState(feature.title);
  const [desc, setDesc] = useState(feature.description);
  const [tests, setTests] = useState(feature.testScenarios || '');
  const [rules, setRules] = useState(feature.businessRules || '');
  const [priority, setPriority] = useState(feature.priority || 'medium');
  const [type, setType] = useState(feature.type || 'task');
  const [points, setPoints] = useState(feature.points || 1);
  const [tags, setTags] = useState(feature.tags?.join(', ') || '');
  const [category, setCategory] = useState(feature.category || '');
  const [deadline, setDeadline] = useState(feature.deadline || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: desc,
          testScenarios: tests,
          businessRules: rules,
          priority,
          type,
          points,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          category,
          deadline
        })
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={type} onChange={e => setType(e.target.value as any)}>
              <option value="task">Tarefa</option>
              <option value="story">História</option>
              <option value="bug">Bug</option>
              <option value="epic">Épico</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prioridade</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={priority} onChange={e => setPriority(e.target.value as any)}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pontos (Esforço)</label>
            <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={points} onChange={e => setPoints(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categoria</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tags (Separadas por vírgula)</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prazo</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descrição</label>
          <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cenários de Teste</label>
            <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={tests} onChange={e => setTests(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Regras de Negócio</label>
            <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={rules} onChange={e => setRules(e.target.value)} />
          </div>
        </div>
        
        <Button type="submit" loading={loading} className="w-full">SALVAR ALTERAÇÕES</Button>
      </form>
    </Modal>
  );
}
