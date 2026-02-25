import { useState, useEffect } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Save, Upload, Palette, Image, MessageSquare, Loader2, Cloud } from "lucide-react";

export default function HotelBranding() {
  const { user } = useAuth();
  const hotelId = user?.hotelId || 1;
  const isSuperAdmin = user?.role === "superAdmin";

  const [formData, setFormData] = useState({
    hotelName: "",
    logoUrl: "",
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    welcomeMessage: "",
    welcomeMessageEn: "",
    launcherBackground: "",
    weatherCity: "",
    showWeather: true,
  });

  // Fetch hotel data
  const { data: hotel, isLoading } = trpc.hotels.getById.useQuery(
    { id: hotelId },
    { enabled: !!hotelId }
  );

  // Update mutation
  const updateHotel = trpc.hotels.update.useMutation({
    onSuccess: () => {
      toast.success("Branding updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (hotel) {
      setFormData({
        hotelName: hotel.hotelName || "",
        logoUrl: hotel.logoUrl || "",
        primaryColor: hotel.primaryColor || "#1e40af",
        secondaryColor: hotel.secondaryColor || "#3b82f6",
        welcomeMessage: hotel.welcomeMessage || "",
        welcomeMessageEn: hotel.welcomeMessageEn || "",
        launcherBackground: hotel.launcherBackground || "",
        weatherCity: (hotel as any).weatherCity || "",
        showWeather: (hotel as any).showWeather !== false,
      });
    }
  }, [hotel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHotel.mutate({
      id: hotelId,
      ...formData,
    });
  };

  const presetColors = [
    { name: "Ocean Blue", primary: "#1e40af", secondary: "#3b82f6" },
    { name: "Royal Purple", primary: "#7c3aed", secondary: "#a78bfa" },
    { name: "Forest Green", primary: "#166534", secondary: "#22c55e" },
    { name: "Sunset Orange", primary: "#c2410c", secondary: "#f97316" },
    { name: "Ruby Red", primary: "#b91c1c", secondary: "#ef4444" },
    { name: "Golden", primary: "#a16207", secondary: "#eab308" },
    { name: "Charcoal", primary: "#27272a", secondary: "#52525b" },
    { name: "Teal", primary: "#0f766e", secondary: "#14b8a6" },
  ];

  if (isLoading) {
    return (
      <CMSDashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CMSDashboardLayout>
    );
  }

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hotel Branding</h1>
          <p className="text-muted-foreground">
            Customize your hotel's TV launcher appearance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Preview
              </CardTitle>
              <CardDescription>See how your TV launcher will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="relative h-64 rounded-xl overflow-hidden bg-cover bg-center"
                style={{ 
                  backgroundImage: formData.launcherBackground 
                    ? `url(${formData.launcherBackground})` 
                    : "linear-gradient(to bottom right, #1e3a5f, #0f172a)"
                }}
              >
                <div className="absolute inset-0 bg-black/30" />
                
                {/* Header Preview */}
                <div className="relative z-10 p-6">
                  <div className="flex items-center gap-3">
                    {formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo" 
                        className="w-12 h-12 rounded-lg object-contain bg-white/90 p-1"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(to bottom right, ${formData.primaryColor}, ${formData.secondaryColor})` 
                        }}
                      >
                        <span className="text-white font-bold text-xl">
                          {formData.hotelName?.charAt(0) || "H"}
                        </span>
                      </div>
                    )}
                    <span className="text-2xl font-bold text-white">
                      {formData.hotelName || "Your Hotel Name"}
                    </span>
                  </div>
                  
                  {/* Welcome Message */}
                  <div className="mt-8 text-center">
                    <h2 
                      className="text-4xl font-bold text-white drop-shadow-lg"
                      style={{ textShadow: `2px 2px 8px ${formData.primaryColor}40` }}
                    >
                      {formData.welcomeMessageEn || formData.welcomeMessage || "WELCOME TO YOUR ROOM"}
                    </h2>
                  </div>
                </div>
                
                {/* App Button Preview */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-3">
                    <div 
                      className="p-4 rounded-xl text-white text-sm font-medium"
                      style={{ 
                        background: `linear-gradient(to bottom right, ${formData.primaryColor}, ${formData.secondaryColor})` 
                      }}
                    >
                      Live TV
                    </div>
                    <div className="p-4 rounded-xl bg-black/60 text-white text-sm font-medium backdrop-blur-sm">
                      YouTube
                    </div>
                    <div className="p-4 rounded-xl bg-black/60 text-white text-sm font-medium backdrop-blur-sm">
                      Netflix
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <Input
                    id="hotelName"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    placeholder="Grand Hotel"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setFormData({ ...formData, logoUrl: ev.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="icon" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                        </span>
                      </Button>
                    </label>
                  </div>
                  {formData.logoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={formData.logoUrl} alt="Logo preview" className="w-12 h-12 object-contain rounded border" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, logoUrl: "" })}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 200x200px PNG with transparent background. Upload or paste URL.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>Choose colors for your TV launcher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Colors */}
              <div>
                <Label className="mb-2 block">Preset Themes</Label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        primaryColor: preset.primary, 
                        secondaryColor: preset.secondary 
                      })}
                      className="flex items-center gap-2 p-2 rounded-lg border hover:border-primary transition-colors"
                    >
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ background: `linear-gradient(to right, ${preset.primary}, ${preset.secondary})` }}
                      />
                      <span className="text-sm">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Welcome Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Welcome Messages
              </CardTitle>
              <CardDescription>Customize the welcome message shown to guests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="welcomeMessage">Welcome Message (Local Language)</Label>
                <Textarea
                  id="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                  placeholder="ยินดีต้อนรับสู่ห้องพักของคุณ"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="welcomeMessageEn">Welcome Message (English)</Label>
                <Textarea
                  id="welcomeMessageEn"
                  value={formData.welcomeMessageEn}
                  onChange={(e) => setFormData({ ...formData, welcomeMessageEn: e.target.value })}
                  placeholder="Welcome to your room"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Launcher Background
              </CardTitle>
              <CardDescription>Set a custom background image for the TV launcher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="launcherBackground">Background Image URL</Label>
                <Input
                  id="launcherBackground"
                  value={formData.launcherBackground}
                  onChange={(e) => setFormData({ ...formData, launcherBackground: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 1920x1080px or larger. Leave empty for default gradient.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weather Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Weather Display
              </CardTitle>
              <CardDescription>Configure weather widget on TV launcher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Weather Widget</Label>
                  <p className="text-xs text-muted-foreground">
                    Display current weather in the launcher header
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showWeather}
                  onChange={(e) => setFormData({ ...formData, showWeather: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <Label htmlFor="weatherCity">Weather City</Label>
                <Input
                  id="weatherCity"
                  value={formData.weatherCity}
                  onChange={(e) => setFormData({ ...formData, weatherCity: e.target.value })}
                  placeholder="Bangkok, Bangkok, TH"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter city name for weather. Example: "Bangkok, TH" or "New York, US"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateHotel.isPending}>
              {updateHotel.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </CMSDashboardLayout>
  );
}
