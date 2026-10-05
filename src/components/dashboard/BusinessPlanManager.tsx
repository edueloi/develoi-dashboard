import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Target, Trophy, Users, ShieldCheck, Plus, Trash2, Edit2,
  CheckCircle2, Circle, AlertTriangle, Save, Star, History, ArrowRight, Camera, X, Loader2,
  LayoutDashboard, Gem, Swords, Flag, CalendarClock, TrendingUp, Scale, Flame,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, Textarea, EmptyState, Badge, ProgressBar, DatePicker,
} from '../ui';
import type { BadgeColor } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveEvents } from '../../lib/liveEvents';
import { RowMenu } from './financeShared';
import { format } from 'date-fns';

// ─── Tipos locais (espelham o Prisma) ─────────────────────────────────────────

interface Partner { id: string; name: string; sharePercent: number; email?: string | null; role?: string | null; color?: string | null; active: boolean; responsibilities?: string | null; birthDate?: string | null }
interface BusinessPlan {
  missionText?: string | null; visionText?: string | null; valuesText?: string | null;
  swotStrengths?: string | null; swotWeaknesses?: string | null; swotOpportunities?: string | null; swotThreats?: string | null;
  swotConclusion?: string | null;
  targetMarket?: string | null; businessModel?: string | null;
  legalChecklist?: { id: string; label: string; done: boolean }[] | null; legalNotes?: string | null;
  updatedByName?: string | null; updatedAt?: string;
}
interface BusinessPlanHistoryEntry {
  id: string; changedByName?: string | null; changedAt: string;
  changes: { field: string; label: string; before: string | null; after: string | null }[];
}
type GoalScope = 'company' | 'partner';
type GoalStatus = 'not_started' | 'in_progress' | 'done' | 'at_risk';
interface BusinessGoal {
  id: string; title: string; description?: string | null; scope: GoalScope;
  partnerId?: string | null; partner?: { id: string; name: string; color?: string | null } | null;
  targetDate?: string | null; status: GoalStatus; progress: number; createdAt: string;
}
interface Achievement { id: string; title: string; description?: string | null; photoUrl?: string | null; achievedAt: string }
interface MonthlyStat { month: string; newClients: number; contacts: number }
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
  { key: 'dashboard',    label: 'Painel',       icon: LayoutDashboard },
  { key: 'identity',     label: 'Identidade',   icon: Compass },
  { key: 'swot',         label: 'SWOT',         icon: Swords },
  { key: 'goals',        label: 'Metas',        icon: Target },
  { key: 'achievements', label: 'Conquistas',   icon: Trophy },
  { key: 'partners',     label: 'Sócios',       icon: Users },
  { key: 'legal',        label: 'Jurídico',     icon: ShieldCheck },
] as const;
type SectionKey = typeof SECTIONS[number]['key'];

const lines = (t?: string | null) => (t || '').split('\n').map(x => x.trim()).filter(Boolean);
const TAB_KEY = 'develoi:plano:aba';

export function BusinessPlanManager() {
  const { isDark } = useTheme();
  const [section, setSectionState] = useState<SectionKey>(() => {
    try { const v = localStorage.getItem(TAB_KEY) as SectionKey | null; return v && SECTIONS.some(s => s.key === v) ? v : 'dashboard'; } catch { return 'dashboard'; }
  });
  const setSection = (k: SectionKey) => { setSectionState(k); try { localStorage.setItem(TAB_KEY, k); } catch { /* sem storage */ } };

  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [goals, setGoals] = useState<BusinessGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [evaluations, setEvaluations] = useState<PartnerEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

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
      // silencioso: cada seção mostra seu próprio estado vazio
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useLiveEvents(['BusinessPlan', 'BusinessGoal', 'Achievement', 'Partner', 'PartnerEvaluation'], () => fetchAll());

  const activePartners = partners.filter(p => p.active);
  const counts: Partial<Record<SectionKey, number>> = {
    goals: goals.filter(g => g.status !== 'done').length, achievements: achievements.length, partners: activePartners.length,
    legal: (plan?.legalChecklist ?? []).filter(i => !i.done).length,
  };

  return (
    <div className="space-y-4 sm:space-y-5 dashboard-density w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Central do Plano de Negócio</h2>
          <p className="text-xs text-slate-400 mt-0.5">Estratégia, metas, conquistas e responsabilidades da Develoi em um só lugar</p>
          {plan?.updatedAt && (
            <p className="text-[11px] text-slate-400 mt-1">Plano atualizado em {format(new Date(plan.updatedAt), 'dd/MM/yyyy HH:mm')}{plan.updatedByName ? ` por ${plan.updatedByName}` : ''}</p>
          )}
        </div>
        <Button size="sm" variant="outline" className="self-start" iconLeft={<History className="w-3.5 h-3.5" />} onClick={() => setShowHistory(true)}>HISTÓRICO DE ALTERAÇÕES</Button>
      </div>

      {/* Abas: rolam no celular e ficam à vista ao descer a página */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-2 backdrop-blur" style={{ background: isDark ? 'rgba(11,17,32,0.85)' : 'rgba(240,242,248,0.9)' }}>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 snap-x" role="tablist" aria-label="Seções do plano de negócio">
          {SECTIONS.map(t => {
            const on = section === t.key, n = counts[t.key];
            return (
              <button key={t.key} role="tab" aria-selected={on} onClick={() => setSection(t.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap flex-shrink-0 snap-start border transition-all"
                style={on ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E', boxShadow: '0 4px 12px rgba(13,31,78,0.25)' } : { background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', color: '#64748B', borderColor: 'rgba(148,163,184,0.3)' }}>
                <t.icon className="w-3.5 h-3.5" />{t.label}
                {n ? <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full" style={on ? { background: 'rgba(255,255,255,0.2)' } : { background: 'rgba(100,116,139,0.12)' }}>{n}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : (
        <>
          {section === 'dashboard' && plan && <DashboardSection plan={plan} goals={goals} achievements={achievements} partners={activePartners} evaluations={evaluations} go={setSection} />}
          {section === 'identity' && plan && <IdentitySection plan={plan} onSaved={fetchAll} />}
          {section === 'swot' && plan && <SwotSection plan={plan} onSaved={fetchAll} />}
          {section === 'goals' && <GoalsSection goals={goals} partners={partners} onRefresh={fetchAll} />}
          {section === 'achievements' && <AchievementsSection achievements={achievements} onRefresh={fetchAll} />}
          {section === 'partners' && <PartnersSection partners={partners} goals={goals} evaluations={evaluations} onRefresh={fetchAll} />}
          {section === 'legal' && plan && <LegalSection plan={plan} onSaved={fetchAll} />}
        </>
      )}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
}

// ─── Peças de visualização (SVG simples, sem biblioteca) ────────────────────────

function Panel({ title, icon: Icon, color = '#0D1F4E', action, children, className = '' }: { title: string; icon?: any; color?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 min-w-0">
          {Icon && <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}><Icon className="w-3.5 h-3.5" style={{ color }} /></span>}
          <span className="truncate">{title}</span>
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: React.ReactNode; sub?: string; color: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-3.5 sm:p-4" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-300"><Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} /><span className="truncate">{label}</span></div>
      <div className="mt-1.5 text-2xl font-black truncate" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 truncate mt-0.5">{sub}</div>}
    </div>
  );
}

function RingChart({ value, size = 64, stroke = 8, color, label }: { value: number; size?: number; stroke?: number; color: string; label?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-700 dark:text-slate-200">{label ?? `${Math.round(v)}%`}</span>
    </div>
  );
}

function DonutChart({ items, center, sub }: { items: { label: string; value: number; color: string }[]; center: string; sub: string }) {
  const total = items.reduce((a, i) => a + i.value, 0);
  const R = 50, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="18" />
        {total > 0 && items.filter(i => i.value > 0).map(i => {
          const len = (i.value / total) * C;
          const el = <circle key={i.label} cx="70" cy="70" r={R} fill="none" stroke={i.color} strokeWidth="18" strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{center}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{sub}</span>
      </div>
    </div>
  );
}

const GOAL_COLORS: Record<GoalStatus, string> = { not_started: '#94A3B8', in_progress: '#2563EB', done: '#15803D', at_risk: '#DC2626' };
const daysTo = (iso?: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) : null);
const deadlineText = (iso?: string | null, done?: boolean) => {
  const n = daysTo(iso);
  if (n === null) return 'Sem prazo';
  if (done) return `Prazo ${format(new Date(iso as string), 'dd/MM/yyyy')}`;
  if (n < 0) return `Atrasada ${-n} ${-n === 1 ? 'dia' : 'dias'}`;
  if (n === 0) return 'Vence hoje';
  if (n <= 30) return `Faltam ${n} ${n === 1 ? 'dia' : 'dias'}`;
  return `Até ${format(new Date(iso as string), 'dd/MM/yyyy')}`;
};

// ─── Painel: a estratégia em números ──────────────────────────────────────────────

function DashboardSection({ plan, goals, achievements, partners, evaluations, go }: {
  plan: BusinessPlan; goals: BusinessGoal[]; achievements: Achievement[]; partners: Partner[]; evaluations: PartnerEvaluation[]; go: (k: SectionKey) => void;
}) {
  const { isDark } = useTheme();
  const [monthly, setMonthly] = useState<MonthlyStat[] | null>(null);
  useEffect(() => { fetch('/api/achievements/monthly-stats').then(r => r.json()).then(d => setMonthly(Array.isArray(d) ? d : [])).catch(() => setMonthly([])); }, []);

  const done = goals.filter(g => g.status === 'done').length;
  const atRisk = goals.filter(g => g.status === 'at_risk').length;
  const avg = goals.length ? Math.round(goals.reduce((a, g) => a + (g.progress || 0), 0) / goals.length) : 0;
  const year = new Date().getFullYear();
  const achYear = achievements.filter(a => new Date(a.achievedAt).getFullYear() === year).length;
  const scores = evaluations.filter(e => e.score != null).map(e => e.score as number);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const legal = plan.legalChecklist ?? [];
  const legalDone = legal.filter(i => i.done).length;
  const legalPct = legal.length ? Math.round((legalDone / legal.length) * 100) : 0;

  const byStatus = (['done', 'in_progress', 'at_risk', 'not_started'] as GoalStatus[]).map(k => ({ label: GOAL_STATUS_CONFIG[k].label, value: goals.filter(g => g.status === k).length, color: GOAL_COLORS[k] }));
  const upcoming = goals.filter(g => g.status !== 'done' && g.targetDate).sort((a, b) => new Date(a.targetDate as string).getTime() - new Date(b.targetDate as string).getTime()).slice(0, 5);
  const topGoals = [...goals].filter(g => g.status !== 'done').sort((a, b) => (b.status === 'at_risk' ? 1 : 0) - (a.status === 'at_risk' ? 1 : 0) || b.progress - a.progress).slice(0, 6);
  const latest = [...achievements].sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()).slice(0, 4);
  const swot = [
    { label: 'Forças', n: lines(plan.swotStrengths).length, color: '#15803D' },
    { label: 'Oportunidades', n: lines(plan.swotOpportunities).length, color: '#2563EB' },
    { label: 'Fraquezas', n: lines(plan.swotWeaknesses).length, color: '#C49A2A' },
    { label: 'Ameaças', n: lines(plan.swotThreats).length, color: '#DC2626' },
  ];
  const swotMax = Math.max(1, ...swot.map(x => x.n));
  const partnerGoal = (id: string) => { const g = goals.filter(x => x.scope === 'partner' && x.partnerId === id); return g.length ? Math.round(g.reduce((a, x) => a + x.progress, 0) / g.length) : null; };
  const partnerScore = (id: string) => { const sc = evaluations.filter(e => e.partnerId === id && e.score != null).map(e => e.score as number); return sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null; };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Resumo da estratégia */}
      {(plan.missionText || plan.visionText) && (
        <div className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D1F4E 0%,#1B3A8A 100%)' }}>
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5" />
          <p className="text-[11px] font-black uppercase tracking-widest text-[#C49A2A]">Nossa missão</p>
          <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-white/90 max-w-4xl line-clamp-3">{plan.missionText}</p>
          <button onClick={() => go('identity')} className="mt-3 text-xs font-black text-[#C49A2A] flex items-center gap-1 hover:underline">Ver identidade completa <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard icon={Target} label="Metas concluídas" value={`${done}/${goals.length}`} sub={goals.length ? `${goals.length - done} em aberto` : 'Nenhuma meta ainda'} color="#15803D" />
        <KpiCard icon={TrendingUp} label="Progresso médio" value={`${avg}%`} sub="de todas as metas" color="#2563EB" />
        <KpiCard icon={Flame} label="Metas em risco" value={atRisk} sub={atRisk ? 'pedem atenção' : 'tudo sob controle'} color={atRisk ? '#DC2626' : '#94A3B8'} />
        <KpiCard icon={Trophy} label="Conquistas" value={achievements.length} sub={`${achYear} em ${year}`} color="#C49A2A" />
        <KpiCard icon={Users} label="Sócios" value={partners.length} sub={avgScore ? `Nota média ${avgScore.toFixed(1).replace('.', ',')}` : 'Sem avaliações'} color="#7C3AED" />
        <KpiCard icon={Scale} label="Checklist jurídico" value={`${legalPct}%`} sub={legal.length ? `${legalDone} de ${legal.length} resolvidos` : 'Sem itens'} color="#0891B2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Panel title="Metas por situação" icon={Target} color="#15803D" action={<button onClick={() => go('goals')} className="text-[11px] font-black text-blue-600">Ver metas</button>}>
          {goals.length === 0 ? <p className="text-sm text-slate-400">Cadastre as primeiras metas para ver o gráfico.</p> : (
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <DonutChart items={byStatus} center={`${goals.length ? Math.round((done / goals.length) * 100) : 0}%`} sub="concluído" />
              <ul className="space-y-1.5 text-xs min-w-[140px] flex-1">
                {byStatus.map(i => (
                  <li key={i.label} className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: i.color }} /><span className="flex-1 text-slate-600 dark:text-slate-300">{i.label}</span><b className="text-slate-900 dark:text-white">{i.value}</b></li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Metas em andamento" icon={TrendingUp} color="#2563EB" className="lg:col-span-2" action={<button onClick={() => go('goals')} className="text-[11px] font-black text-blue-600">Ver todas</button>}>
          {topGoals.length === 0 ? <p className="text-sm text-slate-400">Nenhuma meta em andamento.</p> : (
            <div className="space-y-3">
              {topGoals.map(g => (
                <div key={g.id}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{g.title}</span>
                    <span className="font-black flex-shrink-0" style={{ color: GOAL_COLORS[g.status] }}>{g.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 mt-1"><div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: GOAL_COLORS[g.status] }} /></div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{g.scope === 'partner' && g.partner ? g.partner.name : 'Empresa'} · {deadlineText(g.targetDate)}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Panel title="Sócios" icon={Users} color="#7C3AED" action={<button onClick={() => go('partners')} className="text-[11px] font-black text-blue-600">Ver sócios</button>}>
          {partners.length === 0 ? <p className="text-sm text-slate-400">Cadastre os sócios em Sociedade & Lucros.</p> : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-slate-100 dark:bg-white/10">
                {partners.map((p, i) => <div key={p.id} title={`${p.name} ${p.sharePercent}%`} style={{ width: `${p.sharePercent}%`, background: p.color || ['#0D1F4E', '#C49A2A', '#15803D', '#7C3AED'][i % 4] }} />)}
              </div>
              <ul className="space-y-2.5">
                {partners.map((p, i) => {
                  const pg = partnerGoal(p.id), sc = partnerScore(p.id);
                  return (
                    <li key={p.id} className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ background: p.color || ['#0D1F4E', '#C49A2A', '#15803D', '#7C3AED'][i % 4] }}>{p.name[0]?.toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.sharePercent}% · {pg !== null ? `metas ${pg}%` : 'sem metas'}{sc ? ` · nota ${sc.toFixed(1).replace('.', ',')}` : ''}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>

        <Panel title="SWOT em números" icon={Swords} color="#C49A2A" action={<button onClick={() => go('swot')} className="text-[11px] font-black text-blue-600">Ver análise</button>}>
          <div className="space-y-3">
            {swot.map(x => (
              <div key={x.label}>
                <div className="flex justify-between text-xs"><span className="font-bold text-slate-600 dark:text-slate-300">{x.label}</span><b style={{ color: x.color }}>{x.n}</b></div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 mt-1"><div className="h-full rounded-full" style={{ width: `${(x.n / swotMax) * 100}%`, background: x.color }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Próximos prazos" icon={CalendarClock} color="#DC2626" action={<button onClick={() => go('goals')} className="text-[11px] font-black text-blue-600">Metas</button>}>
          {upcoming.length === 0 ? <p className="text-sm text-slate-400">Nenhuma meta com prazo definido.</p> : (
            <ul className="space-y-2.5">
              {upcoming.map(g => {
                const n = daysTo(g.targetDate) ?? 0;
                const color = n < 0 ? '#DC2626' : n <= 30 ? '#C49A2A' : '#64748B';
                return (
                  <li key={g.id} className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-[9px] font-black leading-tight" style={{ background: `${color}18`, color }}>
                      <span>{format(new Date(g.targetDate as string), 'dd')}</span><span className="uppercase">{format(new Date(g.targetDate as string), 'MMM')}</span>
                    </span>
                    <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{g.title}</p><p className="text-[10px] font-semibold" style={{ color }}>{deadlineText(g.targetDate)}</p></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Panel title="Últimas conquistas" icon={Trophy} color="#C49A2A" className="lg:col-span-1" action={<button onClick={() => go('achievements')} className="text-[11px] font-black text-blue-600">Ver todas</button>}>
          {latest.length === 0 ? <p className="text-sm text-slate-400">Registre os marcos importantes da Develoi.</p> : (
            <ul className="space-y-3">
              {latest.map(a => (
                <li key={a.id} className="flex gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Gem className="w-4 h-4" /></span>
                  <div className="min-w-0"><p className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-2">{a.title}</p><p className="text-[10px] text-slate-400">{format(new Date(a.achievedAt), 'dd/MM/yyyy')}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {monthly && monthly.length > 0 ? (
            <>
              <MonthlyBarChart title="Clientes novos por mês" color="#2a78d6" data={monthly} values={monthly.map(d => d.newClients)} isDark={isDark} />
              <MonthlyBarChart title="Contatos feitos por mês" color="#eb6834" data={monthly} values={monthly.map(d => d.contacts)} isDark={isDark} />
            </>
          ) : <Panel title="Crescimento" icon={TrendingUp} color="#2563EB" className="sm:col-span-2"><p className="text-sm text-slate-400">Os gráficos de clientes novos e contatos aparecem aqui quando houver dados.</p></Panel>}
        </div>
      </div>
    </div>
  );
}

// ─── Visão Geral ───────────────────────────────────────────────────────────────

const SWOT_CONFIG = {
  swotStrengths:     { label: 'Forças',         icon: Star,         color: '#15803D', bg: 'rgba(21,128,61,0.06)',  border: 'rgba(21,128,61,0.25)' },
  swotWeaknesses:    { label: 'Fraquezas',      icon: AlertTriangle, color: '#C49A2A', bg: 'rgba(196,154,42,0.08)', border: 'rgba(196,154,42,0.3)' },
  swotOpportunities: { label: 'Oportunidades',  icon: Compass,      color: '#2563EB', bg: 'rgba(37,99,235,0.06)',  border: 'rgba(37,99,235,0.25)' },
  swotThreats:       { label: 'Ameaças',        icon: ShieldCheck,  color: '#DC2626', bg: 'rgba(220,38,38,0.06)',  border: 'rgba(220,38,38,0.25)' },
} as const;

// Texto corrido, com listas ("- item") e subtítulos ("TÍTULO:") bem separados, em vez de uma parede de texto
function RichText({ text, isDark }: { text: string; isDark: boolean }) {
  const color = isDark ? 'rgba(255,255,255,0.86)' : '#334155';
  type Block = { kind: 'p' | 'h' | 'ul'; lines: string[] };
  const blocks: Block[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { blocks.push({ kind: 'p', lines: [] }); continue; } // linha em branco: fecha o bloco atual
    const bullet = /^([-•*])\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last && last.kind === 'ul') last.lines.push(bullet[2]); else blocks.push({ kind: 'ul', lines: [bullet[2]] });
    } else if (/^[A-ZÀ-Ú0-9 ()\/&,.\-]{6,}:?(\s*\(.*\):?)?$/.test(line) && line === line.toUpperCase() || /^[^.!?]{3,70}:$/.test(line)) {
      blocks.push({ kind: 'h', lines: [line.replace(/:$/, '')] });
    } else if (last && last.kind === 'p' && last.lines.length) last.lines.push(line);
    else blocks.push({ kind: 'p', lines: [line] });
  }
  return (
    <div className="space-y-3 text-sm leading-relaxed" style={{ color }}>
      {blocks.filter(b => b.lines.length).map((b, i) =>
        b.kind === 'ul' ? (
          <ul key={i} className="space-y-1.5">
            {b.lines.map((l, k) => (
              <li key={k} className="flex items-start gap-2.5"><span className="w-1.5 h-1.5 rounded-full mt-[9px] flex-shrink-0 bg-slate-300 dark:bg-white/30" /><span className="min-w-0 break-words">{l}</span></li>
            ))}
          </ul>
        ) : b.kind === 'h' ? (
          <p key={i} className="pt-1 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 break-words">{b.lines[0]}</p>
        ) : (
          <p key={i} className="break-words">{b.lines.join(' ')}</p>
        ))}
    </div>
  );
}

function InfoBlock({ icon: Icon, label, text, color, isDark, className = '' }: { icon: any; label: string; text?: string | null; color: string; isDark: boolean; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm p-5 sm:p-6 ${className}`} style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h4 className="text-xs font-black uppercase tracking-widest" style={{ color }}>{label}</h4>
      </div>
      {text ? <RichText text={text} isDark={isDark} /> : <p className="text-sm text-slate-400 italic">Ainda não preenchido.</p>}
    </section>
  );
}

function SwotQuadrant({ field, text, isDark }: { field: keyof typeof SWOT_CONFIG; text?: string | null; isDark: boolean }) {
  const cfg = SWOT_CONFIG[field];
  const items = (text || '').split('\n').map(s => s.trim()).filter(Boolean);
  return (
    <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-center gap-2 mb-3">
        <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</p>
        <span className="ml-auto text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color }}>{items.length}</span>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-snug" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : '#334155' }}>
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: cfg.color }} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 italic">Ainda não preenchido.</p>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, onEdit, editLabel }: { title: string; subtitle?: string; onEdit: () => void; editLabel: string }) {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-base font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <Button size="sm" variant="outline" className="self-start sm:self-auto" iconLeft={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit}>{editLabel}</Button>
    </div>
  );
}

function IdentitySection({ plan, onSaved }: { plan: BusinessPlan; onSaved: () => void }) {
  const { isDark } = useTheme();
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      <SectionHeader title="Quem somos" subtitle="Missão, visão, valores, público e como a Develoi ganha dinheiro" onEdit={() => setEditing(true)} editLabel="EDITAR IDENTIDADE" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-start">
        <InfoBlock icon={Compass} label="Missão" text={plan.missionText} color="#0D1F4E" isDark={isDark} />
        <InfoBlock icon={Target} label="Visão" text={plan.visionText} color="#2563EB" isDark={isDark} />
        <InfoBlock icon={Star} label="Valores" text={plan.valuesText} color="#C49A2A" isDark={isDark} className="md:col-span-2 xl:col-span-1" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        <InfoBlock icon={Users} label="Mercado-Alvo / Público" text={plan.targetMarket} color="#15803D" isDark={isDark} />
        <InfoBlock icon={Trophy} label="Modelo de Negócio" text={plan.businessModel} color="#7C3AED" isDark={isDark} className="lg:col-span-2" />
      </div>
      {editing && <OverviewEditModal plan={plan} initialTab="identity" onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); onSaved(); }} />}
    </div>
  );
}

function SwotSection({ plan, onSaved }: { plan: BusinessPlan; onSaved: () => void }) {
  const { isDark } = useTheme();
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      <SectionHeader title="Análise SWOT" subtitle="Forças e fraquezas (de dentro) · Oportunidades e ameaças (de fora)" onEdit={() => setEditing(true)} editLabel="EDITAR SWOT" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <SwotQuadrant field="swotStrengths" text={plan.swotStrengths} isDark={isDark} />
        <SwotQuadrant field="swotWeaknesses" text={plan.swotWeaknesses} isDark={isDark} />
        <SwotQuadrant field="swotOpportunities" text={plan.swotOpportunities} isDark={isDark} />
        <SwotQuadrant field="swotThreats" text={plan.swotThreats} isDark={isDark} />
      </div>
      <InfoBlock icon={CheckCircle2} label="Conclusão da análise: o que isso significa na prática" text={plan.swotConclusion} color="#0D1F4E" isDark={isDark} />
      {editing && <OverviewEditModal plan={plan} initialTab="swot" onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); onSaved(); }} />}
    </div>
  );
}

function HistoryModal({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();
  const [history, setHistory] = useState<BusinessPlanHistoryEntry[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/business-plan/history').then(r => r.json()).then(setHistory).catch(() => setHistory([]));
  }, []);

  return (
    <Modal isOpen={true} onClose={onClose} title="Histórico de Alterações do Plano" size="lg">
      {history === null ? (
        <div className="text-center py-10 text-slate-400">Carregando...</div>
      ) : history.length === 0 ? (
        <EmptyState icon={History} title="Nenhuma alteração registrada ainda" description="Assim que alguém editar o plano, aparece aqui quem mudou, o quê e quando." />
      ) : (
        <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
          {history.map(h => {
            const open = openId === h.id;
            return (
              <div key={h.id} className="rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : h.id)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                      {h.changedByName || 'Alguém'} <span className="font-medium text-slate-400">alterou {h.changes.map(c => c.label).join(', ')}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{format(new Date(h.changedAt), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-slate-300 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>
                {open && (
                  <div className="px-3.5 pb-3.5 space-y-3">
                    {h.changes.map((c, i) => (
                      <div key={i} className="text-xs">
                        <p className="font-black mb-1" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{c.label}</p>
                        {c.before === null && c.after === null ? (
                          <p className="text-slate-400 italic">Lista de itens alterada.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10">
                              <p className="text-[9px] font-black uppercase tracking-wider text-rose-500 mb-1">Antes</p>
                              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{c.before || '—'}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1">Depois</p>
                              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{c.after || '—'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function OverviewEditModal({ plan, initialTab = 'identity', onClose, onSuccess }: { plan: BusinessPlan; initialTab?: 'identity' | 'market' | 'swot'; onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const { show: toast } = useToast();
  const [form, setForm] = useState({
    missionText: plan.missionText || '', visionText: plan.visionText || '', valuesText: plan.valuesText || '',
    targetMarket: plan.targetMarket || '', businessModel: plan.businessModel || '',
    swotStrengths: plan.swotStrengths || '', swotWeaknesses: plan.swotWeaknesses || '',
    swotOpportunities: plan.swotOpportunities || '', swotThreats: plan.swotThreats || '',
    swotConclusion: plan.swotConclusion || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/business-plan', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, updatedByName: profile?.displayName }),
      });
      if (!res.ok) throw new Error();
      toast('Plano de negócio atualizado', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const [tab, setTab] = useState<'identity' | 'market' | 'swot'>(initialTab);
  const TABS: { id: typeof tab; label: string; hint: string; keys: (keyof typeof form)[] }[] = [
    { id: 'identity', label: 'Identidade', hint: 'Missão, visão e valores', keys: ['missionText', 'visionText', 'valuesText'] },
    { id: 'market', label: 'Mercado e modelo', hint: 'Quem atendemos e como ganhamos dinheiro', keys: ['targetMarket', 'businessModel'] },
    { id: 'swot', label: 'Análise SWOT', hint: 'Forças, fraquezas, oportunidades e ameaças', keys: ['swotStrengths', 'swotWeaknesses', 'swotOpportunities', 'swotThreats', 'swotConclusion'] },
  ];
  const idx = TABS.findIndex(t => t.id === tab);
  const filled = (t: typeof TABS[number]) => t.keys.filter(k => form[k].trim()).length;

  const field = (k: keyof typeof form, label: string, placeholder: string, rows = 8) => (
    <Textarea key={k} label={label} value={form[k]} onChange={set(k)} rows={rows} placeholder={placeholder} className="leading-relaxed" />
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar Visão Geral" size="2xl"
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          {idx > 0 && <Button type="button" variant="outline" onClick={() => setTab(TABS[idx - 1].id)}>VOLTAR</Button>}
          {idx < TABS.length - 1 && <Button type="button" variant="outline" onClick={() => setTab(TABS[idx + 1].id)}>PRÓXIMA ABA</Button>}
          <Button type="submit" form="overview-form" loading={saving} className="sm:ml-auto" size="lg" iconLeft={<Save className="w-4 h-4" />}>SALVAR PLANO</Button>
        </div>
      }>
      <form id="overview-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
          {TABS.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className="px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap flex-shrink-0 border transition-colors"
              style={tab === t.id ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E' } : { color: '#64748B', borderColor: 'rgba(148,163,184,0.35)' }}>
              {t.label} <span className="opacity-70 font-bold">· {filled(t)}/{t.keys.length}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">{TABS[idx].hint}. Dica: comece a linha com <b>-</b> para fazer uma lista e use um título terminado em <b>:</b> para separar partes.</p>

        {tab === 'identity' && (
          <div className="space-y-4">
            {field('missionText', 'Missão', 'Por que a Develoi existe?', 6)}
            {field('visionText', 'Visão', 'Onde queremos chegar?', 6)}
            {field('valuesText', 'Valores', 'O que guia nossas decisões? (um valor por linha)', 8)}
          </div>
        )}
        {tab === 'market' && (
          <div className="space-y-4">
            {field('targetMarket', 'Mercado-alvo / público', 'Quem são nossos clientes ideais?', 6)}
            {field('businessModel', 'Modelo de negócio', 'Como a Develoi ganha dinheiro (projetos, assinaturas...)', 14)}
          </div>
        )}
        {tab === 'swot' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('swotStrengths', 'Forças', 'O que fazemos bem? (uma por linha)', 9)}
              {field('swotWeaknesses', 'Fraquezas', 'Onde precisamos melhorar?', 9)}
              {field('swotOpportunities', 'Oportunidades', 'O que podemos aproveitar no mercado?', 9)}
              {field('swotThreats', 'Ameaças', 'O que pode atrapalhar o crescimento?', 9)}
            </div>
            {field('swotConclusion', 'Conclusão da Análise SWOT', 'O que esses pontos significam na prática? O que a empresa deve priorizar a partir disso?', 5)}
          </div>
        )}
      </form>
    </Modal>
  );
}

// ─── Metas ─────────────────────────────────────────────────────────────────────

function GoalsSection({ goals, partners, onRefresh }: { goals: BusinessGoal[]; partners: Partner[]; onRefresh: () => void }) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const [filterScope, setFilterScope] = useState<'all' | GoalScope>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | GoalStatus>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = goals
    .filter(g => (filterScope === 'all' || g.scope === filterScope) && (filterStatus === 'all' || g.status === filterStatus))
    .sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || (a.targetDate ? new Date(a.targetDate).getTime() : Infinity) - (b.targetDate ? new Date(b.targetDate).getTime() : Infinity));
  const statusCount = (k: GoalStatus) => goals.filter(g => g.status === k).length;
  const avg = goals.length ? Math.round(goals.reduce((a, g) => a + (g.progress || 0), 0) / goals.length) : 0;

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
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <RingChart value={avg} size={72} stroke={9} color="#2563EB" />
          <div>
            <h3 className="text-base font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Metas</h3>
            <p className="text-xs text-slate-400">{goals.length} no total · {statusCount('done')} concluídas · progresso médio de {avg}%</p>
          </div>
        </div>
        <Button size="sm" className="self-start lg:self-auto" iconLeft={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA META</Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {([['all', 'Todas', goals.length, '#0D1F4E'], ...(['in_progress', 'at_risk', 'not_started', 'done'] as GoalStatus[]).map(k => [k, GOAL_STATUS_CONFIG[k].label, statusCount(k), GOAL_COLORS[k]])] as [string, string, number, string][]).map(([v, l, n, c]) => (
          <button key={v} onClick={() => setFilterStatus(v as any)} className="px-3 py-1.5 rounded-full text-xs font-black border whitespace-nowrap"
            style={filterStatus === v ? { background: c, color: '#fff', borderColor: c } : { color: c, borderColor: `${c}55`, background: `${c}10` }}>{l} · {n}</button>
        ))}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5 ml-auto">
          {([['all', 'Todas'], ['company', 'Empresa'], ['partner', 'Sócios']] as [string, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setFilterScope(v as any)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${filterScope === v ? 'bg-white dark:bg-white/15 shadow-sm' : 'text-slate-500'}`}
              style={filterScope === v ? { color: isDark ? '#fff' : '#0D1F4E' } : undefined}>{l}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Target} title="Nenhuma meta aqui" description="Defina metas para a empresa ou para um sócio específico." action={<Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA META</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence>
            {filtered.map(g => {
              const statusCfg = GOAL_STATUS_CONFIG[g.status], color = GOAL_COLORS[g.status];
              const n = daysTo(g.targetDate);
              const late = g.status !== 'done' && n !== null && n < 0;
              return (
                <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-4 flex flex-col gap-3 min-w-0" style={{ borderTop: `3px solid ${color}` }}>
                  <div className="flex items-start gap-3">
                    <RingChart value={g.progress} size={56} stroke={7} color={color} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black leading-snug break-words" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{g.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{g.scope === 'partner' && g.partner ? `Sócio: ${g.partner.name}` : 'Meta da empresa'}</p>
                    </div>
                    <RowMenu items={[
                      { label: 'Editar', icon: Edit2, onClick: () => { setEditing(g); setIsFormOpen(true); } },
                      { label: 'Remover', icon: Trash2, onClick: () => setDeletingId(g.id), danger: true },
                    ]} />
                  </div>
                  {g.description && <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-3">{g.description}</p>}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                    <Badge color={statusCfg.color} size="sm" pill>{statusCfg.label}</Badge>
                    <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: late ? '#DC2626' : '#94A3B8' }}><CalendarClock className="w-3 h-3" />{deadlineText(g.targetDate, g.status === 'done')}</span>
                  </div>
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

const MONTH_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthLabel = (ym: string) => { const [y, m] = ym.split('-'); return `${MONTH_ABBR[Number(m) - 1]}/${y.slice(2)}`; };

function MonthlyBarChart({ title, color, data, values, isDark }: { title: string; color: string; data: MonthlyStat[]; values: number[]; isDark: boolean }) {
  const max = Math.max(1, ...values);
  const W = 600, H = 170, padX = 10, padBottom = 24, padTop = 18;
  const bw = (W - padX * 2) / data.length;
  const barW = bw * 0.56;
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 sm:p-5 min-w-0">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{title}</p>
        <p className="text-[11px] font-bold text-slate-400">{total} nos últimos 12 meses</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={padX} x2={W - padX} y1={padTop + (H - padTop - padBottom) * (1 - f)} y2={padTop + (H - padTop - padBottom) * (1 - f)}
            stroke={isDark ? '#2c2c2a' : '#e1e0d9'} strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const v = values[i];
          const x = padX + i * bw;
          const barH = (v / max) * (H - padTop - padBottom);
          const y = H - padBottom - barH;
          return (
            <g key={d.month}>
              <rect x={x + (bw - barW) / 2} y={y} width={barW} height={Math.max(barH, v > 0 ? 2 : 0)} rx={4} fill={color}>
                <title>{monthLabel(d.month)}: {v}</title>
              </rect>
              {v > 0 && (
                <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="800" fill={isDark ? '#fff' : '#0D1F4E'}>{v}</text>
              )}
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="8" fontWeight="700" fill="#94A3B8">{monthLabel(d.month)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AchievementsSection({ achievements, onRefresh }: { achievements: Achievement[]; onRefresh: () => void }) {
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[] | null>(null);

  useEffect(() => {
    fetch('/api/achievements/monthly-stats').then(r => r.json()).then(setMonthlyStats).catch(() => setMonthlyStats([]));
  }, []);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-700 flex-shrink-0"><Trophy className="w-6 h-6" /></span>
          <div className="min-w-0">
            <h3 className="text-base font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Conquistas</h3>
            <p className="text-xs text-slate-400">{achievements.length} marcos registrados{achievements[0] ? ` · o último foi em ${format(new Date(achievements[0].achievedAt), 'dd/MM/yyyy')}` : ''}</p>
          </div>
        </div>
        <Button size="sm" className="self-start sm:self-auto" iconLeft={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA CONQUISTA</Button>
      </div>

      {monthlyStats && monthlyStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthlyBarChart title="Clientes novos por mês" color="#2a78d6" data={monthlyStats} values={monthlyStats.map(d => d.newClients)} isDark={isDark} />
          <MonthlyBarChart title="Contatos feitos por mês" color="#eb6834" data={monthlyStats} values={monthlyStats.map(d => d.contacts)} isDark={isDark} />
        </div>
      )}

      {achievements.length === 0 ? (
        <EmptyState icon={Trophy} title="Nenhuma conquista registrada" description="Marque aqui os marcos importantes da Develoi." action={<Button onClick={() => { setEditing(null); setIsFormOpen(true); }}>NOVA CONQUISTA</Button>} />
      ) : (
        <div className="relative pl-6 space-y-5">
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-white/10" />
          {achievements.map(a => (
            <div key={a.id} className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900" style={{ background: '#C49A2A' }} />
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-4 flex items-start justify-between gap-3" style={{ borderLeft: '4px solid #C49A2A' }}>
                {a.photoUrl && (
                  <img src={a.photoUrl} alt={a.title} className="w-16 h-16 rounded-lg object-cover border border-slate-200/60 dark:border-white/10 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
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
  const { isDark } = useTheme();
  const { show: toast } = useToast();
  const [title, setTitle] = useState(achievement?.title || '');
  const [description, setDescription] = useState(achievement?.description || '');
  const [photoUrl, setPhotoUrl] = useState(achievement?.photoUrl || '');
  const [achievedAt, setAchievedAt] = useState(achievement?.achievedAt ? achievement.achievedAt.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => { setPhotoUrl(reader.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(achievement ? `/api/achievements/${achievement.id}` : '/api/achievements', {
        method: achievement ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, photoUrl, achievedAt }),
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
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-20 h-20 rounded-xl object-cover border-2" style={{ borderColor: '#C49A2A' }} />
            ) : (
              <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                <Trophy className="w-7 h-7 text-slate-300" />
              </div>
            )}
            {photoUrl && (
              <button type="button" onClick={() => setPhotoUrl('')} className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button type="button" variant="outline" size="sm" disabled={uploading} iconLeft={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} onClick={() => fileRef.current?.click()}>
              {photoUrl ? 'TROCAR FOTO' : 'ADICIONAR FOTO'}
            </Button>
          </div>
        </div>
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

  const act = partners.filter(p => p.active);
  const palette = ['#0D1F4E', '#C49A2A', '#15803D', '#7C3AED', '#DC2626', '#0891B2'];
  return (
    <div className="space-y-4">
      {act.length > 0 && (
        <Panel title="Participação na sociedade" icon={Users} color="#7C3AED">
          <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10">
            {act.map((p, i) => <div key={p.id} title={`${p.name} ${p.sharePercent}%`} style={{ width: `${p.sharePercent}%`, background: p.color || palette[i % palette.length] }} />)}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
            {act.map((p, i) => <span key={p.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><i className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || palette[i % palette.length] }} /><b>{p.name}</b> {p.sharePercent}%</span>)}
          </div>
        </Panel>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
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
                  <p className="text-[11px] text-slate-400">
                    {p.role || 'Sócio'} · {p.sharePercent}% da sociedade
                    {p.birthDate && ` · 🎂 ${format(new Date(p.birthDate), 'dd/MM')}`}
                  </p>
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
      </div>

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
  const [birthDate, setBirthDate] = useState<string | null>(partner.birthDate ? partner.birthDate.slice(0, 10) : null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/partners/${partner.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ responsibilities: text, birthDate }),
      });
      if (!res.ok) throw new Error();
      toast('Informações atualizadas', 'success');
      onSuccess();
    } catch {
      toast('Não deu para salvar agora. Tente de novo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Informações de ${partner.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Textarea label="O que esse sócio é responsável por fazer na função dele" value={text} onChange={e => setText(e.target.value)} rows={8} placeholder="Ex: Cuidar do desenvolvimento técnico, decidir arquitetura dos sistemas, atender chamados críticos..." />
        <div className="flex flex-col gap-1.5">
          <label className="ds-label">Data de aniversário</label>
          <DatePicker value={birthDate} onChange={setBirthDate} />
          <p className="text-[11px] text-slate-400">Quem tiver o aviso de aniversário ativado recebe um lembrete no WhatsApp no dia.</p>
        </div>
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

      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-4 mb-4">
          <RingChart value={checklist.length ? (doneCount / checklist.length) * 100 : 0} size={72} stroke={9} color="#0891B2" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>Checklist jurídico</p>
            <p className="text-xs text-slate-400">{doneCount} de {checklist.length} itens resolvidos</p>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 mt-2"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${checklist.length ? (doneCount / checklist.length) * 100 : 0}%` }} /></div>
          </div>
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
