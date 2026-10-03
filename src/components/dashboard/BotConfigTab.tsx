// Bot Config UI
import React, { useState, useEffect } from 'react';
import { Settings, Save, Smartphone, MessageSquare, List, Plus, Trash2, Users, Wand2, Sun } from 'lucide-react';
import { Button, PanelCard, Input, Select, Textarea, ConfirmModal, Badge } from '../ui';
import { toast } from 'react-hot-toast';
import { BotIntelligence } from './BotIntelligence';

interface AttendantRow { name: string; phone: string }
interface SectorRow { id?: string; name: string; menuKey: string; attendants: AttendantRow[]; intake: string }

function parseAttendantsJson(v: any): AttendantRow[] {
  try {
    const arr = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(arr) ? arr.map((a: any) => ({ name: a?.name ?? '', phone: a?.phone ?? '' })) : [];
  } catch { return []; }
}

export function BotConfigTab() {
  const [config, setConfig] = useState<any>(null);
  const [instance, setInstance] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<any[]>([]);
  const [sectorRows, setSectorRows] = useState<SectorRow[]>([]);
  const [defaults, setDefaults] = useState<{ welcome: string; solutions: string; clientHelp: string } | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [confRes, instRes, secRes, defRes] = await Promise.all([
        fetch('/api/admin/bot/config').then(r => r.json()),
        fetch('/api/admin/bot/instance').then(r => r.json()),
        fetch('/api/admin/bot/sectors').then(r => r.json()),
        fetch('/api/admin/bot/menu-defaults').then(r => r.json()).catch(() => null),
      ]);
      setDefaults(defRes);
      setConfig(confRes);
      setInstance(instRes);
      setSectors(secRes);
      setSectorRows(secRes.map((x: any) => ({ id: x.id, name: x.name, menuKey: x.menuKey, attendants: parseAttendantsJson(x.attendants), intake: x.intake ?? 'none' })));
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

  const updateSector = (i: number, patch: Partial<SectorRow>) =>
    setSectorRows(rows => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const updateAttendant = (i: number, j: number, patch: Partial<AttendantRow>) =>
    setSectorRows(rows => rows.map((r, idx) => idx !== i ? r : { ...r, attendants: r.attendants.map((a, k) => (k === j ? { ...a, ...patch } : a)) }));

  const saveSector = async (i: number) => {
    const row = sectorRows[i];
    if (!row.name.trim()) return toast.error('Informe o nome do setor');
    const attendants = row.attendants.filter(a => a.name.trim() && a.phone.replace(/\D/g, '').length >= 8);
    const res = await fetch('/api/admin/bot/sectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, name: row.name.trim(), menuKey: row.menuKey || String(i + 1), attendants, intake: row.intake }),
    });
    if (!res.ok) return toast.error('Erro ao salvar setor');
    toast.success('Setor salvo');
    fetchData();
  };

  const removeSector = async (i: number) => {
    const row = sectorRows[i];
    if (row.id) {
      if (!confirm(`Remover o setor "${row.name}"?`)) return;
      await fetch(`/api/admin/bot/sectors/${row.id}`, { method: 'DELETE' });
      fetchData();
    } else {
      setSectorRows(rows => rows.filter((_, idx) => idx !== i));
    }
  };

  // Salva os textos e (re)monta o menu no servidor: Soluções · setores · Já sou cliente
  const generateMenu = async () => {
    if (!confirm('Isso monta o menu do bot com os setores e os textos abaixo, substituindo o fluxo atual. Continuar?')) return;
    setSavingMenu(true);
    try {
      if (config) {
        await fetch('/api/admin/bot/config', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...config, menuWelcomeMsg: config.menuWelcomeMsg ?? null, solutionsMsg: config.solutionsMsg ?? null, clientHelpMsg: config.clientHelpMsg ?? null }),
        });
      }
      const res = await fetch('/api/admin/bot/flow/default', { method: 'POST' });
      if (!res.ok) throw new Error();
      toast.success('Menu do bot atualizado');
      fetchData();
    } catch { toast.error('Erro ao gerar o menu'); }
    setSavingMenu(false);
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

              <div className="flex items-center justify-between p-4 rounded-xl border dash-border">
                <div>
                  <p className="text-sm font-bold dash-text">Menus com botões</p>
                  <p className="text-xs dash-text-muted">Botões clicáveis só aparecem no celular; no WhatsApp Web/Desktop o cliente vê "Não foi possível carregar a mensagem". Desligado, o menu sai em texto numerado e funciona em qualquer aparelho.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.useButtons !== false}
                  onChange={(e) => setConfig({ ...config, useButtons: e.target.checked })}
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

      <PanelCard title="Mensagens do bot" icon={Sun}>
        {config && (
          <div className="space-y-4">
            <p className="text-xs dash-text-muted">
              O bot sempre cumprimenta com <b>Bom dia</b>, <b>Boa tarde</b> ou <b>Boa noite</b> conforme o horário, em tom formal. Use
              <b> {'{{saudacao}}'}</b> para a saudação do momento e <b>{'{{nome}}'}</b> para o primeiro nome do cliente.
              Deixe em branco para usar o texto padrão.
            </p>
            <Textarea label="Boas-vindas (menu inicial)" rows={4} value={config.menuWelcomeMsg ?? ''} placeholder={defaults?.welcome}
              onChange={(e: any) => setConfig({ ...config, menuWelcomeMsg: e.target.value })} />
            <Textarea label="Opção 1 — Conhecer nossas soluções" rows={6} value={config.solutionsMsg ?? ''} placeholder={defaults?.solutions ?? 'Se vazio, usa os produtos cadastrados em Produtos & Planos.'}
              onChange={(e: any) => setConfig({ ...config, solutionsMsg: e.target.value })} />
            <Textarea label="Última opção — Já sou cliente" rows={5} value={config.clientHelpMsg ?? ''} placeholder={defaults?.clientHelp}
              onChange={(e: any) => setConfig({ ...config, clientHelpMsg: e.target.value })} />
            <Button onClick={generateMenu} loading={savingMenu} iconLeft={<Wand2 className="w-4 h-4" />}>SALVAR TEXTOS E ATUALIZAR O MENU</Button>
          </div>
        )}
      </PanelCard>

      <BotIntelligence />

      <PanelCard title="Setores e Atendentes" icon={Users}>
        <div className="space-y-4">
          <p className="text-xs dash-text-muted">
            Quando o cliente escolhe um setor, o bot avisa os atendentes pelo WhatsApp com um resumo. O atendente responde
            <b> 1</b> para aceitar ou <b>2</b> para recusar e passa a conversar com o cliente através do bot (o nome dele aparece em negrito
            em cada mensagem). Para encerrar, ele envia <b>&amp;sair</b> e o cliente volta ao bot.
          </p>

          {sectorRows.map((row, i) => (
            <div key={row.id ?? `new-${i}`} className="p-4 rounded-xl border dash-border space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input label="Nome do setor" value={row.name} onChange={(e: any) => updateSector(i, { name: e.target.value })} />
                </div>
                <div className="w-20">
                  <Input label="Opção" value={row.menuKey} onChange={(e: any) => updateSector(i, { menuKey: e.target.value })} />
                </div>
                <button onClick={() => removeSector(i)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>

              <label className="flex items-start gap-2.5 text-sm cursor-pointer dash-text">
                <input type="checkbox" className="w-4 h-4 mt-0.5 accent-indigo-600" checked={row.intake === 'support'}
                  onChange={e => updateSector(i, { intake: e.target.checked ? 'support' : 'none' })} />
                <span>Triagem de suporte
                  <span className="block text-[11px] dash-text-muted">Antes da fila, o bot pergunta o sistema (botões dos produtos marcados para suporte), o CPF/CNPJ e o assunto, e mostra a posição na fila.</span>
                </span>
              </label>

              <p className="text-[11px] font-bold uppercase dash-text-muted">Atendentes</p>
              {row.attendants.map((a, j) => (
                <div key={j} className="flex gap-2 items-end">
                  <div className="flex-1"><Input label={j === 0 ? 'Nome' : undefined} value={a.name} onChange={(e: any) => updateAttendant(i, j, { name: e.target.value })} /></div>
                  <div className="flex-1"><Input label={j === 0 ? 'WhatsApp (com DDD)' : undefined} placeholder="15999999999" value={a.phone} onChange={(e: any) => updateAttendant(i, j, { phone: e.target.value })} /></div>
                  <button onClick={() => updateSector(i, { attendants: row.attendants.filter((_, k) => k !== j) })} className="p-3 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => updateSector(i, { attendants: [...row.attendants, { name: '', phone: '' }] })} iconLeft={<Plus className="w-4 h-4" />}>
                  ATENDENTE
                </Button>
                <Button size="sm" onClick={() => saveSector(i)} iconLeft={<Save className="w-4 h-4" />}>SALVAR SETOR</Button>
              </div>
            </div>
          ))}

          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setSectorRows(rows => [...rows, { name: '', menuKey: String(rows.length + 1), attendants: [], intake: 'none' }])} iconLeft={<Plus className="w-4 h-4" />}>
              NOVO SETOR
            </Button>
            <Button variant="secondary" onClick={generateMenu} iconLeft={<Wand2 className="w-4 h-4" />}>
              ATUALIZAR MENU DO BOT
            </Button>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
