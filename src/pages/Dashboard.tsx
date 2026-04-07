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
  Users
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

// --- Types ---
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  clientName: string;
}

interface Feature {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'testing' | 'done';
  testScenarios: string;
  businessRules: string;
  assignedTo: string;
  isValidated: boolean;
  validatedBy?: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'chat' | 'tests'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
      if (projs.length > 0 && !selectedProject) {
        setSelectedProject(projs[0]);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-xl">D</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">DEVELOI</span>
          </div>

          <nav className="space-y-2">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Visão Geral" 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
            />
            <SidebarItem 
              icon={Kanban} 
              label="Quadro Kanban" 
              active={activeTab === 'kanban'} 
              onClick={() => setActiveTab('kanban')} 
            />
            <SidebarItem 
              icon={ShieldCheck} 
              label="Testes & Regras" 
              active={activeTab === 'tests'} 
              onClick={() => setActiveTab('tests')} 
            />
            <SidebarItem 
              icon={MessageSquare} 
              label="Comunicação" 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
            />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <img src={profile?.photoURL} alt="" className="w-10 h-10 rounded-full border border-white/10" />
            <div className="overflow-hidden">
              <p className="font-bold truncate">{profile?.displayName}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-widest">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 text-neutral-500 hover:text-white transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" /> SAIR
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'kanban' && 'Kanban Board'}
              {activeTab === 'tests' && 'Cenários de Teste'}
              {activeTab === 'chat' && 'Chat do Projeto'}
            </h1>
            <p className="text-neutral-500 text-sm font-medium">Bem-vindo de volta, {profile?.displayName.split(' ')[0]}.</p>
          </div>

          <div className="flex items-center gap-4">
            <select 
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-aurora-blue"
              value={selectedProject?.id}
              onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-[#0a0a0a]">{p.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="p-2 bg-white text-black rounded-xl hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <StatCard label="Projetos Ativos" value={projects.filter(p => p.status === 'active').length} icon={Rocket} color="text-aurora-blue" />
                <StatCard label="Membros Online" value="4" icon={Users} color="text-aurora-purple" />
                <StatCard label="Testes Pendentes" value="12" icon={AlertCircle} color="text-aurora-pink" />
                
                <div className="md:col-span-2 glass p-8 rounded-[2.5rem] border-white/5">
                  <h3 className="text-xl font-black mb-6">Atividade Recente</h3>
                  <div className="space-y-6">
                    <ActivityItem user="Jefferson" action="validou a funcionalidade" target="Checkout" time="2h atrás" />
                    <ActivityItem user="Eduardo" action="criou novo projeto" target="PsiFlux" time="5h atrás" />
                    <ActivityItem user="Ana" action="enviou mensagem no chat" target="MecaERP" time="1d atrás" />
                  </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border-white/5">
                  <h3 className="text-xl font-black mb-6">Equipe</h3>
                  <div className="space-y-4">
                    <TeamMember name="Jefferson Pereira" role="Cliente VIP" status="online" />
                    <TeamMember name="Eduardo Eloi" role="Developer" status="online" />
                    <TeamMember name="Equipe Develoi" role="Elite" status="offline" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'kanban' && selectedProject && (
              <KanbanBoard projectId={selectedProject.id} />
            )}

            {activeTab === 'tests' && selectedProject && (
              <TestModule projectId={selectedProject.id} />
            )}

            {activeTab === 'chat' && selectedProject && (
              <ChatRoom projectId={selectedProject.id} />
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

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
        active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-neutral-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-black' : 'group-hover:text-white'}`} />
      <span className="font-bold text-sm uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="glass p-8 rounded-[2.5rem] border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-neutral-500 text-xs font-black uppercase tracking-widest">Global</span>
      </div>
      <p className="text-4xl font-black tracking-tighter mb-1">{value}</p>
      <p className="text-neutral-500 text-sm font-medium">{label}</p>
    </div>
  );
}

function ActivityItem({ user, action, target, time }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold">
        {user[0]}
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-bold text-white">{user}</span> {action} <span className="text-aurora-blue font-bold">{target}</span>
        </p>
        <p className="text-xs text-neutral-500">{time}</p>
      </div>
    </div>
  );
}

function TeamMember({ name, role, status }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
          {name[0]}
        </div>
        <div>
          <p className="text-sm font-bold">{name}</p>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{role}</p>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-aurora-green shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-neutral-700'}`} />
    </div>
  );
}

function KanbanBoard({ projectId }: { projectId: string }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'projects', projectId, 'features'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeatures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature)));
    });
    return () => unsubscribe();
  }, [projectId]);

  const columns = [
    { id: 'todo', label: 'A Fazer', color: 'bg-neutral-500' },
    { id: 'in-progress', label: 'Em Desenvolvimento', color: 'bg-aurora-blue' },
    { id: 'testing', label: 'Em Teste', color: 'bg-aurora-purple' },
    { id: 'done', label: 'Concluído', color: 'bg-aurora-green' }
  ];

  const updateStatus = async (featureId: string, newStatus: string) => {
    await updateDoc(doc(db, 'projects', projectId, 'features', featureId), {
      status: newStatus
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black">Fluxo de Trabalho</h2>
        <button 
          onClick={() => setIsNewFeatureModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-xl text-sm hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> NOVA FUNCIONALIDADE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-8">
        {columns.map(col => (
          <div key={col.id} className="min-w-[300px] flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400">{col.label}</span>
              <span className="text-xs font-black bg-white/10 px-2 py-1 rounded-md">
                {features.filter(f => f.status === col.id).length}
              </span>
            </div>
            
            <div className="space-y-4 min-h-[500px]">
              {features.filter(f => f.status === col.id).map(feature => (
                <motion.div
                  key={feature.id}
                  layoutId={feature.id}
                  className="glass p-6 rounded-3xl border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                >
                  <h4 className="font-bold mb-2 group-hover:text-aurora-blue transition-colors">{feature.title}</h4>
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-4">{feature.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-aurora-blue border-2 border-[#0a0a0a] flex items-center justify-center text-[8px] font-bold">E</div>
                    </div>
                    <select 
                      className="bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-lg px-2 py-1 focus:outline-none"
                      value={feature.status}
                      onChange={(e) => updateStatus(feature.id, e.target.value)}
                    >
                      {columns.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#0a0a0a]">{c.label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isNewFeatureModalOpen && (
        <NewFeatureModal projectId={projectId} onClose={() => setIsNewFeatureModalOpen(false)} />
      )}
    </motion.div>
  );
}

function TestModule({ projectId }: { projectId: string }) {
  const { profile } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'projects', projectId, 'features'), where('status', '==', 'testing'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeatures(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feature)));
    });
    return () => unsubscribe();
  }, [projectId]);

  const validateFeature = async (featureId: string) => {
    await updateDoc(doc(db, 'projects', projectId, 'features', featureId), {
      isValidated: true,
      validatedBy: profile?.displayName,
      status: 'done',
      validationDate: serverTimestamp()
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {features.length === 0 ? (
          <div className="lg:col-span-2 text-center py-20 glass rounded-[3rem] border-white/5">
            <ShieldCheck className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-2">Nenhum teste pendente</h3>
            <p className="text-neutral-500">Todas as funcionalidades estão validadas ou em desenvolvimento.</p>
          </div>
        ) : (
          features.map(feature => (
            <div key={feature.id} className="glass p-8 rounded-[3rem] border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tighter">{feature.title}</h3>
                <span className="px-4 py-1 bg-aurora-purple/20 text-aurora-purple text-[10px] font-black uppercase tracking-widest rounded-full">Aguardando Validação</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">Cenários de Teste</h4>
                  <div className="p-4 bg-white/5 rounded-2xl text-sm text-neutral-300 whitespace-pre-wrap">
                    {feature.testScenarios || 'Nenhum cenário definido.'}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">Regras de Negócio</h4>
                  <div className="p-4 bg-white/5 rounded-2xl text-sm text-neutral-300 whitespace-pre-wrap">
                    {feature.businessRules || 'Nenhuma regra definida.'}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => validateFeature(feature.id)}
                className="w-full py-4 bg-aurora-green text-black font-black rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> VALIDAR E ASSINAR
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

  useEffect(() => {
    const q = query(
      collection(db, 'projects', projectId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await addDoc(collection(db, 'projects', projectId, 'messages'), {
      projectId,
      senderId: profile?.uid,
      senderName: profile?.displayName,
      text: newMessage,
      createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  return (
    <div className="glass h-[600px] rounded-[3rem] border-white/5 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === profile?.uid ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.senderId === profile?.uid ? 'bg-aurora-blue text-white rounded-tr-none' : 'bg-white/5 text-neutral-300 rounded-tl-none'}`}>
              <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-50">{msg.senderName}</p>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-6 bg-white/5 border-t border-white/5 flex gap-4">
        <input 
          type="text"
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="p-4 bg-white text-black rounded-2xl hover:scale-105 transition-transform">
          <Send className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'projects'), {
      name,
      clientName: client,
      description: desc,
      status: 'active',
      createdAt: serverTimestamp()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg glass p-10 rounded-[3rem] border-white/10"
      >
        <h2 className="text-3xl font-black mb-8 tracking-tighter">Novo Projeto</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Nome do Projeto</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Cliente</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue" value={client} onChange={e => setClient(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Descrição</label>
            <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue resize-none" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <button className="w-full py-6 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform">CRIAR PROJETO</button>
        </form>
      </motion.div>
    </div>
  );
}

function NewFeatureModal({ projectId, onClose }: { projectId: string, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tests, setTests] = useState('');
  const [rules, setRules] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'projects', projectId, 'features'), {
      projectId,
      title,
      description: desc,
      testScenarios: tests,
      businessRules: rules,
      status: 'todo',
      isValidated: false,
      createdAt: serverTimestamp()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl glass p-10 rounded-[3rem] border-white/10 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-3xl font-black mb-8 tracking-tighter">Nova Funcionalidade</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Título</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Descrição</label>
            <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue resize-none" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Cenários de Teste</label>
              <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue resize-none" value={tests} onChange={e => setTests(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Regras de Negócio</label>
              <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-aurora-blue resize-none" value={rules} onChange={e => setRules(e.target.value)} />
            </div>
          </div>
          <button className="w-full py-6 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform">LANÇAR FUNCIONALIDADE</button>
        </form>
      </motion.div>
    </div>
  );
}
