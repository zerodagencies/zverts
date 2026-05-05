import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Learn from "./pages/Learn.tsx";
import ModulePlayer from "./pages/ModulePlayer.tsx";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/zerod/ThemeProvider";
import Courses from "./pages/Courses.tsx";
import CourseDetail from "./pages/CourseDetail.tsx";
import Profile from "./pages/Profile.tsx";
import Quiz from "./pages/Quiz.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import Admin from "./pages/Admin.tsx";
import Certificate from "./pages/Certificate.tsx";
import Explore from "./pages/Explore.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
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
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/certificate/:courseId" element={<Certificate />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
