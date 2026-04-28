import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, ChevronLeft, ChevronRight, Loader2,
  Play, CheckCircle2, Clock, AlertCircle, Rocket,
  Briefcase, Star, ArrowRight, ZoomIn, ZoomOut,
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, differenceInDays, isSameDay, isWithinInterval,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Badge, ProgressBar, EmptyState } from '../ui';
import type { Feature, Sprint } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ZoomLevel = 'day' | 'week' | 'month';

interface GanttRow {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  type: 'sprint' | 'feature';
  status: string;
  children?: GanttRow[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planned:     { label: 'Planejada',        color: '#6366f1', bg: '#eef2ff' },
  active:      { label: 'Ativa',            color: '#10b981', bg: '#ecfdf5' },
  completed:   { label: 'Concluída',        color: '#64748b', bg: '#f8fafc' },
  todo:        { label: 'A Fazer',          color: '#94a3b8', bg: '#f8fafc' },
  'in-progress': { label: 'Em Dev',         color: '#3b82f6', bg: '#eff6ff' },
  review:      { label: 'Em Revisão',       color: '#8b5cf6', bg: '#f5f3ff' },
  testing:     { label: 'Em Teste',         color: '#f59e0b', bg: '#fffbeb' },
  done:        { label: 'Concluído',        color: '#10b981', bg: '#ecfdf5' },
};

const TYPE_COLORS: Record<string, string> = {
  bug:   '#ef4444',
  story: '#10b981',
  epic:  '#8b5cf6',
  task:  '#6366f1',
};

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 64;
const LABEL_WIDTH = 260;

// ─── Main Component ───────────────────────────────────────────────────────────

interface TimelineViewProps {
  projectId: string;
}

export function TimelineView({ projectId }: TimelineViewProps) {
  const [sprints, setSprints]   = useState<Sprint[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading]   = useState(true);
  const [zoom, setZoom]         = useState<ZoomLevel>('week');
  const [viewStart, setViewStart] = useState(() => startOfMonth(new Date()));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [fr, sr] = await Promise.all([
          fetch(`/api/projects/${projectId}/features`),
          fetch(`/api/projects/${projectId}/sprints`),
        ]);
        const [feats, sprintsData] = await Promise.all([fr.json(), sr.json()]);
        setFeatures(Array.isArray(feats) ? feats : []);
        setSprints(Array.isArray(sprintsData) ? sprintsData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  // Determine view range based on zoom
  const viewEnd = useMemo(() => {
    if (zoom === 'day')   return addDays(viewStart, 30);
    if (zoom === 'week')  return addWeeks(viewStart, 12);
    return addMonths(viewStart, 6);
  }, [viewStart, zoom]);

  // Column units for header
  const columns = useMemo(() => {
    if (zoom === 'day') {
      return eachDayOfInterval({ start: viewStart, end: viewEnd });
    }
    if (zoom === 'week') {
      return eachWeekOfInterval({ start: viewStart, end: viewEnd }, { weekStartsOn: 1 });
    }
    return eachMonthOfInterval({ start: viewStart, end: viewEnd });
  }, [viewStart, viewEnd, zoom]);

  const colWidth = zoom === 'day' ? 40 : zoom === 'week' ? 80 : 100;
  const totalWidth = columns.length * colWidth;

  // Build gantt rows from sprints + features
  const rows = useMemo<GanttRow[]>(() => {
    const result: GanttRow[] = [];

    sprints
      .sort((a, b) => {
        const order = { active: 0, planned: 1, completed: 2 };
        return order[a.status] - order[b.status];
      })
      .forEach(sprint => {
        const sf = features.filter(f => f.sprintId === sprint.id);
        const start = sprint.startDate ? new Date(sprint.startDate) : new Date();
        const end   = sprint.endDate   ? new Date(sprint.endDate)   : addDays(start, 14);
        const done  = sf.filter(f => f.status === 'done').length;
        const progress = sf.length > 0 ? Math.round((done / sf.length) * 100) : 0;

        const sprintRow: GanttRow = {
          id: sprint.id,
          label: sprint.name,
          sublabel: `${sf.length} tickets · ${sf.reduce((a, f) => a + (f.points || 0), 0)} pts`,
          color: STATUS_CONFIG[sprint.status]?.color ?? '#6366f1',
          startDate: start,
          endDate: end,
          progress,
          type: 'sprint',
          status: sprint.status,
          children: sf.map(f => {
            const fStart = f.deadline ? addDays(new Date(f.deadline), -3) : start;
            const fEnd   = f.deadline ? new Date(f.deadline) : end;
            return {
              id: f.id,
              label: f.title,
              sublabel: f.key || '',
              color: TYPE_COLORS[f.type || 'task'],
              startDate: fStart > start ? fStart : start,
              endDate:   fEnd   < end   ? fEnd   : end,
              progress: f.status === 'done' ? 100 : f.status === 'in-progress' ? 50 : f.status === 'testing' ? 80 : f.status === 'review' ? 65 : 0,
              type: 'feature',
              status: f.status,
            };
          }),
        };
        result.push(sprintRow);
      });

    // Backlog items with deadline
    const backlog = features.filter(f => !f.sprintId && f.deadline);
    if (backlog.length > 0) {
      const start = new Date();
      const end   = addDays(start, 30);
      result.push({
        id: 'backlog-group',
        label: 'Backlog com Prazo',
        sublabel: `${backlog.length} tickets`,
        color: '#94a3b8',
        startDate: start,
        endDate: end,
        progress: 0,
        type: 'sprint',
        status: 'planned',
        children: backlog.map(f => ({
          id: f.id,
          label: f.title,
          sublabel: f.key || '',
          color: TYPE_COLORS[f.type || 'task'],
          startDate: f.deadline ? addDays(new Date(f.deadline), -3) : start,
          endDate:   f.deadline ? new Date(f.deadline) : end,
          progress: f.status === 'done' ? 100 : f.status === 'in-progress' ? 50 : 0,
          type: 'feature',
          status: f.status,
        })),
      });
    }

    return result;
  }, [sprints, features]);

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Scroll today into view on mount
  useEffect(() => {
    if (!scrollRef.current || !columns.length) return;
    const todayIdx = columns.findIndex(c => {
      if (zoom === 'day')   return isSameDay(c, new Date());
      if (zoom === 'week')  return isSameDay(c, startOfWeek(new Date(), { weekStartsOn: 1 }));
      return isSameDay(startOfMonth(c), startOfMonth(new Date()));
    });
    if (todayIdx >= 0) {
      scrollRef.current.scrollLeft = Math.max(0, todayIdx * colWidth - 200);
    }
  }, [zoom, columns.length]);

  const navigate = (dir: 1 | -1) => {
    if (zoom === 'day')   setViewStart(d => addDays(d, dir * 15));
    if (zoom === 'week')  setViewStart(d => addWeeks(d, dir * 4));
    if (zoom === 'month') setViewStart(d => addMonths(d, dir * 3));
  };

  const dateToX = (date: Date): number => {
    if (zoom === 'day') {
      return differenceInDays(date, viewStart) * colWidth;
    }
    if (zoom === 'week') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekIdx = columns.findIndex(c => isSameDay(c, weekStart));
      if (weekIdx < 0) {
        const diff = differenceInDays(date, viewStart);
        return (diff / 7) * colWidth;
      }
      const dayInWeek = differenceInDays(date, weekStart);
      return weekIdx * colWidth + (dayInWeek / 7) * colWidth;
    }
    // month
    const monthStart = startOfMonth(date);
    const monthIdx   = columns.findIndex(c => isSameDay(startOfMonth(c), monthStart));
    if (monthIdx < 0) {
      const diff = differenceInDays(date, viewStart);
      return (diff / 30) * colWidth;
    }
    const daysInMonth = differenceInDays(endOfMonth(date), monthStart) + 1;
    const dayInMonth  = differenceInDays(date, monthStart);
    return monthIdx * colWidth + (dayInMonth / daysInMonth) * colWidth;
  };

  const barForRow = (row: GanttRow) => {
    const x1 = Math.max(0, dateToX(row.startDate));
    const x2 = Math.min(totalWidth, dateToX(row.endDate));
    const w  = Math.max(8, x2 - x1);
    return { x: x1, w };
  };

  // Today marker
  const todayX = dateToX(new Date());
  const showToday = todayX >= 0 && todayX <= totalWidth;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Carregando cronograma...</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sem dados para o cronograma"
        description="Crie sprints com datas de início e fim no Backlog para visualizá-las aqui."
        className="py-40"
      />
    );
  }

  // Build flat list of visible rows
  const visibleRows: (GanttRow & { depth: number })[] = [];
  rows.forEach(row => {
    visibleRows.push({ ...row, depth: 0 });
    if (expanded.has(row.id) && row.children) {
      row.children.forEach(child => visibleRows.push({ ...child, depth: 1 }));
    }
  });

  const gridHeight = visibleRows.length * ROW_HEIGHT;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Cronograma</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linha do tempo Gantt</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['day', 'week', 'month'] as ZoomLevel[]).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                  zoom === z ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {z === 'day' ? 'Dia' : z === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          {/* Navigate */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewStart(zoom === 'day' ? new Date() : zoom === 'week' ? startOfWeek(new Date(), { weekStartsOn: 1 }) : startOfMonth(new Date()))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Hoje
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 pl-2">
            {[
              { color: '#6366f1', label: 'Sprint' },
              { color: '#10b981', label: 'Concluído' },
              { color: '#f59e0b', label: 'Em Teste' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] font-bold text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex">
          {/* Left labels */}
          <div className="flex-shrink-0 border-r border-slate-200" style={{ width: LABEL_WIDTH }}>
            {/* Header */}
            <div className="h-16 border-b border-slate-200 px-4 flex items-center bg-slate-50/80">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sprint / Tarefa</span>
            </div>
            {/* Rows */}
            {visibleRows.map((row, idx) => (
              <div
                key={row.id + idx}
                style={{ height: ROW_HEIGHT }}
                className={cn(
                  'flex items-center gap-2 px-4 border-b border-slate-100 transition-colors',
                  row.depth === 0 ? 'bg-slate-50/60' : 'bg-white',
                  row.depth === 0 && row.children ? 'cursor-pointer hover:bg-indigo-50/40' : ''
                )}
                onClick={() => row.depth === 0 && row.children && toggleExpanded(row.id)}
              >
                {row.depth === 0 && row.children && (
                  <button className="shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-indigo-600">
                    <ArrowRight className={cn('w-3.5 h-3.5 transition-transform', expanded.has(row.id) && 'rotate-90')} />
                  </button>
                )}
                {row.depth === 1 && <div className="w-5 shrink-0" />}

                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: row.color }}
                />

                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'truncate font-bold leading-tight',
                    row.depth === 0 ? 'text-xs text-slate-800' : 'text-[11px] text-slate-600'
                  )}>
                    {row.label}
                  </p>
                  {row.sublabel && (
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{row.sublabel}</p>
                  )}
                </div>

                {row.depth === 0 && (
                  <span className={cn(
                    'shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md',
                    row.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    row.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                    'bg-indigo-100 text-indigo-700'
                  )}>
                    {row.status === 'active' ? 'Ativa' : row.status === 'completed' ? 'OK' : 'Plan.'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Right: scrollable gantt area */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar" ref={scrollRef}>
            <div style={{ width: totalWidth, minWidth: '100%', position: 'relative' }}>
              {/* Column headers */}
              <div className="flex border-b border-slate-200 bg-slate-50/80" style={{ height: HEADER_HEIGHT }}>
                {columns.map((col, i) => {
                  const isCurrentDay   = zoom === 'day'   && isToday(col);
                  const isCurrentWeek  = zoom === 'week'  && isWithinInterval(new Date(), { start: col, end: endOfWeek(col, { weekStartsOn: 1 }) });
                  const isCurrentMonth = zoom === 'month' && isSameDay(startOfMonth(col), startOfMonth(new Date()));
                  const isCurrent = isCurrentDay || isCurrentWeek || isCurrentMonth;

                  return (
                    <div
                      key={i}
                      style={{ width: colWidth, minWidth: colWidth }}
                      className={cn(
                        'flex-shrink-0 border-r border-slate-100 flex flex-col items-center justify-center gap-0.5',
                        isCurrent ? 'bg-indigo-50' : ''
                      )}
                    >
                      {zoom === 'day' && (
                        <>
                          <span className={cn('text-[9px] font-black uppercase tracking-widest', isCurrent ? 'text-indigo-500' : 'text-slate-400')}>
                            {format(col, 'EEE', { locale: ptBR })}
                          </span>
                          <span className={cn(
                            'text-sm font-black',
                            isCurrent ? 'w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center' : 'text-slate-700'
                          )}>
                            {format(col, 'd')}
                          </span>
                        </>
                      )}
                      {zoom === 'week' && (
                        <>
                          <span className={cn('text-[9px] font-black uppercase tracking-widest', isCurrent ? 'text-indigo-500' : 'text-slate-400')}>
                            Sem {format(col, 'w')}
                          </span>
                          <span className={cn('text-xs font-black', isCurrent ? 'text-indigo-700' : 'text-slate-600')}>
                            {format(col, 'dd/MM')}
                          </span>
                        </>
                      )}
                      {zoom === 'month' && (
                        <>
                          <span className={cn('text-[9px] font-black uppercase tracking-widest', isCurrent ? 'text-indigo-500' : 'text-slate-400')}>
                            {format(col, 'yyyy')}
                          </span>
                          <span className={cn('text-sm font-black capitalize', isCurrent ? 'text-indigo-700' : 'text-slate-700')}>
                            {format(col, 'MMM', { locale: ptBR })}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rows with bars */}
              <div style={{ position: 'relative' }}>
                {/* Grid lines */}
                {columns.map((col, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: i * colWidth, width: colWidth,
                      borderRight: '1px solid #f1f5f9',
                    }}
                  />
                ))}

                {/* Today marker */}
                {showToday && (
                  <div
                    style={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: todayX, width: 2,
                      background: '#6366f1', opacity: 0.5,
                      zIndex: 10,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      width: 8, height: 8, borderRadius: '50%', background: '#6366f1',
                    }} />
                  </div>
                )}

                {/* Row stripes + bars */}
                {visibleRows.map((row, idx) => {
                  const { x, w } = barForRow(row);
                  const showBar = x < totalWidth && x + w > 0;

                  return (
                    <div
                      key={row.id + idx}
                      style={{ height: ROW_HEIGHT, position: 'relative' }}
                      className={cn(
                        'border-b border-slate-100',
                        row.depth === 0 ? 'bg-slate-50/30' : 'bg-white'
                      )}
                    >
                      {showBar && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            left: x,
                            width: w,
                            height: row.depth === 0 ? 24 : 16,
                            borderRadius: row.depth === 0 ? 12 : 8,
                            background: row.color,
                            opacity: row.status === 'completed' ? 0.45 : 0.9,
                            overflow: 'hidden',
                            zIndex: 5,
                          }}
                        >
                          {/* Progress fill */}
                          <div
                            style={{
                              position: 'absolute', top: 0, left: 0, bottom: 0,
                              width: `${row.progress}%`,
                              background: 'rgba(255,255,255,0.3)',
                              borderRadius: 'inherit',
                            }}
                          />
                          {/* Label inside bar if wide enough */}
                          {w > 60 && row.depth === 0 && (
                            <span style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center',
                              paddingLeft: 10,
                              fontSize: 9, fontWeight: 900,
                              color: 'white', textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              overflow: 'hidden', whiteSpace: 'nowrap',
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

        {/* Summary footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/50 flex flex-wrap gap-6">
          {[
            { label: 'Total de Sprints', value: sprints.length, color: 'text-slate-900' },
            { label: 'Sprints Ativas',   value: sprints.filter(s => s.status === 'active').length,    color: 'text-emerald-600' },
            { label: 'Concluídas',       value: sprints.filter(s => s.status === 'completed').length,  color: 'text-slate-500' },
            { label: 'Total de Tickets', value: features.length, color: 'text-indigo-600' },
            { label: 'Concluídos',       value: features.filter(f => f.status === 'done').length,      color: 'text-emerald-600' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <p className={cn('text-xl font-black', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
