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

const Quiz = lazyWithRetry(() => import("./pages/Quiz.tsx"));
const Leaderboard = lazyWithRetry(() => import("./pages/Leaderboard.tsx"));
const Admin = lazyWithRetry(() => import("./pages/Admin.tsx"));
const Certificate = lazyWithRetry(() => import("./pages/Certificate.tsx"));
const BuyPackage = lazyWithRetry(() => import("./pages/BuyPackage.tsx"));
const Payment = lazyWithRetry(() => import("./pages/Payment.tsx"));
const PaymentHistory = lazyWithRetry(() => import("./pages/PaymentHistory.tsx"));
const AdminPayments = lazyWithRetry(() => import("./pages/admin/Payments.tsx"));
const AdminUsers = lazyWithRetry(() => import("./pages/admin/Users.tsx"));
const AdminManagement = lazyWithRetry(() => import("./pages/admin/AdminManagement.tsx"));
const AdminBroadcast = lazyWithRetry(() => import("./pages/admin/Broadcast.tsx"));
const AdminSupportContacts = lazyWithRetry(() => import("./pages/admin/SupportContacts.tsx"));
const AIWorkspace = lazyWithRetry(() => import("./pages/AIWorkspace.tsx"));

const NotFound = lazyWithRetry(() => import("./pages/NotFound.tsx"));
const Info = lazyWithRetry(() => import("./pages/Info.tsx"));
const RefundPolicy = lazyWithRetry(() => import("./pages/RefundPolicy.tsx"));

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
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <div className="h-14 border-b border-border/60 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    </div>
    {/* Content skeleton */}
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="h-8 w-2/3 sm:w-1/3 rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-full sm:w-1/2 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/60 p-4 space-y-3">
            <div className="h-32 rounded-xl bg-muted animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
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
                {/* /explore removed per product decision */}
                <Route path="/learn" element={<Learn />} />
                <Route path="/learn/:id" element={<ModulePlayer />} />
                <Route path="/quiz/:id" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/ai" element={<AIWorkspace />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/management" element={<AdminManagement />} />
                <Route path="/admin/broadcast" element={<AdminBroadcast />} />
                <Route path="/admin/support-contacts" element={<AdminSupportContacts />} />
                <Route path="/buy" element={<BuyPackage />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/payments" element={<PaymentHistory />} />
                <Route path="/certificate/:courseId" element={<Certificate />} />
                <Route path="/info/:slug" element={<Info />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
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
