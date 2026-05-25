import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/zerod/ThemeProvider";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";

const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Learn = lazy(() => import("./pages/Learn.tsx"));
const ModulePlayer = lazy(() => import("./pages/ModulePlayer.tsx"));
const Courses = lazy(() => import("./pages/Courses.tsx"));
const CourseDetail = lazy(() => import("./pages/CourseDetail.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Quiz = lazy(() => import("./pages/Quiz.tsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Certificate = lazy(() => import("./pages/Certificate.tsx"));
const Explore = lazy(() => import("./pages/Explore.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen grid place-items-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id" element={<CourseDetail />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/learn/:id" element={<ModulePlayer />} />
                <Route path="/quiz/:id" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/certificate/:courseId" element={<Certificate />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
