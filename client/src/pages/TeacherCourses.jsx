import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../app/useAuth";
import SidebarLayout from "../layouts/SidebarLayout";

const emptyCourseForm = {
  title: "",
  description: "",
  category: "General",
  level: "beginner",
};

const TeacherCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await API.get("/courses/teacher/my-courses");
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    try {
      if (editingCourseId) {
        await API.put(`/courses/${editingCourseId}`, courseForm);
      } else {
        await API.post("/courses", courseForm);
      }
      setCourseForm(emptyCourseForm);
      setEditingCourseId(null);
      setShowModal(false);
      await fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save course");
    }
  };

  const startEdit = (course) => {
    setEditingCourseId(course._id);
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category || "General",
      level: course.level || "beginner",
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await API.delete(`/courses/${courseId}`);
      await fetchCourses();
    } catch (err) {
      setError("Failed to delete course");
    }
  };

  if (loading) return (
    <SidebarLayout>
       <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Catalog...</p>
       </div>
    </SidebarLayout>
  );

  return (
    <SidebarLayout>
      <div className="p-12 max-w-[1600px] mx-auto min-h-full">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
             <div className="flex items-center gap-4">
                <span className="w-12 h-1 px-0 bg-blue-600 rounded-full"></span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Knowledge Hub</span>
             </div>
             <h1 className="text-6xl font-black text-primary tracking-tight">Your Courses</h1>
             <p className="text-secondary text-lg max-w-xl font-medium leading-relaxed">
                Architect world-class learning experiences. From curriculum design to live broadcasts, manage every facet of your education brand.
             </p>
          </div>
          <button 
             onClick={() => { setEditingCourseId(null); setCourseForm(emptyCourseForm); setShowModal(true); }}
             className="px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
             + Create New Course
          </button>
        </header>

        {/* STATS OVERVIEW (Quick View) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
           {[
              { label: 'Published', value: courses.length, icon: '🚀' },
              { label: 'Total Reach', value: courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0), icon: '👥' },
              { label: 'Avg Rating', value: '4.9', icon: '⭐' }
           ].map((stat, i) => (
              <div key={i} className="bg-surface p-8 rounded-[2.5rem] border border-border/50 shadow-sm flex items-center gap-6">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-surface-soft flex items-center justify-center text-2xl shadow-inner">{stat.icon}</div>
                 <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{stat.label}</span>
                    <span className="text-3xl font-black text-primary">{stat.value}</span>
                 </div>
              </div>
           ))}
        </div>

        {/* COURSE GRID */}
        {courses.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {courses.map((course) => (
                 <div key={course._id} className="group bg-surface rounded-[3rem] border border-border/50 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                    {/* Visual Header */}
                    <div className="h-48 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden p-10 flex flex-col justify-end">
                       <div className="absolute top-8 right-8 flex gap-2">
                          <button onClick={() => startEdit(course)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl text-white flex items-center justify-center hover:bg-white/20 transition-all">✏️</button>
                          <button onClick={() => handleDelete(course._id)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl text-white flex items-center justify-center hover:bg-red-500 transition-all">🗑️</button>
                       </div>
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-2">{course.category || "General"}</span>
                       <h3 className="text-2xl font-black text-white truncate">{course.title}</h3>
                       {/* Background pattern */}
                       <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="p-10 space-y-6">
                       <p className="text-secondary text-sm line-clamp-2 leading-relaxed h-10 font-medium">
                          {course.description || "Building the future of education with RemoteSmart."}
                       </p>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-surface-soft rounded-2xl">
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Students</span>
                             <span className="text-lg font-black text-primary">{course.enrolledCount || 0}</span>
                          </div>
                          <div className="p-4 bg-surface-soft rounded-2xl">
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rating</span>
                             <span className="text-lg font-black text-primary">{(course.averageRating || 5).toFixed(1)}</span>
                          </div>
                       </div>

                       <div className="pt-2">
                          <Link 
                             to={`/teacher/courses/${course._id}`} 
                             className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 group-hover:bg-blue-700 transition-all"
                          >
                             Manage Curriculum <span>→</span>
                          </Link>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        ) : (
           <div className="py-32 text-center flex flex-col items-center bg-surface rounded-[4rem] border-4 border-dashed border-border/50">
              <div className="w-24 h-24 bg-surface-soft rounded-[2rem] flex items-center justify-center text-5xl mb-8">🎨</div>
              <h3 className="text-3xl font-black text-primary mb-4">No Courses Found</h3>
              <p className="text-secondary max-w-md mx-auto mb-10 text-lg font-medium">Your course list is empty. Start your journey by creating your first educational experience.</p>
              <button 
                 onClick={() => { setEditingCourseId(null); setCourseForm(emptyCourseForm); setShowModal(true); }}
                 className="px-10 py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20"
              >
                 Initialize First Course
              </button>
           </div>
        )}

        {/* CREATE/EDIT MODAL */}
        {showModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <div className="relative bg-surface w-full max-w-xl p-12 rounded-[4rem] border border-border shadow-2xl">
                 <header className="mb-10">
                    <h2 className="text-4xl font-black text-primary">{editingCourseId ? "Edit Course" : "New Course"}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">RemoteSmart Content Engine</p>
                 </header>

                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course Identity</label>
                       <input 
                          autoFocus
                          className="w-full px-8 py-5 rounded-[1.5rem] bg-surface-soft border-none text-primary font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="e.g. Master Architecture Design"
                          value={courseForm.title}
                          onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Learning Path / Description</label>
                       <textarea 
                          rows={4}
                          className="w-full px-8 py-5 rounded-[1.5rem] bg-surface-soft border-none text-primary font-bold focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                          placeholder="Describe the transformative journey for your students..."
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification</label>
                          <select 
                             className="w-full px-8 py-5 rounded-[1.5rem] bg-surface-soft border-none text-primary font-bold outline-none appearance-none"
                             value={courseForm.category}
                             onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                          >
                             <option value="General">General</option>
                             <option value="Programming">Programming</option>
                             <option value="Science">Science</option>
                             <option value="Mathematics">Mathematics</option>
                             <option value="Design">Design</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Proficiency Level</label>
                          <select 
                             className="w-full px-8 py-5 rounded-[1.5rem] bg-surface-soft border-none text-primary font-bold outline-none appearance-none"
                             value={courseForm.level}
                             onChange={(e) => setCourseForm({...courseForm, level: e.target.value})}
                          >
                             <option value="beginner">Beginner</option>
                             <option value="intermediate">Intermediate</option>
                             <option value="advanced">Advanced</option>
                          </select>
                       </div>
                    </div>

                    <div className="flex gap-6 pt-6">
                       <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                       <button type="submit" className="flex-1 py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20">{editingCourseId ? "Update Course" : "Construct Course"}</button>
                    </div>
                 </form>
              </div>
           </div>
        )}

      </div>
    </SidebarLayout>
  );
};

export default TeacherCourses;
