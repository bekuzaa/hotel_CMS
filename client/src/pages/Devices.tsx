import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Power,
  PowerOff,
  RotateCcw,
  Volume2,
  VolumeX,
  Monitor,
  Wifi,
  WifiOff,
  Plus,
  RefreshCw,
  Link,
  Link2,
  Link2Off,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Devices() {
  const { user } = useAuth();
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [showPairingDialog, setShowPairingDialog] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [deviceName, setDeviceName] = useState("");

  const isSuperAdmin = user?.role === "superAdmin";
  const isHotelAdmin = user?.role === "hotelAdmin";

  // Get hotels list for Super Admin
  const hotelsList = trpc.hotels.getAll.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  // Determine hotelId
  const hotelId = isSuperAdmin ? selectedHotelId : (isHotelAdmin ? user?.hotelId : user?.hotelId);

  // Get devices list
  const devicesList = trpc.devices.list.useQuery(
    { hotelId: hotelId || undefined, limit: 100 },
    { enabled: !!hotelId || !isSuperAdmin }
  );

  // Get device stats
  const deviceStats = trpc.devices.getStats.useQuery(
    { hotelId: hotelId || undefined },
    { enabled: !!hotelId || !isSuperAdmin }
  );

  // Mutations
  const setVolume = trpc.devices.setVolume.useMutation({
    onSuccess: () => {
      toast.success("Volume updated");
      devicesList.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const toggleMute = trpc.devices.toggleMute.useMutation({
    onSuccess: (data) => {
      toast.success(data.isMuted ? "Device muted" : "Device unmuted");
      devicesList.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const powerOff = trpc.devices.powerOff.useMutation({
    onSuccess: () => {
      toast.success("Power off command sent");
      devicesList.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const powerOn = trpc.devices.powerOn.useMutation({
    onSuccess: () => {
      toast.success("Power on command sent");
      devicesList.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const restart = trpc.devices.restart.useMutation({
    onSuccess: () => {
      toast.success("Restart command sent");
      devicesList.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const bulkPowerOff = trpc.devices.bulkPowerOff.useMutation({
    onSuccess: () => {
      toast.success("All devices powered off");
      devicesList.refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Pairing mutations
  const validateCode = trpc.pairing.validateCode.useQuery(
    { code: pairingCode },
    { enabled: pairingCode.length === 6 }
  );

  const pairDevice = trpc.pairing.pairDevice.useMutation({
    onSuccess: () => {
      toast.success("Device paired successfully!");
      setShowPairingDialog(false);
      setPairingCode("");
      setRoomNumber("");
      setDeviceName("");
      devicesList.refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const unpairDevice = trpc.pairing.unpairDevice.useMutation({
    onSuccess: () => {
      toast.success("Device unpaired");
      devicesList.refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handlePairDevice = () => {
    if (!hotelId || pairingCode.length !== 6) return;
    pairDevice.mutate({
      code: pairingCode,
      hotelId,
      roomNumber: roomNumber || undefined,
      deviceName: deviceName || undefined,
    });
  };

  const handleVolumeChange = (deviceId: number, volume: number) => {
    setVolume.mutate({ id: deviceId, volume });
  };

  const handlePowerOff = (deviceId: number) => {
    if (confirm("Are you sure you want to power off this device?")) {
      powerOff.mutate({ id: deviceId });
    }
  };

  const handleRestart = (deviceId: number) => {
    if (confirm("Are you sure you want to restart this device?")) {
      restart.mutate({ id: deviceId });
    }
  };

  const handleBulkPowerOff = () => {
    if (!hotelId) return;
    if (confirm("Are you sure you want to power off ALL devices?")) {
      bulkPowerOff.mutate({ hotelId });
    }
  };

  const formatLastSync = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Device Management</h2>
            <p className="text-slate-600 mt-1">Monitor and control TV devices</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => devicesList.refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowPairingDialog(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Link2 className="w-4 h-4" />
              Pair New Device
            </Button>
            {hotelId && (
              <Button
                variant="destructive"
                onClick={handleBulkPowerOff}
                disabled={bulkPowerOff.isPending}
                className="gap-2"
              >
                <PowerOff className="w-4 h-4" />
                Power Off All
              </Button>
            )}
          </div>
        </div>

        {/* Hotel Selector for Super Admin */}
        {isSuperAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Select Hotel:</label>
                <Select
                  value={selectedHotelId?.toString() || ""}
                  onValueChange={(value) => setSelectedHotelId(parseInt(value))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelsList.data?.map((hotel: any) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.hotelName}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Devices</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {deviceStats.data?.total || 0}
                  </p>
                </div>
                <Monitor className="w-10 h-10 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Online</p>
                  <p className="text-3xl font-bold text-green-600">
                    {deviceStats.data?.online || 0}
                  </p>
                </div>
                <Wifi className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Offline</p>
                  <p className="text-3xl font-bold text-red-600">
                    {deviceStats.data?.offline || 0}
                  </p>
                </div>
                <WifiOff className="w-10 h-10 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Powered On</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {deviceStats.data?.poweredOn || 0}
                  </p>
                </div>
                <Power className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices List */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {devicesList.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading devices...</div>
            ) : devicesList.data && devicesList.data.length > 0 ? (
              <div className="space-y-4">
                {devicesList.data.map((device: any) => (
                  <div
                    key={device.id}
                    className={`p-4 rounded-lg border ${
                      device.isOnline
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Device Icon */}
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            device.isOnline
                              ? device.isPoweredOn
                                ? "bg-green-200"
                                : "bg-slate-200"
                              : "bg-red-200"
                          }`}
                        >
                          <Monitor
                            className={`w-6 h-6 ${
                              device.isOnline
                                ? device.isPoweredOn
                                  ? "text-green-700"
                                  : "text-slate-500"
                                : "text-red-600"
                            }`}
                          />
                        </div>

                        {/* Device Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {device.deviceName || `Device ${device.deviceId.slice(-6)}`}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                device.isOnline
                                  ? "bg-green-200 text-green-800"
                                  : "bg-red-200 text-red-800"
                              }`}
                            >
                              {device.isOnline ? "Online" : "Offline"}
                            </span>
                            {device.isMuted && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                                Muted
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Room: {device.roomNumber || "N/A"} • Device ID: {device.deviceId}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Last sync: {formatLastSync(device.lastSyncTime)} •
                            Version: {device.currentVersion || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex items-center gap-4">
                        {/* Power Status */}
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Power</p>
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              device.isPoweredOn ? "bg-green-100" : "bg-slate-200"
                            }`}
                          >
                            <Power
                              className={`w-5 h-5 ${
                                device.isPoweredOn ? "text-green-600" : "text-slate-400"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Volume Control */}
                        <div className="min-w-[150px]">
                          <p className="text-xs text-slate-500 mb-1">
                            Volume: {device.volume}%
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMute.mutate({ id: device.id })}
                              disabled={!device.isOnline || toggleMute.isPending}
                            >
                              {device.isMuted ? (
                                <VolumeX className="w-4 h-4 text-red-500" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Slider
                              value={[device.volume]}
                              onValueChange={(value) => handleVolumeChange(device.id, value[0])}
                              max={100}
                              step={1}
                              disabled={!device.isOnline}
                              className="w-24"
                            />
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex gap-1">
                          {device.isPoweredOn ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePowerOff(device.id)}
                              disabled={!device.isOnline || powerOff.isPending}
                              className="gap-1"
                            >
                              <PowerOff className="w-4 h-4" />
                              Off
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => powerOn.mutate({ id: device.id })}
                              disabled={!device.isOnline || powerOn.isPending}
                              className="gap-1"
                            >
                              <Power className="w-4 h-4" />
                              On
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestart(device.id)}
                            disabled={!device.isOnline || restart.isPending}
                            className="gap-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restart
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                <Monitor className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No devices found.</p>
                {isSuperAdmin && !selectedHotelId && (
                  <p className="text-sm mt-2">Please select a hotel to view devices.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pair Device Dialog */}
        <Dialog open={showPairingDialog} onOpenChange={setShowPairingDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Pair New Device
              </DialogTitle>
              <DialogDescription>
                Enter the 6-character code displayed on your TV device to pair it with this hotel.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pairingCode">Pairing Code</Label>
                <Input
                  id="pairingCode"
                  placeholder="Enter 6-character code (e.g., A3B7X9)"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest uppercase"
                  maxLength={6}
                />
              </div>

              {validateCode.data?.valid && validateCode.data.device && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm font-medium text-green-800">Device Found!</p>
                  <p className="text-xs text-green-600 mt-1">
                    {validateCode.data.device.deviceName}
                  </p>
                </div>
              )}

              {pairingCode.length === 6 && !validateCode.data?.valid && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">Invalid or expired code</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number (Optional)</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name (Optional)</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., Room 101 TV"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              <Button
                onClick={handlePairDevice}
                disabled={!validateCode.data?.valid || pairDevice.isPending}
                className="w-full"
              >
                {pairDevice.isPending ? "Pairing..." : "Pair Device"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </CMSDashboardLayout>
  );
}
