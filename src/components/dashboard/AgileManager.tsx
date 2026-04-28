import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronDown, ChevronRight, Play, CheckCircle2,
  AlertCircle, Rocket, Briefcase, Calendar, Star, MoreVertical,
  Trash2, Edit2, History, BarChart2, Loader2,
  Archive, X, Kanban, GripVertical, ArrowRight, CheckSquare,
  Square, ListTodo, Pencil,
} from 'lucide-react';
import { format, addDays, isBefore, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../lib/utils';
import {
  Badge, Button, Modal, ConfirmModal, ProgressBar,
  Input, Select, Textarea, EmptyState,
} from '../ui';
import type { Feature, Sprint } from './types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const DraggableComponent = Draggable as any;
const DroppableComponent = Droppable as any;

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
  const [features, setFeatures]           = useState<Feature[]>([]);
  const [sprints, setSprints]             = useState<Sprint[]>([]);
  const [loading, setLoading]             = useState(true);
  const [newSprintOpen, setNewSprintOpen] = useState(false);
  const [newTicketSprint, setNewTicketSprint] = useState<string | null>(null); // sprintId or '' for backlog

  const fetchAll = async () => {
    try {
      const [fr, sr] = await Promise.all([
        fetch(`/api/projects/${projectId}/features`),
        fetch(`/api/projects/${projectId}/sprints`),
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
        body: JSON.stringify({ status: destId }),
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
            onRefresh={fetchAll}
            onCreateSprint={() => setNewSprintOpen(true)}
            onCreateTicket={(sprintId) => setNewTicketSprint(sprintId ?? '')}
          />
        ) : (
          <ActiveBoardView
            projectId={projectId}
            features={features}
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
      </div>
    </DragDropContext>
  );
}

// ─── BacklogView ──────────────────────────────────────────────────────────────

function BacklogView({ projectId, features, sprints, onRefresh, onCreateSprint, onCreateTicket }: {
  projectId: string; features: Feature[]; sprints: Sprint[];
  onRefresh: () => void; onCreateSprint: () => void; onCreateTicket: (sprintId?: string) => void;
}) {
  const backlogFeatures = features.filter(f => !f.sprintId);
  const sprintGroups = sprints
    .map(s => ({ sprint: s, features: features.filter(f => f.sprintId === s.id) }))
    .sort((a, b) => ({ active: 0, planned: 1, completed: 2 }[a.sprint.status] - { active: 0, planned: 1, completed: 2 }[b.sprint.status]));

  const handleStart  = async (id: string) => {
    await fetch(`/api/projects/${projectId}/sprints/${id}/start`, { method: 'POST' });
    onRefresh();
  };
  const handleFinish = async (id: string) => {
    if (!confirm('Concluir sprint? Tarefas não finalizadas voltam ao backlog.')) return;
    await fetch(`/api/projects/${projectId}/sprints/${id}/finish`, { method: 'POST' });
    onRefresh();
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta sprint? Os tickets voltam ao backlog.')) return;
    // Move tickets back first
    const sprintFeats = features.filter(f => f.sprintId === id);
    await Promise.all(sprintFeats.map(f =>
      fetch(`/api/projects/${projectId}/features/${f.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId: null }),
      })
    ));
    await fetch(`/api/projects/${projectId}/sprints/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Planejamento Ágil</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sprints e Backlog</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" iconLeft={<Plus className="w-4 h-4" />} onClick={onCreateSprint}>CRIAR SPRINT</Button>
          <Button iconLeft={<Rocket className="w-4 h-4" />} onClick={() => onCreateTicket(undefined)}>NOVO TICKET</Button>
        </div>
      </div>

      {/* Sprint sections */}
      <div className="space-y-4">
        {sprintGroups.map(({ sprint, features: sf }) => (
          <SprintSection
            key={sprint.id}
            sprint={sprint}
            features={sf}
            onRefresh={onRefresh}
            onStart={() => handleStart(sprint.id)}
            onFinish={() => handleFinish(sprint.id)}
            onDelete={() => handleDelete(sprint.id)}
            onAddTicket={() => onCreateTicket(sprint.id)}
          />
        ))}

        {/* Backlog droppable */}
        <DroppableComponent droppableId="backlog">
          {(provided: any, snapshot: any) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'rounded-[2.5rem] border border-dashed overflow-hidden transition-colors',
                snapshot.isDraggingOver ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 bg-slate-50/50'
              )}
            >
              <div className="p-6 border-b border-slate-200 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="font-black text-slate-600 uppercase tracking-widest text-xs">Backlog do Produto</h3>
                  <Badge color="default" size="sm">{backlogFeatures.length} {backlogFeatures.length === 1 ? 'ticket' : 'tickets'}</Badge>
                </div>
                <button
                  onClick={() => onCreateTicket('')}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors px-3 py-1.5 rounded-xl hover:bg-indigo-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
              <div className="p-2 space-y-1 min-h-[60px]">
                {backlogFeatures.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm font-bold text-slate-400">Backlog vazio — arraste tickets das sprints ou adicione novos.</p>
                  </div>
                ) : (
                  backlogFeatures.map((f, i) => (
                    <DraggableComponent key={f.id} draggableId={f.id} index={i}>
                      {(prov: any, snap: any) => (
                        <FeatureRow feature={f} provided={prov} isDragging={snap.isDragging} onRefresh={onRefresh} />
                      )}
                    </DraggableComponent>
                  ))
                )}
                {provided.placeholder}
              </div>
            </div>
          )}
        </DroppableComponent>
      </div>
    </div>
  );
}

// ─── SprintSection ────────────────────────────────────────────────────────────

function SprintSection({ sprint, features, onRefresh, onStart, onFinish, onDelete, onAddTicket }: {
  sprint: Sprint; features: Feature[]; onRefresh: () => void;
  onStart: () => void; onFinish: () => void; onDelete: () => void; onAddTicket: () => void;
}) {
  const [expanded, setExpanded]   = useState(sprint.status !== 'completed');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
              'rounded-[2.5rem] border transition-all duration-300 overflow-hidden bg-white shadow-sm',
              sprint.status === 'active' ? 'border-indigo-400 ring-4 ring-indigo-500/5' : 'border-slate-200',
              snapshot.isDraggingOver && 'border-indigo-400 bg-indigo-50/20'
            )}
          >
            {/* Header */}
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                  {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-white',
                  sprint.status === 'active' ? 'bg-indigo-600' : sprint.status === 'completed' ? 'bg-slate-400' : 'bg-slate-200 text-slate-500')}>
                  <cfg.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 tracking-tight">{sprint.name}</h3>
                    <Badge color={cfg.color} size="sm" pill>{cfg.label}</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {features.length} tickets · {features.reduce((a, f) => a + (f.points || 0), 0)} pts
                    {sprint.startDate && sprint.endDate && ` · ${format(new Date(sprint.startDate), 'dd/MM')} – ${format(new Date(sprint.endDate), 'dd/MM')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {sprint.status === 'planned'   && <Button size="sm" onClick={onStart}  iconLeft={<Play className="w-3.5 h-3.5" />}>INICIAR</Button>}
                {sprint.status === 'active'    && <Button size="sm" color="success" onClick={onFinish} iconLeft={<CheckCircle2 className="w-3.5 h-3.5" />}>CONCLUIR</Button>}
                <button
                  onClick={() => onAddTicket()}
                  className="p-2 hover:bg-indigo-50 rounded-xl text-indigo-400 hover:text-indigo-600 transition-colors"
                  title="Adicionar ticket nesta sprint"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* 3-dot menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 overflow-hidden">
                      <button
                        onClick={() => { setEditing(true); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-slate-400" /> Editar Sprint
                      </button>
                      <button
                        onClick={() => { onAddTicket(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-400" /> Adicionar Ticket
                      </button>
                      {sprint.status === 'planned' && (
                        <button
                          onClick={() => { onStart(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Play className="w-4 h-4" /> Iniciar Sprint
                        </button>
                      )}
                      {sprint.status === 'active' && (
                        <button
                          onClick={() => { onFinish(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Concluir Sprint
                        </button>
                      )}
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={() => { onDelete(); setMenuOpen(false); }}
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
                  <div className="px-4 pb-4 space-y-1 min-h-[56px]">
                    <div className="h-px bg-slate-100 mx-2 mb-2" />
                    {features.length === 0 ? (
                      <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
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
        <EditSprintModal
          sprint={sprint}
          onClose={() => setEditing(false)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}

// ─── FeatureRow (draggable) ───────────────────────────────────────────────────

function FeatureRow({ feature, provided, isDragging, onRefresh }: {
  feature: Feature; provided: any; isDragging: boolean; onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 bg-white border rounded-2xl transition-all cursor-default',
          isDragging ? 'shadow-2xl border-indigo-400 rotate-1 scale-105' : 'border-transparent hover:border-indigo-100 hover:bg-indigo-50/30'
        )}
      >
        {/* drag handle */}
        <div {...provided.dragHandleProps} className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 text-slate-300 hover:text-slate-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="shrink-0">{TYPE_ICONS[feature.type || 'task']}</div>
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">{feature.key || '—'}</span>
        <span className="text-sm font-bold text-slate-700 truncate flex-1 group-hover:text-indigo-900">{feature.title}</span>

        <div className="flex items-center gap-3 shrink-0">
          <Badge color={PRIORITY_COLORS[feature.priority || 'medium']} size="xs" pill>
            {PRIORITY_LABELS[feature.priority || 'medium']}
          </Badge>
          <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
            {feature.points || 0}
          </div>
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black">
            {feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="p-1 opacity-0 group-hover:opacity-100 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing && (
        <EditFeatureModal
          feature={feature}
          onClose={() => setEditing(false)}
          onSuccess={() => { setEditing(false); onRefresh(); }}
        />
      )}
    </>
  );
}

// ─── ActiveBoardView ──────────────────────────────────────────────────────────

function ActiveBoardView({ projectId, features, activeSprint, onRefresh }: {
  projectId: string; features: Feature[]; activeSprint?: Sprint; onRefresh: () => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);

  if (!activeSprint) {
    return (
      <EmptyState
        icon={Kanban}
        title="Nenhuma Sprint Ativa"
        description="Vá para o Backlog e inicie uma sprint para visualizar o quadro kanban."
        className="py-40"
      />
    );
  }

  const sprintFeatures = features.filter(f => f.sprintId === activeSprint.id);
  const columns = [
    { id: 'todo',        label: 'A Fazer',          color: 'default'  },
    { id: 'in-progress', label: 'Em Desenvolvimento', color: 'info'   },
    { id: 'review',      label: 'Em Revisão',        color: 'purple'  },
    { id: 'testing',     label: 'Em Teste',          color: 'warning' },
    { id: 'done',        label: 'Concluído',         color: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-100 animate-pulse">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{activeSprint.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              {activeSprint.startDate ? format(new Date(activeSprint.startDate), 'dd MMM') : '?'} — {activeSprint.endDate ? format(new Date(activeSprint.endDate), 'dd MMM') : '?'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Concluído</p>
            <p className="text-xl font-black text-emerald-600">
              {Math.round((sprintFeatures.filter(f => f.status === 'done').length / (sprintFeatures.length || 1)) * 100)}%
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pontos Totais</p>
            <p className="text-xl font-black text-slate-900">{sprintFeatures.reduce((a, f) => a + (f.points || 0), 0)}</p>
          </div>
          <Button variant="outline" size="sm" iconLeft={<BarChart2 className="w-4 h-4" />} onClick={() => setReportOpen(true)}>RELATÓRIO</Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 custom-scrollbar">
        {columns.map(col => (
          <DroppableComponent key={col.id} droppableId={col.id}>
            {(provided: any) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="min-w-[280px] w-[280px] flex flex-col gap-3">
                <div className="flex items-center justify-between px-4 py-3 bg-white/70 border border-slate-200 rounded-2xl">
                  <Badge color={col.color as any} dot pill size="sm">{col.label}</Badge>
                  <span className="text-[10px] font-black text-slate-400">{sprintFeatures.filter(f => f.status === col.id).length}</span>
                </div>
                <div className="space-y-3 min-h-[500px]">
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

      {reportOpen && (
        <Modal isOpen={true} onClose={() => setReportOpen(false)} title={`Relatório: ${activeSprint.name}`} size="lg">
          <BurnDownChart sprint={activeSprint} features={sprintFeatures} />
        </Modal>
      )}
    </div>
  );
}

// ─── BoardCard ────────────────────────────────────────────────────────────────

function BoardCard({ provided, feature, onRefresh }: { provided: any; feature: Feature; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const activities = parseActivities(feature.activities);
  const done = activities.filter(a => a.done).length;

  return (
    <>
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
      >
        <div className={cn('absolute top-0 left-0 bottom-0 w-1.5 rounded-l-[2rem]',
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
          {activities.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(done / activities.length) * 100}%` }} />
              </div>
              <span className="text-[9px] font-black text-slate-400">{done}/{activities.length}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white">
              {feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      {editing && (
        <EditFeatureModal feature={feature} onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); onRefresh(); }} />
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

// ─── EditFeatureModal ─────────────────────────────────────────────────────────

function EditFeatureModal({ feature, onClose, onSuccess }: { feature: Feature; onClose: () => void; onSuccess: () => void }) {
  const [title,    setTitle]    = useState(feature.title);
  const [desc,     setDesc]     = useState(feature.description || '');
  const [type,     setType]     = useState(feature.type || 'task');
  const [priority, setPriority] = useState(feature.priority || 'medium');
  const [points,   setPoints]   = useState(feature.points || 0);
  const [status,   setStatus]   = useState(feature.status || 'todo');
  const [activities, setActivities] = useState<Activity[]>(parseActivities((feature as any).activities));
  const [newActivity, setNewActivity] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addActivity = () => {
    const text = newActivity.trim();
    if (!text) return;
    setActivities(prev => [...prev, { id: uuidv4(), text, done: false }]);
    setNewActivity('');
  };

  const toggleActivity = (id: string) =>
    setActivities(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a));

  const removeActivity = (id: string) =>
    setActivities(prev => prev.filter(a => a.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, type, priority, points, status, activities: stringifyActivities(activities) }),
      });
      onSuccess();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, { method: 'DELETE' });
      onSuccess();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const doneCount = activities.filter(a => a.done).length;

  return (
    <Modal isOpen={true} onClose={onClose} title={`${feature.key || 'TASK'} — Editar Ticket`} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="todo">A Fazer</option>
            <option value="in-progress">Em Desenvolvimento</option>
            <option value="review">Em Revisão</option>
            <option value="testing">Em Teste</option>
            <option value="done">Concluído</option>
          </Select>
          <Input label="Story Points" type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} />
        </div>

        <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} rows={2} />

        {/* Activities / Subtarefas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">
              Atividades / Subtarefas
              {activities.length > 0 && (
                <span className="ml-2 text-indigo-500">{doneCount}/{activities.length}</span>
              )}
            </label>
          </div>

          {activities.length > 0 && (
            <div className="mb-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(doneCount / activities.length) * 100}%` }} />
            </div>
          )}

          <div className="space-y-1.5 mb-3">
            {activities.map(act => (
              <div key={act.id} className="flex items-center gap-2 group/act px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                <button type="button" onClick={() => toggleActivity(act.id)} className="shrink-0">
                  {act.done
                    ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                    : <Square className="w-4 h-4 text-slate-300" />
                  }
                </button>
                <span className={cn('text-sm flex-1', act.done ? 'line-through text-slate-400' : 'text-slate-700')}>{act.text}</span>
                <button
                  type="button"
                  onClick={() => removeActivity(act.id)}
                  className="opacity-0 group-hover/act:opacity-100 p-1 rounded text-slate-300 hover:text-rose-500 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newActivity}
              onChange={e => setNewActivity(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addActivity(); } }}
              placeholder="Nova atividade... (Enter para adicionar)"
              className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={addActivity}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} fullWidth size="lg">SALVAR ALTERAÇÕES</Button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          title="Excluir Ticket"
          message={`Excluir "${feature.title}"? Esta ação não pode ser desfeita.`}
          confirmText="EXCLUIR"
          variant="danger"
        />
      )}
    </Modal>
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

// ─── NewFeatureModal ──────────────────────────────────────────────────────────

function NewFeatureModal({ projectId, defaultSprintId, sprints, onClose, onSuccess }: {
  projectId: string; defaultSprintId: string; sprints: Sprint[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [type,     setType]     = useState<'story' | 'task' | 'bug' | 'epic'>('task');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [points,   setPoints]   = useState(1);
  const [sprintId, setSprintId] = useState(defaultSprintId);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState('');
  const [loading,  setLoading]  = useState(false);

  const addActivity = () => {
    const text = newActivity.trim();
    if (!text) return;
    setActivities(prev => [...prev, { id: uuidv4(), text, done: false }]);
    setNewActivity('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const key = `${projectId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(), key, projectId,
          sprintId: sprintId || null,
          title, description: desc, type, priority, points, status: 'todo',
          activities: stringifyActivities(activities),
        }),
      });
      onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Novo Ticket" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Implementar login social" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Sprint" value={sprintId} onChange={e => setSprintId(e.target.value)}>
            <option value="">Backlog (sem sprint)</option>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status === 'active' ? 'Ativa' : s.status === 'planned' ? 'Planejada' : 'Concluída'})
              </option>
            ))}
          </Select>
          <Select label="Tipo" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="task">Tarefa</option>
            <option value="story">História</option>
            <option value="bug">Bug</option>
            <option value="epic">Épico</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Prioridade" value={priority} onChange={e => setPriority(e.target.value as any)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </Select>
          <Input label="Story Points" type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} />
        </div>

        <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="O que deve ser desenvolvido?" />

        {/* Activities */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500 block mb-2">
            Atividades / Subtarefas {activities.length > 0 && <span className="text-indigo-500">({activities.length})</span>}
          </label>
          <div className="space-y-1.5 mb-2">
            {activities.map(act => (
              <div key={act.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                <Square className="w-4 h-4 text-slate-300 shrink-0" />
                <span className="text-sm text-slate-700 flex-1">{act.text}</span>
                <button type="button" onClick={() => setActivities(p => p.filter(a => a.id !== act.id))} className="text-slate-300 hover:text-rose-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={newActivity} onChange={e => setNewActivity(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addActivity(); } }}
              placeholder="Nova atividade... (Enter para adicionar)"
              className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
            <button type="button" onClick={addActivity} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">CRIAR TICKET</Button>
      </form>
    </Modal>
  );
}
