import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft,
  Briefcase,
  Camera,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Link2,
  ShieldCheck,
  Target,
  Users,
  X,
} from 'lucide-react';
import type { Project } from './types';
import {
  Button,
  ContentCard,
  Input,
  PanelCard,
  SectionTitle,
  Select,
  Tabs,
  Textarea,
  useToast,
} from '../ui';
import type { TabItem } from '../ui';
import { cn } from '../../lib/utils';

type FormTab = 'general' | 'details' | 'access';

interface TeamMember {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface ProjectFormPageProps {
  project?: Project | null;
  onCancel: () => void;
  onSaved: (project: Project) => void;
}

function asDateInput(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function ProjectImageField({ label, value, onChange, shape = 'banner' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  shape?: 'banner' | 'square';
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { show: toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Selecione um arquivo de imagem.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('A imagem deve ter no máximo 5 MB.', 'error');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result || ''));
      setUploading(false);
    };
    reader.onerror = () => {
      toast('Não foi possível ler esta imagem.', 'error');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="ds-label">{label}</span>
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-white/10 dark:bg-white/5">
        <div className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5',
          shape === 'banner' ? 'h-14 w-24' : 'h-14 w-14',
        )}>
          {value ? <img src={value} alt="Prévia" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-zinc-300" />}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button type="button" variant="outline" size="sm" loading={uploading} iconLeft={<Camera className="h-3.5 w-3.5" />} onClick={() => fileRef.current?.click()}>
          {value ? 'Trocar imagem' : 'Enviar imagem'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" aria-label={`Remover ${label.toLowerCase()}`} iconLeft={<X className="h-3.5 w-3.5" />} onClick={() => onChange('')} />
        )}
      </div>
    </div>
  );
}

export function ProjectFormPage({ project, onCancel, onSaved }: ProjectFormPageProps) {
  const editing = Boolean(project);
  const { show: toast } = useToast();
  const [activeTab, setActiveTab] = useState<FormTab>('general');
  const [name, setName] = useState(project?.name || '');
  const [clientName, setClientName] = useState(project?.clientName || '');
  const [description, setDescription] = useState(project?.description || '');
  const [deadline, setDeadline] = useState(asDateInput(project?.deadline));
  const [status, setStatus] = useState<Project['status']>(project?.status || 'active');
  const [progress, setProgress] = useState(project?.progress || 0);
  const [goals, setGoals] = useState(project?.goals?.join('\n') || '');
  const [financials, setFinancials] = useState(project?.financials || '');
  const [history, setHistory] = useState(project?.history || '');
  const [projectUrl, setProjectUrl] = useState(project?.projectUrl || '');
  const [coverImage, setCoverImage] = useState(project?.coverImage || '');
  const [logoUrl, setLogoUrl] = useState(project?.logoUrl || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(project?.visibility || 'public');
  const [allowedUsers, setAllowedUsers] = useState<string[]>(project?.allowedUsers || []);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then(response => response.ok ? response.json() : [])
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, []);

  const toggleUser = (uid: string) => {
    setAllowedUsers(current => current.includes(uid) ? current.filter(id => id !== uid) : [...current, uid]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !clientName.trim()) {
      setActiveTab('general');
      toast('Informe o nome do projeto e o cliente.', 'error');
      return;
    }
    setLoading(true);
    const payload = {
      ...(editing ? {} : { id: uuidv4() }),
      name: name.trim(),
      clientName: clientName.trim(),
      description: description.trim(),
      deadline: deadline || null,
      status,
      progress,
      visibility,
      allowedUsers: visibility === 'private' ? allowedUsers : [],
      goals: goals.split('\n').map(goal => goal.trim()).filter(Boolean),
      financials: financials.trim(),
      history: history.trim(),
      projectUrl: projectUrl.trim() || null,
      coverImage: coverImage || null,
      logoUrl: logoUrl || null,
    };

    try {
      const response = await fetch(editing ? `/api/projects/${project!.id}` : '/api/projects', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'Não foi possível salvar o projeto.');
      toast(editing ? 'Projeto atualizado com sucesso.' : 'Projeto criado com sucesso.', 'success');
      onSaved(data as Project);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Não foi possível salvar o projeto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs: readonly TabItem<FormTab>[] = [
    { id: 'general', label: 'Geral', icon: Briefcase },
    { id: 'details', label: 'Planejamento', icon: Target },
    { id: 'access', label: 'Acesso', icon: Users, badge: visibility === 'private' ? allowedUsers.length : undefined },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5">
      <Button type="button" variant="ghost" size="sm" iconLeft={<ArrowLeft className="h-3.5 w-3.5" />} onClick={onCancel}>
        Voltar para projetos
      </Button>

      <SectionTitle
        title={editing ? 'Editar projeto' : 'Novo projeto'}
        description={editing ? 'Atualize os dados, planejamento e permissões do projeto.' : 'Organize as informações essenciais antes de iniciar o trabalho.'}
        icon={Briefcase}
        action={editing ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">Edição</span> : undefined}
      />

      <ContentCard padding="lg">
        <form onSubmit={submit} className="space-y-6">
          <Tabs items={tabs} value={activeTab} onChange={value => setActiveTab(value as FormTab)} label="Seções do formulário de projeto">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <PanelCard title="Informações principais" description="Identifique o projeto, cliente e prazo." icon={Briefcase}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Nome do projeto" required value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Site institucional" />
                    <Input label="Cliente" required value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Ex.: Empresa do cliente" />
                    <Input label="Prazo final" type="date" value={deadline} onChange={event => setDeadline(event.target.value)} />
                    <Input label="URL do projeto" value={projectUrl} onChange={event => setProjectUrl(event.target.value)} placeholder="https://exemplo.com.br" iconLeft={<Link2 className="h-4 w-4" />} />
                    <Textarea label="Descrição" value={description} onChange={event => setDescription(event.target.value)} placeholder="Qual é o objetivo principal deste projeto?" rows={4} wrapperClassName="md:col-span-2" />
                  </div>
                </PanelCard>

                {editing && (
                  <PanelCard title="Andamento" description="Acompanhe a situação atual do projeto." icon={Target}>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                      <Select label="Status" value={status} onChange={event => setStatus(event.target.value as Project['status'])} options={[
                        { value: 'active', label: 'Ativo' },
                        { value: 'completed', label: 'Concluído' },
                        { value: 'on-hold', label: 'Em espera' },
                      ]} />
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between"><span className="ds-label">Progresso</span><strong className="text-sm text-[#0D1F4E] dark:text-amber-300">{progress}%</strong></div>
                        <input aria-label="Progresso do projeto" type="range" min="0" max="100" step="5" value={progress} onChange={event => setProgress(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-[#0D1F4E]" />
                      </div>
                    </div>
                  </PanelCard>
                )}

                <PanelCard title="Identidade visual" description="Use imagens de até 5 MB para facilitar a identificação." icon={ImageIcon}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ProjectImageField label="Capa do projeto" value={coverImage} onChange={setCoverImage} />
                    <ProjectImageField label="Logo do projeto" value={logoUrl} onChange={setLogoUrl} shape="square" />
                  </div>
                </PanelCard>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-4">
                <PanelCard title="Metas" description="Inclua uma meta por linha para manter o escopo claro." icon={Target}>
                  <Textarea label="Metas do projeto" value={goals} onChange={event => setGoals(event.target.value)} placeholder={'Criar a identidade visual\nPublicar a primeira versão\nTreinar a equipe'} rows={7} />
                </PanelCard>
                <PanelCard title="Financeiro e contexto" description="Registre informações úteis para o time." icon={Briefcase}>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Textarea label="Financeiro e orçamento" value={financials} onChange={event => setFinancials(event.target.value)} placeholder="Valor, pagamento, parcelas e observações" rows={6} />
                    <Textarea label="História e contexto" value={history} onChange={event => setHistory(event.target.value)} placeholder="Como surgiu, expectativas e decisões importantes" rows={6} />
                  </div>
                </PanelCard>
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-4">
                <PanelCard title="Visibilidade" description="Defina quem pode localizar e acessar este projeto." icon={ShieldCheck}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { value: 'public' as const, label: 'Público', description: 'Todos os membros com acesso ao painel podem ver.', icon: Eye },
                      { value: 'private' as const, label: 'Privado', description: 'Somente as pessoas escolhidas abaixo podem ver.', icon: ShieldCheck },
                    ].map(option => {
                      const selected = visibility === option.value;
                      return <button key={option.value} type="button" onClick={() => setVisibility(option.value)} className={cn('rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/30', selected ? 'border-[#0D1F4E] bg-[#0D1F4E]/5 shadow-sm dark:border-amber-400 dark:bg-amber-400/10' : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20')}>
                        <div className="flex items-center justify-between gap-3"><option.icon className={cn('h-5 w-5', selected ? 'text-[#0D1F4E] dark:text-amber-300' : 'text-zinc-400')} />{selected && <CheckCircle2 className="h-4 w-4 text-[#0D1F4E] dark:text-amber-300" />}</div>
                        <p className="mt-3 text-sm font-black text-zinc-800 dark:text-white">{option.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-white/50">{option.description}</p>
                      </button>;
                    })}
                  </div>
                </PanelCard>

                {visibility === 'private' && (
                  <PanelCard title="Pessoas autorizadas" description={`${allowedUsers.length} pessoa${allowedUsers.length === 1 ? '' : 's'} selecionada${allowedUsers.length === 1 ? '' : 's'}.`} icon={Users}>
                    {members.length === 0 ? <p className="text-sm text-zinc-500">Nenhum membro disponível para seleção.</p> : <div className="grid max-h-[26rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {members.map(member => {
                        const selected = allowedUsers.includes(member.uid);
                        return <button key={member.uid} type="button" onClick={() => toggleUser(member.uid)} className={cn('flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D1F4E]/30', selected ? 'border-amber-300 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/10' : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20')}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-xs font-black text-zinc-500 dark:bg-white/10 dark:text-white/60">{member.photoURL ? <img src={member.photoURL} alt="" className="h-full w-full object-cover" /> : member.displayName?.[0]?.toUpperCase() || '?'}</div>
                          <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-zinc-800 dark:text-white">{member.displayName || 'Membro sem nome'}</p><p className="truncate text-[10px] text-zinc-400">{member.email}</p></div>
                          {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />}
                        </button>;
                      })}
                    </div>}
                  </PanelCard>
                )}
              </div>
            )}
          </Tabs>

          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6 lg:-mx-7 lg:-mb-7 lg:px-7 dark:border-white/10 dark:bg-[#10182b]/95">
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" size="lg" loading={loading} iconLeft={<CheckCircle2 className="h-4 w-4" />}>{editing ? 'Salvar alterações' : 'Criar projeto'}</Button>
          </div>
        </form>
      </ContentCard>
    </div>
  );
}

export default ProjectFormPage;
