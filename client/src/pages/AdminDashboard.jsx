import { useEffect, useState } from "react";
import API from "../api/api";
import { useAuth } from "../app/useAuth";
import SidebarLayout from "../layouts/SidebarLayout";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  
  const maxRoleValue = Math.max(...(analytics?.roleDistribution?.map((item) => item.value) ?? [0]), 1);
  const maxEnrollmentValue = Math.max(...(analytics?.enrollmentBreakdown?.map((item) => item.value) ?? [0]), 1);

  const fetchAdminData = async () => {
    const [analyticsResponse, usersResponse] = await Promise.all([
      API.get("/analytics/admin/overview"),
      API.get("/users"),
    ]);
    return {
      analytics: analyticsResponse.data,
      users: usersResponse.data,
    };
  };

  useEffect(() => {
    let isActive = true;
    const loadAdminData = async () => {
      try {
        const data = await fetchAdminData();
        if (!isActive) return;
        setAnalytics(data.analytics);
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (err) {
        if (isActive) setError(err.response?.data?.message || "Failed to load admin data");
      }
    };
    loadAdminData();
    return () => { isActive = false; };
  }, []);

  const updateRole = async (userId, role) => {
    try {
      await API.put(`/users/${userId}/role`, { role });
      const data = await fetchAdminData();
      setAnalytics(data.analytics);
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user role");
    }
  };

  return (
    <SidebarLayout>
      <div className="p-6 lg:p-10 space-y-10">
        
        {/* Header */}
        <header>
          <div className="flex flex-wrap items-center justify-between gap-4">
             <div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest mb-3 inline-block">System Control</span>
                <h1 className="text-3xl font-black text-primary">Admin Command Center</h1>
                <p className="text-secondary mt-2">Welcome back, {user?.name}. Governance and analytics overview.</p>
             </div>
             {error && <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl text-red-600 text-sm font-bold">{error}</div>}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: "Total Users", value: analytics?.stats?.totalUsers, icon: "👥", color: "blue" },
             { label: "Platform Courses", value: analytics?.stats?.totalCourses, icon: "📚", color: "purple" },
             { label: "Active Students", value: analytics?.stats?.totalStudents, icon: "🎓", color: "orange" },
             { label: "Completions", value: analytics?.stats?.completedEnrollments, icon: "✅", color: "green" }
           ].map((stat, i) => (
             <article key={i} className="bg-surface p-8 rounded-[32px] border border-border shadow-xl shadow-blue-600/5 transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                   <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center text-2xl`}>{stat.icon}</div>
                </div>
                <p className="text-xs font-black text-secondary uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-primary">{stat.value ?? 0}</h3>
             </article>
           ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           <article className="bg-surface p-8 lg:p-10 rounded-[40px] border border-border shadow-2xl shadow-blue-600/5">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black rounded-full uppercase tracking-widest mb-2 inline-block">User Demographics</span>
                    <h3 className="text-2xl font-black text-primary">Role Distribution</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{analytics?.stats?.completionRate ?? 0}% Rate</p>
                 </div>
              </div>
              <div className="space-y-6">
                 {(analytics?.roleDistribution ?? []).map((item) => (
                   <div key={item.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-sm font-bold text-secondary">{item.label}</span>
                         <span className="text-xs font-black text-gray-400">{item.value}</span>
                      </div>
                      <div className="h-4 bg-surface-soft rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.max(8, Math.round((item.value / maxRoleValue) * 100))}%` }}
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </article>

           <article className="bg-surface p-8 lg:p-10 rounded-[40px] border border-border shadow-2xl shadow-blue-600/5">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black rounded-full uppercase tracking-widest mb-2 inline-block">Activity Tracking</span>
                    <h3 className="text-2xl font-black text-primary">Enrollment Status</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{analytics?.stats?.totalEnrollments ?? 0} Total</p>
                 </div>
              </div>
              <div className="space-y-6">
                 {(analytics?.enrollmentBreakdown ?? []).map((item) => (
                   <div key={item.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-sm font-bold text-secondary">{item.label}</span>
                         <span className="text-xs font-black text-gray-400">{item.value}</span>
                      </div>
                      <div className="h-4 bg-surface-soft rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.max(8, Math.round((item.value / maxEnrollmentValue) * 100))}%` }}
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </article>
        </div>

        {/* User Management List */}
        <section className="bg-surface rounded-[48px] border border-border shadow-2xl shadow-blue-600/5 overflow-hidden">
           <div className="p-8 lg:p-10 border-b border-gray-50 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-primary">Platform Directory</h3>
              <div className="flex gap-2">
                 <span className="px-4 py-2 bg-surface text-gray-500 text-xs font-bold rounded-xl">{users.length} Total Users</span>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-surface/50">
                       <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                       <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                       <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {users.map((platformUser) => (
                      <tr key={platformUser._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                         <td className="p-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black">
                                  {platformUser.name?.charAt(0) || "U"}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-primary">{platformUser.name}</p>
                                  <p className="text-xs text-gray-500">{platformUser.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              platformUser.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                              platformUser.role === 'teacher' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            }`}>
                               {platformUser.role}
                            </span>
                         </td>
                         <td className="p-6">
                            <select
                              className="bg-surface-soft text-primary text-xs font-bold px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                              value={platformUser.role}
                              onChange={(event) => updateRole(platformUser._id, event.target.value)}
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

      </div>
    </SidebarLayout>
  );
};

export default AdminDashboard;
