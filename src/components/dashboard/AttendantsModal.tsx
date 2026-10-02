import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button, Modal, ConfirmModal, Input } from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';

interface Sector { id: string; name: string; menuKey: string; description?: string | null; isActive: boolean; sortOrder: number; attendants: string }
interface Person { phone: string; name: string; available: boolean; sectorIds: string[] }

const digits = (v: string) => String(v || '').replace(/\D/g, '');
const same = (a: string, b: string) => digits(a).length >= 8 && digits(a).slice(-8) === digits(b).slice(-8);

function parseList(json: string): { name: string; phone: string; available?: boolean }[] {
  try { const a = JSON.parse(json || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}

function formatPhone(p: string) {
  const d = digits(p), n = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return p;
}

// Atendentes ficam dentro de cada setor; aqui eles são geridos como pessoas (um atendente pode estar em vários setores)
export function AttendantsModal({ onClose }: { onClose: () => void }) {
  const { show: toast } = useToast();
  const { isDark } = useTheme();
  const text = isDark ? '#fff' : '#0D1F4E';

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ original: Person | null } | null>(null);
  const [form, setForm] = useState<Person>({ name: '', phone: '', available: true, sectorIds: [] });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Person | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/bot/sectors');
      const d = await r.json();
      setSectors(Array.isArray(d) ? d : []);
    } catch { toast('Não deu para carregar a equipe.', 'error'); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const people = useMemo<Person[]>(() => {
    const map = new Map<string, Person>();
    sectors.forEach(sec => parseList(sec.attendants).forEach(a => {
      const key = digits(a.phone).slice(-8);
      if (!key) return;
      const p = map.get(key) ?? { name: a.name, phone: a.phone, available: a.available !== false, sectorIds: [] };
      p.sectorIds.push(sec.id);
      map.set(key, p);
    }));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [sectors]);

  // Grava a pessoa em todos os setores marcados (e tira dos desmarcados)
  async function persist(original: Person | null, next: Person | null) {
    const calls: Promise<Response>[] = [];
    for (const sec of sectors) {
      const current = parseList(sec.attendants);
      let list = current.filter(a => !(original && same(a.phone, original.phone)) && !(next && same(a.phone, next.phone)));
      if (next && next.sectorIds.includes(sec.id)) list = [...list, { name: next.name.trim(), phone: digits(next.phone), available: next.available }];
      if (JSON.stringify(list) === JSON.stringify(current)) continue;
      calls.push(fetch('/api/admin/bot/sectors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sec.id, name: sec.name, menuKey: sec.menuKey, description: sec.description, attendants: list, isActive: sec.isActive, sortOrder: sec.sortOrder }),
      }));
    }
    const results = await Promise.all(calls);
    if (results.some(r => !r.ok)) throw new Error('Erro ao salvar');
    await load();
  }

  const startEdit = (p: Person | null) => {
    setForm(p ? { ...p } : { name: '', phone: '', available: true, sectorIds: sectors.filter(s => s.isActive).map(s => s.id).slice(0, 1) });
    setEditing({ original: p });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (digits(form.phone).length < 10) return toast('Informe o WhatsApp com DDD.', 'warning');
    if (form.sectorIds.length === 0) return toast('Marque ao menos um setor.', 'warning');
    setSaving(true);
    try {
      await persist(editing!.original, form);
      toast(editing!.original ? 'Atendente atualizado' : 'Atendente adicionado', 'success');
      setEditing(null);
    } catch { toast('Não deu para salvar agora.', 'error'); } finally { setSaving(false); }
  };

  const toggleAvailable = async (p: Person) => {
    try { await persist(p, { ...p, available: !p.available }); } catch { toast('Não deu para alterar agora.', 'error'); }
  };

  const remove = async () => {
    if (!deleting) return;
    try { await persist(deleting, null); toast('Atendente removido', 'success'); } catch { toast('Não deu para remover agora.', 'error'); }
    finally { setDeleting(null); }
  };

  const toggleSector = (id: string) => setForm(f => ({ ...f, sectorIds: f.sectorIds.includes(id) ? f.sectorIds.filter(x => x !== id) : [...f.sectorIds, id] }));

  return (
    <>
      <Modal isOpen onClose={onClose} title="Equipe de atendimento" size="lg"
        footer={editing ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit" form="attendant-form" loading={saving} fullWidth size="lg">{editing.original ? 'SALVAR' : 'ADICIONAR ATENDENTE'}</Button>
          </div>
        ) : <Button fullWidth variant="outline" onClick={onClose}>Fechar</Button>}>
        {loading ? <p className="text-center py-8 text-slate-400">Carregando…</p> : editing ? (
          <form id="attendant-form" onSubmit={save} className="space-y-4">
            <Input label="Nome" required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Karen" />
            <Input label="WhatsApp (com DDD)" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(15) 99999-9999" />
            <div>
              <label className="ds-label">Em quais setores atende?</label>
              {sectors.length === 0 ? <p className="text-xs text-slate-400 mt-1">Crie os setores primeiro em <b>Bot de Atendimento</b>.</p> : (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {sectors.map(sec => (
                    <button type="button" key={sec.id} onClick={() => toggleSector(sec.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${form.sectorIds.includes(sec.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                      {sec.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
              Disponível para receber atendimentos
            </label>
            <p className="text-[11px] text-slate-400">Os novos atendimentos do setor chegam no WhatsApp deste número. O atendente responde <b>1</b> para aceitar ou <b>2</b> para recusar e conversa com o cliente através do bot. <b>&amp;sair</b> encerra.</p>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">Quem recebe e responde os atendimentos. Um atendente pode estar em mais de um setor.</p>
              <Button size="sm" iconLeft={<Plus className="w-4 h-4" />} disabled={sectors.length === 0} onClick={() => startEdit(null)}>ADICIONAR</Button>
            </div>
            {sectors.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Nenhum setor ainda. Crie em <b>Bot de Atendimento → Atualizar menu do bot</b>.</p>}
            {sectors.length > 0 && people.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Nenhum atendente cadastrado.</p>}
            <div className="space-y-2">
              {people.map(p => (
                <div key={p.phone} className={`flex items-center gap-3 rounded-xl border border-slate-200/70 dark:border-white/10 px-3 py-2.5 ${p.available ? '' : 'opacity-60'}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">{p.name.trim()[0]?.toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: text }}>{p.name}</p>
                    <p className="text-xs text-slate-400">{formatPhone(p.phone)} · {p.sectorIds.map(id => sectors.find(s => s.id === id)?.name).filter(Boolean).join(', ')}</p>
                  </div>
                  <button onClick={() => toggleAvailable(p)} title={p.available ? 'Marcar como ausente' : 'Marcar como disponível'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${p.available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.available ? <><UserCheck className="w-3 h-3" /> DISPONÍVEL</> : <><UserX className="w-3 h-3" /> AUSENTE</>}
                  </button>
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700" aria-label="Editar"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleting(p)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600" aria-label="Remover"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} title="Remover atendente"
        message={`${deleting?.name ?? 'Este atendente'} deixa de receber atendimentos em todos os setores.`} confirmLabel="REMOVER" variant="danger" />
    </>
  );
}
