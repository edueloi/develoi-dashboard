import { motion } from 'framer-motion';
import { useState } from 'react';
import { Settings, Trash2, Users, Calendar, Rocket, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Modal, ConfirmModal } from '../ui/Modal';
import type { Project } from './types';

// EditProjectModal is still in Dashboard.tsx and passed as a prop to avoid circular deps
interface ProjectsListProps {
  projects: Project[];
  onSelect: (p: Project) => void;
  onEdit: (p: Project) => void;
}

export function ProjectsList({ projects, onSelect, onEdit }: ProjectsListProps) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await fetch(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' });
      setProjectToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const statusMap: Record<string, { label: string; color: any }> = {
    active:    { label: 'Ativo',     color: 'success' },
    completed: { label: 'Concluído', color: 'info' },
    'on-hold': { label: 'Em Espera', color: 'warning' },
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {projects.map((project, i) => {
          const s = statusMap[project.status] ?? statusMap['on-hold'];
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => onSelect(project)}
            >
              {/* Top color bar */}
              <div className={`h-1 ${project.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : project.status === 'completed' ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />

              <div className="p-6">
                {/* Status + actions */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Badge color={s.color} dot>
                      {s.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title + description */}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{project.description || 'Sem descrição.'}</p>
                </div>

                {/* Progress */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Progresso</span>
                    <span className="font-black text-indigo-600">{project.progress ?? 0}%</span>
                  </div>
                  <ProgressBar progress={project.progress ?? 0} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-medium">{project.clientName || 'Cliente'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      {project.deadline ? format(new Date(project.deadline), 'dd MMM', { locale: ptBR }) : 'S/ Data'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Rocket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Nenhum projeto ainda. Crie o primeiro!</p>
          </div>
        )}
      </motion.div>

      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Projeto"
        message={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
