import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Tv,
  Hotel,
  Users,
  Settings,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Lock,
  Loader2,
  LogOut,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [_, navigate] = useLocation();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("Login successful!");
      setIsLoggingIn(false);
      // Refresh user data
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast.error(error.message || "Login failed");
      setIsLoggingIn(false);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }
    setIsLoggingIn(true);
    loginMutation.mutate({ username, password });
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const features = [
    {
      icon: <Tv className="w-8 h-8" />,
      title: "Smart TV Integration",
      description: "Seamlessly manage all your hotel TV devices from one dashboard",
    },
    {
      icon: <Hotel className="w-8 h-8" />,
      title: "Multi-Hotel Support",
      description: "Manage multiple hotels with centralized control",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Guest Management",
      description: "Personalize guest experience with room-specific content",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-time Analytics",
      description: "Track device status and usage patterns in real-time",
    },
  ];

  const stats = [
    { label: "Hotels", value: "50+" },
    { label: "Devices", value: "10,000+" },
    { label: "Countries", value: "15+" },
    { label: "Uptime", value: "99.9%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Tv className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Hotel TV System</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-white/80 text-sm">
                    Welcome, <span className="font-medium text-white">{user?.name || user?.username}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-white/80 text-sm">System Online</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 mb-6">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">Next Generation Hotel TV</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Hotel Experience
                </span>
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto lg:mx-0">
                A complete smart TV management solution for modern hotels. Control devices,
                manage content, and enhance guest experience with our powerful CMS.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                {features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-blue-400 flex-shrink-0">{feature.icon}</div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{feature.title}</div>
                      <div className="text-xs text-white/60">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Card */}
            <div className="flex justify-center lg:justify-end">
              {!isAuthenticated ? (
                <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-white/60">
                      Sign in to access the dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-white/80">
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/80">
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-6"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="text-center">
                        <p className="text-xs text-white/50 mb-2">Demo Credentials</p>
                        <div className="flex justify-center gap-4 text-xs">
                          <span className="text-white/70">User: <code className="text-blue-300">gmmz</code></span>
                          <span className="text-white/70">Pass: <code className="text-blue-300">gmmz@1234</code></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">Welcome Back!</CardTitle>
                    <CardDescription className="text-white/60">
                      You are logged in as {user?.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-white font-medium">{user?.name || user?.username}</p>
                      <p className="text-white/60 text-sm">{user?.email}</p>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-6"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              A comprehensive suite of tools designed specifically for hotel TV management
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Content Management",
                description: "Easily manage TV channels, menus, and promotional content across all devices",
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: <Settings className="w-6 h-6" />,
                title: "Device Control",
                description: "Remote control power, volume, and settings for all connected TV devices",
                color: "from-purple-500 to-purple-600",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics Dashboard",
                description: "Real-time monitoring of device status, guest interactions, and system health",
                color: "from-cyan-500 to-cyan-600",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4`}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Tv className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Hotel TV System</span>
          </div>
          <p className="text-white/40 text-sm">
            © 2026 Hotel TV System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
