import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Layout, Type, Palette, Image as ImageIcon, CheckCircle2, Bookmark, Trash2, History } from 'lucide-react';
import html2canvas from 'html2canvas';
import { PanelCard, Button, Input, Textarea, Select, Badge } from '../ui';

type PostFormat = 'instagram' | 'facebook' | 'whatsapp' | 'stories';

interface FormatConfig {
  id: PostFormat;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

const FORMATS: FormatConfig[] = [
  { id: 'instagram', name: 'Instagram Feed', width: 1080, height: 1080, aspectRatio: '1/1' },
  { id: 'facebook', name: 'Facebook Post', width: 1200, height: 630, aspectRatio: '1200/630' },
  { id: 'stories', name: 'Instagram/WhatsApp Stories', width: 1080, height: 1920, aspectRatio: '9/16' },
  { id: 'whatsapp', name: 'WhatsApp (Square)', width: 800, height: 800, aspectRatio: '1/1' },
];

type TemplateId = 'modern' | 'minimal' | 'gradient' | 'quote';

interface PostState {
  id: string;
  title: string;
  content: string;
  footer: string;
  format: PostFormat;
  template: TemplateId;
  bgColor: string;
  textColor: string;
  accentColor: string;
  createdAt: number;
  used: boolean;
}

export function PostCreatorTab() {
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [history, setHistory] = useState<PostState[]>([]);
  
  // Editor State
  const [title, setTitle] = useState('Título da sua Postagem');
  const [content, setContent] = useState('Escreva aqui o conteúdo principal que chamará a atenção do seu público.');
  const [footer, setFooter] = useState('@develoi');
  const [format, setFormat] = useState<PostFormat>('instagram');
  const [template, setTemplate] = useState<TemplateId>('modern');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#1e293b');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('develoi_posts_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load posts history');
      }
    }
  }, []);

  const saveToHistory = (post: PostState) => {
    const newHistory = [post, ...history];
    setHistory(newHistory);
    localStorage.setItem('develoi_posts_history', JSON.stringify(newHistory));
  };

  const markAsUsed = (id: string) => {
    const newHistory = history.map(p => p.id === id ? { ...p, used: true } : p);
    setHistory(newHistory);
    localStorage.setItem('develoi_posts_history', JSON.stringify(newHistory));
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(p => p.id !== id);
    setHistory(newHistory);
    localStorage.setItem('develoi_posts_history', JSON.stringify(newHistory));
  };

  const handleExport = async (type: 'png' | 'jpeg') => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: null,
      });
      
      const image = canvas.toDataURL(`image/${type}`, 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `develoi-post-${Date.now()}.${type}`;
      link.click();

      // Save to history automatically
      const newPost: PostState = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        content,
        footer,
        format,
        template,
        bgColor,
        textColor,
        accentColor,
        createdAt: Date.now(),
        used: false,
      };
      saveToHistory(newPost);
    } catch (err) {
      console.error('Error exporting image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const activeFormat = FORMATS.find(f => f.id === format)!;

  // Render Template Component
  const renderTemplate = () => {
    const baseStyle = {
      backgroundColor: bgColor,
      color: textColor,
    };

    if (template === 'modern') {
      return (
        <div className="w-full h-full p-12 flex flex-col justify-between relative overflow-hidden" style={baseStyle}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -mr-16 -mt-16" style={{ backgroundColor: accentColor }} />
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="w-16 h-2 mb-6" style={{ backgroundColor: accentColor }} />
            <h1 className="text-5xl font-black mb-6 leading-tight whitespace-pre-wrap">{title}</h1>
            <p className="text-2xl opacity-90 leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          <div className="relative z-10 flex items-center justify-between pt-8 border-t border-black/10 dark:border-white/10 mt-auto">
            <span className="text-xl font-bold">{footer}</span>
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: accentColor }} />
          </div>
        </div>
      );
    }

    if (template === 'minimal') {
      return (
        <div className="w-full h-full p-16 flex flex-col items-center justify-center text-center border-8" style={{ ...baseStyle, borderColor: accentColor }}>
          <h1 className="text-6xl font-black mb-8 tracking-tight whitespace-pre-wrap">{title}</h1>
          <p className="text-2xl opacity-80 max-w-2xl leading-relaxed whitespace-pre-wrap">{content}</p>
          <div className="mt-16 text-lg font-bold tracking-widest uppercase opacity-50">{footer}</div>
        </div>
      );
    }

    if (template === 'gradient') {
      return (
        <div className="w-full h-full p-12 flex flex-col justify-center" style={{
          background: `linear-gradient(135deg, ${bgColor} 0%, ${accentColor} 100%)`,
          color: textColor
        }}>
          <div className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/20 h-full flex flex-col">
            <h1 className="text-5xl font-black mb-8 leading-tight whitespace-pre-wrap">{title}</h1>
            <p className="text-2xl opacity-90 leading-relaxed whitespace-pre-wrap flex-1">{content}</p>
            <div className="text-xl font-bold self-end mt-auto">{footer}</div>
          </div>
        </div>
      );
    }

    if (template === 'quote') {
      return (
        <div className="w-full h-full p-16 flex flex-col relative" style={baseStyle}>
          <div className="text-9xl absolute top-8 left-8 opacity-10" style={{ color: accentColor }}>"</div>
          <div className="flex-1 flex flex-col justify-center relative z-10">
            <p className="text-4xl font-black italic leading-relaxed mb-8 whitespace-pre-wrap">{content}</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-1 mb-1" style={{ backgroundColor: accentColor }} />
              <h2 className="text-2xl font-bold uppercase tracking-widest">{title}</h2>
            </div>
          </div>
          <div className="text-lg font-medium opacity-60 text-right">{footer}</div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dash-text">Criador de Postagens</h1>
          <p className="text-sm dash-text-muted mt-1">Crie posts incríveis para suas redes sociais.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow-sm dash-text' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            <Layout className="w-4 h-4 inline-block mr-2" />
            Editor
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm dash-text' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            <History className="w-4 h-4 inline-block mr-2" />
            Salvos ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[800px]">
          {/* Controls Panel */}
          <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            
            <PanelCard title="Formato" icon={Layout}>
              <div className="grid grid-cols-2 gap-3">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      format === f.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <p className={`text-xs font-bold ${format === f.id ? 'text-indigo-700 dark:text-indigo-400' : 'dash-text'}`}>{f.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{f.width}x{f.height}</p>
                  </button>
                ))}
              </div>
            </PanelCard>

            <PanelCard title="Design & Template" icon={Palette}>
              <div className="space-y-4">
                <Select label="Template" value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)}>
                  <option value="modern">Moderno (Corporativo)</option>
                  <option value="minimal">Minimalista (Limpo)</option>
                  <option value="gradient">Gradiente (Impacto)</option>
                  <option value="quote">Citação (Aspas)</option>
                </Select>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold dash-text mb-1 block">Fundo</label>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs font-bold dash-text mb-1 block">Texto</label>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs font-bold dash-text mb-1 block">Destaque</label>
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
                  </div>
                </div>
              </div>
            </PanelCard>

            <PanelCard title="Conteúdo" icon={Type}>
              <div className="space-y-4">
                <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea label="Texto Principal" rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
                <Input label="Rodapé / Username" value={footer} onChange={(e) => setFooter(e.target.value)} />
              </div>
            </PanelCard>

            <div className="flex gap-3">
              <Button onClick={() => handleExport('png')} loading={isExporting} className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Baixar PNG
              </Button>
              <Button onClick={() => handleExport('jpeg')} variant="outline" loading={isExporting} className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Baixar JPEG
              </Button>
            </div>

          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-8 bg-slate-100 dark:bg-slate-900 rounded-[2rem] border dash-border flex items-center justify-center p-8 overflow-hidden relative">
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold dash-text">Preview em Tempo Real</span>
            </div>
            
            {/* Aspect Ratio Container for Preview */}
            <div className="relative shadow-2xl rounded-sm overflow-hidden transform transition-all duration-300" style={{
              width: '100%',
              maxWidth: '500px',
              aspectRatio: activeFormat.aspectRatio
            }}>
              {/* Actual render area that gets exported. We render it at a larger fixed size and scale it down with CSS to look crisp in the preview, but export at full resolution. */}
              <div
                ref={previewRef}
                style={{
                  width: `${activeFormat.width}px`,
                  height: `${activeFormat.height}px`,
                  transform: `scale(${500 / activeFormat.width})`, // scale based on container maxWidth
                  transformOrigin: 'top left'
                }}
              >
                {renderTemplate()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {history.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                  <Bookmark className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold dash-text mb-2">Nenhum post salvo</h3>
                <p className="text-sm dash-text-muted">As postagens que você exportar aparecerão aqui automaticamente.</p>
                <Button className="mt-6" onClick={() => setActiveTab('editor')}>Criar meu primeiro post</Button>
              </motion.div>
            ) : (
              history.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="dash-surface border dash-border rounded-[2rem] p-4 flex flex-col group relative"
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4 overflow-hidden relative" style={{ backgroundColor: post.bgColor }}>
                    <div className="absolute inset-0 p-4 flex flex-col" style={{ color: post.textColor }}>
                      <p className="text-lg font-black truncate">{post.title}</p>
                      <p className="text-xs opacity-70 line-clamp-3 mt-2">{post.content}</p>
                    </div>
                    {post.used && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color="info">{post.format}</Badge>
                      <span className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-bold dash-text truncate" title={post.title}>{post.title}</p>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t dash-border opacity-0 group-hover:opacity-100 transition-opacity">
                    {!post.used && (
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => markAsUsed(post.id)}>
                        Marcar Uso
                      </Button>
                    )}
                    <button
                      onClick={() => deleteFromHistory(post.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
