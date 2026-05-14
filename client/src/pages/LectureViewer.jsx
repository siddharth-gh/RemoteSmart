import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/api";
import { useAuth } from "../app/useAuth";
import AppShell from "../layouts/AppShell";
import { findOfflineLecture } from "../utils/offlinePack";


  const isLocalUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.startsWith('192.168.');
    } catch { return false; }
  };

const formatVideoSize = (bytes) => {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const UnifiedPlayer = ({ item }) => {
  const { t } = useTranslation();
  const [currentMode, setCurrentMode] = useState("auto"); // auto, original, optimized, audio
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [detectedSpeed, setDetectedSpeed] = useState(null);
  const [autoQuality, setAutoQuality] = useState("optimized");
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const mediaRef = useRef(null);

  const optimizedReady = Boolean(item.optimizedUrl);
  const audioReady = Boolean(item.audioOnlyUrl);

  let effectiveSource = item.url;
  let modeLabel = "Original";

  if (currentMode === "auto") {
    effectiveSource = autoQuality === "optimized" && optimizedReady ? item.optimizedUrl : item.url;
    modeLabel = `Auto (${autoQuality === "optimized" ? "H.264" : t("lectureViewer.original") || "Original"})`;
  } else if (currentMode === "optimized" && optimizedReady) {
    effectiveSource = item.optimizedUrl;
    modeLabel = "H.264 Optimized";
  } else if (currentMode === "audio" && audioReady) {
    effectiveSource = item.audioOnlyUrl;
    modeLabel = t("lectureViewer.audioOnly") || "Audio Only";
  }

  useEffect(() => {
    let isActive = true;
    const runDetection = async () => {
      if (!item.url) return;
      const testUrl = optimizedReady ? item.optimizedUrl : item.url;
      const startTime = performance.now();
      try {
        const response = await fetch(testUrl, { headers: { Range: "bytes=0-499999" }, cache: "no-store" });
        const data = await response.blob();
        const durationSeconds = (performance.now() - startTime) / 1000;
        const mbps = (data.size * 8) / durationSeconds / 1_000_000;
        if (isActive) {
          setDetectedSpeed(Number(mbps.toFixed(2)));
          setAutoQuality(mbps < 2.5 ? "optimized" : "original");
        }
      } catch {
        const fallback = navigator?.connection?.downlink;
        if (isActive && fallback) setDetectedSpeed(fallback);
      }
    };
    runDetection();
    const id = setInterval(runDetection, 10000);
    return () => { isActive = false; clearInterval(id); };
  }, [item.url, item.optimizedUrl, optimizedReady]);

  const handleModeChange = (newMode) => {
    if (mediaRef.current) setCurrentTime(mediaRef.current.currentTime);
    setIsChangingMode(true);
    setCurrentMode(newMode);
    setTimeout(() => setIsChangingMode(false), 100);
  };

  useEffect(() => {
    if (mediaRef.current && currentTime > 0) {
      mediaRef.current.currentTime = currentTime;
      mediaRef.current.play().catch(() => null);
    }
  }, [effectiveSource, currentMode]);

  return (
    <>
      {audioReady && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-surface-muted rounded-full border border-border shadow-inner">
            <button 
              onClick={() => handleModeChange('auto')}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentMode !== 'audio' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:bg-surface'}`}
            >
              <span>📺 Video Mode</span>
            </button>
            <button 
              onClick={() => handleModeChange('audio')}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${currentMode === 'audio' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:bg-surface'}`}
            >
              <span>🎧 Audio Only</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-black rounded-[24px] overflow-hidden shadow-2xl relative group border border-white/5 max-w-5xl mx-auto">
        <div className={`relative ${currentMode === 'audio' ? 'p-12 bg-gray-900 flex flex-col items-center justify-center min-h-[300px]' : 'aspect-video'}`}>
          
          {currentMode !== "audio" ? (
            <video
              ref={mediaRef}
              key={effectiveSource}
              className="w-full h-full object-contain"
              controls
              poster={item.thumbnailUrl}
              preload="none"
              src={effectiveSource}
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="flex flex-col items-center gap-8 w-full animate-in fade-in duration-700">
               <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center animate-pulse border border-accent/30 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                  <span className="text-5xl">📻</span>
               </div>
               <div className="text-center">
                  <p className="text-2xl font-black text-white tracking-tight mb-2">{t("lectureViewer.audioModeEnabled") || "Audio Only Streaming"}</p>
                  <p className="text-xs font-bold text-gray-400 max-w-xs mx-auto">{t("lectureViewer.maxDataSavings") || "Saving bandwidth by playing audio only."}</p>
               </div>
               <audio
                 ref={mediaRef}
                 key={effectiveSource}
                 src={effectiveSource}
                 controls
                 className="w-full max-w-md accent-accent"
                 onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
               />
            </div>
          )}

          {isChangingMode && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white font-black z-30">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
              <p className="text-[10px] uppercase tracking-[0.2em]">{t("lectureViewer.switchingQuality") || "Switching Streaming Mode..."}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900/95 backdrop-blur-xl p-4 lg:p-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{t("lectureViewer.quality")}</span>
              <select 
                className="bg-gray-800 text-white text-[10px] font-black px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer hover:bg-gray-700 transition-colors"
                value={currentMode} 
                onChange={(e) => handleModeChange(e.target.value)}
              >
                <option value="auto">{t("lectureViewer.autoSelect")}</option>
                <option value="original">High ({formatVideoSize(item.originalSize)})</option>
                {optimizedReady && <option value="optimized">Compressed ({formatVideoSize(item.optimizedSize)})</option>}
                {audioReady && <option value="audio">Audio Only ({formatVideoSize(item.audioOnlySize)})</option>}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{t("lectureViewer.speed")}</span>
              <select 
                className="bg-gray-800 text-white text-[10px] font-black px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer hover:bg-gray-700 transition-colors"
                value={playbackSpeed} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPlaybackSpeed(val);
                  if (mediaRef.current) mediaRef.current.playbackRate = val;
                }}
              >
                <option value="0.5">0.5x</option>
                <option value="1">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
             <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">{modeLabel}</p>
                {detectedSpeed && <p className="text-[10px] font-bold text-gray-400">{detectedSpeed} Mbps detected</p>}
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

const LectureViewer = () => {
  const { t } = useTranslation();
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setCurrentUser } = useAuth();
  const lectureList = useMemo(() => location.state?.lectures || [], [location.state?.lectures]);
  
  const [lecture, setLecture] = useState(null);
  const [error, setError] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [visibleImages, setVisibleImages] = useState({});
  const [note, setNote] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [transcriptOnlyMode, setTranscriptOnlyMode] = useState(false);
  
  const [showNotes, setShowNotes] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [mediaTab, setMediaTab] = useState("summary"); // 'transcript' or 'summary'
  const [showTranscriptBelow, setShowTranscriptBelow] = useState(true);

  // Chat State
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef(null);



  const [courseOutline, setCourseOutline] = useState(null);
  const [outlineModules, setOutlineModules] = useState([]);
  const [outlineLectures, setOutlineLectures] = useState({});
  const [outlineQuizzes, setOutlineQuizzes] = useState({});
  const [openOutlineModule, setOpenOutlineModule] = useState("");
  const [outlineLoading, setOutlineLoading] = useState(true);

  const currentIndex = lectureList.findIndex((item) => item._id === lectureId);
  const nextLecture = lectureList[currentIndex + 1];

  useEffect(() => {
    const loadLecture = async () => {
      try {
        const requests = [API.get(`/lectures/single/${lectureId}`)];
        if (isAuthenticated && user?.role === "student") requests.push(API.get(`/notes/lecture/${lectureId}`));
        
        const [lecRes, noteRes] = await Promise.all(requests);
        const loadedLecture = lecRes.data;
        if (!loadedLecture) {
          setError("Lecture not found");
          return;
        }
        setLecture(loadedLecture);
        setTranscriptOnlyMode(user?.preferredMode === "low-bandwidth" && Boolean(loadedLecture.transcript?.text));
        if (noteRes?.data?.content) setNote(noteRes.data.content);
        else setNote("");

        if (loadedLecture?.moduleId) {
          setOutlineLoading(true);
          try {
            const moduleResponse = await API.get(`/modules/single/${loadedLecture.moduleId}`);
            const module = moduleResponse.data;
            if (module?.courseId) {
              const [courseRes, modulesRes] = await Promise.all([
                API.get(`/courses/${module.courseId}`),
                API.get(`/modules/${module.courseId}`),
              ]);
              setCourseOutline(courseRes.data);
              setOutlineModules(modulesRes.data);
              setOpenOutlineModule(module._id);

              const lecEntries = await Promise.all(modulesRes.data.map(async (m) => [m._id, (await API.get(`/lectures/${m._id}`)).data]));
              const quizEntries = await Promise.all(modulesRes.data.map(async (m) => [m._id, (await API.get(`/quizzes/module/${m._id}`)).data]));
              setOutlineLectures(Object.fromEntries(lecEntries));
              setOutlineQuizzes(Object.fromEntries(quizEntries));
            }
          } finally { setOutlineLoading(false); }
        }
      } catch (err) {
        const offlineData = await findOfflineLecture(lectureId);
        if (offlineData?.lecture) {
          setLecture(offlineData.lecture);
          setTranscriptOnlyMode(user?.preferredMode === "low-bandwidth" && Boolean(offlineData.lecture.transcript?.text));
          setCourseOutline(offlineData.course);
          setOutlineModules([offlineData.module]);
          setOutlineLectures({ [offlineData.module._id]: offlineData.lectures });
          setOutlineQuizzes({ [offlineData.module._id]: offlineData.quizzes || [] });
          setOpenOutlineModule(offlineData.module._id);
          setOutlineLoading(false);
          return;
        }
        setError(err.response?.data?.message || "Failed to load lecture");
      }
    };
    loadLecture();
  }, [lectureId, isAuthenticated, user?.role, user?.preferredMode]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleMarkComplete = async () => {
    setIsMarkingComplete(true);
    try {
      const res = await API.post(`/progress/lecture/${lectureId}/complete`, { completed: true });
      if (res.data.student && user) setCurrentUser({ ...user, streakCount: res.data.student.streakCount });
      setCompletionMessage("Lecture completed!");
    } catch { setCompletionMessage("Failed to update progress"); }
    finally { setIsMarkingComplete(false); }
  };

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      await API.put(`/notes/lecture/${lectureId}`, { content: note });
      setNoteMessage("Note saved!");
      setTimeout(() => setNoteMessage(""), 3000);
    } catch { setNoteMessage("Failed to save note"); }
    finally { setIsSavingNote(false); }
  };

  const handleSendChatQuery = async (queryOverride) => {
    const query = queryOverride || chatQuery;
    if (!query.trim() || isChatLoading) return;

    const newMessage = { role: "user", content: query };
    setChatMessages(prev => [...prev, newMessage]);
    setChatQuery("");
    setIsChatLoading(true);

    try {
      const res = await API.post(`/lectures/single/${lectureId}/ai-chat`, {
        messages: [...chatMessages, newMessage]
      });
      const replyText = res.data.reply || res.data.content || (typeof res.data === 'string' ? res.data : "I'm sorry, I couldn't process that.");
      setChatMessages(prev => [...prev, { role: "assistant", content: replyText }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I encountered an error processing your request." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleStartAdaptivePractice = () => {
    navigate(`/adaptive-quiz/${lectureId}`);
  };

  if (error) return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-12 shadow-xl shadow-red-500/5">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm">⚠️</div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">{error}</h2>
          <p className="text-sm font-medium text-gray-500 mb-10 max-w-md mx-auto">
            This lecture could not be loaded. This might be because it's a draft or has been removed.
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-red-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    </AppShell>
  );

  if (!lecture) return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
         <div className="h-10 bg-surface-muted rounded-xl w-32 mb-8"></div>
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 h-[500px] bg-surface rounded-[48px] border border-border"></div>
            <div className="h-[500px] bg-surface rounded-[48px] border border-border"></div>
         </div>
      </div>
    </AppShell>
  );

  const mediaContent = [
    ...(lecture?.contents?.filter(i => i.type === "video" || i.type === "image" || i.type === "pdf" || i.type === "pptx" || i.type === "ppt") || []),
    ...(lecture?.resources?.filter(i => i.type === "pdf" || i.type === "pptx" || i.type === "ppt") || [])
  ];
  const resourceFiles = lecture?.resources || [];
  const textContent = lecture?.contents?.filter(i => i.type === "text") || [];
  
  const isVideo = lecture?.contents?.some(c => c.type === 'video');
  const hasPDF = lecture?.resources?.some(r => r.type === 'pdf') || lecture?.contents?.some(c => c.type === 'pdf');
  const hasDoc = lecture?.resources?.some(r => r.type === 'docx' || r.type === 'doc') || lecture?.contents?.some(c => c.type === 'docx' || c.type === 'doc');

  return (
    <AppShell fullWidth>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background w-full">
        
        {/* Absolute Left Sidebar - Course Outline */}
        <aside className="w-72 border-r border-border bg-surface flex flex-col flex-shrink-0 relative z-40 no-scrollbar">
           <div className="p-6 border-b border-border/50">
              <span className="text-accent font-black text-[9px] uppercase tracking-[0.2em] mb-2 block">{t("lectureViewer.currentCourse")}</span>
              <h2 className="text-base font-black text-primary leading-tight tracking-tight">{courseOutline?.title}</h2>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar p-3">
              {outlineModules.map((m, mIdx) => {
                const isOpen = openOutlineModule === m._id;
                return (
                  <div key={m._id} className="mb-2">
                     <button 
                       onClick={() => setOpenOutlineModule(isOpen ? "" : m._id)}
                       className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-left transition-all duration-300 border ${isOpen ? 'bg-accent/5 text-accent border-accent/20 shadow-sm' : 'text-secondary bg-surface-soft/30 border-border/50 hover:bg-surface-soft hover:border-accent/10'}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black transition-all ${isOpen ? 'bg-accent text-white' : 'bg-surface-soft text-secondary'}`}>
                              {String(mIdx + 1).padStart(2, '0')}
                           </div>
                           <span className="text-[10px] font-black truncate max-w-[150px] uppercase tracking-widest">{m.title}</span>
                        </div>
                        <span className={`text-[10px] font-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>↓</span>
                     </button>
                     
                     {isOpen && (
                       <div className="mt-2 space-y-1 pl-3 border-l-2 border-accent/10 ml-3 animate-in slide-in-from-left-2 duration-300">
                          {outlineLectures[m._id]?.map((l, lIdx) => (
                            <div key={l._id} className="space-y-1">
                              <button 
                               onClick={() => navigate(`/lecture/${l._id}`, { state: { lectures: outlineLectures[m._id] } })}
                               className={`w-full text-left py-2 px-3 rounded-lg text-[10px] transition-all flex items-center justify-between group/sidebar-item border ${l._id === lectureId ? 'bg-accent text-white shadow-lg shadow-accent/10 font-black border-accent' : 'text-secondary hover:text-accent font-bold bg-surface-soft/30 border-border/50 hover:bg-surface-soft hover:border-accent/20'}`}
                              >
                                <span className="flex items-center gap-2">
                                   <span className="opacity-50 text-[8px]">L{lIdx + 1}</span>
                                   <span className="truncate max-w-[160px]">{l.title}</span>
                                </span>
                                {l._id === lectureId && <span className="text-[10px] animate-pulse">●</span>}
                              </button>
                              
                              {outlineQuizzes[m._id]?.filter(q => q.sourceLectureId === l._id).map(q => (
                                <button 
                                 key={q._id}
                                 onClick={() => navigate(`/quiz/${q._id}`)}
                                 className="ml-5 w-[calc(100%-1.25rem)] text-left py-1.5 px-3 rounded-lg text-[8px] font-black text-warning bg-warning/5 hover:bg-warning/10 transition-all flex items-center gap-2 border border-warning/5"
                                >
                                  <span>📝</span>
                                  <span className="truncate">{q.title}</span>
                                </button>
                              ))}
                            </div>
                          ))}
                          
                          {outlineQuizzes[m._id]?.filter(q => !q.sourceLectureId).map(q => (
                            <button 
                             key={q._id}
                             onClick={() => navigate(`/quiz/${q._id}`)}
                             className="w-full text-left py-2 px-3 rounded-lg text-[8px] font-black text-accent bg-accent/5 hover:bg-accent/10 transition-all flex items-center gap-2 border border-accent/5 mt-1"
                            >
                              <span>🧠</span>
                              <span className="truncate">{q.title}</span>
                            </button>
                          ))}
                       </div>
                     )}
                  </div>
                );
              })}
           </div>
           
           <div className="p-4 bg-surface-soft/50 border-t border-border/50 text-center">
              <button 
               onClick={() => navigate(`/course/${courseOutline?._id || lecture?.courseId || lecture?.course}`)}
               className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] hover:text-accent transition-colors"
              >
                 ← View Full Course
              </button>
           </div>
        </aside>

        {/* Main Content Center */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-background flex flex-col items-center relative z-10">
           <div className="w-full max-w-5xl px-6 lg:px-12 py-10">
              
              <div className="mb-10 text-center">
                 <span className="px-3 py-1 bg-accent/10 text-accent text-[9px] font-black rounded-full uppercase tracking-widest mb-4 inline-block shadow-sm">Lecture</span>
                 <h1 className="text-2xl lg:text-4xl font-black text-primary leading-tight tracking-tight mb-2">{lecture.title}</h1>
              </div>

              <div className="space-y-12 mb-16">
                 {mediaContent.map((item, index) => {
                    const isVideo = item.type === "video";
                    const isImage = item.type === "image";
                    const isPDF = item.type === "pdf";
                    const isPPT = item.type === "pptx" || item.type === "ppt";
                    const isDOC = item.type === "docx" || item.type === "doc";
                    
                    if (isVideo && transcriptOnlyMode && lecture.transcript?.text) return null;

                    const showImage = !isImage || user?.preferredMode !== "low-bandwidth" || visibleImages[index];

                    return (
                      <div key={index} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                         {/* Media Player / Viewer */}
                         <div className="relative group">
                           {isVideo && <UnifiedPlayer item={item} />}
                           
                           {isImage && (
                             showImage ? (
                               <div className="rounded-[32px] overflow-hidden border border-border shadow-2xl max-w-4xl mx-auto bg-surface">
                                 <img src={item.url} alt="Lecture Content" className="w-full h-auto" />
                               </div>
                             ) : (
                               <button 
                                 onClick={() => setVisibleImages(curr => ({ ...curr, [index]: true }))} 
                                 className="w-full py-20 bg-surface border-2 border-dashed border-border rounded-[32px] text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-surface-soft hover:border-accent/30 transition-all flex flex-col items-center gap-4"
                               >
                                 <span className="text-3xl">🖼️</span>
                                 <span>Click to load image (Optimized for bandwidth)</span>
                               </button>
                             )
                           )}

                           {isPDF && (
                             <div className="rounded-[32px] overflow-hidden border border-border shadow-2xl max-w-4xl mx-auto bg-white h-[600px]">
                                <iframe 
                                  src={`${item.url}#toolbar=0`} 
                                  className="w-full h-full border-none"
                                  title="PDF Viewer"
                                />
                             </div>
                           )}

                           
                           {isDOC && (
                             <div className="rounded-[32px] overflow-hidden border border-border shadow-2xl max-w-4xl mx-auto bg-white h-[600px] relative group">
                                {isLocalUrl(item.url) ? (
                                  <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">📝</div>
                                    <h3 className="text-xl font-black text-primary mb-3">Local Preview Unavailable</h3>
                                    <p className="text-sm font-medium text-secondary max-w-md mb-8">
                                      Google Docs Viewer cannot access files on your local machine. 
                                      Once deployed, this preview will work automatically.
                                    </p>
                                    <div className="flex gap-4">
                                      <a href={item.url} download className="px-8 py-4 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-accent/20">Download to View</a>
                                    </div>
                                  </div>
                                ) : (
                                  <iframe 
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(item.url)}&embedded=true`} 
                                    className="w-full h-full border-none"
                                    title="Document Viewer"
                                  />
                                )}
                             </div>
                           )}
                           {isPPT && (
                             <div className="rounded-[32px] overflow-hidden border border-border shadow-2xl max-w-4xl mx-auto bg-white h-[600px] relative group">
                                {isLocalUrl(item.url) ? (
                                  <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">📂</div>
                                    <h3 className="text-xl font-black text-primary mb-3">Local Preview Unavailable</h3>
                                    <p className="text-sm font-medium text-secondary max-w-md mb-8">
                                      Google Docs Viewer cannot access files on your local machine (localhost). 
                                      Once deployed to a public server, this preview will work automatically.
                                    </p>
                                    <div className="flex gap-4">
                                      <a href={item.url} download className="px-8 py-4 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-accent/20">Download to View</a>
                                      <a href={item.url} target="_blank" rel="noreferrer" className="px-8 py-4 bg-surface-soft text-secondary text-[10px] font-black uppercase tracking-widest rounded-2xl">Open in Browser</a>
                                    </div>
                                  </div>
                                ) : (
                                  <iframe 
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(item.url)}&embedded=true`} 
                                    className="w-full h-full border-none"
                                    title="PPT Viewer"
                                  />
                                )}
                             </div>
                           )}
                         </div>
                       </div>
                    );
                 })}
              </div>

               {/* Transcript / AI Summary Tab System - always shown once, outside the media loop */}
               <div className="max-w-4xl mx-auto w-full space-y-6 mb-16">
                  <div className="flex justify-center">
                     <div className="inline-flex p-1 bg-surface-muted rounded-full border border-border shadow-inner">
                        <button 
                          onClick={() => {
                            if (mediaTab === 'summary') setShowTranscriptBelow(!showTranscriptBelow);
                            else { setMediaTab('summary'); setShowTranscriptBelow(true); }
                          }}
                          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showTranscriptBelow && mediaTab === 'summary' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:bg-surface'}`}
                        >
                          <span>✨ AI Summary</span>
                        </button>
                        {(isVideo || lecture.transcript?.text || (resourceFiles && resourceFiles.length > 0)) && (
                           <button 
                             onClick={() => {
                               if (mediaTab === 'transcript') setShowTranscriptBelow(!showTranscriptBelow);
                               else { setMediaTab('transcript'); setShowTranscriptBelow(true); }
                             }}
                             className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showTranscriptBelow && mediaTab === 'transcript' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-secondary hover:bg-surface'}`}
                           >
                             <span>📄 Transcript</span>
                           </button>
                        )}
                     </div>
                  </div>

                  {showTranscriptBelow && (
                    <div className="bg-surface border border-border rounded-[24px] p-6 lg:p-10 animate-in slide-in-from-top duration-500 shadow-xl relative overflow-hidden">
                       {mediaTab === 'summary' && <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" />}
                       
                       <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                          <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
                            {mediaTab === 'transcript' ? 'Transcript' : 'AI Executive Insights'}
                          </span>
                          {mediaTab === 'summary' && lecture.aiSummary?.status === 'ready' && (
                            <span className="px-3 py-1 bg-accent/10 text-accent text-[9px] font-black rounded-full uppercase tracking-widest">Context Aware</span>
                          )}
                       </div>
                       
                       <div className="max-h-[400px] overflow-y-auto pr-6 no-scrollbar">
                          {mediaTab === 'transcript' ? (
                            <p className="text-base font-medium text-secondary leading-relaxed whitespace-pre-wrap">
                              {lecture.transcript?.text || (lecture.resources?.length > 0 ? lecture.resources[0].extractedText : "") || "No documentation or OCR text available for this specific media."}
                            </p>
                          ) : (
                            <div className="space-y-8">
                              <div className="space-y-4">
                                 <p className="text-lg font-black text-primary leading-tight tracking-tight">Summary of Key Concepts</p>
                                 <p className="text-base font-medium text-secondary leading-relaxed">
                                   {lecture.aiSummary?.text || (lecture.aiSummary?.status === 'processing' ? 'AI summary is being generated, check back shortly...' : 'No AI summary available yet.')}
                                 </p>
                              </div>
                              {lecture.aiSummary?.keyPoints?.length > 0 && (
                                <div className="pt-6 border-t border-border/30">
                                   <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6">Critical Takeaways</p>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {lecture.aiSummary.keyPoints.map((p, i) => (
                                       <div key={i} className="p-4 bg-surface-soft rounded-2xl border border-accent/5 flex items-start gap-3">
                                          <span className="text-accent font-black">#</span>
                                          <span className="text-[11px] font-bold text-secondary">{p}</span>
                                       </div>
                                     ))}
                                   </div>
                                </div>
                              )}
                            </div>
                          )}
                       </div>
                    </div>
                  )}
               </div>

              {resourceFiles.length > 0 && (
                <div className="space-y-4 mb-16 max-w-4xl mx-auto w-full">
                   <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Lecture Resources</h3>
                   {resourceFiles.map((res, i) => (
                     <div key={i} className="bg-surface border border-border rounded-[24px] p-5 flex items-center justify-between shadow-sm hover:border-accent/20 transition-all group">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-accent/5 text-accent flex items-center justify-center rounded-2xl text-xl border border-accent/10 group-hover:bg-accent group-hover:text-white transition-all">📄</div>
                           <div>
                              <p className="text-sm font-black text-primary">{res.title}</p>
                              <p className="text-[9px] font-black text-secondary uppercase tracking-widest mt-1">Resource Archive</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <a href={res.url} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-surface-soft text-secondary text-[9px] font-black rounded-xl uppercase tracking-widest hover:bg-surface-muted transition-all">View</a>
                           <a href={res.url} download className="px-5 py-2.5 bg-accent text-white text-[9px] font-black rounded-xl uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/10">Download</a>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              <div className="space-y-10 mb-16 max-w-4xl mx-auto w-full">
                 {textContent.map((item, index) => (
                   <div key={index} className="text-base text-secondary leading-relaxed whitespace-pre-wrap font-medium bg-surface/30 p-8 lg:p-10 rounded-[24px] border border-border/50 shadow-inner">
                      {item.data}
                   </div>
                 ))}
              </div>



              {lecture.aiQuestionBank?.status === "ready" && lecture.aiQuestionBank.questions?.length > 0 && (
                <section className="bg-surface border border-border rounded-[32px] p-8 lg:p-12 mt-16 shadow-sm relative overflow-hidden max-w-4xl mx-auto w-full">
                   <div className="absolute top-0 left-0 w-80 h-80 bg-warning/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-[100px]" />
                   
                   <div className="mb-10 text-center relative z-10">
                      <span className="px-4 py-1.5 bg-warning text-white text-[9px] font-black rounded-full uppercase tracking-widest mb-6 inline-block shadow-2xl shadow-warning/30">Mastery Assessment</span>
                      <h2 className="text-2xl font-black text-primary tracking-tight">Challenge Your Understanding</h2>
                      <p className="text-xs font-medium text-secondary mt-3">Interactive adaptive quiz based on lecture content.</p>
                   </div>

                   <div className="text-center relative z-10">
                      <button onClick={handleStartAdaptivePractice} className="px-12 py-6 bg-accent text-white font-black rounded-[24px] shadow-2xl shadow-accent/20 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em] text-xs">
                        Launch Practice Session
                      </button>
                   </div>
                </section>
              )}

              <div className="flex flex-col items-center gap-6 py-24 border-t border-border mt-20">
                 <button 
                  onClick={handleMarkComplete} 
                  disabled={isMarkingComplete}
                  className={`px-16 py-6 rounded-2xl font-black transition-all shadow-2xl text-[11px] uppercase tracking-[0.2em] transform active:scale-95 ${completionMessage.includes('completed') ? 'bg-success text-white shadow-success/20' : 'bg-accent text-white shadow-accent/20 hover:scale-[1.02]'}`}
                 >
                   {isMarkingComplete ? "Processing..." : completionMessage.includes('completed') ? "✓ Unit Completed" : "Mark as Completed"}
                 </button>
                 {completionMessage && <p className="text-[10px] font-black text-accent uppercase tracking-widest animate-pulse">{completionMessage}</p>}
                 {nextLecture && (
                    <button onClick={() => navigate(`/lecture/${nextLecture._id}`, { state: { lectures: lectureList } })} className="mt-4 px-8 py-4 bg-surface-soft text-secondary font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-accent hover:text-white transition-all shadow-sm">
                       Next Unit: {nextLecture.title} →
                    </button>
                 )}
              </div>

           </div>
        </main>

        <aside className="w-20 border-l border-border bg-surface flex flex-col items-center py-10 gap-8 flex-shrink-0 relative z-40">
           <div className="flex flex-col gap-6 items-center">
              <button 
                onClick={() => {setShowAssistant(!showAssistant); setShowNotes(false);}}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm ${showAssistant ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-110' : 'bg-surface-soft text-secondary hover:bg-accent/10 hover:text-accent'}`}
                title="AI Learning Assistant"
              >
                 ✨
              </button>
              <button 
                onClick={() => {setShowNotes(!showNotes); setShowAssistant(false);}}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm ${showNotes ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-110' : 'bg-surface-soft text-secondary hover:bg-accent/10 hover:text-accent'}`}
                title="Personal Knowledge Base"
              >
                 📝
              </button>
           </div>
        </aside>

        {(showAssistant || showNotes) && (
           <aside className="w-96 border-l border-border bg-surface flex flex-col flex-shrink-0 relative z-50 animate-in slide-in-from-right duration-500 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.3)] no-scrollbar">
              <div className="p-8 border-b border-border/50 flex justify-between items-center bg-surface-soft/30">
                 <div className="flex flex-col">
                    <span className="text-accent font-black text-[9px] uppercase tracking-[0.2em] mb-1">Knowledge Tools</span>
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                       {showAssistant ? "AI Learning Assistant" : "Lecture Study Notes"}
                    </h3>
                 </div>
                 <button onClick={() => {setShowAssistant(false); setShowNotes(false);}} className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-error/10 hover:text-error transition-all">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar flex flex-col">
                 {showNotes ? (
                    <div className="flex flex-col h-full">
                       <textarea 
                         className="flex-1 w-full bg-surface-soft/50 rounded-[32px] p-8 text-sm font-medium text-primary border-none focus:ring-2 focus:ring-accent/20 resize-none mb-6 shadow-inner transition-all focus:bg-surface border border-transparent focus:border-accent/10"
                         placeholder="Synthesize your understanding here..."
                         value={note}
                         onChange={(e) => setNote(e.target.value)}
                       />
                       <button 
                         onClick={handleSaveNote} 
                         disabled={isSavingNote}
                         className="w-full py-5 bg-accent text-white text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-accent/20 hover:scale-[1.02] transition-all"
                       >
                          {isSavingNote ? "Archiving..." : "Save Insights"}
                       </button>
                       {noteMessage && (
                          <div className="mt-6 p-4 bg-success/10 border border-success/10 rounded-2xl text-center">
                             <p className="text-[10px] font-black text-success uppercase tracking-widest">{noteMessage}</p>
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col h-full animate-in fade-in duration-700">
                       <div className="flex-1 overflow-y-auto pr-2 no-scrollbar mb-6 space-y-6" ref={chatScrollRef}>
                          <div className="bg-accent/5 p-6 rounded-[32px] border border-accent/10 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                             <p className="text-[11px] font-medium text-secondary leading-relaxed relative z-10">
                                I am your context-aware neural assistant. How can I assist you with <strong>{lecture.title}</strong> today?
                             </p>
                          </div>

                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] p-5 rounded-[24px] text-[11px] leading-relaxed ${msg.role === 'user' ? 'bg-accent text-white font-bold shadow-lg shadow-accent/10 rounded-br-none' : 'bg-surface-soft text-secondary font-medium border border-border/50 rounded-bl-none'}`}>
                                  {msg.content}
                               </div>
                            </div>
                          ))}
                          
                          {isChatLoading && (
                            <div className="flex justify-start">
                               <div className="bg-surface-soft p-5 rounded-[24px] rounded-bl-none border border-border/50">
                                  <div className="flex gap-1">
                                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                                  </div>
                               </div>
                            </div>
                          )}
                       </div>

                       {chatMessages.length === 0 && (
                         <div className="space-y-3">
                            <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-2 pl-2">Analytical Queries</p>
                            <div className="grid gap-2">
                               <button onClick={() => handleSendChatQuery("Can you provide a comprehensive summary of this lecture's core themes?")} className="w-full text-left px-4 py-3 text-[10px] font-bold text-accent bg-accent/5 rounded-xl hover:bg-accent hover:text-white transition-all border border-accent/10 shadow-sm">
                                  📝 Summarize Lecture
                               </button>
                               <button onClick={() => handleSendChatQuery("Can you identify and explain the most complex technical topics discussed in this unit?")} className="w-full text-left px-4 py-3 text-[10px] font-bold text-accent bg-accent/5 rounded-xl hover:bg-accent hover:text-white transition-all border border-accent/10 shadow-sm">
                                  🧠 Explain Complex Topics
                               </button>
                            </div>
                         </div>
                       )}
 
                       <div className="pt-6 border-t border-border/50 mt-6">
                          <div className="relative">
                             <input 
                              type="text" 
                              className="w-full pl-6 pr-12 py-4 bg-surface-soft rounded-2xl text-xs font-medium border-none focus:ring-2 focus:ring-accent/20 transition-all focus:bg-surface border border-transparent focus:border-accent/10" 
                              placeholder="Type your query..." 
                              value={chatQuery}
                              onChange={(e) => setChatQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendChatQuery()}
                             />
                             <button 
                              onClick={() => handleSendChatQuery()}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-accent font-black hover:scale-125 transition-transform"
                             >
                                ↵
                             </button>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </aside>
        )}
 
      </div>
    </AppShell>
  );
};
 
export default LectureViewer;
