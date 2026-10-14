import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Eye, EyeOff, KeyRound, Loader2, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { Button, Input, Textarea } from '../ui';
import type { ProjectAccess } from './types';

type Draft = { label: string; url: string; username: string; password: string; notes: string };
const emptyDraft: Draft = { label: '', url: '', username: '', password: '', notes: '' };

export function ProjectAccessVault({ projectId }: { projectId: string }) {
  const [accesses, setAccesses] = useState<ProjectAccess[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/accesses`);
      if (!response.ok) throw new Error();
      setAccesses(await response.json());
    } catch {
      setError('Não foi possível carregar os acessos deste projeto.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [projectId]);

  const resetForm = () => { setDraft(emptyDraft); setEditingId(null); setShowForm(false); setError(''); };
  const change = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.label.trim()) return setError('Informe o nome do acesso.');
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editingId ? `/api/projects/${projectId}/accesses/${editingId}` : `/api/projects/${projectId}/accesses`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || 'Não foi possível salvar.');
      setAccesses(current => editingId ? current.map(item => item.id === editingId ? saved : item) : [...current, saved]);
      resetForm();
    } catch (e: any) {
      setError(e.message || 'Não foi possível salvar o acesso.');
    } finally { setSaving(false); }
  };

  const edit = (access: ProjectAccess) => {
    setDraft({ label: access.label, url: access.url ?? '', username: access.username ?? '', password: access.password ?? '', notes: access.notes ?? '' });
    setEditingId(access.id);
    setShowForm(true);
    setError('');
  };

  const remove = async (access: ProjectAccess) => {
    if (!window.confirm(`Remover o acesso “${access.label}”?`)) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/accesses/${access.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setAccesses(current => current.filter(item => item.id !== access.id));
    } catch { setError('Não foi possível remover o acesso.'); }
  };

  const copy = async (value: string | null | undefined) => {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); } catch { setError('Não foi possível copiar.'); }
  };

  return (
    <section className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: 'rgba(13,31,78,0.08)', boxShadow: '0 2px 12px rgba(13,31,78,0.04)' }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-6 py-4 border-b" style={{ borderColor: 'rgba(13,31,78,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}><KeyRound className="w-4 h-4 text-violet-600" /></div>
          <div><p className="text-sm font-black text-[#0D1F4E]">Acessos do projeto</p><p className="text-[11px] text-slate-400">Logins, links e credenciais compartilhadas da equipe.</p></div>
        </div>
        <Button type="button" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={() => { resetForm(); setShowForm(true); }}>NOVO ACESSO</Button>
      </div>

      <div className="p-5 sm:p-6 space-y-3">
        {showForm && (
          <form onSubmit={save} className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-violet-900">{editingId ? 'Editar acesso' : 'Novo acesso'}</p><button type="button" onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-slate-700">Cancelar</button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nome" required value={draft.label} onChange={e => change('label', e.target.value)} placeholder="Ex.: Painel de hospedagem" />
              <Input label="Link" value={draft.url} onChange={e => change('url', e.target.value)} placeholder="https://..." />
              <Input label="Usuário / e-mail" value={draft.username} onChange={e => change('username', e.target.value)} placeholder="contato@empresa.com" />
              <Input label="Senha" type="password" value={draft.password} onChange={e => change('password', e.target.value)} placeholder="Opcional" />
            </div>
            <Textarea label="Observações" value={draft.notes} onChange={e => change('notes', e.target.value)} rows={2} placeholder="Ex.: 2FA no celular do cliente" />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <Button type="submit" size="sm" loading={saving}>{editingId ? 'SALVAR ACESSO' : 'ADICIONAR ACESSO'}</Button>
          </form>
        )}

        {loading ? <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div> : accesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center"><KeyRound className="w-5 h-5 mx-auto mb-2 text-slate-300" /><p className="text-xs font-bold text-slate-500">Nenhum acesso cadastrado</p><p className="text-[11px] text-slate-400 mt-1">Guarde aqui os acessos importantes deste projeto.</p></div>
        ) : accesses.map(access => {
          const isRevealed = !!revealed[access.id];
          return <div key={access.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-start gap-3"><div className="mt-0.5 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center"><KeyRound className="w-4 h-4 text-violet-500" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-black text-[#0D1F4E] truncate">{access.label}</p>{access.url && <a href={access.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-[11px] text-indigo-600 hover:underline truncate"><ExternalLink className="w-3 h-3 flex-shrink-0" />{access.url}</a>}</div><div className="flex gap-1"><button type="button" onClick={() => edit(access)} className="p-1.5 text-slate-400 hover:text-indigo-600" aria-label={`Editar ${access.label}`}><Pencil className="w-3.5 h-3.5" /></button><button type="button" onClick={() => void remove(access)} className="p-1.5 text-slate-400 hover:text-rose-600" aria-label={`Remover ${access.label}`}><Trash2 className="w-3.5 h-3.5" /></button></div></div>
              {access.username && <Credential icon={UserRound} label="Usuário" value={access.username} onCopy={() => void copy(access.username)} />}
              {access.password && <Credential icon={KeyRound} label="Senha" value={isRevealed ? access.password : '••••••••••'} onCopy={() => copy(access.password)} action={<button type="button" onClick={() => setRevealed(current => ({ ...current, [access.id]: !isRevealed }))} className="p-1 text-slate-400 hover:text-violet-600" aria-label={isRevealed ? 'Ocultar senha' : 'Mostrar senha'}>{isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>} />}
              {access.notes && <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{access.notes}</p>}
            </div></div>
          </div>;
        })}
        {!showForm && error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </section>
  );
}

function Credential({ icon: Icon, label, value, onCopy, action }: { icon: any; label: string; value: string; onCopy: () => void; action?: React.ReactNode }) {
  return <div className="mt-2 flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-2.5 py-1.5"><Icon className="w-3.5 h-3.5 text-slate-400" /><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{value}</span>{action}<button type="button" onClick={onCopy} className="p-1 text-slate-400 hover:text-indigo-600" aria-label={`Copiar ${label}`}><Copy className="w-3.5 h-3.5" /></button></div>;
}
