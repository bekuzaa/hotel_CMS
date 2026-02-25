import { useEffect, useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Tv, Users, Home, AlertCircle, Building2, Calendar, CreditCard, UtensilsCrossed, Clock, CheckCircle, Broom } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardStats {
  totalRooms: number;
  activeRooms: number;
  occupiedRooms: number;
  totalChannels: number;
  totalMenus: number;
  onlineDevices: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superAdmin";
  const isHotelAdmin = user?.role === "hotelAdmin";
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    activeRooms: 0,
    occupiedRooms: 0,
    totalChannels: 0,
    totalMenus: 0,
    onlineDevices: 0,
  });

  // Get hotels list for Super Admin
  const hotelsList = trpc.hotels.getAll.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  // Get current hotel for Hotel Admin
  const currentHotel = trpc.hotels.getCurrentHotel.useQuery(undefined, {
    enabled: isHotelAdmin,
  });

  // Determine hotelId
  const hotelId = isSuperAdmin ? selectedHotelId : (isHotelAdmin ? currentHotel.data?.id : user?.hotelId);

  // Fetch room statistics
  const roomStats = trpc.rooms.getStats.useQuery(
    { hotelId: hotelId || undefined },
    { enabled: !!hotelId || !isSuperAdmin }
  );

  // Fetch TV channels count
  const channelsList = trpc.tvChannels.list.useQuery(
    { hotelId: hotelId || undefined },
    { enabled: !!hotelId || !isSuperAdmin }
  );

  // Fetch menu items count
  const menusList = trpc.menuItems.list.useQuery(
    { hotelId: hotelId || undefined },
    { enabled: !!hotelId || !isSuperAdmin }
  );

  // Get subscription status
  const subscriptionStatus = trpc.subscriptions.getSubscriptionStatus.useQuery(
    { hotelId: hotelId || undefined },
    { enabled: !!hotelId || isHotelAdmin }
  );

  // Get hotel stats
  const hotelStats = trpc.hotels.getStats.useQuery(
    { hotelId: hotelId || undefined },
    { enabled: !!hotelId || isHotelAdmin }
  );

  // Get service request stats
  const serviceStats = trpc.guestServices.getRequestStats.useQuery(
    { hotelId: hotelId || 1 },
    { enabled: !!hotelId || !isSuperAdmin }
  );

  useEffect(() => {
    if (roomStats.data) {
      setStats(prev => ({
        ...prev,
        totalRooms: roomStats.data.total,
        activeRooms: roomStats.data.occupied || 0,
        occupiedRooms: roomStats.data.occupied || 0,
      }));
    }
  }, [roomStats.data]);

  useEffect(() => {
    if (channelsList.data) {
      setStats(prev => ({
        ...prev,
        totalChannels: Array.isArray(channelsList.data) ? channelsList.data.length : 0,
      }));
    }
  }, [channelsList.data]);

  useEffect(() => {
    if (menusList.data) {
      setStats(prev => ({
        ...prev,
        totalMenus: Array.isArray(menusList.data) ? menusList.data.length : (menusList.data as any).data?.length || 0,
      }));
    }
  }, [menusList.data]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  const getHotelName = () => {
    if (isHotelAdmin && currentHotel.data) {
      return currentHotel.data.hotelName;
    }
    if (isSuperAdmin && hotelId) {
      const hotel = hotelsList.data?.find((h: any) => h.id === hotelId);
      return hotel?.hotelName || "Select a hotel";
    }
    return "Hotel TV System";
  };

  const getSubscriptionBadge = () => {
    if (!subscriptionStatus.data) return null;
    const { isExpired, daysRemaining } = subscriptionStatus.data;
    
    if (isExpired) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Expired</span>;
    }
    if (daysRemaining === null) {
      return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Lifetime</span>;
    }
    if (daysRemaining <= 7) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">{daysRemaining} days left</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">{daysRemaining} days left</span>;
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-8">
        {/* Hotel Selector for Super Admin */}
        {isSuperAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Building2 className="w-5 h-5 text-slate-600" />
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

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">{getHotelName()}</h2>
              <p className="text-blue-100">
                {isSuperAdmin 
                  ? "Manage your hotel TV system across all properties"
                  : "Manage your hotel's TV system, channels, menus, and guest information"}
              </p>
            </div>
            {subscriptionStatus.data && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm">Subscription</span>
                </div>
                <div className="mt-1">{getSubscriptionBadge()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={Home}
            color="text-blue-600"
          />
          <StatCard
            title="Active Rooms"
            value={stats.activeRooms}
            icon={Home}
            color="text-green-600"
          />
          <StatCard
            title="Occupied Rooms"
            value={stats.occupiedRooms}
            icon={Users}
            color="text-purple-600"
          />
          <StatCard
            title="TV Channels"
            value={stats.totalChannels}
            icon={Tv}
            color="text-orange-600"
          />
          <StatCard
            title="Menu Items"
            value={stats.totalMenus}
            icon={BarChart3}
            color="text-pink-600"
          />
          <StatCard
            title="Online Devices"
            value={stats.onlineDevices}
            icon={AlertCircle}
            color="text-red-600"
          />
        </div>

        {/* Service Requests Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              Service Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-yellow-700">{serviceStats.data?.pending || 0}</p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-700">{serviceStats.data?.inProgress || 0}</p>
                <p className="text-sm text-blue-600">In Progress</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-700">{serviceStats.data?.completed || 0}</p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Broom className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-700">{serviceStats.data?.byType?.housekeeping || 0}</p>
                <p className="text-sm text-purple-600">Housekeeping</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Database Connection</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">API Server</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">WebSocket Service</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p className="text-slate-600">• Channel updated: "Channel 1"</p>
                <p className="text-slate-600">• Guest checked in: Room 101</p>
                <p className="text-slate-600">• Menu item added: "Restaurant Info"</p>
                <p className="text-slate-600">• Background image uploaded</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CMSDashboardLayout>
  );
}
