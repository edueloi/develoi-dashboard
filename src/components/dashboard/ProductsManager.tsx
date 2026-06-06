import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Edit2, Trash2, Tag, ToggleLeft, ToggleRight,
  Search, Layers, DollarSign, CheckCircle2, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  Button, Modal, ConfirmModal, Input, Select, Textarea, Badge, EmptyState,
} from '../ui';
import { useToast } from '../ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import type { Product } from './types';
import { v4 as uuidv4 } from 'uuid';

const CATEGORY_OPTIONS = [
  'Site / Landing Page',
  'Sistema Web',
  'Chatbot WhatsApp',
  'Dashboard / Relatórios',
  'Automação / Integração',
  'Marketing Digital',
  'Consultoria',
  'Outro',
];

const TYPE_LABELS: Record<Product['type'], string> = {
  product: 'Produto',
  plan: 'Plano',
  service: 'Serviço',
};

const TYPE_COLORS: Record<Product['type'], string> = {
  product: '#2563EB',
  plan: '#C49A2A',
  service: '#15803D',
};

export function ProductsManager() {
  const { isDark } = useTheme();
  const { show: toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | Product['type']>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await fetch('/api/products');
      setProducts(await r.json());
    } catch {
      toast('Erro ao carregar produtos', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleToggleActive = async (product: Product) => {
    try {
      const r = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      });
      const updated = await r.json();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      toast(updated.active ? 'Produto ativado' : 'Produto desativado', 'success');
    } catch {
      toast('Erro ao atualizar produto', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/products/${deletingId}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== deletingId));
      toast('Produto removido', 'success');
    } catch {
      toast('Erro ao remover produto', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchType = filterType === 'all' || p.type === filterType;
    const matchCat = filterCategory === 'all' || p.category === filterCategory;
    return matchSearch && matchType && matchCat;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const stats = {
    total: products.length,
    active: products.filter(p => p.active).length,
    products: products.filter(p => p.type === 'product').length,
    plans: products.filter(p => p.type === 'plan').length,
    services: products.filter(p => p.type === 'service').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
            Produtos & Planos
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Gerencie o que você vende</p>
        </div>
        <Button
          iconLeft={<Plus className="w-4 h-4" />}
          onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
        >
          NOVO PRODUTO
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: '#0D1F4E', bg: 'rgba(13,31,78,0.08)' },
          { label: 'Ativos', value: stats.active, icon: CheckCircle2, color: '#15803D', bg: 'rgba(21,128,61,0.08)' },
          { label: 'Produtos', value: stats.products, icon: Package, color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Planos', value: stats.plans, icon: Layers, color: '#C49A2A', bg: 'rgba(196,154,42,0.08)' },
          { label: 'Serviços', value: stats.services, icon: Tag, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-white/5 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-[#0D1F4E] transition-colors"
            style={{ color: isDark ? '#fff' : '#1e293b' }}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none font-medium"
          style={{ color: isDark ? '#fff' : '#1e293b' }}
        >
          <option value="all">Todos os tipos</option>
          <option value="product">Produto</option>
          <option value="plan">Plano</option>
          <option value="service">Serviço</option>
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none font-medium"
          style={{ color: isDark ? '#fff' : '#1e293b' }}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'Todas as categorias' : c}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto encontrado"
          description="Cadastre seu primeiro produto, plano ou serviço."
          action={<Button onClick={() => setIsFormOpen(true)}>CADASTRAR PRODUTO</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white dark:bg-white/5 rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                  product.active
                    ? 'border-slate-200/60 dark:border-white/10'
                    : 'border-slate-100 dark:border-white/5 opacity-60'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest"
                        style={{ background: `${TYPE_COLORS[product.type]}18`, color: TYPE_COLORS[product.type] }}
                      >
                        {TYPE_LABELS[product.type]}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                        {product.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(product)}
                      className="transition-colors"
                      title={product.active ? 'Desativar' : 'Ativar'}
                    >
                      {product.active
                        ? <ToggleRight className="w-6 h-6" style={{ color: '#15803D' }} />
                        : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                    </button>
                  </div>

                  <h3 className="font-black text-base leading-snug mb-1" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">{product.description}</p>
                  )}

                  {product.features && product.features.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {product.features.slice(0, 3).map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                      {product.features.length > 3 && (
                        <li className="text-xs text-slate-400">+{product.features.length - 3} mais...</li>
                      )}
                    </ul>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-amber-500" />
                      <span className="text-base font-black" style={{ color: isDark ? '#fff' : '#0D1F4E' }}>
                        {product.price > 0
                          ? product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'Consultar'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(product.id)}
                        className="p-2 rounded-xl hover:bg-red-50 transition-colors text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsFormOpen(false)}
          onSaved={(p) => {
            if (editingProduct) {
              setProducts(prev => prev.map(x => x.id === p.id ? p : x));
            } else {
              setProducts(prev => [p, ...prev]);
            }
            setIsFormOpen(false);
            toast(editingProduct ? 'Produto atualizado!' : 'Produto cadastrado!', 'success');
          }}
        />
      )}

      {/* Confirm delete */}
      {deletingId && (
        <ConfirmModal
          isOpen
          title="Remover Produto"
          message="Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita."
          confirmLabel="REMOVER"
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
          variant="danger"
        />
      )}
    </div>
  );
}

// ─── ProductFormModal ─────────────────────────────────────────────────────────

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [category, setCategory] = useState(product?.category ?? CATEGORY_OPTIONS[0]);
  const [type, setType] = useState<Product['type']>(product?.type ?? 'service');
  const [price, setPrice] = useState(product?.price ?? 0);
  const [features, setFeatures] = useState(product?.features?.join('\n') ?? '');
  const [tags, setTags] = useState(product?.tags?.join(', ') ?? '');
  const [active, setActive] = useState(product?.active ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        id: product?.id ?? uuidv4(),
        name,
        description,
        category,
        type,
        price: Number(price),
        currency: 'BRL',
        active,
        features: features.split('\n').map(f => f.trim()).filter(Boolean),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: product?.createdAt ?? new Date().toISOString(),
      };
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PATCH' : 'POST';
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
    <Modal
      isOpen
      onClose={onClose}
      title={product ? 'Editar Produto' : 'Novo Produto'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome do Produto" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Site Institucional Pro" />
          <Select label="Tipo" value={type} onChange={e => setType(e.target.value as Product['type'])}>
            <option value="product">Produto</option>
            <option value="plan">Plano</option>
            <option value="service">Serviço</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Categoria" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input
            label="Preço (R$)"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            placeholder="0 = Consultar"
          />
        </div>

        <Textarea
          label="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="O que está incluso neste produto/plano?"
          rows={2}
        />

        <Textarea
          label="Funcionalidades (uma por linha)"
          value={features}
          onChange={e => setFeatures(e.target.value)}
          placeholder="Domínio incluso&#10;Hospedagem 1 ano&#10;Suporte 30 dias"
          rows={4}
        />

        <Input
          label="Tags (separadas por vírgula)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="site, landing page, premium"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActive(!active)}
            className="flex items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: active ? '#15803D' : '#94a3b8' }}
          >
            {active
              ? <ToggleRight className="w-6 h-6" style={{ color: '#15803D' }} />
              : <ToggleLeft className="w-6 h-6 text-slate-300" />}
            {active ? 'Produto ativo' : 'Produto inativo'}
          </button>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">
          {product ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRODUTO'}
        </Button>
      </form>
    </Modal>
  );
}
