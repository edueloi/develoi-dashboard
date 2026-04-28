import { useEffect, useRef, useState } from 'react';
import { Users, UserPlus, Pencil, Trash2, Save, Github, Linkedin, Camera, X, Loader2 } from 'lucide-react';
import { Button, Modal, ConfirmModal, EmptyState, Input, Textarea, PanelCard, Badge } from '../ui';
import type { TeamMemberSite } from './types';
import { cn } from '../../lib/utils';

export function TeamManager() {
  const [members, setMembers]   = useState<TeamMemberSite[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]         = useState<Partial<TeamMemberSite>>({});
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/site/team');
      setMembers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const openNew  = () => { setForm({ name: '', role: '', bio: '', photoURL: '', linkedin: '', github: '' }); setEditingId('new'); };
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
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/site/team/${id}`, { method: 'DELETE' });
      fetchMembers();
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
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
            <MemberCard
              key={m.id}
              member={m}
              deleting={deletingId === m.id}
              onEdit={() => openEdit(m)}
              onDelete={() => handleDelete(m.id)}
            />
          ))}
        </div>
      )}

      {editingId && (
        <MemberFormModal
          form={form}
          isNew={editingId === 'new'}
          saving={saving}
          onChange={patch => setForm(f => ({ ...f, ...patch }))}
          onSave={handleSave}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

// ─── MemberCard ───────────────────────────────────────────────────────────────

function MemberCard({ member: m, deleting, onEdit, onDelete }: {
  member: TeamMemberSite; deleting: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <PanelCard noPadding className="group hover:shadow-2xl hover:shadow-indigo-100/40 transition-all overflow-hidden">
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
              <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); onDelete(); }}
        title="Remover Membro"
        message={`Remover "${m.name}" da equipe? Esta ação não pode ser desfeita.`}
        confirmLabel="REMOVER"
        variant="danger"
      />
    </>
  );
}

// ─── MemberFormModal ──────────────────────────────────────────────────────────

function MemberFormModal({ form, isNew, saving, onChange, onSave, onClose }: {
  form: Partial<TeamMemberSite>;
  isNew: boolean;
  saving: boolean;
  onChange: (patch: Partial<TeamMemberSite>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ photoURL: reader.result as string });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal isOpen onClose={onClose} title={isNew ? 'Novo Talento' : 'Editar Talento'} size="md">
      <div className="space-y-6">

        {/* Photo upload */}
        <div className="flex items-center gap-5">
          {/* Preview */}
          <div className="relative shrink-0">
            {form.photoURL ? (
              <img src={form.photoURL} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white border-4 border-white shadow-lg">
                {form.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {form.photoURL && (
              <button
                onClick={() => onChange({ photoURL: '' })}
                className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Upload buttons */}
          <div className="flex-1 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Foto do Membro</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors disabled:opacity-50 w-full justify-center"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {uploading ? 'Carregando...' : 'ESCOLHER FOTO'}
            </button>
            <p className="text-[10px] text-slate-400 text-center">JPG, PNG ou WebP · Máx 5MB</p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Nome Completo *"
            placeholder="Ex: João Silva"
            value={form.name || ''}
            onChange={e => onChange({ name: e.target.value })}
          />
          <Input
            label="Cargo / Função *"
            placeholder="Ex: Desenvolvedor Sênior"
            value={form.role || ''}
            onChange={e => onChange({ role: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="LinkedIn"
            iconLeft={<Linkedin className="w-4 h-4" />}
            placeholder="https://linkedin.com/in/..."
            value={form.linkedin || ''}
            onChange={e => onChange({ linkedin: e.target.value })}
          />
          <Input
            label="GitHub"
            iconLeft={<Github className="w-4 h-4" />}
            placeholder="https://github.com/..."
            value={form.github || ''}
            onChange={e => onChange({ github: e.target.value })}
          />
        </div>

        <Textarea
          label="Mini Bio"
          placeholder="Fale um pouco sobre o papel desse membro na Develoi..."
          value={form.bio || ''}
          onChange={e => onChange({ bio: e.target.value })}
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} fullWidth>CANCELAR</Button>
          <Button onClick={onSave} loading={saving} fullWidth iconLeft={<Save className="w-4 h-4" />}>
            SALVAR
          </Button>
        </div>
      </div>
    </Modal>
  );
}
