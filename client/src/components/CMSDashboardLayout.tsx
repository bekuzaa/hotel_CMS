import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Settings, BarChart3, Building2, CreditCard, Monitor, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "TV Channels", href: "/channels", icon: <span className="w-5 h-5">📺</span> },
  { label: "Menus", href: "/menus", icon: <span className="w-5 h-5">🍽️</span> },
  { label: "Background Images", href: "/backgrounds", icon: <span className="w-5 h-5">🖼️</span> },
  { label: "Rooms", href: "/rooms", icon: <span className="w-5 h-5">🏨</span> },
  { label: "Guest Info", href: "/guests", icon: <span className="w-5 h-5">👥</span> },
  { label: "Media Gallery", href: "/media", icon: <span className="w-5 h-5">🎨</span> },
  { label: "Devices", href: "/devices", icon: <Monitor className="w-5 h-5" /> },
  { label: "Localization", href: "/localization", icon: <span className="w-5 h-5">🌐</span>, roles: ["admin"] },
  { label: "Users", href: "/users", icon: <span className="w-5 h-5">👮</span>, roles: ["admin", "superAdmin"] },
  { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" />, roles: ["admin", "hotelAdmin"] },
  { label: "Hotels", href: "/hotels", icon: <Building2 className="w-5 h-5" />, roles: ["superAdmin"] },
  { label: "Subscriptions", href: "/subscriptions", icon: <CreditCard className="w-5 h-5" />, roles: ["superAdmin"] },
];

interface CMSDashboardLayoutProps {
  children: React.ReactNode;
}

export default function CMSDashboardLayout({ children }: CMSDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  
  // Get subscription status for hotelAdmin
  const subscriptionStatus = trpc.subscriptions.getSubscriptionStatus.useQuery(undefined, {
    enabled: user?.role === "hotelAdmin",
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "");
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-slate-900 text-white transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
              HT
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Hotel TV</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location === item.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="flex-1 text-left text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          {sidebarOpen && (
            <div className="px-4 py-2 text-xs text-slate-400">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="text-slate-500 capitalize">{user?.role}</p>
              {/* Subscription status for hotelAdmin */}
              {user?.role === "hotelAdmin" && subscriptionStatus.data && (
                <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
                  <p className="text-slate-400">Subscription</p>
                  <p className={`font-medium ${
                    subscriptionStatus.data.isExpired ? "text-red-400" :
                    subscriptionStatus.data.daysRemaining !== null && subscriptionStatus.data.daysRemaining <= 7 ? "text-yellow-400" :
                    "text-green-400"
                  }`}>
                    {subscriptionStatus.data.isExpired ? "Expired" :
                     subscriptionStatus.data.daysRemaining === null ? "Lifetime" :
                     `${subscriptionStatus.data.daysRemaining} days left`}
                  </p>
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-300 hover:text-white hover:bg-slate-800 justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            {navItems.find(item => item.href === location)?.label || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600 hidden md:block">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-900">{user?.name || user?.username}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role?.replace("Admin", " Admin")}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || user?.username}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
