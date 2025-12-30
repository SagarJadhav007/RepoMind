import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Landing from "./pages/Landing";
import Dashboard from "./pages/workspace/Dashboard";
import Health from "./pages/workspace/Health";
import Manage from "./pages/workspace/Manage";
import Contributors from "./pages/workspace/Contributors";
import Planning from "./pages/workspace/Planning";
import Assistant from "./pages/workspace/Assistant";
import Activity from "./pages/workspace/Activity";
import Profile from "./pages/workspace/Profile";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { RepoProvider } from "./context/RepoContext";
import SelectRepo from "./pages/SelectRepo";
import ConnectGithub from "./pages/ConnectGithub";
import ProtectedRoute from "./components/ProtectedRoute";
import RepoFilesPage from "./pages/RepoFiles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <RepoProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/fetch-files" element={<RepoFilesPage></RepoFilesPage>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/select-repo" element={<SelectRepo />} />
            <Route path="/connect-github" element={<ConnectGithub />} />
            <Route path="/workspace/demo" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/workspace/demo/health" element={<Health />} />
            <Route path="/workspace/demo/manage" element={<ProtectedRoute><Manage /></ProtectedRoute>} />
            <Route path="/workspace/demo/contributors" element={<Contributors />} />
            <Route path="/workspace/demo/planning" element={<Planning />} />
            <Route path="/workspace/demo/assistant" element={<Assistant />} />
            <Route path="/workspace/demo/activity" element={<Activity />} />
            <Route path="/workspace/demo/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </RepoProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
