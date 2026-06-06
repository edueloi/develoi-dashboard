import { useEffect, useRef, useState } from 'react';
import {
  Users, UserPlus, Pencil, Trash2, Save, Github, Linkedin, Instagram,
  Camera, X, Loader2, MapPin, GraduationCap, Star, Heart, Zap, Calendar,
  Briefcase, ListChecks, Flag, Quote, Eye, EyeOff, Globe, Lock, ExternalLink,
} from 'lucide-react';
import { Button, Modal, ConfirmModal, EmptyState, Input, Textarea } from '../ui';
import type { TeamMemberSite } from './types';

export function TeamManager() {
  const [members, setMembers]     = useState<TeamMemberSite[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [form, setForm]           = useState<Partial<TeamMemberSite>>({});
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/site/team');
      setMembers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const blankForm = (): Partial<TeamMemberSite> => ({
    name: '', role: '', bio: '', photoURL: '',
    linkedin: '', github: '', instagram: '',
    specialty: '', formation: '', curiosities: '', hobbies: '',
    location: '', yearsExp: undefined,
    mission: '', missionPublic: true,
    responsibilities: '', responsibilitiesPublic: false,
    objectives: '', objectivesPublic: false,
    expectations: '', expectationsPublic: false,
    phrase: '', phrasePublic: true,
  });

  const openNew  = () => { setForm(blankForm()); setEditingId('new'); };
  const openEdit = (m: TeamMemberSite) => { setForm({ ...m }); setEditingId(m.id); };
  const openView = (m: TeamMemberSite) => setViewingId(m.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId === 'new') {
        await fetch('/api/site/team', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch(`/api/site/team/${editingId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
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

  const viewingMember = members.find(m => m.id === viewingId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="bg-white rounded-[24px] p-6 flex items-start gap-5 flex-1 border shadow-sm" style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.03)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--brand-navy)' }} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--brand-navy)' }}>Equipe Develoi</p>
            <p className="text-xs font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
              Gerencie os perfis da equipe. Use os toggles <Globe className="w-3 h-3 inline" /> / <Lock className="w-3 h-3 inline" /> para controlar o que aparece no site público.
              Campos internos ficam visíveis apenas aqui no dashboard.
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

      {/* Grid de cards */}
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
            <AdminMemberCard
              key={m.id}
              member={m}
              deleting={deletingId === m.id}
              onEdit={() => openEdit(m)}
              onView={() => openView(m)}
              onDelete={() => handleDelete(m.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de edição */}
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

      {/* Modal de perfil interno */}
      {viewingMember && (
        <InternalProfileModal
          member={viewingMember}
          onClose={() => setViewingId(null)}
          onEdit={() => { setViewingId(null); openEdit(viewingMember); }}
        />
      )}
    </div>
  );
}

// ─── Admin Card ───────────────────────────────────────────────────────────────

function AdminMemberCard({ member: m, deleting, onEdit, onView, onDelete }: {
  member: TeamMemberSite;
  deleting: boolean;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const publicCount = [
    m.missionPublic && m.mission,
    m.responsibilitiesPublic && m.responsibilities,
    m.objectivesPublic && m.objectives,
    m.expectationsPublic && m.expectations,
    m.phrasePublic && m.phrase,
  ].filter(Boolean).length;

  const internalCount = [
    !m.missionPublic && m.mission,
    !m.responsibilitiesPublic && m.responsibilities,
    !m.objectivesPublic && m.objectives,
    !m.expectationsPublic && m.expectations,
    !m.phrasePublic && m.phrase,
  ].filter(Boolean).length;

  return (
    <>
      <div
        className="bg-white rounded-2xl border transition-all overflow-hidden group hover:-translate-y-1"
        style={{ borderColor: 'var(--border-color)', boxShadow: '0 4px 20px rgba(13,31,78,0.06)' }}
      >
        <div className="p-6">
          {/* Topo: foto + ações */}
          <div className="flex justify-between items-start mb-5">
            <div className="relative w-16 h-16">
              {m.photoURL ? (
                <img src={m.photoURL} alt={m.name} className="w-full h-full rounded-xl border-2 shadow-sm object-cover" style={{ borderColor: 'var(--brand-gold)' }} />
              ) : (
                <div className="w-full h-full rounded-xl flex items-center justify-center text-2xl font-black text-white border-2 shadow-sm" style={{ background: 'var(--brand-navy)', borderColor: 'var(--brand-gold)' }}>
                  {m.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={onView} title="Ver perfil interno" className="p-2 rounded-xl text-slate-400 transition-all hover:text-indigo-600 hover:bg-indigo-50">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={onEdit} title="Editar" className="p-2 rounded-xl text-slate-400 transition-all hover:text-[color:var(--brand-navy)] hover:bg-[color:var(--bg-tertiary)]">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-40">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nome e cargo */}
          <h3 className="font-black text-base mb-1 tracking-tight truncate" style={{ color: 'var(--brand-navy)' }}>{m.name}</h3>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-3" style={{ background: 'var(--bg-tertiary)', color: 'var(--brand-navy)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-gold)' }} />
            {m.role}
          </span>

          {m.bio && <p className="text-xs leading-relaxed italic line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>"{m.bio}"</p>}

          {/* Indicadores de visibilidade */}
          <div className="flex gap-2 flex-wrap mb-4">
            {publicCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                <Globe className="w-3 h-3" /> {publicCount} campo{publicCount > 1 ? 's' : ''} público{publicCount > 1 ? 's' : ''}
              </span>
            )}
            {internalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>
                <Lock className="w-3 h-3" /> {internalCount} interno{internalCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Redes e botão ver perfil */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex gap-3">
              {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#0a66c2] transition-colors"><Linkedin className="w-4 h-4" /></a>}
              {m.github   && <a href={m.github}   target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github className="w-4 h-4" /></a>}
              {m.instagram && <a href={m.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-pink-600 transition-colors"><Instagram className="w-4 h-4" /></a>}
            </div>
            <button
              onClick={onView}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:underline"
              style={{ color: 'var(--brand-navy)' }}
            >
              <Eye className="w-3.5 h-3.5" /> Ver Perfil
            </button>
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

// ─── Modal de perfil interno ──────────────────────────────────────────────────

function InternalProfileModal({ member: m, onClose, onEdit }: {
  member: TeamMemberSite;
  onClose: () => void;
  onEdit: () => void;
}) {
  function parseList(text: string): string[] {
    return text.split(/\n|;/).map(l => l.replace(/^[\s\-\*\•]+/, '').trim()).filter(Boolean);
  }

  const structuredSections = [
    { icon: Briefcase,  label: 'Missão na Develoi',            value: m.mission,         pub: m.missionPublic,          list: false },
    { icon: ListChecks, label: 'Responsabilidades',             value: m.responsibilities, pub: m.responsibilitiesPublic, list: true  },
    { icon: Flag,       label: 'Objetivo da Função',            value: m.objectives,       pub: m.objectivesPublic,       list: false },
    { icon: Users,      label: 'O que esperamos',               value: m.expectations,     pub: m.expectationsPublic,     list: false },
    { icon: Quote,      label: 'Frase da Função',               value: m.phrase,           pub: m.phrasePublic,           list: false },
  ].filter(s => s.value);

  const aboutSections = [
    { icon: Zap,          label: 'Especialidades',      value: m.specialty   },
    { icon: GraduationCap,label: 'Formação',             value: m.formation   },
    { icon: Star,         label: 'Curiosidades',         value: m.curiosities },
    { icon: Heart,        label: 'Hobbies',              value: m.hobbies     },
  ].filter(s => s.value);

  return (
    <Modal isOpen onClose={onClose} title="" size="lg">
      {/* Header interno */}
      <div className="rounded-2xl overflow-hidden mb-6 -mx-1" style={{ background: 'linear-gradient(135deg, #06112B 0%, #0D1F4E 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--brand-gold), transparent)' }} />
        <div className="p-6 flex gap-5 items-center">
          {m.photoURL ? (
            <img src={m.photoURL} alt={m.name} className="w-20 h-20 rounded-xl object-cover border-2 shrink-0" style={{ borderColor: 'var(--brand-gold)' }} />
          ) : (
            <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-black text-white shrink-0" style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid var(--brand-gold)' }}>
              {m.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--brand-gold)' }}>{m.role}</p>
            <h2 className="font-black text-white text-xl tracking-tight mb-1">{m.name}</h2>
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {m.location  && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.location}</span>}
              {m.yearsExp  && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.yearsExp} anos de exp.</span>}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all hover:opacity-80"
            style={{ background: 'rgba(196,154,42,0.2)', color: 'var(--brand-gold)', border: '1px solid rgba(196,154,42,0.3)' }}
          >
            <Pencil className="w-3 h-3" /> Editar
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Bio */}
        {m.bio && (
          <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>"{m.bio}"</p>
        )}

        {/* Seções estruturadas */}
        {structuredSections.length > 0 && (
          <div className="space-y-3">
            <SectionHeader label="Função na Develoi" />
            {structuredSections.map(({ icon: Icon, label, value, pub, list }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,31,78,0.08)' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: 'var(--brand-navy)' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-navy)' }}>{label}</span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                    style={pub
                      ? { background: 'rgba(34,197,94,0.12)', color: '#16a34a' }
                      : { background: 'rgba(99,102,241,0.12)', color: '#4f46e5' }
                    }
                  >
                    {pub ? <><Globe className="w-2.5 h-2.5" /> Público</> : <><Lock className="w-2.5 h-2.5" /> Interno</>}
                  </span>
                </div>
                {list ? (
                  <ul className="ml-8 space-y-1.5">
                    {parseList(value!).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--brand-gold)' }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-relaxed ml-8" style={{ color: 'var(--text-secondary)' }}>{value}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sobre a pessoa */}
        {aboutSections.length > 0 && (
          <div className="space-y-3">
            <SectionHeader label={`Sobre ${m.name.split(' ')[0]}`} />
            {aboutSections.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(196,154,42,0.12)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--brand-gold)' }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-navy)' }}>{label}</span>
                </div>
                <p className="text-sm leading-relaxed ml-8" style={{ color: 'var(--text-secondary)' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Redes */}
        {(m.linkedin || m.github || m.instagram) && (
          <div>
            <SectionHeader label="Redes Sociais" />
            <div className="flex flex-wrap gap-3 mt-3">
              {m.linkedin  && <SocialLink href={m.linkedin}  icon={Linkedin}  label="LinkedIn"  color="#0a66c2" />}
              {m.github    && <SocialLink href={m.github}    icon={Github}    label="GitHub"    color="#1f2937" />}
              {m.instagram && <SocialLink href={m.instagram} icon={Instagram} label="Instagram" color="#e1306c" />}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function SocialLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all"
      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.color = color; (e.currentTarget as HTMLElement).style.background = `${color}12`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon className="w-3.5 h-3.5" /> {label} <ExternalLink className="w-3 h-3 opacity-40" />
    </a>
  );
}

// ─── Modal de formulário ──────────────────────────────────────────────────────

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
    reader.onload = () => { onChange({ photoURL: reader.result as string }); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return (
    <Modal isOpen onClose={onClose} title={isNew ? 'Novo Talento' : 'Editar Talento'} size="xl">
      <div className="space-y-6">

        {/* Foto */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {form.photoURL ? (
              <img src={form.photoURL} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 shadow-sm" style={{ borderColor: 'var(--brand-gold)' }} />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-sm" style={{ background: 'var(--brand-navy)' }}>
                {form.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {form.photoURL && (
              <button onClick={() => onChange({ photoURL: '' })} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 shadow-md">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>Foto do Talento</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-[11px] font-black transition-all disabled:opacity-50 w-full justify-center"
              style={{ borderColor: 'var(--border-color)', color: 'var(--brand-navy)', background: 'var(--bg-tertiary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {uploading ? 'CARREGANDO...' : 'SELECIONAR FOTO'}
            </button>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Recomendado: imagem quadrada.</p>
          </div>
        </div>

        <Divider />

        {/* Identificação */}
        <FormSection icon={<Users className="w-3.5 h-3.5" />} label="Identificação" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Nome Completo *" placeholder="Ex: João Silva" value={form.name || ''} onChange={e => onChange({ name: e.target.value })} />
          <Input label="Cargo / Função *" placeholder="Ex: Desenvolvedor Sênior" value={form.role || ''} onChange={e => onChange({ role: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Localização" iconLeft={<MapPin className="w-4 h-4" />} placeholder="Ex: São Paulo, SP" value={form.location || ''} onChange={e => onChange({ location: e.target.value })} />
          <Input label="Anos de Experiência" iconLeft={<Calendar className="w-4 h-4" />} type="number" placeholder="Ex: 5" value={form.yearsExp?.toString() || ''} onChange={e => onChange({ yearsExp: e.target.value ? parseInt(e.target.value) : undefined })} />
        </div>

        <Divider />

        {/* Sobre */}
        <FormSection icon={<Star className="w-3.5 h-3.5" />} label="Sobre o Talento" />
        <Textarea label="Mini Bio" placeholder="Fale um pouco sobre o papel desse membro na Develoi..." value={form.bio || ''} onChange={e => onChange({ bio: e.target.value })} rows={3} />
        <Textarea label="Especialidades" placeholder="Ex: React, Node.js, UX Design..." value={form.specialty || ''} onChange={e => onChange({ specialty: e.target.value })} rows={2} />
        <Textarea label="Formação Acadêmica" placeholder="Ex: Bacharelado em Sistemas de Informação — UNESP (2019)" value={form.formation || ''} onChange={e => onChange({ formation: e.target.value })} rows={2} />

        <Divider />

        {/* Curiosidades */}
        <FormSection icon={<Heart className="w-3.5 h-3.5" />} label="Curiosidades & Personalidade" />
        <Textarea label="Curiosidades" placeholder="Ex: Fala 3 idiomas, já viajou para 12 países..." value={form.curiosities || ''} onChange={e => onChange({ curiosities: e.target.value })} rows={2} />
        <Textarea label="Hobbies e Interesses" placeholder="Ex: Fotografia, música, jogos de tabuleiro..." value={form.hobbies || ''} onChange={e => onChange({ hobbies: e.target.value })} rows={2} />

        <Divider />

        {/* Função na Develoi */}
        <FormSection icon={<Briefcase className="w-3.5 h-3.5" />} label="Função na Develoi" />
        <p className="text-[11px] font-medium -mt-2" style={{ color: 'var(--text-muted)' }}>
          Use o botão <Globe className="w-3 h-3 inline" style={{ color: '#16a34a' }} /> / <Lock className="w-3 h-3 inline" style={{ color: '#4f46e5' }} /> para definir se o campo aparece no site público ou fica somente interno.
        </p>

        <FieldWithToggle
          label="Missão na Develoi"
          icon={<Briefcase className="w-4 h-4" />}
          isPublic={form.missionPublic ?? true}
          onToggle={v => onChange({ missionPublic: v })}
          placeholder="Descreva a missão desse membro dentro da Develoi..."
          value={form.mission || ''}
          onChange={v => onChange({ mission: v })}
          rows={3}
        />

        <FieldWithToggle
          label="Principais Responsabilidades"
          icon={<ListChecks className="w-4 h-4" />}
          isPublic={form.responsibilitiesPublic ?? false}
          onToggle={v => onChange({ responsibilitiesPublic: v })}
          placeholder={"Uma por linha ou separadas por ponto-e-vírgula:\n- Desenvolver e executar estratégias de marketing\n- Produzir conteúdos para blog e YouTube"}
          value={form.responsibilities || ''}
          onChange={v => onChange({ responsibilities: v })}
          rows={5}
          hint="Cada linha ou item separado por ';' vira um tópico no perfil."
        />

        <FieldWithToggle
          label="Objetivo da Função"
          icon={<Flag className="w-4 h-4" />}
          isPublic={form.objectivesPublic ?? false}
          onToggle={v => onChange({ objectivesPublic: v })}
          placeholder="Descreva o objetivo principal dessa função para a empresa..."
          value={form.objectives || ''}
          onChange={v => onChange({ objectives: v })}
          rows={3}
        />

        <FieldWithToggle
          label="O que esperamos"
          icon={<Users className="w-4 h-4" />}
          isPublic={form.expectationsPublic ?? false}
          onToggle={v => onChange({ expectationsPublic: v })}
          placeholder="Ex: Proatividade, organização, foco em resultados..."
          value={form.expectations || ''}
          onChange={v => onChange({ expectations: v })}
          rows={2}
        />

        <FieldWithToggle
          label="Frase da Função"
          icon={<Quote className="w-4 h-4" />}
          isPublic={form.phrasePublic ?? true}
          onToggle={v => onChange({ phrasePublic: v })}
          placeholder='Ex: "Transformar tecnologia e relacionamento em oportunidades."'
          value={form.phrase || ''}
          onChange={v => onChange({ phrase: v })}
          rows={2}
        />

        <Divider />

        {/* Redes */}
        <FormSection icon={<Linkedin className="w-3.5 h-3.5" />} label="Redes Sociais" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Input label="LinkedIn"  iconLeft={<Linkedin className="w-4 h-4"  />} placeholder="https://linkedin.com/in/..." value={form.linkedin  || ''} onChange={e => onChange({ linkedin:  e.target.value })} />
          <Input label="GitHub"    iconLeft={<Github className="w-4 h-4"    />} placeholder="https://github.com/..."    value={form.github    || ''} onChange={e => onChange({ github:    e.target.value })} />
          <Input label="Instagram" iconLeft={<Instagram className="w-4 h-4" />} placeholder="https://instagram.com/..."  value={form.instagram || ''} onChange={e => onChange({ instagram: e.target.value })} />
        </div>

        {/* Botões */}
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

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-slate-100" />;
}

function FormSection({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--brand-gold)' }}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-navy)' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-navy)' }}>{label}</p>
  );
}

function FieldWithToggle({ label, icon, isPublic, onToggle, placeholder, value, onChange, rows, hint }: {
  label: string;
  icon: React.ReactNode;
  isPublic: boolean;
  onToggle: (v: boolean) => void;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: isPublic ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.25)' }}>
      {/* Header do campo */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: isPublic ? 'rgba(34,197,94,0.06)' : 'rgba(99,102,241,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: isPublic ? '#16a34a' : '#4f46e5' }}>{icon}</span>
          <span className="text-[11px] font-black" style={{ color: 'var(--brand-navy)' }}>{label}</span>
        </div>
        {/* Toggle */}
        <button
          type="button"
          onClick={() => onToggle(!isPublic)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          style={isPublic
            ? { background: 'rgba(34,197,94,0.15)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }
            : { background: 'rgba(99,102,241,0.15)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.25)' }
          }
        >
          {isPublic
            ? <><Globe  className="w-3 h-3" /> Público</>
            : <><Lock   className="w-3 h-3" /> Interno</>
          }
        </button>
      </div>
      {/* Textarea */}
      <div className="p-3">
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows ?? 3}
          className="w-full resize-none text-sm leading-relaxed rounded-xl p-3 outline-none transition-all"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,154,42,0.4)'; }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
        />
        {hint && <p className="text-[10px] mt-1 ml-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
    </div>
  );
}
