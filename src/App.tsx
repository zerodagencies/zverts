import { lazy, Suspense, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/app/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy import with auto-reload on stale chunk errors (after deploys / vite restarts)
const lazyWithRetry = <T extends { default: ComponentType<any> }>(
  factory: () => Promise<T>,
) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("Failed to fetch dynamically imported module") || msg.includes("Importing a module script failed")) {
        const key = "__chunk_reload__";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
          return new Promise<T>(() => {});
        }
      }
      throw err;
    }
  });

const Index = lazyWithRetry(() => import("./pages/Index.tsx"));
const Auth = lazyWithRetry(() => import("./pages/Auth.tsx"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard.tsx"));
const Learn = lazyWithRetry(() => import("./pages/Learn.tsx"));
const ModulePlayer = lazyWithRetry(() => import("./pages/ModulePlayer.tsx"));
const Courses = lazyWithRetry(() => import("./pages/Courses.tsx"));
const CourseDetail = lazyWithRetry(() => import("./pages/CourseDetail.tsx"));
const Profile = lazyWithRetry(() => import("./pages/Profile.tsx"));
const Settings = lazyWithRetry(() => import("./pages/Settings.tsx"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword.tsx"));
const Quiz = lazyWithRetry(() => import("./pages/Quiz.tsx"));
const Leaderboard = lazyWithRetry(() => import("./pages/Leaderboard.tsx"));
const Admin = lazyWithRetry(() => import("./pages/Admin.tsx"));
const Certificate = lazyWithRetry(() => import("./pages/Certificate.tsx"));
const Explore = lazyWithRetry(() => import("./pages/Explore.tsx"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound.tsx"));
const Info = lazyWithRetry(() => import("./pages/Info.tsx"));

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
            <ErrorBoundary>
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
                <Route path="/info/:slug" element={<Info />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
