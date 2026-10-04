import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Target, Trophy, Users, ShieldCheck, Plus, Trash2, Edit2,
  CheckCircle2, Circle, AlertTriangle, Save, Star,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, Textarea, EmptyState, Badge, ProgressBar,
} from '../ui';
import type { BadgeColor } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveEvents } from '../../lib/liveEvents';
import { RowMenu } from './financeShared';
import { format } from 'date-fns';

// ─── Tipos locais (espelham o Prisma) ─────────────────────────────────────────

interface Partner { id: string; name: string; sharePercent: number; email?: string | null; role?: string | null; color?: string | null; active: boolean; responsibilities?: string | null }
interface BusinessPlan {
  missionText?: string | null; visionText?: string | null; valuesText?: string | null;
  swotStrengths?: string | null; swotWeaknesses?: string | null; swotOpportunities?: string | null; swotThreats?: string | null;
  targetMarket?: string | null; businessModel?: string | null;
  legalChecklist?: { id: string; label: string; done: boolean }[] | null; legalNotes?: string | null;
  updatedByName?: string | null; updatedAt?: string;
}
type GoalScope = 'company' | 'partner';
type GoalStatus = 'not_started' | 'in_progress' | 'done' | 'at_risk';
interface BusinessGoal {
  id: string; title: string; description?: string | null; scope: GoalScope;
  partnerId?: string | null; partner?: { id: string; name: string; color?: string | null } | null;
  targetDate?: string | null; status: GoalStatus; progress: number; createdAt: string;
}
interface Achievement { id: string; title: string; description?: string | null; achievedAt: string }
interface PartnerEvaluation {
  id: string; partnerId: string; partner?: { id: string; name: string; color?: string | null; role?: string | null };
  period: string; score?: number | null; strengths?: string | null; improvements?: string | null; goalsNextPeriod?: string | null;
  evaluatedByName?: string | null; createdAt: string;
}

const GOAL_STATUS_CONFIG: Record<GoalStatus, { label: string; color: BadgeColor }> = {
  not_started: { label: 'Não Começou', color: 'default' },
  in_progress: { label: 'Em Andamento', color: 'info' },
  done:        { label: 'Concluída',    color: 'success' },
  at_risk:     { label: 'Em Risco',     color: 'danger' },
};

const SECTIONS = [
  { key: 'overview',    label: 'Visão Geral',  icon: Compass },
  { key: 'goals',       label: 'Metas',        icon: Target },
  { key: 'achievements',label: 'Conquistas',   icon: Trophy },
  { key: 'partners',    label: 'Sócios',       icon: Users },
  { key: 'legal',       label: 'Checklist Jurídico', icon: ShieldCheck },
] as const;
type SectionKey = typeof SECTIONS[number]['key'];

export function BusinessPlanManager() {
  const { isDark } = useTheme();
  const [section, setSection] = useState<SectionKey>('overview');

  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [evaluations, setEvaluations] = useState<PartnerEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [planRes, goalsRes, achRes, partnersRes, evalRes] = await Promise.all([
        fetch('/api/business-plan'),
        fetch('/api/business-goals'),
        fetch('/api/achievements'),
        fetch('/api/partners'),
        fetch('/api/partner-evaluations'),
      ]);
      const [planData, goalsData, achData, partnersData, evalData] = await Promise.all([
        planRes.json(), goalsRes.json(), achRes.json(), partnersRes.json(), evalRes.json(),
      ]);
      setPlan(planData);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setAchievements(Array.isArray(achData) ? achData : []);
      setPartners(Array.isArray(partnersData?.partners) ? partnersData.partners : []);
      setEvaluations(Array.isArray(evalData) ? evalData : []);
    } catch {
      // silencioso — cada seção mostra seu próprio estado vazio
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useLiveEvents(['BusinessPlan', 'BusinessGoal', 'Achievement', 'Partner', 'PartnerEvaluation'], () => fetchAll());

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density">
      <div>
        <h2 className="text-lg font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
          Plano de Negócio
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">A estratégia da Develoi: missão, metas, conquistas e responsabilidades de cada sócio</p>
      </div>

      <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${section === s.key ? 'bg-white dark:bg-white/15 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
            style={section === s.key ? { color: isDark ? '#fff' : '#0D1F4E' } : undefined}
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : (
        <>
          {section === 'overview' && plan && <OverviewSection plan={plan} onSaved={fetchAll} />}
          {section === 'goals' && <GoalsSection goals={goals} partners={partners} onRefresh={fetchAll} />}
          {section === 'achievements' && <AchievementsSection achievements={achievements} onRefresh={fetchAll} />}
          {section === 'partners' && <PartnersSection partners={partners} goals={goals} evaluations={evaluations} onRefresh={fetchAll} />}
          {section === 'legal' && plan && <LegalSection plan={plan} onSaved={fetchAll} />}
        </>
      )}
    </div>
  );
}

// ─── Visão Geral ───────────────────────────────────────────────────────────────

function OverviewSection({ plan, onSaved }: { plan: BusinessPlan; onSaved: () => void }) {
  const { isDark } = useTheme();
  const { profile } = useAuth();
  const { show: toast } = useToast();
  const [form, setForm] = useState({
    missionText: plan.missionText || '', visionText: plan.visionText || '', valuesText: plan.valuesText || '',
    targetMarket: plan.targetMarket || '', businessModel: plan.businessModel || '',
    swotStrengths: plan.swotStrengths || '', swotWeaknesses: plan.swotWeaknesses || '',
    swotOpportunities: plan.swotOpportunities || '', swotThreats: plan.swotThreats || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/business-plan', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, updatedByName: profile?.displayName }),
      });
      if (!res.ok) throw new Error();
      toast('Plano de negócio atualizado', 'success');
      onSaved();
    } catch {
      toast('Não deu para salvar agora. Tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Textarea label="Missão" value={form.missionText} onChange={set('missionText')} rows={4} placeholder="Por que a Develoi existe?" />
          <Textarea label="Visão" value={form.visionText} onChange={set('visionText')} rows={4} placeholder="Onde queremos chegar?" />
          <Textarea label="Valores" value={form.valuesText} onChange={set('valuesText')} rows={4} placeholder="O que guia nossas decisões?" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Textarea label="Mercado-Alvo / Público" value={form.targetMarket} onChange={set('targetMarket')} rows={3} placeholder="Quem são nossos clientes ideais?" />
          <Textarea label="Modelo de Negócio" value={form.businessModel} onChange={set('businessModel')} rows={3} placeholder="Como a Develoi ganha dinheiro (planos, assinaturas...)" />
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-3">
        <p className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Análise SWOT</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Textarea label="Forças" value={form.swotStrengths} onChange={set('swotStrengths')} rows={4} placeholder="O que fazemos bem?" />
          <Textarea label="Fraquezas" value={form.swotWeaknesses} onChange={set('swotWeaknesses')} rows={4} placeholder="Onde precisamos melhorar?" />
          <Textarea label="Oportunidades" value={form.swotOpportunities} onChange={set('swotOpportunities')} rows={4} placeholder="O que podemos aproveitar no mercado?" />
          <Textarea label="Ameaças" value={form.swotThreats} onChange={set('swotThreats')} rows={4} placeholder="O que pode atrapalhar o crescimento?" />
        </div>
      </div>

      <Button onClick={save} loading={saving} iconLeft={<Save className="w-4 h-4" />}>SALVAR PLANO</Button>
      {plan.updatedAt && (
        <p className="text-[11px] text-slate-400">
          Última atualização: {format(new Date(plan.updatedAt), 'dd/MM/yyyy HH:mm')}{plan.updatedByName ? ` por ${plan.updatedByName}` : ''}
        </p>
      )}
    </div>
  );
}

// ─── Metas ─────────────────────────────────────────────────────────────────────

function GoalsSection({ goals, partners, onRefresh }: { goals: BusinessGoal[]; partners: Partner[]; onRefresh: () => void }) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const [filterScope, setFilterScope] = useState<'all' | GoalScope>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = goals.filter(g => filterScope === 'all' || g.scope === filterScope);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/business-goals/${deletingId}`, { method: 'DELETE' });
      toast('Meta removida', 'success');
      onRefresh();
    } catch {
      toast('Não deu para remover agora. Tente de novo.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start">
          {([['all', 'Todas'], ['company', 'Da Empresa'], ['partner', 'De Sócios']] as [string, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setFilterScope(v as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterScope === v ? 'bg-white dark:bg-white/15 shadow-sm' : 'text-slate-500'}`}
              style={filterScope === v ? { color: isDark ? '#fff' : '#0D1F4E' } : undefined}>
              {l}
            </button>
          ))}
        </div>
        <Button size="sm" iconLeft={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA META</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Target} title="Nenhuma meta cadastrada" description="Defina metas para a empresa ou para um sócio específico." action={<Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA META</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence>
            {filtered.map(g => {
              const statusCfg = GOAL_STATUS_CONFIG[g.status];
              return (
                <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{g.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {g.scope === 'partner' && g.partner ? `Sócio: ${g.partner.name}` : 'Meta da empresa'}
                        {g.targetDate && ` · Até ${format(new Date(g.targetDate), 'dd/MM/yyyy')}`}
                      </p>
                    </div>
                    <RowMenu items={[
                      { label: 'Editar', icon: Edit2, onClick: () => { setEditing(g); setIsFormOpen(true); } },
                      { label: 'Remover', icon: Trash2, onClick: () => setDeletingId(g.id), danger: true },
                    ]} />
                  </div>
                  {g.description && <p className="text-xs text-slate-500 dark:text-slate-300">{g.description}</p>}
                  <ProgressBar progress={g.progress} size="sm" />
                  <Badge color={statusCfg.color} size="sm" pill>{statusCfg.label}</Badge>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {isFormOpen && (
        <GoalFormModal goal={editing} partners={partners} onClose={() => setIsFormOpen(false)} onSuccess={() => { setIsFormOpen(false); onRefresh(); }} />
      )}
      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete}
        title="Remover Meta" message="Tem certeza que quer remover esta meta?" confirmLabel="REMOVER" variant="danger" />
    </div>
  );
}

function GoalFormModal({ goal, partners, onClose, onSuccess }: { goal: BusinessGoal | null; partners: Partner[]; onClose: () => void; onSuccess: () => void }) {
  const { show: toast } = useToast();
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [scope, setScope] = useState<GoalScope>(goal?.scope || 'company');
  const [partnerId, setPartnerId] = useState(goal?.partnerId || '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ? goal.targetDate.slice(0, 10) : '');
  const [status, setStatus] = useState<GoalStatus>(goal?.status || 'in_progress');
  const [progress, setProgress] = useState(String(goal?.progress ?? 0));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title, description, scope, partnerId: scope === 'partner' ? partnerId : null, targetDate: targetDate || null, status, progress: Number(progress) || 0 };
      const res = await fetch(goal ? `/api/business-goals/${goal.id}` : '/api/business-goals', {
        method: goal ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast(goal ? 'Meta atualizada' : 'Meta criada', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={goal ? 'Editar Meta' : 'Nova Meta'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Chegar a 100 clientes ativos" />
        <Textarea label="Descrição" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="De quem é a meta?" value={scope} onChange={e => setScope(e.target.value as GoalScope)}
            options={[{ value: 'company', label: 'Da Empresa' }, { value: 'partner', label: 'De um Sócio' }]} />
          {scope === 'partner' && (
            <Select label="Sócio" value={partnerId} onChange={e => setPartnerId(e.target.value)}
              options={[{ value: '', label: 'Selecione...' }, ...partners.map(p => ({ value: p.id, label: p.name }))]} />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Prazo" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          <Select label="Situação" value={status} onChange={e => setStatus(e.target.value as GoalStatus)}
            options={Object.entries(GOAL_STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
          <Input label="Progresso (%)" type="number" min={0} max={100} value={progress} onChange={e => setProgress(e.target.value)} />
        </div>
        <Button type="submit" loading={saving} fullWidth size="lg">SALVAR</Button>
      </form>
    </Modal>
  );
}

// ─── Conquistas ─────────────────────────────────────────────────────────────────

function AchievementsSection({ achievements, onRefresh }: { achievements: Achievement[]; onRefresh: () => void }) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/achievements/${deletingId}`, { method: 'DELETE' });
      toast('Conquista removida', 'success');
      onRefresh();
    } catch {
      toast('Não deu para remover agora. Tente de novo.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" iconLeft={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA CONQUISTA</Button>
      </div>

      {achievements.length === 0 ? (
        <EmptyState icon={Trophy} title="Nenhuma conquista registrada" description="Marque aqui os marcos importantes da Develoi." action={<Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA CONQUISTA</Button>} />
      ) : (
        <div className="relative pl-6 space-y-5">
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-white/10" />
          {achievements.map(a => (
            <div key={a.id} className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900" style={{ background: '#C49A2A' }} />
              <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{format(new Date(a.achievedAt), 'dd/MM/yyyy')}</p>
                  <p className="text-sm font-black mt-0.5" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{a.title}</p>
                  {a.description && <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{a.description}</p>}
                </div>
                <RowMenu items={[
                  { label: 'Editar', icon: Edit2, onClick: () => { setEditing(a); setIsFormOpen(true); } },
                  { label: 'Remover', icon: Trash2, onClick: () => setDeletingId(a.id), danger: true },
                ]} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && <AchievementFormModal achievement={editing} onClose={() => setIsFormOpen(false)} onSuccess={() => { setIsFormOpen(false); onRefresh(); }} />}
      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete}
        title="Remover Conquista" message="Tem certeza que quer remover esta conquista?" confirmLabel="REMOVER" variant="danger" />
    </div>
  );
}

function AchievementFormModal({ achievement, onClose, onSuccess }: { achievement: Achievement | null; onClose: () => void; onSuccess: () => void }) {
  const { show: toast } = useToast();
  const [title, setTitle] = useState(achievement?.title || '');
  const [description, setDescription] = useState(achievement?.description || '');
  const [achievedAt, setAchievedAt] = useState(achievement?.achievedAt ? achievement.achievedAt.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(achievement ? `/api/achievements/${achievement.id}` : '/api/achievements', {
        method: achievement ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, achievedAt }),
      });
      if (!res.ok) throw new Error();
      toast(achievement ? 'Conquista atualizada' : 'Conquista registrada', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={achievement ? 'Editar Conquista' : 'Nova Conquista'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Título" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Primeiro cliente fechado" />
        <Textarea label="Descrição" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        <Input label="Data" type="date" required value={achievedAt} onChange={e => setAchievedAt(e.target.value)} />
        <Button type="submit" loading={saving} fullWidth size="lg">SALVAR</Button>
      </form>
    </Modal>
  );
}

// ─── Sócios ─────────────────────────────────────────────────────────────────────

function PartnersSection({ partners, goals, evaluations, onRefresh }: {
  partners: Partner[]; goals: BusinessGoal[]; evaluations: PartnerEvaluation[]; onRefresh: () => void;
}) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const [editingResp, setEditingResp] = useState<Partner | null>(null);
  const [evalPartner, setEvalPartner] = useState<Partner | null>(null);
  const [editingEval, setEditingEval] = useState<PartnerEvaluation | null>(null);
  const [deletingEvalId, setDeletingEvalId] = useState<string | null>(null);

  const handleDeleteEval = async () => {
    if (!deletingEvalId) return;
    try {
      await fetch(`/api/partner-evaluations/${deletingEvalId}`, { method: 'DELETE' });
      toast('Avaliação removida', 'success');
      onRefresh();
    } catch {
      toast('Não deu para remover agora. Tente de novo.', 'error');
    } finally {
      setDeletingEvalId(null);
    }
  };

  return (
    <div className="space-y-4">
      {partners.filter(p => p.active).map(p => {
        const partnerGoals = goals.filter(g => g.scope === 'partner' && g.partnerId === p.id);
        const partnerEvals = evaluations.filter(e => e.partnerId === p.id);
        return (
          <div key={p.id} className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={{ background: p.color || '#0D1F4E' }}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{p.name}</p>
                  <p className="text-[11px] text-slate-400">{p.role || 'Sócio'} · {p.sharePercent}% da sociedade</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingResp(p)}>RESPONSABILIDADES</Button>
                <Button size="sm" onClick={() => setEvalPartner(p)}>AVALIAR</Button>
              </div>
            </div>

            {p.responsibilities && (
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsabilidades na função</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{p.responsibilities}</p>
              </div>
            )}

            {partnerGoals.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Metas</p>
                <div className="space-y-2">
                  {partnerGoals.map(g => (
                    <div key={g.id} className="flex items-center gap-3">
                      {g.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : g.status === 'at_risk' ? <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                      <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{g.title}</span>
                      <span className="text-[10px] font-bold text-slate-400">{g.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {partnerEvals.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Histórico de avaliações</p>
                <div className="space-y-2">
                  {partnerEvals.map(ev => (
                    <div key={ev.id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{ev.period}</span>
                        <div className="flex items-center gap-2">
                          {ev.score != null && (
                            <span className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className="w-3 h-3" style={{ color: i < (ev.score || 0) ? '#C49A2A' : '#e2e8f0' }} fill={i < (ev.score || 0) ? '#C49A2A' : 'none'} />
                              ))}
                            </span>
                          )}
                          <button onClick={() => setEditingEval(ev)} className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeletingEvalId(ev.id)} className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {ev.strengths && <p className="text-[11px] text-slate-500 dark:text-slate-300"><b>Pontos fortes:</b> {ev.strengths}</p>}
                      {ev.improvements && <p className="text-[11px] text-slate-500 dark:text-slate-300"><b>A melhorar:</b> {ev.improvements}</p>}
                      {ev.goalsNextPeriod && <p className="text-[11px] text-slate-500 dark:text-slate-300"><b>Metas próximo período:</b> {ev.goalsNextPeriod}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {editingResp && <ResponsibilitiesModal partner={editingResp} onClose={() => setEditingResp(null)} onSuccess={() => { setEditingResp(null); onRefresh(); }} />}
      {evalPartner && <EvaluationFormModal partner={evalPartner} onClose={() => setEvalPartner(null)} onSuccess={() => { setEvalPartner(null); onRefresh(); }} />}
      {editingEval && (
        <EvaluationFormModal
          partner={partners.find(p => p.id === editingEval.partnerId) || editingEval.partner || { id: editingEval.partnerId, name: 'Sócio' }}
          evaluation={editingEval}
          onClose={() => setEditingEval(null)}
          onSuccess={() => { setEditingEval(null); onRefresh(); }}
        />
      )}
      <ConfirmModal isOpen={!!deletingEvalId} onClose={() => setDeletingEvalId(null)} onConfirm={handleDeleteEval}
        title="Remover Avaliação" message="Tem certeza que quer remover esta avaliação?" confirmLabel="REMOVER" variant="danger" />
    </div>
  );
}

function ResponsibilitiesModal({ partner, onClose, onSuccess }: { partner: Partner; onClose: () => void; onSuccess: () => void }) {
  const { show: toast } = useToast();
  const [text, setText] = useState(partner.responsibilities || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/partners/${partner.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ responsibilities: text }),
      });
      if (!res.ok) throw new Error();
      toast('Responsabilidades atualizadas', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Responsabilidades de ${partner.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Textarea label="O que esse sócio é responsável por fazer na função dele" value={text} onChange={e => setText(e.target.value)} rows={8} placeholder="Ex: Cuidar do desenvolvimento técnico, decidir arquitetura dos sistemas, atender chamados críticos..." />
        <Button type="submit" loading={saving} fullWidth size="lg">SALVAR</Button>
      </form>
    </Modal>
  );
}

function EvaluationFormModal({ partner, evaluation, onClose, onSuccess }: { partner: { id: string; name: string }; evaluation?: PartnerEvaluation; onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const { show: toast } = useToast();
  const [period, setPeriod] = useState(evaluation?.period || format(new Date(), "yyyy-'T'Q"));
  const [score, setScore] = useState(evaluation?.score ?? 5);
  const [strengths, setStrengths] = useState(evaluation?.strengths || '');
  const [improvements, setImprovements] = useState(evaluation?.improvements || '');
  const [goalsNextPeriod, setGoalsNextPeriod] = useState(evaluation?.goalsNextPeriod || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(evaluation ? `/api/partner-evaluations/${evaluation.id}` : '/api/partner-evaluations', {
        method: evaluation ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id, period, score, strengths, improvements, goalsNextPeriod, evaluatedByName: profile?.displayName }),
      });
      if (!res.ok) throw new Error();
      toast(evaluation ? 'Avaliação atualizada' : 'Avaliação registrada', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Confira os dados e tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={evaluation ? `Editar avaliação de ${partner.name}` : `Avaliar ${partner.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Período" required value={period} onChange={e => setPeriod(e.target.value)} placeholder="Ex: 2026-T4" />
          <div className="flex flex-col gap-1.5">
            <label className="ds-label">Nota geral</label>
            <div className="flex items-center gap-1 pt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <button type="button" key={i} onClick={() => setScore(i + 1)}>
                  <Star className="w-6 h-6" style={{ color: i < score ? '#C49A2A' : '#e2e8f0' }} fill={i < score ? '#C49A2A' : 'none'} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <Textarea label="Pontos fortes" value={strengths} onChange={e => setStrengths(e.target.value)} rows={3} />
        <Textarea label="Pontos a melhorar" value={improvements} onChange={e => setImprovements(e.target.value)} rows={3} />
        <Textarea label="Metas para o próximo período" value={goalsNextPeriod} onChange={e => setGoalsNextPeriod(e.target.value)} rows={3} />
        <Button type="submit" loading={saving} fullWidth size="lg">SALVAR AVALIAÇÃO</Button>
      </form>
    </Modal>
  );
}

// ─── Checklist Jurídico ─────────────────────────────────────────────────────────

function LegalSection({ plan, onSaved }: { plan: BusinessPlan; onSaved: () => void }) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const [checklist, setChecklist] = useState(plan.legalChecklist || []);
  const [notes, setNotes] = useState(plan.legalNotes || '');
  const [saving, setSaving] = useState(false);

  const toggle = async (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, done: !item.done } : item);
    setChecklist(updated);
    try {
      await fetch('/api/business-plan', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ legalChecklist: updated }) });
    } catch {
      toast('Não deu para salvar agora. Tente de novo.', 'error');
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await fetch('/api/business-plan', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ legalNotes: notes }) });
      toast('Observações salvas', 'success');
      onSaved();
    } catch {
      toast('Não deu para salvar agora. Tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-200">
        Esta lista é só um lembrete dos temas mais comuns para uma empresa de tecnologia. Para ter certeza do que se aplica à Develoi, confirme cada ponto com o contador ou advogado da empresa.
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Checklist</p>
          <span className="text-xs font-bold text-slate-400">{doneCount}/{checklist.length} resolvidos</span>
        </div>
        <div className="space-y-1">
          {checklist.map(item => (
            <button key={item.id} onClick={() => toggle(item.id)} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors">
              {item.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />}
              <span className={`text-xs ${item.done ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-3">
        <Textarea label="Observações sobre contrato social, regime tributário, LGPD, etc." value={notes} onChange={e => setNotes(e.target.value)} rows={5} />
        <Button onClick={saveNotes} loading={saving} iconLeft={<Save className="w-4 h-4" />}>SALVAR OBSERVAÇÕES</Button>
      </div>
    </div>
  );
}
