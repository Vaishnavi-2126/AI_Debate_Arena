import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useEffect } from "react";

import Home from "@/pages/home";
import Debate from "@/pages/debate";
import Dashboard from "@/pages/dashboard";
import Results from "@/pages/results";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppContent() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/debate/:sessionId" component={Debate} />
        <Route path="/debate/:sessionId/results" component={Results} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
