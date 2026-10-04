import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Plus, Edit2, Trash2, CheckCircle2, XCircle,
  Clock, AlertCircle, Search, Filter, Users, BarChart2, Eye,
  ChevronDown, ChevronRight, Banknote, CreditCard, Landmark, Phone, UserPlus,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, Textarea, Badge, EmptyState,
} from '../ui';
import { Pagination, usePagination } from '../ui/Pagination';
import { RowMenu } from './financeShared';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import type { Sale, SaleStatus, Product } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG: Record<SaleStatus, { label: string; color: string; bg: string; icon: any }> = {
  lead:        { label: 'Lead',       color: '#2563EB', bg: 'rgba(37,99,235,0.1)',    icon: Eye },
  negotiation: { label: 'Negociação', color: '#C49A2A', bg: 'rgba(196,154,42,0.1)',   icon: Clock },
  won:         { label: 'Fechado',    color: '#15803D', bg: 'rgba(21,128,61,0.1)',     icon: CheckCircle2 },
  lost:        { label: 'Perdido',    color: '#DC2626', bg: 'rgba(220,38,38,0.1)',     icon: XCircle },
  cancelled:   { label: 'Cancelado',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  icon: AlertCircle },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX', card: 'Cartão', boleto: 'Boleto', transfer: 'Transferência', cash: 'Dinheiro', other: 'Outro',
};

const ORIGIN_OPTIONS = ['WhatsApp', 'Instagram', 'Indicação', 'Site', 'LinkedIn', 'E-mail', 'Outro'];

export function SalesManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<{ uid: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'open' | 'won' | 'closed' | 'all'>('open');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [filterSeller, setFilterSeller] = useState('all');
  const [period, setPeriod] = useState<'all' | 'month' | 'last' | '30d' | 'year'>('all');
  const [sort, setSort] = useState<'recent' | 'old' | 'value' | 'name'>('recent');
  const [filterProduct, setFilterProduct] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [salesRes, productsRes, usersRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products'),
        fetch('/api/users'),
      ]);
      setSales(await salesRes.json());
      setProducts(await productsRes.json());
      setUsers((await usersRes.json()).map((u: any) => ({ uid: u.uid, displayName: u.displayName })));
    } catch {
      toast('Erro ao carregar vendas', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/sales/${deletingId}`, { method: 'DELETE' });
      setSales(prev => prev.filter(s => s.id !== deletingId));
      toast('Venda removida', 'success');
    } catch {
      toast('Erro ao remover venda', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const TABS: { id: 'open' | 'won' | 'closed' | 'all'; label: string; match: (x: Sale) => boolean }[] = [
    { id: 'open', label: 'Em andamento', match: x => x.status === 'lead' || x.status === 'negotiation' },
    { id: 'won', label: 'Finalizadas (fechadas)', match: x => x.status === 'won' },
    { id: 'closed', label: 'Perdidas e canceladas', match: x => x.status === 'lost' || x.status === 'cancelled' },
    { id: 'all', label: 'Todas', match: () => true },
  ];
  const dateOf = (x: Sale) => new Date(x.status === 'won' ? (x.closedAt ?? x.createdAt) : x.createdAt);
  const inPeriod = (x: Sale) => {
    if (period === 'all') return true;
    const d = dateOf(x), now = new Date();
    if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (period === 'last') { const l = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getFullYear() === l.getFullYear() && d.getMonth() === l.getMonth(); }
    if (period === '30d') return now.getTime() - d.getTime() <= 30 * 86400000;
    return d.getFullYear() === now.getFullYear();
  };
  const origins = [...new Set(sales.map(x => x.origin).filter(Boolean) as string[])].sort();
  const sellers = [...new Set(sales.map(x => x.soldByName).filter(Boolean) as string[])].sort();

  // tudo menos a aba: usado para contar cada aba respeitando os filtros
  const base = sales.filter(x => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || x.clientName.toLowerCase().includes(q) || x.productName.toLowerCase().includes(q) || (x.clientEmail?.toLowerCase().includes(q) ?? false) || (x.clientPhone ?? '').includes(q);
    return matchSearch
      && (filterProduct === 'all' || x.productId === filterProduct)
      && (filterOrigin === 'all' || x.origin === filterOrigin)
      && (filterSeller === 'all' || x.soldByName === filterSeller)
      && inPeriod(x);
  });
  const tabCount = (id: string) => base.filter(TABS.find(t => t.id === id)!.match).length;
  const STAGE_ORDER: Record<string, number> = { negotiation: 0, lead: 1, won: 0, lost: 0, cancelled: 1 };
  const filtered = base.filter(TABS.find(t => t.id === tab)!.match).sort((a, b) => {
    if (tab === 'open' && STAGE_ORDER[a.status] !== STAGE_ORDER[b.status]) return STAGE_ORDER[a.status] - STAGE_ORDER[b.status];
    if (sort === 'value') return b.value - a.value;
    if (sort === 'name') return a.clientName.localeCompare(b.clientName);
    const diff = dateOf(b).getTime() - dateOf(a).getTime();
    return sort === 'old' ? -diff : diff;
  });
  const { page, pageSize, paginatedData, setPage, setPageSize } = usePagination(filtered, 10);
  const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Métricas
  const won = sales.filter(x => x.status === 'won');
  const totalRevenue = won.reduce((a, x) => a + x.value, 0);
  const totalWon = won.length;
  const decided = sales.filter(x => x.status === 'won' || x.status === 'lost').length;
  const conversionRate = decided > 0 ? Math.round((totalWon / decided) * 100) : 0;
  const open = sales.filter(x => x.status === 'lead' || x.status === 'negotiation');
  const negotiating = sales.filter(x => x.status === 'negotiation');
  const nowD = new Date();
  const wonMonth = won.filter(x => { const d = dateOf(x); return d.getFullYear() === nowD.getFullYear() && d.getMonth() === nowD.getMonth(); });
  const ticket = totalWon ? totalRevenue / totalWon : 0;

  // atalhos de andamento direto na linha
  const quick = async (sale: Sale, status: SaleStatus) => {
    try {
      const r = await fetch(`/api/sales/${sale.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(status === 'won' ? { closedAt: new Date().toISOString() } : {}) }),
      });
      if (!r.ok) throw new Error();
      const updated = await r.json();
      setSales(prev => prev.map(x => (x.id === updated.id ? updated : x)));
      toast(status === 'won' ? 'Venda fechada! Cliente criado automaticamente.' : status === 'negotiation' ? 'Movida para negociação' : status === 'lost' ? 'Marcada como perdida' : 'Atualizada', 'success');
    } catch { toast('Não foi possível atualizar', 'error'); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
            Controle de Vendas
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Acompanhe leads, negociações e fechamentos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-black" style={{ color: '#15803D' }}>
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receita fechada &bull; {conversionRate}% conversão</p>
          </div>
          <Button
            iconLeft={<Plus className="w-4 h-4" />}
            onClick={() => { setEditingSale(null); setIsFormOpen(true); }}
          >
            NOVA VENDA
          </Button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'Em andamento', value: String(open.length), sub: `${money(open.reduce((a, x) => a + x.value, 0))} em negociação`, color: '#C49A2A' },
          { label: 'Fechadas no mês', value: String(wonMonth.length), sub: money(wonMonth.reduce((a, x) => a + x.value, 0)), color: '#15803D' },
          { label: 'Ticket médio', value: ticket ? money(ticket) : '—', sub: `${totalWon} venda(s) fechada(s)`, color: '#2563EB' },
          { label: 'Conversão', value: `${conversionRate}%`, sub: `${negotiating.length} em negociação agora`, color: '#7C3AED' },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 border bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: k.color }}>{k.label}</p>
            <p className="text-lg font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{k.value}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-3.5 py-2 rounded-xl text-xs font-black border transition-all"
            style={tab === t.id ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E' } : { background: 'transparent', color: '#64748B', borderColor: 'rgba(100,116,139,0.25)' }}>
            {t.label} <span className="opacity-70">· {tabCount(t.id)}</span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm p-3 flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente, produto, e-mail ou telefone..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-[#0D1F4E] transition-colors"
            style={{ color: isDark ? '#fff' : '#1e293b' }}
          />
        </div>
        {([
          [filterProduct, setFilterProduct, [['all', 'Todos os produtos'], ...products.map(x => [x.id, x.name])]],
          [filterOrigin, setFilterOrigin, [['all', 'Todas as origens'], ...origins.map(o => [o, o])]],
          [filterSeller, setFilterSeller, [['all', 'Todos os vendedores'], ...sellers.map(o => [o, o])]],
          [period, setPeriod, [['all', 'Todo o período'], ['month', 'Este mês'], ['last', 'Mês passado'], ['30d', 'Últimos 30 dias'], ['year', 'Este ano']]],
          [sort, setSort, [['recent', 'Mais recentes'], ['old', 'Mais antigas'], ['value', 'Maior valor'], ['name', 'Nome (A-Z)']]],
        ] as [string, (v: any) => void, string[][]][]).map(([val, set, opts], i) => (
          <select key={i} value={val} onChange={e => set(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none font-medium max-w-[190px]"
            style={{ color: isDark ? '#fff' : '#1e293b' }}>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* Lista de vendas */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={sales.length ? 'Nada nesta aba com esses filtros' : 'Nenhuma venda encontrada'}
          description={sales.length ? 'Troque de aba ou limpe os filtros.' : 'Registre sua primeira venda ou lead.'}
          action={<Button onClick={() => { setEditingSale(null); setIsFormOpen(true); }}>REGISTRAR VENDA</Button>}
        />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {paginatedData.map((sale, i) => {
              const cfg = STATUS_CONFIG[sale.status];
              const StatusIcon = cfg.icon;
              const prev = paginatedData[i - 1];
              const showHeader = tab === 'open' && (!prev || prev.status !== sale.status);
              return (
                <React.Fragment key={sale.id}>
                  {showHeader && (
                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ background: cfg.bg, color: cfg.color }}>
                      <StatusIcon className="w-3 h-3" />{sale.status === 'negotiation' ? 'Em negociação' : 'Leads novos'} · {filtered.filter(x => x.status === sale.status).length}
                    </div>
                  )}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                      <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>

                    <button className="flex-1 min-w-0 text-left" onClick={() => setViewingSale(sale)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{sale.clientName}</p>
                        {tab !== 'open' && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400 truncate">{sale.productName}</span>
                        {sale.origin && <span className="text-[10px] font-bold text-slate-400 uppercase">{sale.origin}</span>}
                        {sale.soldByName && <span className="text-[10px] text-slate-400">· {sale.soldByName}</span>}
                        <span className="text-[10px] text-slate-400">
                          {sale.status === 'won' && sale.closedAt ? `Fechada em ${format(new Date(sale.closedAt), 'dd/MM/yyyy', { locale: ptBR })}` : format(new Date(sale.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </button>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black" style={{ color: sale.status === 'won' ? '#15803D' : (isDark ? '#fff' : '#0D1F4E') }}>{sale.value > 0 ? money(sale.value) : '—'}</p>
                      {sale.paymentMethod && <p className="text-[10px] text-slate-400 uppercase font-bold">{PAYMENT_LABELS[sale.paymentMethod]}</p>}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {sale.status === 'lead' && <Button size="xs" variant="outline" onClick={() => quick(sale, 'negotiation')}>Negociar</Button>}
                      {sale.status === 'negotiation' && <Button size="xs" onClick={() => { setEditingSale({ ...sale, status: 'won' }); setIsFormOpen(true); }}>Fechar venda</Button>}
                      <RowMenu items={[
                        { label: 'Ver detalhes', icon: Eye, onClick: () => setViewingSale(sale) },
                        { label: 'Editar', icon: Edit2, onClick: () => { setEditingSale(sale); setIsFormOpen(true); } },
                        ...(sale.clientPhone ? [{ label: 'Chamar no WhatsApp', icon: Phone, onClick: () => window.open(`https://wa.me/${sale.clientPhone!.replace(/\D/g, '').replace(/^(?!55)/, '55')}`, '_blank') }] : []),
                        ...(sale.status === 'lead' ? [{ label: 'Mover para negociação', icon: Clock, onClick: () => quick(sale, 'negotiation') }] : []),
                        ...(sale.status === 'lead' || sale.status === 'negotiation' ? [{ label: 'Marcar como perdida', icon: XCircle, onClick: () => quick(sale, 'lost') }] : []),
                        ...(sale.status === 'lost' || sale.status === 'cancelled' ? [{ label: 'Reabrir como lead', icon: UserPlus, onClick: () => quick(sale, 'lead') }] : []),
                        { label: 'Remover', icon: Trash2, danger: true, onClick: () => setDeletingId(sale.id) },
                      ]} />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="border-t border-slate-100 dark:border-white/5 p-2">
            <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <SaleFormModal
          sale={editingSale}
          products={products}
          users={users}
          onClose={() => setIsFormOpen(false)}
          onSaved={(s) => {
            const wasWon = editingSale?.status === 'won';
            if (editingSale) {
              setSales(prev => prev.map(x => x.id === s.id ? s : x));
            } else {
              setSales(prev => [s, ...prev]);
            }
            setIsFormOpen(false);
            if (s.status === 'won' && !wasWon) {
              toast('Venda fechada! Cliente criado automaticamente.', 'success');
            } else {
              toast(editingSale ? 'Venda atualizada!' : 'Venda registrada!', 'success');
            }
          }}
        />
      )}

      {viewingSale && (
        <SaleDetailModal
          sale={viewingSale}
          onClose={() => setViewingSale(null)}
        />
      )}

      {deletingId && (
        <ConfirmModal
          isOpen
          title="Remover Venda"
          message="Tem certeza que deseja remover este registro de venda?"
          confirmLabel="REMOVER"
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}

// ─── SaleFormModal ────────────────────────────────────────────────────────────

function SaleFormModal({
  sale,
  products,
  users,
  onClose,
  onSaved,
}: {
  sale: Sale | null;
  products: Product[];
  users: { uid: string; displayName: string }[];
  onClose: () => void;
  onSaved: (s: Sale) => void;
}) {
  const [clientName, setClientName] = useState(sale?.clientName ?? '');
  const [clientEmail, setClientEmail] = useState(sale?.clientEmail ?? '');
  const [clientPhone, setClientPhone] = useState(sale?.clientPhone ?? '');
  const [productId, setProductId] = useState(sale?.productId ?? (products[0]?.id ?? ''));
  const [value, setValue] = useState(sale?.value ?? 0);
  const [status, setStatus] = useState<SaleStatus>(sale?.status ?? 'lead');
  const [paymentMethod, setPaymentMethod] = useState(sale?.paymentMethod ?? '');
  const [origin, setOrigin] = useState(sale?.origin ?? '');
  const [soldById, setSoldById] = useState(sale?.soldById ?? '');
  const [notes, setNotes] = useState(sale?.notes ?? '');
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);

  // Auto-fill price from product
  useEffect(() => {
    if (!sale && selectedProduct && selectedProduct.price > 0 && value === 0) {
      setValue(selectedProduct.price);
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const soldByName = users.find(u => u.uid === soldById)?.displayName;
      const body: Partial<Sale> = {
        id: sale?.id ?? uuidv4(),
        clientName,
        clientEmail: clientEmail || undefined,
        clientPhone: clientPhone || undefined,
        productId,
        productName: selectedProduct?.name ?? '',
        productCategory: selectedProduct?.category ?? '',
        value: Number(value),
        status,
        paymentMethod: (paymentMethod as any) || undefined,
        origin: origin || undefined,
        soldById: soldById || undefined,
        soldByName: soldById ? soldByName : undefined,
        notes: notes || undefined,
        createdAt: sale?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        closedAt: status === 'won' ? new Date().toISOString() : sale?.closedAt,
      };
      const url = sale ? `/api/sales/${sale.id}` : '/api/sales';
      const method = sale ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      onSaved(await r.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={sale ? 'Editar Venda' : 'Registrar Venda'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Linha 1 — cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome do Cliente"
            required
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Ex: João Silva"
          />
          <Input
            label="Telefone / WhatsApp"
            value={clientPhone}
            onChange={e => setClientPhone(e.target.value)}
            placeholder="(15) 99999-0000"
          />
        </div>

        {/* Linha 2 — email */}
        <Input
          label="E-mail do Cliente"
          type="email"
          value={clientEmail}
          onChange={e => setClientEmail(e.target.value)}
          placeholder="cliente@email.com"
        />

        {/* Linha 3 — produto + valor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Produto / Plano"
            value={productId}
            onChange={e => setProductId(e.target.value)}
          >
            {products.length === 0
              ? <option value="">Nenhum produto cadastrado</option>
              : products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
            }
          </Select>
          <Input
            label="Valor (R$)"
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={e => setValue(Number(e.target.value))}
          />
        </div>

        {/* Linha 4 — status + pagamento + origem (3 colunas fixas em desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value as SaleStatus)}>
            {(Object.keys(STATUS_CONFIG) as SaleStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </Select>
          <Select label="Forma de Pagamento" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="">Não definido</option>
            <option value="pix">PIX</option>
            <option value="card">Cartão</option>
            <option value="boleto">Boleto</option>
            <option value="transfer">Transferência</option>
            <option value="cash">Dinheiro</option>
            <option value="other">Outro</option>
          </Select>
          <Select label="Origem" value={origin} onChange={e => setOrigin(e.target.value)}>
            <option value="">Não definido</option>
            {ORIGIN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>

        {/* Linha 4.5 — vendedor (para cálculo de comissão) */}
        <Select label="Vendedor" value={soldById} onChange={e => setSoldById(e.target.value)}>
          <option value="">Não definido</option>
          {users.map(u => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
        </Select>

        {/* Linha 5 — observações */}
        <Textarea
          label="Observações"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Detalhes sobre a negociação, contato, etc."
          rows={3}
        />

        <Button type="submit" loading={loading} fullWidth size="lg">
          {sale ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR VENDA'}
        </Button>
      </form>
    </Modal>
  );
}

// ─── SaleDetailModal ──────────────────────────────────────────────────────────

function SaleDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const { isDark } = useTheme();
  const cfg = STATUS_CONFIG[sale.status];

  return (
    <Modal isOpen onClose={onClose} title="Detalhe da Venda" size="sm">
      <div className="space-y-4">
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: cfg.bg }}
        >
          <cfg.icon className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color }} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</p>
            <p className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{sale.clientName}</p>
          </div>
        </div>

        {[
          { label: 'Produto', value: sale.productName },
          { label: 'Valor', value: sale.value > 0 ? sale.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'A definir' },
          { label: 'Pagamento', value: sale.paymentMethod ? PAYMENT_LABELS[sale.paymentMethod] : '—' },
          { label: 'Origem', value: sale.origin ?? '—' },
          { label: 'Telefone', value: sale.clientPhone ?? '—' },
          { label: 'E-mail', value: sale.clientEmail ?? '—' },
          { label: 'Cadastrado em', value: format(new Date(sale.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
            <span className="text-sm font-bold" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{row.value}</span>
          </div>
        ))}

        {sale.notes && (
          <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Observações</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{sale.notes}</p>
          </div>
        )}

        {sale.status === 'won' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: 'rgba(21,128,61,0.08)' }}>
            <UserPlus className="w-4 h-4 flex-shrink-0" style={{ color: '#15803D' }} />
            <p className="text-xs font-bold" style={{ color: '#15803D' }}>
              Cliente criado automaticamente ao fechar a venda.
            </p>
          </div>
        )}

        {sale.clientPhone && (
          <a
            href={`https://wa.me/55${sale.clientPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-black text-sm transition-all hover:opacity-90"
            style={{ background: '#15803D' }}
          >
            <Phone className="w-4 h-4" />
            ABRIR WHATSAPP
          </a>
        )}
      </div>
    </Modal>
  );
}
