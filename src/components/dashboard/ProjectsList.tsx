import { motion } from 'framer-motion';
import { useState } from 'react';
import { Settings, Trash2, Users, Calendar, Rocket, History, Briefcase, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge, ProgressBar, Modal, ConfirmModal, EmptyState, Button } from '../ui';
import type { Project } from './types';
import { cn } from '../../lib/utils';

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
    <div className="space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
      >
        {projects.map((project, i) => {
          const s = statusMap[project.status] ?? statusMap['on-hold'];
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(project)}
              className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/40 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
              {/* Decorative Header */}
              <div className={cn(
                "h-2 w-full",
                project.status === 'active' ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
                project.status === 'completed' ? "bg-gradient-to-r from-indigo-500 to-violet-500" :
                "bg-gradient-to-r from-amber-400 to-orange-400"
              )} />

              <div className="p-8 flex flex-col flex-1">
                {/* Status + actions */}
                <div className="flex items-center justify-between mb-6">
                  <Badge color={s.color} dot pill>
                    {s.label}
                  </Badge>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title + description */}
                <div className="mb-6 flex-1">
                  <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight tracking-tight">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium italic">
                    "{project.description || 'Nenhum detalhe adicional para este projeto.'}"
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-3 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Entrega Realizada</span>
                    <span className="text-indigo-600">{project.progress ?? 0}%</span>
                  </div>
                  <ProgressBar progress={project.progress ?? 0} showLabel={false} size="sm" />
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Cliente</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                        <Users className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{project.clientName || 'Geral'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Dead-line</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        {project.deadline ? format(new Date(project.deadline), 'dd MMM', { locale: ptBR }) : 'Pendente'}
                      </span>
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover Overlay Arrow */}
              <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 pointer-events-none">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full">
            <EmptyState 
              icon={Briefcase}
              title="Sua lista de projetos está vazia"
              description="Comece agora criando seu primeiro ecossistema de desenvolvimento."
              className="py-32"
            />
          </div>
        )}
      </motion.div>

      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Arquivar Projeto"
        message={`Tem certeza que deseja remover o projeto "${projectToDelete?.name}"? Todas as funcionalidades e logs serão movidos para o lixo.`}
      />
    </div>
  );
}
