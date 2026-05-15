const CourseCard = ({ course, onClick }) => {
  const { title, description, teacherId, category, level, downloaded, averageRating, thumbnail } = course || {};
  const teacherName = teacherId?.name || "Instructor";

  return (
    <article 
      className="group bg-surface rounded-[2rem] border border-border p-6 hover:shadow-[0_32px_64px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_32px_64px_rgba(0,0,0,0.3)] transition-all duration-500 cursor-pointer overflow-hidden relative flex flex-col h-full active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="relative z-10 flex flex-col h-full space-y-4">
        
        {/* Course Image */}
        <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-surface-soft border border-border relative mb-2">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        {/* Header: Badges */}
        <div className="flex justify-between items-start">
           <div className="flex flex-wrap gap-2">
             <span className="inline-block px-3 py-1 bg-accent-soft text-accent text-[9px] font-bold rounded-full uppercase tracking-widest border border-accent/10">
               {category || "General"}
             </span>
             {averageRating > 0 && (
               <span className="inline-block px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-[9px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-yellow-200/50 dark:border-yellow-700/30">
                 ⭐ {averageRating}
               </span>
             )}
           </div>
           {downloaded && (
             <div className="w-7 h-7 bg-success/10 text-success rounded-lg flex items-center justify-center text-xs shadow-sm border border-success/10">
                ✓
             </div>
           )}
        </div>
        
        {/* Body: Title & Desc */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-primary leading-tight group-hover:text-accent transition-colors duration-300">
            {title}
          </h3>
          <p className="text-xs text-secondary line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
            {description}
          </p>
        </div>
        
        {/* Footer: Instructor & CTA */}
        <div className="pt-6 mt-auto flex items-center justify-between border-t border-border/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-surface-soft border border-border rounded-2xl flex items-center justify-center text-xs font-bold text-accent uppercase group-hover:bg-accent group-hover:text-white transition-all duration-500">
                {teacherName.charAt(0)}
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Instructor</span>
                <p className="text-xs font-bold text-primary">{teacherName}</p>
             </div>
          </div>
          
          <div className="w-10 h-10 rounded-2xl bg-surface-soft flex items-center justify-center text-secondary group-hover:bg-accent group-hover:text-white group-hover:translate-x-1 transition-all duration-500">
             <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path d="M5 12h14m-7-7l7 7-7 7" />
             </svg>
          </div>
        </div>
      </div>

      {/* Modern Background Gradient Blur */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/10 transition-colors duration-700" />
    </article>
  );
};

export default CourseCard;
