import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, MoreVertical, ExternalLink, FileText, Link2, Paperclip, Upload, X } from 'lucide-react';
import type { FinancialAttachment } from './types';
import { addMonths, format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs } from '../ui';
import type { TabItem } from '../ui';

// Peças comuns das telas de Contas a Pagar e Contas a Receber.

export const PAY_METHODS = ['Pix', 'Boleto', 'Cartão', 'Transferência', 'Dinheiro'];

export const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Datas "só dia" vêm do servidor como meia-noite UTC; ler pelos componentes UTC evita cair no dia anterior (fuso do Brasil).
export function parseDay(iso?: string | null): Date | null {
  if (!iso) return null;
  if (iso.endsWith('T00:00:00.000Z') || iso.length === 10) {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const fmtDate = (iso?: string | null) => { const d = parseDay(iso); return d ? format(d, 'dd/MM/yyyy') : '—'; };
export const startOfToday = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
export const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

// ─── Indicador ───────────────────────────────────────────────────────────────

export function Stat({ label, value, color, icon: Icon, text, footer }: {
  label: string; value: string; color: string; icon: any; text: string; footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-white/5 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200/60 dark:border-white/10">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-lg font-black truncate mt-1" style={{ color: text }}>{value}</p>
      {footer}
    </div>
  );
}

// ─── Menu "⋮" da linha ───────────────────────────────────────────────────────
// Renderizado no <body> com posição fixa: não é cortado pela caixa da lista (overflow) e
// abre para cima quando não há espaço embaixo (ex.: último item da página).

export function RowMenu({ items }: { items: { label: string; icon: any; onClick: () => void; danger?: boolean }[] }) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = items.length * 40 + 12;
    const right = Math.max(8, window.innerWidth - r.right);
    setPos(window.innerHeight - r.bottom < menuH + 12
      ? { bottom: window.innerHeight - r.top + 4, right }
      : { top: r.bottom + 4, right });
  };

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setPos(null);
    };
    const hide = () => setPos(null);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [pos]);

  return (
    <div className="relative flex-shrink-0">
      <button ref={btnRef} onClick={toggle} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Mais ações">
        <MoreVertical className="w-4 h-4" />
      </button>
      {pos && createPortal(
        <div ref={menuRef} style={{ position: 'fixed', zIndex: 80, top: pos.top, bottom: pos.bottom, right: pos.right }}
          className="min-w-[210px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl py-1">
          {items.map(it => (
            <button key={it.label} onClick={() => { setPos(null); it.onClick(); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-white/5 ${it.danger ? 'text-rose-600' : 'text-slate-600 dark:text-slate-200'}`}>
              <it.icon className="w-4 h-4" /> {it.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── Barra de período: abas + navegação de mês ───────────────────────────────

export function PeriodBar<V extends string>({ options, view, onView, monthView, cursor, onCursor, text }: {
  options: { value: V; label: string; danger?: boolean }[];
  view: V;
  onView: (v: V) => void;
  monthView: V;           // qual aba mostra o seletor de mês
  cursor: Date;
  onCursor: (d: Date) => void;
  text: string;
}) {
  const tabs = options.map(option => ({ id: option.value, label: option.label })) as readonly TabItem<V>[];
  return (
    <Tabs<V> items={tabs} value={view} onChange={onView} label="Período das contas">
      {view === monthView && (
        <div className="inline-flex items-center gap-1 self-start">
          <button onClick={() => onCursor(addMonths(cursor, -1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500" aria-label="Mês anterior"><ChevronLeft className="w-4 h-4" /></button>
          <span className="min-w-[150px] text-center text-sm font-black capitalize" style={{ color: text }}>
            {format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => onCursor(addMonths(cursor, 1))} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500" aria-label="Próximo mês"><ChevronRight className="w-4 h-4" /></button>
          {!isSameMonth(cursor, new Date()) && (
            <button onClick={() => onCursor(firstOfMonth(new Date()))} className="ml-1 text-xs font-bold text-indigo-500 hover:underline">Hoje</button>
          )}
        </div>
      )}
    </Tabs>
  );
}

const ACCEPTED_FILES = '.pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp';
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 12;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error());
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function displaySize(size?: number) {
  if (!size) return '';
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FinancialAttachmentsField({ value, onChange }: { value: FinancialAttachment[]; onChange: (items: FinancialAttachment[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [error, setError] = useState('');

  const addLink = () => {
    const raw = linkUrl.trim();
    try {
      const parsed = new URL(raw);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      if (value.length >= MAX_ATTACHMENTS) throw new Error('Limite de 12 anexos por conta.');
      onChange([...value, { kind: 'link', name: linkName.trim() || parsed.hostname, url: parsed.toString() }]);
      setLinkUrl('');
      setLinkName('');
      setError('');
    } catch {
      setError(raw ? 'Informe um link que comece com http:// ou https://.' : 'Informe o link para adicionar.');
    }
  };

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    if (value.length + files.length > MAX_ATTACHMENTS) return setError('Limite de 12 anexos por conta.');
    const oversized = files.find(file => file.size > MAX_ATTACHMENT_SIZE);
    if (oversized) return setError(`“${oversized.name}” ultrapassa o limite de 10 MB.`);
    try {
      const additions = await Promise.all(files.map(async file => ({
        kind: 'file' as const,
        name: file.name,
        dataUrl: await fileToDataUrl(file),
        mimeType: file.type,
        document: { mimeType: file.type, size: file.size },
      })));
      onChange([...value, ...additions]);
      setError('');
    } catch {
      setError('Não foi possível ler um dos arquivos selecionados.');
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 dark:border-white/10 p-3.5 space-y-3">
      <div className="flex items-start gap-2">
        <Paperclip className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Links e documentos</p>
          <p className="text-[11px] text-slate-400">Anexe boleto, comprovante ou contrato em PDF, Word ou imagem (até 10 MB por arquivo).</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input value={linkName} onChange={e => setLinkName(e.target.value)} className="ds-input sm:max-w-44" placeholder="Nome do link (opcional)" aria-label="Nome do link" />
        <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="ds-input flex-1" placeholder="https://..." aria-label="Link do documento" />
        <button type="button" onClick={addLink} className="inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20">
          <Link2 className="w-3.5 h-3.5" /> Adicionar link
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept={ACCEPTED_FILES} multiple className="hidden" onChange={e => { void addFiles(Array.from(e.target.files ?? [])); e.currentTarget.value = ''; }} />
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5">
          <Upload className="w-3.5 h-3.5" /> Selecionar arquivo
        </button>
        <span className="text-[11px] text-slate-400">PDF, DOC, DOCX, JPG, PNG, GIF ou WebP</span>
      </div>

      {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((item, index) => {
            const href = item.kind === 'link' ? item.url || '#' : item.id ? `/api/financial-attachments/${item.id}/download` : item.dataUrl || '#';
            const size = item.document?.size;
            return (
              <div key={item.id || `${item.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/5 px-2.5 py-2">
                {item.kind === 'link' ? <Link2 className="w-4 h-4 text-sky-500 flex-shrink-0" /> : <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                <a href={href} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600 dark:text-slate-200 hover:text-indigo-600 hover:underline" title={item.name}>{item.name}</a>
                {size && <span className="text-[10px] text-slate-400">{displaySize(size)}</span>}
                <a href={href} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-indigo-600" aria-label={`Abrir ${item.name}`}><ExternalLink className="w-3.5 h-3.5" /></a>
                <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="p-1 text-slate-400 hover:text-rose-600" aria-label={`Remover ${item.name}`}><X className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
