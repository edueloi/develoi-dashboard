import { useEffect, useState } from 'react';
import { Globe, Briefcase, Eye, EyeOff, CheckCircle2, Layout } from 'lucide-react';
import type { Project } from './types';
import { EmptyState, Button, PanelCard, Badge, StatGrid, StatCard } from '../ui';
import { cn } from '../../lib/utils';

export function PortfolioManager({ projects }: { projects: Project[] }) {
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { setLocalProjects(projects); }, [projects]);

  const toggleVisibility = async (project: Project) => {
    const newVisibility = project.visibility === 'public' ? 'private' : 'public';
    setSaving(project.id);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      setLocalProjects((prev: Project[]) => prev.map((p: Project) => p.id === project.id ? { ...p, visibility: newVisibility } : p));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const statusMap: Record<string, { label: string; color: any }> = {
    active:    { label: 'Ativo',     color: 'success' },
    completed: { label: 'Concluído', color: 'info' },
    'on-hold': { label: 'Em Espera', color: 'warning' },
  };

  return (
    <div className="space-y-4">
      <StatGrid cols={3}>
        <StatCard 
          title="Total de Projetos" 
          value={localProjects.length} 
          icon={Layout} 
          color="info"
          delay={0.1}
        />
        <StatCard 
          title="Públicos no Site" 
          value={localProjects.filter(p => p.visibility === 'public').length} 
          icon={Globe} 
          color="success"
          delay={0.2}
        />
        <StatCard 
          title="Privados / Internos" 
          value={localProjects.filter(p => p.visibility !== 'public').length} 
          icon={EyeOff} 
          color="default"
          delay={0.3}
        />
      </StatGrid>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-[#0D1F4E]" />
        </div>
        <div>
          <p className="text-sm font-black text-[#0D1F4E] tracking-tight">Vitrine do Portfólio</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">
            Configure quais ecossistemas estarão visíveis no portfólio oficial. 
            Projetos <strong>Públicos</strong> ganham destaque automático no site da Develoi.
          </p>
        </div>
      </div>

      {localProjects.length === 0 ? (
        <EmptyState 
          icon={Briefcase}
          title="Nenhum projeto disponível"
          description="Você precisa criar um projeto antes de gerenciar sua visibilidade no portfólio."
          className="py-12"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
          {localProjects.map(project => {
            const isPublic = project.visibility === 'public';
            const s = statusMap[project.status] ?? statusMap['on-hold'];
            
            return (
              <PanelCard
                key={project.id}
                title={project.name}
                description={project.description || 'Nenhum detalhe adicional.'}
                icon={Briefcase}
                action={
                  <Badge color={s.color} dot pill>
                    {s.label}
                  </Badge>
                }
                className={cn(
                  "transition-all duration-300",
                  isPublic ? "border-emerald-100 shadow-emerald-100/20" : "border-slate-200"
                )}
              >
                <div className="grid grid-cols-2 gap-2 mt-1 mb-3 text-[11px] text-slate-500">
                  <span className="truncate">Cliente: <strong className="text-slate-700">{project.clientName || 'Interno'}</strong></span>
                  <span className="text-right">Progresso: <strong className="text-slate-700">{project.progress ?? 0}%</strong></span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isPublic ? "bg-emerald-50" : "bg-slate-50"
                    )}>
                      {isPublic ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      isPublic ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {isPublic ? 'Visível na Vitrine' : 'Acesso Restrito'}
                    </span>
                  </div>

                  <Button
                    onClick={() => toggleVisibility(project)}
                    loading={saving === project.id}
                    variant={isPublic ? 'danger' : 'primary'}
                    size="sm"
                    className="font-black tracking-wider"
                  >
                    {isPublic ? 'REMOVER' : 'PUBLICAR AGORA'}
                  </Button>
                </div>
              </PanelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
