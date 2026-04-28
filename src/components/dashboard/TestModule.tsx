import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck, CheckCircle2, AlertCircle, Clock, ClipboardCheck,
  Plus, X, Check, RotateCcw, Camera, MessageSquare, ChevronDown,
  ChevronRight, Circle, XCircle, Loader2, Trash2, FileText,
  AlertTriangle, Eye, Edit2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StatGrid, StatCard, EmptyState, Button, Badge, Modal, Input, Textarea, Select } from '../ui';
import type { Feature } from './types';
import { cn } from '../../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestCase {
  id: string;
  title: string;
  steps: string;
  expected: string;
  result: 'pending' | 'pass' | 'fail';
  evidence?: string;
  notes?: string;
  executedAt?: string;
  executedBy?: string;
}

interface TestSession {
  featureId: string;
  cases: TestCase[];
  evidence: string;
  observations: string;
  verdict: 'pending' | 'approved' | 'rejected';
  testerName: string;
  testedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseCases(raw?: string | null): TestCase[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ─── TestModule ───────────────────────────────────────────────────────────────

export function TestModule({ projectId }: { projectId: string }) {
  const { profile } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const [tab, setTab] = useState<'pending' | 'done'>('pending');

  const isTester = profile?.role === 'admin' || profile?.role === 'tester' || profile?.role === 'tech';
  const isAdmin  = profile?.role === 'admin' || profile?.email?.toLowerCase() === 'admin@develoi.com.br' || profile?.email?.toLowerCase() === 'edueloi.ee@gmail.com';

  const fetchFeatures = async () => {
    try {
      const r = await fetch(`/api/projects/${projectId}/features`);
      const data = await r.json();
      setFeatures(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchFeatures();
    const t = setInterval(fetchFeatures, 8000);
    return () => clearInterval(t);
  }, [projectId]);

  const pending = features.filter(f => f.status === 'testing');
  const done    = features.filter(f => f.status === 'done' && f.isValidated);
  const today   = features.filter(f => {
    if (!f.isValidated) return false;
    // crude check — treat all done-validated as possibly today (server doesn't return date)
    return f.status === 'done';
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard title="Aguardando Teste" value={pending.length} icon={Clock}       color="warning" delay={0.1} />
        <StatCard title="Aprovados"        value={done.length}    icon={CheckCircle2} color="success" delay={0.2} />
        <StatCard title="Taxa de Aprovação"
          value={done.length + pending.length > 0
            ? `${Math.round((done.length / (done.length + pending.length)) * 100)}%`
            : '—'}
          icon={ShieldCheck} color="info" delay={0.3}
        />
      </StatGrid>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {(['pending', 'done'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'pending' ? `Pendentes (${pending.length})` : `Validados (${done.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Tudo em conformidade"
            description="Nenhuma funcionalidade aguarda teste no momento." className="py-24" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pending.map((f, i) => (
              <TestCard
                key={f.id}
                feature={f}
                index={i}
                isTester={isTester}
                onOpen={() => setActiveFeature(f)}
              />
            ))}
          </div>
        )
      )}

      {tab === 'done' && (
        done.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nenhum item validado ainda" description="" className="py-24" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {done.map((f, i) => (
              <DoneCard key={f.id} feature={f} index={i} onOpen={() => setActiveFeature(f)} />
            ))}
          </div>
        )
      )}

      {/* Test execution modal */}
      {activeFeature && (
        <TestExecutionModal
          feature={activeFeature}
          projectId={projectId}
          profile={profile}
          isTester={isTester}
          isAdmin={isAdmin}
          onClose={() => setActiveFeature(null)}
          onRefresh={fetchFeatures}
        />
      )}
    </motion.div>
  );
}

// ─── TestCard (pending) ───────────────────────────────────────────────────────

function TestCard({ feature, index, isTester, onOpen }: {
  feature: Feature; index: number; isTester: boolean; onOpen: () => void;
}) {
  const cases = parseCases((feature as any).testCases);
  const passed = cases.filter(c => c.result === 'pass').length;
  const failed = cases.filter(c => c.result === 'fail').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[2rem] border border-amber-200 shadow-sm hover:shadow-xl hover:shadow-amber-50 transition-all overflow-hidden"
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-slate-900 text-sm truncate">{feature.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="warning" pill size="sm" dot>Em Teste</Badge>
              {feature.key && <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{feature.key}</span>}
              <span className="text-[10px] font-bold text-slate-400 uppercase">{feature.type}</span>
            </div>
          </div>
        </div>

        {/* Test cases progress */}
        {cases.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Casos de Teste</span>
              <span className="text-[10px] font-black text-slate-600">{passed}/{cases.length} ok</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
              {cases.map((c, i) => (
                <div
                  key={i}
                  className={cn('flex-1 rounded-full transition-colors',
                    c.result === 'pass' ? 'bg-emerald-500' :
                    c.result === 'fail' ? 'bg-rose-500' : 'bg-slate-200'
                  )}
                />
              ))}
            </div>
            <div className="flex gap-3 text-[10px] font-bold">
              <span className="text-emerald-600">{passed} passou</span>
              {failed > 0 && <span className="text-rose-500">{failed} falhou</span>}
              <span className="text-slate-400">{cases.filter(c => c.result === 'pending').length} pendente</span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-bold text-amber-700">Nenhum caso de teste criado ainda.</p>
          </div>
        )}

        <Button
          onClick={onOpen}
          fullWidth
          variant={isTester ? 'primary' : 'outline'}
          iconLeft={isTester ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        >
          {isTester ? 'EXECUTAR TESTES' : 'VER DETALHES'}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── DoneCard (validated) ─────────────────────────────────────────────────────

function DoneCard({ feature, index, onOpen }: { feature: Feature; index: number; onOpen: () => void }) {
  const cases = parseCases((feature as any).testCases);
  const passed = cases.filter(c => c.result === 'pass').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[2rem] border border-emerald-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all"
      onClick={onOpen}
    >
      <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
      <div className="p-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 text-sm truncate">{feature.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="success" pill size="sm">Aprovado</Badge>
            {feature.validatedBy && <span className="text-[10px] text-slate-400 font-bold">por {feature.validatedBy}</span>}
          </div>
        </div>
        {cases.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs font-black text-emerald-600">{passed}/{cases.length}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase">casos ok</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── TestExecutionModal ───────────────────────────────────────────────────────

function TestExecutionModal({ feature, projectId, profile, isTester, isAdmin, onClose, onRefresh }: {
  feature: Feature; projectId: string; profile: any; isTester: boolean; isAdmin: boolean;
  onClose: () => void; onRefresh: () => void;
}) {
  const [cases, setCases] = useState<TestCase[]>(parseCases((feature as any).testCases));
  const [globalEvidence, setGlobalEvidence] = useState((feature as any).testEvidence || '');
  const [globalObs, setGlobalObs] = useState((feature as any).testObservations || '');
  const [addingCase, setAddingCase] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const canEdit = isTester || isAdmin;
  const allExecuted = cases.length > 0 && cases.every(c => c.result !== 'pending');
  const anyFailed   = cases.some(c => c.result === 'fail');
  const allPassed   = cases.length > 0 && cases.every(c => c.result === 'pass');

  const saveCases = async (newCases: TestCase[]) => {
    await fetch(`/api/projects/${projectId}/features/${feature.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testCases: JSON.stringify(newCases) }),
    });
  };

  const updateCase = (id: string, patch: Partial<TestCase>) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const handleSaveCase = async (id: string, patch: Partial<TestCase>) => {
    const updated = cases.map(c => c.id === id ? { ...c, ...patch } : c);
    setCases(updated);
    await saveCases(updated);
  };

  const handleAddCase = async (newCase: Omit<TestCase, 'id' | 'result'>) => {
    const full: TestCase = { ...newCase, id: uuidv4(), result: 'pending' };
    const updated = [...cases, full];
    setCases(updated);
    await saveCases(updated);
    setAddingCase(false);
  };

  const handleDeleteCase = async (id: string) => {
    const updated = cases.filter(c => c.id !== id);
    setCases(updated);
    await saveCases(updated);
  };

  const handleExecuteCase = async (id: string, result: 'pass' | 'fail', notes: string, evidence: string) => {
    const patch: Partial<TestCase> = {
      result,
      notes,
      evidence,
      executedAt: new Date().toISOString(),
      executedBy: profile?.displayName || profile?.email,
    };
    await handleSaveCase(id, patch);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${projectId}/features/${feature.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'done',
          isValidated: 1,
          validatedBy: profile?.displayName || profile?.email,
          testCases: JSON.stringify(cases),
          testEvidence: globalEvidence,
          testObservations: globalObs,
        }),
      });
      onRefresh();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${projectId}/features/${feature.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'review',
          isValidated: 0,
          testCases: JSON.stringify(cases),
          testEvidence: globalEvidence,
          testObservations: `REJEITADO: ${rejectReason}\n\n${globalObs}`,
        }),
      });
      onRefresh();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const passed  = cases.filter(c => c.result === 'pass').length;
  const failed  = cases.filter(c => c.result === 'fail').length;
  const pending = cases.filter(c => c.result === 'pending').length;

  return (
    <Modal isOpen={true} onClose={onClose} title="" size="xl">
      <div className="flex flex-col" style={{ maxHeight: '85vh' }}>

        {/* Modal header */}
        <div className="flex items-start gap-4 mb-6 flex-shrink-0">
          <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900 truncate">{feature.title}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {feature.key && <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{feature.key}</span>}
              <Badge color="warning" pill size="sm" dot>Em Teste</Badge>
              {feature.type && <Badge color="default" size="sm">{feature.type}</Badge>}
            </div>
          </div>
          {/* Progress pills */}
          <div className="flex gap-2 shrink-0">
            {passed  > 0 && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg">{passed} ✓</span>}
            {failed  > 0 && <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg">{failed} ✗</span>}
            {pending > 0 && <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg">{pending} ○</span>}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">

          {/* Description */}
          {feature.description && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Descrição</p>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          )}

          {/* Test Cases Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Casos de Teste</h3>
                <Badge color="default" size="sm">{cases.length}</Badge>
              </div>
              {canEdit && (
                <button
                  onClick={() => setAddingCase(true)}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo Caso
                </button>
              )}
            </div>

            {/* Add case form */}
            <AnimatePresence>
              {addingCase && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <AddCaseForm onAdd={handleAddCase} onCancel={() => setAddingCase(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {cases.length === 0 && !addingCase ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">Nenhum caso de teste criado.</p>
                {canEdit && <p className="text-xs text-slate-400 mt-1">Clique em "Novo Caso" para adicionar.</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((tc, idx) => (
                  <TestCaseRow
                    key={tc.id}
                    tc={tc}
                    index={idx}
                    canEdit={canEdit}
                    expanded={expandedCase === tc.id}
                    onToggle={() => setExpandedCase(expandedCase === tc.id ? null : tc.id)}
                    onExecute={(result, notes, evidence) => handleExecuteCase(tc.id, result, notes, evidence)}
                    onDelete={() => handleDeleteCase(tc.id)}
                    testerName={profile?.displayName || 'Tester'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Global Evidence & Observations */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-amber-400 rounded-full" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Evidências & Observações Gerais</h3>
            </div>

            <Textarea
              label="Evidência (URL de screenshot, link de vídeo, etc.)"
              value={globalEvidence}
              onChange={e => setGlobalEvidence(e.target.value)}
              placeholder="https://... ou descrição da evidência coletada"
              rows={2}
            />
            <Textarea
              label="Observações do Teste"
              value={globalObs}
              onChange={e => setGlobalObs(e.target.value)}
              placeholder="Descreva o ambiente, versão, comportamentos observados..."
              rows={3}
            />
          </div>

          {/* Original test scenarios from feature */}
          {feature.testScenarios && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-amber-400 rounded-full" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Cenários de Teste (Spec)</h3>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {feature.testScenarios}
              </div>
            </div>
          )}
          {feature.businessRules && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-5 bg-indigo-400 rounded-full" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Regras de Negócio</h3>
              </div>
              <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {feature.businessRules}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {canEdit && (
          <div className="flex-shrink-0 pt-6 border-t border-slate-100 mt-6 space-y-3">
            {/* Status summary */}
            {cases.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                  {cases.map((c, i) => (
                    <div key={i} className={cn('flex-1',
                      c.result === 'pass' ? 'bg-emerald-500' :
                      c.result === 'fail' ? 'bg-rose-500' : 'bg-slate-200'
                    )} />
                  ))}
                </div>
                <span className="text-xs font-black text-slate-600 shrink-0">
                  {passed}/{cases.length} casos OK
                </span>
              </div>
            )}

            {/* Verdict buttons */}
            {feature.status !== 'done' && (
              <div className="flex gap-3">
                {/* Reject → review */}
                <button
                  onClick={() => setConfirmReject(true)}
                  disabled={submitting || cases.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-rose-200 text-rose-600 font-black text-sm hover:bg-rose-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" /> REPROVAR → REVISÃO
                </button>

                {/* Approve */}
                <button
                  onClick={handleApprove}
                  disabled={submitting || !allExecuted || anyFailed}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-100"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  APROVAR & CONCLUIR
                </button>
              </div>
            )}

            {!allExecuted && cases.length > 0 && (
              <p className="text-center text-[11px] text-slate-400 font-bold">
                Execute todos os casos antes de aprovar. {anyFailed ? '⚠ Há falhas — use "Reprovar".' : ''}
              </p>
            )}
            {cases.length === 0 && (
              <p className="text-center text-[11px] text-slate-400 font-bold">
                Crie ao menos 1 caso de teste para poder validar.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Reject confirmation */}
      {confirmReject && (
        <Modal isOpen={true} onClose={() => setConfirmReject(false)} title="Reprovar Funcionalidade" size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700 font-bold">
                A funcionalidade voltará para o status <strong>Revisão</strong> com o motivo da reprovação.
              </p>
            </div>
            <Textarea
              label="Motivo da Reprovação *"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Descreva o que falhou e o que precisa ser corrigido..."
              rows={4}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmReject(false)} fullWidth>CANCELAR</Button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || submitting}
                className="flex-1 py-2.5 bg-rose-600 text-white font-black text-sm rounded-2xl hover:bg-rose-700 transition-all disabled:opacity-40"
              >
                {submitting ? 'Salvando...' : 'CONFIRMAR REPROVAÇÃO'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

// ─── AddCaseForm ──────────────────────────────────────────────────────────────

function AddCaseForm({ onAdd, onCancel }: {
  onAdd: (tc: Omit<TestCase, 'id' | 'result'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]     = useState('');
  const [steps, setSteps]     = useState('');
  const [expected, setExpected] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), steps: steps.trim(), expected: expected.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600 mb-1">Novo Caso de Teste</p>
      <Input label="Título do Caso *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Login com email válido" required />
      <Textarea label="Passos para Executar" value={steps} onChange={e => setSteps(e.target.value)} placeholder="1. Acesse /login&#10;2. Preencha email e senha&#10;3. Clique em Entrar" rows={3} />
      <Textarea label="Resultado Esperado" value={expected} onChange={e => setExpected(e.target.value)} placeholder="O usuário deve ser redirecionado para o dashboard" rows={2} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />}>ADICIONAR</Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>CANCELAR</Button>
      </div>
    </form>
  );
}

// ─── TestCaseRow ──────────────────────────────────────────────────────────────

function TestCaseRow({ tc, index, canEdit, expanded, onToggle, onExecute, onDelete, testerName }: {
  tc: TestCase; index: number; canEdit: boolean; expanded: boolean;
  onToggle: () => void;
  onExecute: (result: 'pass' | 'fail', notes: string, evidence: string) => void;
  onDelete: () => void;
  testerName: string;
}) {
  const [notes,    setNotes]    = useState(tc.notes    || '');
  const [evidence, setEvidence] = useState(tc.evidence || '');
  const [saving, setSaving]     = useState(false);

  const execute = async (result: 'pass' | 'fail') => {
    setSaving(true);
    await onExecute(result, notes, evidence);
    setSaving(false);
  };

  const statusIcon = tc.result === 'pass'
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    : tc.result === 'fail'
    ? <XCircle className="w-4 h-4 text-rose-500" />
    : <Circle className="w-4 h-4 text-slate-300" />;

  return (
    <div className={cn(
      'rounded-2xl border transition-all overflow-hidden',
      tc.result === 'pass' ? 'border-emerald-200 bg-emerald-50/30' :
      tc.result === 'fail' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-white'
    )}>
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/60 transition-colors"
        onClick={onToggle}
      >
        {statusIcon}
        <span className="text-[10px] font-black text-slate-400 shrink-0">#{index + 1}</span>
        <span className="text-sm font-bold text-slate-800 flex-1 truncate">{tc.title}</span>

        {tc.executedAt && (
          <span className="text-[10px] text-slate-400 font-bold shrink-0 hidden sm:block">
            {format(new Date(tc.executedAt), 'dd/MM HH:mm')}
          </span>
        )}
        {tc.executedBy && (
          <span className="text-[10px] font-black text-indigo-500 shrink-0">{tc.executedBy}</span>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {canEdit && tc.result === 'pending' && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded text-slate-300 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />
          }
        </div>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
              {tc.steps && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Passos</p>
                  <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                    {tc.steps}
                  </div>
                </div>
              )}
              {tc.expected && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Resultado Esperado</p>
                  <div className="text-sm text-slate-700 bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                    {tc.expected}
                  </div>
                </div>
              )}

              {/* Execution form */}
              {canEdit && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execução do Teste</p>
                  <input
                    type="text"
                    value={evidence}
                    onChange={e => setEvidence(e.target.value)}
                    placeholder="Evidência: URL screenshot, link de vídeo..."
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 transition-all"
                  />
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observações do teste (o que foi observado, ambiente, etc.)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 transition-all resize-none"
                  />

                  {tc.result === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => execute('pass')}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        PASSOU
                      </button>
                      <button
                        onClick={() => execute('fail')}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 text-white font-black text-xs rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        FALHOU
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black',
                        tc.result === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      )}>
                        {tc.result === 'pass' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {tc.result === 'pass' ? 'PASSOU' : 'FALHOU'}
                      </div>
                      {/* Re-execute */}
                      <button
                        onClick={() => execute(tc.result === 'pass' ? 'fail' : 'pass')}
                        className="text-[11px] font-black text-slate-400 hover:text-slate-600 underline transition-colors"
                      >
                        Alterar resultado
                      </button>
                    </div>
                  )}

                  {tc.notes && tc.result !== 'pending' && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
                      <span className="font-black text-slate-400 uppercase tracking-wider mr-2">Nota:</span>
                      {tc.notes}
                    </div>
                  )}
                  {tc.evidence && tc.result !== 'pending' && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-indigo-600 font-medium truncate">
                      <span className="font-black text-slate-400 uppercase tracking-wider mr-2">Evidência:</span>
                      {tc.evidence}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
