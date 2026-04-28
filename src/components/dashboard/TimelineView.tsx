import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Loader2, ArrowRight,
  Play, CheckCircle2, Archive,
} from 'lucide-react';
import {
  format, addDays, addWeeks, addMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  differenceInDays, isSameDay, isWithinInterval,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { EmptyState } from '../ui';
import type { Feature, Sprint } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

type ZoomLevel = 'day' | 'week' | 'month';

interface GanttRow {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  depth: 0 | 1;
  status: string;
  hasChildren: boolean;
}

const SPRINT_COLORS: Record<string, string> = {
  active:    '#6366f1',
  planned:   '#94a3b8',
  completed: '#10b981',
};
const TYPE_COLORS: Record<string, string> = {
  bug: '#ef4444', story: '#10b981', epic: '#8b5cf6', task: '#6366f1',
};

const ROW_H    = 48;
const LABEL_W  = 256;
const HDR_H    = 72;  // double-row header
const COL_W    = { day: 36, week: 90, month: 100 };

// ─── GanttHeader ─────────────────────────────────────────────────────────────
// Double-row header: top row groups (month / quarter / year), bottom row units

function GanttHeader({ zoom, columns, colW }: { zoom: ZoomLevel; columns: Date[]; colW: number }) {
  const today = new Date();

  if (zoom === 'day') {
    // Top row: month groups  |  Bottom row: day number + weekday letter
    // Build month groups
    const groups: { label: string; count: number }[] = [];
    for (const col of columns) {
      const label = format(col, 'MMM yyyy', { locale: ptBR });
      if (!groups.length || groups[groups.length - 1].label !== label) {
        groups.push({ label, count: 1 });
      } else {
        groups[groups.length - 1].count++;
      }
    }
    return (
      <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 select-none"
        style={{ height: HDR_H }}>
        {/* Top: months */}
        <div className="flex border-b border-slate-200" style={{ height: HDR_H / 2 }}>
          {groups.map((g, i) => (
            <div key={i} style={{ width: g.count * colW, minWidth: g.count * colW }}
              className="flex-shrink-0 flex items-center px-2 border-r border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 capitalize truncate">
                {g.label}
              </span>
            </div>
          ))}
        </div>
        {/* Bottom: days */}
        <div className="flex" style={{ height: HDR_H / 2 }}>
          {columns.map((col, i) => {
            const active = isToday(col);
            const dow = col.getDay(); // 0=Sun,1=Mon,...,6=Sat
            const isWeekend = dow === 0 || dow === 6;
            return (
              <div key={i} style={{ width: colW, minWidth: colW }}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100',
                  active ? 'bg-indigo-50' : isWeekend ? 'bg-slate-50' : ''
                )}>
                <span className={cn('text-[8px] font-bold leading-none',
                  active ? 'text-indigo-400' : isWeekend ? 'text-slate-300' : 'text-slate-400')}>
                  {['D','S','T','Q','Q','S','S'][dow]}
                </span>
                <span className={cn('text-[11px] font-black leading-none mt-0.5',
                  active
                    ? 'w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]'
                    : isWeekend ? 'text-slate-400' : 'text-slate-700')}>
                  {format(col, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (zoom === 'week') {
    // Top: month groups  |  Bottom: "Sem N · dd/MM"
    const groups: { label: string; count: number }[] = [];
    for (const col of columns) {
      const label = format(col, 'MMM yyyy', { locale: ptBR });
      if (!groups.length || groups[groups.length - 1].label !== label) {
        groups.push({ label, count: 1 });
      } else {
        groups[groups.length - 1].count++;
      }
    }
    return (
      <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 select-none"
        style={{ height: HDR_H }}>
        <div className="flex border-b border-slate-200" style={{ height: HDR_H / 2 }}>
          {groups.map((g, i) => (
            <div key={i} style={{ width: g.count * colW, minWidth: g.count * colW }}
              className="flex-shrink-0 flex items-center px-2 border-r border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 capitalize truncate">
                {g.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex" style={{ height: HDR_H / 2 }}>
          {columns.map((col, i) => {
            const active = isWithinInterval(today, { start: col, end: endOfWeek(col, { weekStartsOn: 1 }) });
            return (
              <div key={i} style={{ width: colW, minWidth: colW }}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100',
                  active ? 'bg-indigo-50' : ''
                )}>
                <span className={cn('text-[9px] font-black uppercase tracking-widest leading-none',
                  active ? 'text-indigo-500' : 'text-slate-400')}>
                  S{format(col, 'w')}
                </span>
                <span className={cn('text-[11px] font-black leading-none mt-0.5',
                  active ? 'text-indigo-700' : 'text-slate-600')}>
                  {format(col, 'dd/MM')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // zoom === 'month'
  // Top: year groups  |  Bottom: month abbreviation
  const groups: { label: string; count: number }[] = [];
  for (const col of columns) {
    const label = format(col, 'yyyy');
    if (!groups.length || groups[groups.length - 1].label !== label) {
      groups.push({ label, count: 1 });
    } else {
      groups[groups.length - 1].count++;
    }
  }
  return (
    <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 select-none"
      style={{ height: HDR_H }}>
      <div className="flex border-b border-slate-200" style={{ height: HDR_H / 2 }}>
        {groups.map((g, i) => (
          <div key={i} style={{ width: g.count * colW, minWidth: g.count * colW }}
            className="flex-shrink-0 flex items-center px-3 border-r border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{g.label}</span>
          </div>
        ))}
      </div>
      <div className="flex" style={{ height: HDR_H / 2 }}>
        {columns.map((col, i) => {
          const active = isSameDay(startOfMonth(col), startOfMonth(today));
          return (
            <div key={i} style={{ width: colW, minWidth: colW }}
              className={cn(
                'flex-shrink-0 flex items-center justify-center border-r border-slate-100',
                active ? 'bg-indigo-50' : ''
              )}>
              <span className={cn('text-xs font-black capitalize',
                active ? 'text-indigo-700' : 'text-slate-600')}>
                {format(col, 'MMM', { locale: ptBR })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimelineView({ projectId }: { projectId: string }) {
  const [sprints,  setSprints]  = useState<Sprint[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [zoom,     setZoom]     = useState<ZoomLevel>('week');
  const [viewStart, setViewStart] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Sync scroll: left panel scrolls vertically, right panel scrolls both
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncing  = useRef(false);

  const onRightScroll = () => {
    if (syncing.current) return;
    syncing.current = true;
    if (leftRef.current && rightRef.current)
      leftRef.current.scrollTop = rightRef.current.scrollTop;
    syncing.current = false;
  };
  const onLeftScroll = () => {
    if (syncing.current) return;
    syncing.current = true;
    if (leftRef.current && rightRef.current)
      rightRef.current.scrollTop = leftRef.current.scrollTop;
    syncing.current = false;
  };

  useEffect(() => {
    (async () => {
      try {
        const [fr, sr] = await Promise.all([
          fetch(`/api/projects/${projectId}/features`),
          fetch(`/api/projects/${projectId}/sprints`),
        ]);
        setFeatures(await fr.json());
        setSprints(await sr.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [projectId]);

  const colW   = COL_W[zoom];
  const viewEnd = useMemo(() => {
    if (zoom === 'day')   return addDays(viewStart, 60);
    if (zoom === 'week')  return addWeeks(viewStart, 20);
    return addMonths(viewStart, 12);
  }, [viewStart, zoom]);

  const columns = useMemo(() => {
    if (zoom === 'day')   return eachDayOfInterval({ start: viewStart, end: viewEnd });
    if (zoom === 'week')  return eachWeekOfInterval({ start: viewStart, end: viewEnd }, { weekStartsOn: 1 });
    return eachMonthOfInterval({ start: viewStart, end: viewEnd });
  }, [viewStart, viewEnd, zoom]);

  const totalW = columns.length * colW;

  // Convert date → pixel X
  const dateX = useCallback((date: Date): number => {
    if (zoom === 'day') return differenceInDays(date, viewStart) * colW;
    if (zoom === 'week') {
      const ws  = startOfWeek(date, { weekStartsOn: 1 });
      const idx = columns.findIndex(c => isSameDay(c, ws));
      const i   = idx >= 0 ? idx : differenceInDays(date, viewStart) / 7;
      return i * colW + (differenceInDays(date, idx >= 0 ? ws : viewStart) / 7) * colW;
    }
    const ms  = startOfMonth(date);
    const idx = columns.findIndex(c => isSameDay(startOfMonth(c), ms));
    const i   = idx >= 0 ? idx : differenceInDays(date, viewStart) / 30;
    const dim = differenceInDays(endOfMonth(date), ms) + 1;
    const dIM = differenceInDays(date, idx >= 0 ? ms : viewStart);
    return i * colW + (dIM / dim) * colW;
  }, [zoom, viewStart, columns, colW]);

  // Build flat visible rows
  const rows = useMemo<GanttRow[]>(() => {
    const result: GanttRow[] = [];
    const sorted = [...sprints].sort((a, b) =>
      ({ active: 0, planned: 1, completed: 2 }[a.status] ?? 1) -
      ({ active: 0, planned: 1, completed: 2 }[b.status] ?? 1)
    );

    for (const sprint of sorted) {
      const sf    = features.filter(f => f.sprintId === sprint.id);
      const start = sprint.startDate ? new Date(sprint.startDate) : new Date();
      const end   = sprint.endDate   ? new Date(sprint.endDate)   : addDays(start, 14);
      const done  = sf.filter(f => f.status === 'done').length;
      const pts   = sf.reduce((a, f) => a + (f.points || 0), 0);

      result.push({
        id: sprint.id, depth: 0, hasChildren: sf.length > 0,
        label: sprint.name,
        sublabel: `${sf.length} ${sf.length === 1 ? 'ticket' : 'tickets'} · ${pts} pts`,
        color: SPRINT_COLORS[sprint.status] ?? '#6366f1',
        startDate: start, endDate: end,
        progress: sf.length ? Math.round((done / sf.length) * 100) : 0,
        status: sprint.status,
      });

      if (expanded.has(sprint.id)) {
        for (const f of sf) {
          const fs = f.deadline ? addDays(new Date(f.deadline), -3) : start;
          const fe = f.deadline ? new Date(f.deadline) : end;
          result.push({
            id: f.id, depth: 1, hasChildren: false,
            label: f.title, sublabel: f.key || '',
            color: TYPE_COLORS[f.type || 'task'],
            startDate: fs < start ? start : fs,
            endDate:   fe > end   ? end   : fe,
            progress: f.status === 'done' ? 100 : f.status === 'in-progress' ? 50 : f.status === 'testing' ? 75 : 0,
            status: f.status,
          });
        }
      }
    }
    return result;
  }, [sprints, features, expanded]);

  const todayX    = dateX(new Date());
  const showToday = todayX >= 0 && todayX <= totalW;

  const navigate = (dir: 1 | -1) => {
    if (zoom === 'day')   setViewStart(d => addDays(d, dir * 14));
    if (zoom === 'week')  setViewStart(d => addWeeks(d, dir * 6));
    if (zoom === 'month') setViewStart(d => addMonths(d, dir * 4));
  };

  const goToday = () => {
    const d = new Date();
    if (zoom === 'day')   { setViewStart(addDays(d, -7)); }
    if (zoom === 'week')  { setViewStart(startOfWeek(addWeeks(d, -2), { weekStartsOn: 1 })); }
    if (zoom === 'month') { setViewStart(startOfMonth(addMonths(d, -1))); }
    setTimeout(() => {
      if (rightRef.current) rightRef.current.scrollLeft = Math.max(0, dateX(d) - 200);
    }, 50);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Carregando...</p>
    </div>
  );

  if (sprints.length === 0) return (
    <EmptyState icon={Calendar} title="Sem sprints para exibir"
      description="Crie sprints com datas no Backlog para visualizá-las aqui." className="py-40" />
  );

  const bodyH = rows.length * ROW_H;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm px-5 py-3.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow shadow-indigo-200">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 tracking-tight leading-none">Cronograma</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gantt</p>
          </div>
        </div>

        {/* Zoom selector */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl">
          {(['day', 'week', 'month'] as ZoomLevel[]).map(z => (
            <button key={z} onClick={() => setZoom(z)}
              className={cn('px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                zoom === z ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}>
              {z === 'day' ? 'Dia' : z === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 text-[11px] font-black uppercase tracking-widest transition-all">
            Hoje
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3">
          {[
            { color: SPRINT_COLORS.active,    label: 'Sprint Ativa' },
            { color: SPRINT_COLORS.planned,   label: 'Planejada' },
            { color: SPRINT_COLORS.completed, label: 'Concluída' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] font-bold text-slate-400">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gantt table ── */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex" style={{ height: Math.min(bodyH + HDR_H + 2, 600) }}>

          {/* Left: labels panel */}
          <div className="flex-shrink-0 flex flex-col border-r border-slate-200 bg-white"
            style={{ width: LABEL_W }}>

            {/* Header cell */}
            <div className="flex-shrink-0 flex items-center px-4 bg-slate-50 border-b border-slate-200"
              style={{ height: HDR_H }}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sprint / Tarefa</span>
            </div>

            {/* Scrollable label rows (synced) */}
            <div ref={leftRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
              style={{ scrollbarWidth: 'none' }}
              onScroll={onLeftScroll}>
              {rows.map((row, i) => (
                <div
                  key={row.id + i}
                  style={{ height: ROW_H }}
                  className={cn(
                    'flex items-center gap-2 px-3 border-b border-slate-100 select-none',
                    row.depth === 0 ? 'bg-slate-50/70' : 'bg-white',
                    row.depth === 0 && row.hasChildren ? 'cursor-pointer hover:bg-indigo-50/50' : ''
                  )}
                  onClick={() => {
                    if (row.depth === 0 && row.hasChildren) {
                      setExpanded(prev => {
                        const n = new Set(prev);
                        n.has(row.id) ? n.delete(row.id) : n.add(row.id);
                        return n;
                      });
                    }
                  }}
                >
                  {/* Indent & expand arrow */}
                  {row.depth === 0 && (
                    <ArrowRight className={cn(
                      'w-3.5 h-3.5 shrink-0 transition-transform text-slate-400',
                      row.hasChildren ? '' : 'opacity-0',
                      expanded.has(row.id) ? 'rotate-90 text-indigo-500' : ''
                    )} />
                  )}
                  {row.depth === 1 && <div className="w-5 shrink-0" />}

                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />

                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate leading-tight font-bold',
                      row.depth === 0 ? 'text-xs text-slate-800' : 'text-[11px] text-slate-600'
                    )}>{row.label}</p>
                    {row.sublabel && (
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide truncate">
                        {row.sublabel}
                      </p>
                    )}
                  </div>

                  {row.depth === 0 && (
                    <span className={cn('shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase',
                      row.status === 'active'    ? 'bg-indigo-100 text-indigo-700' :
                      row.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-500'
                    )}>
                      {row.status === 'active' ? 'Ativa' : row.status === 'completed' ? 'Feita' : 'Plan.'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: scrollable gantt chart */}
          <div ref={rightRef}
            className="flex-1 overflow-auto custom-scrollbar"
            onScroll={onRightScroll}>
            <div style={{ width: Math.max(totalW, 600), position: 'relative' }}>

              {/* Column headers — double row */}
              <GanttHeader zoom={zoom} columns={columns} colW={colW} />

              {/* Body: rows + bars */}
              <div style={{ position: 'relative', height: bodyH }}>

                {/* Vertical grid lines */}
                {columns.map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: i * colW, width: 1,
                    background: '#f1f5f9',
                  }} />
                ))}

                {/* Today line */}
                {showToday && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: todayX, width: 2,
                    background: '#6366f1', opacity: 0.6,
                    zIndex: 5,
                  }}>
                    <div style={{
                      position: 'absolute', top: 4, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 8, height: 8, borderRadius: '50%', background: '#6366f1',
                    }} />
                  </div>
                )}

                {/* Rows */}
                {rows.map((row, i) => {
                  const x1 = dateX(row.startDate);
                  const x2 = dateX(row.endDate);
                  const bx = Math.max(0, x1);
                  const bw = Math.max(12, Math.min(totalW, x2) - bx);
                  const show = x2 > 0 && x1 < totalW;

                  return (
                    <div key={row.id + i}
                      style={{ position: 'absolute', top: i * ROW_H, left: 0, right: 0, height: ROW_H }}
                      className={cn('border-b border-slate-100',
                        row.depth === 0 ? 'bg-slate-50/20' : ''
                      )}>

                      {show && (
                        <div style={{
                          position: 'absolute',
                          left: bx,
                          width: bw,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: row.depth === 0 ? 26 : 18,
                          borderRadius: row.depth === 0 ? 13 : 9,
                          background: row.color,
                          opacity: row.status === 'completed' ? 0.5 : 1,
                          overflow: 'hidden',
                          boxShadow: row.depth === 0 ? `0 2px 8px ${row.color}40` : 'none',
                        }}>
                          {/* Progress fill */}
                          <div style={{
                            position: 'absolute', top: 0, left: 0, bottom: 0,
                            width: `${row.progress}%`,
                            background: 'rgba(255,255,255,0.25)',
                          }} />
                          {/* Label */}
                          {bw > 50 && row.depth === 0 && (
                            <span style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center',
                              paddingLeft: 10,
                              fontSize: 10, fontWeight: 800,
                              color: 'rgba(255,255,255,0.95)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                            }}>
                              {row.progress}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 flex flex-wrap gap-6">
          {[
            { label: 'Sprints',          value: sprints.length },
            { label: 'Ativas',           value: sprints.filter(s => s.status === 'active').length,    color: 'text-indigo-600' },
            { label: 'Concluídas',       value: sprints.filter(s => s.status === 'completed').length,  color: 'text-emerald-600' },
            { label: 'Total Tickets',    value: features.length },
            { label: 'Tickets Concluídos', value: features.filter(f => f.status === 'done').length,   color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{s.label}</p>
              <p className={cn('text-lg font-black', s.color ?? 'text-slate-800')}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
