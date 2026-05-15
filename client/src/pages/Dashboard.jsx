import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../app/useAuth";
import AppShell from "../layouts/AppShell";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const handleRecommendationClick = (item) => {
    if (item.type === "lecture") return navigate(`/lecture/${item.targetId}`);
    if (item.type === "revision") return navigate(`/quiz/${item.targetId}`);
    navigate(`/course/${item.targetId}`);
  };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [ovRes, recRes, attRes, achRes, noteRes] = await Promise.all([
          API.get("/progress/me/overview"),
          API.get("/recommendations/me"),
          API.get("/quiz-attempts/my-results"),
          API.get("/achievements/me"),
          API.get("/notes/me"),
        ]);
        setOverview(ovRes.data);
        setRecommendations(Array.isArray(recRes.data) ? recRes.data : []);
        setAttempts(Array.isArray(attRes.data) ? attRes.data : []);
        setAchievements(Array.isArray(achRes.data) ? achRes.data : []);
        setNotes(Array.isArray(noteRes.data) ? noteRes.data : []);
      } catch (err) {
        setError(err.response?.data?.message || t("dashboard.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [t]);

  if (loading) return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
        <div className="h-12 bg-surface-muted rounded-2xl w-1/4 mb-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="h-56 bg-surface rounded-[48px]"></div>
           <div className="h-56 bg-surface rounded-[48px]"></div>
           <div className="h-56 bg-surface rounded-[48px]"></div>
        </div>
      </div>
    </AppShell>
  );

  const displayName = (user?.name && !user.name.includes('@')) 
    ? user.name.split(' ')[0] 
    : (user?.name || user?.email || '').split('@')[0];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Welcome Header */}
        <header className="mb-16">
           <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black rounded-full uppercase tracking-[0.2em] mb-4 inline-block shadow-sm">
             {t("dashboard.studentPortal")}
           </span>
           <h1 className="text-4xl lg:text-6xl font-black text-primary mb-6 tracking-tight leading-tight">
              {t("dashboard.welcome", { name: displayName })}
           </h1>
           <p className="text-lg lg:text-xl text-secondary font-medium max-w-2xl">
             {t("dashboard.subtitle")}
           </p>
        </header>

        {error && (
          <div className="p-8 bg-error/5 border border-error/10 rounded-[32px] text-error text-[10px] font-black uppercase tracking-[0.2em] text-center mb-12 animate-in fade-in zoom-in duration-500">
             {error}
          </div>
        )}

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           <article className="bg-surface p-10 rounded-[48px] border border-border shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700" />
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-6">{t("dashboard.progressTitle")}</p>
              <div className="flex items-baseline gap-3 mb-8">
                 <span className="text-5xl font-black text-primary tracking-tighter">{overview?.stats?.enrolledCourses ?? 0}</span>
                 <span className="text-xs font-black text-secondary uppercase tracking-widest">{t("dashboard.coursesEnrolled")}</span>
              </div>
              <div className="pt-8 border-t border-border/50 flex justify-between items-center">
                 <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{t("dashboard.completedLectures")}</span>
                 <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-black rounded-lg">{overview?.stats?.completedLectures ?? 0}</span>
              </div>
           </article>

           <article className="bg-surface p-10 rounded-[48px] border border-border shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700" />
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-6">{t("dashboard.dailyStreak")}</p>
              <div className="flex items-baseline gap-3 mb-8">
                 <span className="text-5xl font-black text-warning tracking-tighter">{user?.streakCount ?? 0}</span>
                 <span className="text-xs font-black text-secondary uppercase tracking-widest">{t("dashboard.daysFire")}</span>
              </div>
              <div className="pt-8 border-t border-border/50 flex justify-between items-center">
                 <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{t("dashboard.lastActive")}</span>
                 <span className="px-3 py-1 bg-warning/10 text-warning text-xs font-black rounded-lg">{user?.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : t("dashboard.today")}</span>
              </div>
           </article>

           <article className="bg-accent p-10 rounded-[48px] shadow-2xl shadow-accent/20 text-white relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
              <p className="text-[10px] font-black text-accent-soft uppercase tracking-[0.2em] mb-6">{t("dashboard.nextMilestone")}</p>
              <h3 className="text-2xl font-black mb-3 leading-tight tracking-tight line-clamp-1">{recommendations[0]?.title || t("dashboard.keepLearning")}</h3>
              <p className="text-sm font-bold text-white/70 mb-10 line-clamp-2">{recommendations[0]?.reason || t("dashboard.browseNewCourses")}</p>
              <button 
                onClick={() => recommendations[0] ? handleRecommendationClick(recommendations[0]) : navigate('/courses')}
                className="w-full py-5 bg-white text-accent text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-surface transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-black/10"
              >
                {t("dashboard.continuePath")}
              </button>
           </article>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           
           {/* Left/Main Column: Active Enrollments */}
           <div className="lg:col-span-2 space-y-12">
              <section>
                 <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black text-primary tracking-tight">{t("dashboard.activeEnrollments")}</h2>
                    <div className="hidden sm:block h-px flex-1 bg-border/50 mx-8" />
                    <button onClick={() => navigate('/courses')} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Explore More</button>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-6">
                    {overview?.enrollments?.map((e) => (
                      <article 
                        key={e._id} 
                        onClick={() => navigate(`/course/${e.courseId?._id}`)} 
                        className="group bg-surface p-6 lg:p-8 rounded-[32px] border border-border shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-6 hover:border-accent/20"
                      >
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-accent/5 rounded-[24px] flex items-center justify-center relative group-hover:scale-110 transition-transform">
                               <svg className="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <path d="M12 6v6l4 2"></path>
                               </svg>
                               <div className="absolute inset-0 rounded-[24px] border-2 border-accent/20" />
                            </div>
                            <div>
                               <h3 className="text-lg font-black text-primary group-hover:text-accent transition-colors mb-1">{e.courseId?.title}</h3>
                               <div className="flex items-center gap-4">
                                  <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{e.progressPercent}% Complete</span>
                                  <div className="w-32 h-1.5 bg-surface-soft rounded-full overflow-hidden">
                                     <div className="h-full bg-accent group-hover:bg-accent-soft transition-all" style={{ width: `${e.progressPercent}%` }} />
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest group-hover:text-accent transition-colors">{t("dashboard.openArrow") || "Resume"}</span>
                            <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center text-secondary group-hover:bg-accent group-hover:text-white transition-all">
                               →
                            </div>
                         </div>
                      </article>
                    ))}
                    {!overview?.enrollments?.length && (
                      <div className="py-20 text-center bg-surface-soft/30 rounded-[40px] border border-dashed border-border">
                        <p className="text-secondary font-black uppercase tracking-[0.2em] text-xs">{t("dashboard.noActiveEnrollments")}</p>
                      </div>
                    )}
                 </div>
              </section>

              {/* Assessment Progress */}
              {attempts.length > 0 && (
                <section>
                   <div className="flex items-center justify-between mb-10">
                      <h2 className="text-2xl font-black text-primary tracking-tight">{t("dashboard.recentAssessments")}</h2>
                      <div className="hidden sm:block h-px flex-1 bg-border/50 mx-8" />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {attempts.slice(0, 4).map((a) => (
                        <article 
                          key={a._id} 
                          onClick={() => navigate(`/quiz-result/${a._id}`)} 
                          className="bg-surface p-8 rounded-[32px] border border-border shadow-sm hover:border-accent/30 transition-all cursor-pointer group"
                        >
                           <div className="flex justify-between items-start mb-8">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${a.passed ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                 {a.passed ? 'Success' : 'Revision Needed'}
                              </span>
                              <div className="text-right">
                                 <span className="text-2xl font-black text-primary">{a.score}%</span>
                                 <p className="text-[9px] font-black text-secondary uppercase tracking-tighter">Score</p>
                              </div>
                           </div>
                           <h3 className="text-sm font-black text-secondary group-hover:text-primary transition-colors line-clamp-1">{a.quizId?.title}</h3>
                           <p className="text-[9px] font-black text-accent uppercase tracking-widest mt-2">View Analysis →</p>
                        </article>
                      ))}
                   </div>
                </section>
              )}
           </div>

           {/* Right/Sidebar Column: Achievements & Notes */}
           <div className="space-y-12">
              
              {/* Achievements Section */}
              <section className="bg-surface p-10 rounded-[48px] border border-border shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
                 <h2 className="text-2xl font-black text-primary mb-10 flex items-center gap-4 tracking-tight">
                    <span className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center text-xl">🏆</span> {t("dashboard.achievementsTitle")}
                 </h2>
                 <div className="space-y-6">
                    {achievements.slice(0, 3).map((ach) => (
                      <div key={ach._id} className="p-5 rounded-[24px] bg-surface-soft/50 border border-border group hover:bg-surface transition-all">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">{ach.type}</span>
                            <span className="text-[9px] text-secondary font-bold">{new Date(ach.awardedAt).toLocaleDateString()}</span>
                         </div>
                         <h4 className="text-sm font-black text-primary">{ach.title}</h4>
                      </div>
                    ))}
                    {!achievements.length && (
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest italic opacity-50 py-4">{t("dashboard.noAchievements")}</p>
                    )}
                 </div>
              </section>

              {/* Quick Notes Section */}
              <section className="bg-surface p-10 rounded-[48px] border border-border shadow-sm relative overflow-hidden">
                 <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 translate-x-1/2 blur-xl" />
                 <h2 className="text-2xl font-black text-primary mb-10 flex items-center gap-4 tracking-tight">
                    <span className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-xl">📝</span> {t("dashboard.recentNotes")}
                 </h2>
                 <div className="space-y-6">
                    {notes.slice(0, 3).map((note) => (
                      <div 
                        key={note._id} 
                        onClick={() => navigate(`/lecture/${note.lectureId?._id}`)} 
                        className="p-5 rounded-[24px] bg-surface-soft/50 border border-border cursor-pointer hover:bg-surface hover:border-accent/20 transition-all group"
                      >
                         <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-3 line-clamp-1 group-hover:text-primary transition-colors">{note.lectureId?.title}</h4>
                         <p className="text-xs font-medium text-secondary line-clamp-3 leading-relaxed italic">"{note.content}"</p>
                      </div>
                    ))}
                    {!notes.length && (
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest italic opacity-50 py-4">{t("dashboard.noNotes")}</p>
                    )}
                 </div>
              </section>

           </div>

        </div>

      </div>
    </AppShell>
  );
};

export default Dashboard;
