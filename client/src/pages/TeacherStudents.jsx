import { useEffect, useState } from "react";
import API from "../api/api";
import SidebarLayout from "../layouts/SidebarLayout";

const TeacherStudents = () => {
  const [courseGroups, setCourseGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await API.get("/analytics/teacher/students");
        setCourseGroups(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError("Failed to load student directory");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const selectedGroup = courseGroups.find(g => g.courseId === selectedCourseId);
  
  const filteredStudents = selectedGroup?.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredGroups = courseGroups.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.students.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <header className="flex flex-wrap justify-between items-start gap-8">
           <div>
              <div className="flex items-center gap-3 mb-2">
                {selectedCourseId && (
                  <button 
                    onClick={() => { setSelectedCourseId(null); setSearchTerm(""); }}
                    className="w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-xl text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    ←
                  </button>
                )}
                <h2 className="text-3xl font-bold text-primary">
                  {selectedCourseId ? "Course Roster" : "Class Rosters"}
                </h2>
              </div>
              <p className="text-secondary">
                {selectedCourseId 
                  ? `Viewing students enrolled in ${selectedGroup?.title}` 
                  : "Select a course to manage its enrolled students."}
              </p>
           </div>
           
           <div className="w-full md:w-96">
              <div className="relative group">
                 <input 
                   type="text" 
                   placeholder={selectedCourseId ? "Search in this course..." : "Search courses or students..."}
                   className="w-full px-7 py-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-border focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm group-hover:border-blue-500/50 text-sm"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
              </div>
           </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Organizing Class Data...</p>
          </div>
        ) : error ? (
           <div className="p-10 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl text-red-600 font-bold text-center">
              {error}
           </div>
        ) : !selectedCourseId ? (
          /* COURSE GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredGroups.map(group => (
              <button 
                key={group.courseId}
                onClick={() => { setSelectedCourseId(group.courseId); setSearchTerm(""); }}
                className="text-left bg-white dark:bg-[#1e1e1e] p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-500/50 transition-all group flex flex-col items-start"
              >
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  📚
                </div>
                <h3 className="text-xl font-bold text-primary mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{group.title}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {group.students.slice(0, 3).map((s, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white dark:border-[#1e1e1e] flex items-center justify-center text-[10px] font-bold text-white uppercase">
                        {s.name.charAt(0)}
                      </div>
                    ))}
                    {group.students.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#1e1e1e] flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +{group.students.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-secondary ml-2">
                    {group.students.length} Total Learners
                  </span>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800 w-full flex justify-between items-center text-blue-600 text-[10px] font-black uppercase tracking-widest">
                   <span>Manage Roster</span>
                   <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* STUDENT LIST VIEW */
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <article key={student.studentId} className="group bg-surface hover:bg-white dark:hover:bg-[#252525] p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-center gap-8">
                 
                 {/* ID & Avatar Section */}
                 <div className="flex items-center gap-6 md:w-1/4 min-w-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-transform flex-shrink-0">
                       {student.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                       <h4 className="text-lg font-black text-primary group-hover:text-blue-600 transition-colors truncate">{student.name}</h4>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{student.email}</p>
                    </div>
                 </div>

                 {/* Progress Section */}
                 <div className="flex-1 w-full space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                       <span>Mastery Progress</span>
                       <span className="text-blue-600">{student.progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-soft rounded-full overflow-hidden border border-border/10">
                       <div 
                         className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.4)]" 
                         style={{ width: `${student.progressPercent}%` }}
                       />
                    </div>
                 </div>

                 {/* Metrics Section */}
                 <div className="flex items-center gap-12 md:w-1/3 justify-end">
                    <div className="text-right">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Registration</span>
                       <span className="text-xs font-bold text-secondary">{new Date(student.enrolledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Status</span>
                       <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          student.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                          : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                       }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
                          {student.status}
                       </div>
                    </div>

                    <button className="w-12 h-12 rounded-2xl bg-surface-soft flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white">
                       🔍
                    </button>
                 </div>
              </article>
            ))}
            
            {filteredStudents.length === 0 && (
              <div className="py-24 text-center bg-gray-50 dark:bg-[#1e1e1e] rounded-[3rem] border border-dashed border-border">
                 <p className="text-gray-400 font-bold uppercase tracking-widest italic">No students matching your search in this course</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default TeacherStudents;
