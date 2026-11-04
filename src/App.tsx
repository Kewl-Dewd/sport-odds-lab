import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketProvider } from "@/context/MarketContext";
import { EducationProvider } from "@/context/EducationContext";
import { AuthProvider } from "@/context/AuthContext";
import { ModeProvider } from "@/context/ModeContext";
import { ClassProvider } from "@/context/ClassContext";
import Support from "./pages/Support";
import Calibration from "./pages/Calibration";
import Tools from "./pages/Tools";
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
import ExperimentView from "./pages/ExperimentView.tsx";
import PresentationMode from "./pages/PresentationMode.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import ChooseMode from "./pages/ChooseMode.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import NotFound from "./pages/NotFound.tsx";

import JoinClassPage from "@/features/classes/JoinClassPage";
import JournalPage from "@/features/journal/JournalPage";
import Learn from "@/pages/Learn";
import ResponsibleGamblingPage from "@/features/rg/ResponsibleGamblingPage";
import InstructorClassesPage from "@/features/classes/InstructorClassesPage";
import ClassDetailPage from "@/features/classes/ClassDetailPage";
import ClassBoardPage from "@/features/classes/ClassBoardPage";
import PlatformAdminPage from "@/features/admin/PlatformAdminPage";
import { PersistenceBridge } from "@/features/persistence/PersistenceBridge";
import GetAccess from "./pages/GetAccess.tsx";
import Gradebook from "./pages/Gradebook";
import QuickSetup from "./pages/QuickSetup";
import ForInstructors from "./pages/ForInstructors";
import ForAdministrators from "./pages/ForAdministrators";
import CheckoutReturn from "./pages/CheckoutReturn.tsx";
import { RequireAccess } from "@/components/access/RequireAccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ClassProvider>
          <ModeProvider>
            <MarketProvider>
              <EducationProvider>
                <Toaster />
                <Sonner />
                <PersistenceBridge />
                <LearningNudgeBar />
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Index />} />

                    <Route path="/choose-mode" element={<ProtectedRoute><ChooseMode /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute requireMode><RequireAccess><Dashboard /></RequireAccess></ProtectedRoute>} />
                    <Route path="/markets" element={<ProtectedRoute requireMode><RequireAccess><Markets /></RequireAccess></ProtectedRoute>} />
                    <Route path="/markets/:id" element={<ProtectedRoute requireMode><RequireAccess><MarketDetail /></RequireAccess></ProtectedRoute>} />
                    <Route path="/portfolio" element={<ProtectedRoute requireMode><RequireAccess><Portfolio /></RequireAccess></ProtectedRoute>} />
                    <Route path="/leaderboard" element={<ProtectedRoute requireMode><RequireAccess><Leaderboard /></RequireAccess></ProtectedRoute>} />
                    <Route path="/calibration" element={<ProtectedRoute><Calibration /></ProtectedRoute>} />
                    <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/instructors" element={<ForInstructors />} />
                    <Route path="/for-administrators" element={<ForAdministrators />} />
                    <Route path="/instructor/quick-setup" element={<ProtectedRoute requireInstructor><QuickSetup /></ProtectedRoute>} />
                    <Route path="/instructor/gradebook" element={<ProtectedRoute requireInstructor><Gradebook /></ProtectedRoute>} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/glossary" element={<ProtectedRoute><Glossary /></ProtectedRoute>} />
                    <Route path="/instructor" element={<Navigate to="/instructor/classes" replace />} />
                    <Route path="/instructor/review" element={<ProtectedRoute requireInstructor><TradeReview /></ProtectedRoute>} />
                    <Route path="/instructor/reports" element={<ProtectedRoute requireInstructor><Reports /></ProtectedRoute>} />
                    <Route path="/experiments" element={<Navigate to="/instructor/classes" replace />} />
                    <Route path="/experiments/:id" element={<ProtectedRoute requireInstructor><ExperimentView /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute requireInstructor><AdminUsers /></ProtectedRoute>} />
                    <Route path="/join" element={<ProtectedRoute><RequireAccess><JoinClassPage /></RequireAccess></ProtectedRoute>} />
                    <Route path="/join/:code" element={<ProtectedRoute><RequireAccess><JoinClassPage /></RequireAccess></ProtectedRoute>} />
                    <Route path="/access" element={<ProtectedRoute><GetAccess /></ProtectedRoute>} />
                    <Route path="/checkout/return" element={<ProtectedRoute><CheckoutReturn /></ProtectedRoute>} />
                    <Route path="/admin/platform" element={<ProtectedRoute><PlatformAdminPage /></ProtectedRoute>} />
                    <Route path="/class-board" element={<ProtectedRoute><RequireAccess><ClassBoardPage /></RequireAccess></ProtectedRoute>} />
                    <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
                    <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
                    <Route path="/responsible-play" element={<ProtectedRoute><ResponsibleGamblingPage /></ProtectedRoute>} />
                    <Route path="/instructor/classes" element={<ProtectedRoute requireInstructor><InstructorClassesPage /></ProtectedRoute>} />
                    <Route path="/instructor/classes/:id" element={<ProtectedRoute requireInstructor><ClassDetailPage /></ProtectedRoute>} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                  </Route>
                  {/* Presentation mode — no navbar/footer */}
                  <Route path="/instructor/present/:view" element={<ProtectedRoute requireInstructor><PresentationMode /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </EducationProvider>
            </MarketProvider>
          </ModeProvider>
          </ClassProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
