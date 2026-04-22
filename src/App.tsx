import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketProvider } from "@/context/MarketContext";
import { EducationProvider } from "@/context/EducationContext";
import { AuthProvider } from "@/context/AuthContext";
import { ModeProvider } from "@/context/ModeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LearningNudgeBar } from "@/components/education/LearningNudges";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Markets from "./pages/Markets.tsx";
import MarketDetail from "./pages/MarketDetail.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import Glossary from "./pages/Glossary.tsx";
import TradeReview from "./pages/TradeReview.tsx";
import Reports from "./pages/Reports.tsx";
import InstructorDashboard from "./pages/InstructorDashboard.tsx";
import Experiments from "./pages/Experiments.tsx";
import ExperimentView from "./pages/ExperimentView.tsx";
import PresentationMode from "./pages/PresentationMode.tsx";
import Auth from "./pages/Auth.tsx";
import ChooseMode from "./pages/ChooseMode.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ModeProvider>
            <MarketProvider>
              <EducationProvider>
                <Toaster />
                <Sonner />
                <LearningNudgeBar />
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/choose-mode" element={<ProtectedRoute><ChooseMode /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute requireMode><Dashboard /></ProtectedRoute>} />
                    <Route path="/markets" element={<ProtectedRoute requireMode><Markets /></ProtectedRoute>} />
                    <Route path="/markets/:id" element={<ProtectedRoute requireMode><MarketDetail /></ProtectedRoute>} />
                    <Route path="/portfolio" element={<ProtectedRoute requireMode><Portfolio /></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute requireMode><Leaderboard /></ProtectedRoute>} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/glossary" element={<ProtectedRoute><Glossary /></ProtectedRoute>} />
                    <Route path="/instructor" element={<ProtectedRoute requireInstructor><InstructorDashboard /></ProtectedRoute>} />
                    <Route path="/instructor/review" element={<ProtectedRoute requireInstructor><TradeReview /></ProtectedRoute>} />
                    <Route path="/instructor/reports" element={<ProtectedRoute requireInstructor><Reports /></ProtectedRoute>} />
                    <Route path="/experiments" element={<ProtectedRoute requireInstructor><Experiments /></ProtectedRoute>} />
                    <Route path="/experiments/:id" element={<ProtectedRoute requireInstructor><ExperimentView /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute requireInstructor><AdminUsers /></ProtectedRoute>} />
                    <Route path="/auth" element={<Auth />} />
                  </Route>
                  {/* Presentation mode — no navbar/footer */}
                  <Route path="/instructor/present/:view" element={<ProtectedRoute requireInstructor><PresentationMode /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </EducationProvider>
            </MarketProvider>
          </ModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
