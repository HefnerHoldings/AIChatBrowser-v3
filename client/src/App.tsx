import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SidebarManagerProvider } from "@/contexts/SidebarManagerContext";
import { initializeSidebars } from "@/lib/sidebar-initializer";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load all pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const Browser = lazy(() => import("@/pages/Browser"));
const Settings = lazy(() => import("@/pages/Settings"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const OutreachDashboard = lazy(() => import("@/pages/OutreachDashboard"));
const QASuiteDashboard = lazy(() => import("@/pages/QASuiteDashboard"));
const SelectorStudio = lazy(() => import("@/pages/SelectorStudio"));

// Initialize sidebars on app start
initializeSidebars();

// Loading component for lazy loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="animate-pulse">
          <Skeleton className="h-12 w-[250px] mx-auto" />
          <Skeleton className="h-4 w-[200px] mx-auto mt-4" />
          <Skeleton className="h-4 w-[150px] mx-auto mt-2" />
        </div>
        <p className="text-sm text-muted-foreground mt-4">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/browser" component={Browser} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={UserProfile} />
        <Route path="/outreach" component={OutreachDashboard} />
        <Route path="/qa-suite" component={QASuiteDashboard} />
        <Route path="/selector-studio" component={SelectorStudio} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
