import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Feature } from './types';

export function TestModule({ projectId }: { projectId: string }) {
  const { profile } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [validating, setValidating] = useState<string | null>(null);

  const fetchFeatures = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/features`);
      const data = await response.json();
      setFeatures(data.filter((f: Feature) => f.status === 'testing'));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFeatures();
    const interval = setInterval(fetchFeatures, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const validateFeature = async (featureId: string) => {
    setValidating(featureId);
    try {
      await fetch(`/api/projects/${projectId}/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isValidated: 1, validatedBy: profile?.displayName, status: 'done' }),
      });
      fetchFeatures();
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Aguardando Validação', value: features.length, icon: Clock, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
          { label: 'Validados Hoje', value: 0, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
          { label: 'Taxa de Aprovação', value: '100%', icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-200' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Test cards */}
      {features.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum teste pendente</h3>
          <p className="text-slate-400 text-sm">Tudo validado ou em desenvolvimento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Aguardando Validação</span>
                </div>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg border border-amber-200 uppercase">
                  {feature.key || feature.id.slice(0, 6).toUpperCase()}
                </span>
              </div>

              <div className="p-6 space-y-5">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{feature.title}</h3>

                {/* Scenarios */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3" /> Cenários de Teste
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {feature.testScenarios || 'Nenhum cenário definido.'}
                  </div>
                </div>

                {/* Business rules */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3" /> Regras de Negócio
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {feature.businessRules || 'Nenhuma regra definida.'}
                  </div>
                </div>

                <button
                  onClick={() => validateFeature(feature.id)}
                  disabled={validating === feature.id}
                  className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-60"
                >
                  {validating === feature.id ? (
                    <span className="animate-pulse">Validando...</span>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> VALIDAR E ASSINAR</>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
