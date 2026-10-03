import { useCallback, useEffect, useState } from 'react';
import { Brain, Plus, Trash2, Pencil, FlaskConical, HelpCircle, X } from 'lucide-react';
import { Button, PanelCard, Input, Select, Textarea, Modal } from '../ui';
import { toast } from 'react-hot-toast';

interface Kb {
  id: string; title: string; system: string | null; phrases: string[]; keywords: [string, number][];
  answer: string; action: string; followUp: string | null; priority: number; enabled: boolean; hits: number;
}
interface Unknown { id: string; text: string; intentId: string | null; confidence: number; outcome: string; createdAt: string }
interface TestResult {
  decision: 'act' | 'ask' | 'none'; confidence: number; greetingOnly: boolean;
  intent: { id: string; label: string; action: string; custom: boolean } | null;
  candidates: { id: string; label: string; score: number }[];
  entities: Record<string, string | number>; mood: { angry: boolean; urgent: boolean; polite: boolean }; reply: string | null;
}

const ACTIONS = [
  { value: 'reply', label: 'Só responder' },
  { value: 'menu', label: 'Responder e mostrar o menu' },
  { value: 'support', label: 'Responder e abrir suporte' },
  { value: 'handoff:Comercial', label: 'Responder e chamar o Comercial' },
  { value: 'handoff:Financeiro', label: 'Responder e chamar o Financeiro' },
  { value: 'handoff:Suporte', label: 'Responder e chamar o Suporte' },
];

const EMPTY: Omit<Kb, 'id' | 'hits'> = { title: '', system: '', phrases: [], keywords: [], answer: '', action: 'reply', followUp: '', priority: 5, enabled: true };

// "Inteligência do bot": o que ele entende, o que responde e o que ainda não entendeu
export function BotIntelligence() {
  const [rows, setRows] = useState<Kb[]>([]);
  const [unknown, setUnknown] = useState<Unknown[]>([]);
  const [editing, setEditing] = useState<(Partial<Kb> & { phrasesText: string; keywordsText: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [testText, setTestText] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([fetch('/api/admin/bot/kb').then(r => r.json()), fetch('/api/admin/bot/nlu/unknown').then(r => r.json())]);
      setRows(Array.isArray(a) ? a : []);
      setUnknown(Array.isArray(b) ? b : []);
    } catch { /* tela segue vazia */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = (row?: Kb, seed?: string) => setEditing({
    ...(row ?? EMPTY), id: row?.id,
    phrasesText: row ? row.phrases.join('\n') : (seed ?? ''),
    keywordsText: row ? row.keywords.map(k => k[0]).join(', ') : '',
  });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const body = {
        title: editing.title, system: editing.system || null, answer: editing.answer, action: editing.action,
        followUp: editing.followUp || null, priority: editing.priority, enabled: editing.enabled !== false,
        phrases: editing.phrasesText.split('\n').map(x => x.trim()).filter(Boolean),
        keywords: editing.keywordsText.split(',').map(x => x.trim()).filter(Boolean).map(w => [w, 2]),
      };
      const res = await fetch(editing.id ? `/api/admin/bot/kb/${editing.id}` : '/api/admin/bot/kb', {
        method: editing.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Erro ao salvar');
      toast.success('Resposta salva. O bot aprende em até 1 minuto.');
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const toggle = async (r: Kb) => {
    await fetch(`/api/admin/bot/kb/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...r, enabled: !r.enabled }) });
    load();
  };
  const remove = async (r: Kb) => {
    if (!confirm(`Apagar "${r.title}"?`)) return;
    await fetch(`/api/admin/bot/kb/${r.id}`, { method: 'DELETE' });
    load();
  };

  const test = async () => {
    if (!testText.trim()) return;
    setTesting(true);
    try {
      const res = await fetch('/api/admin/bot/nlu/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: testText }) });
      setResult(await res.json());
    } catch { toast.error('Não consegui testar agora.'); }
    setTesting(false);
  };

  const dismiss = async (u: Unknown) => { await fetch(`/api/admin/bot/nlu/unknown/${u.id}/dismiss`, { method: 'POST' }); load(); };

  return (
    <PanelCard title="Inteligência do bot" icon={Brain}>
      <div className="space-y-6">
        <p className="text-xs dash-text-muted">
          O bot entende mensagens livres (com erros de digitação, gírias e abreviações), responde com variações e age: manda a fatura, o extrato, abre suporte ou chama a equipe.
          Aqui você ensina novas respostas sobre os seus sistemas. Tudo é nosso, sem IA externa.
        </p>

        {/* Simulador */}
        <div className="rounded-xl border dash-border p-4 space-y-3">
          <p className="text-sm font-bold dash-text flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Testar o bot</p>
          <div className="flex gap-2">
            <div className="flex-1"><Input value={testText} onChange={(e: any) => setTestText(e.target.value)} placeholder='Escreva como um cliente, ex.: "qdo vence minha fatura?"' onKeyDown={(e: any) => e.key === 'Enter' && test()} /></div>
            <Button onClick={test} loading={testing}>TESTAR</Button>
          </div>
          {result && (
            <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-3 text-sm space-y-2">
              {result.greetingOnly ? <p>É só uma saudação: o bot responde com o menu.</p> : result.intent ? (
                <>
                  <p><b>{result.intent.label}</b> <span className="text-xs text-slate-400">· {result.confidence}% de certeza · {result.decision === 'act' ? 'age' : result.decision === 'ask' ? 'pergunta "você quis dizer…?"' : 'não entende'}</span></p>
                  {result.reply && <p className="rounded-lg bg-white dark:bg-black/20 p-2.5 whitespace-pre-wrap">{result.reply}</p>}
                  <p className="text-xs text-slate-400">Ação: {result.intent.action}{result.entities.system ? ` · sistema: ${result.entities.system}` : ''}{result.entities.document ? ` · documento: ${result.entities.document}` : ''}{result.mood.angry ? ' · cliente irritado' : ''}{result.mood.urgent ? ' · urgente' : ''}</p>
                  {result.candidates.length > 1 && <p className="text-xs text-slate-400">Outras possibilidades: {result.candidates.slice(1).map(c => `${c.label} (${c.score}%)`).join(', ')}</p>}
                </>
              ) : <p>O bot <b>não entenderia</b> essa mensagem — vale ensinar uma resposta abaixo.</p>}
            </div>
          )}
        </div>

        {/* Não entendidas */}
        {unknown.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-500/5 p-4 space-y-2">
            <p className="text-sm font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300"><HelpCircle className="w-4 h-4" /> O que o bot não entendeu</p>
            {unknown.slice(0, 8).map(u => (
              <div key={u.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">“{u.text}” <span className="text-[11px] text-slate-400">{u.outcome === 'ask' ? 'ficou em dúvida' : 'não entendeu'}</span></span>
                <button className="text-xs font-bold text-indigo-600 hover:underline" onClick={() => open(undefined, u.text)}>Ensinar</button>
                <button className="text-slate-400 hover:text-slate-600" onClick={() => dismiss(u)} aria-label="Ignorar"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Base de conhecimento */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold dash-text">Respostas sobre os sistemas</p>
            <Button size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={() => open()}>NOVA RESPOSTA</Button>
          </div>
          {rows.length === 0 && <p className="text-xs dash-text-muted">Nenhuma resposta ainda. As respostas iniciais são criadas quando o bot reinicia.</p>}
          <div className="divide-y dash-border rounded-xl border dash-border overflow-hidden">
            {rows.map(r => (
              <div key={r.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${r.enabled ? '' : 'opacity-50'}`}>
                <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={r.enabled} onChange={() => toggle(r)} aria-label="Ativa" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold dash-text truncate">{r.title}</p>
                  <p className="text-[11px] dash-text-muted truncate">{r.system ? `${r.system} · ` : ''}{r.phrases.length} frase(s) · usada {r.hits}x</p>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-indigo-600" onClick={() => open(r)} aria-label="Editar"><Pencil className="w-4 h-4" /></button>
                <button className="p-1.5 text-slate-400 hover:text-red-500" onClick={() => remove(r)} aria-label="Apagar"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <Modal isOpen onClose={() => setEditing(null)} title={editing.id ? 'Editar resposta' : 'Nova resposta'} size="lg"
          footer={<div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button fullWidth size="lg" loading={saving} onClick={save}>SALVAR</Button></div>}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Título (só para você)" value={editing.title ?? ''} onChange={(e: any) => setEditing({ ...editing, title: e.target.value })} placeholder="Ex.: Quanto custa o Plaelo" />
              <Input label="Sistema (opcional)" value={editing.system ?? ''} onChange={(e: any) => setEditing({ ...editing, system: e.target.value })} placeholder="Ex.: Store BoxSys" />
            </div>
            <Textarea label="Como o cliente pergunta (uma frase por linha)" rows={5} value={editing.phrasesText}
              onChange={(e: any) => setEditing({ ...editing, phrasesText: e.target.value })} placeholder={'tem nota fiscal\nemite nfe\nvcs fazem nota fiscal'} />
            <Input label="Palavras importantes (opcional, separadas por vírgula)" value={editing.keywordsText} onChange={(e: any) => setEditing({ ...editing, keywordsText: e.target.value })} placeholder="nota fiscal, nfe" />
            <Textarea label="Resposta" rows={6} value={editing.answer ?? ''} onChange={(e: any) => setEditing({ ...editing, answer: e.target.value })}
              placeholder={'Escreva como falaria com o cliente. Use *negrito* e emojis.\nPara variar o jeito de responder, separe versões com uma linha só com ---'} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Depois de responder" value={editing.action ?? 'reply'} onChange={(e: any) => setEditing({ ...editing, action: e.target.value })} options={ACTIONS} />
              <Input label="Pergunta de continuidade (opcional)" value={editing.followUp ?? ''} onChange={(e: any) => setEditing({ ...editing, followUp: e.target.value })} placeholder="Quer testar grátis por 14 dias?" />
            </div>
            <p className="text-[11px] dash-text-muted">Pode usar {'{{nome}}'} (primeiro nome do cliente) e {'{{saudacao}}'} (bom dia, boa tarde, boa noite) no texto.</p>
          </div>
        </Modal>
      )}
    </PanelCard>
  );
}
