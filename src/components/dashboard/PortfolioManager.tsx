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
    <div className="space-y-8">
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

      <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-6 flex items-start gap-5">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Gerenciamento de Vitrine</p>
          <p className="text-xs text-indigo-600/80 mt-1 font-medium leading-relaxed">
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
          className="py-24"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
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
                <div className="flex items-center justify-between mt-2 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isPublic ? "bg-emerald-50" : "bg-slate-50"
                    )}>
                      {isPublic ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    </div>
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      isPublic ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {isPublic ? 'Visível na Vitrine' : 'Acesso Restrito'}
                    </span>
                  </div>

                  <Button
                    onClick={() => toggleVisibility(project)}
                    loading={saving === project.id}
                    variant={isPublic ? 'outline' : 'primary'}
                    size="sm"
                    className={cn(
                      "font-black tracking-widest",
                      isPublic ? "border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200" : "bg-indigo-600 shadow-indigo-100"
                    )}
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
