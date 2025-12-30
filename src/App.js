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

// --- CONSTANTS ---
const SPLITTER_STATUS_MSGS = [
  "Processing media to 4K canvas...",
  "Locking vertical segmentation boundaries...",
  "HD Pixel smoothing active...",
  "Packaging slides in high resolution."
];

const App = () => {
  const [page, setPage] = useState('landing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  
  // Varsayılanı 4 yaptık. Otomatik değişmeyecek.
  const [splitCount, setSplitCount] = useState(4); 
  const [downloadFormat, setDownloadFormat] = useState('png'); 
  const [autoEnhance, setAutoEnhance] = useState(false); 
  const [hdMode, setHdMode] = useState(false); 
  const [optimizeMode, setOptimizeMode] = useState(false); 
  const [smartCrop, setSmartCrop] = useState(false);
  
  // Yeni Ultra HD Modu (Upscale)
  const [ultraHdMode, setUltraHdMode] = useState(false);
  
  // Multiple file management states
  const [fileList, setFileList] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  
  const [splitSlides, setSplitSlides] = useState([]); 
  const [slideAspectRatio, setSlideAspectRatio] = useState(1);

  const fileInputRef = useRef(null);
  const activeUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      activeUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (fileList.length >= 10) {
      showToast("Maksimum 10 dosya ekleyebilirsiniz.");
      return;
    }

    const url = URL.createObjectURL(file);
    activeUrlsRef.current.push(url);

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const newFileObj = { url, type, id: Date.now() };
    
    // Listeye ekle
    setFileList(prev => [...prev, newFileObj]);
    
    // Yeni dosyaya odaklan
    setUploadedFile(url);
    setFileType(type);
    setSplitSlides([]);
    setIsProcessing(false); 
    
    // Varsayılanı her yeni dosyada 4'e zorluyoruz
    setSplitCount(4);
    
    setPage('loading');
    
    setTimeout(() => {
      setPage('editor');
    }, 800);
    
    event.target.value = null;
  };

  useEffect(() => {
    if (page === 'editor' && uploadedFile) {
      processSplit(uploadedFile, fileType === 'video');
    }
  }, [splitCount, autoEnhance, hdMode, optimizeMode, smartCrop, downloadFormat, page, uploadedFile, ultraHdMode]);

  const processSplit = (sourceUrl, isVideo) => {
    if (!sourceUrl) return;

    setIsProcessing(true);
    setAiLogs([]);
    setSplitSlides([]);

    SPLITTER_STATUS_MSGS.forEach((msg, i) => {
      setTimeout(() => setAiLogs(prev => [...prev.slice(-3), msg]), i * 350);
    });

    const mediaElement = isVideo ? document.createElement('video') : new Image();
    mediaElement.crossOrigin = "anonymous";
    mediaElement.src = sourceUrl;

    const onMediaLoaded = () => {
      const w = isVideo ? mediaElement.videoWidth : mediaElement.width;
      const h = isVideo ? mediaElement.videoHeight : mediaElement.height;
      
      // ULTRA HD MANTIĞI
      const scaleFactor = ultraHdMode ? 2 : 1;
      const sW = w * scaleFactor;
      const sH = h * scaleFactor;

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = sW;
      sourceCanvas.height = sH;
      const sCtx = sourceCanvas.getContext('2d');
      
      if (autoEnhance) {
        const contrastVal = hdMode ? 1.15 : 1.1;
        const saturateVal = hdMode ? 1.25 : 1.15;
        sCtx.filter = `contrast(${contrastVal}) saturate(${saturateVal}) brightness(1.05)`;
      }
      
      if (smartCrop) {
        const cropMargin = 0.05; 
        const srcX = w * cropMargin;
        const srcY = h * cropMargin;
        const srcW = w * (1 - 2 * cropMargin);
        const srcH = h * (1 - 2 * cropMargin);
        sCtx.drawImage(mediaElement, srcX, srcY, srcW, srcH, 0, 0, sW, sH);

      } else {
        sCtx.drawImage(mediaElement, 0, 0, sW, sH);
      }
      
      sCtx.filter = 'none';

      let parts = [];
      let rows = 1, cols = 1;

      if (splitCount === 1) {
        rows = 1; cols = 1;
      } else if (splitCount === 2) {
        rows = 2; cols = 1;
      } else if (splitCount % 2 !== 0) {
        rows = splitCount; cols = 1;
      } else {
        cols = 2;
        rows = splitCount / 2;
      }

      const pW = sW / cols;
      const pH = sH / rows;
      
      setSlideAspectRatio(pW / pH);
      
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
          
          let quality = 0.92;
          if (hdMode) quality = 1.0;
          if (optimizeMode) quality = 0.75; 

          parts.push({
            id: parts.length + 1,
            dataUrl: partCanvas.toDataURL(mimeType, quality),
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
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${name}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("İndirme hatası:", error);
    }
  };

  const Header = ({ isEditor }) => (
    <header className={`fixed top-0 left-0 right-0 z-[70] px-8 py-4 flex items-center justify-between backdrop-blur-3xl ${isEditor ? 'bg-black/90 border-b border-white/5' : 'bg-transparent'}`}>
      <div className="flex items-center gap-6 ml-10">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setPage('landing'); setUploadedFile(null); setFileList([]); }}>
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black italic shadow-2xl transition-all text-2xl tracking-tighter">D</div>
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
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
        <Header isEditor={false} />
        <div className="absolute top-0 -z-10 w-full h-full bg-gradient-to-b from-blue-900/10 via-transparent to-transparent" />
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-normal pt-48 pb-6 italic uppercase">DUMP <br /> Split</h1>
        <p className="text-gray-400 max-w-xl mb-12 font-medium tracking-tight uppercase text-xs tracking-[0.2em]">Instagram için profesyonel Dump Bölme ve Kalite Artırma Aracı</p>
        <button onClick={triggerFileInput} className="w-full max-w-xl aspect-video bg-[#0c0c0c] border-2 border-dashed border-white/10 rounded-[48px] flex flex-col items-center justify-center group hover:border-white/30 transition-all p-12 shadow-2xl relative overflow-hidden">
           <div className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform"><Upload size={36} /></div>
           <p className="text-2xl font-black uppercase italic">Dosya Yükle</p>
        </button>
      </div>
    );
  }

  if (page === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 border-4 border-white/5 border-t-white rounded-[32px] animate-spin mb-10 shadow-2xl" />
        <h2 className="text-2xl font-black uppercase italic tracking-widest animate-pulse tracking-tighter">İşleniyor</h2>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
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
                          <span className="text-[12px] font-black text-white uppercase tracking-tight">AI Enhance</span>
                       </div>
                       <button onClick={() => setAutoEnhance(!autoEnhance)} className={`w-9 h-5 rounded-full transition-all relative ${autoEnhance ? 'bg-pink-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${autoEnhance ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase">Renkleri ve netliği yapay zeka ile otomatik iyileştirir.</p>
                  </div>
                  
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Cpu size={16} className="text-blue-400" />
                          <span className="text-[12px] font-black text-white uppercase tracking-tight italic">HD Kalite</span>
                       </div>
                       <button onClick={() => setHdMode(!hdMode)} className={`w-9 h-5 rounded-full transition-all relative ${hdMode ? 'bg-blue-400' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${hdMode ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase">HD modu ile pikseller 4K keskinliğine taşınır.</p>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Activity size={16} className="text-green-400" />
                          <span className="text-[12px] font-black text-white uppercase tracking-tight italic">Optimize</span>
                       </div>
                       <button onClick={() => setOptimizeMode(!optimizeMode)} className={`w-9 h-5 rounded-full transition-all relative ${optimizeMode ? 'bg-green-400' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${optimizeMode ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase">Görseli paylaşım için en ideal boyut ve keskinliğe getirir.</p>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Target size={16} className="text-purple-400" />
                          <span className="text-[12px] font-black text-white uppercase tracking-tight italic">Smart Crop</span>
                       </div>
                       <button onClick={() => setSmartCrop(!smartCrop)} className={`w-9 h-5 rounded-full transition-all relative ${smartCrop ? 'bg-purple-400' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${smartCrop ? 'right-1 bg-white' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase">Yapay zeka ile ana odağı otomatik tespit eder.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest block">Format</span>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                     {['png', 'jpg', 'webp'].map(fmt => (
                       <button key={fmt} onClick={() => setDownloadFormat(fmt)} className={`flex-1 py-2 rounded-lg text-[12px] font-black uppercase transition-all ${downloadFormat === fmt ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{fmt}</button>
                     ))}
                  </div>
                </div>

                {/* ULTRA HD TOGGLE */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Zap size={16} className="text-yellow-400" />
                          <span className="text-[12px] font-black text-white uppercase tracking-tight italic">ULTRA HD İNDİR</span>
                       </div>
                       <button onClick={() => setUltraHdMode(!ultraHdMode)} className={`w-9 h-5 rounded-full transition-all relative ${ultraHdMode ? 'bg-yellow-400' : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${ultraHdMode ? 'right-1 bg-black' : 'left-1 bg-white/30'}`} /></button>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase">Görsel çözünürlüğünü 2 katına çıkararak maksimum netlik sağlar.</p>
                </div>

                <div className="space-y-3">
                  <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest block">Parça Sayısı</span>
                  <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button 
                          key={num} 
                          onClick={() => setSplitCount(num)} 
                          className={`aspect-square rounded-xl text-[12px] font-black flex items-center justify-center transition-all border ${splitCount === num ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white hover:border-white/30'}`}
                        >
                          {num}
                        </button>
                      ))}
                  </div>
                </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5">
             <button 
              onClick={() => processSplit(uploadedFile, fileType === 'video')}
              disabled={isProcessing || !uploadedFile}
              className={`w-full py-5 rounded-[24px] font-black text-xs transition-all shadow-2xl ${isProcessing || !uploadedFile ? 'bg-white/5 text-gray-600' : 'bg-white text-black hover:bg-gray-200 active:scale-95 uppercase tracking-widest'}`}
            >
               {isProcessing ? 'İŞLENİYOR...' : 'YENİDEN BÖL'}
             </button>
          </div>
        </aside>

        <section className="flex-1 bg-[#050505] p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="relative w-full h-full max-w-[95vw] bg-black rounded-[56px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] flex items-center justify-center group/canvas">
             {uploadedFile ? (
               <div className="w-full h-full p-12 flex flex-col overflow-y-auto custom-scrollbar bg-black/40">
                  <div className={`w-full ${splitCount === 1 ? 'max-w-none px-4' : 'max-w-6xl'} mx-auto space-y-16 pb-40 flex flex-col items-center`}>
                      <div className="text-center">
                         <h3 className="text-4xl font-black uppercase tracking-tighter italic">Bölünen Parçalar</h3>
                      </div>
                      
                      <div className={`grid gap-12 w-full ${splitCount === 1 ? 'grid-cols-1' : (splitCount % 2 !== 0 || splitCount === 2 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}`}>
                          {splitSlides.length > 0 ? splitSlides.map((s) => (
                              <div key={`${uploadedFile}-${s.id}`} 
                                   style={splitCount !== 1 ? { aspectRatio: slideAspectRatio } : {}}
                                   className={`relative ${splitCount === 1 ? 'w-full h-auto min-h-[50vh] max-h-[85vh]' : ''} bg-[#0c0c0c] rounded-[48px] overflow-hidden border-2 border-white/5 group hover:border-white/30 transition-all shadow-2xl flex items-center justify-center`}>
                                  <img src={s.dataUrl} className={`w-full h-full ${splitCount === 1 ? 'object-contain' : 'object-cover'}`} alt="Slide" />
                                  
                                  {/* YENİ İNDİRME BUTONU - KESİN ÇÖZÜM */}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-50 pointer-events-none">
                                     <a 
                                      href={s.dataUrl}
                                      download={`part_${s.id}.${downloadFormat}`}
                                      onClick={(e) => e.stopPropagation()} 
                                      className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)] cursor-pointer pointer-events-auto"
                                      title="Bu parçayı indir"
                                     >
                                      <Download size={28} strokeWidth={2.5} />
                                     </a>
                                     <div className="absolute top-8 left-8 text-white font-bold bg-black/50 px-3 py-1 rounded-full text-xs border border-white/20">
                                        PARÇA {s.id}
                                     </div>
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

        <aside className="w-[100px] border-l border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl z-20 overflow-y-auto custom-scrollbar p-4 space-y-6">
            {fileList.map((file, idx) => (
              <div 
                key={file.id} 
                onClick={() => {
                  if (uploadedFile === file.url) return;
                  setIsProcessing(false);
                  setUploadedFile(file.url);
                  setFileType(file.type);
                  // Dosya değişince de varsayılan olarak 4'e sıfırla
                  setSplitCount(4); 
                  setSplitSlides([]);
                  setPage('loading');
                  setTimeout(() => setPage('editor'), 600);
                }}
                className={`relative group rounded-[20px] overflow-hidden aspect-square border-2 shadow-xl cursor-pointer transition-all shrink-0 ${uploadedFile === file.url ? 'border-white ring-2 ring-white/20' : 'border-white/10 opacity-60 hover:opacity-100'}`}
              >
                  {file.type === 'video' ? <video src={file.url} className="w-full h-full object-cover" /> : <img src={file.url} className="w-full h-full object-cover" alt="Thumb" />}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        const newList = fileList.filter((_, i) => i !== idx);
                        setFileList(newList);
                        
                        if (uploadedFile === file.url) {
                          if (newList.length > 0) {
                            setUploadedFile(newList[0].url);
                            setFileType(newList[0].type);
                            setIsProcessing(false);
                            setSplitSlides([]);
                            setSplitCount(4);
                            setPage('loading');
                            setTimeout(() => setPage('editor'), 600);
                          } else {
                            setUploadedFile(null);
                            setPage('landing');
                          }
                        }
                      }} 
                      className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white scale-75 group-hover:scale-100 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
              </div>
            ))}
            
            <div className="flex flex-col items-center gap-3 shrink-0">
               {fileList.length > 0 && (
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{fileList.length}/10</span>
               )}
               {fileList.length < 10 && (
                 <div onClick={triggerFileInput} className="w-full aspect-square border-2 border-dashed border-white/10 rounded-[20px] flex items-center justify-center text-gray-800 hover:text-white transition-all cursor-pointer shadow-inner"><Plus size={20} /></div>
               )}
            </div>
        </aside>
      </main>

      {notification && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-5 rounded-[30px] font-black shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-[200] flex items-center gap-4"><CheckCircle2 size={20} className="text-green-500 shadow-xl" /><span className="uppercase tracking-widest text-[10px] font-black">{notification}</span></div>
      )}

      <style>{`
        /* Tüm kaydırma çubuklarını gizle */
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; width: 0; background: transparent; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
};

export default App;

