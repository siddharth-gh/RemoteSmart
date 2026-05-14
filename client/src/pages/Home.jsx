import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../app/useAuth";
import AppShell from "../layouts/AppShell";
import CourseCard from "../components/CourseCard";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, getHomeRouteForRole } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [studentProgress, setStudentProgress] = useState(null);
  const [liveCourses, setLiveCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await API.get("/courses");
        const courses = Array.isArray(response.data) ? response.data : [];
        setAllCourses(courses);
        setLiveCourses(courses.filter(c => c.liveSession?.isActive).slice(0, 3));
        
        if (isAuthenticated && user?.role === 'student') {
          const progressRes = await API.get("/progress/me/overview");
          setStudentProgress(progressRes.data.enrollments[0] || null);
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [isAuthenticated, user]);

  const categories = ["All", ...new Set(allCourses.map(c => c.category || "General"))];
  const displayedCourses = selectedCategory === "All" 
    ? allCourses.slice(0, 4) 
    : allCourses.filter(c => (c.category || "General") === selectedCategory).slice(0, 4);

  return (
    <AppShell>
      <div className="bg-background min-h-screen font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
        
        {/* Navigation / Header - Integrated style */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:pt-12 lg:pb-20 text-center lg:text-left">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-10">
                 <div className="space-y-4">
                    <h2 className="text-blue-600 dark:text-blue-500 font-bold tracking-widest text-sm uppercase">{t("home.heroTagline")}</h2>
                    <h1 className="text-5xl lg:text-7xl font-bold text-primary leading-[1.1]">
                       {t("home.heroTitle")}
                    </h1>
                    <p className="text-lg lg:text-xl text-secondary max-w-2xl leading-relaxed">
                       {t("home.heroSubtitle")}
                    </p>
                 </div>

                 <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5">
                    <button 
                      onClick={() => navigate('/courses')}
                      className="px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-full hover:scale-105 transition-all shadow-2xl shadow-gray-900/20"
                    >
                       {t("home.exploreCourses")}
                    </button>
                    {isAuthenticated ? (
                      <button 
                        onClick={() => navigate(getHomeRouteForRole())}
                        className="px-10 py-5 bg-surface text-primary font-bold rounded-full border border-border hover:bg-surface-soft transition-all"
                      >
                         {t("home.goToDashboard")}
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate('/signup')}
                        className="px-10 py-5 bg-surface text-primary font-bold rounded-full border border-border hover:bg-surface-soft transition-all"
                      >
                         {t("home.joinAsTeacher")}
                      </button>
                    )}
                 </div>
              </div>

              <div className="lg:col-span-5 relative">
                 <div className="relative rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800">
                    <img 
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200" 
                      alt="Modern Learning" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                 </div>
                 
                 {/* Product Badge */}
                 <div className="absolute -bottom-6 -right-6 bg-surface p-6 rounded-3xl shadow-2xl border border-gray-50 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">A</div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("home.poweredBy")}</p>
                       <p className="text-sm font-bold text-primary">RemoteSmart AI</p>
                    </div>
                 </div>
              </div>

           </div>
        </div>
         {/* Student Personalized Section */}
         {isAuthenticated && user?.role === 'student' && (studentProgress || liveCourses.length > 0) && (
           <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-20 relative z-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 
                 {/* Continue Learning */}
                 {studentProgress && (
                   <div className="lg:col-span-8 bg-surface border border-border p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center gap-8 group hover:border-accent/30 transition-all duration-500">
                      <div className="w-full md:w-48 h-32 bg-accent-soft rounded-3xl overflow-hidden relative flex-shrink-0">
                         <div className="absolute inset-0 flex items-center justify-center text-accent text-3xl font-black opacity-20">
                            {studentProgress.courseId?.title?.charAt(0)}
                         </div>
                         <div className="absolute bottom-0 left-0 h-1 bg-accent" style={{ width: `${studentProgress.progressPercent}%` }} />
                      </div>
                      <div className="flex-1 space-y-4 text-center md:text-left">
                         <div>
                            <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-1 block">Continue from where u left off</span>
                            <h3 className="text-2xl font-black text-primary leading-tight line-clamp-1">{studentProgress.courseId?.title}</h3>
                         </div>
                         <div className="flex items-center justify-center md:justify-start gap-4">
                            <div className="flex-1 h-2 bg-surface-soft rounded-full overflow-hidden max-w-[200px]">
                               <div className="h-full bg-accent rounded-full" style={{ width: `${studentProgress.progressPercent}%` }} />
                            </div>
                            <span className="text-xs font-bold text-secondary">{studentProgress.progressPercent}% Complete</span>
                         </div>
                         <button 
                           onClick={() => navigate(`/course/${studentProgress.courseId?._id}`)}
                           className="px-8 py-3 bg-accent text-white text-xs font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
                         >
                            Resume Learning
                         </button>
                      </div>
                   </div>
                 )}

                 {/* Upcoming Live Box */}
                 <div className={`${studentProgress ? 'lg:col-span-4' : 'lg:col-span-12'} bg-surface-soft border border-border p-8 rounded-[3rem] shadow-xl flex flex-col justify-between overflow-hidden relative`}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-error/5 rounded-full blur-2xl" />
                    
                    <div className="relative z-10 space-y-6">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-primary tracking-tight">Live Sessions</h3>
                          <span className="flex h-2 w-2 rounded-full bg-error animate-ping"></span>
                       </div>

                       <div className="space-y-4">
                          {liveCourses.length > 0 ? (
                            liveCourses.map(live => (
                              <div key={live._id} className="p-4 bg-surface rounded-2xl border border-border/50 hover:border-error/30 transition-all cursor-pointer group" onClick={() => navigate(`/course/${live._id}/live`)}>
                                 <p className="text-xs font-bold text-primary line-clamp-1 group-hover:text-error transition-colors">{live.title}</p>
                                 <p className="text-[10px] font-medium text-secondary mt-1">
                                    Started {new Date(live.liveSession?.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center space-y-2">
                               <p className="text-sm font-bold text-secondary">No sessions active</p>
                               <p className="text-[10px] text-gray-400 uppercase tracking-widest">Check back soon</p>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="mt-8 relative z-10 pt-4 border-t border-border/50">
                       <button className="text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-2">
                          View Calendar <span>→</span>
                       </button>
                    </div>
                 </div>

              </div>
           </section>
         )}

        {/* Feature Bento Grid */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Feature 1: AI */}
              <div className="md:col-span-8 bg-surface p-10 lg:p-14 rounded-[3rem] border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-accent/10 transition-colors duration-700" />
                 
                 <div className="space-y-4 max-w-lg relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-soft text-accent text-xs font-bold rounded-full uppercase tracking-widest mb-2">
                       ✨ AI-Powered
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold text-primary leading-tight">Intelligence that <br/> understands you.</h3>
                    <p className="text-secondary leading-relaxed">Our proprietary models generate personalized summaries, adaptive quizzes, and searchable transcripts for every single lecture in real-time.</p>
                 </div>
                 
                 {/* Visual Element */}
                 <div className="mt-12 flex items-center gap-4 relative z-10 overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex-shrink-0 bg-background border border-border p-5 rounded-3xl shadow-lg w-48 hover:-translate-y-2 transition-transform duration-300">
                       <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center mb-4">📝</div>
                       <div className="h-2 w-3/4 bg-surface-muted rounded-full mb-2" />
                       <div className="h-2 w-1/2 bg-surface-muted rounded-full" />
                       <p className="mt-4 text-[10px] font-bold text-secondary uppercase">Smart Notes</p>
                    </div>
                    <div className="flex-shrink-0 bg-background border border-border p-5 rounded-3xl shadow-lg w-48 hover:-translate-y-2 transition-transform duration-300 delay-75">
                       <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl flex items-center justify-center mb-4">🎯</div>
                       <div className="flex gap-1 mb-2">
                          <div className="h-2 w-full bg-success rounded-full" />
                          <div className="h-2 w-full bg-surface-muted rounded-full" />
                          <div className="h-2 w-full bg-surface-muted rounded-full" />
                       </div>
                       <p className="mt-4 text-[10px] font-bold text-secondary uppercase">Adaptive Quiz</p>
                    </div>
                    <div className="flex-shrink-0 bg-background border border-border p-5 rounded-3xl shadow-lg w-48 hover:-translate-y-2 transition-transform duration-300 delay-150">
                       <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-4">🔎</div>
                       <div className="h-2 w-full bg-surface-muted rounded-full mb-2" />
                       <div className="h-2 w-2/3 bg-surface-muted rounded-full" />
                       <p className="mt-4 text-[10px] font-bold text-secondary uppercase">Deep Search</p>
                    </div>
                 </div>
              </div>

              {/* Feature 2: Offline */}
              <div className="md:col-span-4 bg-accent p-10 lg:p-14 rounded-[3rem] text-white flex flex-col justify-between overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                 
                 <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-xl border border-white/10">
                       ⚡
                    </div>
                    <h3 className="text-3xl font-bold leading-tight">Learn without<br/>limits.</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">Download full courses including HD videos, notes, and interactive quizzes directly to your device for true offline learning.</p>
                 </div>
                 
                 <div className="mt-12 relative z-10 flex items-center gap-3 bg-black/20 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-max">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-bold tracking-widest uppercase">Sync Complete</span>
                 </div>
              </div>

              {/* Feature 3: Live Classroom */}
              <div className="md:col-span-5 bg-background p-10 lg:p-14 rounded-[3rem] border border-border shadow-sm space-y-8 flex flex-col justify-between relative overflow-hidden group">
                 <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-error/5 rounded-full blur-[50px] pointer-events-none" />
                 <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                       <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center text-2xl mb-2">
                          🔴
                       </div>
                       <span className="px-3 py-1 bg-surface-muted text-secondary text-[10px] font-bold rounded-full uppercase tracking-widest">Low Latency</span>
                    </div>
                    <h3 className="text-2xl font-bold text-primary">Join RemoteSmart</h3>
                    <p className="text-secondary text-sm leading-relaxed">Join real-time interactive sessions optimized specifically for low-bandwidth rural connections.</p>
                 </div>
                 <div className="relative z-10">
                    <button className="flex items-center gap-2 text-accent text-sm font-bold hover:underline group-hover:gap-3 transition-all">
                       Explore Live Sessions <span aria-hidden="true">→</span>
                    </button>
                 </div>
              </div>

              {/* Feature 4: Certifications */}
              <div className="md:col-span-7 bg-surface p-10 lg:p-14 rounded-[3rem] border border-border shadow-sm flex flex-col sm:flex-row items-center gap-10 relative overflow-hidden group">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-success/5 rounded-full blur-[80px] pointer-events-none" />
                 
                 <div className="flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-success/20 blur-xl rounded-full" />
                    <div className="relative w-32 h-32 bg-background border border-border rounded-full flex items-center justify-center text-5xl shadow-2xl z-10 group-hover:scale-105 transition-transform duration-500">
                       🏆
                    </div>
                 </div>
                 
                 <div className="space-y-4 relative z-10 text-center sm:text-left">
                    <div className="inline-flex px-3 py-1 bg-success/10 text-success text-[10px] font-bold rounded-full uppercase tracking-widest">
                       Verified
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-primary">Earn Global<br/>Certifications</h3>
                    <p className="text-secondary text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">Complete comprehensive assessments to receive professional certificates recognized by top institutions worldwide.</p>
                 </div>
              </div>

           </div>
        </section>

        {/* Trending Section */}
        <section className="py-24 bg-white dark:bg-gray-950">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                 <div className="space-y-4">
                    <h2 className="text-3xl lg:text-5xl font-bold text-primary">Pick up where <br /> others started.</h2>
                    <p className="text-secondary max-w-sm">Join a community of learners mastering the skills of tomorrow, today.</p>
                 </div>
                 <Link to="/courses" className="px-8 py-3 bg-surface-soft text-secondary font-bold rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm shrink-0">
                    Browse All
                 </Link>
              </div>

              {/* Categories Filter */}
              <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 custom-scrollbar">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? "bg-accent text-white shadow-lg shadow-blue-500/30"
                        : "bg-surface-soft text-secondary hover:bg-surface-muted border border-border"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {loading ? (
                   [1,2,3,4].map(i => <div key={i} className="h-80 bg-surface-soft rounded-[2.5rem] animate-pulse" />)
                 ) : displayedCourses.length > 0 ? (
                   displayedCourses.map(course => (
                     <CourseCard key={course._id} course={course} />
                   ))
                 ) : (
                   <div className="col-span-full py-12 text-center text-secondary font-bold">
                     No courses found in this category.
                   </div>
                 )}
              </div>
           </div>
        </section>

        {/* Enhanced Modern Footer */}
        <footer className="border-t border-border bg-surface relative overflow-hidden">
           {/* Background Glow */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-32 bg-accent/10 blur-[100px] pointer-events-none"></div>

           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
                 
                 {/* Brand Column */}
                 <div className="lg:col-span-4 space-y-6">
                    <div className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
                       <span className="text-accent">Edu</span>Reach
                    </div>
                    <p className="text-secondary max-w-xs leading-relaxed">
                       Empowering learners globally through intelligent, accessible, and interactive AI-driven education.
                    </p>
                    <div className="flex gap-4 pt-2">
                       <a href="#" className="w-10 h-10 rounded-full bg-surface-soft border border-border flex items-center justify-center text-secondary hover:text-accent hover:border-accent hover:-translate-y-1 transition-all shadow-sm">
                          <span className="sr-only">Twitter</span>
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                       </a>
                       <a href="#" className="w-10 h-10 rounded-full bg-surface-soft border border-border flex items-center justify-center text-secondary hover:text-accent hover:border-accent hover:-translate-y-1 transition-all shadow-sm">
                          <span className="sr-only">GitHub</span>
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                       </a>
                    </div>
                 </div>

                 {/* Links Columns */}
                 <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="space-y-6">
                       <h4 className="text-sm font-bold tracking-widest uppercase text-primary">Platform</h4>
                       <ul className="space-y-4 text-sm font-medium text-secondary">
                          <li><Link to="/courses" className="hover:text-accent transition-colors">Browse Courses</Link></li>
                          <li><Link to="/offline" className="hover:text-accent transition-colors">Offline Library</Link></li>
                          <li>
                            {isAuthenticated ? (
                              <Link to={getHomeRouteForRole()} className="hover:text-accent transition-colors">My Dashboard</Link>
                            ) : (
                              <Link to="/signup" className="hover:text-accent transition-colors">Join as Instructor</Link>
                            )}
                          </li>
                       </ul>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-sm font-bold tracking-widest uppercase text-primary">Resources</h4>
                       <ul className="space-y-4 text-sm font-medium text-secondary">
                          <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
                          <li><a href="#" className="hover:text-accent transition-colors">Community</a></li>
                          <li><a href="#" className="hover:text-accent transition-colors">Student Guides</a></li>
                       </ul>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-6">
                       <h4 className="text-sm font-bold tracking-widest uppercase text-primary">Company</h4>
                       <ul className="space-y-4 text-sm font-medium text-secondary">
                          <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
                          <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
                          <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
                       </ul>
                    </div>
                 </div>

              </div>

              {/* Bottom Copyright */}
              <div className="mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                 <p className="text-xs text-secondary font-bold tracking-widest uppercase">
                    &copy; {new Date().getFullYear()} RemoteSmart Platform. All rights reserved.
                 </p>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    <span className="text-xs font-bold text-secondary tracking-widest uppercase">Systems Operational</span>
                 </div>
              </div>
           </div>
        </footer>

      </div>
    </AppShell>
  );
};

export default Home;
