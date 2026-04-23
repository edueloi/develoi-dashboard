import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Heart, Target, TrendingUp, Star, Sparkles, CheckCircle2, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import type { SiteValues } from './types';

export function SiteValuesManager() {
  const [data, setData] = useState<SiteValues>({ mission: '', vision: '', values: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/site/values')
      .then(r => r.json())
      .then(d => setData({ mission: d.mission || '', vision: d.vision || '', values: d.values || [] }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/site/values', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (index: number, field: 'title' | 'description', val: string) => {
    setData(d => {
      const values = [...d.values];
      values[index] = { ...values[index], [field]: val };
      return { ...d, values };
    });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando valores...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
        <Heart className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700 font-medium">O conteúdo aqui é exibido na página <strong>Missão &amp; Valores</strong> do site público.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900">Missão</h3>
          </div>
          <p className="text-xs text-slate-400">O propósito central da Develoi — por que existimos.</p>
          <textarea rows={4} placeholder="Ex: Transformar ideias em soluções digitais de alto impacto..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={data.mission} onChange={e => setData(d => ({ ...d, mission: e.target.value }))} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900">Visão</h3>
          </div>
          <p className="text-xs text-slate-400">Onde a Develoi quer chegar — o futuro que buscamos.</p>
          <textarea rows={4} placeholder="Ex: Ser referência nacional em inovação e desenvolvimento de software..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={data.vision} onChange={e => setData(d => ({ ...d, vision: e.target.value }))} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="font-bold text-slate-900">Valores</h3>
          </div>
          <button onClick={() => setData(d => ({ ...d, values: [...d.values, { title: '', description: '' }] }))} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-all border border-indigo-100">
            <Plus className="w-3.5 h-3.5" /> Adicionar Valor
          </button>
        </div>

        {data.values.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhum valor cadastrado. Adicione o primeiro!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.values.map((v, i) => (
              <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex-1 space-y-3">
                  <input type="text" placeholder="Ex: Excelência, Inovação, Transparência..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} />
                  <textarea rows={2} placeholder="Breve descrição deste valor..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" value={v.description} onChange={e => updateValue(i, 'description', e.target.value)} />
                </div>
                <button onClick={() => setData(d => ({ ...d, values: d.values.filter((_, idx) => idx !== i) }))} className="self-start p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4">
        {saved && (
          <motion.p initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
          </motion.p>
        )}
        <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4 mr-2" /> SALVAR TUDO</Button>
      </div>
    </div>
  );
}
