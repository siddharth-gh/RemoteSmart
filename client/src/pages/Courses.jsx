import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import AppShell from "../layouts/AppShell";
import CourseCard from "../components/CourseCard";
import { isCourseDownloaded } from "../utils/offlinePack";

const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative flex-1 lg:min-w-[160px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-5 pr-10 py-2 rounded-[16px] bg-surface border-none text-primary font-black text-[9px] uppercase tracking-widest text-left hover:bg-surface-soft transition-all flex items-center justify-between relative z-50"
      >
        <span className="truncate">{selectedOption.label}</span>
        <span className="text-[7px] opacity-50 ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full left-0 w-full mt-1.5 bg-surface border border-border rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="max-h-60 overflow-y-auto no-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-5 py-3 text-left text-[8.5px] font-black uppercase tracking-widest transition-all ${
                    value === opt.value 
                      ? 'bg-accent text-white' 
                      : 'text-secondary hover:bg-surface-soft hover:text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
};

const Courses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await API.get("/courses", {
          params: {
            search: search || undefined,
            category: category !== "all" ? category : undefined,
            level: level !== "all" ? level : undefined,
          },
        });
        setCourses(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.message || t("courses.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [search, category, level, t]);

  const categoryOptions = [
    { value: "all", label: t("courses.allCategories") },
    { value: "Programming", label: t("categories.Programming.label") },
    { value: "Science", label: t("categories.Science.label") },
    { value: "Mathematics", label: t("categories.Mathematics.label") },
    { value: "Career", label: t("categories.Career.label") },
    { value: "General", label: t("categories.General.label") },
  ];

  const levelOptions = [
    { value: "all", label: t("courses.allLevels") },
    { value: "beginner", label: t("courses.levelBeginner") },
    { value: "intermediate", label: t("courses.levelIntermediate") },
    { value: "advanced", label: t("courses.levelAdvanced") },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        
        {/* Header Section */}
        <header className="mb-6">
           <div className="max-w-3xl">
              <h1 className="text-3xl lg:text-5xl font-black text-primary mb-4 leading-tight tracking-tight">
                {t("courses.title")}
              </h1>
              <p className="text-base lg:text-lg text-secondary font-medium leading-relaxed">
                {t("courses.subtitle")}
              </p>
           </div>
        </header>

        {/* Search and Filters */}
        <section className="mb-12 bg-surface border border-border p-2 rounded-[24px] shadow-sm relative z-20">
           <div className="flex flex-col lg:flex-row items-center gap-2">
              <div className="flex-1 w-full relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-accent transition-colors">🔍</span>
                <input
                  className="w-full pl-14 pr-6 py-2.5 rounded-[18px] bg-surface border-none text-primary placeholder-secondary font-bold focus:ring-0 transition-all text-sm"
                  placeholder={t("courses.search")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              
              <div className="h-10 w-px bg-border/50 hidden lg:block" />

              <div className="flex w-full lg:w-auto items-center gap-2">
                 <CustomSelect 
                   value={category} 
                   onChange={setCategory} 
                   options={categoryOptions} 
                 />
                 <CustomSelect 
                   value={level} 
                   onChange={setLevel} 
                   options={levelOptions} 
                 />
              </div>
           </div>
        </section>

        {error && (
          <div className="p-8 bg-error/5 border border-error/10 rounded-[32px] text-error text-[10px] font-black uppercase tracking-[0.2em] text-center mb-12 animate-in fade-in zoom-in duration-500">
             {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-80 bg-surface rounded-[3rem] border border-border animate-pulse shadow-sm"></div>
             ))}
          </div>
        ) : (
          <div className="relative">
            {courses.length === 0 ? (
               <div className="py-32 text-center bg-surface-soft/30 rounded-[48px] border border-dashed border-border">
                  <span className="text-6xl mb-8 block grayscale opacity-50">🏜️</span>
                  <p className="text-secondary font-black uppercase tracking-[0.2em] text-sm">{t("courses.noCoursesFound")}</p>
                  <button onClick={() => {setSearch(""); setCategory("all"); setLevel("all");}} className="mt-8 text-accent font-black text-[10px] uppercase tracking-widest hover:underline">Clear all filters</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map((course) => (
                    <CourseCard
                      key={course._id}
                      course={{ ...course, downloaded: isCourseDownloaded(course._id) }}
                      onClick={() => navigate(`/course/${course._id}`)}
                    />
                  ))}
               </div>
            )}
            
            {/* Decorative background element */}
            <div className="fixed top-[40%] -right-32 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="fixed bottom-[10%] -left-32 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Courses;
