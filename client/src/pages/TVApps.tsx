import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  Tv,
  Radio,
  Youtube,
  UtensilsCrossed,
  MapPin,
  Bed,
  Grid3X3,
  Image,
  Settings,
  Wifi,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Cloud,
  Music,
  Film,
  Camera,
  ShoppingBag,
  Dumbbell,
  Car,
  Plane,
  Heart,
  Star,
  Home,
  User,
  Info,
  HelpCircle,
  Bell,
  Airplay,
  LucideIcon,
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Tv,
  Radio,
  Youtube,
  UtensilsCrossed,
  MapPin,
  Bed,
  Grid3X3,
  Image,
  Settings,
  Wifi,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Cloud,
  Music,
  Film,
  Camera,
  ShoppingBag,
  Dumbbell,
  Car,
  Plane,
  Heart,
  Star,
  Home,
  User,
  Info,
  HelpCircle,
  Bell,
  Airplay,
};

type AppType = "live_tv" | "youtube" | "app" | "url" | "slideshow" | "radio" | "hotel_service";

interface AppFormData {
  appName: string;
  appType: AppType;
  packageName: string;
  deepLink: string;
  iconUrl: string;
  iconName: string;
  customLabel: string;
  isVisible: boolean;
}

const defaultFormData: AppFormData = {
  appName: "",
  appType: "app",
  packageName: "",
  deepLink: "",
  iconUrl: "",
  iconName: "Grid3X3",
  customLabel: "",
  isVisible: true,
};

export default function TVApps() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<number | null>(null);
  const [editingApp, setEditingApp] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<AppFormData>(defaultFormData);

  // Set hotel ID from user
  useEffect(() => {
    if (user?.hotelId) {
      setHotelId(user.hotelId);
    } else if (user?.role === "superAdmin") {
      // Super admin needs to select hotel - for now default to 1
      setHotelId(1);
    }
  }, [user]);

  // Get TV apps
  const { data: apps, refetch, isLoading } = trpc.tvApps.list.useQuery(
    { hotelId: hotelId || 0 },
    { enabled: !!hotelId }
  );

  // Get available icons
  const { data: availableIcons } = trpc.tvApps.getAvailableIcons.useQuery();

  // Mutations
  const createMutation = trpc.tvApps.create.useMutation({
    onSuccess: () => {
      toast.success("App created successfully");
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.tvApps.update.useMutation({
    onSuccess: () => {
      toast.success("App updated successfully");
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.tvApps.delete.useMutation({
    onSuccess: () => {
      toast.success("App deleted successfully");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const initializeMutation = trpc.tvApps.initializeDefaults.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Default apps initialized");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetMutation = trpc.tvApps.resetToDefaults.useMutation({
    onSuccess: () => {
      toast.success("Apps reset to defaults");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const reorderMutation = trpc.tvApps.reorder.useMutation({
    onSuccess: () => {
      toast.success("Apps reordered");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setShowDialog(false);
    setEditingApp(null);
    setFormData(defaultFormData);
  };

  const handleEdit = (app: any) => {
    setEditingApp(app.id);
    setFormData({
      appName: app.appName,
      appType: app.appType,
      packageName: app.packageName || "",
      deepLink: app.deepLink || "",
      iconUrl: app.iconUrl || "",
      iconName: app.iconName || "Grid3X3",
      customLabel: app.customLabel || "",
      isVisible: app.isVisible,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!hotelId) return;

    if (editingApp) {
      updateMutation.mutate({
        id: editingApp,
        ...formData,
      });
    } else {
      createMutation.mutate({
        hotelId,
        ...formData,
        displayOrder: apps?.length || 0,
      });
    }
  };

  const handleToggleVisibility = (app: any) => {
    updateMutation.mutate({
      id: app.id,
      isVisible: !app.isVisible,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this app?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleMoveUp = (app: any, index: number) => {
    if (index === 0 || !apps) return;
    const newOrder = [...apps];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderMutation.mutate({
      hotelId: hotelId || 0,
      appIds: newOrder.map((a) => a.id),
    });
  };

  const handleMoveDown = (app: any, index: number) => {
    if (!apps || index === apps.length - 1) return;
    const newOrder = [...apps];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderMutation.mutate({
      hotelId: hotelId || 0,
      appIds: newOrder.map((a) => a.id),
    });
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) {
      return <Grid3X3 className="w-5 h-5" />;
    }
    const Icon = iconMap[iconName];
    return <Icon className="w-5 h-5" />;
  };

  const getAppTypeLabel = (type: AppType) => {
    const labels: Record<AppType, string> = {
      live_tv: "Live TV",
      youtube: "YouTube",
      app: "Android App",
      url: "URL/Website",
      slideshow: "Slideshow",
      radio: "Radio",
      hotel_service: "Hotel Service",
    };
    return labels[type];
  };

  if (!hotelId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please select a hotel to manage TV apps.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TV Apps Configuration</h1>
          <p className="text-muted-foreground">
            Configure which apps appear on the Android TV launcher
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => initializeMutation.mutate({ hotelId })}
            disabled={initializeMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Initialize Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("This will reset all apps to defaults. Continue?")) {
                resetMutation.mutate({ hotelId });
              }
            }}
            disabled={resetMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add App
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Launcher Apps</CardTitle>
          <CardDescription>
            Drag to reorder or click to edit. Apps will appear in this order on the TV launcher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : apps && apps.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12">Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Package/Link</TableHead>
                  <TableHead className="w-24">Visible</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app, index) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveUp(app, index)}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveDown(app, index)}
                          disabled={index === apps.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt={app.appName} className="w-8 h-8 object-contain" />
                      ) : (
                        getIconComponent(app.iconName)
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{app.customLabel || app.appName}</div>
                        {app.customLabel && (
                          <div className="text-xs text-muted-foreground">{app.appName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getAppTypeLabel(app.appType as AppType)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {app.packageName || app.deepLink || "-"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={app.isVisible}
                        onCheckedChange={() => handleToggleVisibility(app)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(app)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(app.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No apps configured yet.</p>
              <Button
                variant="link"
                onClick={() => initializeMutation.mutate({ hotelId })}
                className="mt-2"
              >
                Initialize default apps
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingApp ? "Edit App" : "Add App"}</DialogTitle>
            <DialogDescription>
              Configure the app settings for the TV launcher.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name *</Label>
              <Input
                id="appName"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="e.g., LIVE TV, YouTube, Netflix"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customLabel">Custom Display Label</Label>
              <Input
                id="customLabel"
                value={formData.customLabel}
                onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                placeholder="Optional: Override display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appType">App Type *</Label>
              <Select
                value={formData.appType}
                onValueChange={(value) => setFormData({ ...formData, appType: value as AppType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live_tv">Live TV</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="app">Android App</SelectItem>
                  <SelectItem value="url">URL/Website</SelectItem>
                  <SelectItem value="slideshow">Slideshow</SelectItem>
                  <SelectItem value="radio">Radio</SelectItem>
                  <SelectItem value="hotel_service">Hotel Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.appType === "app" && (
              <div className="space-y-2">
                <Label htmlFor="packageName">Android Package Name</Label>
                <Input
                  id="packageName"
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  placeholder="e.g., com.netflix.mediaclient"
                />
              </div>
            )}
            {formData.appType === "url" && (
              <div className="space-y-2">
                <Label htmlFor="deepLink">URL</Label>
                <Input
                  id="deepLink"
                  value={formData.deepLink}
                  onChange={(e) => setFormData({ ...formData, deepLink: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="iconName">Icon</Label>
              <Select
                value={formData.iconName}
                onValueChange={(value) => setFormData({ ...formData, iconName: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableIcons?.map((icon: any) => (
                    <SelectItem key={icon.name} value={icon.name}>
                      <div className="flex items-center gap-2">
                        {getIconComponent(icon.name)}
                        <span>{icon.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Custom Icon URL</Label>
              <Input
                id="iconUrl"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                placeholder="https://example.com/icon.png"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Use a custom icon image instead of the default icon.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isVisible">Visible on Launcher</Label>
              <Switch
                id="isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.appName || createMutation.isPending || updateMutation.isPending}
            >
              {editingApp ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
