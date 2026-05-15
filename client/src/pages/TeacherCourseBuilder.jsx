import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import SidebarLayout from "../layouts/SidebarLayout";

const InlineLectureForm = ({ onCancel, onSubmit, lectureForm, setLectureForm, uploadAsset, uploadStatus, setUploadStatus, uploadProgress, setUploadProgress, isSubmitting, editingLectureId }) => (
  <div className="bg-surface p-8 rounded-[2.5rem] border-2 border-blue-600 shadow-xl shadow-blue-600/10 space-y-8">
    <header className="flex justify-between items-start">
      <div>
        <h3 className="text-xl font-black text-primary">{editingLectureId ? "Update Lecture" : "New Lecture Draft"}</h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure your learning material inline</p>
      </div>
      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">{'\u270D\uFE0F'}</div>
    </header>
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
          <input className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none text-primary font-bold focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter lecture title..." value={lectureForm.title} onChange={e => setLectureForm(prev => ({...prev, title: e.target.value}))} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Order</label>
          <input type="number" className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none text-primary font-bold" value={lectureForm.order} onChange={e => setLectureForm(prev => ({...prev, order: e.target.value}))} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes &amp; Context</label>
        <textarea rows={3} className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none text-primary font-bold resize-none" placeholder="Add important context for this lecture..." value={lectureForm.textContent} onChange={e => setLectureForm(prev => ({...prev, textContent: e.target.value}))} />
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media Asset</label>
          {lectureForm.mediaType !== 'none' && <button type="button" onClick={() => { setLectureForm(prev => ({...prev, mediaType: 'none', videoUrl: '', imageUrl: '', resourceUrl: '', resourceTitle: '', resourceType: 'file', videoJobId: '', videoDuration: 0, resourceExtractedText: '', transcriptText: ''})); setUploadStatus(null); setUploadProgress(0); }} className="text-[9px] font-black text-red-500 uppercase">Clear Asset</button>}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[{id:'video',label:'Video',icon:'\uD83C\uDFAC'},{id:'image',label:'Image',icon:'\uD83D\uDDBC\uFE0F'},{id:'document',label:'PDF',icon:'\uD83D\uDCC4'},{id:'presentation',label:'PPT/Slides',icon:'\uD83D\uDCCA'}].map(type => (
            <label key={type.id} className={`cursor-pointer flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${lectureForm.mediaType === type.id ? 'border-blue-600 bg-blue-50/50 shadow-inner' : 'border-border bg-surface-soft hover:border-blue-200'}`}>
              <input type="radio" name="media" className="hidden" checked={lectureForm.mediaType === type.id} onChange={() => setLectureForm(prev => ({...prev, mediaType: type.id}))} />
              <span className="text-2xl mb-2">{type.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">{type.label}</span>
            </label>
          ))}
        </div>
        {lectureForm.mediaType !== 'none' && (
          <div onClick={() => document.getElementById('inline-asset-upload').click()} className="p-6 border-2 border-dashed border-border rounded-3xl bg-surface-soft/30 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-blue-400 transition-all">
            <input type="file" id="inline-asset-upload" className="hidden" accept={lectureForm.mediaType === 'image' ? "image/*" : lectureForm.mediaType === 'document' ? ".pdf,application/pdf" : lectureForm.mediaType === 'presentation' ? ".ppt,.pptx" : "video/*"} onChange={e => { if (e.target.files[0]) uploadAsset(e.target.files[0], lectureForm.mediaType); }} />
            {uploadStatus ? (
              <div className="w-full max-w-sm space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${uploadStatus === 'Ready!' ? 'text-green-500' : 'text-blue-500 animate-pulse'}`}>{uploadStatus === 'Ready!' ? 'Ready to Save!' : uploadStatus}</span>
                  <span className="text-3xl font-black text-primary">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm mb-1">{'\uD83D\uDCC1'}</div>
                <div>
                  <p className="text-xs font-bold text-primary">Select your {lectureForm.mediaType} asset</p>
                  <p className="text-[9px] text-secondary mt-1 uppercase font-bold">Max file size: 500MB</p>
                </div>
              </>
            )}
            {uploadStatus === 'Ready!' && <div className="mt-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg">{'\u2713'} Verification Complete</div>}
          </div>
        )}
      </div>
      <div className="flex gap-4 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-gray-100 rounded-2xl transition-all">Discard Draft</button>
        <button type="submit" disabled={isSubmitting || (lectureForm.mediaType !== 'none' && uploadStatus !== 'Ready!')} className={`flex-2 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all ${((uploadStatus === 'Ready!' || lectureForm.mediaType === 'none') && !isSubmitting) ? "opacity-100 scale-100" : "opacity-50 scale-95"}`}>
          {isSubmitting ? "Saving..." : editingLectureId ? "Update Lecture" : "Save as Draft"}
        </button>
      </div>
    </form>
  </div>
);

const TeacherCourseBuilder = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("curriculum"); // curriculum, live, settings
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lecturesByModule, setLecturesByModule] = useState({});
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", order: 1 });
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [inlineLectureFormModuleId, setInlineLectureFormModuleId] = useState(null);
  const [editingLectureId, setEditingLectureId] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({ title: "", scheduledAt: "", duration: 60 });
  
  const emptyLectureForm = {
    title: "",
    order: 1,
    mediaType: "none", 
    textContent: "",
    imageUrl: "",
    videoUrl: "",
    videoOptimizedUrl: "",
    videoThumbnailUrl: "",
    videoAudioOnlyUrl: "",
    videoDuration: 0,
    transcriptText: "",
    resourceTitle: "",
    resourceUrl: "",
    resourceType: "",
    resourceExtractedText: "",
    videoJobId: ""
  };

  const [lectureForm, setLectureForm] = useState(emptyLectureForm);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const formEndRef = useRef(null);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [pollIntervalId, setPollIntervalId] = useState(null);

  const fetchCourseData = useCallback(async () => {
    try {
      const res = await API.get(`/courses/${courseId}`);
      setCourse(res.data);
      setCourseThumbnail(res.data.thumbnail || "");
      const modRes = await API.get(`/modules/${courseId}`);
      const sortedModules = modRes.data.sort((a, b) => a.order - b.order);
      setModules(sortedModules);
      
      if (sortedModules.length > 0 && !activeModuleId) {
        setActiveModuleId(sortedModules[0]._id);
      }
      
      // Optimize lecture fetching with Promise.all
      const lecturePromises = sortedModules.map(m => API.get(`/lectures/${m._id}`));
      const lectureResponses = await Promise.all(lecturePromises);
      
      const lectureMap = {};
      sortedModules.forEach((m, index) => {
        const lectures = Array.isArray(lectureResponses[index].data) ? lectureResponses[index].data : [];
        lectureMap[m._id] = lectures.sort((a, b) => a.order - b.order);
      });
      
      setLecturesByModule(lectureMap);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load course data");
    } finally {
      setLoading(false);
    }
  }, [courseId, activeModuleId]);

  useEffect(() => { fetchCourseData(); }, []);

  // Poll for background job updates (transcription, AI, etc.)
  useEffect(() => {
    let interval;
    // Only poll if at least one lecture is ACTIVELY processing
    const hasActiveJobs = lecturesByModule[activeModuleId]?.some(l => 
      (l.videoJobId && l.transcript?.status !== 'ready' && l.transcript?.status !== 'failed') || 
      (l.aiSummary?.status === 'processing' || l.aiSummary?.status === 'idle') || 
      (l.aiQuestionBank?.status === 'processing' || l.aiQuestionBank?.status === 'idle')
    );
    
    // We should only poll if there's actually something that COULD be processing.
    const actuallyNeedsPolling = lecturesByModule[activeModuleId]?.some(l => 
       (l.videoJobId && l.transcript?.status !== 'ready' && l.transcript?.status !== 'failed') ||
       (l.transcript?.status === 'ready' && (l.aiSummary?.status === 'processing' || l.aiSummary?.status === 'idle')) ||
       (l.transcript?.status === 'ready' && (l.aiQuestionBank?.status === 'processing' || l.aiQuestionBank?.status === 'idle'))
    );

    if (actuallyNeedsPolling) {
      console.log("[Polling] Active background jobs found. Polling for updates...");
      interval = setInterval(() => {
        fetchCourseData(true);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [lecturesByModule, activeModuleId, fetchCourseData]);

  useEffect(() => {
    if (inlineLectureFormModuleId && !editingLectureId && formEndRef.current) {
       formEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [inlineLectureFormModuleId, editingLectureId]);


  const pollUploadJob = (jobId) => {
    if (pollIntervalId) clearInterval(pollIntervalId);
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/uploads/status/${jobId}`);
        const job = res.data;
        
        if (job.status === "completed" || job.status === "ready" || job.status === "processing") {
          // If it's just started processing, we have enough to save a draft
          const isProcessing = job.status === "processing";
          
          clearInterval(interval);
          setPollIntervalId(null);
          
          let updatedForm = { ...lectureForm, videoJobId: jobId };
          
          // Use job.result for completed, or job fields directly for processing
          const source = isProcessing ? job : job.result;
          const url = source.url || source.originalUrl;

          if (url && (['pdf', 'pptx', 'ppt', 'docx', 'doc', 'text', 'file'].includes(source.type || job.mimeType?.split('/')[1]))) {
             updatedForm = {
                ...updatedForm,
                resourceUrl: url,
                resourceTitle: source.originalFilename,
                resourceType: source.type || job.mimeType?.split('/')[1],
                resourceExtractedText: source.extractedText || "",
                transcriptText: (source.transcript?.text || source.extractedText || "")
             };
          } else {
             updatedForm = {
                ...updatedForm,
                videoUrl: url,
                videoOptimizedUrl: source.optimizedUrl || "",
                videoThumbnailUrl: source.thumbnailUrl || "",
                videoAudioOnlyUrl: source.audioOnlyUrl || "",
                videoDuration: source.duration || 0,
                transcriptText: source.transcript?.text || ""
             };
          }
          setLectureForm(updatedForm);
          setUploadProgress(100);
          setUploadStatus("Ready!");

        } else if (job.status === "failed") {
          clearInterval(interval);
          setPollIntervalId(null);
          setUploadStatus("Failed: " + (job.error || "Unknown error"));
        } else if (job.status === "processing") {
           const backgroundProgress = 50 + Math.floor((job.progress || 0) * 0.45);
           setUploadProgress(backgroundProgress);
           setUploadStatus(job.message || "Processing...");
        }
      } catch (err) {
        if (err.response?.status === 404) {
          clearInterval(interval);
          setPollIntervalId(null);
          setUploadStatus("Upload complete");
        } else {
          clearInterval(interval);
          setPollIntervalId(null);
          setUploadStatus("Error polling status");
        }
      }
    }, 3000);
    setPollIntervalId(interval);
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (moduleForm._id) await API.put(`/modules/${moduleForm._id}`, moduleForm);
      else await API.post("/modules", { ...moduleForm, courseId });
      setShowModuleModal(false);
      fetchCourseData(true);
    } catch (err) {
      setError("Failed to save module");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await API.post(`/courses/${courseId}/schedule-live`, scheduleForm);
      setScheduleForm({ title: "", scheduledAt: "", duration: 60 });
      fetchCourseData(true);
      setStatusMessage("Live session scheduled!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      setError("Failed to schedule live session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadAsset = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploadStatus("Initialising...");
    setUploadProgress(0);
    
    try {
      const endpoint = (type === "document" || type === "presentation") ? "/uploads/resource" : type === "image" ? "/uploads/image" : "/uploads/video";
      const res = await API.post(endpoint, formData, {
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 50) / p.total))
      });
      
      const { data } = res;
      if ((type === 'video' || type === 'document' || type === 'presentation') && data.jobId) {
        setLectureForm(prev => ({ ...prev, mediaType: type, videoJobId: data.jobId }));
        setUploadStatus("Upload Complete - Verifying...");
        pollUploadJob(data.jobId);
        return data.jobId;
      } else {
        setLectureForm(prev => ({
          ...prev,
          mediaType: type,
          imageUrl: type === 'image' ? data.url : prev.imageUrl,
        }));
        setUploadStatus("Ready!");
        setUploadProgress(100);
        return null;
      }
    } catch (err) {
      setError("Upload failed");
      setUploadStatus("Error");
      return null;
    }
  };

  const uploadCourseThumbnail = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    setThumbnailUploading(true);
    
    try {
      const res = await API.post("/uploads/image", formData);
      setCourseThumbnail(res.data.url);
      setStatusMessage("Thumbnail uploaded! Click Save Changes to finish.");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      setError("Thumbnail upload failed");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      description: form.description.value,
      category: form.category.value,
      thumbnail: courseThumbnail
    };

    setIsSubmitting(true);
    try {
      await API.put(`/courses/${courseId}`, data);
      setCourse(prev => ({ ...prev, ...data }));
      setStatusMessage("Course updated successfully!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      setError("Failed to update course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveLecture = async (customForm = null) => {
    const formToSave = customForm || lectureForm;
    const targetModuleId = inlineLectureFormModuleId || activeModuleId;
    
    if (!targetModuleId) {
      setError("No module selected to save lecture");
      return null;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const data = {
        title: formToSave.title || "Untitled Lecture",
        order: formToSave.order,
        moduleId: targetModuleId,
        contents: formToSave.textContent?.trim() ? [
           { type: 'text', data: formToSave.textContent, order: 0 }
        ] : [],
        resources: (formToSave.mediaType === 'document' || formToSave.mediaType === 'presentation') ? [
          { title: formToSave.resourceTitle || 'Resource', url: formToSave.resourceUrl, type: formToSave.resourceType || 'file', originalFilename: formToSave.resourceTitle, extractedText: formToSave.resourceExtractedText }
        ] : [],
        videoJobId: formToSave.videoJobId,
      };

      if (formToSave.mediaType === 'video' && formToSave.videoUrl) {
         data.contents.push({
            type: 'video',
            url: formToSave.videoUrl,
            optimizedUrl: formToSave.videoOptimizedUrl,
            thumbnailUrl: formToSave.videoThumbnailUrl,
            audioOnlyUrl: formToSave.videoAudioOnlyUrl,
            duration: formToSave.videoDuration,
            order: 1
         });
      }

      if (formToSave.mediaType === 'image' && formToSave.imageUrl) {
         data.contents.push({
            type: 'image',
            url: formToSave.imageUrl,
            order: 1
         });
      }

      let res;
      if (editingLectureId) {
        res = await API.put(`/lectures/${editingLectureId}`, data);
        setStatusMessage("Lecture updated successfully!");
      } else {
        res = await API.post('/lectures', data);
        setStatusMessage("Draft saved successfully!");
      }
      
      const savedLecture = res.data;
      
      // Optimistically update the UI
      setLecturesByModule(prev => {
        const currentLectures = prev[targetModuleId] || [];
        // Remove it if we were editing
        const filtered = editingLectureId ? currentLectures.filter(l => l._id !== editingLectureId) : currentLectures;
        const updated = [...filtered, savedLecture].sort((a, b) => a.order - b.order);
        return { ...prev, [targetModuleId]: updated };
      });

      setInlineLectureFormModuleId(null);
      setEditingLectureId(null);
      setLectureForm({ title: "", order: 1, textContent: "", mediaType: 'none', videoUrl: '', imageUrl: '', resourceUrl: '', resourceTitle: '', resourceType: 'file', videoJobId: '', videoDuration: 0, resourceExtractedText: '', transcriptText: '' });
      setUploadStatus(null);
      setUploadProgress(0);
      
      setTimeout(() => setStatusMessage(""), 3000);
      
      // Still fetch in background to ensure consistency
      fetchCourseData();
      return savedLecture;
    } catch (err) {
      console.error("Lecture save error:", err);
      setError(err.response?.data?.message || "Failed to save lecture");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLectureSubmit = async (e) => {
    e.preventDefault();
    await saveLecture();
  };

  const handleTogglePublish = async (lectureId) => {
     try {
        await API.patch(`/lectures/${lectureId}/publish`);
        fetchCourseData(true);
     } catch (err) {
        alert(err.response?.data?.message || "Failed to publish lecture");
     }
  };

  if (loading) return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Constructing Builder...</p>
      </div>
    </SidebarLayout>
  );

  return (
    <SidebarLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
        
        {/* LEFT SIDEBAR: COURSE CONTEXT */}
        <aside className="w-80 border-r border-border bg-surface flex flex-col">
          <div className="p-8 border-b border-border">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black rounded uppercase tracking-[0.2em] mb-3 inline-block">Course Architect</span>
            <h1 className="text-xl font-black text-primary truncate" title={course?.title}>{course?.title}</h1>
            <div className="flex gap-2 mt-4">
               <button onClick={() => navigate('/teacher/courses')} className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-colors">← Dashboard</button>
            </div>
          </div>

          <div className="p-4 space-y-1">
             {[
                { id: 'curriculum', label: 'Curriculum', icon: '📚' },
                { id: 'live', label: 'Live Sessions', icon: '📹' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
             ].map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-secondary hover:bg-surface-soft'}`}
                >
                   <span className="text-lg">{tab.icon}</span>
                   {tab.label}
                </button>
             ))}
          </div>
        </aside>

        {/* MAIN BUILDER AREA */}
        <main className="flex-1 overflow-hidden bg-background relative">
          
          {/* Global Status/Error Overlay */}
          {(statusMessage || error) && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6">
               <div className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 ${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                  <div className="flex items-center gap-3">
                     <span className="text-lg">{error ? '⚠️' : '✅'}</span>
                     <p className="text-[10px] font-black uppercase tracking-widest">{error || statusMessage}</p>
                  </div>
                  <button onClick={() => { setError(""); setStatusMessage(""); }} className="text-gray-400 hover:text-gray-600">✕</button>
               </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
             <div className="flex h-full">
                {/* Curriculum Sub-sidebar (Modules) */}
                <div className="w-80 border-r border-border bg-surface flex flex-col">
                   <div className="p-6 border-b border-border flex justify-between items-center">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Chapters</span>
                      <button onClick={() => { setModuleForm({ title: "", order: modules.length + 1 }); setShowModuleModal(true); }} className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs shadow-lg shadow-blue-600/20 hover:scale-110 transition-all">+</button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {modules.map(m => (
                         <button 
                            key={m._id} 
                            onClick={() => setActiveModuleId(m._id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all border ${activeModuleId === m._id ? 'bg-surface-soft border-blue-600 shadow-sm' : 'border-transparent text-secondary hover:bg-surface-soft hover:text-primary'}`}
                         >
                            <span className={`text-[10px] font-black ${activeModuleId === m._id ? 'text-blue-600' : 'text-gray-400'}`}>{m.order}</span>
                            <span className="text-xs font-bold truncate">{m.title}</span>
                         </button>
                      ))}
                      {modules.length === 0 && <p className="text-[10px] text-gray-400 italic text-center py-10">No chapters yet</p>}
                   </div>
                </div>

                {/* Lecture List */}
                <div className="flex-1 flex flex-col px-8 pt-6 pb-2 bg-background overflow-hidden">
                   {activeModuleId ? (
                      <div className="flex flex-col h-full max-w-4xl mx-auto space-y-4">
                         <div className="flex justify-between items-center mb-2">
                            <div>
                               <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Curriculum Builder</h3>
                               <h2 className="text-2xl font-black text-primary mb-1">{modules.find(m => m._id === activeModuleId)?.title}</h2>
                               <button onClick={() => { setModuleForm(modules.find(m => m._id === activeModuleId)); setShowModuleModal(true); }} className="text-[10px] font-bold text-secondary hover:text-blue-600 transition-colors">Rename Chapter</button>
                            </div>
                            <button 
                                onClick={() => { 
                                  setLectureForm({ ...emptyLectureForm, order: (lecturesByModule[activeModuleId]?.length || 0) + 1 }); 
                                  setEditingLectureId(null); 
                                  setInlineLectureFormModuleId(activeModuleId); 
                                  setUploadStatus(null); 
                                  setUploadProgress(0); 
                                }}
                                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 transition-all"
                             >
                                + New Lecture Draft
                             </button>
                         </div>

                         <div className="flex-1 overflow-y-auto">
                            {lecturesByModule[activeModuleId]?.map(l => (
                               <div key={l._id}>
                                {editingLectureId === l._id ? (
                                   <div className="mb-4">
                                      <InlineLectureForm 
                                         moduleId={activeModuleId} 
                                         onCancel={() => { setEditingLectureId(null); setInlineLectureFormModuleId(null); }} 
                                         onSubmit={handleLectureSubmit}
                                         lectureForm={lectureForm}
                                         setLectureForm={setLectureForm}
                                         uploadAsset={uploadAsset}
                                         uploadStatus={uploadStatus}
                                         setUploadStatus={setUploadStatus}
                                         uploadProgress={uploadProgress}
                                         setUploadProgress={setUploadProgress}
                                         isSubmitting={isSubmitting}
                                         editingLectureId={editingLectureId}
                                      />
                                   </div>
                                ) : (
                                <div className={`bg-surface p-4 rounded-3xl border transition-all space-y-3 group ${l.isPublished ? 'border-border' : 'border-dashed border-blue-300 bg-blue-50/10'}`}>
                                   <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-surface-soft flex items-center justify-center text-xl group-hover:scale-105 transition-transform shrink-0">
                                       {l.contents?.find(c => c.type === 'video') ? '📽️' : '📄'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                          <h4 className="text-base font-bold text-primary truncate">{l.title}</h4>
                                          {!l.isPublished && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded tracking-widest">Draft</span>}
                                       </div>
                                       <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Lecture {l.order}</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                       <button 
                                          onClick={() => window.open('/lecture/' + l._id, '_blank')}
                                          className="p-3 bg-surface-soft text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                                          title="Preview Lecture"
                                       >👁️</button>
                                       <button 
                                          onClick={() => { 
                                              const v = l.contents.find(c => c.type === 'video');
                                              const r = l.resources?.[0];
                                              setEditingLectureId(l._id); 
                                              setInlineLectureFormModuleId(l.moduleId);
                                              setLectureForm({
                                                 title: l.title, 
                                                 order: l.order, 
                                                 textContent: l.contents.find(c => c.type === 'text')?.data || "",
                                                 mediaType: v ? 'video' : l.contents.find(c => c.type === 'image') ? 'image' : (r?.type === 'ppt' || r?.type === 'pptx') ? 'presentation' : l.resources?.length > 0 ? 'document' : 'none',
                                                 videoUrl: v?.url || "", 
                                                 videoOptimizedUrl: v?.optimizedUrl || "",
                                                 videoThumbnailUrl: v?.thumbnailUrl || "",
                                                 videoAudioOnlyUrl: v?.audioOnlyUrl || "",
                                                 videoDuration: v?.duration || 0,
                                                 transcriptText: l.transcript?.text || "", 
                                                 resourceTitle: r?.title || "", 
                                                 resourceUrl: r?.url || "", 
                                                 resourceType: r?.type || "",
                                                 resourceExtractedText: r?.extractedText || "",
                                                 videoJobId: l.videoJobId || ""
                                              }); setUploadStatus(null); setUploadProgress(0); 
                                           }}
                                          className="p-3 bg-surface-soft text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                       >✏️</button>
                                       <button 
                                          onClick={async () => { if(window.confirm('Delete lecture?')) { await API.delete(`/lectures/${l._id}`); fetchCourseData(); } }}
                                          className="p-3 bg-surface-soft text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                       >🗑️</button>
                                    </div>
                                   </div>
                                   {/* Processing Pipeline */}
                                   {(() => {
                                      const video = l.contents.find(c => c.type === 'video');
                                      const resource = l.resources?.[0];
                                      
                                      const steps = [
                                         { label: 'Compress', status: video ? (video.isOptimized || video.optimizedUrl ? 'ready' : 'idle') : (resource?.isOptimized ? 'ready' : 'skip') },
                                         { label: 'Audio', status: video ? (video.audioOnlyUrl ? 'ready' : 'idle') : 'skip' },
                                         { label: 'Transcript', status: (video || resource) ? ((l.transcript?.status === 'ready' || l.transcript?.text || l.resources?.[0]?.extractedText) ? 'ready' : (l.transcript?.status || 'idle')) : 'skip' },
                                         { label: 'AI Summary', status: l.aiSummary?.status || 'idle' },
                                         { label: 'AI Quiz', status: l.aiQuestionBank?.status || l.aiMcqs?.status || 'idle' },
                                      ].filter(s => s.status !== 'skip');
                                      if (steps.length === 0) return null;
                                      
                                      const isAllReady = steps.every(s => s.status === 'ready' || s.status === 'skip');

                                      return (
                                         <div className="flex flex-col gap-1.5 mt-3 bg-surface-soft/50 p-4 rounded-xl border border-border">
                                            <div className="flex justify-between items-center mb-2">
                                               <div className="text-[10px] font-black uppercase tracking-widest text-primary">Processing Pipeline</div>
                                               <button 
                                                  disabled={!isAllReady && !l.isPublished}
                                                  onClick={() => handleTogglePublish(l._id)}
                                                  className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                     l.isPublished 
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                                                        : isAllReady 
                                                           ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105' 
                                                           : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                  }`}
                                               >
                                                  {l.isPublished ? 'Unpublish' : isAllReady ? 'Publish Draft' : 'AI Processing...'}
                                               </button>
                                            </div>
                                            {steps.map((s, si) => (
                                               <div key={si} className="flex items-center gap-2">
                                                  <div className="w-24 text-[9px] font-black uppercase tracking-widest text-secondary">{s.label}</div>
                                                  <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden relative">
                                                     <div className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                                                        s.status === 'ready' ? 'w-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                        s.status === 'processing' ? 'w-1/2 bg-blue-500 animate-pulse' :
                                                        s.status === 'failed' ? 'w-full bg-red-500' :
                                                        'w-0 bg-transparent'
                                                     }`} />
                                                  </div>
                                                  <div className="w-16 text-right text-[8px] font-black uppercase tracking-widest">
                                                     {s.status === 'ready' ? <span className="text-emerald-500">Complete</span> :
                                                      s.status === 'processing' ? <span className="text-blue-500 animate-pulse">Working...</span> :
                                                      s.status === 'failed' ? <span className="text-red-500">Failed</span> :
                                                      <span className="text-gray-400">Waiting</span>}
                                                  </div>
                                               </div>
                                            ))}
                                         </div>
                                      );
                                   })()}
                                </div>
                                )}
                               </div>
                            ))}

                            {inlineLectureFormModuleId === activeModuleId && !editingLectureId && (
                                <div className="mb-8 pt-6 border-t-4 border-dashed border-border" ref={formEndRef}>
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 text-center">New Lecture Draft</h4>
                                    <InlineLectureForm 
                                       moduleId={activeModuleId} 
                                       onCancel={() => setInlineLectureFormModuleId(null)} 
                                       onSubmit={handleLectureSubmit}
                                       lectureForm={lectureForm}
                                       setLectureForm={setLectureForm}
                                       uploadAsset={uploadAsset}
                                       uploadStatus={uploadStatus}
                                       setUploadStatus={setUploadStatus}
                                       uploadProgress={uploadProgress}
                                       setUploadProgress={setUploadProgress}
                                       isSubmitting={isSubmitting}
                                       editingLectureId={editingLectureId}
                                    />
                                </div>
                            )}

                            {lecturesByModule[activeModuleId]?.length === 0 && !inlineLectureFormModuleId && (
                               <div className="py-24 text-center border-4 border-dashed border-border rounded-[3rem] text-secondary bg-surface-soft/20">
                                  <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 shadow-sm">📂</div>
                                  <p className="text-lg font-bold text-primary">Chapter is empty</p>
                                  <p className="text-xs uppercase font-black tracking-widest mt-2 text-secondary">Start building your knowledge base</p>
                               </div>
                            )}
                         </div>
                      </div>
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                         <div className="w-24 h-24 bg-surface-soft rounded-[2.5rem] shadow-inner flex items-center justify-center text-5xl">🏗️</div>
                         <div>
                            <h3 className="text-2xl font-black text-primary mb-2">Architect Your Curriculum</h3>
                            <p className="text-secondary text-sm max-w-xs mx-auto font-medium">Select a chapter from the left to manage lectures and learning materials.</p>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}

          {activeTab === 'live' && (
             <div className="p-16 max-w-5xl mx-auto space-y-12 overflow-y-auto h-full custom-scrollbar">
                <header className="flex justify-between items-end">
                   <div>
                      <h2 className="text-4xl font-black text-primary mb-2">Live Sessions</h2>
                      <p className="text-secondary">Plan and manage your upcoming interactive broadcasts.</p>
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      System Online
                   </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   <div className="lg:col-span-1 space-y-8">
                      <div className="bg-surface p-10 rounded-[3rem] border border-border shadow-sm">
                         <h3 className="text-lg font-black text-primary mb-6">New Schedule</h3>
                         <form onSubmit={handleScheduleSubmit} className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Topic</label>
                               <input className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none text-sm font-bold" placeholder="Q&A Session..." value={scheduleForm.title} onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</label>
                               <input type="datetime-local" className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none text-sm font-bold" value={scheduleForm.scheduledAt} onChange={e => setScheduleForm({...scheduleForm, scheduledAt: e.target.value})} />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20">{isSubmitting ? 'Creating...' : 'Launch Schedule'}</button>
                         </form>
                      </div>
                   </div>

                    <div className="lg:col-span-2 space-y-6">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Upcoming Sessions</h4>
                      <div className="grid grid-cols-1 gap-4">
                         {course?.scheduledSessions?.map((s, idx) => (
                            <div key={idx} className="bg-surface p-8 rounded-[2.5rem] border border-border shadow-sm flex items-center justify-between group">
                               <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex flex-col items-center justify-center text-emerald-600">
                                     <span className="text-xs font-black">{new Date(s.scheduledAt).getDate()}</span>
                                     <span className="text-[8px] font-black uppercase">{new Date(s.scheduledAt).toLocaleString('default', { month: 'short' })}</span>
                                  </div>
                                  <div>
                                     <h4 className="text-lg font-bold text-primary">{s.title}</h4>
                                     <p className="text-xs text-secondary mt-1">{new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Interactive Classroom</p>
                                  </div>
                               </div>
                               <button 
                                  onClick={async () => { if(window.confirm('Remove schedule?')) { const updated = course.scheduledSessions.filter((_, i) => i !== idx); await API.put(`/courses/${courseId}`, { scheduledSessions: updated }); fetchCourseData(); } }}
                                  className="p-4 bg-surface-soft text-gray-400 hover:text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"
                               >🗑️</button>
                            </div>
                         ))}
                         {course?.scheduledSessions?.length === 0 && (
                            <div className="py-20 text-center border-4 border-dashed border-border rounded-[3rem] text-gray-400">
                               <p className="text-sm font-medium">No live sessions scheduled yet.</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="p-16 max-w-4xl mx-auto space-y-12 overflow-y-auto h-full custom-scrollbar">
                <header>
                   <h2 className="text-4xl font-black text-primary mb-2">Course Core</h2>
                   <p className="text-secondary">Update your course identity and visibility settings.</p>
                </header>
                <form onSubmit={handleUpdateCourse} className="bg-surface p-12 rounded-[3rem] border border-border shadow-sm space-y-8">
                    {/* Thumbnail Section */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Cover Image</label>
                       <div className="flex items-start gap-8">
                          <div className="w-48 aspect-video rounded-2xl overflow-hidden bg-surface-soft border border-border flex items-center justify-center relative group">
                             {courseThumbnail ? (
                                <img src={courseThumbnail} alt="Preview" className="w-full h-full object-cover" />
                             ) : (
                                <span className="text-2xl">🖼️</span>
                             )}
                             {thumbnailUploading && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                   <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                             )}
                          </div>
                          <div className="flex-1 space-y-4">
                             <p className="text-xs text-secondary leading-relaxed">Choose a high-resolution image to represent your course. Recommended size: 1280x720px.</p>
                             <input 
                                type="file" 
                                id="thumbnail-upload" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => e.target.files[0] && uploadCourseThumbnail(e.target.files[0])} 
                             />
                             <button 
                                type="button"
                                onClick={() => document.getElementById('thumbnail-upload').click()}
                                className="px-6 py-3 bg-surface-soft border border-border text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-border transition-all"
                             >
                                {courseThumbnail ? "Change Image" : "Upload Image"}
                             </button>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Title</label>
                          <input name="title" className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none font-bold" defaultValue={course?.title} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                          <select name="category" className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none font-bold outline-none appearance-none">
                             <option value="General">General</option>
                             <option value="Development">Development</option>
                             <option value="Design">Design</option>
                             <option value="Business">Business</option>
                             <option value="Academics">Academics</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Short Description</label>
                       <textarea name="description" rows={4} className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none font-bold resize-none" defaultValue={course?.description} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="px-10 py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20">
                       {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                 </form>
             </div>
          )}

        </main>

        {/* MODAL: MODULE FORM */}
        {showModuleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModuleModal(false)} />
            <div className="relative bg-surface w-full max-md p-10 rounded-[3rem] border border-border shadow-2xl">
              <h3 className="text-2xl font-black text-primary mb-8">{moduleForm._id ? "Edit Chapter" : "New Chapter"}</h3>
              <form onSubmit={handleModuleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chapter Title</label>
                  <input className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none text-primary font-bold focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. Advanced Calculus" value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Order Index</label>
                  <input type="number" className="w-full px-6 py-4 rounded-2xl bg-surface-soft border-none text-primary font-bold" value={moduleForm.order} onChange={e => setModuleForm({...moduleForm, order: e.target.value})} />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModuleModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/20">{isSubmitting ? "Saving..." : "Save Chapter"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default TeacherCourseBuilder;
