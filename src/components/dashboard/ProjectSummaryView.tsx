import { useState, type ReactNode } from 'react';
import {
  Briefcase,
  Calendar,
  ExternalLink,
  Eye,
  FileImage,
  History,
  Kanban,
  KeyRound,
  Link2,
  ListTodo,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Badge,
  Button,
  DetailField,
  EmptyState,
  PanelCard,
  ProgressBar,
  SectionTitle,
  StatCard,
  StatGrid,
  Tabs,
} from '../ui';
import { ProjectAccessVault } from './ProjectAccessVault';
import type { ActiveTab, Project } from './types';

type SummaryTab = 'overview' | 'planning' | 'media' | 'access';

interface ProjectSummaryViewProps {
  project: Project;
  gallery: ReactNode;
  onEdit: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export function ProjectSummaryView({ project, gallery, onEdit, onNavigate }: ProjectSummaryViewProps) {
  const [tab, setTab] = useState<SummaryTab>('overview');
  const progress = project.progress || 0;
  const statusLabel = project.status === 'completed' ? 'Concluído' : project.status === 'on-hold' ? 'Em espera' : 'Ativo';
  const statusColor = project.status === 'completed' ? 'success' : project.status === 'on-hold' ? 'warning' : 'info';
  const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido';
  const tabs = [
    { id: 'overview', label: 'Resumo', icon: Briefcase },
    { id: 'planning', label: 'Planejamento', icon: Target, badge: project.goals?.length || undefined },
    { id: 'media', label: 'Arquivos e links', icon: FileImage, badge: project.imageCount || undefined },
    { id: 'access', label: 'Acessos', icon: KeyRound },
  ] as const;

  const projectActions = [
    { tab: 'backlog' as const, label: 'Backlog', icon: ListTodo },
    { tab: 'board' as const, label: 'Quadro', icon: Kanban },
    { tab: 'timeline' as const, label: 'Cronograma', icon: Calendar },
    { tab: 'tests' as const, label: 'Qualidade', icon: ShieldCheck },
    { tab: 'chat' as const, label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={Briefcase}
        title={project.name}
        description={project.clientName ? `Projeto de ${project.clientName}` : 'Resumo e informações do projeto'}
        action={(
          <>
            {project.projectUrl && (
              <Button size="sm" variant="outline" iconLeft={<ExternalLink size={13} />} onClick={() => window.open(project.projectUrl, '_blank', 'noopener,noreferrer')}>Abrir site</Button>
            )}
            <Button size="sm" iconLeft={<Pencil size={13} />} onClick={onEdit}>Editar projeto</Button>
          </>
        )}
      />

      <StatGrid cols={4}>
        <StatCard className="!p-3" title="Status" value={statusLabel} icon={ShieldCheck} color={statusColor} delay={0} />
        <StatCard className="!p-3" title="Progresso" value={`${progress}%`} icon={TrendingUp} color="success" delay={0.04} />
        <StatCard className="!p-3" title="Prazo final" value={deadline} icon={Calendar} color="warning" delay={0.08} />
        <StatCard className="!p-3" title="Visibilidade" value={project.visibility === 'private' ? 'Privado' : 'Público'} icon={Eye} color="purple" delay={0.12} />
      </StatGrid>

      <Tabs<SummaryTab> items={tabs} value={tab} onChange={setTab} label="Seções do resumo do projeto">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div className="space-y-3 xl:col-span-2">
              <PanelCard icon={Briefcase} title="Descrição do projeto" description="Objetivo e contexto principal">
                {project.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-white/70">{project.description}</p>
                ) : (
                  <EmptyState icon={Pencil} title="Descrição não informada" action={<Button size="xs" variant="outline" onClick={onEdit}>Adicionar descrição</Button>} />
                )}
              </PanelCard>

              <PanelCard icon={TrendingUp} title="Andamento" description="Progresso geral informado para o projeto">
                <ProgressBar progress={progress} size="md" />
              </PanelCard>
            </div>

            <div className="space-y-3">
              <PanelCard icon={Eye} title="Detalhes" description="Informações rápidas do projeto">
                <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1">
                  <DetailField label="Cliente" value={project.clientName} />
                  <DetailField label="Status" value={statusLabel} />
                  <DetailField label="Prazo final" value={deadline} />
                  <DetailField label="Visibilidade" value={project.visibility === 'private' ? 'Privado' : 'Público'} />
                </dl>
              </PanelCard>

              <PanelCard icon={Kanban} title="Áreas do projeto" description="Ações rápidas mantendo o contexto atual">
                <div className="flex flex-wrap gap-2">
                  {projectActions.map(action => (
                    <Button key={action.tab} size="xs" variant="outline" iconLeft={<action.icon size={12} />} onClick={() => onNavigate(action.tab)}>{action.label}</Button>
                  ))}
                </div>
              </PanelCard>
            </div>
          </div>
        )}

        {tab === 'planning' && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <PanelCard icon={Target} title="Metas e objetivos" description={`${project.goals?.length || 0} meta${project.goals?.length === 1 ? '' : 's'} registrada${project.goals?.length === 1 ? '' : 's'}`}>
              {project.goals?.length ? (
                <ol className="space-y-2">
                  {project.goals.map((goal, index) => (
                    <li key={`${goal}-${index}`} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 dark:border-white/10 dark:bg-white/5">
                      <Badge color="primary" size="xs">{index + 1}</Badge>
                      <span className="text-xs leading-relaxed text-slate-700 dark:text-white/70">{goal}</span>
                    </li>
                  ))}
                </ol>
              ) : <EmptyState icon={Target} title="Nenhuma meta definida" action={<Button size="xs" variant="outline" onClick={onEdit}>Adicionar metas</Button>} />}
            </PanelCard>

            <div className="space-y-3">
              <PanelCard icon={TrendingUp} title="Financeiro e orçamento">
                {project.financials ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-white/70">{project.financials}</p> : <EmptyState title="Informações financeiras não cadastradas" />}
              </PanelCard>
              <PanelCard icon={History} title="História e contexto">
                {project.history ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-white/70">{project.history}</p> : <EmptyState title="Histórico ainda não registrado" />}
              </PanelCard>
            </div>
          </div>
        )}

        {tab === 'media' && (
          <div className="space-y-3">
            {project.projectUrl && (
              <PanelCard icon={Link2} title="Link do projeto" description="Endereço principal publicado">
                <a href={project.projectUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 break-all text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  <ExternalLink size={13} className="shrink-0" />{project.projectUrl}
                </a>
              </PanelCard>
            )}
            {gallery}
          </div>
        )}

        {tab === 'access' && <ProjectAccessVault projectId={project.id} />}
      </Tabs>
    </div>
  );
}

export default ProjectSummaryView;
