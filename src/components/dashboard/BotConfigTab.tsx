// Bot Config UI
import React, { useState, useEffect } from 'react';
import { Settings, Save, Smartphone, MessageSquare, List, Plus, Trash2 } from 'lucide-react';
import { Button, PanelCard, Input, Select, Textarea, ConfirmModal, Badge } from '../ui';
import { toast } from 'react-hot-toast';

export function BotConfigTab() {
  const [config, setConfig] = useState<any>(null);
  const [instance, setInstance] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [confRes, instRes, secRes] = await Promise.all([
        fetch('/api/admin/bot/config').then(r => r.json()),
        fetch('/api/admin/bot/instance').then(r => r.json()),
        fetch('/api/admin/bot/sectors').then(r => r.json())
      ]);
      setConfig(confRes);
      setInstance(instRes);
      setSectors(secRes);
    } catch (e) {
      toast.error('Erro ao carregar dados do bot');
    }
    setLoading(false);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/bot/status');
      const data = await res.json();
      if (data.status === 'qr_pending' && data.qrDataUrl) {
        setQrCode(data.qrDataUrl);
      } else {
        setQrCode(null);
      }
      setInstance((prev: any) => ({ ...prev, status: data.status, phone: data.phone }));
    } catch (e) {}
  };

  const handleConnect = async () => {
    await fetch('/api/admin/bot/connect', { method: 'POST' });
    toast.success('Iniciando conexão...');
  };

  const handleDisconnect = async () => {
    await fetch('/api/admin/bot/disconnect', { method: 'POST' });
    toast.success('Desconectado');
  };

  const handleSaveConfig = async () => {
    await fetch('/api/admin/bot/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    toast.success('Configurações salvas');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black dash-text">WhatsApp Bot</h2>
          <p className="text-sm dash-text-muted">Gerencie a conexão e fluxos do bot</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PanelCard title="Conexão do WhatsApp" icon={Smartphone}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border dash-border bg-slate-50 dark:bg-white/5">
              <div className={`w-3 h-3 rounded-full ${instance?.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm font-bold dash-text">
                  {instance?.status === 'connected' ? 'Conectado' : 
                   instance?.status === 'qr_pending' ? 'Aguardando QR Code' : 'Desconectado'}
                </p>
                {instance?.phone && <p className="text-xs dash-text-muted">{instance.phone}</p>}
              </div>
            </div>

            {qrCode && (
              <div className="flex justify-center p-4">
                <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-xl border dash-border" />
              </div>
            )}

            <div className="flex gap-2">
              {instance?.status !== 'connected' ? (
                <Button onClick={handleConnect} fullWidth>CONECTAR</Button>
              ) : (
                <Button onClick={handleDisconnect} variant="danger" fullWidth>DESCONECTAR</Button>
              )}
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Configurações Gerais" icon={Settings}>
          {config && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border dash-border">
                <div>
                  <p className="text-sm font-bold dash-text">Bot Ativado</p>
                  <p className="text-xs dash-text-muted">Ligar/Desligar respostas automáticas</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.botEnabled} 
                  onChange={(e) => setConfig({ ...config, botEnabled: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border dash-border">
                <div>
                  <p className="text-sm font-bold dash-text">Enviar Boas-vindas</p>
                  <p className="text-xs dash-text-muted">Para novos contatos</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.sendWelcome} 
                  onChange={(e) => setConfig({ ...config, sendWelcome: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600"
                />
              </div>

              <Button onClick={handleSaveConfig} iconLeft={<Save className="w-4 h-4" />}>
                SALVAR CONFIGURAÇÕES
              </Button>
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
