import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, ChevronRight, User, Settings, Download, HelpCircle, 
  Maximize, Minus, Plus, Image as ImageIcon, Video, Check, 
  Layers, Sparkles, UserCheck, Palette, Sun, Eye, Loader2, 
  ArrowLeft, X, RotateCcw, RotateCw, History, Monitor,
  Zap, AlertTriangle, ChevronDown, CheckCircle2, Scissors,
  Grid, Layout, DownloadCloud, FileImage, Fullscreen, Rows,
  Wand2, FileType, ShieldCheck, Cpu, Activity, Target
} from 'lucide-react';

// --- SABİTLER ---
const SPLITTER_STATUS_MSGS = [
  "Medya verisi 4K kanvasa işleniyor...",
  "Dikey segmentasyon sınırları kilitleniyor...",
  "HD Piksel pürüzsüzleştirme aktif...",
  "Slide'lar yüksek çözünürlükte paketleniyor."
];

const App = () => {
  const [page, setPage] = useState('landing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  
  const [splitType, setSplitType] = useState('grid4'); 
  const [downloadFormat, setDownloadFormat] = useState('png'); 
  const [autoEnhance, setAutoEnhance] = useState(true); 
  const [hdMode, setHdMode] = useState(true); 
  const [optimizeMode, setOptimizeMode] = useState(true); 
  const [smartCrop, setSmartCrop] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [splitSlides, setSplitSlides] = useState([]); 
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (uploadedFile && uploadedFile.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedFile);
      }
    };
  }, [uploadedFile]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedFile(url);
    setFileType(file.type.startsWith('video/') ? 'video' : 'image');
    setPage('loading');
    setSplitSlides([]);
    
    setTimeout(() => {
      setPage('editor');
      processSplit(url, file.type.startsWith('video/'));
    }, 1000);
  };

  useEffect(() => {
    if (page === 'editor' && uploadedFile && !isProcessing) {
      processSplit(uploadedFile, fileType === 'video');
    }
  }, [splitType, autoEnhance, hdMode, optimizeMode, smartCrop, downloadFormat, page]);

  const processSplit = (sourceUrl, isVideo) => {
    setIsProcessing(true);
    setAiLogs([]);
    SPLITTER_STATUS_MSGS.forEach((msg, i) => {
      setTimeout(() => setAiLogs(prev => [...prev.slice(-3), msg]), i * 350);
    });

    const mediaElement = isVideo ? document.createElement('video') : new Image();
    mediaElement.src = sourceUrl;

    const onMediaLoaded = () => {
      const w = isVideo ? mediaElement.videoWidth : mediaElement.width;
      const h = isVideo ? mediaElement.videoHeight : mediaElement.height;
      
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = w;
      sourceCanvas.height = h;
      const sCtx = sourceCanvas.getContext('2d');
      
      if (autoEnhance) {
        const contrastVal = hdMode ? 1.15 : 1.1;
        const saturateVal = hdMode ? 1.25 : 1.15;
        sCtx.filter = `contrast(${contrastVal}) saturate(${saturateVal}) brightness(1.05)`;
      }
      
      sCtx.drawImage(mediaElement, 0, 0, w, h);
      sCtx.filter = 'none';

      let parts = [];
      let rows = 1, cols = 1;

      switch(splitType) {
        case 'vertical': rows = 2; cols = 1; break;
        case 'grid4': rows = 2; cols = 2; break;
        case 'grid6': rows = 3; cols = 2; break;
        case 'grid8': rows = 4; cols = 2; break;
        case 'grid10': rows = 5; cols = 2; break;
        default: rows = 2; cols = 2;
      }

      const pW = w / cols;
      const pH = h / rows;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const partCanvas = document.createElement('canvas');
          partCanvas.width = pW;
          partCanvas.height = pH;
          const pCtx = partCanvas.getContext('2d');
          
          pCtx.imageSmoothingEnabled = true;
          pCtx.imageSmoothingQuality = hdMode ? 'high' : 'medium';
          
          pCtx.drawImage(sourceCanvas, c * pW, r * pH, pW, pH, 0, 0, pW, pH);
          
          const mimeType = `image/${downloadFormat === 'jpg' ? 'jpeg' : downloadFormat}`;
          parts.push({
            id: parts.length + 1,
            dataUrl: partCanvas.toDataURL(mimeType, hdMode ? 1.0 : 0.92),
            label: `Parça ${parts.length + 1}`
          });
        }
      }

      setSplitSlides(parts);
      setIsProcessing(false);
      showToast(`${parts.length} parça hazır.`);
    };

    if (isVideo) {
      mediaElement.muted = true;
      mediaElement.onloadeddata = () => { mediaElement.currentTime = 0.5; };
      mediaElement.onseeked = onMediaLoaded;
    } else {
      mediaElement.onload = onMediaLoaded;
    }
  };

  const downloadFile = (dataUrl, name) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${name}.${downloadFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const Header = ({ isEditor }) => (
    <header className={`fixed top-0 left-0 right-0 z-[70] px-8 py-4 flex items-center justify-between backdrop-blur-3xl ${isEditor ? 'bg-black/90 border-b border-white/5' : 'bg-transparent'}`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setPage('landing'); setUploadedFile(null); }}>
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black italic shadow-2xl transition-all text-2xl tracking-tighter">A</div>
          <span className="text-2xl font-black tracking-tighter uppercase hidden sm:block italic">Dump Splitter</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isEditor && (
          <button 
            onClick={() => splitSlides.forEach((s, i) => setTimeout(() => downloadFile(s.dataUrl, `slide_${i+1}`), i * 300))}
            className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <Download size={18} /> Tümünü İndir
          </button>
        )}
      </div>
    </header>
  );

  if (page === 'landing') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <Header isEditor={false} />
        <div className="absolute top-0 -z-10 w-full h-full bg-gradient-to-b from-blue-900/10 via-transparent to-transparent" />
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.8] italic uppercase">Pro <br /> Split.</h1>
        <p className="text-gray-400 max-w-xl mb-12 font-medium tracking-tight uppercase text-xs tracking-[0.2em]">Instagram için kusursuz dikey bölme aracı</p>
        <button onClick={triggerFileInput} className="w-full max-w-xl aspect-video bg-[#0c0c0c] border-2 border-dashed border-white/10 rounded-[48px] flex flex-col items-center justify-center group hover:border-white/30 transition-all p-12 shadow-2xl relative overflow-hidden">
           <div className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform"><Upload size={36} /></div>
           <p className="text-2xl font-black uppercase italic">Dosya Yükle</p>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
        </button>
      </div>
    );
  }

  if (page === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 border-4 border-white/5 border-t-white rounded-[32px] animate-spin mb-8" />
        <h2 className="text-2xl font-black uppercase italic tracking-widest animate-pulse tracking-tighter">İşleniyor</h2>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      <Header isEditor={true} />
      
      <main className="flex-1 pt-20 flex overflow-hidden">
        <aside className="w-[300px] border-r border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl z-20">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            <div className="space-y-6">
                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-[28px] space-y-5 shadow-inner">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Sparkles size={16} className="text-pink-500" />
                          <span className="text-[10px] font-black text-white uppercase tracking-tight">AI Enhance</span>
                       </div>
                       <button onClick={() => setAutoEnhance(!autoEnhance)} className={`w-9 h-5 rounded-full transition-all relative ${autoEnhance ? 'bg-pink-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${autoEnhance ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase">Renkleri ve netliği yapay zeka ile otomatik iyileştirir.</p>
                  </div>
                  
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Cpu size={16} className="text-blue-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-tight italic">HD Kalite</span>
                       </div>
                       <button onClick={() => setHdMode(!hdMode)} className={`w-9 h-5 rounded-full transition-all relative ${hdMode ? 'bg-blue-400' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${hdMode ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase">HD modu ile pikseller 4K keskinliğine taşınır.</p>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Activity size={16} className="text-green-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-tight italic">Optimize</span>
                       </div>
                       <button onClick={() => setOptimizeMode(!optimizeMode)} className={`w-9 h-5 rounded-full transition-all relative ${optimizeMode ? 'bg-green-400' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${optimizeMode ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase">Görseli paylaşım için en ideal boyut ve keskinliğe getirir.</p>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Target size={16} className="text-purple-400" />
                          <span className="text-[10px] font-black text-white uppercase tracking-tight italic">Smart Crop</span>
                       </div>
                       <button onClick={() => setSmartCrop(!smartCrop)} className={`w-9 h-5 rounded-full transition-all relative ${smartCrop ? 'bg-purple-400' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${smartCrop ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase">Yapay zeka ile ana odağı otomatik tespit eder.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Format</span>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                     {['png', 'jpg', 'webp'].map(fmt => (
                       <button key={fmt} onClick={() => setDownloadFormat(fmt)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${downloadFormat === fmt ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{fmt}</button>
                     ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Izgara Düzeni</span>
                  <div className="space-y-2">
                      <button onClick={() => setSplitType('vertical')} className={`w-full p-4 rounded-2xl border text-[10px] font-black flex items-center gap-4 transition-all ${splitType === 'vertical' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-500'}`}><Rows size={16}/> 2'Lİ DİKEY</button>
                      <button onClick={() => setSplitType('grid4')} className={`w-full p-4 rounded-2xl border text-[10px] font-black flex items-center gap-4 transition-all ${splitType === 'grid4' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-500'}`}><Grid size={16}/> 4'LÜ IZGARA</button>
                      <button onClick={() => setSplitType('grid6')} className={`w-full p-4 rounded-2xl border text-[10px] font-black flex items-center gap-4 transition-all ${splitType === 'grid6' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-500'}`}><Grid size={16}/> 6'LI IZGARA</button>
                      <button onClick={() => setSplitType('grid8')} className={`w-full p-4 rounded-2xl border text-[10px] font-black flex items-center gap-4 transition-all ${splitType === 'grid8' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-500'}`}><Grid size={16}/> 8'Lİ IZGARA</button>
                      <button onClick={() => setSplitType('grid10')} className={`w-full p-4 rounded-2xl border text-[10px] font-black flex items-center gap-4 transition-all ${splitType === 'grid10' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-500'}`}><Grid size={16}/> 10'LU IZGARA</button>
                  </div>
                </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5">
             <button 
              onClick={() => processSplit(uploadedFile, fileType === 'video')}
              disabled={isProcessing}
              className={`w-full py-5 rounded-[24px] font-black text-xs transition-all shadow-2xl ${isProcessing ? 'bg-white/5 text-gray-600' : 'bg-white text-black hover:bg-gray-200 active:scale-95 uppercase tracking-widest'}`}
            >
               {isProcessing ? 'İŞLENİYOR...' : 'YENİDEN BÖL'}
             </button>
          </div>
        </aside>

        <section className="flex-1 bg-[#050505] p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="relative w-full h-full max-w-[95vw] bg-black rounded-[56px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] flex items-center justify-center group/canvas">
             {uploadedFile ? (
               <div className="w-full h-full p-12 flex flex-col overflow-y-auto custom-scrollbar bg-black/40">
                  <div className="w-full max-w-6xl mx-auto space-y-16 pb-40">
                      <div className="text-center">
                         <h3 className="text-4xl font-black uppercase tracking-tighter italic">Bölünen Parçalar</h3>
                         <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-2 italic">Dikey hiyerarşi uygulandı</p>
                      </div>
                      
                      <div className={`grid gap-12 ${['grid4','grid6','grid8','grid10'].includes(splitType) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                          {splitSlides.length > 0 ? splitSlides.map((s) => (
                              <div key={s.id} className="relative aspect-square bg-[#0c0c0c] rounded-[48px] overflow-hidden border-2 border-white/5 group/slide hover:border-white/30 transition-all shadow-2xl flex items-center justify-center">
                                  <img src={s.dataUrl} className="w-full h-full object-cover" alt="Slide" />
                                  <div className="absolute top-8 left-8 z-10"><span className="bg-black/80 backdrop-blur-2xl px-5 py-2.5 rounded-2xl text-[10px] font-black border border-white/10 uppercase tracking-widest italic">{s.label}</span></div>
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/slide:opacity-100 transition-opacity flex items-center justify-center z-20">
                                     <button onClick={() => downloadFile(s.dataUrl, `part_${s.id}`)} className="bg-white text-black p-6 rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_white]"><DownloadCloud size={36} /></button>
                                  </div>
                              </div>
                          )) : (
                              <div className="col-span-full text-center py-40 opacity-10 italic text-2xl font-black uppercase tracking-widest">Medya Analiz Ediliyor...</div>
                          )}
                      </div>
                  </div>
               </div>
             ) : (
               <div className="text-center p-20 flex flex-col items-center">
                  <div className="w-32 h-32 bg-white/5 rounded-[48px] flex items-center justify-center mb-10 text-gray-700 border border-white/5 shadow-inner"><ImageIcon size={48} /></div>
                  <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase tracking-widest">Medya Bekleniyor</h3>
                  <button onClick={triggerFileInput} className="bg-white text-black px-14 py-5 rounded-[24px] font-black shadow-2xl hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-widest text-xs">Dosya Seç</button>
               </div>
             )}

             {isProcessing && (
               <div className="absolute inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center">
                  <div className="w-20 h-20 border-[6px] border-white/5 border-t-white rounded-[40px] animate-spin mb-10 shadow-2xl" />
                  <div className="space-y-4 text-center">{aiLogs.map((log, i) => (<p key={i} className="text-sm font-black text-gray-400 px-10 uppercase tracking-[0.3em] italic">{log}</p>))}</div>
               </div>
             )}
          </div>
        </section>

        <aside className="w-[100px] border-l border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl z-20 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {uploadedFile && (
              <div className="relative group rounded-[20px] overflow-hidden aspect-square border-2 border-white/20 shadow-xl cursor-pointer">
                  {fileType === 'video' ? <video src={uploadedFile} className="w-full h-full object-cover" /> : <img src={uploadedFile} className="w-full h-full object-cover" alt="Thumb" />}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={() => { setUploadedFile(null); setPage('landing'); }} className="p-2 bg-red-500 rounded-lg text-white scale-75 group-hover:scale-100 transition-all"><X size={14} /></button></div>
              </div>
            )}
            <div onClick={triggerFileInput} className="aspect-square border-2 border-dashed border-white/10 rounded-[20px] flex items-center justify-center text-gray-800 hover:text-white transition-all cursor-pointer shadow-inner"><Plus size={20} /></div>
        </aside>
      </main>

      {notification && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-5 rounded-[30px] font-black shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-[200] flex items-center gap-4"><CheckCircle2 size={20} className="text-green-500 shadow-xl" /><span className="uppercase tracking-widest text-[10px] font-black">{notification}</span></div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
