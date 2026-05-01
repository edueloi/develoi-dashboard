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
        <div className="bg-white rounded-[24px] p-6 flex items-start gap-5 flex-1 border shadow-sm" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.03)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--brand-navy)' }}>Equipe Develoi</p>
            <p className="text-xs font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
              Estes são os talentos que dão vida aos nossos ecossistemas.
              As informações abaixo são exibidas na seção <strong>Sobre</strong> do site oficial.
            </p>
          </div>
        </div>
        <button 
          onClick={openNew} 
          className="flex items-center gap-2 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}
        >
          <UserPlus className="w-4 h-4" /> ADICIONAR TALENTO
        </button>
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
      <div className="bg-white rounded-2xl border transition-all overflow-hidden group hover:-translate-y-1" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.06)' }}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="relative w-20 h-20">
              {m.photoURL ? (
                <img src={m.photoURL} alt={m.name} className="w-full h-full rounded-2xl border-2 shadow-sm object-cover" style={{ borderColor: 'var(--brand-gold)' }} />
              ) : (
                <div className="w-full h-full rounded-2xl flex items-center justify-center text-3xl font-black text-white border-2 shadow-sm" style={{ background: 'var(--brand-navy)', borderColor: 'var(--brand-gold)' }}>
                  {m.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={onEdit} className="p-2 text-slate-400 rounded-xl transition-all"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--brand-navy)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
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
            <h3 className="font-black text-lg mb-1 tracking-tight truncate transition-colors" style={{ color: 'var(--brand-navy)' }}>{m.name}</h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest" style={{ background: 'var(--bg-tertiary)', color: 'var(--brand-navy)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold)' }} />
              {m.role}
            </span>
          </div>

          {m.bio && <p className="text-xs font-medium leading-relaxed italic line-clamp-3 mb-6" style={{ color: 'var(--text-secondary)' }}>"{m.bio}"</p>}

          <div className="flex gap-4 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {m.linkedin && (
              <a href={m.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#0a66c2] transition-colors">
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
      </div>

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
              <img src={form.photoURL} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 shadow-sm" style={{ borderColor: 'var(--brand-gold)' }} />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-sm" style={{ background: 'var(--brand-navy)' }}>
                {form.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {form.photoURL && (
              <button
                onClick={() => onChange({ photoURL: '' })}
                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload buttons */}
          <div className="flex-1 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>Foto do Talento</p>
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
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-[11px] font-black transition-all disabled:opacity-50 w-full justify-center"
              style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)', background: 'var(--bg-tertiary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {uploading ? 'CARREGANDO FOTO...' : 'SELECIONAR FOTO (JPG, PNG, WebP)'}
            </button>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>* A foto aparecerá publicamente no site. Recomendado imagem quadrada.</p>
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
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            CANCELAR
          </button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-3.5 rounded-xl text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-60" style={{ background: 'var(--brand-navy)', boxShadow: '0 4px 12px rgba(13,31,78,0.2)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            SALVAR TALENTO
          </button>
        </div>
      </div>
    </Modal>
  );
}
