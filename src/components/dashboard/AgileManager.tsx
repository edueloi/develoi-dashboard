import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronDown, ChevronRight, Play, CheckCircle2,
  AlertCircle, Rocket, Briefcase, Calendar, Star, MoreVertical,
  Trash2, Edit2, History, BarChart2, Loader2,
  Archive, X, Kanban, GripVertical, ArrowRight, CheckSquare,
  Square, ListTodo, Pencil, Link2, Search, FileText, ClipboardList,
  Target, User, Tag, Layers, Upload, Sparkles, Copy, Check as CheckIcon,
  Bot,
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
  const [newTicketSprint, setNewTicketSprint] = useState<string | null>(null);
  const [importOpen, setImportOpen]       = useState(false);

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
            onImport={() => setImportOpen(true)}
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

function BacklogView({ projectId, features, sprints, onRefresh, onCreateSprint, onCreateTicket, onImport }: {
  projectId: string; features: Feature[]; sprints: Sprint[];
  onRefresh: () => void; onCreateSprint: () => void; onCreateTicket: (sprintId?: string) => void;
  onImport: () => void;
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
          <Button variant="outline" iconLeft={<Upload className="w-4 h-4" />} onClick={onImport}>IMPORTAR</Button>
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
  const [expanded, setExpanded]         = useState(sprint.status !== 'completed');
  const [menuOpen, setMenuOpen]         = useState(false);
  const [editing, setEditing]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
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
              'rounded-[2.5rem] border transition-all duration-300 bg-white shadow-sm',
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
                    {features.length} {features.length === 1 ? 'ticket' : 'tickets'} · {features.reduce((a, f) => a + (f.points || 0), 0)} pts
                    {sprint.startDate && sprint.endDate && ` · ${format(new Date(sprint.startDate), 'dd/MM')} – ${format(new Date(sprint.endDate), 'dd/MM')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
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

                      {/* Adicionar ticket */}
                      <button
                        onClick={() => { onAddTicket(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-400" /> Adicionar Ticket
                      </button>

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
        <EditSprintModal sprint={sprint} onClose={() => setEditing(false)} onSuccess={onRefresh} />
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
          'group flex items-center gap-3 px-3 py-2.5 bg-white border rounded-2xl transition-all cursor-default',
          isDragging ? 'shadow-2xl border-indigo-400 rotate-1 scale-105' : 'border-transparent hover:border-slate-200 hover:bg-slate-50/60'
        )}
      >
        {/* drag handle */}
        <div {...provided.dragHandleProps} className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 text-slate-300 hover:text-slate-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="shrink-0">{TYPE_ICONS[feature.type || 'task']}</div>
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0 w-20 truncate">{feature.key || '—'}</span>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-slate-700 truncate block group-hover:text-indigo-900">{feature.title}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {feature.functionalArea && (
              <span className="text-[10px] text-slate-400 truncate max-w-[160px]">{feature.functionalArea}</span>
            )}
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
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black" title={feature.reporter || feature.assignedTo || 'U'}>
            {(feature.reporter || feature.assignedTo || 'U')[0].toUpperCase()}
          </div>
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

// ─── EditFeatureModal ─────────────────────────────────────────────────────────

function EditFeatureModal({ feature, onClose, onSuccess }: { feature: Feature; onClose: () => void; onSuccess: () => void }) {
  const [title,       setTitle]       = useState(feature.title);
  const [desc,        setDesc]        = useState(feature.description || '');
  const [type,        setType]        = useState(feature.type || 'task');
  const [priority,    setPriority]    = useState(feature.priority || 'medium');
  const [points,      setPoints]      = useState(feature.points || 0);
  const [status,      setStatus]      = useState(feature.status || 'todo');
  const [reporter,    setReporter]    = useState(feature.reporter || '');
  const [area,        setArea]        = useState(feature.functionalArea || '');
  const [funcReqs,    setFuncReqs]    = useState(feature.functionalRequirements || '');
  const [acceptance,  setAcceptance]  = useState(feature.acceptanceCriteria || '');
  const [objective,   setObjective]   = useState(feature.businessRules || '');
  const [deadline,    setDeadline]    = useState(feature.deadline ? feature.deadline.slice(0, 10) : '');
  const [activities,  setActivities]  = useState<Activity[]>(parseActivities(feature.activities));
  const [linkedDemand, setLinkedDemand] = useState<{ id: string; title: string } | null>(
    feature.linkedDemandId ? { id: feature.linkedDemandId, title: feature.linkedDemandTitle || '' } : null
  );
  const [loading,       setLoading]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description: desc, type, priority, points, status,
          reporter, functionalArea: area,
          functionalRequirements: funcReqs,
          acceptanceCriteria: acceptance,
          businessRules: objective,
          deadline: deadline || null,
          activities: stringifyActivities(activities),
          linkedDemandId: linkedDemand?.id || null,
          linkedDemandTitle: linkedDemand?.title || null,
        }),
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

  const handleTypeChange = (newType: string) => {
    setType(newType as any);
  };

  const editTitles = { story: 'Editar História', task: 'Editar Tarefa', bug: 'Editar Bug', epic: 'Editar Épico' };

  return (
    <Modal isOpen onClose={onClose} title={`${feature.key || '—'} — ${editTitles[type as keyof typeof editTitles] || 'Editar Ticket'}`} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Seletor de tipo */}
        <TypeSelector value={type} onChange={handleTypeChange} />

        {/* Identificação */}
        <FSection icon={<FileText className="w-4 h-4" />} label="Identificação" />
        <Input label="Título *" required value={title} onChange={e => setTitle(e.target.value)} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          {type !== 'epic' && (
            <Input label="Story Points" type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} />
          )}
          <Input label="Prazo" type="date" iconLeft={<Calendar className="w-4 h-4" />} value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Relator" iconLeft={<User className="w-4 h-4" />} placeholder="Quem solicitou?" value={reporter} onChange={e => setReporter(e.target.value)} />
          {(type === 'story' || type === 'task' || type === 'bug') && (
            <Input label="Tela / Funcionalidade" iconLeft={<Layers className="w-4 h-4" />} placeholder="Ex: Acompanhamento Aviso Embarque" value={area} onChange={e => setArea(e.target.value)} />
          )}
        </div>

        {/* Campos específicos por tipo */}
        {type === 'story' && (
          <StoryFields desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs}
            acceptance={acceptance} setAcceptance={setAcceptance} objective={objective} setObjective={setObjective}
            linkedDemand={linkedDemand} setLinkedDemand={setLinkedDemand} projectId={feature.projectId} />
        )}
        {type === 'task' && (
          <TaskFields desc={desc} setDesc={setDesc} activities={activities} setActivities={setActivities}
            linkedDemand={linkedDemand} setLinkedDemand={setLinkedDemand} projectId={feature.projectId} />
        )}
        {type === 'bug' && (
          <BugFields desc={desc} setDesc={setDesc} funcReqs={funcReqs} setFuncReqs={setFuncReqs}
            acceptance={acceptance} setAcceptance={setAcceptance} activities={activities} setActivities={setActivities} />
        )}
        {type === 'epic' && (
          <EpicFields desc={desc} setDesc={setDesc} objective={objective} setObjective={setObjective}
            funcReqs={funcReqs} setFuncReqs={setFuncReqs} />
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} fullWidth size="lg">SALVAR ALTERAÇÕES</Button>
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmModal isOpen onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
          title="Excluir Ticket" message={`Excluir "${feature.title}"? Esta ação não pode ser desfeita.`}
          confirmLabel="EXCLUIR" variant="danger" />
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
  const cleanValue = (v: string) => {
    // remove valores que são só placeholders do template (linhas de traço, colchetes ou vazios)
    const stripped = v.replace(/^[-=\s]+$/gm, '').replace(/^\[.*\]$/gm, '').trim();
    return stripped;
  };

  const get = (labels: string[]) => {
    for (const label of labels) {
      const re = new RegExp(`(?:^|\\n)\\s*${label}\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${
        ['título','tipo','prioridade','sprint','story points','pontos','relator','tela','funcionalidade',
         'prazo','descrição','narrativa','como usuário','contexto','requisitos funcionais','critérios de aceite',
         'critério de aceite','objetivo','atividades','subtarefas','passos para reproduzir','comportamento atual',
         'comportamento esperado','escopo','resultado','visão'].join('|')
      })\\s*[:\\-]|$)`, 'im');
      const m = raw.match(re);
      if (m) return cleanValue(m[1].trim());
    }
    return '';
  };

  const title    = get(['título', 'title', 'nome', 'demanda']);
  const rawType  = get(['tipo', 'type']).toLowerCase();
  const type     = rawType.includes('bug') ? 'bug' : rawType.includes('épic') || rawType.includes('epic') ? 'epic' : rawType.includes('tare') || rawType.includes('task') ? 'task' : 'story';
  const rawPrio  = get(['prioridade', 'priority']).toLowerCase();
  const priority = rawPrio.includes('crít') || rawPrio.includes('critical') ? 'critical' : rawPrio.includes('alta') || rawPrio.includes('high') ? 'high' : rawPrio.includes('baixa') || rawPrio.includes('low') ? 'low' : 'medium';
  const pointsRaw = get(['story points', 'pontos', 'points']);
  const points   = parseInt(pointsRaw) || 1;
  const reporter = get(['relator', 'reporter', 'solicitante', 'quem solicitou']);
  const area     = get(['tela', 'funcionalidade', 'tela / funcionalidade', 'área funcional']);
  const rawDeadline = get(['prazo', 'deadline', 'data limite']);
  // Converte dd/mm/aaaa → yyyy-MM-dd; descarta texto livre como "A definir"
  const deadline = (() => {
    const m = rawDeadline.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const m2 = rawDeadline.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
    if (m2) return rawDeadline.slice(0, 10);
    return '';
  })();

  const desc      = get(['descrição', 'narrativa', 'como usuário', 'contexto', 'description', 'passos para reproduzir']);
  const funcReqs  = get(['requisitos funcionais', 'requisitos', 'functional requirements', 'comportamento atual']);
  const acceptance= get(['critérios de aceite', 'critério de aceite', 'acceptance criteria', 'comportamento esperado']);
  const objective = get(['objetivo', 'objetivo de negócio', 'resultado', 'visão', 'business objective']);
  const rawActs   = get(['atividades', 'subtarefas', 'checklist', 'escopo']);
  const activities: { id: string; text: string; done: boolean }[] = rawActs
    ? rawActs.split('\n').map(l => l.replace(/^[-•*\d.]+\s*/, '').trim()).filter(Boolean).map(text => ({ id: uuidv4(), text, done: false }))
    : [];

  return { title, type, priority, points, reporter, area, deadline, desc, funcReqs, acceptance, objective, activities };
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
  MODELO DE IMPORTAÇÃO — ÉPICO
  Develoi Hub | Preencha todos os campos
========================================

Título: [Ex: Módulo de Relatórios Gerenciais]

Tipo: Épico
Prioridade: [Baixa | Média | Alta | Crítica]
Relator: [Nome do responsável pelo épico]
Prazo: [dd/mm/aaaa — data estimada de conclusão]

----------------------------------------
DESCRIÇÃO (visão estratégica):
----------------------------------------
[Qual é a iniciativa ou objetivo maior que este épico representa?
Qual problema de negócio ou oportunidade ele resolve?]

Ex: Criar um módulo centralizado de relatórios gerenciais que permita
à diretoria acompanhar KPIs de vendas, produção e financeiro em tempo
real, eliminando a dependência de planilhas manuais.

----------------------------------------
OBJETIVO:
----------------------------------------
[Quais métricas ou resultados este épico deve alcançar?]

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
      label: 'Épico',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      prompt: `Você é um Product Manager especialista em metodologias ágeis (SAFe/Scrum). Preciso que você estruture um épico completo para o nosso sistema de gestão de projetos.

Por favor, gere o épico no seguinte formato exato (mantenha os rótulos e separadores idênticos):

Título: [Nome estratégico do épico]

Tipo: Épico
Prioridade: [Baixa | Média | Alta | Crítica]
Relator: [Nome do responsável pelo épico]
Prazo: [dd/mm/aaaa — data estimada de conclusão]

----------------------------------------
DESCRIÇÃO (visão estratégica):
----------------------------------------
[Qual é a iniciativa ou objetivo maior que este épico representa? Qual problema de negócio ou oportunidade ele resolve?]

----------------------------------------
OBJETIVO:
----------------------------------------
[Quais métricas ou resultados este épico deve alcançar? Quais indicadores de sucesso?]

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
    const names: Record<string, string> = { story: 'modelo-historia', task: 'modelo-tarefa', bug: 'modelo-bug', epic: 'modelo-epico' };
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
          const pageText = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
          fullText += pageText + '\n';
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
          title, description: desc, type, priority, points,
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
                { id: 'epic',  label: 'Épico',     icon: <Rocket className="w-4 h-4" /> },
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
                { id: 'epic',  label: 'Épico',     icon: <Rocket className="w-4 h-4" />,       color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
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
              {cfg.label} detectado
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
  story: { label: 'História',  color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  task:  { label: 'Tarefa',    color: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  bug:   { label: 'Bug',       color: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  epic:  { label: 'Épico',     color: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700 border-purple-200' },
};

// ─── TypeSelector — botões visuais de seleção de tipo ────────────────────────

function TypeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = [
    { id: 'story', label: 'História',  icon: <CheckCircle2 className="w-5 h-5" />, desc: 'Funcionalidade do ponto de vista do usuário' },
    { id: 'task',  label: 'Tarefa',    icon: <Briefcase className="w-5 h-5" />,    desc: 'Trabalho técnico ou operacional' },
    { id: 'bug',   label: 'Bug',       icon: <AlertCircle className="w-5 h-5" />,  desc: 'Defeito ou comportamento incorreto' },
    { id: 'epic',  label: 'Épico',     icon: <Rocket className="w-5 h-5" />,       desc: 'Conjunto de histórias / objetivo grande' },
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

function StoryFields({ desc, setDesc, funcReqs, setFuncReqs, acceptance, setAcceptance, objective, setObjective, linkedDemand, setLinkedDemand, projectId }: any) {
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

      <FSection icon={<Link2 className="w-4 h-4" />} label="Épico / Demanda Pai" />
      <LinkedDemandPicker projectId={projectId} value={linkedDemand} onChange={setLinkedDemand} />
    </>
  );
}

function TaskFields({ desc, setDesc, activities, setActivities, linkedDemand, setLinkedDemand, projectId }: any) {
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

      <FSection icon={<CheckSquare className="w-4 h-4" />} label="Subtarefas / Checklist" />
      <ActivitiesField activities={activities} setActivities={setActivities} />

      <FSection icon={<Link2 className="w-4 h-4" />} label="Vinculada a" />
      <LinkedDemandPicker projectId={projectId} value={linkedDemand} onChange={setLinkedDemand} />
    </>
  );
}

function BugFields({ desc, setDesc, funcReqs, setFuncReqs, acceptance, setAcceptance, activities, setActivities }: any) {
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

      <FSection icon={<CheckSquare className="w-4 h-4" />} label="Cenários de Teste" />
      <ActivitiesField activities={activities} setActivities={setActivities} />
    </>
  );
}

function EpicFields({ desc, setDesc, objective, setObjective, funcReqs, setFuncReqs }: any) {
  return (
    <>
      <FSection icon={<Rocket className="w-4 h-4" />} label="Visão e Objetivo Estratégico" />
      <Textarea
        label="Descrição do Épico"
        placeholder="Qual é a iniciativa ou objetivo maior que este épico representa? Qual problema de negócio resolve?"
        value={desc}
        onChange={(e: any) => setDesc(e.target.value)}
        rows={4}
      />

      <FSection icon={<Target className="w-4 h-4" />} label="Resultado Esperado" />
      <Textarea
        label="Resultado / Valor de Negócio"
        placeholder="Quais métricas ou resultados este épico deve alcançar?"
        value={objective}
        onChange={(e: any) => setObjective(e.target.value)}
        rows={3}
      />

      <FSection icon={<ClipboardList className="w-4 h-4" />} label="Escopo / Histórias Planejadas" />
      <Textarea
        label="Escopo (histórias previstas)"
        placeholder={"Liste as histórias que fazem parte deste épico:\n- Como usuário, quero X\n- Como admin, quero Y"}
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
      await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(), key, projectId,
          sprintId: sprintId || null,
          title, description: desc, type, priority, points,
          status: 'todo',
          reporter,
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
      onSuccess();
      onClose();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const cfg = TYPE_CONFIG[type];
  const modalTitles = { story: 'Nova História', task: 'Nova Tarefa', bug: 'Novo Bug', epic: 'Novo Épico' };

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
