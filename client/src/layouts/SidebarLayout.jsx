import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../app/useAuth";
import Navbar from "../components/Navbar";
import MobileSidebar from "../components/MobileSidebar";

const SidebarLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    // Keep Vanilla CSS dark mode working
    document.documentElement.setAttribute("data-theme", theme);
    // Add tailwind dark class
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => current === "dark" ? "light" : "dark");
  };

  const teacherNavItems = [
    { name: "Dashboard", path: "/teacher/dashboard", icon: "📊" },
    { name: "Courses", path: "/teacher/courses", icon: "📚" },
    { name: "Students", path: "/teacher/students", icon: "👥" },
    { name: "Analytics", path: "/teacher/analytics", icon: "📈" },
    { name: "Profile", path: "/teacher/profile", icon: "👤" },
  ];

  const adminNavItems = [
    { name: "Overview", path: "/admin?view=overview", icon: "📊" },
    { name: "Teachers", path: "/admin?view=teachers", icon: "👨‍🏫" },
    { name: "Students", path: "/admin?view=students", icon: "🎓" },
    { name: "Modules", path: "/admin?view=courses", icon: "📚" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  const navItems = user?.role === "admin" ? adminNavItems : teacherNavItems;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden">
      <Navbar 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Wider Modern Sidebar - Hidden on mobile, flex on desktop */}
        <aside className="hidden lg:flex w-64 bg-background border-r border-border flex-col py-6 px-4 gap-8 z-50">
          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-2">
            {navItems.map((item) => {
              const itemBaseUrl = item.path.split('?')[0];
              const itemSearchParams = new URLSearchParams(item.path.split('?')[1] || "");
              const currentSearchParams = new URLSearchParams(location.search);
              
              const isPathActive = location.pathname === itemBaseUrl;
              const isViewActive = !itemSearchParams.get("view") || itemSearchParams.get("view") === currentSearchParams.get("view");
              
              const isActive = isPathActive && isViewActive;
                
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                      : "text-gray-400 hover:text-white hover:bg-surface-soft"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-bold tracking-tight">{item.name}</span>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute -left-4 w-1.5 h-6 bg-blue-600 rounded-r-full shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-center gap-4 px-4 py-3 bg-surface-soft rounded-2xl border border-border">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-[10px] font-black border border-white/10 shadow-lg shadow-blue-600/20">
                {user?.name?.charAt(0)?.toUpperCase() || "T"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary truncate">{user?.name || "Teacher"}</p>
                <p className="text-[10px] text-secondary truncate uppercase tracking-widest font-black">Instructor</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
