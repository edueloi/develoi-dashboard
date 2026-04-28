import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, ChevronDown, ChevronRight, Play, CheckCircle2, 
  AlertCircle, Rocket, Briefcase, Calendar, Star, MoreVertical,
  Trash2, Edit2, History, TrendingUp, Filter, ArrowRight, Loader2,
  Lock, Archive, BarChart2, X, Kanban
} from 'lucide-react';
import { format, addDays, isBefore, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../lib/utils';
import { 
  Badge, Button, Modal, ConfirmModal, ProgressBar, 
  Input, Select, Textarea, PanelCard, EmptyState 
} from '../ui';
import type { Feature, Sprint, Project } from './types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const DraggableComponent = Draggable as any;
const DroppableComponent = Droppable as any;

// ─── Burn-down Chart Component ────────────────────────────────────────────────

function BurnDownChart({ sprint, features }: { sprint: Sprint; features: Feature[] }) {
  const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date();
  const endDate = sprint.endDate ? new Date(sprint.endDate) : addDays(startDate, 14);
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const totalPoints = features.reduce((acc, f) => acc + (f.points || 0), 0);
  
  // Calcular pontos restantes por dia (simulado ou real se tivéssemos histórico)
  // Como não temos histórico diário de conclusão no DB agora, vamos simular baseado no status atual
  const completedPoints = features.filter(f => f.status === 'done').reduce((acc, f) => acc + (f.points || 0), 0);
  
  const days = Array.from({ length: totalDays + 1 }, (_, i) => addDays(startDate, i));
  
  const idealPath = days.map((_, i) => totalPoints - (totalPoints / totalDays) * i);
  
  // Real path (simplificado: mostra o que falta hoje)
  const today = new Date();
  const realPath = days.map((day, i) => {
    if (isBefore(day, today) || isSameDay(day, today)) {
      // Se for antes ou hoje, mostramos o progresso real (simplificado)
      return totalPoints - (completedPoints / (Math.max(1, i + 1))) * (i + 1); // Apenas uma aproximação visual
    }
    return null;
  });

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Burndown da Sprint</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evolução de Pontos vs Tempo</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Real</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 w-full flex items-end gap-1">
        {/* SVG Chart */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line key={i} x1="0" y1={p * 100 + "%"} x2="100%" y2={p * 100 + "%"} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          
          {/* Ideal line */}
          <line 
            x1="0" y1="0%" 
            x2="100%" y2="100%" 
            stroke="#e2e8f0" 
            strokeWidth="2" 
            strokeDasharray="4 4" 
          />
          
          {/* Real line (Simplified) */}
          <path 
            d={`M 0 0 L ${ (completedPoints/totalPoints) * 100 }% ${ (1 - completedPoints/totalPoints) * 100 }%`}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* X-Axis Labels */}
        <div className="absolute -bottom-8 inset-x-0 flex justify-between px-1">
          {days.filter((_, i) => i % Math.ceil(totalDays/5) === 0 || i === totalDays).map((day, i) => (
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

// ─── Agile Manager Component ──────────────────────────────────────────────────

interface AgileManagerProps {
  projectId: string;
  view: 'backlog' | 'board';
}

export function AgileManager({ projectId, view }: AgileManagerProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isNewSprintModalOpen, setIsNewSprintModalOpen] = useState(false);
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false);
  const [featureToView, setFeatureToView] = useState<Feature | null>(null);
  const [sprintToEdit, setSprintToEdit] = useState<Sprint | null>(null);

  const fetchAgileData = async () => {
    try {
      const [featRes, sprintRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/features`),
        fetch(`/api/projects/${projectId}/sprints`)
      ]);
      const [feats, sprintsData] = await Promise.all([featRes.json(), sprintRes.json()]);
      setFeatures(Array.isArray(feats) ? feats : []);
      setSprints(Array.isArray(sprintsData) ? sprintsData : []);
    } catch (err) {
      console.error("Erro ao carregar dados ágeis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgileData();
    const interval = setInterval(fetchAgileData, 8000);
    return () => clearInterval(interval);
  }, [projectId]);

  const activeSprint = useMemo(() => sprints.find(s => s.status === 'active'), [sprints]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sincronizando Ecossistema Ágil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {view === 'backlog' ? (
        <BacklogView 
          projectId={projectId}
          features={features}
          sprints={sprints}
          onRefresh={fetchAgileData}
          onCreateSprint={() => setIsNewSprintModalOpen(true)}
          onCreateFeature={() => setIsNewFeatureModalOpen(true)}
          onViewFeature={setFeatureToView}
        />
      ) : (
        <ActiveBoardView 
          projectId={projectId}
          features={features}
          activeSprint={activeSprint}
          onRefresh={fetchAgileData}
        />
      )}

      {/* Modals */}
      {isNewSprintModalOpen && (
        <NewSprintModal 
          projectId={projectId} 
          onClose={() => setIsNewSprintModalOpen(false)} 
          onSuccess={fetchAgileData} 
        />
      )}
      {isNewFeatureModalOpen && (
        <NewFeatureModal 
          projectId={projectId} 
          onClose={() => setIsNewFeatureModalOpen(false)} 
          onSuccess={fetchAgileData}
          sprints={sprints.filter(s => s.status !== 'completed')}
        />
      )}
    </div>
  );
}

// ─── Backlog View ─────────────────────────────────────────────────────────────

interface BacklogViewProps {
  projectId: string;
  features: Feature[];
  sprints: Sprint[];
  onRefresh: () => void;
  onCreateSprint: () => void;
  onCreateFeature: () => void;
  onViewFeature: (f: Feature) => void;
}

function BacklogView({ 
  projectId, features, sprints, onRefresh, 
  onCreateSprint, onCreateFeature, onViewFeature 
}: BacklogViewProps) {
  
  const backlogFeatures = features.filter(f => !f.sprintId);
  const sprintGroups = sprints.map(sprint => ({
    sprint,
    features: features.filter(f => f.sprintId === sprint.id)
  })).sort((a, b) => {
    // Ordem: Ativa primeiro, depois Planejadas, depois Completadas
    const statusOrder = { active: 0, planned: 1, completed: 2 };
    return statusOrder[a.sprint.status] - statusOrder[b.sprint.status];
  });

  const handleFinishSprint = async (sprintId: string) => {
    if (!confirm("Deseja concluir esta sprint? Todas as tarefas não finalizadas serão movidas para o backlog.")) return;
    try {
      await fetch(`/api/projects/${projectId}/sprints/${sprintId}/finish`, { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/sprints/${sprintId}/start`, { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Planejamento Ágil</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gerencie Sprints e Backlog</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" iconLeft={<Plus className="w-4 h-4" />} onClick={onCreateSprint}>CRIAR SPRINT</Button>
          <Button iconLeft={<Rocket className="w-4 h-4" />} onClick={onCreateFeature}>NOVO TICKET</Button>
        </div>
      </div>

      {/* Sprints List */}
      <div className="space-y-4">
        {sprintGroups.map(({ sprint, features }) => (
          <SprintSection 
            key={sprint.id} 
            sprint={sprint} 
            features={features} 
            onRefresh={onRefresh}
            onStart={() => handleStartSprint(sprint.id)}
            onFinish={() => handleFinishSprint(sprint.id)}
          />
        ))}

        {/* Backlog Section */}
        <div className="bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-300 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="font-black text-slate-600 uppercase tracking-widest text-xs">Backlog do Produto</h3>
              <Badge color="default" size="sm">{backlogFeatures.length} {backlogFeatures.length === 1 ? 'ticket' : 'tickets'}</Badge>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {backlogFeatures.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-slate-400">Backlog vazio. Adicione novos tickets para planejar sua próxima sprint.</p>
              </div>
            ) : (
              backlogFeatures.map(f => (
                <FeatureRow key={f.id} feature={f} onRefresh={onRefresh} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Active Board View ────────────────────────────────────────────────────────

interface ActiveBoardViewProps {
  projectId: string;
  features: Feature[];
  activeSprint?: Sprint;
  onRefresh: () => void;
}

function ActiveBoardView({ projectId, features, activeSprint, onRefresh }: ActiveBoardViewProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);

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
    { id: 'todo', label: 'A Fazer', color: 'default' },
    { id: 'in-progress', label: 'Em Desenvolvimento', color: 'info' },
    { id: 'review', label: 'Em Revisão', color: 'purple' },
    { id: 'testing', label: 'Em Teste', color: 'warning' },
    { id: 'done', label: 'Concluído', color: 'success' },
  ];

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    if (destination.droppableId === result.source.droppableId) return;

    try {
      await fetch(`/api/projects/${projectId}/features/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destination.droppableId }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sprint Stats Bar */}
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
          <div className="h-10 w-[1px] bg-slate-100" />
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pontos Totais</p>
            <p className="text-xl font-black text-slate-900">
              {sprintFeatures.reduce((acc, f) => acc + (f.points || 0), 0)}
            </p>
          </div>
          <Button variant="outline" size="sm" iconLeft={<BarChart2 className="w-4 h-4" />} onClick={() => setIsReportOpen(true)}>RELATÓRIO</Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 custom-scrollbar">
          {columns.map(col => (
            <DroppableComponent key={col.id} droppableId={col.id}>
              {(provided: any) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="min-w-[280px] w-[280px] flex flex-col gap-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl backdrop-blur-sm">
                    <Badge color={col.color as any} dot pill size="sm">{col.label}</Badge>
                    <span className="text-[10px] font-black text-slate-400">
                      {sprintFeatures.filter(f => f.status === col.id).length}
                    </span>
                  </div>

                  <div className="space-y-4 min-h-[500px]">
                    {sprintFeatures.filter(f => f.status === col.id).map((f, i) => (
                      <DraggableComponent key={f.id} draggableId={f.id} index={i}>
                        {(provided: any) => (
                          <BoardCard provided={provided} feature={f} />
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

      {/* Report Modal */}
      {isReportOpen && (
        <Modal isOpen={true} onClose={() => setIsReportOpen(false)} title={`Relatório: ${activeSprint.name}`} size="lg">
          <BurnDownChart sprint={activeSprint} features={sprintFeatures} />
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SprintSection({ sprint, features, onRefresh, onStart, onFinish }: { 
  sprint: Sprint; features: Feature[]; onRefresh: () => void; onStart: () => void; onFinish: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(sprint.status !== 'completed');
  
  const statusConfig = {
    active: { label: 'Sprint Ativa', color: 'success' as const, icon: Play },
    planned: { label: 'Planejada', color: 'info' as const, icon: Calendar },
    completed: { label: 'Concluída', color: 'default' as const, icon: Archive },
  };

  const config = statusConfig[sprint.status];

  return (
    <div className={cn(
      "rounded-[2.5rem] border transition-all duration-500 overflow-hidden bg-white shadow-sm",
      sprint.status === 'active' ? "border-indigo-400 ring-4 ring-indigo-500/5 shadow-indigo-100/50" : "border-slate-200"
    )}>
      <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
          
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white", 
            sprint.status === 'active' ? "bg-indigo-600" : sprint.status === 'completed' ? "bg-slate-400" : "bg-slate-200 text-slate-500")}>
            <config.icon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-black text-slate-900 tracking-tight">{sprint.name}</h3>
              <Badge color={config.color} size="sm" pill>{config.label}</Badge>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
              {features.length} tickets • {features.reduce((acc, f) => acc + (f.points || 0), 0)} story points
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
          {sprint.status === 'planned' && (
            <Button size="sm" onClick={onStart} iconLeft={<Play className="w-4 h-4" />}>INICIAR SPRINT</Button>
          )}
          {sprint.status === 'active' && (
            <Button size="sm" color="success" onClick={onFinish} iconLeft={<CheckCircle2 className="w-4 h-4" />}>CONCLUIR SPRINT</Button>
          )}
          <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-6 space-y-1">
              <div className="h-[1px] bg-slate-100 mx-2 mb-3" />
              {features.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-xs font-bold text-slate-400">Arraste tickets do backlog para planejar esta sprint.</p>
                </div>
              ) : (
                features.map(f => (
                  <FeatureRow key={f.id} feature={f} onRefresh={onRefresh} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica'
};
const PRIORITY_COLORS: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'default'
};

function FeatureRow({ feature, onRefresh }: { feature: Feature; onRefresh: () => void }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <div className="group flex items-center gap-4 px-4 py-3 bg-white hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 rounded-2xl transition-all">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0">
            {feature.type === 'bug' && <AlertCircle className="w-4 h-4 text-rose-500" />}
            {feature.type === 'story' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {feature.type === 'epic' && <Rocket className="w-4 h-4 text-purple-500" />}
            {(!feature.type || feature.type === 'task') && <Briefcase className="w-4 h-4 text-blue-500" />}
          </div>

          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest shrink-0">{feature.key || 'TASK'}</span>

          <span className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-900">{feature.title}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Badge color={PRIORITY_COLORS[feature.priority || 'medium'] || 'info'} size="xs" pill>
            {PRIORITY_LABELS[feature.priority || 'medium']}
          </Badge>

          <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
            {feature.points || 0}
          </div>

          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
            {feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEditing && (
        <EditFeatureModal
          feature={feature}
          onClose={() => setIsEditing(false)}
          onSuccess={() => { setIsEditing(false); onRefresh(); }}
        />
      )}
    </>
  );
}

function BoardCard({ provided, feature }: { provided: any; feature: Feature }) {
  return (
    <div 
      ref={provided.innerRef} 
      {...provided.draggableProps} 
      {...provided.dragHandleProps}
      className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-400 transition-all cursor-pointer group relative overflow-hidden"
    >
      {/* Type indicator bar */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-1.5",
        feature.type === 'bug' ? "bg-rose-500" : feature.type === 'story' ? "bg-emerald-500" : "bg-indigo-500"
      )} />

      <div className="space-y-4 pl-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{feature.key || 'TASK'}</span>
          <div className="flex items-center gap-1.5">
             <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 border border-slate-200">
                {feature.points || 0}
             </div>
             <Badge color={PRIORITY_COLORS[feature.priority || 'medium'] || 'info'} size="xs" pill>{PRIORITY_LABELS[feature.priority || 'medium']}</Badge>
          </div>
        </div>

        <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
          {feature.title}
        </h4>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex -space-x-2">
             <div className="w-7 h-7 rounded-xl bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                {feature.assignedTo ? feature.assignedTo[0].toUpperCase() : 'U'}
             </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <History className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">Ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function EditFeatureModal({ feature, onClose, onSuccess }: { feature: Feature; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(feature.title);
  const [desc, setDesc] = useState(feature.description || '');
  const [type, setType] = useState(feature.type || 'task');
  const [priority, setPriority] = useState(feature.priority || 'medium');
  const [points, setPoints] = useState(feature.points || 0);
  const [status, setStatus] = useState(feature.status || 'todo');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, type, priority, points, status }),
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/projects/${feature.projectId}/features/${feature.id}`, { method: 'DELETE' });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Editar Ticket — ${feature.key || 'TASK'}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="todo">A Fazer</option>
            <option value="in-progress">Em Desenvolvimento</option>
            <option value="review">Em Revisão</option>
            <option value="testing">Em Teste</option>
            <option value="done">Concluído</option>
          </Select>
          <Input label="Story Points" type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} />
        </div>
        <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} fullWidth size="lg">SALVAR ALTERAÇÕES</Button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-5 py-3 rounded-2xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all font-black text-xs uppercase tracking-widest shrink-0"
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
          message={`Tem certeza que deseja excluir "${feature.title}"? Esta ação não pode ser desfeita.`}
          confirmText="EXCLUIR"
          variant="danger"
        />
      )}
    </Modal>
  );
}

function NewSprintModal({ projectId, onClose, onSuccess }: { projectId: string; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(`Sprint ${new Date().toLocaleDateString('pt-BR', { month: 'short' })} #1`);
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uuidv4(), projectId, name, goal, startDate, endDate, status: 'planned', createdAt: new Date().toISOString() }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Sprint" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Nome da Sprint" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sprint Alpha #1" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Data Início" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="Data Fim" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <Textarea label="Objetivo da Sprint" value={goal} onChange={e => setGoal(e.target.value)} placeholder="O que pretendemos alcançar?" rows={3} />
        <Button type="submit" loading={loading} fullWidth size="lg">CRIAR SPRINT</Button>
      </form>
    </Modal>
  );
}

function NewFeatureModal({ projectId, onClose, onSuccess, sprints }: { 
  projectId: string; onClose: () => void; onSuccess: () => void; sprints: Sprint[];
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'story' | 'task' | 'bug' | 'epic'>('task');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [points, setPoints] = useState(1);
  const [sprintId, setSprintId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const featureKey = `${projectId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await fetch(`/api/projects/${projectId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: uuidv4(), key: featureKey, projectId, sprintId: sprintId || null, title, description: desc, type, priority, points, status: 'todo' }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Novo Ticket" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Título do Ticket" required value={title} onChange={e => setTitle(e.target.value)} />
          <Select label="Sprint" value={sprintId} onChange={e => setSprintId(e.target.value)}>
            <option value="">Mover para Backlog</option>
            {sprints.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status === 'active' ? 'Ativa' : s.status === 'planned' ? 'Planejada' : 'Concluída'})</option>)}
          </Select>
        </div>
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
          <Input label="Story Points" type="number" min="0" value={points} onChange={e => setPoints(Number(e.target.value))} />
        </div>
        <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
        <Button type="submit" loading={loading} fullWidth size="lg">CRIAR TICKET</Button>
      </form>
    </Modal>
  );
}
