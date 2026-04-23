import { useEffect, useState } from 'react';
import { Users, UserPlus, Pencil, Trash2, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { TeamMemberSite } from './types';

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

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando equipe...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 flex-1 mr-4">
          <Users className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <p className="text-xs text-indigo-700 font-medium">Os membros cadastrados aqui aparecem na página <strong>Sobre</strong> do site público.</p>
        </div>
        <Button onClick={openNew}><UserPlus className="w-4 h-4 mr-2" /> ADICIONAR</Button>
      </div>

      {members.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum membro cadastrado.</p>
          <button onClick={openNew} className="mt-4 text-sm font-bold text-indigo-600 hover:underline">Adicionar o primeiro membro</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {m.photoURL ? (
                  <img src={m.photoURL} alt={m.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-lg font-black text-indigo-600 border-2 border-indigo-100">
                    {m.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{m.name}</p>
                  <p className="text-xs text-indigo-600 font-semibold truncate">{m.role}</p>
                </div>
              </div>
              {m.bio && <p className="text-xs text-slate-500 line-clamp-2">{m.bio}</p>}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => openEdit(m)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingId && (
        <Modal isOpen onClose={() => setEditingId(null)} title={editingId === 'new' ? 'Novo Membro' : 'Editar Membro'}>
          <div className="space-y-4">
            {[
              { label: 'Nome completo', key: 'name', placeholder: 'João Silva' },
              { label: 'Cargo / Função', key: 'role', placeholder: 'Desenvolvedor Full Stack' },
              { label: 'URL da Foto', key: 'photoURL', placeholder: 'https://...' },
              { label: 'LinkedIn', key: 'linkedin', placeholder: 'https://linkedin.com/in/...' },
              { label: 'GitHub', key: 'github', placeholder: 'https://github.com/...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</label>
                <input type="text" placeholder={placeholder} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bio</label>
              <textarea rows={3} placeholder="Breve descrição sobre o membro..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setEditingId(null)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-all">Cancelar</button>
            <Button onClick={handleSave} loading={saving} className="flex-1"><Save className="w-4 h-4 mr-2" /> SALVAR</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
