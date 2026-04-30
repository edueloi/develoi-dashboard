import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { 
  Download, Layout, Type, Palette, Image as ImageIcon, 
  Trash2, History, Plus, Circle, Square, Save, 
  Upload, MousePointer2, AlignLeft, AlignCenter, AlignRight,
  Copy, Layers
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
  // Image
  src?: string;
  // Shape
  shapeType?: 'rectangle' | 'circle';
  backgroundColor?: string;
  borderRadius?: number;
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

export function PostCreatorTab() {
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [projects, setProjects] = useState<ProjectState[]>([]);
  
  // Current Project State
  const [currentId, setCurrentId] = useState<string>(uuidv4());
  const [projectName, setProjectName] = useState('Novo Design');
  const [format, setFormat] = useState<PostFormat>('instagram');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('develoi_designs_v2');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load projects');
      }
    }
  }, []);

  const saveProjects = (newProjects: ProjectState[]) => {
    setProjects(newProjects);
    localStorage.setItem('develoi_designs_v2', JSON.stringify(newProjects));
  };

  const handleSave = async () => {
    let thumbnail = '';
    if (previewRef.current) {
      // Temporarily deselect to hide borders in thumbnail
      const prevSelected = selectedId;
      setSelectedId(null);
      await new Promise(r => setTimeout(r, 50)); // wait for re-render
      
      try {
        const canvas = await html2canvas(previewRef.current, { scale: 0.5, useCORS: true });
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

  const deleteProject = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este design?')) {
      saveProjects(projects.filter(p => p.id !== id));
      if (currentId === id) startNewProject();
    }
  };

  const startNewProject = () => {
    setCurrentId(uuidv4());
    setProjectName('Novo Design');
    setElements([]);
    setBgColor('#ffffff');
    setSelectedId(null);
    setActiveTab('editor');
  };

  const handleExport = async (type: 'png' | 'jpeg') => {
    if (!previewRef.current) return;
    setIsExporting(true);
    const prevSelected = selectedId;
    setSelectedId(null); // Hide selection borders
    
    // Slight delay to allow React to remove borders
    await new Promise(r => setTimeout(r, 100));

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: bgColor,
      });
      
      const image = canvas.toDataURL(`image/${type}`, 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${type}`;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
    } finally {
      setSelectedId(prevSelected);
      setIsExporting(false);
    }
  };

  // Element Actions
  const addText = () => {
    setElements([...elements, {
      id: uuidv4(),
      type: 'text',
      x: 100, y: 100, width: 400, height: 100, zIndex: elements.length,
      text: 'Novo Texto', color: '#000000', fontSize: 48, fontWeight: 'bold', textAlign: 'left'
    }]);
  };

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    setElements([...elements, {
      id: uuidv4(),
      type: 'shape',
      x: 100, y: 100, width: 200, height: 200, zIndex: elements.length,
      shapeType, backgroundColor: '#4f46e5', borderRadius: shapeType === 'circle' ? 9999 : 0
    }]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate initial size to fit somewhat nicely
        let w = img.width;
        let h = img.height;
        if (w > 500) {
          h = (500 / w) * h;
          w = 500;
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
    e.target.value = ''; // reset
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const duplicateElement = () => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;
    const newEl = { ...el, id: uuidv4(), x: el.x + 20, y: el.y + 20, zIndex: elements.length };
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if editing an input
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
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <div>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0 text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mr-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Meus Designs
            </button>
          </div>

          {activeTab === 'editor' && (
            <>
              <Button variant="outline" onClick={handleSave} iconLeft={<Save className="w-4 h-4" />}>
                Salvar
              </Button>
              <Button onClick={() => handleExport('png')} loading={isExporting} iconLeft={<Download className="w-4 h-4" />}>
                Exportar
              </Button>
            </>
          )}
        </div>
      </header>

      {activeTab === 'editor' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools */}
          <aside className="w-20 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center md:items-stretch py-4 overflow-y-auto">
            <div className="px-4 mb-6 hidden md:block">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Adicionar</h3>
              <div className="space-y-2">
                <Button variant="outline" fullWidth onClick={addText} className="justify-start">
                  <Type className="w-4 h-4 mr-3" /> Texto
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <Button variant="outline" fullWidth onClick={() => fileInputRef.current?.click()} className="justify-start">
                  <Upload className="w-4 h-4 mr-3" /> Imagem
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => addShape('rectangle')} className="justify-center">
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => addShape('circle')} className="justify-center">
                    <Circle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile/Compact icons */}
            <div className="flex flex-col gap-4 items-center md:hidden w-full">
               <button onClick={addText} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600"><Type className="w-5 h-5" /></button>
               <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600"><Upload className="w-5 h-5" /></button>
               <button onClick={() => addShape('rectangle')} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600"><Square className="w-5 h-5" /></button>
            </div>

            <div className="px-4 mb-6 hidden md:block mt-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Formato do Canvas</h3>
              <Select value={format} onChange={(e) => setFormat(e.target.value as PostFormat)}>
                {FORMATS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Cor de Fundo</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
              </div>
            </div>
          </aside>

          {/* Canvas Area */}
          <main className="flex-1 bg-slate-100 dark:bg-slate-950 flex justify-center overflow-auto p-4 md:p-8 relative" onClick={() => setSelectedId(null)}>
            
            {/* The scaled canvas wrapper */}
            <div className="relative m-auto shadow-2xl transition-all" style={{
              width: `${activeFormatConfig.width}px`,
              height: `${activeFormatConfig.height}px`,
              transform: `scale(${Math.min(1, (window.innerWidth - 350) / activeFormatConfig.width, (window.innerHeight - 150) / activeFormatConfig.height)})`,
              transformOrigin: 'top center',
              backgroundColor: bgColor,
            }}>
              
              <div 
                ref={previewRef}
                className="w-full h-full relative overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
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
                    className={`absolute cursor-move origin-top-left ${selectedId === el.id ? 'ring-4 ring-indigo-500 ring-offset-2' : ''}`}
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
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        wordBreak: 'break-word',
                        lineHeight: 1.2
                      }}>
                        {el.text}
                      </div>
                    )}
                    {el.type === 'image' && (
                      <img src={el.src} alt="" className="w-full h-full object-cover pointer-events-none" />
                    )}
                    {el.type === 'shape' && (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: el.backgroundColor,
                        borderRadius: el.borderRadius === 9999 ? '50%' : `${el.borderRadius}px`,
                      }} />
                    )}

                    {/* Resize Handle - Simple bottom right corner for now */}
                    {selectedId === el.id && (
                      <div 
                        className="absolute -bottom-3 -right-3 w-6 h-6 bg-indigo-600 rounded-full border-4 border-white cursor-se-resize shadow-md"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startW = el.width;
                          const startH = el.height;
                          
                          const onMove = (moveEvent: PointerEvent) => {
                            // Account for scale!
                            const scale = Math.min(1, (window.innerWidth - 350) / activeFormatConfig.width, (window.innerHeight - 150) / activeFormatConfig.height);
                            const dx = (moveEvent.clientX - startX) / scale;
                            const dy = (moveEvent.clientY - startY) / scale;
                            
                            // Maintain aspect ratio for images and circles
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
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Sidebar - Properties */}
          <aside className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto hidden md:block">
            {selectedElement ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">Propriedades</h3>
                  <div className="flex gap-1">
                    <button onClick={duplicateElement} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Duplicar">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={deleteElement} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={bringToFront} className="flex-1 text-[10px]"><Layers className="w-3 h-3 mr-1"/> P/ Frente</Button>
                  <Button variant="outline" size="sm" onClick={sendToBack} className="flex-1 text-[10px]"><Layers className="w-3 h-3 mr-1"/> P/ Trás</Button>
                </div>

                {selectedElement.type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Texto</label>
                      <Textarea 
                        value={selectedElement.text} 
                        onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Cor</label>
                      <input 
                        type="color" 
                        value={selectedElement.color} 
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Tamanho (px)</label>
                      <input 
                        type="range" min="12" max="200" 
                        value={selectedElement.fontSize} 
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-right text-xs text-slate-400">{selectedElement.fontSize}px</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Alinhamento</label>
                      <div className="flex bg-slate-100 rounded-lg p-1">
                        <button onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })} className={`flex-1 p-2 flex justify-center rounded ${selectedElement.textAlign === 'left' ? 'bg-white shadow' : ''}`}><AlignLeft className="w-4 h-4"/></button>
                        <button onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })} className={`flex-1 p-2 flex justify-center rounded ${selectedElement.textAlign === 'center' ? 'bg-white shadow' : ''}`}><AlignCenter className="w-4 h-4"/></button>
                        <button onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })} className={`flex-1 p-2 flex justify-center rounded ${selectedElement.textAlign === 'right' ? 'bg-white shadow' : ''}`}><AlignRight className="w-4 h-4"/></button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'shape' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Cor da Forma</label>
                      <input 
                        type="color" 
                        value={selectedElement.backgroundColor} 
                        onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                    {selectedElement.shapeType === 'rectangle' && (
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Arredondamento das Bordas</label>
                        <input 
                          type="range" min="0" max="100" 
                          value={selectedElement.borderRadius} 
                          onChange={(e) => updateElement(selectedElement.id, { borderRadius: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {selectedElement.type === 'image' && (
                  <div className="text-xs text-slate-500 italic">
                    Arraste pela borda inferior direita para redimensionar a imagem mantendo a proporção.
                  </div>
                )}
                
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-4">
                <MousePointer2 className="w-8 h-8 opacity-50" />
                <p className="text-sm">Selecione um elemento para editar suas propriedades.</p>
              </div>
            )}
          </aside>
        </div>
      ) : (
        /* History / Projects Tab */
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Seus Designs</h2>
            <Button onClick={startNewProject}><Plus className="w-4 h-4 mr-2" /> Novo Design</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                <Layout className="w-16 h-16 mb-4 opacity-50" />
                <p>Nenhum design salvo ainda.</p>
              </div>
            ) : (
              projects.map(project => (
                <div key={project.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-lg transition-all flex flex-col">
                  <div 
                    className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer relative"
                    onClick={() => loadProject(project)}
                  >
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 text-xs">Sem miniatura</div>
                    )}
                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors flex items-center justify-center">
                      <Button variant="outline" className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all bg-white border-none shadow-xl">
                        Editar
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{project.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{project.format}</span>
                      <button onClick={() => deleteProject(project.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
