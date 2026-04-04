import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketProvider } from "@/context/MarketContext";
import { EducationProvider } from "@/context/EducationContext";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MarketProvider>
        <EducationProvider>
          <Toaster />
          <Sonner />
          <LearningNudgeBar />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/markets/:id" element={<MarketDetail />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/glossary" element={<Glossary />} />
                <Route path="/instructor" element={<InstructorDashboard />} />
                <Route path="/instructor/review" element={<TradeReview />} />
                <Route path="/instructor/reports" element={<Reports />} />
                <Route path="/auth" element={<Auth />} />
              </Route>
              {/* Presentation mode — no navbar/footer */}
              <Route path="/instructor/present/:view" element={<PresentationMode />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </EducationProvider>
      </MarketProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
