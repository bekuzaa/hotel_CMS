import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TVChannels from "./pages/TVChannels";
import Menus from "./pages/Menus";
import BackgroundImages from "./pages/BackgroundImages";
import Rooms from "./pages/Rooms";
import GuestInfo from "./pages/GuestInfo";
import MediaGallery from "./pages/MediaGallery";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Localization from "./pages/Localization";
import HotelsManagement from "./pages/HotelsManagement";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import Devices from "./pages/Devices";
import TVLauncher from "./pages/TVLauncher";
import TVApps from "./pages/TVApps";
import GuestServices from "./pages/GuestServices";
import HotelBranding from "./pages/HotelBranding";
import WakeUpCalls from "./pages/WakeUpCalls";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: any) {
  const { isAuthenticated, loading } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tv" component={TVLauncher} />
      <Route path="/launcher" component={TVLauncher} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/channels" component={() => <ProtectedRoute component={TVChannels} />} />
      <Route path="/menus" component={() => <ProtectedRoute component={Menus} />} />
      <Route path="/backgrounds" component={() => <ProtectedRoute component={BackgroundImages} />} />
      <Route path="/rooms" component={() => <ProtectedRoute component={Rooms} />} />
      <Route path="/guests" component={() => <ProtectedRoute component={GuestInfo} />} />
      <Route path="/media" component={() => <ProtectedRoute component={MediaGallery} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UserManagement} />} />
      <Route path="/localization" component={() => <ProtectedRoute component={Localization} />} />
      <Route path="/hotels" component={() => <ProtectedRoute component={HotelsManagement} />} />
      <Route path="/subscriptions" component={() => <ProtectedRoute component={SubscriptionManagement} />} />
      <Route path="/devices" component={() => <ProtectedRoute component={Devices} />} />
      <Route path="/tv-apps" component={() => <ProtectedRoute component={TVApps} />} />
      <Route path="/guest-services" component={() => <ProtectedRoute component={GuestServices} />} />
      <Route path="/branding" component={() => <ProtectedRoute component={HotelBranding} />} />
      <Route path="/wake-up-calls" component={() => <ProtectedRoute component={WakeUpCalls} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
