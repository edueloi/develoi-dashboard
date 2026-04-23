import { useEffect, useState } from 'react';
import { Globe, Briefcase, Eye, X } from 'lucide-react';
import type { Project } from './types';

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

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
        <Globe className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-indigo-800">Portfólio Público</p>
          <p className="text-xs text-indigo-600 mt-0.5">Projetos marcados como <strong>Público</strong> aparecem na seção de portfólio do site develoi.com.br.</p>
        </div>
      </div>

      {localProjects.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum projeto cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {localProjects.map(project => {
            const isPublic = project.visibility === 'public';
            return (
              <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{project.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{project.description || 'Sem descrição.'}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider flex-shrink-0 ${
                    project.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    project.status === 'completed' ? 'bg-indigo-50 text-indigo-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {project.status === 'active' ? 'Ativo' : project.status === 'completed' ? 'Concluído' : 'Pausado'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {isPublic ? <Eye className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-400" />}
                    <span className={`text-xs font-bold ${isPublic ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isPublic ? 'Visível no site' : 'Oculto no site'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleVisibility(project)}
                    disabled={saving === project.id}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${
                      isPublic ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {saving === project.id ? '...' : isPublic ? 'Tornar Privado' : 'Publicar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
