import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, ChevronRight, Target, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StatGrid, StatCard, EmptyState, Button, PanelCard, Badge } from '../ui';
import type { Feature } from './types';
import { cn } from '../../lib/utils';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard 
          title="Aguardando Validação" 
          value={features.length} 
          icon={Clock} 
          color="warning"
          delay={0.1}
        />
        <StatCard 
          title="Validados Hoje" 
          value={0} 
          icon={CheckCircle2} 
          color="success"
          delay={0.2}
        />
        <StatCard 
          title="Taxa de Aprovação" 
          value="100%" 
          icon={ShieldCheck} 
          color="info"
          delay={0.3}
        />
      </StatGrid>

      {/* Test cards */}
      {features.length === 0 ? (
        <EmptyState 
          icon={ShieldCheck}
          title="Tudo em conformidade"
          description="Nenhum teste pendente no momento. Todas as funcionalidades foram validadas ou estão em desenvolvimento."
          className="py-24"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PanelCard
                noPadding
                title={feature.title}
                description="Funcionalidade aguardando assinatura técnica"
                icon={ClipboardCheck}
                iconWrapClassName="bg-amber-50 border-amber-100"
                iconClassName="text-amber-600"
                action={
                  <Badge color="warning" dot pill>
                    {feature.key || feature.id.slice(0, 6).toUpperCase()}
                  </Badge>
                }
                className="hover:shadow-2xl hover:shadow-amber-100/40 transition-all border-amber-100"
              >
                <div className="p-8 space-y-8">
                  {/* Scenarios */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-amber-400 rounded-full" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Cenários de Teste
                      </h4>
                    </div>
                    <div className="p-6 bg-amber-50/30 rounded-3xl text-sm text-slate-700 border border-amber-100/50 leading-relaxed whitespace-pre-wrap font-medium">
                      {feature.testScenarios || 'Nenhum cenário definido para esta validação.'}
                    </div>
                  </div>

                  {/* Business rules */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-indigo-400 rounded-full" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Regras de Negócio
                      </h4>
                    </div>
                    <div className="p-6 bg-indigo-50/30 rounded-3xl text-sm text-slate-700 border border-indigo-100/50 leading-relaxed whitespace-pre-wrap font-medium">
                      {feature.businessRules || 'Nenhuma regra de negócio vinculada.'}
                    </div>
                  </div>

                  <Button
                    onClick={() => validateFeature(feature.id)}
                    loading={validating === feature.id}
                    fullWidth
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                    iconLeft={<CheckCircle2 className="w-5 h-5" />}
                  >
                    VALIDAR E ASSINAR TÉCNICAMENTE
                  </Button>
                </div>
              </PanelCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
