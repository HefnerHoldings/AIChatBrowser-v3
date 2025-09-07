import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SidebarManagerProvider } from "@/contexts/SidebarManagerContext";
import { initializeSidebars } from "@/lib/sidebar-initializer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Browser from "@/pages/Browser";
import Settings from "@/pages/Settings";
import UserProfile from "@/pages/UserProfile";

// Initialize sidebars on app start
initializeSidebars();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browser" component={Browser} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={UserProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <SidebarManagerProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SidebarManagerProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
