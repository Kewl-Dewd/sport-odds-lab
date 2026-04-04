import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Markets from "./pages/Markets.tsx";
import MarketDetail from "./pages/MarketDetail.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import HowItWorks from "./pages/HowItWorks.tsx";
import Admin from "./pages/Admin.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
            <Route path="/admin" element={<Admin />} />
            <Route path="/auth" element={<Auth />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
