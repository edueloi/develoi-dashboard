import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Heart, Target, TrendingUp, Star, Sparkles, CheckCircle2, Plus, Trash2, Save, Rocket, Compass, ShieldCheck } from 'lucide-react';
import { Button, Input, Textarea, PanelCard, EmptyState, StatGrid, StatCard } from '../ui';
import type { SiteValues } from './types';
import { cn } from '../../lib/utils';

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

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-6 flex items-start gap-5">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-black text-indigo-900 uppercase tracking-tight">Cultura & DNA</p>
          <p className="text-xs text-indigo-600/80 mt-1 font-medium leading-relaxed">
            Configure as diretrizes estratégicas da Develoi. 
            Estes pilares são a base do nosso site oficial e transmitem nossa essência ao mercado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PanelCard 
          title="Nossa Missão" 
          description="O propósito central — por que existimos."
          icon={Target}
          iconWrapClassName="bg-indigo-50 border-indigo-100"
          iconClassName="text-indigo-600"
        >
          <Textarea 
            rows={5} 
            placeholder="Ex: Transformar ideias em soluções digitais de alto impacto..." 
            value={data.mission} 
            onChange={e => setData(d => ({ ...d, mission: e.target.value }))} 
            className="font-medium italic"
          />
        </PanelCard>

        <PanelCard 
          title="Nossa Visão" 
          description="Onde queremos chegar — o futuro que buscamos."
          icon={TrendingUp}
          iconWrapClassName="bg-emerald-50 border-emerald-100"
          iconClassName="text-emerald-600"
        >
          <Textarea 
            rows={5} 
            placeholder="Ex: Ser referência nacional em inovação e desenvolvimento de software..." 
            value={data.vision} 
            onChange={e => setData(d => ({ ...d, vision: e.target.value }))} 
            className="font-medium italic"
          />
        </PanelCard>
      </div>

      <PanelCard 
        title="Valores Inegociáveis" 
        description="Os princípios que regem cada linha de código e cada decisão."
        icon={Star}
        iconWrapClassName="bg-amber-50 border-amber-100"
        iconClassName="text-amber-600"
        action={
          <Button variant="outline" size="sm" onClick={() => setData(d => ({ ...d, values: [...d.values, { title: '', description: '' }] }))} iconLeft={<Plus className="w-3.5 h-3.5" />}>
            ADICIONAR VALOR
          </Button>
        }
      >
        {data.values.length === 0 ? (
          <EmptyState 
            icon={Sparkles}
            title="Sem valores cadastrados"
            description="Defina os valores que representam a cultura da Develoi."
            className="border-none bg-zinc-50/30"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.values.map((v, i) => (
              <div key={i} className="group p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-amber-100/20 transition-all relative">
                <button 
                  onClick={() => setData(d => ({ ...d, values: d.values.filter((_, idx) => idx !== i) }))} 
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="space-y-4">
                  <Input 
                    placeholder="Título do Valor (Ex: Transparência)" 
                    value={v.title} 
                    onChange={e => updateValue(i, 'title', e.target.value)}
                    className="font-black text-slate-900 border-none bg-transparent focus:bg-white px-0"
                  />
                  <Textarea 
                    rows={2} 
                    placeholder="Descrição detalhada..." 
                    value={v.description} 
                    onChange={e => updateValue(i, 'description', e.target.value)} 
                    className="text-xs font-medium border-none bg-transparent focus:bg-white px-0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      <div className="flex items-center justify-end gap-6 pt-6 border-t border-slate-100">
        {saved && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Atualizado com sucesso</span>
          </motion.div>
        )}
        <Button onClick={handleSave} loading={saving} size="lg" className="min-w-[200px]" iconLeft={<Save className="w-5 h-5" />}>
          SALVAR ALTERAÇÕES
        </Button>
      </div>
    </div>
  );
}
