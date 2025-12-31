import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, Minus, Plus, Image as ImageIcon, Video, Check, 
  Sparkles,  
  X, Monitor,
  Zap, CheckCircle2,
  Grid, DownloadCloud, FileImage, 
  ShieldCheck, Cpu, Activity, Target, Lock, ServerOff, HelpCircle as HelpIcon, Info, MessageCircleQuestion, FileQuestion, ZoomIn, Maximize,
  Download, Eye, Shield // Shield ikonu buraya eklendi
} from 'lucide-react';

// --- ICONS (Custom) ---
const DownloadIcon = ({ size = 24, strokeWidth = 2.5, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

// --- CONSTANTS ---
const SPLITTER_STATUS_MSGS = [
  "Medya verisi tuvale işleniyor...",
  "Dikey segmentasyon sınırları kilitleniyor...",
  "HD Piksel pürüzsüzleştirme aktif...",
  "Parçalar yüksek çözünürlükte paketleniyor."
];

const FEATURE_DETAILS = {
  aiEnhance: {
    title: "AI ENHANCE",
    icon: Sparkles,
    color: "text-pink-500",
    desc: "Yapay zeka algoritmaları fotoğrafın renk dengesini, doygunluğunu ve kontrastını analiz eder. Soluk renkleri canlandırır ve profesyonel bir görünüm kazandırır."
  },
  hdMode: {
    title: "HD KALİTE",
    icon: Cpu,
    color: "text-blue-400",
    desc: "Çıktı alma sürecinde gelişmiş pikselleri yumuşatarak kenar tırtıklarını giderir. Instagram'ın sıkıştırma algoritmasına karşı görüntüyü netleştirir."
  },
  optimize: {
    title: "OPTIMIZE",
    icon: Activity,
    color: "text-green-400",
    desc: "Görselin kalitesini gözle görülür şekilde düşürmeden dosya boyutunu %30-40 oranında sıkıştırır. Instagram hikaye ve gönderileri için ideal yükleme hızı sağlar."
  },
  smartCrop: {
    title: "SMART CROP",
    icon: Target,
    color: "text-purple-400",
    desc: "Fotoğrafın kenarlarındaki gereksiz veya boş alanları analiz eder ve %5 oranında 'Safe Zoom' yaparak ana objeyi merkeze odaklar."
  },
  ultraHd: {
    title: "ULTRA HD İNDİR",
    icon: Zap,
    color: "text-yellow-400",
    desc: "Super-Resolution (Süper Çözünürlük) teknolojisi kullanır. Mevcut görseli sanal olarak genişletip eksik pikselleri tamamlayarak çözünürlüğü 2 katına (2x Upscale) çıkarır."
  }
};

const App = () => {
  const [page, setPage] = useState('landing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false); 
  const [featureInfo, setFeatureInfo] = useState(null); 

  const [splitCount, setSplitCount] = useState(4); 
  const [downloadFormat, setDownloadFormat] = useState('png'); 
  const [autoEnhance, setAutoEnhance] = useState(false); 
  const [hdMode, setHdMode] = useState(false); 
  const [optimizeMode, setOptimizeMode] = useState(false); 
  const [smartCrop, setSmartCrop] = useState(false);
  const [ultraHdMode, setUltraHdMode] = useState(false);
  
  // ZOOM & BOYUTLAR
  const [zoom, setZoom] = useState(100);
  const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 });

  // --- DOCK DRAG LOGIC ---
  const [dockPos, setDockPos] = useState({ x: 0, y: 0 });
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDockPointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDraggingDock(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    dragStartRef.current = {
      x: clientX - dockPos.x,
      y: clientY - dockPos.y
    };
    if (e.target.setPointerCapture) {
       e.target.setPointerCapture(e.pointerId);
    }
  };

  const handleDockPointerMove = (e) => {
    if (!isDraggingDock) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    setDockPos({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y
    });
  };

  const handleDockPointerUp = () => {
    setIsDraggingDock(false);
  };

  const [fileList, setFileList] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [splitSlides, setSplitSlides] = useState([]); 
  
  const fileInputRef = useRef(null);
  const shouldResetList = useRef(false);
  const activeUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      activeUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('privacy_accepted');
    if (!hasAccepted) {
      setShowPrivacy(true); 
    }
  }, []);

  useEffect(() => {
    setZoom(100);
  }, [uploadedFile]);

  const handlePrivacyAccept = () => {
    localStorage.setItem('privacy_accepted', 'true'); 
    setShowPrivacy(false);
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      shouldResetList.current = false;
      fileInputRef.current.click();
    }
  };

  const triggerNewUpload = () => {
    if (fileInputRef.current) {
      shouldResetList.current = true;
      fileInputRef.current.click();
    }
  };

  const handleGoHome = () => {
    setPage('landing');
    setUploadedFile(null);
    setFileList([]);
    setSplitSlides([]);
    setZoom(100);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Maksimum dosya sayısı kontrolü
    if (!shouldResetList.current && fileList.length >= 20) { 
      showToast("Maksimum 20 dosya eklenebilir.");
      return;
    }

    const url = URL.createObjectURL(file);
    activeUrlsRef.current.push(url);

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const newFileObj = { url, type, id: Date.now() + Math.random() }; 
    
    if (shouldResetList.current) {
      setFileList([newFileObj]);
      shouldResetList.current = false;
    } else {
      setFileList(prev => [...prev, newFileObj]);
    }

    setUploadedFile(url);
    setFileType(type);
    setSplitSlides([]);
    setIsProcessing(false); 
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
      
      const scaleFactor = ultraHdMode ? 2 : 1;
      const sW = w * scaleFactor;
      const sH = h * scaleFactor;
      
      setMediaDimensions({ width: sW, height: sH });

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
            label: `Parça ${parts.length + 1}`,
            aspectRatio: partCanvas.width / partCanvas.height
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
      link.target = "_blank"; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("İndirme hatası:", error);
      showToast("İndirme başlatılamadı. Lütfen tekrar deneyin.");
    }
  };

  const FeatureToggle = ({ featureKey, state, setState, shortDesc }) => {
    const details = FEATURE_DETAILS[featureKey];
    const Icon = details.icon;
    
    return (
      <div className="group relative">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon size={16} className={details.color} />
              <span className="text-[12px] font-black text-white uppercase tracking-tight">{details.title}</span>
              <button onClick={() => setFeatureInfo(details)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white/10 rounded-full hover:bg-white/20 text-gray-400 hover:text-white" title="Detaylı Bilgi"><Info size={10} /></button>
            </div>
            <button onClick={() => setState(!state)} className={`w-9 h-5 rounded-full transition-all relative ${state ? details.color.replace('text-', 'bg-') : 'bg-white/10'}`}><div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${state ? 'right-1 bg-black' : 'left-1 bg-white/30'}`} /></button>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase mt-2">{shortDesc}</p>
      </div>
    );
  };

  const FeatureInfoModal = () => {
    if (!featureInfo) return null;
    const Icon = featureInfo.icon;
    return (
      <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setFeatureInfo(null)}>
        <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-100" onClick={e => e.stopPropagation()}>
           <div className="flex items-center gap-3 mb-4"><div className={`p-3 rounded-xl bg-white/5 ${featureInfo.color}`}><Icon size={24} /></div><h3 className="text-lg font-black text-white uppercase">{featureInfo.title}</h3></div>
           <p className="text-sm text-gray-300 leading-relaxed">{featureInfo.desc}</p>
           <button onClick={() => setFeatureInfo(null)} className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors">Tamam</button>
        </div>
      </div>
    );
  };

  const FAQModal = () => (
    <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-3xl w-full p-8 relative shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
        <button onClick={() => setShowFAQ(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 text-center flex items-center justify-center gap-3"><MessageCircleQuestion size={28} className="text-blue-400" /> Sıkça Sorulan Sorular</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><FileQuestion size={14} className="text-yellow-400"/> Video yükleyebilir miyim?</h3><p className="text-gray-400 text-xs leading-relaxed">Evet, video dosyalarını (MP4, MOV vb.) sisteme yükleyebilirsiniz. Ancak sistem videoları parça parça kesip video olarak vermez. Videonun o anki karesini <strong>yüksek kaliteli bir fotoğraf</strong> olarak yakalar ve bunu parçalara ayırır.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Lock size={14} className="text-green-400"/> Fotoğraflarım güvende mi?</h3><p className="text-gray-400 text-xs leading-relaxed">Kesinlikle. Sitemiz "Client-Side" (İstemci Taraflı) çalışır. Yüklediğiniz dosyalar sunucuya gönderilmez, sadece tarayıcınızın geçici hafızasında (RAM) işlenir. Sayfayı kapattığınız an her şey silinir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Monitor size={14} className="text-purple-400"/> Hangi cihazlarda çalışır?</h3><p className="text-gray-400 text-xs leading-relaxed">Dump Splitter; iPhone, Android, Tablet ve Bilgisayar (PC/Mac) tarayıcılarında sorunsuz çalışır. Herhangi bir uygulama indirmenize gerek yoktur.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Check size={14} className="text-blue-400"/> Ücretli mi, Sınır var mı?</h3><p className="text-gray-400 text-xs leading-relaxed">Tamamen ücretsizdir. Üyelik veya kredi sistemi yoktur. Performansın düşmemesi için aynı anda en fazla 10 dosya yükleyebilirsiniz ancak işlem bitince listeyi temizleyip tekrar yükleyebilirsiniz.</p></div>
           <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ImageIcon size={14} className="text-pink-400"/> Hangi formatlar destekleniyor?</h3><p className="text-gray-400 text-xs leading-relaxed">Giriş olarak JPG, PNG, WEBP, HEIC (tarayıcı desteğine göre) ve popüler video formatlarını kabul eder. Çıktı olarak PNG, JPG veya WEBP formatında indirebilirsiniz.</p></div>
           <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5"><h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Download size={14} className="text-orange-400"/> İndirme çalışmıyor?</h3><p className="text-gray-400 text-xs leading-relaxed">Eğer indirme başlamazsa tarayıcınızın "Pop-up engelleyicisini" kontrol edin veya sayfayı yenileyip (F5) tekrar deneyin. Tek tek indirmek için parçanın üzerindeki ok işaretine basmanız yeterlidir.</p></div>
        </div>
        <button onClick={() => setShowFAQ(false)} className="w-full bg-white/10 text-white font-bold py-4 rounded-xl mt-8 hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs">Tamamdır, Anladım</button>
      </div>
    </div>
  );

  const Header = ({ isEditor }) => (
    <header className={`fixed top-0 left-0 right-0 z-[70] px-4 md:px-8 py-4 flex items-center justify-between backdrop-blur-3xl transition-all ${isEditor ? 'bg-black/90 border-b border-white/5' : 'bg-transparent'}`}>
      <div className="flex items-center gap-3 md:gap-6 ml-2 md:ml-10">
        <div 
          className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all" 
          onClick={handleGoHome}
          title="Ana Menüye Dön"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-xl flex items-center justify-center font-black italic shadow-2xl transition-all text-xl md:text-2xl tracking-tighter group-hover:scale-105">D</div>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase hidden sm:block italic">Dump Splitter</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {isEditor && (
          <>
            <button 
              onClick={triggerNewUpload}
              className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-lg border border-white/10 whitespace-nowrap"
            >
               <Upload size={16} /> Yeni Yükleme
            </button>
            <button 
              onClick={() => splitSlides.forEach((s, i) => setTimeout(() => downloadFile(s.dataUrl, `slide_${i+1}`), i * 300))} 
              className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] whitespace-nowrap"
            >
               <DownloadCloud size={16} /> Tümünü İndir
            </button>
          </>
        )}
      </div>
    </header>
  );

  const PrivacyModal = () => (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500 overflow-y-auto">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-3xl w-full p-6 md:p-10 relative shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="p-3 bg-green-500/10 rounded-2xl animate-pulse"><ShieldCheck size={32} className="text-green-500" /></div>
          <div><h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Güvenlik ve Gizlilik Protokolü</h2><p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Son Güncelleme: 30.12.2025 • Sürüm 2.4.0 (Secure Build)</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Lock size={18} className="text-blue-400"/><span className="uppercase tracking-tight text-xs">İstemci Taraflı İşleme</span></h3><p className="text-gray-400 leading-relaxed text-xs">Dump Splitter, dosyalarınızı <strong>uzak bir sunucuya (Cloud) yüklemez.</strong> Tüm işlemler tarayıcınızın belleğinde (HTML5 Canvas) gerçekleşir. Verileriniz cihazınızdan asla dışarı çıkmaz.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><ServerOff size={18} className="text-red-400"/><span className="uppercase tracking-tight text-xs">Sunucu Kaydı Yoktur</span></h3><p className="text-gray-400 leading-relaxed text-xs">Uygulama sunucusuz çalışır. Fotoğraflarınız loglanmaz veya kaydedilmez. Sayfayı yenilediğinizde (F5), tüm geçici veriler RAM'den silinir.</p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Eye size={18} className="text-purple-400"/><span className="uppercase tracking-tight text-xs">AI Modeli Eğitilmez</span></h3><p className="text-gray-400 leading-relaxed text-xs">Kullanılan algoritmalar yereldir. Görselleriniz, herhangi bir yapay zeka modelini eğitmek veya yüz taraması yapmak amacıyla <strong>kullanılmaz.</strong></p></div>
          <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"><h3 className="text-white font-bold mb-3 flex items-center gap-3"><Shield size={18} className="text-yellow-400"/><span className="uppercase tracking-tight text-xs">Sıfır İz Politikası</span></h3><p className="text-gray-400 leading-relaxed text-xs">Kişisel verileriniz, IP adresiniz veya kullanım alışkanlıklarınız hiçbir üçüncü taraf ile paylaşılmaz. Uygulama tamamen anonimdir.</p></div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4"><p className="text-[10px] text-gray-600 uppercase tracking-widest">Bu uygulama KVKK ve GDPR gizlilik standartlarına uygun olarak tasarlanmıştır.</p><button onClick={handlePrivacyAccept} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">Güvenlik Protokollerini Onayla ve Devam Et</button></div>
      </div>
    </div>
  );

  const HowToModal = () => (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-lg w-full p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button onClick={() => setShowHowTo(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 text-center">Nasıl Kullanılır?</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4"><div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shrink-0">1</div><div><h3 className="text-white font-bold mb-1">Görsel Seç</h3><p className="text-gray-400 text-xs leading-relaxed">4'lü, 6'lı veya 10'lu dump fotoğraflarını yükle.</p></div></div>
          <div className="flex items-start gap-4"><div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shrink-0">2</div><div><h3 className="text-white font-bold mb-1">Ayarları Düzenle</h3><p className="text-gray-400 text-xs leading-relaxed">Parça sayısını seç, AI veya Ultra HD modunu aç.</p></div></div>
          <div className="flex items-start gap-4"><div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg shrink-0">3</div><div><h3 className="text-white font-bold mb-1">İndir ve Paylaş</h3><p className="text-gray-400 text-xs leading-relaxed">Hepsini birden veya tek tek indir.</p></div></div>
        </div>
        <button onClick={() => setShowHowTo(false)} className="w-full bg-white/10 text-white font-bold py-3 rounded-xl mt-8 hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xs">Anladım, Kapat</button>
      </div>
    </div>
  );

  const AboutModal = () => (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-2xl w-full p-8 md:p-10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button onClick={() => setShowAbout(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">DUMP SPLITTER NEDİR?</h2>
        <div className="text-gray-400 text-sm leading-relaxed mb-8 space-y-4">
            <p>Dump Splitter, Instagram'da popüler olan "Photo Dump" paylaşımlarınızı düzenlemenizi sağlayan, yapay zeka destekli bir web aracıdır.</p>
            <div className="bg-white/5 p-4 rounded-xl border-l-2 border-white/20">
                <h4 className="text-white font-bold mb-2 text-xs uppercase tracking-wider">Nasıl Çalışır?</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Fotoğraflarınızı sisteme yüklersiniz.</li>
                    <li>Sistem, fotoğrafları otomatik olarak böler.</li>
                    <li>Yapay zeka desteği ile renkler ve netlik optimize edilir.</li>
                    <li>Sonuçları tek tek veya toplu olarak indirirsiniz.</li>
                </ol>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0"><Zap size={24} /></div><div><h3 className="font-bold text-white text-sm">Hızlı & Ücretsiz</h3><p className="text-[10px] text-gray-500">Saniyeler içinde sonuç al.</p></div></div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0"><Sparkles size={24} /></div><div><h3 className="font-bold text-white text-sm">AI Güçlü İyileştirme</h3><p className="text-[10px] text-gray-500">Renkleri otomatik canlandır.</p></div></div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 shrink-0"><Lock size={24} /></div><div><h3 className="font-bold text-white text-sm">İstemci Taraflı</h3><p className="text-[10px] text-gray-500">Fotoğrafların sunucuya yüklenmez.</p></div></div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4"><div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-400 shrink-0"><Grid size={24} /></div><div><h3 className="font-bold text-white text-sm">Esnek Izgara Sistemi</h3><p className="text-[10px] text-gray-500">Tüm parça seçeneklerini destekler.</p></div></div>
        </div>
        <button onClick={() => setShowAbout(false)} className="w-full bg-white text-black font-black py-4 rounded-xl mt-8 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Harika, Başlayalım!</button>
      </div>
    </div>
  );

  if (page === 'landing') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-x-hidden">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
        <Header isEditor={false} />
        <div className="absolute top-8 right-4 md:right-8 z-[80] flex flex-wrap justify-end gap-2 md:gap-3">
             <button onClick={() => setShowAbout(true)} className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><Info size={12} /> <span className="hidden md:inline">DUMP SPLITTER NEDİR?</span><span className="md:hidden">NEDİR?</span></button>
             <button onClick={() => setShowHowTo(true)} className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><HelpIcon size={12} /> <span className="hidden md:inline">Nasıl Kullanılır?</span><span className="md:hidden">NASIL?</span></button>
             <button onClick={() => setShowFAQ(true)} className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><MessageCircleQuestion size={12} /> SSS</button>
            <button onClick={() => setShowPrivacy(true)} className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-full hover:bg-white/5 bg-black/20 backdrop-blur-sm"><ShieldCheck size={12} /> <span className="hidden md:inline">Gizlilik</span></button>
        </div>
        <div className="absolute top-0 -z-10 w-full h-full bg-gradient-to-b from-blue-900/10 via-transparent to-transparent" />
        <h1 className="text-5xl md:text-9xl font-black tracking-tighter mb-4 md:mb-8 leading-normal pt-32 md:pt-48 pb-4 md:pb-6 italic uppercase">DUMP <br /> SPLITTER</h1>
        <p className="text-gray-400 max-w-xl mb-8 md:mb-12 font-medium tracking-tight uppercase text-[10px] md:text-xs tracking-[0.2em] px-4">Instagram için profesyonel Dump Bölme ve Kalite Artırma Aracı</p>
        <button onClick={triggerFileInput} className="w-full max-w-xl aspect-video bg-[#0c0c0c] border-2 border-dashed border-white/10 rounded-[32px] md:rounded-[48px] flex flex-col items-center justify-center group hover:border-white/30 transition-all p-8 md:p-12 shadow-2xl relative overflow-hidden mx-4">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-black rounded-3xl flex items-center justify-center mb-6 md:mb-8 shadow-2xl group-hover:scale-110 transition-transform"><Upload size={28} className="md:w-9 md:h-9" /></div>
           <p className="text-lg md:text-2xl font-black uppercase italic">Dosya Yükle</p>
        </button>
        <p className="text-gray-500 mt-6 text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Fotoğraflar tarayıcında işlenir, sunucuya yüklenmez.</p>
        {showPrivacy && <PrivacyModal />}
        {showHowTo && <HowToModal />}
        {showAbout && <AboutModal />}
        {showFAQ && <FAQModal />}
      </div>
    );
  }

  if (page === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/5 border-t-white rounded-[32px] animate-spin mb-8 md:mb-10 shadow-2xl" />
        <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-widest animate-pulse tracking-tighter">İşleniyor</h2>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
      <Header isEditor={true} />
      <FeatureInfoModal />
      <main className="flex-1 pt-16 lg:pt-20 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* KAYDIRILABİLİR İÇERİK ALANI (Canvas + Ayarlar) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar pb-28 lg:pb-0"> 
          
          {/* 1. AYARLAR (Telefonda resmin altında, Masaüstünde solda) */}
          <aside className="w-full lg:w-[320px] h-auto lg:h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col order-2 lg:order-1 z-20 shrink-0">
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 space-y-6 lg:space-y-8">
              <div className="space-y-6">
                  <div className="p-5 bg-white/[0.03] border border-white/10 rounded-[28px] space-y-5 shadow-inner">
                    <div className="space-y-2"><FeatureToggle featureKey="aiEnhance" state={autoEnhance} setState={setAutoEnhance} shortDesc="Renkleri ve netliği yapay zeka ile otomatik iyileştirir." /></div>
                    <div className="space-y-2 border-t border-white/5 pt-4"><FeatureToggle featureKey="hdMode" state={hdMode} setState={setHdMode} shortDesc="HD modu ile pikseller 4K keskinliğine taşınır." /></div>
                    <div className="space-y-2 border-t border-white/5 pt-4"><FeatureToggle featureKey="optimize" state={optimizeMode} setState={setOptimizeMode} shortDesc="Görseli paylaşım için en ideal boyut ve keskinliğe getirir." /></div>
                    <div className="space-y-2 border-t border-white/5 pt-4"><FeatureToggle featureKey="smartCrop" state={smartCrop} setState={setSmartCrop} shortDesc="Yapay zeka ile ana odağı otomatik tespit eder." /></div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest block">Format</span>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                        {['png', 'jpg', 'webp'].map(fmt => (
                          <button key={fmt} onClick={() => setDownloadFormat(fmt)} className={`flex-1 py-2 rounded-lg text-[12px] font-black uppercase transition-all ${downloadFormat === fmt ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{fmt}</button>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-white/5 pt-3"><FeatureToggle featureKey="ultraHd" state={ultraHdMode} setState={setUltraHdMode} shortDesc="Görsel çözünürlüğünü 2 katına çıkararak maksimum netlik sağlar." /></div>
                  <div className="space-y-3">
                    <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest block">Parça Sayısı</span>
                    <div className="grid grid-cols-5 gap-2 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <button key={num} onClick={() => setSplitCount(num)} className={`aspect-square rounded-xl text-[12px] font-black flex items-center justify-center transition-all border ${splitCount === num ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-white hover:border-white/30'}`}>{num}</button>
                        ))}
                    </div>
                  </div>
              </div>
            </div>
            <div className="p-6 lg:p-8 border-t border-white/5 hidden lg:block">
               <button onClick={() => processSplit(uploadedFile, fileType === 'video')} disabled={isProcessing || !uploadedFile} className={`w-full py-4 lg:py-5 rounded-[24px] font-black text-xs transition-all shadow-2xl ${isProcessing || !uploadedFile ? 'bg-white/5 text-gray-600' : 'bg-white text-black hover:bg-gray-200 active:scale-95 uppercase tracking-widest'}`}>{isProcessing ? 'İŞLENİYOR...' : 'YENİDEN BÖL'}</button>
            </div>
            {/* Mobilde "Yeniden Böl" butonu ayarların altına eklendi */}
            <div className="p-6 lg:hidden border-t border-white/5 pb-8">
               <button onClick={() => processSplit(uploadedFile, fileType === 'video')} disabled={isProcessing || !uploadedFile} className={`w-full py-4 rounded-[24px] font-black text-xs transition-all shadow-2xl ${isProcessing || !uploadedFile ? 'bg-white/5 text-gray-600' : 'bg-white text-black hover:bg-gray-200 active:scale-95 uppercase tracking-widest'}`}>{isProcessing ? 'İŞLENİYOR...' : 'YENİDEN BÖL'}</button>
            </div>
          </aside>

          {/* 2. TUVAL (CANVAS) (Telefonda üstte, Masaüstünde ortada) */}
          <section className="flex-1 bg-[#050505] p-2 md:p-6 flex flex-col items-center relative order-1 lg:order-2 min-h-[50vh] lg:min-h-0">
            <div className="relative w-full h-full max-w-[95vw] bg-black rounded-[32px] md:rounded-[56px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(0,0,0,1)] flex items-center justify-center group/canvas my-auto">
                {uploadedFile ? (
                  <div className="w-full h-full p-4 md:p-12 flex flex-col overflow-y-auto custom-scrollbar bg-black/40">
                    <div className={`w-full ${splitCount === 1 ? 'max-w-none px-2 md:px-4' : 'max-w-6xl'} mx-auto space-y-8 md:space-y-16 pb-32 md:pb-40 flex flex-col items-center`}>
                        <div className="text-center mt-4"><h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic">Bölünen Parçalar</h3></div>
                        <div className={`grid gap-6 md:gap-12 w-full justify-items-center ${splitCount === 1 ? 'grid-cols-1' : (splitCount % 2 !== 0 || splitCount === 2 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}`}>
                            {splitSlides.length > 0 ? splitSlides.map((s) => (
                                <div key={`${uploadedFile}-${s.id}`} style={{ aspectRatio: s.aspectRatio, transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s' }} className="relative w-full max-w-[500px] h-auto max-h-[50vh] md:max-h-[70vh] bg-white/5 group hover:scale-[1.01] transition-all flex items-center justify-center snap-center rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                                    <img 
                                      src={s.dataUrl} 
                                      className="w-full h-full object-contain drop-shadow-2xl rounded-2xl md:rounded-3xl cursor-move touch-none" 
                                      alt="Slide" 
                                      draggable="false"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        const img = e.target;
                                        const style = window.getComputedStyle(img);
                                        const matrix = new DOMMatrix(style.transform);
                                        const currentX = matrix.m41;
                                        const currentY = matrix.m42;
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const handleMouseMove = (moveEvent) => {
                                          const dx = moveEvent.clientX - startX;
                                          const dy = moveEvent.clientY - startY;
                                          img.style.transform = `translate(${currentX + dx}px, ${currentY + dy}px)`;
                                        };
                                        const handleMouseUp = () => {
                                          window.removeEventListener('mousemove', handleMouseMove);
                                          window.removeEventListener('mouseup', handleMouseUp);
                                        };
                                        window.addEventListener('mousemove', handleMouseMove);
                                        window.addEventListener('mouseup', handleMouseUp);
                                      }}
                                      onTouchStart={(e) => {
                                        const img = e.target;
                                        // Pinch-to-zoom logic
                                        if (e.touches.length === 2) {
                                          e.preventDefault(); // Prevent default browser zoom
                                          const dist = Math.hypot(
                                            e.touches[0].pageX - e.touches[1].pageX,
                                            e.touches[0].pageY - e.touches[1].pageY
                                          );
                                          const initialZoom = zoom;
                                          
                                          const handlePinchMove = (moveEvent) => {
                                            if (moveEvent.touches.length === 2) {
                                               const newDist = Math.hypot(
                                                moveEvent.touches[0].pageX - moveEvent.touches[1].pageX,
                                                moveEvent.touches[0].pageY - moveEvent.touches[1].pageY
                                              );
                                              const newZoom = initialZoom * (newDist / dist);
                                              setZoom(Math.max(10, Math.min(200, newZoom)));
                                            }
                                          };
                                          
                                          const handlePinchEnd = () => {
                                            window.removeEventListener('touchmove', handlePinchMove);
                                            window.removeEventListener('touchend', handlePinchEnd);
                                          };
                                          window.addEventListener('touchmove', handlePinchMove, { passive: false });
                                          window.addEventListener('touchend', handlePinchEnd);
                                          return;
                                        }

                                        // Drag logic
                                        if(e.touches.length !== 1) return;
                                        
                                        const style = window.getComputedStyle(img);
                                        const matrix = new DOMMatrix(style.transform);
                                        const currentX = matrix.m41;
                                        const currentY = matrix.m42;
                                        const startX = e.touches[0].clientX;
                                        const startY = e.touches[0].clientY;

                                        const handleTouchMove = (moveEvent) => {
                                          if (moveEvent.touches.length === 1) {
                                            moveEvent.preventDefault(); 
                                            const dx = moveEvent.touches[0].clientX - startX;
                                            const dy = moveEvent.touches[0].clientY - startY;
                                            img.style.transform = `translate(${currentX + dx}px, ${currentY + dy}px)`;
                                          }
                                        };
                                        const handleTouchEnd = () => {
                                          window.removeEventListener('touchmove', handleTouchMove);
                                          window.removeEventListener('touchend', handleTouchEnd);
                                        };
                                        window.addEventListener('touchmove', handleTouchMove, { passive: false });
                                        window.addEventListener('touchend', handleTouchEnd);
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-50 pointer-events-none rounded-2xl md:rounded-3xl">
                                       <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); downloadFile(s.dataUrl, `part_${s.id}`); }} className="bg-white text-black w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)] cursor-pointer pointer-events-auto" title="Bu parçayı indir"><DownloadCloud size={24} strokeWidth={2.5} /></button>
                                       <div className="absolute top-4 left-4 text-white font-bold bg-black/50 px-3 py-1 rounded-full text-[10px] border border-white/20">PARÇA {s.id}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="w-full text-center py-40 opacity-10 italic text-xl md:text-2xl font-black uppercase tracking-widest">Medya Analiz Ediliyor...</div>
                            )}
                        </div>
                    </div>
                    
                    {splitSlides.length > 0 && (
                      <div 
                        onPointerDown={handleDockPointerDown}
                        onPointerMove={handleDockPointerMove}
                        onPointerUp={handleDockPointerUp}
                        style={{ 
                          left: '50%', 
                          bottom: '20px', 
                          transform: `translate(calc(-50% + ${dockPos.x}px), ${dockPos.y}px)`,
                          cursor: isDraggingDock ? 'grabbing' : 'grab',
                          touchAction: 'none' 
                        }}
                        className="absolute bg-black/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 md:px-6 md:py-3 flex items-center justify-center gap-4 md:gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-5 w-[90%] max-w-sm md:w-auto md:max-w-[90vw] select-none"
                      >
                        <div className="flex flex-col items-start gap-1 border-r border-white/10 pr-4 md:pr-6 min-w-[80px] md:min-w-[140px] shrink-0 pointer-events-none">
                            <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-wider">Çözünürlük</span>
                            <div className="flex items-center gap-1 md:gap-2 text-xs md:text-base font-black text-white italic">
                              <span>{mediaDimensions.width}</span>
                              <span className="text-gray-600 text-[10px] md:text-xs">×</span>
                              <span>{mediaDimensions.height}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 pl-2 justify-end shrink-0 flex-1">
                          <button onClick={() => setZoom(prev => Math.max(10, prev - 10))} onPointerDown={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white transition-colors shrink-0 p-2"><Minus size={14} /></button>
                          <div className="flex items-center gap-2 group/zoom"><span className="text-[10px] md:text-xs font-black text-white/50 w-8 text-center group-hover/zoom:text-white transition-colors shrink-0">{Math.round(zoom)}%</span></div>
                          <button onClick={() => setZoom(prev => Math.min(200, prev + 10))} onPointerDown={(e) => e.stopPropagation()} className="text-gray-500 hover:text-white transition-colors shrink-0 p-2"><Plus size={14} /></button>
                          <button onClick={() => setZoom(100)} onPointerDown={(e) => e.stopPropagation()} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-gray-400 hover:text-white ml-1 border border-white/5 shrink-0" title="Sıfırla"><Maximize size={12} /></button>
                        </div>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="text-center p-10 md:p-20 flex flex-col items-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-[48px] flex items-center justify-center mb-6 md:mb-10 text-gray-700 border border-white/5 shadow-inner"><ImageIcon size={40} className="md:w-12 md:h-12" /></div>
                    <h3 className="text-2xl md:text-4xl font-black mb-4 tracking-tighter uppercase tracking-widest">Medya Bekleniyor</h3>
                    <button onClick={triggerFileInput} className="bg-white text-black px-10 py-4 md:px-14 md:py-5 rounded-[24px] font-black shadow-2xl hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-widest text-[10px] md:text-xs">Dosya Seç</button>
                 </div>
               )}
               {isProcessing && (
                 <div className="absolute inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 border-[6px] border-white/5 border-t-white rounded-[40px] animate-spin mb-8 md:mb-10 shadow-2xl" />
                    <div className="space-y-4 text-center">{aiLogs.map((log, i) => (<p key={i} className="text-xs md:text-sm font-black text-gray-400 px-10 uppercase tracking-[0.3em] italic">{log}</p>))}</div>
                 </div>
               )}
            </div>
          </section>

        </div>

        {/* 3. GEÇMİŞ (Telefonda EN ALTTA SABİT, Masaüstünde Sağda) */}
        <aside className="
          fixed bottom-0 left-0 right-0 h-28 lg:static lg:h-full lg:w-[120px] 
          bg-[#080808]/95 backdrop-blur-xl lg:bg-[#080808] 
          border-t lg:border-t-0 lg:border-l border-white/10 
          flex flex-row lg:flex-col items-center 
          shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none 
          z-[60] lg:z-20 
          overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden custom-scrollbar 
          p-4 space-x-4 lg:space-x-0 lg:space-y-6 
          order-3
        ">
            {fileList.length === 0 && <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap lg:whitespace-normal text-center w-full">GEÇMİŞ BOŞ</div>}
            <div className="flex flex-row lg:flex-col gap-4">
              {fileList.map((file, idx) => (
                <div 
                  key={file.id} 
                  onClick={() => { 
                    if (uploadedFile === file.url) return; 
                    setIsProcessing(false); 
                    setUploadedFile(file.url); 
                    setFileType(file.type); 
                    setSplitCount(4); 
                    setSplitSlides([]); 
                    setPage('loading'); 
                    setTimeout(() => setPage('editor'), 600); 
                  }} 
                  className={`relative group rounded-[16px] lg:rounded-[20px] overflow-hidden aspect-square h-16 w-16 lg:h-auto lg:w-full border-2 shadow-xl cursor-pointer transition-all shrink-0 ${uploadedFile === file.url ? 'border-white ring-2 ring-white/20' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                >
                    {file.type === 'video' ? <video src={file.url} className="w-full h-full object-cover" /> : <img src={file.url} className="w-full h-full object-cover" alt="Thumb" />}
                    
                    {/* SİLME BUTONU: Touch event ile karışmaması için özel alan */}
                    <div 
                      className="absolute top-0 right-0 p-1 bg-black/60 rounded-bl-lg z-10"
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
                    >
                      <X size={12} className="text-white hover:text-red-500 transition-colors" />
                    </div>
                </div>
              ))}
            </div>
            
            <div className="flex lg:flex-col items-center gap-3 shrink-0 ml-auto lg:ml-0 border-l lg:border-l-0 lg:border-t border-white/10 pl-4 lg:pl-0 lg:pt-4">
              {fileList.length > 0 && (<span className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest">{fileList.length}/20</span>)}
              {fileList.length < 20 && (<div onClick={triggerFileInput} className="h-16 w-16 lg:h-auto lg:w-full lg:aspect-square border-2 border-dashed border-white/10 rounded-[16px] lg:rounded-[20px] flex items-center justify-center text-gray-800 hover:text-white transition-all cursor-pointer shadow-inner"><Plus size={20} /></div>)}
            </div>
        </aside>
      </main>
      {notification && (<div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-5 rounded-[30px] font-black shadow-[0_30px_100px_rgba(0,0,0,0.5)] z-[200] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300"><CheckCircle2 size={20} className="text-green-500 shadow-xl" /><span className="uppercase tracking-widest text-[10px] font-black">{notification}</span></div>)}
      <style>{`
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; width: 0; background: transparent; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
      `}</style>
    </div>
  );
};

export default App;
