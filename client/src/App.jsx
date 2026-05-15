import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

// === Eagerly loaded (critical path — first pages any visitor sees) ===
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// === Lazily loaded — each becomes a separate JS chunk, downloaded on demand ===
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const LectureViewer = lazy(() => import("./pages/LectureViewer"));
const QuizAttempt = lazy(() => import("./pages/QuizAttempt"));
const QuizResult = lazy(() => import("./pages/QuizResult"));
const CertificatePage = lazy(() => import("./pages/CertificatePage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const TeacherCourses = lazy(() => import("./pages/TeacherCourses"));
const TeacherStudents = lazy(() => import("./pages/TeacherStudents"));
const TeacherAnalytics = lazy(() => import("./pages/TeacherAnalytics"));
const TeacherProfile = lazy(() => import("./pages/TeacherProfile"));
const TeacherCourseBuilder = lazy(() => import("./pages/TeacherCourseBuilder"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const VideoSDKClassroom = lazy(() => import("./pages/VideoSDKClassroom"));
const OfflineLibrary = lazy(() => import("./pages/OfflineLibrary"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Minimal full-screen spinner shown while a lazy chunk is being downloaded
const PageLoader = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#001f3f",
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: "3px solid rgba(255,255,255,0.1)",
      borderTop: "3px solid #60a5fa",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/lecture/:lectureId" element={<LectureViewer />} />
          <Route path="/offline" element={<OfflineLibrary />} />

          {/* Live classroom */}
          <Route element={<ProtectedRoute />}>
            <Route path="/course/:courseId/live" element={<VideoSDKClassroom />} />
          </Route>

          {/* Student routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/quiz/:quizId" element={<QuizAttempt />} />
            <Route path="/adaptive-quiz/:lectureId" element={<QuizAttempt />} />
            <Route path="/quiz-result/:attemptId" element={<QuizResult />} />
            <Route path="/certificate/:courseId" element={<CertificatePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Teacher routes */}
          <Route element={<RoleRoute allowedRoles={["teacher", "admin"]} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/courses" element={<TeacherCourses />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
            <Route path="/teacher/profile" element={<TeacherProfile />} />
            <Route path="/teacher/courses/:courseId" element={<TeacherCourseBuilder />} />
          </Route>

          {/* Admin routes */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
