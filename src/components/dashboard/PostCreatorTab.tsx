import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { 
  Download, Layout, Type, Palette, Image as ImageIcon, 
  Trash2, History, Plus, Circle, Square, Save, 
  Upload, MousePointer2, AlignLeft, AlignCenter, AlignRight,
  Copy, Layers, Send, Instagram, X, ChevronLeft, Hexagon, Sparkles, Zap
} from 'lucide-react';
import { Button, Input, Textarea, Select, Badge, PanelCard } from '../ui';
import { v4 as uuidv4 } from 'uuid';

type PostFormat = 'instagram' | 'facebook' | 'stories';

interface FormatConfig {
  id: PostFormat;
  name: string;
  width: number;
  height: number;
}

const FORMATS: FormatConfig[] = [
  { id: 'instagram', name: 'Instagram Feed', width: 1080, height: 1080 },
  { id: 'facebook', name: 'Facebook Post', width: 1200, height: 630 },
  { id: 'stories', name: 'Stories', width: 1080, height: 1920 },
];

type ElementType = 'text' | 'image' | 'shape';

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  // Text
  text?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  // Image
  src?: string;
  // Shape
  shapeType?: 'rectangle' | 'circle';
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
}

interface ProjectState {
  id: string;
  name: string;
  format: PostFormat;
  bgColor: string;
  elements: CanvasElement[];
  thumbnail?: string;
  updatedAt: number;
}

// ─── Templates Pré-Prontos ───────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 't1',
    name: 'Develoi Institucional',
    icon: <Sparkles className="w-5 h-5 text-blue-400" />,
    format: 'instagram' as PostFormat,
    bgColor: '#020617',
    elements: [
      { id: uuidv4(), type: 'shape', x: 500, y: -200, width: 800, height: 800, zIndex: 1, shapeType: 'circle', backgroundColor: '#1e3a8a', borderRadius: 9999, opacity: 0.5 },
      { id: uuidv4(), type: 'text', x: 80, y: 80, width: 900, height: 80, zIndex: 2, text: 'Develoi Soluções', color: '#60a5fa', fontSize: 36, fontWeight: '900', textAlign: 'left', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'text', x: 80, y: 220, width: 900, height: 200, zIndex: 3, text: 'Tecnologia que\ntransforma negócios', color: '#ffffff', fontSize: 80, fontWeight: '900', textAlign: 'left', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'text', x: 80, y: 440, width: 800, height: 120, zIndex: 4, text: 'Soluções digitais inteligentes para empresas que querem crescer com eficiência e inovação.', color: '#94a3b8', fontSize: 32, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'shape', x: 80, y: 600, width: 220, height: 220, zIndex: 5, shapeType: 'rectangle', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 2, borderColor: '#1e293b' },
      { id: uuidv4(), type: 'text', x: 100, y: 680, width: 180, height: 60, zIndex: 6, text: 'Sistemas sob\nmedida', color: '#ffffff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'shape', x: 330, y: 600, width: 220, height: 220, zIndex: 5, shapeType: 'rectangle', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 2, borderColor: '#1e293b' },
      { id: uuidv4(), type: 'text', x: 350, y: 680, width: 180, height: 60, zIndex: 6, text: 'Automação de\nprocessos', color: '#ffffff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'shape', x: 80, y: 880, width: 470, height: 90, zIndex: 5, shapeType: 'rectangle', backgroundColor: '#2563eb', borderRadius: 45 },
      { id: uuidv4(), type: 'text', x: 80, y: 880, width: 470, height: 90, zIndex: 6, text: 'Fale com a Develoi >', color: '#ffffff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' },
    ] as CanvasElement[]
  },
  {
    id: 't2',
    name: 'Comunicado / Alerta',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    format: 'instagram' as PostFormat,
    bgColor: '#fdfbc8',
    elements: [
      { id: uuidv4(), type: 'shape', x: 40, y: 40, width: 1000, height: 1000, zIndex: 1, shapeType: 'rectangle', backgroundColor: '#ffffff', borderRadius: 40, borderWidth: 0 },
      { id: uuidv4(), type: 'shape', x: 40, y: 40, width: 1000, height: 120, zIndex: 2, shapeType: 'rectangle', backgroundColor: '#fbbf24', borderRadius: 40 },
      { id: uuidv4(), type: 'shape', x: 40, y: 80, width: 1000, height: 80, zIndex: 2, shapeType: 'rectangle', backgroundColor: '#fbbf24', borderRadius: 0 }, // cover bottom rounded corners
      { id: uuidv4(), type: 'text', x: 40, y: 60, width: 1000, height: 80, zIndex: 3, text: '⚠️ AVISO IMPORTANTE', color: '#78350f', fontSize: 40, fontWeight: '900', textAlign: 'center', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'text', x: 100, y: 300, width: 880, height: 200, zIndex: 3, text: 'Atualização no Sistema', color: '#1e293b', fontSize: 72, fontWeight: '900', textAlign: 'center', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'text', x: 100, y: 550, width: 880, height: 200, zIndex: 3, text: 'Informamos que passaremos por uma manutenção programada nesta sexta-feira às 22h. O sistema pode apresentar instabilidades.', color: '#475569', fontSize: 36, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'text', x: 100, y: 920, width: 880, height: 60, zIndex: 3, text: '@develoi.com.br', color: '#94a3b8', fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter' },
    ] as CanvasElement[]
  },
  {
    id: 't3',
    name: 'Citação Inspiradora',
    icon: <Type className="w-5 h-5 text-emerald-400" />,
    format: 'instagram' as PostFormat,
    bgColor: '#064e3b',
    elements: [
      { id: uuidv4(), type: 'text', x: 80, y: 150, width: 200, height: 200, zIndex: 1, text: '"', color: '#34d399', fontSize: 400, fontWeight: '900', textAlign: 'left', fontFamily: 'Inter', opacity: 0.3 },
      { id: uuidv4(), type: 'text', x: 100, y: 350, width: 880, height: 400, zIndex: 2, text: 'A inovação distingue um líder de um seguidor.', color: '#ffffff', fontSize: 72, fontWeight: 'bold', textAlign: 'left', fontFamily: 'Inter' },
      { id: uuidv4(), type: 'shape', x: 100, y: 700, width: 100, height: 8, zIndex: 3, shapeType: 'rectangle', backgroundColor: '#34d399', borderRadius: 4 },
      { id: uuidv4(), type: 'text', x: 100, y: 740, width: 880, height: 60, zIndex: 4, text: 'STEVE JOBS', color: '#a7f3d0', fontSize: 32, fontWeight: '900', textAlign: 'left', fontFamily: 'Inter', opacity: 0.8 },
      { id: uuidv4(), type: 'text', x: 100, y: 950, width: 880, height: 60, zIndex: 4, text: 'www.develoi.com.br', color: '#34d399', fontSize: 24, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Inter' },
    ] as CanvasElement[]
  }
];

export function PostCreatorTab() {
  const [activeTab, setActiveTab] = useState<'templates' | 'editor' | 'history'>('templates');
  const [editorSidebarTab, setEditorSidebarTab] = useState<'add' | 'format'>('add');
  const [projects, setProjects] = useState<ProjectState[]>([]);
  
  // Current Project State
  const [currentId, setCurrentId] = useState<string>(uuidv4());
  const [projectName, setProjectName] = useState('Novo Design');
  const [format, setFormat] = useState<PostFormat>('instagram');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('develoi_designs_v2');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveProjects = (newProjects: ProjectState[]) => {
    setProjects(newProjects);
    localStorage.setItem('develoi_designs_v2', JSON.stringify(newProjects));
  };

  const handleSave = async () => {
    let thumbnail = '';
    if (previewRef.current) {
      const prevSelected = selectedId;
      setSelectedId(null);
      await new Promise(r => setTimeout(r, 50)); 
      try {
        const canvas = await html2canvas(previewRef.current, { scale: 0.2, useCORS: true });
        thumbnail = canvas.toDataURL('image/jpeg', 0.5);
      } catch (e) {}
      setSelectedId(prevSelected);
    }

    const project: ProjectState = {
      id: currentId,
      name: projectName,
      format,
      bgColor,
      elements,
      thumbnail,
      updatedAt: Date.now(),
    };

    const existingIndex = projects.findIndex(p => p.id === currentId);
    let newProjects = [...projects];
    if (existingIndex >= 0) {
      newProjects[existingIndex] = project;
    } else {
      newProjects = [project, ...newProjects];
    }
    
    saveProjects(newProjects);
    alert('Design salvo com sucesso!');
  };

  const loadProject = (project: ProjectState) => {
    setCurrentId(project.id);
    setProjectName(project.name);
    setFormat(project.format);
    setBgColor(project.bgColor);
    setElements(project.elements || []);
    setSelectedId(null);
    setActiveTab('editor');
  };

  const loadTemplate = (template: typeof TEMPLATES[0]) => {
    setCurrentId(uuidv4());
    setProjectName(template.name);
    setFormat(template.format);
    setBgColor(template.bgColor);
    setElements(template.elements.map(el => ({ ...el, id: uuidv4() }))); // Deep copy with new IDs
    setSelectedId(null);
    setActiveTab('editor');
  };

  const deleteProject = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este design?')) {
      saveProjects(projects.filter(p => p.id !== id));
      if (currentId === id) startNewProject();
    }
  };

  const startNewProject = () => {
    setCurrentId(uuidv4());
    setProjectName('Design em Branco');
    setElements([]);
    setBgColor('#ffffff');
    setSelectedId(null);
    setActiveTab('editor');
  };

  const generateImageBase64 = async (type: 'png' | 'jpeg'): Promise<string> => {
    if (!previewRef.current) throw new Error('Preview ref is missing');
    const prevSelected = selectedId;
    setSelectedId(null);
    await new Promise(r => setTimeout(r, 100));
    
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: bgColor,
    });
    
    setSelectedId(prevSelected);
    return canvas.toDataURL(`image/${type}`, 1.0);
  };

  const handleExport = async (type: 'png' | 'jpeg') => {
    setIsExporting(true);
    try {
      const image = await generateImageBase64(type);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${type}`;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const publishToInstagram = async () => {
    setIsPublishing(true);
    try {
      const imageBase64 = await generateImageBase64('jpeg');
      const response = await fetch('/api/admin/social/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, caption }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Publicado no Instagram com sucesso!');
        setIsPublishModalOpen(false);
      } else {
        alert('Erro ao publicar: ' + (data.error || 'Verifique as configurações.'));
      }
    } catch (err) {
      alert('Erro ao se conectar com o servidor.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Element Actions
  const addText = () => {
    setElements([...elements, {
      id: uuidv4(),
      type: 'text',
      x: 100, y: 100, width: 600, height: 100, zIndex: elements.length,
      text: 'Novo Título', color: '#1e293b', fontSize: 60, fontWeight: 'bold', textAlign: 'left', fontFamily: 'Inter'
    }]);
  };

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    setElements([...elements, {
      id: uuidv4(),
      type: 'shape',
      x: 100, y: 100, width: 300, height: 300, zIndex: elements.length,
      shapeType, backgroundColor: '#3b82f6', borderRadius: shapeType === 'circle' ? 9999 : 20, opacity: 1
    }]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > 800) {
          h = (800 / w) * h;
          w = 800;
        }
        setElements([...elements, {
          id: uuidv4(),
          type: 'image',
          x: 100, y: 100, width: w, height: h, zIndex: elements.length,
          src: event.target?.result as string
        }]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const duplicateElement = () => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;
    const newEl = { ...el, id: uuidv4(), x: el.x + 40, y: el.y + 40, zIndex: elements.length };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const deleteElement = () => {
    if (!selectedId) return;
    setElements(elements.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const maxZ = Math.max(...elements.map(e => e.zIndex), 0);
    updateElement(selectedId, { zIndex: maxZ + 1 });
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const minZ = Math.min(...elements.map(e => e.zIndex), 0);
    updateElement(selectedId, { zIndex: minZ - 1 });
  };

  const activeFormatConfig = FORMATS.find(f => f.id === format)!;
  const selectedElement = elements.find(e => e.id === selectedId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        deleteElement();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 -mx-4 lg:-mx-6 -my-4 lg:-my-6">
      
      {/* Header Toolbar */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-800 dark:text-white tracking-tight">Criador PRO</span>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

          <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'templates' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Layout className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Modelos Prontos
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Hexagon className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Estúdio
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <History className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Meus Salvos
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'editor' && (
            <>
              <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="font-bold text-sm bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-1.5 w-40 md:w-64 text-slate-800 dark:text-white"
                placeholder="Nome do Projeto"
              />
              <Button variant="outline" onClick={handleSave} className="hidden md:flex"><Save className="w-4 h-4 mr-2" /> Salvar Projeto</Button>
              <Button onClick={() => handleExport('jpeg')} loading={isExporting} className="hidden md:flex bg-slate-900 text-white hover:bg-slate-800"><Download className="w-4 h-4 mr-2" /> Baixar Imagem</Button>
              <Button onClick={() => setIsPublishModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-none text-white shadow-lg shadow-pink-500/20">
                <Instagram className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Postar</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ─── TAB: TEMPLATES (MODELOS PRONTOS) ────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 text-center">
              <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Comece com um modelo incrível</h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Escolha um design profissional e pronto para usar, ou comece do zero.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Criar do Zero */}
              <div 
                onClick={startNewProject}
                className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-all h-[340px]"
              >
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Design em Branco</h3>
                <p className="text-sm text-slate-500 mt-2">Comece do zero com a sua criatividade livre.</p>
              </div>

              {/* Modelos */}
              {TEMPLATES.map(template => (
                <div 
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col h-[340px] relative"
                >
                  <div className="h-48 w-full relative flex-shrink-0" style={{ backgroundColor: template.bgColor }}>
                    {/* Abstract CSS preview of the template colors */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                        {template.icon}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-auto">
                      <Badge color="info">{template.format}</Badge>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: HISTORY ──────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Meus Projetos Salvos</h1>
                <p className="text-slate-500">Continue de onde parou ou reutilize seus padrões favoritos.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {projects.length === 0 ? (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-400">
                  <History className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-bold">Nenhum projeto salvo ainda.</p>
                  <Button className="mt-6" onClick={() => setActiveTab('templates')}>Ver Modelos Prontos</Button>
                </div>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col">
                    <div 
                      className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer relative"
                      onClick={() => loadProject(project)}
                    >
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="text-slate-400 text-xs">Sem miniatura</div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center backdrop-blur-[0px] group-hover:backdrop-blur-sm">
                        <Button className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                          Abrir no Editor
                        </Button>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate" title={project.name}>{project.name}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">{project.format}</span>
                        <button onClick={() => deleteProject(project.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: EDITOR (ESTÚDIO) ─────────────────────────────────────────────── */}
      {activeTab === 'editor' && (
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar - Tools */}
          <aside className="w-[300px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto hidden md:flex shadow-xl z-10">
            
            <div className="flex border-b border-slate-100 dark:border-slate-800 p-2">
              <button 
                onClick={() => setEditorSidebarTab('add')} 
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${editorSidebarTab === 'add' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Adicionar
              </button>
              <button 
                onClick={() => setEditorSidebarTab('format')} 
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${editorSidebarTab === 'format' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Fundo & Tela
              </button>
            </div>

            <div className="p-6">
              {editorSidebarTab === 'add' ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Elementos Básicos</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={addText} className="h-24 flex-col gap-2 border-2 hover:border-indigo-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800/50">
                        <Type className="w-6 h-6" /> <span className="text-xs">Texto</span>
                      </Button>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-24 flex-col gap-2 border-2 hover:border-indigo-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800/50">
                        <Upload className="w-6 h-6" /> <span className="text-xs">Imagem</span>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Formas Geométricas</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={() => addShape('rectangle')} className="h-16 flex-col border-2 hover:border-indigo-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800/50">
                        <Square className="w-6 h-6" />
                      </Button>
                      <Button variant="outline" onClick={() => addShape('circle')} className="h-16 flex-col border-2 hover:border-indigo-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800/50">
                        <Circle className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Formato da Arte</label>
                    <Select value={format} onChange={(e) => setFormat(e.target.value as PostFormat)} className="w-full h-12">
                      {FORMATS.map(f => <option key={f.id} value={f.id}>{f.name} ({f.width}x{f.height})</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Cor do Fundo</label>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer border-2 border-slate-200 p-1" />
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-12 rounded-xl flex items-center px-4 font-mono text-sm uppercase text-slate-600 dark:text-slate-400">
                        {bgColor}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Canvas Area */}
          <main 
            className="flex-1 bg-slate-200/50 dark:bg-slate-950/50 flex justify-center overflow-auto p-4 md:p-10 relative overflow-x-hidden" 
            onClick={() => setSelectedId(null)}
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}
          >
            <div className="relative m-auto shadow-2xl transition-all ring-1 ring-slate-900/5" style={{
              width: `${activeFormatConfig.width}px`,
              height: `${activeFormatConfig.height}px`,
              transform: `scale(${Math.min(1, (window.innerWidth - 350 - 320) / activeFormatConfig.width, (window.innerHeight - 150) / activeFormatConfig.height)})`,
              transformOrigin: 'center center',
              backgroundColor: bgColor,
            }}>
              
              <div ref={previewRef} className="w-full h-full relative overflow-hidden" style={{ backgroundColor: bgColor }}>
                {elements.map(el => (
                  <motion.div
                    key={el.id}
                    drag
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                      updateElement(el.id, { x: el.x + info.offset.x, y: el.y + info.offset.y });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    initial={{ x: el.x, y: el.y }}
                    animate={{ x: el.x, y: el.y }}
                    transition={{ type: 'tween', duration: 0 }}
                    className={`absolute cursor-move origin-top-left ${selectedId === el.id ? 'ring-2 ring-indigo-500' : ''}`}
                    style={{
                      width: el.width,
                      height: el.height,
                      zIndex: el.zIndex,
                    }}
                  >
                    {el.type === 'text' && (
                      <div style={{
                        color: el.color,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: el.fontWeight,
                        textAlign: el.textAlign,
                        fontFamily: el.fontFamily || 'Inter, sans-serif',
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center',
                        justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        wordBreak: 'break-word', lineHeight: 1.1,
                        opacity: el.opacity ?? 1,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {el.text}
                      </div>
                    )}
                    {el.type === 'image' && (
                      <img src={el.src} alt="" className="w-full h-full object-cover pointer-events-none" style={{ opacity: el.opacity ?? 1, borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0 }} />
                    )}
                    {el.type === 'shape' && (
                      <div style={{
                        width: '100%', height: '100%',
                        backgroundColor: el.backgroundColor,
                        borderRadius: el.borderRadius === 9999 ? '50%' : `${el.borderRadius}px`,
                        borderWidth: el.borderWidth ? `${el.borderWidth}px` : 0,
                        borderColor: el.borderColor,
                        borderStyle: 'solid',
                        opacity: el.opacity ?? 1,
                      }} />
                    )}

                    {selectedId === el.id && (
                      <div 
                        className="absolute -bottom-4 -right-4 w-8 h-8 bg-white rounded-full border-4 border-indigo-500 cursor-se-resize shadow-xl flex items-center justify-center"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startW = el.width;
                          const startH = el.height;
                          
                          const onMove = (moveEvent: PointerEvent) => {
                            const scale = Math.min(1, (window.innerWidth - 350 - 320) / activeFormatConfig.width, (window.innerHeight - 150) / activeFormatConfig.height);
                            const dx = (moveEvent.clientX - startX) / scale;
                            const dy = (moveEvent.clientY - startY) / scale;
                            
                            if (el.type === 'image' || (el.type === 'shape' && el.shapeType === 'circle')) {
                              const maxD = Math.max(dx, dy);
                              updateElement(el.id, { width: Math.max(50, startW + maxD), height: Math.max(50, startH + (maxD * (startH/startW))) });
                            } else {
                              updateElement(el.id, { width: Math.max(50, startW + dx), height: Math.max(50, startH + dy) });
                            }
                          };
                          
                          const onUp = () => {
                            window.removeEventListener('pointermove', onMove);
                            window.removeEventListener('pointerup', onUp);
                          };
                          window.addEventListener('pointermove', onMove);
                          window.addEventListener('pointerup', onUp);
                        }}
                      >
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Sidebar - Properties */}
          <aside className="w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto hidden xl:block shadow-xl z-10">
            {selectedElement ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Opções</h3>
                  <div className="flex gap-1">
                    <button onClick={duplicateElement} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Duplicar">
                      <Copy className="w-5 h-5" />
                    </button>
                    <button onClick={deleteElement} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={bringToFront} className="flex-1 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"><Layers className="w-4 h-4 mr-2"/> P/ Frente</Button>
                  <Button variant="outline" onClick={sendToBack} className="flex-1 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"><Layers className="w-4 h-4 mr-2"/> P/ Trás</Button>
                </div>

                {selectedElement.type === 'text' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Editar Texto</label>
                      <Textarea 
                        value={selectedElement.text} 
                        onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                        rows={4}
                        className="text-base rounded-xl font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Cor</label>
                        <input 
                          type="color" 
                          value={selectedElement.color} 
                          onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                          className="w-full h-12 rounded-xl cursor-pointer p-1 border-2 border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Opacidade</label>
                        <input 
                          type="range" min="0" max="1" step="0.05"
                          value={selectedElement.opacity ?? 1} 
                          onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                          className="w-full h-12 accent-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Tamanho da Fonte: {selectedElement.fontSize}px</label>
                      <input 
                        type="range" min="12" max="300" 
                        value={selectedElement.fontSize} 
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Alinhamento</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                        <button onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })} className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${selectedElement.textAlign === 'left' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><AlignLeft className="w-5 h-5"/></button>
                        <button onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })} className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${selectedElement.textAlign === 'center' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><AlignCenter className="w-5 h-5"/></button>
                        <button onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })} className={`flex-1 py-2 flex justify-center rounded-lg transition-all ${selectedElement.textAlign === 'right' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><AlignRight className="w-5 h-5"/></button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Peso da Fonte</label>
                      <Select value={selectedElement.fontWeight || 'normal'} onChange={e => updateElement(selectedElement.id, { fontWeight: e.target.value })} className="h-12 rounded-xl">
                        <option value="normal">Normal</option>
                        <option value="bold">Negrito (Bold)</option>
                        <option value="900">Pesado (Black)</option>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'shape' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Cor Base</label>
                        <input 
                          type="color" 
                          value={selectedElement.backgroundColor} 
                          onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                          className="w-full h-12 rounded-xl cursor-pointer border-2 border-slate-200 p-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Opacidade</label>
                        <input 
                          type="range" min="0" max="1" step="0.05"
                          value={selectedElement.opacity ?? 1} 
                          onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                          className="w-full h-12 accent-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Cor da Borda</label>
                      <input 
                        type="color" 
                        value={selectedElement.borderColor || '#000000'} 
                        onChange={(e) => updateElement(selectedElement.id, { borderColor: e.target.value })}
                        className="w-full h-12 rounded-xl cursor-pointer border-2 border-slate-200 p-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Espessura da Borda: {selectedElement.borderWidth || 0}px</label>
                      <input 
                        type="range" min="0" max="40" 
                        value={selectedElement.borderWidth || 0} 
                        onChange={(e) => updateElement(selectedElement.id, { borderWidth: Number(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    {selectedElement.shapeType === 'rectangle' && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Arredondamento: {selectedElement.borderRadius}px</label>
                        <input 
                          type="range" min="0" max="200" 
                          value={selectedElement.borderRadius} 
                          onChange={(e) => updateElement(selectedElement.id, { borderRadius: Number(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {selectedElement.type === 'image' && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Opacidade</label>
                      <input 
                        type="range" min="0" max="1" step="0.05"
                        value={selectedElement.opacity ?? 1} 
                        onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                        className="w-full h-12 accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Arredondamento das Bordas</label>
                      <input 
                        type="range" min="0" max="200" 
                        value={selectedElement.borderRadius || 0} 
                        onChange={(e) => updateElement(selectedElement.id, { borderRadius: Number(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <MousePointer2 className="w-8 h-8 opacity-50" />
                </div>
                <h4 className="font-bold text-slate-600 dark:text-slate-300 mb-2">Nenhum elemento selecionado</h4>
                <p className="text-sm">Clique em qualquer texto, forma ou imagem no canvas para editar suas cores, tamanho e posição.</p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Modal de Publicação do Instagram */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-600/10 to-pink-600/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Publicar no Instagram</h3>
                  <p className="text-xs text-slate-500">Envie esta arte diretamente para o feed.</p>
                </div>
              </div>
              <button onClick={() => setIsPublishModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Legenda (Caption)</label>
                <Textarea 
                  rows={6} 
                  placeholder="Escreva a legenda incrível para o seu post..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-2 text-right">{caption.length} / 2200 caracteres</p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-600 font-bold text-xs">!</span>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  Para que a postagem automática funcione, a conta do Instagram precisa ser uma conta <strong>Comercial ou Criador de Conteúdo</strong> e estar vinculada a uma página do Facebook no painel da Meta.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsPublishModalOpen(false)}>Cancelar</Button>
              <Button 
                onClick={publishToInstagram} 
                loading={isPublishing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-lg shadow-pink-500/25"
                iconLeft={<Send className="w-4 h-4" />}
              >
                Publicar Agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
