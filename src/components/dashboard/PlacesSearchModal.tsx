import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, Globe, Star, ExternalLink, KeyRound, Check } from 'lucide-react';
import { Button, Modal, Input, Select } from '../ui';
import { useToast } from '../ui/Toast';

interface Place {
  placeId: string; name: string; address: string | null; phone: string | null; website: string | null;
  rating: number | null; reviews: number; category: string | null; status: string | null; mapsUrl: string | null; already: boolean;
}
interface Status { configured: boolean; used: number; limit: number }

const RAMOS = ['Salão de beleza', 'Barbearia', 'Restaurante', 'Lanchonete', 'Loja de roupas', 'Mercado', 'Papelaria', 'Oficina mecânica', 'Clínica de estética', 'Clínica odontológica', 'Psicólogo', 'Academia', 'Pet shop', 'Loja de materiais de construção'];

// Busca empresas por ramo e cidade no Google Maps e importa as escolhidas como leads
export const PlacesSearchModal: React.FC<{ products: string[]; onClose: () => void; onImported: () => void }> = ({ products, onClose, onImported }) => {
  const { show: toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [ramo, setRamo] = useState('');
  const [city, setCity] = useState('Tatuí, SP');
  const [product, setProduct] = useState('');
  const [onlyPhone, setOnlyPhone] = useState(true);
  const [hideKnown, setHideKnown] = useState(true);
  const [results, setResults] = useState<Place[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [lastQuery, setLastQuery] = useState({ ramo: '', city: '' });

  useEffect(() => { fetch('/api/prospect/places/status').then(r => r.json()).then(setStatus).catch(() => setStatus({ configured: false, used: 0, limit: 0 })); }, []);

  const run = async (more = false) => {
    if (!ramo.trim() || !city.trim()) return toast('Informe o ramo e a cidade', 'error');
    setLoading(true);
    try {
      const q = more ? lastQuery : { ramo: ramo.trim(), city: city.trim() };
      const res = await fetch('/api/prospect/places/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...q, ...(more && token ? { pageToken: token } : {}) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Não foi possível buscar');
      setStatus(s => ({ configured: true, used: d.used, limit: d.limit ?? s?.limit ?? 0 }));
      setLastQuery(q);
      setToken(d.nextPageToken ?? null);
      setSearched(true);
      setResults(prev => {
        const base = more ? prev : [];
        const seen = new Set(base.map(x => x.placeId));
        return [...base, ...(d.places as Place[]).filter(p => !seen.has(p.placeId))];
      });
      if (!more) setPicked({});
    } catch (e: any) { toast(e.message, 'error'); }
    setLoading(false);
  };

  const visible = useMemo(() => results.filter(p => (!onlyPhone || p.phone) && (!hideKnown || !p.already) && p.status !== 'CLOSED_PERMANENTLY'), [results, onlyPhone, hideKnown]);
  const chosen = visible.filter(p => picked[p.placeId]);
  const selectable = visible.filter(p => !p.already);
  const allOn = selectable.length > 0 && selectable.every(p => picked[p.placeId]);

  const doImport = async () => {
    if (!chosen.length) return toast('Marque ao menos uma empresa', 'error');
    setImporting(true);
    try {
      const res = await fetch('/api/prospect/places/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: chosen, ramo: lastQuery.ramo, city: lastQuery.city.split(',')[0].trim(), product }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Não foi possível importar');
      toast(`${d.created} empresa(s) importada(s) como leads${d.skipped ? `, ${d.skipped} já estavam cadastradas` : ''}`, 'success');
      onImported();
      setResults(prev => prev.map(p => (picked[p.placeId] ? { ...p, already: true } : p)));
      setPicked({});
    } catch (e: any) { toast(e.message, 'error'); }
    setImporting(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Buscar empresas no Google Maps" size="xl"
      footer={searched ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select aria-label="Produto de interesse" value={product} onChange={e => setProduct(e.target.value)} placeholder="Produto de interesse (opcional)" options={[{ value: '', label: 'Sem produto definido' }, ...products.map(p => ({ value: p, label: p }))]} />
          <Button loading={importing} onClick={doImport} className="sm:flex-shrink-0" disabled={!chosen.length}>IMPORTAR {chosen.length || ''} COMO LEADS</Button>
        </div>
      ) : undefined}>
      <div className="space-y-4">
        {status && !status.configured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500/30 p-4 text-sm space-y-2">
            <p className="font-black flex items-center gap-2 text-amber-800 dark:text-amber-200"><KeyRound className="w-4 h-4" />A busca ainda não está ligada</p>
            <p className="text-amber-900/80 dark:text-amber-100/80">Falta a chave do Google Places no servidor. Para criar:</p>
            <ol className="list-decimal ml-5 space-y-1 text-amber-900/80 dark:text-amber-100/80 text-xs">
              <li>Entre em <b>console.cloud.google.com</b>, crie um projeto e ative o faturamento (pede um cartão, mas existe cota gratuita mensal).</li>
              <li>Em <b>APIs e serviços</b>, ative a <b>Places API (New)</b>.</li>
              <li>Em <b>Credenciais</b>, crie uma <b>chave de API</b> e restrinja o uso à Places API (New).</li>
              <li>Em <b>Cotas</b>, limite as consultas por dia e crie um <b>alerta de orçamento</b> para ser avisado de qualquer gasto.</li>
              <li>Coloque a chave no servidor como <b>GOOGLE_PLACES_API_KEY</b>.</li>
            </ol>
          </div>
        )}

        <div className="grid sm:grid-cols-[1.4fr_1fr_auto] gap-3 items-end">
          <Input label="Ramo" value={ramo} onChange={e => setRamo(e.target.value)} placeholder="Ex.: barbearia, salão de beleza" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run(); } }} />
          <Input label="Cidade" value={city} onChange={e => setCity(e.target.value)} placeholder="Tatuí, SP" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run(); } }} />
          <Button loading={loading && !results.length} onClick={() => run()} disabled={status ? !status.configured : false}><Search className="w-4 h-4 mr-1.5" />BUSCAR</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RAMOS.map(r => (
            <button type="button" key={r} onClick={() => setRamo(r)} className="px-2.5 py-1 rounded-full text-[11px] font-semibold border"
              style={ramo === r ? { background: '#0D1F4E', color: '#fff', borderColor: '#0D1F4E' } : { borderColor: 'rgba(100,116,139,0.3)', color: '#64748B' }}>{r}</button>
          ))}
        </div>

        {status?.configured && (
          <p className="text-[11px] text-slate-400">
            Consultas neste mês: <b className="text-slate-600 dark:text-slate-300">{status.used} de {status.limit}</b> (travamos antes de passar da cota gratuita do Google). Cada busca traz até 20 empresas por página, e 3 páginas no máximo.
          </p>
        )}

        {searched && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <label className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={onlyPhone} onChange={e => setOnlyPhone(e.target.checked)} />Só com telefone</label>
              <label className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={hideKnown} onChange={e => setHideKnown(e.target.checked)} />Esconder quem já está cadastrado</label>
              <button type="button" className="font-bold text-blue-600 ml-auto" onClick={() => setPicked(allOn ? {} : Object.fromEntries(selectable.map(p => [p.placeId, true])))}>{allOn ? 'Desmarcar todos' : `Marcar todos (${selectable.length})`}</button>
            </div>

            {visible.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{results.length ? 'Nada novo com esses filtros. Desmarque um filtro ou carregue mais resultados.' : 'O Google não encontrou empresas para essa busca. Tente outro ramo ou outra cidade.'}</p>
            ) : (
              <ul className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {visible.map(p => (
                  <li key={p.placeId} className={`rounded-xl border p-3 flex gap-3 ${p.already ? 'opacity-60' : ''}`} style={{ borderColor: picked[p.placeId] ? '#15803D' : 'rgba(148,163,184,0.3)', background: picked[p.placeId] ? 'rgba(21,128,61,0.05)' : undefined }}>
                    <input type="checkbox" className="mt-1 flex-shrink-0" disabled={p.already} checked={!!picked[p.placeId]} onChange={e => setPicked(x => ({ ...x, [p.placeId]: e.target.checked }))} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-slate-900 dark:text-white break-words">{p.name}</p>
                        {p.category && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500">{p.category}</span>}
                        {p.already && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check className="w-3 h-3" />Já cadastrado</span>}
                      </div>
                      {p.address && <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /><span className="break-words">{p.address}</span></p>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 font-semibold" style={{ color: p.phone ? '#15803D' : '#94A3B8' }}><Phone className="w-3 h-3" />{p.phone ?? 'sem telefone'}</span>
                        {p.rating ? <span className="flex items-center gap-1 text-amber-600 font-semibold"><Star className="w-3 h-3" fill="currentColor" />{p.rating.toLocaleString('pt-BR')} <span className="text-slate-400 font-normal">({p.reviews})</span></span> : null}
                        {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline max-w-[220px] truncate"><Globe className="w-3 h-3 flex-shrink-0" /><span className="truncate">{p.website.replace(/^https?:\/\/(www\.)?/, '')}</span></a>}
                        {p.mapsUrl && <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-500 hover:underline"><ExternalLink className="w-3 h-3" />Maps</a>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {token && (
              <div className="text-center"><Button variant="outline" size="sm" loading={loading} onClick={() => run(true)}>CARREGAR MAIS RESULTADOS</Button></div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
