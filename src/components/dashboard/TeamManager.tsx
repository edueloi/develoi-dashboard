import { useEffect, useState } from 'react';
import { Users, UserPlus, Pencil, Trash2, Save, Link2, Github, Linkedin, Briefcase } from 'lucide-react';
import { Button, Modal, StatGrid, StatCard, EmptyState, Input, Textarea, PanelCard, Badge } from '../ui';
import type { TeamMemberSite } from './types';
import { cn } from '../../lib/utils';

export function TeamManager() {
  const [members, setMembers] = useState<TeamMemberSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<TeamMemberSite>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/site/team');
      const data = await res.json();
      setMembers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const openNew = () => {
    setForm({ name: '', role: '', bio: '', photoURL: '', linkedin: '', github: '' });
    setEditingId('new');
  };

  const openEdit = (m: TeamMemberSite) => { setForm({ ...m }); setEditingId(m.id); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId === 'new') {
        await fetch('/api/site/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch(`/api/site/team/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setEditingId(null);
      fetchMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este membro da equipe?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/site/team/${id}`, { method: 'DELETE' });
      fetchMembers();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-6 flex items-start gap-5 flex-1">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Equipe Develoi</p>
            <p className="text-xs text-indigo-600/80 mt-1 font-medium leading-relaxed">
              Estes são os talentos que dão vida aos nossos ecossistemas. 
              As informações abaixo são exibidas na seção <strong>Sobre</strong> do site oficial.
            </p>
          </div>
        </div>
        <Button onClick={openNew} iconLeft={<UserPlus className="w-4 h-4" />} size="lg">
          ADICIONAR TALENTO
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState 
          icon={Users}
          title="Equipe vazia"
          description="Ainda não há membros cadastrados para exibição no site."
          action={<Button variant="outline" onClick={openNew}>Adicionar o primeiro membro</Button>}
          className="py-24"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {members.map(m => (
            <PanelCard
              key={m.id}
              noPadding
              className="group hover:shadow-2xl hover:shadow-indigo-100/40 transition-all overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="relative w-16 h-16">
                    {m.photoURL ? (
                      <img src={m.photoURL} alt={m.name} className="w-full h-full rounded-2xl border-4 border-white shadow-xl object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-black text-white border-4 border-white shadow-xl">
                        {m.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEdit(m)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-black text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors tracking-tight truncate">{m.name}</h3>
                  <Badge color="primary" dot pill>{m.role}</Badge>
                </div>

                {m.bio && <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-3 mb-6">"{m.bio}"</p>}

                <div className="flex gap-4 pt-6 border-t border-slate-50">
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {m.github && (
                    <a href={m.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </PanelCard>
          ))}
        </div>
      )}

      {editingId && (
        <Modal isOpen onClose={() => setEditingId(null)} title={editingId === 'new' ? 'Novo Talento' : 'Editar Talento'} size="md">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Nome completo" 
                placeholder="Ex: João Silva" 
                value={form.name || ''} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              />
              <Input 
                label="Cargo / Função" 
                placeholder="Ex: Desenvolvedor Senior" 
                value={form.role || ''} 
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} 
              />
            </div>

            <Input 
              label="URL da Foto" 
              placeholder="https://..." 
              value={form.photoURL || ''} 
              onChange={e => setForm(f => ({ ...f, photoURL: e.target.value }))} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="LinkedIn" 
                iconLeft={<Linkedin className="w-4 h-4" />}
                placeholder="https://linkedin.com/..." 
                value={form.linkedin || ''} 
                onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} 
              />
              <Input 
                label="GitHub" 
                iconLeft={<Github className="w-4 h-4" />}
                placeholder="https://github.com/..." 
                value={form.github || ''} 
                onChange={e => setForm(f => ({ ...f, github: e.target.value }))} 
              />
            </div>

            <Textarea 
              label="Mini Bio" 
              placeholder="Fale um pouco sobre o papel desse membro na Develoi..." 
              value={form.bio || ''} 
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} 
              rows={3}
            />

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">CANCELAR</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1" iconLeft={<Save className="w-4 h-4" />}>
                SALVAR ALTERAÇÕES
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
