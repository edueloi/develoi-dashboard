import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronDown, ChevronRight, Play, CheckCircle2,
  AlertCircle, Rocket, Briefcase, Calendar, Star, MoreVertical,
  Trash2, Edit2, History, BarChart2, Loader2,
  Archive, X, Kanban, GripVertical, ArrowRight, CheckSquare,
  Square, ListTodo, Pencil, Link2, Search, FileText, ClipboardList,
  Target, User, Tag, Layers, Upload, Sparkles, Copy, Check as CheckIcon,
  Bot, MessageSquare, Send, Activity, Lock, Users as UsersIcon, RotateCcw, Pause, CalendarRange,
} from 'lucide-react';
import { format, addDays, isBefore, isSameDay, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../lib/utils';
import {
  Badge, Button, Modal, ConfirmModal, ProgressBar,
  Input, Select, Textarea, EmptyState,
} from '../ui';
import type { Feature, Sprint, FeatureComment } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { RowMenu } from './financeShared';
import { SidePanel } from '../ui/SidePanel';
import { useNavigate } from 'react-router-dom';

const DraggableComponent = Draggable as any;
const DroppableComponent = Droppable as any;

// ─── Responsável pelo ticket (quem vai assumir) ─────────────────────────────────

let teamCache: string[] | null = null;
function useTeam(): string[] {
  const [names, setNames] = useState<string[]>(teamCache ?? []);
  useEffect(() => {
    if (teamCache) return;
    fetch('/api/users').then(r => r.json()).then(d => {
      const list = (Array.isArray(d) ? d : []).filter((u: any) => u?.displayName && u.active !== false).map((u: any) => String(u.displayName));
      teamCache = [...new Set(list)] as string[];
      setNames(teamCache);
    }).catch(() => {});
  }, []);
  return names;
}
const AVATAR_COLORS = ['#4F46E5', '#0D9488', '#C49A2A', '#DB2777', '#7C3AED', '#EA580C', '#0891B2', '#15803D'];
const colorOfName = (n: string) => AVATAR_COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

function Assignee({ name, size = 24 }: { name?: string | null; size?: number }) {
  if (!name) {
    return <span title="Sem responsável" className="rounded-lg border border-dashed border-slate-300 text-slate-300 flex items-center justify-center flex-shrink-0 text-[10px] font-black" style={{ width: size, height: size }}>+</span>;
  }
  return (
    <span title={`Responsável: ${name}`} className="rounded-lg text-white flex items-center justify-center flex-shrink-0 font-black" style={{ width: size, height: size, background: colorOfName(name), fontSize: size * 0.4 }}>
      {name.trim()[0]?.toUpperCase()}
    </span>
  );
}

// Duplica um ticket: copia os campos, volta para "A Fazer" e zera as subtarefas (comentários e histórico não vão)
async function duplicateFeature(f: Feature): Promise<string | null> {
  const key = `${f.projectId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const acts = parseActivities(f.activities).map(a => ({ ...a, id: uuidv4(), done: false }));
  const res = await fetch(`/api/projects/${f.projectId}/features`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: uuidv4(), key, projectId: f.projectId, sprintId: f.sprintId || null,
      title: `${f.title} (cópia)`, description: f.description || '', type: f.type || 'task', priority: f.priority || 'medium', points: f.points || 0,
      status: 'todo', reporter: f.reporter || '', assignedTo: f.assignedTo || null, functionalArea: f.functionalArea || '',
      functionalRequirements: f.functionalRequirements || '', acceptanceCriteria: f.acceptanceCriteria || '', businessRules: f.businessRules || '',
      deadline: f.deadline || null, activities: stringifyActivities(acts), linkedDemandId: f.linkedDemandId || null, linkedDemandTitle: f.linkedDemandTitle || null,
    }),
  });
  return res.ok ? key : null;
}

// itens do menu "quem assume": eu, cada pessoa da equipe e remover
function useAssignItems(feature: Feature, onRefresh: () => void) {
  const { profile } = useAuth();
  const team = useTeam();
  const me = profile?.displayName || '';
  const assign = async (name: string | null) => {
    await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo: name, actorId: profile?.uid, actorName: me }),
    });
    onRefresh();
  };
  const items: { label: string; icon: any; onClick: () => void; danger?: boolean }[] = [];
  items.push({ label: 'Duplicar ticket', icon: Copy, onClick: async () => { const k = await duplicateFeature(feature); if (k) onRefresh(); } });
  if (me && feature.assignedTo !== me) items.push({ label: 'Assumir (eu)', icon: UsersIcon, onClick: () => assign(me) });
  team.filter(n => n !== me && n !== feature.assignedTo).forEach(n => items.push({ label: `Atribuir a ${n}`, icon: User, onClick: () => assign(n) }));
  if (feature.assignedTo) items.push({ label: 'Remover responsável', icon: X, onClick: () => assign(null), danger: true });
  return items;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica',
};
const PRIORITY_COLORS: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'default',
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  bug:   <AlertCircle className="w-4 h-4 text-rose-500" />,
  story: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  epic:  <Rocket className="w-4 h-4 text-purple-500" />,
  task:  <Briefcase className="w-4 h-4 text-blue-500" />,
};

// ─── Burndown Chart ───────────────────────────────────────────────────────────

function BurnDownChart({ sprint, features }: { sprint: Sprint; features: Feature[] }) {
  const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date();
  const endDate   = sprint.endDate   ? new Date(sprint.endDate)   : addDays(startDate, 14);
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
  const totalPoints     = features.reduce((a, f) => a + (f.points || 0), 0);
  const completedPoints = features.filter(f => f.status === 'done').reduce((a, f) => a + (f.points || 0), 0);
  const days = Array.from({ length: totalDays + 1 }, (_, i) => addDays(startDate, i));

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Burndown da Sprint</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evolução de Pontos vs Tempo</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200" /><span className="text-[10px] font-black text-slate-400 uppercase">Ideal</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Real</span></div>
        </div>
      </div>
      <div className="relative h-64 w-full">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line key={i} x1="0" y1={p * 100 + '%'} x2="100%" y2={p * 100 + '%'} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          <line x1="0" y1="0%" x2="100%" y2="100%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
          <path
            d={`M 0 0 L ${totalPoints ? (completedPoints / totalPoints) * 100 : 0}% ${totalPoints ? (1 - completedPoints / totalPoints) * 100 : 0}%`}
            fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"
          />
        </svg>
        <div className="absolute -bottom-8 inset-x-0 flex justify-between px-1">
          {days.filter((_, i) => i % Math.ceil(totalDays / 5) === 0 || i === totalDays).map((day, i) => (
            <span key={i} className="text-[9px] font-black text-slate-300 uppercase">{format(day, 'dd/MM')}</span>
          ))}
        </div>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
          <p className="text-xl font-black text-slate-900">{totalPoints} pts</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Entregue</p>
          <p className="text-xl font-black text-emerald-600">{completedPoints} pts</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Restante</p>
          <p className="text-xl font-black text-indigo-600">{totalPoints - completedPoints} pts</p>
        </div>
      </div>
    </div>
  );
}

// ─── AgileManager ─────────────────────────────────────────────────────────────

interface AgileManagerProps {
  projectId: string;
  view: 'backlog' | 'board';
}

export function AgileManager({ projectId, view }: AgileManagerProps) {
  const { profile, isAdmin } = useAuth();
  const [features, setFeatures]           = useState<Feature[]>([]);
  const [sprints, setSprints]             = useState<Sprint[]>([]);
  const [loading, setLoading]             = useState(true);
  const [newSprintOpen, setNewSprintOpen] = useState(false);
  const [newTicketSprint, setNewTicketSprint] = useState<string | null>(null);
  const [importOpen, setImportOpen]       = useState(false);

  const fetchAll = async () => {
    try {
      const [fr, sr] = await Promise.all([
        fetch(`/api/projects/${projectId}/features`),
        fetch(`/api/projects/${projectId}/sprints?userId=${profile?.uid || ''}&isAdmin=${isAdmin}`),
      ]);
      const [feats, sprintsData] = await Promise.all([fr.json(), sr.json()]);
      setFeatures(Array.isArray(feats) ? feats : []);
      setSprints(Array.isArray(sprintsData) ? sprintsData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 8000);
    return () => clearInterval(t);
  }, [projectId]);

  const activeSprint = useMemo(() => sprints.find(s => s.status === 'active'), [sprints]);

  // Drag end — handles backlog↔sprint and kanban column moves
  const onDragEnd = async (result: any) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcId  = source.droppableId;      // 'backlog' | sprintId | kanban column id
    const destId = destination.droppableId;

    // Kanban board columns
    const kanbanCols = ['todo', 'in-progress', 'review', 'testing', 'done'];
    if (kanbanCols.includes(destId)) {
      await fetch(`/api/projects/${projectId}/features/${draggableId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destId, actorId: profile?.uid, actorName: profile?.displayName }),
      });
      fetchAll();
      return;
    }

    // Backlog ↔ sprint move
    const newSprintId = destId === 'backlog' ? null : destId;
    await fetch(`/api/projects/${projectId}/features/${draggableId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sprintId: newSprintId }),
    });
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-8">
        {view === 'backlog' ? (
          <BacklogView
            projectId={projectId}
            features={features}
            sprints={sprints}
            isAdmin={isAdmin}
            onRefresh={fetchAll}
            onCreateSprint={() => setNewSprintOpen(true)}
            onCreateTicket={(sprintId) => setNewTicketSprint(sprintId ?? '')}
            onImport={() => setImportOpen(true)}
          />
        ) : (
          <ActiveBoardView
            projectId={projectId}
            features={features}
            sprints={sprints}
            activeSprint={activeSprint}
            onRefresh={fetchAll}
          />
        )}

        {newSprintOpen && (
          <NewSprintModal projectId={projectId} onClose={() => setNewSprintOpen(false)} onSuccess={fetchAll} />
        )}
        {newTicketSprint !== null && (
          <NewFeatureModal
            projectId={projectId}
            defaultSprintId={newTicketSprint}
            sprints={sprints.filter(s => s.status !== 'completed')}
            onClose={() => setNewTicketSprint(null)}
            onSuccess={fetchAll}
          />
        )}
        {importOpen && (
          <ImportTicketModal
            projectId={projectId}
            sprints={sprints.filter(s => s.status !== 'completed')}
            onClose={() => setImportOpen(false)}
            onSuccess={fetchAll}
          />
        )}
      </div>
    </DragDropContext>
  );
}

// ─── BacklogView ──────────────────────────────────────────────────────────────

const TAB_KEY = 'develoi:backlog:aba';
const sprintYear = (sp: Sprint) => new Date(sp.endDate ?? sp.startDate ?? sp.createdAt).getFullYear();

function BacklogView({ projectId, features, sprints, isAdmin, onRefresh, onCreateSprint, onCreateTicket, onImport }: {
  projectId: string; features: Feature[]; sprints: Sprint[]; isAdmin: boolean;
  onRefresh: () => void; onCreateSprint: () => void; onCreateTicket: (sprintId?: string) => void;
  onImport: () => void;
}) {
  const [tab, setTabState] = useState<'plan' | 'done'>(() => { try { return localStorage.getItem(TAB_KEY) === 'done' ? 'done' : 'plan'; } catch { return 'plan'; } });
  const setTab = (t: 'plan' | 'done') => { setTabState(t); try { localStorage.setItem(TAB_KEY, t); } catch { /* sem storage */ } };
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [whoF, setWhoF] = useState<'all' | 'me' | 'none'>('all');
  const { profile: me } = useAuth();
  const [year, setYear] = useState<'all' | number>('all');

  const backlogAll = features.filter(f => !f.sprintId);
  const backlogFeatures = backlogAll.filter(f => (typeF === 'all' || (f.type || 'task') === typeF) && (whoF === 'all' || (whoF === 'me' ? f.assignedTo === me?.displayName : !f.assignedTo)) && (!q.trim() || `${f.key ?? ''} ${f.title}`.toLowerCase().includes(q.trim().toLowerCase())));
  const running = sprints.filter(s => s.status === 'active');
  const planned = sprints.filter(s => s.status === 'planned');
  const completed = sprints.filter(s => s.status === 'completed').sort((a, b) => new Date(b.endDate ?? b.startDate ?? b.createdAt).getTime() - new Date(a.endDate ?? a.startDate ?? a.createdAt).getTime());
  const featsOf = (id: string) => features.filter(f => f.sprintId === id);
  const pts = (list: Feature[]) => list.reduce((a, f) => a + (f.points || 0), 0);

  const post = async (url: string) => { await fetch(url, { method: 'POST' }); onRefresh(); };
  const handleStart  = (id: string) => post(`/api/projects/${projectId}/sprints/${id}/start`);
  const handlePause  = (id: string) => post(`/api/projects/${projectId}/sprints/${id}/pause`);
  const handleResume = async (id: string) => { await post(`/api/projects/${projectId}/sprints/${id}/reopen`); setTab('plan'); };
  const handleFinish = async (id: string) => post(`/api/projects/${projectId}/sprints/${id}/finish`);
  const handleDelete = async (id: string) => {
    const sprintFeats = features.filter(f => f.sprintId === id);
    await Promise.all(sprintFeats.map(f => fetch(`/api/projects/${projectId}/features/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sprintId: null }) })));
    await fetch(`/api/projects/${projectId}/sprints/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const years = [...new Set(completed.map(sprintYear))].sort((a, b) => b - a);
  const doneList = completed.filter(sp => (year === 'all' || sprintYear(sp) === year) && (!q.trim() || sp.name.toLowerCase().includes(q.trim().toLowerCase()) || featsOf(sp.id).some(f => f.title.toLowerCase().includes(q.trim().toLowerCase()))));
  const doneByYear = years.filter(y => year === 'all' || y === year).map(y => ({ y, list: doneList.filter(sp => sprintYear(sp) === y) })).filter(g => g.list.length);

  const sprintCard = (sprint: Sprint, extra?: Partial<React.ComponentProps<typeof SprintSection>>) => (
    <SprintSection key={sprint.id} sprint={sprint} features={featsOf(sprint.id)} isAdmin={isAdmin} onRefresh={onRefresh}
      onStart={() => handleStart(sprint.id)} onFinish={() => handleFinish(sprint.id)} onDelete={() => handleDelete(sprint.id)}
      onAddTicket={() => onCreateTicket(sprint.id)} onPause={() => handlePause(sprint.id)} onResume={() => handleResume(sprint.id)} {...extra} />
  );

  const tabBtn = (id: 'plan' | 'done', label: string, n: number, Icon: any) => (
    <button key={id} onClick={() => setTab(id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all whitespace-nowrap"
      style={tab === id ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E', boxShadow: '0 4px 12px rgba(13,31,78,0.25)' } : { background: '#fff', color: '#64748B', borderColor: 'rgba(148,163,184,0.35)' }}>
      <Icon className="w-3.5 h-3.5" />{label}<span className="text-[10px] px-1.5 py-0.5 rounded-full" style={tab === id ? { background: 'rgba(255,255,255,0.2)' } : { background: 'rgba(100,116,139,0.12)' }}>{n}</span>
    </button>
  );

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#0D1F4E] rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"><History className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Planejamento Ágil</h2>
            <p className="text-[11px] font-semibold text-slate-400">
              {backlogAll.length} no backlog · {running.length} {running.length === 1 ? 'sprint ativa' : 'sprints ativas'} · {planned.length} {planned.length === 1 ? 'planejada' : 'planejadas'} · {completed.length} {completed.length === 1 ? 'concluída' : 'concluídas'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={onCreateSprint}>NOVA SPRINT</Button>
          <Button size="sm" variant="outline" iconLeft={<Upload className="w-3.5 h-3.5" />} onClick={onImport}>IMPORTAR</Button>
          <Button size="sm" iconLeft={<Rocket className="w-3.5 h-3.5" />} onClick={() => onCreateTicket(undefined)}>NOVO TICKET</Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 overflow-x-auto">{tabBtn('plan', 'Planejamento', backlogAll.length + running.length + planned.length, ListTodo)}{tabBtn('done', 'Concluídas', completed.length, Archive)}</div>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'plan' ? 'Buscar ticket no backlog…' : 'Buscar sprint ou ticket…'}
            className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#0D1F4E]" />
        </div>
      </div>

      {/* ═══ PLANEJAMENTO: backlog de um lado, sprints do outro (dá para arrastar entre eles) ═══ */}
      {tab === 'plan' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 items-start">
          {/* Sprints primeiro no celular */}
          <div className="space-y-4 order-1 xl:order-2 min-w-0">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Play className="w-3.5 h-3.5" />Sprints em andamento e planejadas</h3>
            {running.length + planned.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <Rocket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">Nenhuma sprint ativa ou planejada</p>
                <p className="text-xs text-slate-400 mt-1">Crie uma sprint ou retome uma concluída na aba "Concluídas".</p>
                <div className="flex justify-center gap-2 mt-3"><Button size="sm" onClick={onCreateSprint}>NOVA SPRINT</Button>{completed.length > 0 && <Button size="sm" variant="outline" onClick={() => setTab('done')}>VER CONCLUÍDAS</Button>}</div>
              </div>
            ) : (
              <>
                {running.map(sp => sprintCard(sp))}
                {planned.map(sp => sprintCard(sp))}
              </>
            )}
          </div>

          {/* Backlog do produto */}
          <div className="order-2 xl:order-1 min-w-0 xl:sticky xl:top-2">
            <DroppableComponent droppableId="backlog">
              {(provided: any, snapshot: any) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  className={cn('rounded-2xl border overflow-hidden transition-colors bg-white shadow-sm', snapshot.isDraggingOver ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200')}>
                  <div className="p-3 sm:p-4 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"><Briefcase className="w-4 h-4 text-slate-500" /></div>
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">Backlog do produto</h3>
                          <p className="text-[10px] font-semibold text-slate-400">{backlogAll.length} {backlogAll.length === 1 ? 'ticket' : 'tickets'} · {pts(backlogAll)} pts · ainda sem sprint</p>
                        </div>
                      </div>
                      <button onClick={() => onCreateTicket('')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-xl flex-shrink-0"><Plus className="w-3.5 h-3.5" />Ticket</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {([['all', 'Todos'], ['story', 'Histórias'], ['task', 'Tarefas'], ['bug', 'Bugs'], ['epic', 'Épicos']] as const).map(([v, l]) => (
                        <button key={v} onClick={() => setTypeF(v)} className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                          style={typeF === v ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E' } : { color: '#64748B', borderColor: 'rgba(148,163,184,0.4)' }}>{l}</button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {([['all', 'Qualquer responsável'], ['me', 'Meus tickets'], ['none', 'Sem responsável']] as const).map(([v, l]) => (
                        <button key={v} onClick={() => setWhoF(v)} className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                          style={whoF === v ? { background: '#4F46E5', color: '#fff', borderColor: '#4F46E5' } : { color: '#64748B', borderColor: 'rgba(148,163,184,0.4)' }}>{l}</button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">Arraste um ticket para uma sprint ao lado para planejar. No menu ⋮ do ticket você define quem assume.</p>
                  </div>
                  <div className="p-2 space-y-2 min-h-[96px] xl:max-h-[calc(100vh-18rem)] xl:overflow-y-auto">
                    {backlogFeatures.length === 0 ? (
                      <div className="py-8 text-center"><p className="text-sm font-bold text-slate-400">{backlogAll.length ? 'Nenhum ticket com esses filtros.' : 'Backlog vazio. Adicione tickets ou tire de uma sprint.'}</p></div>
                    ) : backlogFeatures.map((f, i) => (
                      <DraggableComponent key={f.id} draggableId={f.id} index={i}>
                        {(prov: any, snap: any) => <FeatureRow feature={f} provided={prov} isDragging={snap.isDragging} onRefresh={onRefresh} />}
                      </DraggableComponent>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </DroppableComponent>
          </div>
        </div>
      )}

      {/* ═══ CONCLUÍDAS: por ano, para retomar ou consultar ═══ */}
      {tab === 'done' && (
        <div className="space-y-5">
          {completed.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
              <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">Nenhuma sprint concluída ainda</p>
              <p className="text-xs text-slate-400 mt-1">Quando você concluir uma sprint, ela fica guardada aqui, organizada por ano.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><CalendarRange className="w-3.5 h-3.5" />Ano</span>
                {(['all', ...years] as ('all' | number)[]).map(y => (
                  <button key={String(y)} onClick={() => setYear(y)} className="px-3 py-1.5 rounded-full text-xs font-black border"
                    style={year === y ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E' } : { color: '#64748B', borderColor: 'rgba(148,163,184,0.4)', background: '#fff' }}>
                    {y === 'all' ? 'Todos' : y} <span className="opacity-60">· {y === 'all' ? completed.length : completed.filter(sp => sprintYear(sp) === y).length}</span>
                  </button>
                ))}
              </div>

              {doneByYear.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Nada encontrado com essa busca.</p>}
              {doneByYear.map(({ y, list }) => {
                const allF = list.flatMap(sp => featsOf(sp.id));
                return (
                  <div key={y} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-slate-900">{y}</h3>
                      <span className="text-xs font-bold text-slate-400">{list.length} {list.length === 1 ? 'sprint' : 'sprints'} · {allF.length} tickets · {pts(allF)} pts entregues</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {list.map(sp => {
                        const sf = featsOf(sp.id), done = sf.filter(f => f.status === 'done').length;
                        return (
                          <div key={sp.id} className="min-w-0">
                            {sprintCard(sp)}
                            <p className="text-[10px] text-slate-400 px-2 mt-1">{done} de {sf.length} tickets concluídos</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SprintSection ────────────────────────────────────────────────────────────

function SprintSection({ sprint, features, isAdmin, onRefresh, onStart, onFinish, onDelete, onAddTicket, onPause, onResume }: {
  sprint: Sprint; features: Feature[]; isAdmin: boolean; onRefresh: () => void;
  onStart: () => void; onFinish: () => void; onDelete: () => void; onAddTicket: () => void; onPause?: () => void; onResume?: () => void;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded]         = useState(sprint.status !== 'completed');
  const [menuOpen, setMenuOpen]         = useState(false);
  const [editing, setEditing]           = useState(false);
  const [managingAccess, setManagingAccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isRestricted = Array.isArray(sprint.allowedUsers) && sprint.allowedUsers.length > 0;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const statusConfig = {
    active:    { label: 'Sprint Ativa', color: 'success' as const, icon: Play },
    planned:   { label: 'Planejada',    color: 'info'    as const, icon: Calendar },
    completed: { label: 'Concluída',    color: 'default' as const, icon: Archive },
  };
  const cfg = statusConfig[sprint.status];

  return (
    <>
      <DroppableComponent droppableId={sprint.id}>
        {(provided: any, snapshot: any) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'rounded-xl border transition-all duration-300 bg-white shadow-sm',
              sprint.status === 'active' ? 'border-indigo-400 ring-4 ring-indigo-500/5' : 'border-slate-200',
              snapshot.isDraggingOver && 'border-indigo-400 bg-indigo-50/20'
            )}
          >
            {/* Header */}
            <div className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                  {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white',
                  sprint.status === 'active' ? 'bg-indigo-600' : sprint.status === 'completed' ? 'bg-slate-400' : 'bg-slate-200 text-slate-500')}>
                  <cfg.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 tracking-tight">{sprint.name}</h3>
                    <Badge color={cfg.color} size="sm" pill>{cfg.label}</Badge>
                    {isRestricted && (
                      <span title="Só pessoas escolhidas podem ver esta sprint" className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 uppercase tracking-widest">
                        <Lock className="w-3 h-3" /> Restrita
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {features.length} {features.length === 1 ? 'ticket' : 'tickets'} · {features.reduce((a, f) => a + (f.points || 0), 0)} pts
                    {sprint.startDate && sprint.endDate && ` · ${format(new Date(sprint.startDate), 'dd/MM')} – ${format(new Date(sprint.endDate), sprint.status === 'completed' ? 'dd/MM/yyyy' : 'dd/MM')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {sprint.status === 'planned' && <Button size="xs" variant="outline" iconLeft={<Play className="w-3 h-3" />} onClick={onStart}>INICIAR</Button>}
                {sprint.status === 'completed' && onResume && <Button size="xs" variant="outline" iconLeft={<RotateCcw className="w-3 h-3" />} onClick={onResume}>RETOMAR</Button>}
                {sprint.status === 'active' && <Button size="xs" variant="outline" iconLeft={<CheckCircle2 className="w-3 h-3" />} onClick={() => setConfirmFinish(true)}>CONCLUIR</Button>}
                {/* 3-dot menu — todas as ações ficam aqui */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden">
                      {/* Editar */}
                      <button
                        onClick={() => { setEditing(true); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-slate-400" /> Editar Sprint
                      </button>

                      <button
                        onClick={() => { try { localStorage.setItem(BOARD_SPRINT_KEY, sprint.id); } catch { /* sem storage */ } navigate(`/dashboard/quadro${window.location.search}`); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Kanban className="w-4 h-4 text-slate-400" /> Abrir no Quadro
                      </button>
                      {/* Adicionar ticket */}
                      {sprint.status !== 'completed' && <button
                        onClick={() => { onAddTicket(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-400" /> Adicionar Ticket
                      </button>}

                      {/* Quem pode ver — só quem é administrador pode mexer nisso */}
                      {isAdmin && (
                        <button
                          onClick={() => { setManagingAccess(true); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Lock className="w-4 h-4 text-slate-400" /> Quem Pode Ver
                        </button>
                      )}

                      <div className="h-px bg-slate-100 my-1" />

                      {/* Iniciar / Concluir */}
                      {sprint.status === 'planned' && (
                        <button
                          onClick={() => { onStart(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Play className="w-4 h-4" /> Iniciar Sprint
                        </button>
                      )}
                      {sprint.status === 'completed' && onResume && (
                        <button
                          onClick={() => { onResume(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" /> Retomar Sprint
                        </button>
                      )}
                      {sprint.status === 'active' && onPause && (
                        <button
                          onClick={() => { onPause(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Pause className="w-4 h-4" /> Pausar (voltar a planejada)
                        </button>
                      )}
                      {sprint.status === 'active' && (
                        <button
                          onClick={() => { setConfirmFinish(true); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Concluir Sprint
                        </button>
                      )}

                      <div className="h-px bg-slate-100 my-1" />

                      {/* Excluir */}
                      <button
                        onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir Sprint
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tickets list */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2 min-h-[56px]">
                    <div className="h-px bg-slate-100 mx-2 mb-2" />
                    {features.length === 0 ? (
                      <div className="py-5 text-center border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-xs font-bold text-slate-400">Arraste tickets do backlog ou clique em <strong>+</strong> para adicionar.</p>
                      </div>
                    ) : (
                      features.map((f, i) => (
                        <DraggableComponent key={f.id} draggableId={f.id} index={i}>
                          {(prov: any, snap: any) => (
                            <FeatureRow feature={f} provided={prov} isDragging={snap.isDragging} onRefresh={onRefresh} />
                          )}
                        </DraggableComponent>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </DroppableComponent>

      {editing && (
        <EditSprintModal sprint={sprint} onClose={() => setEditing(false)} onSuccess={onRefresh} />
      )}

      {managingAccess && (
        <SprintVisibilityModal sprint={sprint} onClose={() => setManagingAccess(false)} onSuccess={onRefresh} />
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(); }}
        title="Excluir Sprint"
        message={`Excluir "${sprint.name}"? Os tickets voltam ao backlog. Esta ação não pode ser desfeita.`}
        confirmLabel="EXCLUIR"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        onConfirm={() => { setConfirmFinish(false); onFinish(); }}
        title="Concluir Sprint"
        message={`Concluir "${sprint.name}"? Tarefas não finalizadas voltam ao backlog.`}
        confirmLabel="CONCLUIR"
        variant="primary"
      />
    </>
  );
}

// ─── FeatureRow (draggable) ───────────────────────────────────────────────────

function FeatureRow({ feature, provided, isDragging, onRefresh }: {
  feature: Feature; provided: any; isDragging: boolean; onRefresh: () => void;
}) {
  const assignItems = useAssignItems(feature, onRefresh);
  const [editing, setEditing]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <>
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 bg-white border rounded-lg transition-all cursor-default',
          isDragging ? 'shadow-xl border-[#0D1F4E]/40 rotate-1 scale-[1.02]' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
        )}
      >
        {/* drag handle */}
        <div {...provided.dragHandleProps} className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 text-slate-300 hover:text-slate-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="shrink-0">{TYPE_ICONS[feature.type || 'task']}</div>
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0 w-16 sm:w-20 truncate">{feature.key || '—'}</span>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(true)}>
          <span className="text-sm font-bold text-slate-700 truncate block group-hover:text-indigo-900">{feature.title}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {feature.functionalArea && (
              <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{feature.functionalArea}</span>
            )}
            {feature.reporter && <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title="Quem solicitou">Relator: {feature.reporter}</span>}
            {feature.linkedDemandId && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-400 font-bold">
                <Link2 className="w-2.5 h-2.5" /> Vinculado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge color={PRIORITY_COLORS[feature.priority || 'medium']} size="xs" pill>
            {PRIORITY_LABELS[feature.priority || 'medium']}
          </Badge>
          <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
            {feature.points || 0}
          </div>
          <Assignee name={feature.assignedTo} />
          {assignItems.length > 0 && <RowMenu items={assignItems} />}
          {/* Edit */}
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            title="Editar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {/* Delete */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing && (
        <EditFeatureModal
          feature={feature}
          onClose={() => setEditing(false)}
          onSuccess={() => { setEditing(false); onRefresh(); }}
          onChanged={onRefresh}
        />
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
        title="Excluir Ticket"
        message={`Excluir "${feature.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="EXCLUIR"
        variant="danger"
      />
    </>
  );
}

// ─── ActiveBoardView ──────────────────────────────────────────────────────────

const BOARD_SPRINT_KEY = 'develoi:quadro:sprint';

function ActiveBoardView({ projectId, features, sprints, activeSprint, onRefresh }: {
  projectId: string; features: Feature[]; sprints: Sprint[]; activeSprint?: Sprint; onRefresh: () => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [whoF, setWhoF] = useState<'all' | 'me' | 'none'>('all');
  const { profile: me } = useAuth();
  const [selId, setSelId] = useState<string>(() => { try { return localStorage.getItem(BOARD_SPRINT_KEY) || ''; } catch { return ''; } });
  const pick = (id: string) => { setSelId(id); try { localStorage.setItem(BOARD_SPRINT_KEY, id); } catch { /* sem storage */ } };

  // sprint exibida: a escolhida (se ainda existir no projeto), senão a ativa, senão a primeira planejada, senão a última concluída
  const sprint = sprints.find(sp => sp.id === selId) ?? activeSprint ?? sprints.find(sp => sp.status === 'planned') ?? [...sprints].reverse().find(sp => sp.status === 'completed');

  if (!sprint) {
    return (
      <EmptyState
        icon={Kanban}
        title="Nenhuma sprint ainda"
        description="Crie uma sprint no Backlog para ver o quadro kanban."
        className="py-10"
      />
    );
  }

  const sprintAll = features.filter(f => f.sprintId === sprint.id);
  const sprintFeatures = sprintAll.filter(f => whoF === 'all' || (whoF === 'me' ? f.assignedTo === me?.displayName : !f.assignedTo));
  const columns = [
    { id: 'todo',        label: 'A Fazer',          color: 'default'  },
    { id: 'in-progress', label: 'Em Desenvolvimento', color: 'info'   },
    { id: 'review',      label: 'Em Revisão',        color: 'purple'  },
    { id: 'testing',     label: 'Em Teste',          color: 'warning' },
    { id: 'done',        label: 'Concluído',         color: 'success' },
  ];
  const doneAll = sprintAll.filter(f => f.status === 'done');
  const pct = sprintAll.length ? Math.round((doneAll.length / sprintAll.length) * 100) : 0;
  const ptsAll = sprintAll.reduce((a, f) => a + (f.points || 0), 0), ptsDone = doneAll.reduce((a, f) => a + (f.points || 0), 0);
  const subDone = sprintAll.reduce((a, f) => a + parseActivities(f.activities).filter(x => x.done).length, 0);
  const subAll = sprintAll.reduce((a, f) => a + parseActivities(f.activities).length, 0);
  const stLabel = { active: 'Ativa', planned: 'Planejada', completed: 'Concluída' }[sprint.status];
  const stColor = { active: '#4F46E5', planned: '#C49A2A', completed: '#15803D' }[sprint.status];
  const optLabel = (sp: Sprint) => `${sp.status === 'active' ? '● ' : sp.status === 'completed' ? '✓ ' : '○ '}${sp.name}${sp.status === 'completed' ? ` (${new Date(sp.endDate ?? sp.startDate ?? sp.createdAt).getFullYear()})` : ''}`;
  const ordered = [...sprints].sort((a, b) => ({ active: 0, planned: 1, completed: 2 }[a.status] - { active: 0, planned: 1, completed: 2 }[b.status]));

  // quem entregou o quê (conclusões da sprint por responsável)
  const byPerson = new Map<string, { done: number; total: number }>();
  sprintAll.forEach(f => { const n = f.assignedTo || 'Sem responsável'; const x = byPerson.get(n) ?? { done: 0, total: 0 }; x.total++; if (f.status === 'done') x.done++; byPerson.set(n, x); });

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0" style={{ background: stColor }}><Rocket className="w-5 h-5" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">{sprint.name}</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: stColor }}>{stLabel}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5"><Calendar className="w-3 h-3" />
                {sprint.startDate ? format(new Date(sprint.startDate), 'dd MMM yyyy', { locale: ptBR }) : 'sem início'} a {sprint.endDate ? format(new Date(sprint.endDate), 'dd MMM yyyy', { locale: ptBR }) : 'em andamento'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="min-w-[220px]"><Select aria-label="Sprint" value={sprint.id} onChange={e => pick(e.target.value)} options={ordered.map(sp => ({ value: sp.id, label: optLabel(sp) }))} /></div>
            <Button variant="outline" size="sm" iconLeft={<BarChart2 className="w-4 h-4" />} onClick={() => setReportOpen(true)}>RELATÓRIO</Button>
          </div>
        </div>

        {sprint.goal && <p className="text-xs text-slate-500 border-l-4 border-indigo-200 pl-3">{sprint.goal}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'Concluído', v: `${pct}%`, s: `${doneAll.length} de ${sprintAll.length} tickets`, c: '#15803D' },
            { l: 'Pontos entregues', v: `${ptsDone}/${ptsAll}`, s: 'story points', c: '#4F46E5' },
            { l: 'Subtarefas', v: subAll ? `${subDone}/${subAll}` : '—', s: subAll ? `${Math.round((subDone / subAll) * 100)}% feitas` : 'sem subtarefas', c: '#0891B2' },
            { l: 'Em andamento', v: String(sprintAll.filter(f => f.status !== 'done' && f.status !== 'todo').length), s: `${sprintAll.filter(f => f.status === 'todo').length} a fazer`, c: '#C49A2A' },
          ].map(k => (
            <div key={k.l} className="rounded-xl border border-slate-200 p-3" style={{ borderTop: `3px solid ${k.c}` }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.l}</p>
              <p className="text-xl font-black" style={{ color: k.c }}>{k.v}</p>
              <p className="text-[10px] text-slate-400">{k.s}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Mostrar</span>
          {([['all', `Todos (${sprintAll.length})`], ['me', `Meus (${sprintAll.filter(f => f.assignedTo === me?.displayName).length})`], ['none', `Sem responsável (${sprintAll.filter(f => !f.assignedTo).length})`]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setWhoF(v)} className="px-3 py-1.5 rounded-full text-xs font-bold border"
              style={whoF === v ? { background: '#4F46E5', color: '#fff', borderColor: '#4F46E5' } : { color: '#64748B', borderColor: 'rgba(148,163,184,0.4)', background: '#fff' }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
        {columns.map(col => (
          <DroppableComponent key={col.id} droppableId={col.id}>
            {(provided: any) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="min-w-[260px] w-[260px] flex flex-col gap-2">
                <div className="flex items-center justify-between px-3 py-2 bg-white/70 border border-slate-200 rounded-lg">
                  <Badge color={col.color as any} dot pill size="sm">{col.label}</Badge>
                  <span className="text-[10px] font-black text-slate-400">{sprintFeatures.filter(f => f.status === col.id).length}</span>
                </div>
                <div className="space-y-2 min-h-[320px]">
                  {sprintFeatures.filter(f => f.status === col.id).map((f, i) => (
                    <DraggableComponent key={f.id} draggableId={f.id} index={i}>
                      {(prov: any) => <BoardCard provided={prov} feature={f} onRefresh={onRefresh} />}
                    </DraggableComponent>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </DroppableComponent>
        ))}
      </div>

      {/* Conclusões da sprint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Concluídos nesta sprint ({doneAll.length})</h3>
          {doneAll.length === 0 ? <p className="text-sm text-slate-400">Nenhum ticket concluído ainda.</p> : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {doneAll.map(f => (
                <li key={f.id} className="flex items-center gap-2.5 text-sm">
                  <Assignee name={f.assignedTo} size={24} />
                  <span className="text-[10px] font-black text-indigo-600 w-16 truncate flex-shrink-0">{f.key}</span>
                  <span className="font-semibold text-slate-700 truncate flex-1">{f.title}</span>
                  <span className="text-[10px] font-black text-slate-400 flex-shrink-0">{f.points || 0} pts</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3"><UsersIcon className="w-4 h-4 text-indigo-500" />Entrega por pessoa</h3>
          {byPerson.size === 0 ? <p className="text-sm text-slate-400">Sem tickets nesta sprint.</p> : (
            <ul className="space-y-3">
              {[...byPerson.entries()].map(([name, v]) => (
                <li key={name}>
                  <div className="flex items-center gap-2 text-xs"><Assignee name={name === 'Sem responsável' ? null : name} size={22} /><span className="font-bold text-slate-700 flex-1 truncate">{name}</span><span className="font-black text-slate-500">{v.done}/{v.total}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 mt-1.5"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(v.done / v.total) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {reportOpen && (
        <Modal isOpen={true} onClose={() => setReportOpen(false)} title={`Relatório: ${sprint.name}`} size="lg">
          <BurnDownChart sprint={sprint} features={sprintAll} />
        </Modal>
      )}
    </div>
  );
}

// ─── BoardCard ────────────────────────────────────────────────────────────────

function BoardCard({ provided, feature, onRefresh }: { provided: any; feature: Feature; onRefresh: () => void }) {
  const assignItems = useAssignItems(feature, onRefresh);
  const [editing, setEditing] = useState(false);
  const activities = parseActivities(feature.activities);
  const done = activities.filter(a => a.done).length;

  return (
    <>
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        onClick={() => setEditing(true)}
        className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className={cn('absolute top-0 left-0 bottom-0 w-1.5 rounded-l-lg',
          feature.type === 'bug' ? 'bg-rose-500' : feature.type === 'story' ? 'bg-emerald-500' : feature.type === 'epic' ? 'bg-purple-500' : 'bg-indigo-500'
        )} />
        <div className="pl-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{feature.key || '—'}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500">{feature.points || 0}</div>
              <Badge color={PRIORITY_COLORS[feature.priority || 'medium']} size="xs" pill>{PRIORITY_LABELS[feature.priority || 'medium']}</Badge>
            </div>
          </div>
          <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">{feature.title}</h4>
          {feature.reporter && <p className="text-[10px] text-slate-400 -mt-1.5">Relator: {feature.reporter}</p>}
          {activities.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(done / activities.length) * 100}%` }} />
              </div>
              <span className="text-[9px] font-black text-slate-400">{done}/{activities.length}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div className="flex items-center gap-2 min-w-0">
              <Assignee name={feature.assignedTo} size={26} />
              <span className="text-[10px] font-bold text-slate-400 truncate">{feature.assignedTo ? feature.assignedTo.split(' ')[0] : 'Sem responsável'}</span>
            </div>
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
              {assignItems.length > 0 && <RowMenu items={assignItems} />}
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {editing && (
        <EditFeatureModal feature={feature} onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); onRefresh(); }} onChanged={onRefresh} />
      )}
    </>
  );
}

// ─── Activities helpers ───────────────────────────────────────────────────────

interface Activity { id: string; text: string; done: boolean; }

function parseActivities(raw?: string | null): Activity[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function stringifyActivities(acts: Activity[]): string {
  return JSON.stringify(acts);
}

// ─── FeatureFormBody — campos compartilhados entre New e Edit ────────────────

function ActivitiesField({ activities, setActivities }: {
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}) {
  const [newActivity, setNewActivity] = useState('');
  const [draggedIdx, setDraggedIdx]   = useState<number | null>(null);
  const [actToDelete, setActToDelete] = useState<string | null>(null);
  const doneCount = activities.filter(a => a.done).length;

  const add = () => {
    const text = newActivity.trim();
    if (!text) return;
    setActivities(p => [...p, { id: uuidv4(), text, done: false }]);
    setNewActivity('');
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setActivities(prev => {
      const items = [...prev];
      const dragged = items[draggedIdx];
      items.splice(draggedIdx, 1);
      items.splice(idx, 0, dragged);
      return items;
    });
    setDraggedIdx(idx);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">
          Atividades / Subtarefas
          {activities.length > 0 && <span className="ml-2 text-indigo-500">{doneCount}/{activities.length}</span>}
        </label>
      </div>
      {activities.length > 0 && (
        <div className="mb-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(doneCount / activities.length) * 100}%` }} />
        </div>
      )}
      <div className="space-y-1.5 mb-2">
        {activities.map((act, idx) => (
          <div
            key={act.id}
            draggable
            onDragStart={() => setDraggedIdx(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragEnd={() => setDraggedIdx(null)}
            className={cn('flex items-center gap-2 group/act px-2 py-1.5 rounded-xl transition-all border',
              draggedIdx === idx ? 'opacity-50 border-indigo-200 bg-white shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-100')}
          >
            <div className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing px-1">
              <GripVertical className="w-4 h-4" />
            </div>
            <button type="button" onClick={() => setActivities(p => p.map(a => a.id === act.id ? { ...a, done: !a.done } : a))} className="shrink-0">
              {act.done ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-slate-300" />}
            </button>
            <input
              type="text"
              value={act.text}
              onChange={e => setActivities(p => p.map(a => a.id === act.id ? { ...a, text: e.target.value } : a))}
              className={cn('text-sm flex-1 bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1.5 py-0.5 transition-all',
                act.done ? 'line-through text-slate-400' : 'text-slate-700')}
            />
            <button type="button" onClick={() => setActToDelete(act.id)} className="opacity-0 group-hover/act:opacity-100 p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={newActivity} onChange={e => setNewActivity(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Nova atividade... (Enter para adicionar)"
          className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
        />
        <button type="button" onClick={add} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {!!actToDelete && (
        <ConfirmModal isOpen onClose={() => setActToDelete(null)}
          onConfirm={() => { setActivities(p => p.filter(a => a.id !== actToDelete)); setActToDelete(null); }}
          title="Excluir Subtarefa" message="Excluir esta subtarefa?" confirmLabel="EXCLUIR" variant="danger" />
      )}
    </div>
  );
}

// ─── LinkedDemandPicker ───────────────────────────────────────────────────────

function LinkedDemandPicker({ projectId, value, onChange }: {
  projectId: string;
  value: { id: string; title: string } | null;
  onChange: (v: { id: string; title: string } | null) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [features, setFeats]  = useState<Feature[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/features`)
      .then(r => r.json())
      .then(d => setFeats(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [projectId]);

  const filtered = features.filter(f =>
    !query || f.title.toLowerCase().includes(query.toLowerCase()) || (f.key || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 12);

  return (
    <div className="relative">
      <label className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500 block mb-1.5 flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5 text-indigo-400" /> Vincular a Demanda / Ticket Existente
      </label>
      {value ? (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50">
          <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-indigo-700 truncate">{value.title}</p>
            <p className="text-[10px] text-indigo-400 font-bold">ID: {value.id.slice(0, 8)}...</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="text-indigo-400 hover:text-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
        >
          <Search className="w-4 h-4" />
          Buscar e vincular uma demanda existente...
        </button>
      )}

      {open && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar por título ou código..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-slate-700"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1.5">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">Nenhuma demanda encontrada.</p>
            ) : (
              filtered.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { onChange({ id: f.id, title: f.title }); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                >
                  <div className="shrink-0">{TYPE_ICONS[f.type || 'task']}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{f.title}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase">{f.key || '—'}</p>
                  </div>
                  <Badge color={PRIORITY_COLORS[f.priority || 'medium']} size="xs" pill>
                    {PRIORITY_LABELS[f.priority || 'medium']}
                  </Badge>
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className="w-full py-2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors">CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FormSection helper ───────────────────────────────────────────────────────

function FSection({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-indigo-400">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─── CommentsPanel — comentários + linha do tempo de atividade do ticket ─────

function CommentsPanel({ projectId, featureId }: { projectId: string; featureId: string }) {
  const { profile } = useAuth();
  const [items, setItems] = useState<FeatureComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchComments = async () => {
    try {
      const r = await fetch(`/api/projects/${projectId}/features/${featureId}/comments`);
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchComments();
    const t = setInterval(fetchComments, 8000);
    return () => clearInterval(t);
  }, [featureId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await fetch(`/api/projects/${projectId}/features/${featureId}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, authorId: profile?.uid, authorName: profile?.displayName }),
      });
      setText('');
      await fetchComments();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  if (loading) {
    return <div className="py-6 text-center"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Nenhuma atividade ainda.</p>
        ) : (
          items.map(item => (
            item.type === 'activity' ? (
              <div key={item.id} className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                <Activity className="w-3 h-3 text-indigo-300 shrink-0" />
                <span><strong className="text-slate-500 font-bold">{item.authorName || 'Alguém'}</strong> {item.text}</span>
                <span className="ml-auto shrink-0">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}</span>
              </div>
            ) : (
              <div key={item.id} className="flex gap-2.5 px-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                  {(item.authorName || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-slate-700">{item.authorName || 'Usuário'}</span>
                    <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{item.text}</p>
                </div>
              </div>
            )
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Escreva um comentário..."
          className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-4 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── EditFeatureModal ─────────────────────────────────────────────────────────

function EditFeatureModal({ feature, onClose, onSuccess, onChanged }: { feature: Feature; onClose: () => void; onSuccess: () => void; onChanged?: () => void }) {
  const { profile, isAdmin } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [dupBusy, setDupBusy] = useState(false);
  const [title,       setTitle]       = useState(feature.title);
  const [desc,        setDesc]        = useState(feature.description || '');
  const [type,        setType]        = useState(feature.type || 'task');
  const [priority,    setPriority]    = useState(feature.priority || 'medium');
  const [points,      setPoints]      = useState(feature.points || 0);
  const [status,      setStatus]      = useState(feature.status || 'todo');
  const [sprintId,    setSprintId]    = useState(feature.sprintId || '');
  const [reporter,    setReporter]    = useState(feature.reporter || '');
  const [assignee,    setAssignee]    = useState(feature.assignedTo || '');
  const team = useTeam();
  const [sprints,     setSprints]     = useState<Sprint[]>([]);
  const [area,        setArea]        = useState(feature.functionalArea || '');
  const [funcReqs,    setFuncReqs]    = useState(feature.functionalRequirements || '');
  const [acceptance,  setAcceptance]  = useState(feature.acceptanceCriteria || '');
  const [objective,   setObjective]   = useState(feature.businessRules || '');
  const [deadline,    setDeadline]    = useState(feature.deadline ? feature.deadline.slice(0, 10) : '');
  const [activities,  setActivities]  = useState<Activity[]>(parseActivities(feature.activities));
  const [linkedDemand, setLinkedDemand] = useState<{ id: string; title: string } | null>(
    feature.linkedDemandId ? { id: feature.linkedDemandId, title: feature.linkedDemandTitle || '' } : null
  );
  const [tab,           setTab]           = useState<'desc' | 'subtasks' | 'comments' | 'links'>('desc');
  const [loading,       setLoading]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${feature.projectId}/sprints?userId=${profile?.uid || ''}&isAdmin=${isAdmin}`).then(r => r.json()).then(d => setSprints(Array.isArray(d) ? d : [])).catch(() => {});
  }, [feature.projectId]); // eslint-disable-line

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description: desc, type, priority, points: type === 'epic' ? 0 : points, status, sprintId: sprintId || null,
          reporter, assignedTo: assignee || null, functionalArea: area,
          functionalRequirements: funcReqs,
          acceptanceCriteria: acceptance,
          businessRules: objective,
          deadline: deadline || null,
          activities: stringifyActivities(activities),
          linkedDemandId: linkedDemand?.id || null,
          linkedDemandTitle: linkedDemand?.title || null,
          actorId: profile?.uid,
          actorName: profile?.displayName,
        }),
      });
      onSuccess();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const quickPatch = async (body: Record<string, unknown>) => {
    await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, actorId: profile?.uid, actorName: profile?.displayName }),
    });
    onChanged?.();
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, { method: 'DELETE' });
      onSuccess();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const typeLabel = { story: 'História', task: 'Tarefa', bug: 'Bug', epic: 'Demanda' }[type as 'story'] || 'Ticket';
  const doneActs = activities.filter(a => a.done).length;
  const sprintOptions = [{ value: '', label: 'Backlog (sem sprint)' }, ...sprints.filter(sp => sp.status !== 'completed' || sp.id === sprintId).map(sp => ({ value: sp.id, label: `${sp.name}${sp.status === 'active' ? ' (ativa)' : sp.status === 'completed' ? ' (concluída)' : ''}` }))];
  const lbl = 'text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block';

  const tabBtn = (id: typeof tab, label: string, n?: number) => (
    <button key={id} type="button" onClick={() => setTab(id)} className="px-3.5 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-colors"
      style={tab === id ? { background: '#fff', color: '#0D1F4E', boxShadow: '0 1px 3px rgba(0,0,0,.12)' } : { color: '#64748B' }}>
      {label}{n !== undefined && <span className="ml-1.5 opacity-60">({n})</span>}
    </button>
  );

  return (
    <SidePanel isOpen onClose={onClose}
      title={<span className="flex items-center gap-2 min-w-0"><span className="flex-shrink-0">{TYPE_ICONS[type]}</span><span className="text-[11px] font-black text-indigo-600 tracking-widest flex-shrink-0">{feature.key || '—'}</span><span className="text-xs font-bold text-slate-400 flex-shrink-0">{typeLabel}</span></span> as any}
      footer={mode === 'view' ? (
        <div className="flex gap-2 sm:justify-between items-center">
          <button type="button" onClick={() => setConfirmDelete(true)} className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-1.5 text-xs font-black"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">EXCLUIR</span></button>
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Button type="button" variant="outline" iconLeft={<Copy className="w-4 h-4" />} loading={dupBusy} onClick={async () => { setDupBusy(true); const k = await duplicateFeature(feature); setDupBusy(false); if (k) { onChanged?.(); onClose(); } }}>DUPLICAR</Button>
            <Button type="button" fullWidth className="sm:w-56" iconLeft={<Pencil className="w-4 h-4" />} onClick={() => setMode('edit')}>EDITAR TICKET</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 sm:justify-between items-center">
          <button type="button" onClick={() => setConfirmDelete(true)} className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-1.5 text-xs font-black"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">EXCLUIR</span></button>
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Button type="button" variant="outline" onClick={() => setMode('view')} className="hidden sm:inline-flex">CANCELAR</Button>
            <Button type="submit" form="ticket-form" loading={loading} fullWidth className="sm:w-56">SALVAR ALTERAÇÕES</Button>
          </div>
        </div>
      )}>
      {(full: boolean) => mode === 'view' ? (<>
        <TicketView feature={feature} full={full} sprintName={sprints.find(sp => sp.id === feature.sprintId)?.name} team={team} me={profile?.displayName || ''} onPatch={quickPatch} />
        {confirmDelete && (
          <ConfirmModal isOpen onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
            title="Excluir Ticket" message={`Excluir "${feature.title}"? Esta ação não pode ser desfeita.`}
            confirmLabel="EXCLUIR" variant="danger" />
        )}
      </>) : (<>
      <form id="ticket-form" onSubmit={handleSubmit} className={cn('grid items-start', full ? 'grid-cols-[minmax(0,1fr)_320px] gap-8' : 'grid-cols-1 gap-5')}>
        {/* ── conteúdo ── */}
        <div className="space-y-5 min-w-0">
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Título do ticket"
            className="w-full text-xl sm:text-2xl font-black text-slate-900 bg-transparent border-0 border-b-2 border-transparent hover:border-slate-200 focus:border-[#0D1F4E] focus:outline-none px-0 py-1 transition-colors" />

          <div className="inline-flex p-1 rounded-xl bg-slate-100 max-w-full overflow-x-auto">
            {tabBtn('desc', 'Descrição')}
            {tabBtn('subtasks', 'Subtarefas', activities.length ? doneActs : undefined)}
            {tabBtn('comments', 'Comentários e histórico')}
            {tabBtn('links', 'Vínculos', linkedDemand ? 1 : 0)}
          </div>

          {tab === 'desc' && (
            <div className="space-y-4">
              {type === 'story' && <StoryFields split desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs} acceptance={acceptance} setAcceptance={setAcceptance} objective={objective} setObjective={setObjective} linkedDemand={linkedDemand} setLinkedDemand={setLinkedDemand} projectId={feature.projectId} />}
              {type === 'task' && <TaskFields split desc={desc} setDesc={setDesc} activities={activities} setActivities={setActivities} linkedDemand={linkedDemand} setLinkedDemand={setLinkedDemand} projectId={feature.projectId} />}
              {type === 'bug' && <BugFields split desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs} acceptance={acceptance} setAcceptance={setAcceptance} activities={activities} setActivities={setActivities} />}
              {type === 'epic' && <EpicFields desc={desc} setDesc={setDesc} objective={objective} setObjective={setObjective} funcReqs={funcReqs} setFuncReqs={setFuncReqs} />}
            </div>
          )}
          {tab === 'subtasks' && (
            <div>
              <p className="text-xs text-slate-400 mb-3">{type === 'bug' ? 'Cenários de teste e passos para validar a correção.' : 'Passos menores que compõem este ticket. Marque conforme for concluindo.'}</p>
              <ActivitiesField activities={activities} setActivities={setActivities} />
            </div>
          )}
          {tab === 'comments' && <CommentsPanel projectId={feature.projectId} featureId={feature.id} />}
          {tab === 'links' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">{type === 'story' ? 'Demanda pai desta história.' : 'Demanda a que este ticket está vinculado.'}</p>
              <LinkedDemandPicker projectId={feature.projectId} value={linkedDemand} onChange={setLinkedDemand} />
            </div>
          )}
        </div>

        {/* ── detalhes (barra lateral) ── */}
        <aside className={cn('rounded-2xl border border-slate-200 bg-slate-50/60 p-4', full ? 'space-y-3.5 sticky top-0' : 'grid grid-cols-2 gap-3.5 order-first')}>
          <h3 className="text-sm font-black text-slate-900 col-span-2">Detalhes</h3>
          <div><label className={lbl}>Status</label>
            <Select value={status} onChange={e => setStatus(e.target.value as any)} options={[{ value: 'todo', label: 'A Fazer' }, { value: 'in-progress', label: 'Em Desenvolvimento' }, { value: 'review', label: 'Em Revisão' }, { value: 'testing', label: 'Em Teste' }, { value: 'done', label: 'Concluído' }]} /></div>
          <div><label className={lbl}>Sprint (jogar para uma sprint)</label>
            <Select value={sprintId} onChange={e => setSprintId(e.target.value)} options={sprintOptions} /></div>
          <div className="grid grid-cols-2 gap-3 col-span-2">
            <div><label className={lbl}>Tipo</label>
              <Select value={type} onChange={e => setType(e.target.value as any)} options={[{ value: 'story', label: 'História' }, { value: 'task', label: 'Tarefa' }, { value: 'bug', label: 'Bug' }, { value: 'epic', label: 'Demanda' }]} /></div>
            <div><label className={lbl}>Prioridade</label>
              <Select value={priority} onChange={e => setPriority(e.target.value as any)} options={[{ value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' }]} /></div>
          </div>
          <div className="col-span-2"><label className={lbl}>Responsável (quem assume)</label>
            <div className="flex items-center gap-2">
              <Assignee name={assignee} size={32} />
              <div className="flex-1 min-w-0"><Select value={assignee} onChange={e => setAssignee(e.target.value)}
                options={[{ value: '', label: 'Ninguém ainda' }, ...[...new Set([...team, ...(assignee ? [assignee] : [])])].map(n => ({ value: n, label: n }))]} /></div>
            </div>
            {profile?.displayName && assignee !== profile.displayName && <button type="button" onClick={() => setAssignee(profile.displayName as string)} className="text-[11px] font-black text-indigo-600 mt-1.5 hover:underline">Assumir para mim</button>}
          </div>
          <div className="col-span-2"><label className={lbl}>Relator (quem solicitou)</label>
            <Select value={reporter} onChange={e => setReporter(e.target.value)}
              options={[{ value: '', label: 'Não informado' }, ...[...new Set([...team, ...(reporter ? [reporter] : [])])].map(n => ({ value: n, label: n }))]} /></div>
          <div className="grid grid-cols-2 gap-3 col-span-2">
            {type !== 'epic' && <div><label className={lbl}>Story points</label><Input type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} /></div>}
            <div><label className={lbl}>Prazo</label><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
          </div>
          {(type === 'story' || type === 'task' || type === 'bug') && (
            <div className="col-span-2"><label className={lbl}>Tela / funcionalidade</label><Input placeholder="Ex: Acompanhamento Aviso Embarque" value={area} onChange={e => setArea(e.target.value)} /></div>
          )}
        </aside>
      </form>

      {confirmDelete && (
        <ConfirmModal isOpen onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
          title="Excluir Ticket" message={`Excluir "${feature.title}"? Esta ação não pode ser desfeita.`}
          confirmLabel="EXCLUIR" variant="danger" />
      )}
      </>)}
    </SidePanel>
  );
}

// ─── Visualização do ticket: tudo à mão (descrição, subtarefas, quem mexeu e comentários) ───

const STATUS_LABEL: Record<string, string> = { todo: 'A Fazer', 'in-progress': 'Em Desenvolvimento', review: 'Em Revisão', testing: 'Em Teste', done: 'Concluído' };
const STATUS_COLOR: Record<string, string> = { todo: '#64748B', 'in-progress': '#2563EB', review: '#7C3AED', testing: '#C49A2A', done: '#15803D' };

function TicketView({ feature, full, sprintName, team, me, onPatch }: {
  feature: Feature; full: boolean; sprintName?: string; team: string[]; me: string; onPatch: (b: Record<string, unknown>) => Promise<void>;
}) {
  const acts = parseActivities(feature.activities);
  const done = acts.filter(a => a.done).length;
  const [newAct, setNewAct] = useState('');
  const type = feature.type || 'task';
  const lines = (t?: string | null) => (t || '').split('\n').map(x => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  const dl = feature.deadline ? Math.ceil((new Date(feature.deadline).getTime() - Date.now()) / 86400000) : null;
  const sec = (icon: React.ReactNode, label: string, extra?: React.ReactNode) => (
    <div className="flex items-center gap-2 mb-3"><span className="text-slate-400">{icon}</span><h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</h3>{extra}<div className="h-px bg-slate-100 flex-1" /></div>
  );
  const list = (items: string[], color: string) => (
    <ul className="space-y-1.5">{items.map((it, i) => <li key={i} className="flex gap-2 text-sm text-slate-700 leading-snug"><span className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0" style={{ background: color }} /><span className="break-words min-w-0">{it}</span></li>)}</ul>
  );
  const toggle = (id: string) => onPatch({ activities: stringifyActivities(acts.map(a => (a.id === id ? { ...a, done: !a.done } : a))) });
  const addAct = async () => { const t = newAct.trim(); if (!t) return; setNewAct(''); await onPatch({ activities: stringifyActivities([...acts, { id: uuidv4(), text: t, done: false }]) }); };
  const reqs = lines(feature.functionalRequirements), acc = lines(feature.acceptanceCriteria), obj = (feature.businessRules || '').trim();

  const left = (
    <div className="space-y-7 min-w-0">
      <section>
        {sec(<FileText className="w-4 h-4" />, type === 'bug' ? 'Como reproduzir' : 'Descrição')}
        {feature.description?.trim() ? <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">{feature.description}</p> : <p className="text-sm text-slate-400 italic">Sem descrição. Use "Editar ticket" para preencher.</p>}
        {obj && <div className="mt-4 rounded-xl bg-indigo-50/60 border border-indigo-100 p-3"><p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Objetivo</p><p className="text-sm text-slate-700 whitespace-pre-line">{obj}</p></div>}
      </section>
      {reqs.length > 0 && <section>{sec(<ClipboardList className="w-4 h-4" />, type === 'bug' ? 'Comportamento atual' : type === 'epic' ? 'Escopo' : 'Requisitos funcionais')}{list(reqs, '#4F46E5')}</section>}
      {acc.length > 0 && <section>{sec(<CheckCircle2 className="w-4 h-4" />, type === 'bug' ? 'Comportamento esperado' : 'Critérios de aceite')}{list(acc, '#15803D')}</section>}
      <section>
        {sec(<CheckSquare className="w-4 h-4" />, 'Subtarefas', acts.length ? <span className="text-[11px] font-black text-slate-400">{done}/{acts.length}</span> : null)}
        {acts.length > 0 && <div className="h-1.5 rounded-full bg-slate-100 mb-3"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(done / acts.length) * 100}%` }} /></div>}
        <ul className="space-y-1">
          {acts.map(a => (
            <li key={a.id}><button type="button" onClick={() => toggle(a.id)} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left">
              {a.done ? <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />}
              <span className={cn('text-sm break-words min-w-0', a.done ? 'line-through text-slate-400' : 'text-slate-700')}>{a.text}</span>
            </button></li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <input value={newAct} onChange={e => setNewAct(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAct(); } }} placeholder="Nova subtarefa… (Enter para adicionar)"
            className="flex-1 h-10 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#0D1F4E]" />
          <Button type="button" variant="outline" size="sm" onClick={addAct}><Plus className="w-4 h-4" /></Button>
        </div>
      </section>
    </div>
  );

  const right = (
    <section className="min-w-0">
      {sec(<MessageSquare className="w-4 h-4" />, 'Relatos e histórico')}
      <p className="text-[11px] text-slate-400 -mt-1 mb-2">Quem moveu o ticket, quem mudou o quê e os comentários da equipe.</p>
      <CommentsPanel projectId={feature.projectId} featureId={feature.id} />
    </section>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight break-words">{feature.title}</h2>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <select value={feature.status} onChange={e => onPatch({ status: e.target.value })} title="Mudar o status"
            className="text-xs font-black rounded-full px-3 py-1.5 border-0 text-white cursor-pointer focus:outline-none" style={{ background: STATUS_COLOR[feature.status] ?? '#64748B' }}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v} style={{ color: '#0f172a' }}>{l}</option>)}
          </select>
          <Badge color={PRIORITY_COLORS[feature.priority || 'medium']} size="sm" pill>{PRIORITY_LABELS[feature.priority || 'medium']}</Badge>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{sprintName ? `Sprint: ${sprintName}` : 'Backlog (sem sprint)'}</span>
          {type !== 'epic' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{feature.points || 0} pts</span>}
          {feature.deadline && <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: dl !== null && dl < 0 && feature.status !== 'done' ? '#FEE2E2' : '#F1F5F9', color: dl !== null && dl < 0 && feature.status !== 'done' ? '#DC2626' : '#475569' }}><Calendar className="w-3 h-3" />{format(new Date(feature.deadline), 'dd/MM/yyyy')}{dl !== null && feature.status !== 'done' ? (dl < 0 ? ` · ${-dl}d atrasado` : dl === 0 ? ' · hoje' : ` · ${dl}d`) : ''}</span>}
          {feature.linkedDemandTitle && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 flex items-center gap-1 max-w-full truncate"><Link2 className="w-3 h-3 flex-shrink-0" /><span className="truncate">{feature.linkedDemandTitle}</span></span>}
        </div>
      </div>

      {/* Quem faz e quem pediu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <Assignee name={feature.assignedTo} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsável</p>
            <select value={feature.assignedTo || ''} onChange={e => onPatch({ assignedTo: e.target.value || null })} className="w-full text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer -ml-0.5">
              <option value="">Ninguém ainda</option>
              {[...new Set([...team, ...(feature.assignedTo ? [feature.assignedTo] : [])])].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {me && feature.assignedTo !== me && <button type="button" onClick={() => onPatch({ assignedTo: me })} className="text-[11px] font-black text-indigo-600 hover:underline">Assumir para mim</button>}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <Assignee name={feature.reporter} size={36} />
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relator (quem solicitou)</p><p className="text-sm font-bold text-slate-800 truncate">{feature.reporter || 'Não informado'}</p></div>
        </div>
      </div>

      <div className={cn('grid gap-8 items-start', full ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-1')}>
        {left}
        {right}
      </div>
    </div>
  );
}

// ─── EditSprintModal ──────────────────────────────────────────────────────────

function EditSprintModal({ sprint, onClose, onSuccess }: { sprint: Sprint; onClose: () => void; onSuccess: () => void }) {
  const [name,      setName]      = useState(sprint.name);
  const [goal,      setGoal]      = useState(sprint.goal || '');
  const [startDate, setStartDate] = useState(sprint.startDate ? format(new Date(sprint.startDate), 'yyyy-MM-dd') : '');
  const [endDate,   setEndDate]   = useState(sprint.endDate   ? format(new Date(sprint.endDate),   'yyyy-MM-dd') : '');
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${sprint.projectId}/sprints/${sprint.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, goal, startDate, endDate }),
      });
      onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Sprint" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nome da Sprint" required value={name} onChange={e => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Data Início" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="Data Fim"    type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
        </div>
        <Textarea label="Objetivo da Sprint" value={goal} onChange={e => setGoal(e.target.value)} rows={3} placeholder="O que queremos alcançar nesta sprint?" />
        <Button type="submit" loading={loading} fullWidth size="lg">SALVAR</Button>
      </form>
    </Modal>
  );
}

// ─── SprintVisibilityModal ────────────────────────────────────────────────────

interface TeamMemberOption { uid: string; displayName: string; email: string; photoURL?: string | null; active?: boolean; }

function SprintVisibilityModal({ sprint, onClose, onSuccess }: { sprint: Sprint; onClose: () => void; onSuccess: () => void }) {
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [restricted, setRestricted] = useState(Array.isArray(sprint.allowedUsers) && sprint.allowedUsers.length > 0);
  const [selected, setSelected] = useState<Set<string>>(new Set(sprint.allowedUsers || []));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, []);

  const toggle = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${sprint.projectId}/sprints/${sprint.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedUsers: restricted ? Array.from(selected) : null }),
      });
      onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Quem Pode Ver Esta Sprint" size="md">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRestricted(false)}
            className={cn('p-3 rounded-2xl border-2 text-left transition-all',
              !restricted ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300')}
          >
            <p className="text-sm font-black text-slate-900">Todo Mundo</p>
            <p className="text-xs text-slate-500 mt-0.5">Qualquer pessoa da equipe pode ver</p>
          </button>
          <button
            type="button"
            onClick={() => setRestricted(true)}
            className={cn('p-3 rounded-2xl border-2 text-left transition-all',
              restricted ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300')}
          >
            <p className="text-sm font-black text-slate-900">Só Quem Eu Escolher</p>
            <p className="text-xs text-slate-500 mt-0.5">Só as pessoas marcadas abaixo veem</p>
          </button>
        </div>

        {restricted && (
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marque quem pode ver</p>
            {loadingMembers ? (
              <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nenhuma pessoa cadastrada em Membros ainda.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1 border border-slate-100 rounded-2xl p-2">
                {members.map(m => (
                  <button
                    key={m.uid}
                    type="button"
                    onClick={() => toggle(m.uid)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    {selected.has(m.uid) ? <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{m.displayName || m.email}</p>
                      <p className="text-xs text-slate-400 truncate">{m.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleSave} loading={saving} fullWidth size="lg" disabled={restricted && selected.size === 0}>
          SALVAR
        </Button>
        {restricted && selected.size === 0 && (
          <p className="text-xs text-amber-600 text-center -mt-3">Marque pelo menos uma pessoa.</p>
        )}
      </div>
    </Modal>
  );
}

// ─── NewSprintModal ───────────────────────────────────────────────────────────

function NewSprintModal({ projectId, onClose, onSuccess }: { projectId: string; onClose: () => void; onSuccess: () => void }) {
  const [name,      setName]      = useState(`Sprint ${new Date().toLocaleDateString('pt-BR', { month: 'short' })} #1`);
  const [goal,      setGoal]      = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate,   setEndDate]   = useState(format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd'));
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/sprints`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uuidv4(), projectId, name, goal, startDate, endDate, status: 'planned', createdAt: new Date().toISOString() }),
      });
      onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Sprint" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nome" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sprint Alpha #1" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Início" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="Fim"    type="date" value={endDate}   onChange={e => setEndDate(e.target.value)} />
        </div>
        <Textarea label="Objetivo" value={goal} onChange={e => setGoal(e.target.value)} placeholder="O que pretendemos alcançar?" rows={3} />
        <Button type="submit" loading={loading} fullWidth size="lg">CRIAR SPRINT</Button>
      </form>
    </Modal>
  );
}

// ─── AiPromptCopyButton ───────────────────────────────────────────────────────

function AiPromptCopyButton({ typeId, label, icon, prompt }: { typeId: string; label: string; icon: React.ReactNode; prompt: string }) {
  const [copied, setCopied] = useState(false);

  const COLORS: Record<string, string> = {
    story: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    task:  'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    bug:   'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
    epic:  'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition-all ${COLORS[typeId]}`}
    >
      {copied ? <CheckIcon className="w-4 h-4" /> : icon}
      {label}
      {copied ? <span className="text-[10px]">Copiado!</span> : <Copy className="w-3 h-3 opacity-60" />}
    </button>
  );
}

// ─── ImportTicketModal ────────────────────────────────────────────────────────

function parseImportText(raw: string) {
  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const labelVariants = {
    title: ['título', 'titulo', 'title', 'nome', 'demanda'],
    type: ['tipo', 'type'],
    priority: ['prioridade', 'priority'],
    points: ['story points', 'story point', 'pontos', 'points'],
    reporter: ['relator', 'reporter', 'solicitante', 'quem solicitou'],
    area: ['tela / funcionalidade', 'tela', 'funcionalidade', 'área funcional', 'area funcional'],
    deadline: ['prazo', 'deadline', 'data limite'],
    desc: ['descrição', 'descricao', 'narrativa', 'como usuário, eu quero', 'como usuario, eu quero', 'como usuário', 'como usuario', 'contexto', 'description', 'passos para reproduzir'],
    funcReqs: ['requisitos funcionais', 'requisitos', 'functional requirements', 'comportamento atual'],
    acceptance: ['critérios de aceite', 'criterios de aceite', 'critério de aceite', 'criterio de aceite', 'acceptance criteria', 'comportamento esperado'],
    objective: ['objetivo de negócio', 'objetivo de negocio', 'business objective', 'objetivo', 'resultado', 'visão', 'visao'],
    activities: ['atividades', 'subtarefas', 'checklist', 'escopo'],
  } as const;

  const buildLabelMatcher = (label: string) => `${escapeRegex(label)}(?:\\s*\\([^\\n)]*\\))?`;
  const allLabels = Array.from(new Set(Object.values(labelVariants).flat())).sort((a, b) => b.length - a.length);
  const nextLabelPattern = allLabels.map(buildLabelMatcher).join('|');

  let normalized = raw
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  for (const label of allLabels) {
    const matcher = buildLabelMatcher(label);
    normalized = normalized.replace(
      new RegExp(`([^\\n])\\s+(${matcher}\\s*[:\\-])`, 'giu'),
      '$1\n$2'
    );
  }
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  const cleanValue = (value: string) => value
    .replace(/^[-=\s]+$/gm, '')
    .replace(/^\[.*?\]$/gm, '')
    .replace(/^Ex:.*$/gim, '')
    .replace(/^Contexto do .*?:.*$/gim, '')
    .replace(/={3,}/g, '')
    .replace(/-{3,}/g, '')
    .replace(/MODELO DE IMPORTAÇÃO[\s\S]*?Preencha todos os campos/gi, '')
    .replace(/FIM DO MODELO[\s\S]*/gi, '')
    .trim();

  const get = (labels: readonly string[]) => {
    for (const label of labels) {
      const re = new RegExp(
        `(?:^|\\n)\\s*${buildLabelMatcher(label)}\\s*[:\\-]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${nextLabelPattern})\\s*[:\\-]|\\n={3,}|$)`,
        'iu'
      );
      const match = normalized.match(re);
      if (!match) continue;
      const value = cleanValue(match[1] || '');
      if (value) return value;
    }
    return '';
  };

  const inferLeadingTitle = () => {
    const firstLine = normalized
      .split('\n')
      .map(line => line.trim())
      .find(line => line && !/^(=|-){3,}$/.test(line) && !/MODELO DE IMPORTAÇÃO|Develoi Hub|FIM DO MODELO/i.test(line));

    if (!firstLine) return '';

    const inlineLabelRe = new RegExp(`^(.*?)(?=\\s+(?:${nextLabelPattern})\\s*[:\\-]|$)`, 'iu');
    const match = firstLine.match(inlineLabelRe);
    return cleanValue((match?.[1] || firstLine).trim());
  };

  const rawType = get(labelVariants.type).toLowerCase();
  const rawPrio = get(labelVariants.priority).toLowerCase();
  const rawActs = get(labelVariants.activities);
  const desc = get(labelVariants.desc);
  const funcReqs = get(labelVariants.funcReqs);
  const acceptance = get(labelVariants.acceptance);
  const objective = get(labelVariants.objective);

  const type = (() => {
    if (rawType.includes('bug')) return 'bug';
    if (rawType.includes('demand') || rawType.includes('épic') || rawType.includes('epic') || rawType.includes('epico')) return 'epic';
    if (rawType.includes('tare') || rawType.includes('task')) return 'task';
    if (rawType.includes('hist') || rawType.includes('story')) return 'story';
    if (/comportamento atual|comportamento esperado|passos para reproduzir/i.test(normalized)) return 'bug';
    if (/atividades|subtarefas|checklist/i.test(normalized) && !/critérios de aceite|criterios de aceite|como usuário|como usuario/i.test(normalized)) return 'task';
    if (/visão estratégica|visao estrategica|histórias planejadas|historias planejadas|tipo:\s*demanda|tipo:\s*épico|tipo:\s*epico/i.test(normalized)) return 'epic';
    return 'story';
  })();

  const priority = rawPrio.includes('crít') || rawPrio.includes('crit') || rawPrio.includes('critical')
    ? 'critical'
    : rawPrio.includes('alta') || rawPrio.includes('high')
      ? 'high'
      : rawPrio.includes('baixa') || rawPrio.includes('low')
        ? 'low'
        : 'medium';

  const pointsRaw = get(labelVariants.points);
  const pointsValue = parseInt(pointsRaw.match(/\d+/)?.[0] || '', 10);
  const points = type === 'epic' ? 0 : (Number.isFinite(pointsValue) ? pointsValue : 1);
  const title = get(labelVariants.title) || inferLeadingTitle();
  const reporter = get(labelVariants.reporter);
  const area = get(labelVariants.area);
  const rawDeadline = get(labelVariants.deadline);
  const deadline = (() => {
    const m = rawDeadline.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const m2 = rawDeadline.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
    if (m2) return rawDeadline.slice(0, 10);
    return '';
  })();

  const activities: { id: string; text: string; done: boolean }[] = rawActs
    ? rawActs
      .split(/\n|(?=\s*[-•*]\s)|(?=\s*\d+\.\s)/)
      .map(line => line.replace(/^[-•*\d.]+\s*/, '').trim())
      .filter(Boolean)
      .map(text => ({ id: uuidv4(), text, done: false }))
    : [];

  return { title, type, priority, points, reporter, area, deadline, desc, funcReqs, acceptance, objective, activities };
}

function extractPdfPageText(items: any[]) {
  const lines: string[] = [];
  let currentLine: string[] = [];
  let lastY: number | null = null;

  const flushLine = () => {
    if (currentLine.length === 0) return;
    lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim());
    currentLine = [];
  };

  for (const item of items) {
    const text = typeof item?.str === 'string' ? item.str.replace(/\s+/g, ' ').trim() : '';
    if (!text) continue;

    const itemY = Array.isArray(item.transform) ? Number(item.transform[5]) : lastY;
    if (lastY !== null && itemY !== null && Math.abs(itemY - lastY) > 2) {
      flushLine();
    }

    currentLine.push(text);
    lastY = itemY;

    if (item.hasEOL) {
      flushLine();
    }
  }

  flushLine();
  return lines.join('\n');
}

function ImportTicketModal({ projectId, sprints, onClose, onSuccess }: {
  projectId: string; sprints: Sprint[]; onClose: () => void; onSuccess: () => void;
}) {
  const [step, setStep]         = useState<'input' | 'preview'>('input');
  const [rawText, setRawText]   = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [sprintId, setSprintId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const TEMPLATES: Record<string, string> = {
    story: `========================================
  MODELO DE IMPORTAÇÃO — HISTÓRIA
  Develoi Hub | Preencha todos os campos
========================================

Título: [Ex: Alteração de Labels na tela de Aviso Embarque]

Tipo: História
Prioridade: [Baixa | Média | Alta | Crítica]
Story Points: [número ex: 3]
Relator: [Nome de quem solicitou]
Tela: [Nome da tela ou módulo]
Prazo: [dd/mm/aaaa — opcional]

----------------------------------------
DESCRIÇÃO (narrativa do usuário):
----------------------------------------
Eu como [perfil do usuário] desejo [o que quer] para que [qual benefício/motivo].

Ex: Eu como analista de comércio exterior desejo que o sistema atualize
a nomenclatura dos campos de ICMS para que os termos sejam consistentes
com os processos de ICMS/EXONERAÇÃO.

----------------------------------------
REQUISITOS FUNCIONAIS:
----------------------------------------
- [Requisito 1: O sistema deverá fazer X]
- [Requisito 2: O sistema deverá fazer Y]
- [Requisito 3: A alteração deve refletir em todas as telas relacionadas]

----------------------------------------
CRITÉRIOS DE ACEITE:
----------------------------------------
- [Critério 1: O label X deve aparecer como Y na Grid Inicial]
- [Critério 2: O filtro deve continuar funcionando normalmente]
- [Critério 3: Nenhum dado salvo deve ser alterado]

----------------------------------------
OBJETIVO:
----------------------------------------
[Descreva o valor de negócio desta história. Ex: Padronizar a terminologia
com o processo de ICMS/EXONERAÇÃO para reduzir erros operacionais.]

========================================
  FIM DO MODELO — Salve como .txt e importe
========================================`,

    task: `========================================
  MODELO DE IMPORTAÇÃO — TAREFA
  Develoi Hub | Preencha todos os campos
========================================

Título: [Ex: Configurar integração com API de pagamentos]

Tipo: Tarefa
Prioridade: [Baixa | Média | Alta | Crítica]
Story Points: [número ex: 5]
Relator: [Nome de quem solicitou]
Tela: [Nome da tela ou módulo — opcional]
Prazo: [dd/mm/aaaa — opcional]

----------------------------------------
DESCRIÇÃO:
----------------------------------------
[Descreva o que precisa ser feito em detalhes.
O que deve ser implementado, alterado ou configurado?]

Ex: Configurar o endpoint de webhook da API do Stripe para receber
notificações de pagamento e atualizar o status do pedido automaticamente.

----------------------------------------
ATIVIDADES:
----------------------------------------
- [Subtarefa 1: Criar endpoint /webhook/stripe]
- [Subtarefa 2: Validar assinatura do payload]
- [Subtarefa 3: Atualizar status do pedido no banco]
- [Subtarefa 4: Testar com eventos simulados]
- [Subtarefa 5: Deploy em produção]

========================================
  FIM DO MODELO — Salve como .txt e importe
========================================`,

    bug: `========================================
  MODELO DE IMPORTAÇÃO — BUG
  Develoi Hub | Preencha todos os campos
========================================

Título: [Ex: Filtro de datas não retorna resultados corretos]

Tipo: Bug
Prioridade: [Baixa | Média | Alta | Crítica]
Story Points: [número ex: 2]
Relator: [Nome de quem reportou]
Tela: [Nome da tela onde o bug ocorre]
Prazo: [dd/mm/aaaa — opcional]

----------------------------------------
DESCRIÇÃO (passos para reproduzir):
----------------------------------------
1. [Acesse a tela X]
2. [Selecione o filtro de data: De 01/01/2026 Até 31/01/2026]
3. [Clique em Pesquisar]
4. [Observe que os resultados incluem registros fora do período]

----------------------------------------
COMPORTAMENTO ATUAL:
----------------------------------------
[Descreva o que acontece atualmente — o bug em si.]

Ex: O sistema retorna registros de fevereiro mesmo com o filtro
configurado apenas para janeiro de 2026.

----------------------------------------
COMPORTAMENTO ESPERADO:
----------------------------------------
[Descreva o que deveria acontecer corretamente.]

Ex: O sistema deve retornar apenas registros cujo campo "Data de Emissão"
esteja dentro do intervalo selecionado: 01/01/2026 a 31/01/2026.

----------------------------------------
ATIVIDADES:
----------------------------------------
- [Cenário 1: Filtrar por mês de janeiro e verificar resultados]
- [Cenário 2: Filtrar por um dia específico e verificar]
- [Cenário 3: Verificar se o bug ocorre em outros filtros de data]

========================================
  FIM DO MODELO — Salve como .txt e importe
========================================`,

    epic: `========================================
  MODELO DE IMPORTAÇÃO — DEMANDA
  Develoi Hub | Preencha todos os campos
========================================

Título: [Ex: Módulo de Relatórios Gerenciais]

Tipo: Demanda
Prioridade: [Baixa | Média | Alta | Crítica]
Relator: [Nome do responsável pela demanda]
Prazo: [dd/mm/aaaa — data estimada de conclusão]

----------------------------------------
DESCRIÇÃO (visão estratégica):
----------------------------------------
[Qual é a iniciativa ou objetivo maior que esta demanda representa?
Qual problema de negócio ou oportunidade ela resolve?]

Ex: Criar um módulo centralizado de relatórios gerenciais que permita
à diretoria acompanhar KPIs de vendas, produção e financeiro em tempo
real, eliminando a dependência de planilhas manuais.

----------------------------------------
OBJETIVO:
----------------------------------------
[Quais métricas ou resultados esta demanda deve alcançar?]

Ex: Reduzir em 80% o tempo gasto na geração de relatórios mensais.
Aumentar a precisão dos dados de 70% para 99%.
Permitir acesso mobile para gestores externos.

----------------------------------------
REQUISITOS FUNCIONAIS:
----------------------------------------
- [História 1: Como diretor, quero ver o dashboard de vendas em tempo real]
- [História 2: Como gerente, quero exportar relatórios em Excel e PDF]
- [História 3: Como analista, quero criar filtros personalizados por período]
- [História 4: Como admin, quero configurar permissões de acesso por cargo]

========================================
  FIM DO MODELO — Salve como .txt e importe
========================================`,
  };

  const AI_PROMPTS: Record<string, { label: string; color: string; prompt: string }> = {
    story: {
      label: 'História',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      prompt: `Você é um analista de sistemas especialista em metodologias ágeis (Scrum/SAFe). Preciso que você me ajude a criar uma história de usuário bem estruturada para o nosso sistema de gestão de projetos.

Por favor, gere a história no seguinte formato exato (mantenha os rótulos e separadores idênticos):

Título: [Título claro e objetivo da história]

Tipo: História
Prioridade: [Baixa | Média | Alta | Crítica]
Story Points: [número de 1 a 13]
Relator: [Nome de quem solicitou]
Tela: [Nome da tela ou módulo afetado]
Prazo: [dd/mm/aaaa — se aplicável]

----------------------------------------
DESCRIÇÃO (narrativa do usuário):
----------------------------------------
Eu como [perfil do usuário] desejo [o que quer] para que [qual benefício/motivo].

----------------------------------------
REQUISITOS FUNCIONAIS:
----------------------------------------
- [Requisito 1: O sistema deverá...]
- [Requisito 2: O sistema deverá...]
- [Requisito 3: ...]

----------------------------------------
CRITÉRIOS DE ACEITE:
----------------------------------------
- [Critério 1: Dado que... quando... então...]
- [Critério 2: ...]
- [Critério 3: ...]

----------------------------------------
OBJETIVO:
----------------------------------------
[Valor de negócio desta história — qual problema resolve, qual resultado espera alcançar]

Contexto do que preciso: [DESCREVA AQUI O QUE VOCÊ PRECISA]`,
    },
    task: {
      label: 'Tarefa',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      prompt: `Você é um analista de sistemas especialista em metodologias ágeis. Preciso que você crie uma tarefa técnica bem descrita para o nosso sistema de gestão de projetos.

Por favor, gere a tarefa no seguinte formato exato (mantenha os rótulos e separadores idênticos):

Título: [Título claro e objetivo da tarefa]

Tipo: Tarefa
Prioridade: [Baixa | Média | Alta | Crítica]
Story Points: [número de 1 a 13]
Relator: [Nome de quem solicitou]
Tela: [Nome da tela ou módulo — se aplicável]
Prazo: [dd/mm/aaaa — se aplicável]

----------------------------------------
DESCRIÇÃO:
----------------------------------------
[Descrição detalhada do que precisa ser feito. O que deve ser implementado, alterado ou configurado?]

----------------------------------------
ATIVIDADES:
----------------------------------------
- [Subtarefa 1: ...]
- [Subtarefa 2: ...]
- [Subtarefa 3: ...]
- [Subtarefa 4: ...]

Contexto do que preciso: [DESCREVA AQUI O QUE VOCÊ PRECISA]`,
    },
    bug: {
      label: 'Bug',
      color: 'bg-rose-50 border-rose-200 text-rose-800',
      prompt: `Você é um analista de QA especialista em documentação de bugs. Preciso que você estruture um relatório de bug completo para o nosso sistema de gestão de projetos.

Por favor, gere o bug no seguinte formato exato (mantenha os rótulos e separadores idênticos):

Título: [Título descritivo do bug — O que + Onde]

Tipo: Bug
Prioridade: [Baixa | Média | Alta | Crítica]
Story Points: [número de 1 a 5]
Relator: [Nome de quem reportou]
Tela: [Nome da tela onde o bug ocorre]
Prazo: [dd/mm/aaaa — se urgente]

----------------------------------------
DESCRIÇÃO (passos para reproduzir):
----------------------------------------
1. [Passo 1: Acesse a tela X]
2. [Passo 2: ...]
3. [Passo 3: ...]
4. [Passo 4: Observe o erro]

----------------------------------------
COMPORTAMENTO ATUAL:
----------------------------------------
[O que acontece atualmente — descreva o bug em si]

----------------------------------------
COMPORTAMENTO ESPERADO:
----------------------------------------
[O que deveria acontecer corretamente]

----------------------------------------
ATIVIDADES:
----------------------------------------
- [Cenário de teste 1: ...]
- [Cenário de teste 2: ...]
- [Cenário de teste 3: ...]

Contexto do bug que encontrei: [DESCREVA AQUI O BUG]`,
    },
    epic: {
      label: 'Demanda',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      prompt: `Você é um Product Manager especialista em metodologias ágeis (SAFe/Scrum). Preciso que você estruture uma demanda macro completa para o nosso sistema de gestão de projetos.

Por favor, gere a demanda no seguinte formato exato (mantenha os rótulos e separadores idênticos):

Título: [Nome estratégico da demanda]

Tipo: Demanda
Prioridade: [Baixa | Média | Alta | Crítica]
Relator: [Nome do responsável pela demanda]
Prazo: [dd/mm/aaaa — data estimada de conclusão]

----------------------------------------
DESCRIÇÃO (visão estratégica):
----------------------------------------
[Qual é a iniciativa ou objetivo maior que esta demanda representa? Qual problema de negócio ou oportunidade ela resolve?]

----------------------------------------
OBJETIVO:
----------------------------------------
[Quais métricas ou resultados esta demanda deve alcançar? Quais indicadores de sucesso?]

----------------------------------------
REQUISITOS FUNCIONAIS:
----------------------------------------
- [História 1: Como... desejo... para que...]
- [História 2: Como... desejo... para que...]
- [História 3: Como... desejo... para que...]
- [História 4: Como... desejo... para que...]

Contexto do que preciso: [DESCREVA AQUI A INICIATIVA]`,
    },
  };

  const downloadTemplate = (templateType: string) => {
    const content = TEMPLATES[templateType];
    const names: Record<string, string> = { story: 'modelo-historia', task: 'modelo-tarefa', bug: 'modelo-bug', epic: 'modelo-demanda' };
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${names[templateType]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parsed preview state
  const [title,      setTitle]      = useState('');
  const [type,       setType]       = useState<any>('story');
  const [priority,   setPriority]   = useState<any>('medium');
  const [points,     setPoints]     = useState(1);
  const [reporter,   setReporter]   = useState('');
  const [area,       setArea]       = useState('');
  const [deadline,   setDeadline]   = useState('');
  const [desc,       setDesc]       = useState('');
  const [funcReqs,   setFuncReqs]   = useState('');
  const [acceptance, setAcceptance] = useState('');
  const [objective,  setObjective]  = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadPdfJs = (): Promise<any> => {
    if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // unpkg serve qualquer versão publicada no npm
      script.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc =
            'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          resolve(lib);
        } else {
          reject(new Error('pdfjsLib não encontrado após carregamento'));
        }
      };
      script.onerror = () => reject(new Error('Falha ao carregar pdf.js'));
      document.head.appendChild(script);
    });
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        setLoading(true);
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = extractPdfPageText(content.items as any[]);
          fullText += pageText + '\n\n';
        }
        setRawText(fullText.trim());
      } catch (err) {
        console.error('Erro ao ler PDF:', err);
        alert('Não foi possível ler o PDF. Tente exportar como .txt e importar.');
      } finally {
        setLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = e => setRawText((e.target?.result as string) || '');
      reader.readAsText(file, 'utf-8');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleParse = () => {
    const parsed = parseImportText(rawText);
    setTitle(parsed.title);
    setType(parsed.type);
    setPriority(parsed.priority);
    setPoints(parsed.points);
    setReporter(parsed.reporter);
    setArea(parsed.area);
    setDeadline(parsed.deadline);
    setDesc(parsed.desc);
    setFuncReqs(parsed.funcReqs);
    setAcceptance(parsed.acceptance);
    setObjective(parsed.objective);
    setActivities(parsed.activities);
    setStep('preview');
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const key = `${projectId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(), key, projectId,
          sprintId: sprintId || null,
          title, description: desc, type, priority, points: type === 'epic' ? 0 : points,
          status: 'todo', reporter,
          functionalArea: area,
          functionalRequirements: funcReqs,
          acceptanceCriteria: acceptance,
          businessRules: objective,
          deadline: deadline || null,
          activities: stringifyActivities(activities),
          linkedDemandId: null, linkedDemandTitle: null,
        }),
      });
      onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];

  return (
    <Modal isOpen onClose={onClose} title={step === 'input' ? 'Importar História / Ticket' : 'Revisar e Criar Ticket'} size="2xl">
      {step === 'input' ? (
        <div className="space-y-5">
          {/* Info */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex gap-3">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-indigo-800">Importar via arquivo .txt ou texto colado</p>
              <p className="text-xs text-indigo-600 mt-0.5">Baixe o modelo do tipo desejado, preencha e importe. O sistema identifica os campos automaticamente.</p>
            </div>
          </div>

          {/* Prompts de IA */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">Gerar com IA (copie e cole no ChatGPT ou Claude)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { id: 'story', label: 'História',  icon: <CheckCircle2 className="w-4 h-4" /> },
                { id: 'task',  label: 'Tarefa',    icon: <Briefcase className="w-4 h-4" /> },
                { id: 'bug',   label: 'Bug',       icon: <AlertCircle className="w-4 h-4" /> },
                { id: 'epic',  label: 'Demanda',   icon: <Rocket className="w-4 h-4" /> },
              ] as const).map(t => (
                <AiPromptCopyButton key={t.id} typeId={t.id} label={t.label} icon={t.icon} prompt={AI_PROMPTS[t.id].prompt} />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Copie o prompt → cole num assistente de IA → preencha o contexto → cole o resultado abaixo para importar.</p>
          </div>

          {/* Download de modelos */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500 mb-2">Baixar modelo (.txt)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {([
                { id: 'story', label: 'História',  icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
                { id: 'task',  label: 'Tarefa',    icon: <Briefcase className="w-4 h-4" />,    color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
                { id: 'bug',   label: 'Bug',       icon: <AlertCircle className="w-4 h-4" />,  color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' },
                { id: 'epic',  label: 'Demanda',   icon: <Rocket className="w-4 h-4" />,       color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => downloadTemplate(t.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition-all ${t.color}`}
                >
                  {t.icon}
                  {t.label}
                  <Upload className="w-3 h-3 opacity-60 rotate-180" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Clique no tipo para baixar o modelo preenchido com os campos corretos.</p>
          </div>

          {/* Área de upload */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <p className="text-sm font-bold text-indigo-500">Lendo PDF...</p>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">
                  {fileName ? <span className="text-indigo-600">{fileName}</span> : 'Arraste o arquivo ou clique para selecionar'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Formatos aceitos: <strong>.pdf</strong> · <strong>.txt</strong></p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".txt,.md,.text,.pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-black text-slate-400 uppercase">ou cole o texto abaixo</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">
                Texto extraído / colado
                {rawText && <span className="ml-2 text-indigo-400 normal-case font-bold">{rawText.length} caracteres lidos</span>}
              </label>
              {rawText && (
                <button type="button" onClick={() => { setRawText(''); setFileName(''); }}
                  className="text-[10px] font-black text-rose-400 hover:text-rose-600 transition-colors">
                  LIMPAR
                </button>
              )}
            </div>
            <Textarea
              label=""
              placeholder="Cole aqui o conteúdo do arquivo modelo preenchido, ou faça upload acima (PDF ou TXT)..."
              value={rawText}
              onChange={(e: any) => setRawText(e.target.value)}
              rows={10}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              fullWidth
              size="lg"
              iconLeft={<Sparkles className="w-4 h-4" />}
              onClick={handleParse}
              disabled={!rawText.trim()}
            >
              ANALISAR E PREENCHER CAMPOS
            </Button>
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm transition-colors">
              CANCELAR
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep('input')} className="text-xs font-black text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">
              ← Voltar e editar texto
            </button>
            <span className={cn('text-xs font-black px-3 py-1 rounded-full border', cfg.badge)}>
              {cfg.detectedLabel}
            </span>
          </div>

          {/* Tipo */}
          <TypeSelector value={type} onChange={setType} />

          {/* Campos básicos */}
          <FSection icon={<FileText className="w-4 h-4" />} label="Identificação" />
          <Input label="Título *" required value={title} onChange={e => setTitle(e.target.value)} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select label="Prioridade" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </Select>
            <Select label="Sprint" value={sprintId} onChange={e => setSprintId(e.target.value)}>
              <option value="">Backlog</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            {type !== 'epic' && (
              <Input label="Story Points" type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} />
            )}
            <Input label="Prazo" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Relator" iconLeft={<User className="w-4 h-4" />} value={reporter} onChange={e => setReporter(e.target.value)} />
            <Input label="Tela / Funcionalidade" iconLeft={<Layers className="w-4 h-4" />} value={area} onChange={e => setArea(e.target.value)} />
          </div>

          {/* Campos por tipo */}
          {type === 'story' && (
            <StoryFields desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs}
              acceptance={acceptance} setAcceptance={setAcceptance} objective={objective} setObjective={setObjective}
              linkedDemand={null} setLinkedDemand={() => {}} projectId={projectId} />
          )}
          {type === 'task' && (
            <TaskFields desc={desc} setDesc={setDesc} activities={activities} setActivities={setActivities}
              linkedDemand={null} setLinkedDemand={() => {}} projectId={projectId} />
          )}
          {type === 'bug' && (
            <BugFields desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs}
              acceptance={acceptance} setAcceptance={setAcceptance} activities={activities} setActivities={setActivities} />
          )}
          {type === 'epic' && (
            <EpicFields desc={desc} setDesc={setDesc} objective={objective} setObjective={setObjective}
              funcReqs={funcReqs} setFuncReqs={setFuncReqs} />
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" loading={loading} fullWidth size="lg" onClick={handleCreate}>
              CRIAR TICKET
            </Button>
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm transition-colors">
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── TYPE_CONFIG — rótulos e cores dos tipos ──────────────────────────────────

const TYPE_CONFIG = {
  story: { label: 'História', detectedLabel: 'História detectada', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  task:  { label: 'Tarefa',   detectedLabel: 'Tarefa detectada',   color: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  bug:   { label: 'Bug',      detectedLabel: 'Bug detectado',      color: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  epic:  { label: 'Demanda',  detectedLabel: 'Demanda detectada',  color: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700 border-purple-200' },
} as const;

// ─── TypeSelector — botões visuais de seleção de tipo ────────────────────────

function TypeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = [
    { id: 'story', label: 'História',  icon: <CheckCircle2 className="w-5 h-5" />, desc: 'Funcionalidade do ponto de vista do usuário' },
    { id: 'task',  label: 'Tarefa',    icon: <Briefcase className="w-5 h-5" />,    desc: 'Trabalho técnico ou operacional' },
    { id: 'bug',   label: 'Bug',       icon: <AlertCircle className="w-5 h-5" />,  desc: 'Defeito ou comportamento incorreto' },
    { id: 'epic',  label: 'Demanda',   icon: <Rocket className="w-5 h-5" />,       desc: 'Iniciativa maior para agrupar histórias e tarefas' },
  ];

  return (
    <div>
      <label className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500 block mb-2">Tipo *</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {types.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center',
              value === t.id
                ? `${TYPE_CONFIG[t.id as keyof typeof TYPE_CONFIG].badge} border-current shadow-sm scale-[1.02]`
                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            {t.icon}
            <span className="text-xs font-black">{t.label}</span>
            <span className="text-[9px] font-medium leading-tight opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── FormFields por tipo ──────────────────────────────────────────────────────

function StoryFields({ desc, setDesc, funcReqs, setFuncReqs, acceptance, setAcceptance, objective, setObjective, linkedDemand, setLinkedDemand, projectId, split }: any) {
  return (
    <>
      <FSection icon={<FileText className="w-4 h-4" />} label="Narrativa do Usuário" />
      <Textarea
        label="Como usuário, eu quero... para que..."
        placeholder={"Ex: Eu como usuário desejo que o sistema atualize a nomenclatura dos campos na tela de Aviso Embarque para que os termos sejam consistentes com os processos de ICMS/EXONERAÇÃO."}
        value={desc}
        onChange={(e: any) => setDesc(e.target.value)}
        rows={4}
      />

      <FSection icon={<ClipboardList className="w-4 h-4" />} label="Requisitos Funcionais" />
      <Textarea
        label="Requisitos Funcionais"
        placeholder={"Liste um por linha:\n- O sistema deverá alterar o label X → Y\n- A alteração deve refletir em todas as telas relacionadas"}
        value={funcReqs}
        onChange={(e: any) => setFuncReqs(e.target.value)}
        rows={5}
      />

      <FSection icon={<CheckCircle2 className="w-4 h-4" />} label="Critérios de Aceite" />
      <Textarea
        label="Critérios de Aceite"
        placeholder={"Liste um por linha:\n- O label X deve aparecer como Y na Grid Inicial\n- O filtro deve continuar funcionando normalmente\n- Nenhum dado salvo deve ser alterado"}
        value={acceptance}
        onChange={(e: any) => setAcceptance(e.target.value)}
        rows={5}
      />

      <FSection icon={<Target className="w-4 h-4" />} label="Objetivo de Negócio" />
      <Textarea label="Objetivo" placeholder="Qual o valor desta história para o negócio?" value={objective} onChange={(e: any) => setObjective(e.target.value)} rows={2} />

      {!split && <><FSection icon={<Link2 className="w-4 h-4" />} label="Demanda Pai" />
      <LinkedDemandPicker projectId={projectId} value={linkedDemand} onChange={setLinkedDemand} /></>}
    </>
  );
}

function TaskFields({ desc, setDesc, activities, setActivities, linkedDemand, setLinkedDemand, projectId, split }: any) {
  return (
    <>
      <FSection icon={<FileText className="w-4 h-4" />} label="Descrição" />
      <Textarea
        label="O que precisa ser feito?"
        placeholder="Descreva a tarefa em detalhes — o que deve ser implementado, alterado ou configurado."
        value={desc}
        onChange={(e: any) => setDesc(e.target.value)}
        rows={4}
      />

      {!split && <>
      <FSection icon={<CheckSquare className="w-4 h-4" />} label="Subtarefas / Checklist" />
      <ActivitiesField activities={activities} setActivities={setActivities} />

      <FSection icon={<Link2 className="w-4 h-4" />} label="Vinculada a" />
      <LinkedDemandPicker projectId={projectId} value={linkedDemand} onChange={setLinkedDemand} />
      </>}
    </>
  );
}

function BugFields({ desc, setDesc, funcReqs, setFuncReqs, acceptance, setAcceptance, activities, setActivities, split }: any) {
  return (
    <>
      <FSection icon={<AlertCircle className="w-4 h-4" />} label="Passos para Reproduzir" />
      <Textarea
        label="Como reproduzir o bug?"
        placeholder={"1. Acesse a tela X\n2. Preencha o campo Y com Z\n3. Clique em Salvar\n4. Observe o erro"}
        value={desc}
        onChange={(e: any) => setDesc(e.target.value)}
        rows={5}
      />

      <FSection icon={<X className="w-4 h-4" />} label="Comportamento Atual vs Esperado" />
      <Textarea
        label="Comportamento Atual"
        placeholder="O que acontece atualmente (o bug em si)..."
        value={funcReqs}
        onChange={(e: any) => setFuncReqs(e.target.value)}
        rows={3}
      />
      <Textarea
        label="Comportamento Esperado"
        placeholder="O que deveria acontecer corretamente..."
        value={acceptance}
        onChange={(e: any) => setAcceptance(e.target.value)}
        rows={3}
      />

      {!split && <>
      <FSection icon={<CheckSquare className="w-4 h-4" />} label="Cenários de Teste" />
      <ActivitiesField activities={activities} setActivities={setActivities} />
      </>}
    </>
  );
}

function EpicFields({ desc, setDesc, objective, setObjective, funcReqs, setFuncReqs }: any) {
  return (
    <>
      <FSection icon={<Rocket className="w-4 h-4" />} label="Visão e Objetivo Estratégico" />
      <Textarea
        label="Descrição da Demanda"
        placeholder="Qual é a iniciativa ou objetivo maior que esta demanda representa? Qual problema de negócio resolve?"
        value={desc}
        onChange={(e: any) => setDesc(e.target.value)}
        rows={4}
      />

      <FSection icon={<Target className="w-4 h-4" />} label="Resultado Esperado" />
      <Textarea
        label="Resultado / Valor de Negócio"
        placeholder="Quais métricas ou resultados esta demanda deve alcançar?"
        value={objective}
        onChange={(e: any) => setObjective(e.target.value)}
        rows={3}
      />

      <FSection icon={<ClipboardList className="w-4 h-4" />} label="Escopo / Histórias Planejadas" />
      <Textarea
        label="Escopo (histórias previstas)"
        placeholder={"Liste as histórias que fazem parte desta demanda:\n- Como usuário, quero X\n- Como admin, quero Y"}
        value={funcReqs}
        onChange={(e: any) => setFuncReqs(e.target.value)}
        rows={5}
      />
    </>
  );
}

// ─── NewFeatureModal ──────────────────────────────────────────────────────────

function NewFeatureModal({ projectId, defaultSprintId, sprints, onClose, onSuccess }: {
  projectId: string; defaultSprintId: string; sprints: Sprint[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [title,      setTitle]      = useState('');
  const [desc,       setDesc]       = useState('');
  const [type,       setType]       = useState<'story' | 'task' | 'bug' | 'epic'>('story');
  const [priority,   setPriority]   = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [points,     setPoints]     = useState(1);
  const [sprintId,   setSprintId]   = useState(defaultSprintId);
  const [reporter,   setReporter]   = useState('');
  const [assignee,   setAssignee]   = useState('');
  const team = useTeam();
  const [area,       setArea]       = useState('');
  const [funcReqs,   setFuncReqs]   = useState('');
  const [acceptance, setAcceptance] = useState('');
  const [objective,  setObjective]  = useState('');
  const [deadline,   setDeadline]   = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [linkedDemand, setLinkedDemand] = useState<{ id: string; title: string } | null>(null);
  const [loading,    setLoading]    = useState(false);

  // Reset campos específicos ao trocar tipo
  const handleTypeChange = (newType: string) => {
    setType(newType as any);
    setDesc(''); setFuncReqs(''); setAcceptance(''); setObjective(''); setActivities([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const key = `${projectId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(), key, projectId,
          sprintId: sprintId || null,
          title, description: desc, type, priority, points: type === 'epic' ? 0 : points,
          status: 'todo',
          reporter,
          assignedTo: assignee || null,
          functionalArea: area,
          functionalRequirements: funcReqs,
          acceptanceCriteria: acceptance,
          businessRules: objective,
          deadline: deadline || null,
          activities: stringifyActivities(activities),
          linkedDemandId: linkedDemand?.id || null,
          linkedDemandTitle: linkedDemand?.title || null,
        }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Não deu para salvar essa tarefa agora. Tente de novo em instantes.');
    } finally { setLoading(false); }
  };

  const cfg = TYPE_CONFIG[type];
  const modalTitles = { story: 'Nova História', task: 'Nova Tarefa', bug: 'Novo Bug', epic: 'Nova Demanda' };

  return (
    <Modal isOpen onClose={onClose} title={modalTitles[type]} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Seletor de tipo visual */}
        <TypeSelector value={type} onChange={handleTypeChange} />

        {/* Identificação comum */}
        <FSection icon={<FileText className="w-4 h-4" />} label="Identificação" />
        <Input
          label="Título *"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={
            type === 'story' ? 'Ex: [CINF-2383] Alteração de Labels na tela de Aviso Embarque' :
            type === 'task'  ? 'Ex: Configurar integração com API de pagamentos' :
            type === 'bug'   ? 'Ex: [BUG] Filtro de datas não retorna resultados corretos' :
                               'Ex: Módulo de Relatórios Gerenciais'
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Prioridade" value={priority} onChange={e => setPriority(e.target.value as any)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </Select>
          <Select label="Sprint" value={sprintId} onChange={e => setSprintId(e.target.value)}>
            <option value="">Backlog</option>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status === 'active' ? 'Ativa' : 'Planejada'})
              </option>
            ))}
          </Select>
          {type !== 'epic' && (
            <Input label="Story Points" type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} />
          )}
          <Input label="Prazo" type="date" iconLeft={<Calendar className="w-4 h-4" />} value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Relator" iconLeft={<User className="w-4 h-4" />} placeholder="Quem solicitou?" value={reporter} onChange={e => setReporter(e.target.value)} />
          <Select label="Responsável (quem vai assumir)" value={assignee} onChange={e => setAssignee(e.target.value)}
            options={[{ value: '', label: 'Ninguém ainda' }, ...[...new Set([...team, ...(assignee ? [assignee] : [])])].map(n => ({ value: n, label: n }))]} />
          {(type === 'story' || type === 'task' || type === 'bug') && (
            <Input label="Tela / Funcionalidade" iconLeft={<Layers className="w-4 h-4" />} placeholder="Ex: Acompanhamento Aviso Embarque" value={area} onChange={e => setArea(e.target.value)} />
          )}
        </div>

        {/* Campos específicos por tipo */}
        {type === 'story' && (
          <StoryFields desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs}
            acceptance={acceptance} setAcceptance={setAcceptance} objective={objective} setObjective={setObjective}
            linkedDemand={linkedDemand} setLinkedDemand={setLinkedDemand} projectId={projectId} />
        )}
        {type === 'task' && (
          <TaskFields desc={desc} setDesc={setDesc} activities={activities} setActivities={setActivities}
            linkedDemand={linkedDemand} setLinkedDemand={setLinkedDemand} projectId={projectId} />
        )}
        {type === 'bug' && (
          <BugFields desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs}
            acceptance={acceptance} setAcceptance={setAcceptance} activities={activities} setActivities={setActivities} />
        )}
        {type === 'epic' && (
          <EpicFields desc={desc} setDesc={setDesc} objective={objective} setObjective={setObjective}
            funcReqs={funcReqs} setFuncReqs={setFuncReqs} />
        )}

        <Button type="submit" loading={loading} fullWidth size="lg">
          CRIAR {cfg.label.toUpperCase()}
        </Button>
      </form>
    </Modal>
  );
}
