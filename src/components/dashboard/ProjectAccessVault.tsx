import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Eye, EyeOff, KeyRound, Loader2, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { Button, EmptyState, IconButton, Input, PanelCard, Textarea } from '../ui';
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
    <PanelCard
      icon={KeyRound}
      title="Acessos do projeto"
      description="Logins, links e credenciais compartilhadas da equipe."
      action={<Button type="button" size="xs" iconLeft={<Plus size={12} />} onClick={() => { resetForm(); setShowForm(true); }}>Novo acesso</Button>}
      contentClassName="space-y-3"
    >
        {showForm && (
          <form onSubmit={save} className="space-y-3 rounded-lg border border-violet-100 bg-violet-50/40 p-3 dark:border-violet-500/20 dark:bg-violet-500/5">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-violet-900 dark:text-violet-300">{editingId ? 'Editar acesso' : 'Novo acesso'}</p><Button type="button" size="xs" variant="ghost" onClick={resetForm}>Cancelar</Button></div>
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

        {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-violet-500" /></div> : accesses.length === 0 ? (
          <EmptyState icon={KeyRound} title="Nenhum acesso cadastrado" description="Guarde aqui os acessos importantes deste projeto." />
        ) : accesses.map(access => {
          const isRevealed = !!revealed[access.id];
          return <div key={access.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white dark:border-white/10 dark:bg-white/5"><KeyRound className="h-4 w-4 text-violet-500" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-black text-[#0D1F4E] dark:text-white">{access.label}</p>{access.url && <a href={access.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"><ExternalLink className="h-3 w-3 flex-shrink-0" />{access.url}</a>}</div><div className="flex gap-1"><IconButton type="button" size="xs" onClick={() => edit(access)} aria-label={`Editar ${access.label}`}><Pencil size={13} /></IconButton><IconButton type="button" size="xs" variant="danger" onClick={() => void remove(access)} aria-label={`Remover ${access.label}`}><Trash2 size={13} /></IconButton></div></div>
              {access.username && <Credential icon={UserRound} label="Usuário" value={access.username} onCopy={() => void copy(access.username)} />}
              {access.password && <Credential icon={KeyRound} label="Senha" value={isRevealed ? access.password : '••••••••••'} onCopy={() => copy(access.password)} action={<IconButton type="button" size="xs" onClick={() => setRevealed(current => ({ ...current, [access.id]: !isRevealed }))} aria-label={isRevealed ? 'Ocultar senha' : 'Mostrar senha'}>{isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}</IconButton>} />}
              {access.notes && <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{access.notes}</p>}
            </div></div>
          </div>;
        })}
        {!showForm && error && <p className="text-xs text-rose-600">{error}</p>}
    </PanelCard>
  );
}

function Credential({ icon: Icon, label, value, onCopy, action }: { icon: any; label: string; value: string; onCopy: () => void; action?: React.ReactNode }) {
  return <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-white/5"><Icon className="h-3.5 w-3.5 text-slate-400" /><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-white/70">{value}</span>{action}<IconButton type="button" size="xs" onClick={onCopy} aria-label={`Copiar ${label}`}><Copy size={13} /></IconButton></div>;
}
