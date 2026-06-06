import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Plus, Edit2, Trash2, DollarSign, CheckCircle2, XCircle,
  Clock, AlertCircle, Search, Filter, Users, ShoppingBag, BarChart2, Eye,
  ChevronDown, ChevronRight, Banknote, CreditCard, Landmark, Phone,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, Textarea, Badge, EmptyState,
} from '../ui';
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SaleStatus>('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products'),
      ]);
      setSales(await salesRes.json());
      setProducts(await productsRes.json());
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

  const filtered = sales.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || s.clientName.toLowerCase().includes(q)
      || s.productName.toLowerCase().includes(q)
      || (s.clientEmail?.toLowerCase().includes(q) ?? false);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchProduct = filterProduct === 'all' || s.productId === filterProduct;
    return matchSearch && matchStatus && matchProduct;
  });

  // Métricas
  const totalRevenue = sales.filter(s => s.status === 'won').reduce((a, s) => a + s.value, 0);
  const totalLeads = sales.filter(s => s.status === 'lead' || s.status === 'negotiation').length;
  const totalWon = sales.filter(s => s.status === 'won').length;
  const conversionRate = sales.length > 0
    ? Math.round((totalWon / sales.length) * 100)
    : 0;

  // Produto mais vendido
  const productSalesCount: Record<string, number> = {};
  sales.filter(s => s.status === 'won').forEach(s => {
    productSalesCount[s.productName] = (productSalesCount[s.productName] ?? 0) + 1;
  });
  const topProduct = Object.entries(productSalesCount).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
            Controle de Vendas
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Acompanhe leads, negociações e fechamentos</p>
        </div>
        <Button
          iconLeft={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingSale(null); setIsFormOpen(true); }}
        >
          NOVA VENDA
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Receita Fechada',
            value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            icon: DollarSign, color: '#15803D', bg: 'rgba(21,128,61,0.08)',
            sub: 'vendas ganhas',
          },
          {
            label: 'Em Negociação',
            value: totalLeads,
            icon: Clock, color: '#C49A2A', bg: 'rgba(196,154,42,0.08)',
            sub: 'leads + negoc.',
          },
          {
            label: 'Taxa de Conversão',
            value: `${conversionRate}%`,
            icon: TrendingUp, color: '#2563EB', bg: 'rgba(37,99,235,0.08)',
            sub: 'do total',
          },
          {
            label: 'Produto Top',
            value: topProduct ? topProduct[0] : '—',
            icon: ShoppingBag, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',
            sub: topProduct ? `${topProduct[1]} venda${topProduct[1] !== 1 ? 's' : ''}` : 'sem dados',
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-white/5 rounded-2xl p-5 shadow-sm border border-slate-200/60 dark:border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.sub}</span>
            </div>
            <p className="text-xl font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pipeline por status */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(STATUS_CONFIG) as SaleStatus[]).map(st => {
          const count = sales.filter(s => s.status === st).length;
          const revenue = sales.filter(s => s.status === st).reduce((a, s) => a + s.value, 0);
          const cfg = STATUS_CONFIG[st];
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(filterStatus === st ? 'all' : st)}
              className={`rounded-2xl p-3 border text-left transition-all ${
                filterStatus === st
                  ? 'shadow-md'
                  : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:shadow-sm'
              }`}
              style={filterStatus === st ? { background: cfg.bg, borderColor: cfg.color } : {}}
            >
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: cfg.color }}>{cfg.label}</p>
              <p className="text-xl font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{count}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {revenue > 0 ? revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente ou produto..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-[#0D1F4E] transition-colors"
            style={{ color: isDark ? '#fff' : '#1e293b' }}
          />
        </div>
        <select
          value={filterProduct}
          onChange={e => setFilterProduct(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none font-medium"
          style={{ color: isDark ? '#fff' : '#1e293b' }}
        >
          <option value="all">Todos os produtos</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Lista de vendas */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhuma venda encontrada"
          description="Registre sua primeira venda ou lead."
          action={<Button onClick={() => setIsFormOpen(true)}>REGISTRAR VENDA</Button>}
        />
      ) : (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <AnimatePresence>
              {filtered.map((sale, i) => {
                const cfg = STATUS_CONFIG[sale.status];
                const StatusIcon = cfg.icon;
                return (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    {/* Status icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black truncate" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                          {sale.clientName}
                        </p>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400 truncate">{sale.productName}</span>
                        {sale.origin && (
                          <span className="text-[10px] font-bold text-slate-300 uppercase">{sale.origin}</span>
                        )}
                        <span className="text-[10px] text-slate-300">
                          {format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {/* Valor */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black" style={{ color: sale.status === 'won' ? '#15803D' : (isDark ? '#fff' : '#0D1F4E') }}>
                        {sale.value > 0
                          ? sale.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </p>
                      {sale.paymentMethod && (
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{PAYMENT_LABELS[sale.paymentMethod]}</p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => setViewingSale(sale)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingSale(sale); setIsFormOpen(true); }}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(sale.id)}
                        className="p-2 rounded-xl hover:bg-red-50 transition-colors text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <SaleFormModal
          sale={editingSale}
          products={products}
          onClose={() => setIsFormOpen(false)}
          onSaved={(s) => {
            if (editingSale) {
              setSales(prev => prev.map(x => x.id === s.id ? s : x));
            } else {
              setSales(prev => [s, ...prev]);
            }
            setIsFormOpen(false);
            toast(editingSale ? 'Venda atualizada!' : 'Venda registrada!', 'success');
          }}
        />
      )}

      {viewingSale && (
        <SaleDetailModal sale={viewingSale} onClose={() => setViewingSale(null)} />
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
  onClose,
  onSaved,
}: {
  sale: Sale | null;
  products: Product[];
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
