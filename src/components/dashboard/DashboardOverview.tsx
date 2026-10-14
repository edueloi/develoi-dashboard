import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderOpen,
  ListTodo,
  MessageSquare,
  Plus,
  Rocket,
  Star,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  PanelCard,
  ProgressBar,
  SectionTitle,
  StatCard,
  StatGrid,
  Tabs,
} from '../ui';
import type { ActiveTab, Feature, Project } from './types';

type OverviewTab = 'summary' | 'projects' | 'tasks' | 'shortcuts';

interface DashboardOverviewProps {
  projects: Project[];
  features: Feature[];
  userId?: string;
  userName?: string;
  onNewProject: () => void;
  onNavigate: (tab: ActiveTab, project?: Project | null) => void;
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const PRIORITY_LABEL: Record<string, string> = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' };
const STATUS_LABEL: Record<Feature['status'], string> = {
  todo: 'A fazer',
  'in-progress': 'Em progresso',
  review: 'Em revisão',
  testing: 'Em teste',
  done: 'Concluída',
};

function shortDate(value?: string) {
  if (!value) return 'Sem prazo';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function DashboardOverview({
  projects,
  features,
  userId,
  userName,
  onNewProject,
  onNavigate,
}: DashboardOverviewProps) {
  const [tab, setTab] = useState<OverviewTab>('summary');
  const now = Date.now();

  const pending = useMemo(() => features.filter(feature => feature.status !== 'done'), [features]);
  const overdue = useMemo(
    () => pending.filter(feature => feature.deadline && new Date(feature.deadline).getTime() < now),
    [pending, now],
  );
  const backlog = useMemo(
    () => pending.filter(feature => !feature.sprintId).sort((a, b) => (PRIORITY_ORDER[a.priority || 'medium'] ?? 2) - (PRIORITY_ORDER[b.priority || 'medium'] ?? 2)),
    [pending],
  );
  const myTasks = useMemo(() => pending.filter(feature => {
    const collaborators = feature.collaborators || [];
    return feature.assignedTo === userId || feature.assignedTo === userName || (!!userName && collaborators.includes(userName));
  }).sort((a, b) => {
    const left = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const right = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    return left - right;
  }), [pending, userId, userName]);

  const upcoming = useMemo(() => pending
    .filter(feature => feature.deadline)
    .sort((a, b) => new Date(a.deadline as string).getTime() - new Date(b.deadline as string).getTime()), [pending]);

  const projectRows = useMemo(() => projects.map(project => {
    const projectFeatures = features.filter(feature => feature.projectId === project.id);
    const projectPending = projectFeatures.filter(feature => feature.status !== 'done');
    return {
      project,
      total: projectFeatures.length,
      pending: projectPending.length,
      overdue: projectPending.filter(feature => feature.deadline && new Date(feature.deadline).getTime() < now).length,
    };
  }).sort((a, b) => (a.project.status === 'completed' ? 1 : 0) - (b.project.status === 'completed' ? 1 : 0) || b.pending - a.pending), [features, projects, now]);

  const attentionCount = overdue.length + projects.filter(project => project.deadline && project.status !== 'completed' && new Date(project.deadline).getTime() < now).length;
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const tabs = [
    { id: 'summary', label: 'Resumo', icon: BarChart3 },
    { id: 'projects', label: 'Projetos', icon: Briefcase, badge: projects.length || undefined },
    { id: 'tasks', label: 'Tarefas', icon: ListTodo, badge: myTasks.length || undefined },
    { id: 'shortcuts', label: 'Atalhos', icon: Rocket },
  ] as const;

  const projectFor = (feature: Feature) => projects.find(project => project.id === feature.projectId);

  const featureRow = (feature: Feature) => {
    const project = projectFor(feature);
    const isOverdue = Boolean(feature.deadline && new Date(feature.deadline).getTime() < now);
    return (
      <button
        key={feature.id}
        type="button"
        onClick={() => project && onNavigate(feature.sprintId ? 'board' : 'backlog', project)}
        className="flex w-full min-w-0 items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${isOverdue ? 'bg-red-500' : feature.priority === 'critical' ? 'bg-red-400' : feature.priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-800 dark:text-white">{feature.title}</span>
          <span className="block truncate text-[10px] text-slate-500 dark:text-white/45">{project?.name || 'Projeto'} · {STATUS_LABEL[feature.status]}</span>
        </span>
        <span className={`shrink-0 text-[10px] font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>{shortDate(feature.deadline)}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={BarChart3}
        title="Visão Geral"
        description={today}
        action={(
          <>
            <Button size="sm" variant="outline" iconLeft={<FolderOpen size={13} />} onClick={() => onNavigate('projects')}>Projetos</Button>
            <Button size="sm" iconLeft={<Plus size={13} />} onClick={onNewProject}>Novo projeto</Button>
          </>
        )}
      />

      {attentionCount > 0 && tab !== 'tasks' && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="min-w-0 flex-1"><strong>{attentionCount}</strong> item{attentionCount === 1 ? '' : 's'} precisa{attentionCount === 1 ? '' : 'm'} de atenção.</span>
          <Button size="xs" variant="outline" onClick={() => setTab('tasks')}>Ver tarefas</Button>
        </div>
      )}

      <Tabs<OverviewTab> items={tabs} value={tab} onChange={setTab} label="Seções da visão geral">
        {tab === 'summary' && (
          <div className="space-y-3">
            <StatGrid cols={4}>
              <StatCard className="!p-3" title="Projetos ativos" value={projects.filter(project => project.status === 'active').length} icon={Rocket} color="info" description="Em andamento" delay={0} />
              <StatCard className="!p-3" title="Concluídos" value={projects.filter(project => project.status === 'completed').length} icon={CheckCircle2} color="success" description="Entregues" delay={0.04} />
              <StatCard className="!p-3" title="Tarefas pendentes" value={pending.length} icon={ListTodo} color="warning" description={`${backlog.length} no backlog`} delay={0.08} />
              <StatCard className="!p-3" title="Clientes" value={new Set(projects.map(project => project.clientName).filter(Boolean)).size} icon={Users} color="purple" description="Clientes únicos" delay={0.12} />
            </StatGrid>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <PanelCard
                className="xl:col-span-2"
                icon={Briefcase}
                title="Projetos em andamento"
                description="Progresso e pendências dos projetos ativos"
                action={<Button size="xs" variant="ghost" onClick={() => setTab('projects')}>Ver todos</Button>}
                contentClassName="p-0"
              >
                {projectRows.length === 0 ? (
                  <EmptyState className="m-3" icon={Briefcase} title="Nenhum projeto cadastrado" action={<Button size="xs" onClick={onNewProject}>Criar projeto</Button>} />
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/10">
                    {projectRows.slice(0, 6).map(({ project, total, pending: projectPending, overdue: projectOverdue }) => (
                      <div key={project.id} className="flex min-w-0 flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                        <button type="button" onClick={() => onNavigate('summary', project)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-semibold text-slate-900 dark:text-white">{project.name}</span>
                            {projectOverdue > 0 && <Badge color="danger" size="xs">{projectOverdue} atrasada{projectOverdue === 1 ? '' : 's'}</Badge>}
                          </div>
                          <p className="truncate text-[10px] text-slate-500 dark:text-white/45">{project.clientName || 'Sem cliente'} · {projectPending} pendente{projectPending === 1 ? '' : 's'} de {total}</p>
                        </button>
                        <div className="w-full sm:w-40"><ProgressBar progress={project.progress || 0} size="sm" /></div>
                        <Button size="xs" variant="outline" onClick={() => onNavigate('board', project)}>Quadro</Button>
                      </div>
                    ))}
                  </div>
                )}
              </PanelCard>

              <PanelCard icon={AlertTriangle} title="Precisa de atenção" description="Prazos vencidos e itens fora de sprint" contentClassName="p-0">
                {overdue.length === 0 && backlog.length === 0 ? (
                  <EmptyState className="m-3" icon={CheckCircle2} title="Tudo em ordem" description="Nenhuma pendência crítica agora." />
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/10">
                    {[...overdue, ...backlog.filter(item => !overdue.some(overdueItem => overdueItem.id === item.id))].slice(0, 7).map(featureRow)}
                  </div>
                )}
              </PanelCard>
            </div>
          </div>
        )}

        {tab === 'projects' && (
          <PanelCard icon={Briefcase} title="Todos os projetos" description="Acesse resumo, backlog ou quadro sem sair da visão geral" contentClassName="p-0">
            {projectRows.length === 0 ? (
              <EmptyState className="m-3" icon={Briefcase} title="Nenhum projeto cadastrado" action={<Button size="xs" onClick={onNewProject}>Criar projeto</Button>} />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {projectRows.map(({ project, total, pending: projectPending, overdue: projectOverdue }) => (
                  <div key={project.id} className="flex flex-col gap-2 px-3 py-3 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{project.name}</p>
                        <Badge color={project.status === 'completed' ? 'success' : project.status === 'on-hold' ? 'warning' : 'info'} size="xs">
                          {project.status === 'completed' ? 'Concluído' : project.status === 'on-hold' ? 'Em espera' : 'Ativo'}
                        </Badge>
                        {projectOverdue > 0 && <Badge color="danger" size="xs">{projectOverdue} atrasada{projectOverdue === 1 ? '' : 's'}</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">{project.clientName || 'Sem cliente'} · {projectPending} pendente{projectPending === 1 ? '' : 's'} de {total}</p>
                    </div>
                    <div className="w-full lg:w-44"><ProgressBar progress={project.progress || 0} size="sm" /></div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="xs" variant="outline" onClick={() => onNavigate('summary', project)}>Resumo</Button>
                      <Button size="xs" variant="outline" onClick={() => onNavigate('backlog', project)}>Backlog</Button>
                      <Button size="xs" onClick={() => onNavigate('board', project)}>Quadro</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PanelCard>
        )}

        {tab === 'tasks' && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <PanelCard icon={ListTodo} title="Minhas tarefas" description="Pendências atribuídas a você" contentClassName="p-0">
              {myTasks.length === 0 ? <EmptyState className="m-3" icon={CheckCircle2} title="Nenhuma tarefa pendente" /> : <div className="divide-y divide-slate-100 dark:divide-white/10">{myTasks.slice(0, 12).map(featureRow)}</div>}
            </PanelCard>
            <PanelCard icon={CalendarClock} title="Próximos prazos" description="Entregas ordenadas pela data mais próxima" contentClassName="p-0">
              {upcoming.length === 0 ? <EmptyState className="m-3" icon={Clock3} title="Nenhum prazo definido" /> : <div className="divide-y divide-slate-100 dark:divide-white/10">{upcoming.slice(0, 12).map(featureRow)}</div>}
            </PanelCard>
          </div>
        )}

        {tab === 'shortcuts' && (
          <PanelCard icon={Rocket} title="Atalhos do sistema" description="Acesse rapidamente as áreas mais utilizadas">
            <div className="flex flex-wrap gap-2">
              {[
                { tab: 'projects' as const, label: 'Projetos', icon: FolderOpen },
                { tab: 'backlog' as const, label: 'Backlog', icon: ListTodo },
                { tab: 'portfolio' as const, label: 'Portfólio', icon: Star },
                { tab: 'blog' as const, label: 'Blog', icon: BookOpen },
                { tab: 'members' as const, label: 'Membros', icon: Users },
                { tab: 'chat' as const, label: 'Chat', icon: MessageSquare },
              ].map(item => (
                <Button key={item.tab} size="sm" variant="outline" iconLeft={<item.icon size={13} />} onClick={() => onNavigate(item.tab)}>{item.label}</Button>
              ))}
            </div>
          </PanelCard>
        )}
      </Tabs>
    </div>
  );
}

export default DashboardOverview;
