import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
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
  Volume2,
  VolumeX,
  Power,
  Clock,
  Cloud,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
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
  X,
  AlarmClock,
  CheckCircle,
} from "lucide-react";

// Device ID generator
function generateDeviceId(): string {
  return `TV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
}

// Get or create device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem("tv_device_id");
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem("tv_device_id", deviceId);
  }
  return deviceId;
}

// Icon mapping function
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

// Get icon component by name
function getIconComponent(iconName: string | null, className: string = "w-10 h-10") {
  if (!iconName || !iconMap[iconName]) {
    return <Grid3X3 className={className} />;
  }
  const Icon = iconMap[iconName];
  return <Icon className={className} />;
}

export default function TVLauncher() {
  const [deviceId] = useState(getDeviceId);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedApp, setSelectedApp] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [serviceType, setServiceType] = useState<string>("");
  const [showHotelInfo, setShowHotelInfo] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [language, setLanguage] = useState<string>("en");
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);

  // Translations
  const t = {
    en: {
      welcome: "WELCOME TO YOUR ROOM",
      roomService: "Room Service",
      housekeeping: "Housekeeping",
      wakeup: "Wake-up",
      hotelInfo: "Hotel Info",
      frontDesk: "Front Desk",
      checkoutToday: "Checkout today at 12:00 PM",
      checkoutTomorrow: "Checkout tomorrow at 12:00 PM",
      setWakeup: "Set Wake-up Call",
      wakeupSet: "Wake-up Call Set",
      scheduledCalls: "Scheduled Calls",
      selectTime: "Select Time",
      scheduling: "Scheduling...",
      cancel: "Cancel",
      recurring: "Recurring",
      wifiAccess: "WiFi Access",
      network: "Network",
      password: "Password",
      needAssistance: "Need Assistance?",
      useArrows: "Use arrow keys to navigate • Press Enter to select",
    },
    th: {
      welcome: "ยินดีต้อนรับสู่ห้องพักของคุณ",
      roomService: "บริการห้องอาหาร",
      housekeeping: "แม่บ้าน",
      wakeup: "ปลุก",
      hotelInfo: "ข้อมูลโรงแรม",
      frontDesk: "ฟร้อนท์เดสก์",
      checkoutToday: "เช็คเอาท์วันนี้ เวลา 12:00 น.",
      checkoutTomorrow: "เช็คเอาท์พรุ่งนี้ เวลา 12:00 น.",
      setWakeup: "ตั้งเวลาปลุก",
      wakeupSet: "ตั้งเวลาปลุกแล้ว",
      scheduledCalls: "เวลาปลุกที่ตั้งไว้",
      selectTime: "เลือกเวลา",
      scheduling: "กำลังบันทึก...",
      cancel: "ยกเลิก",
      recurring: "ทุกวัน",
      wifiAccess: "เชื่อมต่อ WiFi",
      network: "เครือข่าย",
      password: "รหัสผ่าน",
      needAssistance: "ต้องการความช่วยเหลือ?",
      useArrows: "ใช้ปุ่มลูกศรเพื่อนำทาง • กด Enter เพื่อเลือก",
    },
    zh: {
      welcome: "欢迎来到您的房间",
      roomService: "客房服务",
      housekeeping: "客房清洁",
      wakeup: "叫醒",
      hotelInfo: "酒店信息",
      frontDesk: "前台",
      checkoutToday: "今天12:00退房",
      checkoutTomorrow: "明天12:00退房",
      setWakeup: "设置叫醒服务",
      wakeupSet: "已设置叫醒",
      scheduledCalls: "已安排的叫醒",
      selectTime: "选择时间",
      scheduling: "安排中...",
      cancel: "取消",
      recurring: "每天",
      wifiAccess: "WiFi连接",
      network: "网络",
      password: "密码",
      needAssistance: "需要帮助?",
      useArrows: "使用方向键导航 • 按Enter选择",
    },
    ja: {
      welcome: "お部屋へようこそ",
      roomService: "ルームサービス",
      housekeeping: "ハウスキーピング",
      wakeup: "モーニングコール",
      hotelInfo: "ホテル情報",
      frontDesk: "フロント",
      checkoutToday: "本日12:00チェックアウト",
      checkoutTomorrow: "明日12:00チェックアウト",
      setWakeup: "モーニングコール設定",
      wakeupSet: "モーニングコール設定済み",
      scheduledCalls: "予約済み",
      selectTime: "時間を選択",
      scheduling: "設定中...",
      cancel: "キャンセル",
      recurring: "毎日",
      wifiAccess: "WiFi接続",
      network: "ネットワーク",
      password: "パスワード",
      needAssistance: "お困りですか?",
      useArrows: "矢印キーで移動 • Enterで選択",
    },
  };

  const currentLang = t[language as keyof typeof t] || t.en;

  // Request pairing code
  const requestCode = trpc.pairing.requestCode.useMutation({
    onSuccess: (data) => {
      toast.success("Pairing code generated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Check pairing status
  const { data: pairingStatus, refetch: refetchStatus } = trpc.pairing.checkStatus.useQuery(
    { deviceId },
    { refetchInterval: 5000 }
  );

  // Heartbeat mutation
  const heartbeat = trpc.pairing.heartbeat.useMutation();

  // Get commands
  const { data: commands } = trpc.pairing.getCommands.useQuery(
    { deviceId },
    { refetchInterval: 3000 }
  );

  // Get hotel data if paired
  const { data: hotelData } = trpc.hotels.getById.useQuery(
    { id: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.hotelId }
  );

  // Get guest info for room
  const { data: guestInfo } = trpc.guestInfo.getByRoomId.useQuery(
    { roomId: pairingStatus?.roomNumber ? parseInt(pairingStatus.roomNumber) : 0, hotelId: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.roomNumber && !!pairingStatus?.hotelId }
  );

  // Get TV channels
  const { data: channels } = trpc.tvChannels.list.useQuery(
    { hotelId: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.hotelId }
  );

  // Get menus
  const { data: menus } = trpc.menuItems.list.useQuery(
    { hotelId: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.hotelId }
  );

  // Get background images
  const { data: backgrounds } = trpc.backgroundImages.list.useQuery(
    { hotelId: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.hotelId }
  );

  // Get TV Apps configuration from CMS
  const { data: tvAppsConfig } = trpc.tvApps.getByHotel.useQuery(
    { hotelId: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.hotelId }
  );

  // Get service menu items
  const { data: serviceMenuItems } = trpc.guestServices.listMenuItems.useQuery(
    { hotelId: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.hotelId && showServiceDialog }
  );

  // Get weather for hotel
  const { data: weatherData } = trpc.publicApi.getWeather.useQuery(
    { hotelId: pairingStatus?.hotelId || 0 },
    { enabled: !!pairingStatus?.hotelId, refetchInterval: 60000 }
  );

  // Wake-up call state
  const [showWakeUpDialog, setShowWakeUpDialog] = useState(false);
  const [wakeUpTime, setWakeUpTime] = useState("07:00");

  // Get wake-up calls for room
  const { data: wakeUpCalls, refetch: refetchWakeUpCalls } = trpc.wakeUpCalls.getByRoom.useQuery(
    { hotelId: pairingStatus?.hotelId || 0, roomNumber: pairingStatus?.roomNumber || "" },
    { enabled: !!pairingStatus?.hotelId && !!pairingStatus?.roomNumber }
  );

  // Create wake-up call mutation
  const createWakeUpCall = trpc.wakeUpCalls.create.useMutation({
    onSuccess: () => {
      toast.success("Wake-up call scheduled");
      setShowWakeUpDialog(false);
      refetchWakeUpCalls();
    },
    onError: () => toast.error("Failed to schedule wake-up call"),
  });

  // Cancel wake-up call mutation
  const cancelWakeUpCall = trpc.wakeUpCalls.cancel.useMutation({
    onSuccess: () => {
      toast.success("Wake-up call cancelled");
      refetchWakeUpCalls();
    },
    onError: () => toast.error("Failed to cancel wake-up call"),
  });

  // Create service request mutation
  const createServiceRequest = trpc.guestServices.createRequest.useMutation({
    onSuccess: () => {
      toast.success("Request submitted successfully");
      setShowServiceDialog(false);
    },
    onError: () => toast.error("Failed to submit request"),
  });

  // Request pairing code on mount
  useEffect(() => {
    requestCode.mutate({
      deviceId,
      deviceName: "Android TV",
      deviceInfo: JSON.stringify({
        model: "Android TV",
        version: "12",
        type: "launcher",
      }),
    });
  }, [deviceId]);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      heartbeat.mutate({ deviceId });
    }, 30000);
    return () => clearInterval(interval);
  }, [deviceId]);

  // Handle commands
  useEffect(() => {
    if (commands?.commands && commands.commands.length > 0) {
      const cmd = commands.commands[0];
      console.log("Received command:", cmd);

      switch (cmd.command) {
        case "power_off":
          // Handle power off
          toast.info("Power off command received");
          break;
        case "restart":
          toast.info("Restart command received");
          break;
        case "volume_up":
        case "volume_down":
        case "mute":
        case "unmute":
          toast.info(`Volume command: ${cmd.command}`);
          break;
      }
    }
  }, [commands]);

  // WebSocket connection
  useEffect(() => {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
    const websocket = new WebSocket(`${wsUrl}?type=device&id=${deviceId}&hotelId=${pairingStatus?.hotelId || ""}`);

    websocket.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    websocket.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [deviceId, pairingStatus?.hotelId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          setSelectedApp((prev) => Math.max(0, prev - 1));
          break;
        case "ArrowRight":
          setSelectedApp((prev) => Math.min(apps.length - 1, prev + 1));
          break;
        case "Enter":
          handleAppSelect(selectedApp);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedApp]);

  const handleAppSelect = (index: number) => {
    const app = apps[index];
    
    // Check if this is a hotel service app
    if (app.appType === "hotel_service" || app.name === "FOOD MENU") {
      setServiceType(app.name === "FOOD MENU" ? "room_service" : "housekeeping");
      setShowServiceDialog(true);
      return;
    }
    
    toast.info(`Opening ${app.name}...`);
    // Here you would launch the actual app
    // If app has a deepLink or packageName, launch it on Android TV
    if (app.deepLink) {
      // Launch via deep link
      console.log("Launch deep link:", app.deepLink);
    } else if (app.packageName) {
      // Launch Android app
      console.log("Launch package:", app.packageName);
    }
  };

  // Default apps when not paired or no configuration
  const defaultApps = [
    { name: "LIVE TV", icon: <Tv className="w-10 h-10" />, route: "tv", id: 0, iconName: "Tv", appType: "live_tv", deepLink: null, packageName: null },
    { name: "RADIO", icon: <Radio className="w-10 h-10" />, route: "radio", id: 1, iconName: "Radio", appType: "radio", deepLink: null, packageName: null },
    { name: "YOUTUBE", icon: <Youtube className="w-10 h-10" />, route: "youtube", id: 2, iconName: "Youtube", appType: "youtube", deepLink: null, packageName: "com.google.android.youtube.tv" },
    { name: "NETFLIX", icon: <Film className="w-10 h-10" />, route: "netflix", id: 3, iconName: "Film", appType: "app", deepLink: null, packageName: "com.netflix.mediaclient" },
    { name: "SPOTIFY", icon: <Music className="w-10 h-10" />, route: "spotify", id: 4, iconName: "Music", appType: "app", deepLink: null, packageName: "com.spotify.tv.android" },
    { name: "FOOD MENU", icon: <UtensilsCrossed className="w-10 h-10" />, route: "menu", id: 5, iconName: "UtensilsCrossed", appType: "hotel_service", deepLink: null, packageName: null },
    { name: "PLACES", icon: <MapPin className="w-10 h-10" />, route: "places", id: 6, iconName: "MapPin", appType: "hotel_service", deepLink: null, packageName: null },
    { name: "ROOMS", icon: <Bed className="w-10 h-10" />, route: "rooms", id: 7, iconName: "Bed", appType: "hotel_service", deepLink: null, packageName: null },
    { name: "ALL APPS", icon: <Grid3X3 className="w-10 h-10" />, route: "apps", id: 8, iconName: "Grid3X3", appType: "app", deepLink: null, packageName: null },
    { name: "SLIDE SHOW", icon: <Image className="w-10 h-10" />, route: "slideshow", id: 9, iconName: "Image", appType: "slideshow", deepLink: null, packageName: null },
    { name: "SETTINGS", icon: <Settings className="w-10 h-10" />, route: "settings", id: 10, iconName: "Settings", appType: "app", deepLink: null, packageName: null },
  ];

  // Use CMS configured apps if available, otherwise use defaults
  const apps = tvAppsConfig && tvAppsConfig.length > 0
    ? tvAppsConfig.map((app) => ({
        id: app.id,
        name: app.customLabel || app.appName,
        icon: app.iconUrl ? (
          <img src={app.iconUrl} alt={app.appName} className="w-10 h-10 object-contain" />
        ) : (
          getIconComponent(app.iconName, "w-10 h-10")
        ),
        route: app.appType,
        appType: app.appType,
        deepLink: app.deepLink,
        packageName: app.packageName,
        iconName: app.iconName,
      }))
    : defaultApps;

  // Get background image - prefer hotel's custom background
  const bgImage = hotelData?.launcherBackground
    ? hotelData.launcherBackground
    : backgrounds && 'data' in backgrounds && backgrounds.data.length > 0
      ? backgrounds.data[0].imageUrl
      : "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920";

  // Get branding colors
  const primaryColor = hotelData?.primaryColor || "#1e40af";
  const secondaryColor = hotelData?.secondaryColor || "#3b82f6";

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between p-8">
        {/* Left - Logo & Welcome */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {hotelData?.logoUrl ? (
              <img 
                src={hotelData.logoUrl} 
                alt={hotelData.hotelName || "Hotel"} 
                className="w-12 h-12 rounded-lg object-contain bg-white/90 p-1"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` }}
              >
                <Tv className="w-7 h-7 text-white" />
              </div>
            )}
            <span className="text-2xl font-bold text-white">
              {hotelData?.hotelName || "HOTEL TV"}
            </span>
          </div>

          {pairingStatus?.isPaired ? (
            <div className="mt-4">
              <p className="text-2xl text-white font-medium">
                {hotelData?.welcomeMessageEn || hotelData?.welcomeMessage || "WELCOME"}{guestInfo?.guestName ? `, ${guestInfo.guestName.toUpperCase()}` : ""}
              </p>
              {pairingStatus.roomNumber && (
                <p className="text-xl text-white/80">ROOM {pairingStatus.roomNumber}</p>
              )}
            </div>
          ) : (
            <div className="mt-6 p-6 bg-black/60 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-white/80 text-lg mb-3">To connect this device:</p>
              <div className="flex items-center gap-4">
                <p className="text-white/60 text-sm">1. Go to CMS → Devices</p>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-white/60 text-sm">2. Enter this code:</p>
                <div className="flex gap-2">
                  {requestCode.data?.pairingCode?.split("").map((digit, i) => (
                    <div
                      key={i}
                      className="w-12 h-14 bg-white rounded-lg flex items-center justify-center"
                    >
                      <span className="text-3xl font-bold text-slate-900">{digit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right - Time, Weather & Status */}
        <div className="text-right space-y-2">
          <div className="flex items-center gap-6 justify-end">
            {/* Weather Widget */}
            {weatherData && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                <Cloud className="w-5 h-5 text-white" />
                <span className="text-white text-sm">{weatherData.temp}°C</span>
                <span className="text-white/60 text-xs">{weatherData.city}</span>
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <Wifi className={`w-5 h-5 ${isConnected ? "text-green-400" : "text-red-400"}`} />
              <span className="text-white/80 text-sm">
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>

            {/* Mail Icon */}
            <button 
              onClick={() => setShowMessages(true)}
              className="relative hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <Mail className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </button>

            {/* Hotel Info Button */}
            <button
              onClick={() => setShowHotelInfo(true)}
              className="hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <Info className="w-6 h-6 text-white" />
            </button>

            {/* Language Button */}
            <button
              onClick={() => setShowLanguageDialog(true)}
              className="hover:bg-white/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="text-white font-medium text-sm uppercase">{language}</span>
            </button>
          </div>

          {/* Time */}
          <p className="text-5xl font-light text-white">{formatTime(currentTime)}</p>
          <p className="text-lg text-white/70">{formatDate(currentTime)}</p>

          {/* Device ID */}
          <p className="text-xs text-white/50 font-mono">{deviceId}</p>
        </div>
      </div>

      {/* Room Info Panel (when paired) */}
      {pairingStatus?.isPaired && guestInfo && (
        <div className="absolute top-24 right-8 z-10">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-white/80" />
              <span className="text-white font-medium">{guestInfo.guestName}</span>
            </div>
            {guestInfo.checkOutDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-white/80" />
                <span className="text-white/70 text-sm">
                  Check-out: {new Date(guestInfo.checkOutDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {/* Checkout Reminder */}
            {guestInfo.checkOutDate && (() => {
              const checkoutDate = new Date(guestInfo.checkOutDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              checkoutDate.setHours(0, 0, 0, 0);
              const daysUntilCheckout = Math.ceil((checkoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysUntilCheckout <= 1) {
                return (
                  <div className="mt-2 p-2 bg-orange-500/30 rounded-lg border border-orange-400/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-300" />
                      <span className="text-orange-200 text-sm font-medium">
                        {daysUntilCheckout === 0 ? "Checkout today at 12:00 PM" : "Checkout tomorrow at 12:00 PM"}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-white/80" />
              <span className="text-white/70 text-sm">{hotelData?.supportPhone || "Front Desk"}</span>
            </div>

            {/* Wake-up Call Button */}
            <button
              onClick={() => setShowWakeUpDialog(true)}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg py-2 transition-colors"
            >
              <AlarmClock className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-sm font-medium">
                {wakeUpCalls && wakeUpCalls.some(c => c.status === "pending") 
                  ? "Wake-up Call Set" 
                  : "Set Wake-up Call"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Center - Welcome Message */}
      {pairingStatus?.isPaired && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <h1 
            className="text-6xl font-bold text-white drop-shadow-lg"
            style={{ textShadow: `2px 2px 8px ${primaryColor}40` }}
          >
            {hotelData?.welcomeMessageEn || hotelData?.welcomeMessage || "WELCOME TO YOUR ROOM"}
          </h1>
        </div>
      )}

      {/* Bottom - App Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center justify-center gap-2">
            {/* Left Arrow */}
            <button
              className="p-3 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedApp(Math.max(0, selectedApp - 1))}
            >
              <span className="text-2xl">{"<"}</span>
            </button>

            {/* Apps */}
            <div className="flex gap-4">
              {apps.map((app, index) => (
                <button
                  key={app.name}
                  onClick={() => setSelectedApp(index)}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all ${
                    selectedApp === index
                      ? "text-white scale-110 shadow-xl"
                      : "text-white hover:bg-white/10"
                  }`}
                  style={selectedApp === index ? { 
                    background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` 
                  } : {}}
                >
                  <div className={`${selectedApp === index ? "text-white" : "text-white"}`}>
                    {app.icon}
                  </div>
                  <span className="text-sm font-medium">{app.name}</span>
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              className="p-3 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedApp(Math.min(apps.length - 1, selectedApp + 1))}
            >
              <span className="text-2xl">{">"}</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        {pairingStatus?.isPaired && (
          <div className="mt-4 px-4">
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setServiceType("room_service");
                  setShowServiceDialog(true);
                }}
                className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors"
              >
                <UtensilsCrossed className="w-6 h-6 text-orange-400" />
                <span className="text-xs text-white/80">{currentLang.roomService}</span>
              </button>
              <button
                onClick={() => {
                  setServiceType("housekeeping");
                  setShowServiceDialog(true);
                }}
                className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors"
              >
                <Bed className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-white/80">{currentLang.housekeeping}</span>
              </button>
              <button
                onClick={() => setShowWakeUpDialog(true)}
                className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors"
              >
                <AlarmClock className="w-6 h-6 text-yellow-400" />
                <span className="text-xs text-white/80">{currentLang.wakeup}</span>
              </button>
              <button
                onClick={() => setShowHotelInfo(true)}
                className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors"
              >
                <Info className="w-6 h-6 text-green-400" />
                <span className="text-xs text-white/80">Hotel Info</span>
              </button>
              <button
                onClick={() => {
                  if (hotelData?.supportPhone) {
                    toast.info(`Call Front Desk: ${hotelData.supportPhone}`);
                  }
                }}
                className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors"
              >
                <Phone className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-white/80">Front Desk</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/70">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">50%</span>
            </div>
            {weatherData && (
              <div className="flex items-center gap-2 text-white/70">
                <Cloud className="w-4 h-4" />
                <span className="text-sm">{weatherData.temp}°C • {weatherData.description}</span>
              </div>
            )}
          </div>
          <div className="text-white/50 text-xs">
            Use arrow keys to navigate • Press Enter to select
          </div>
        </div>
      </div>

      {/* Service Request Dialog */}
      {showServiceDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div 
            className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-white/20"
            style={{ background: `linear-gradient(to bottom right, ${primaryColor}20, ${secondaryColor}10)` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {serviceType === "room_service" ? "🍽️ Room Service" : "🧹 Housekeeping"}
              </h2>
              <button 
                onClick={() => setShowServiceDialog(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {serviceType === "room_service" ? (
              <div className="space-y-4">
                <p className="text-white/70 mb-4">Select items to order:</p>
                
                {serviceMenuItems?.filter(i => i.category === "food" || i.category === "beverage").map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-white/60 text-sm">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-bold">${Number(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {(!serviceMenuItems || serviceMenuItems.filter(i => i.category === "food" || i.category === "beverage").length === 0) && (
                  <p className="text-white/50 text-center py-8">No menu items available</p>
                )}

                <button
                  onClick={() => {
                    createServiceRequest.mutate({
                      hotelId: pairingStatus?.hotelId || 0,
                      roomNumber: pairingStatus?.roomNumber || "",
                      guestName: guestInfo?.guestName,
                      requestType: "room_service",
                      description: "Room service order from TV",
                      priority: "normal",
                    });
                  }}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg mt-4 transition-all hover:scale-105"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                >
                  Submit Order
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/70 mb-4">Select a service to request:</p>
                
                {[
                  { label: "Clean Room", value: "clean_room" },
                  { label: "Extra Towels", value: "extra_towels" },
                  { label: "Extra Pillows", value: "extra_pillows" },
                  { label: "Toiletries", value: "toiletries" },
                  { label: "Other Request", value: "other" },
                ].map((service) => (
                  <button
                    key={service.value}
                    onClick={() => {
                      createServiceRequest.mutate({
                        hotelId: pairingStatus?.hotelId || 0,
                        roomNumber: pairingStatus?.roomNumber || "",
                        guestName: guestInfo?.guestName,
                        requestType: "housekeeping",
                        description: service.label,
                        priority: "normal",
                      });
                    }}
                    className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-left text-white transition-all"
                  >
                    {service.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wake-up Call Dialog */}
      {showWakeUpDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div 
            className="bg-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20"
            style={{ background: `linear-gradient(to bottom right, ${primaryColor}20, ${secondaryColor}10)` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Wake-up Call
              </h2>
              <button
                onClick={() => setShowWakeUpDialog(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {/* Current Wake-up Calls */}
            {wakeUpCalls && wakeUpCalls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white/70 text-sm mb-2">Scheduled Calls</h3>
                <div className="space-y-2">
                  {wakeUpCalls.filter(c => c.status === "pending").map((call) => (
                    <div key={call.id} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">
                          {new Date(call.scheduledTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {call.recurring && (
                          <span className="text-xs text-white/50">Recurring</span>
                        )}
                      </div>
                      <button
                        onClick={() => cancelWakeUpCall.mutate({ id: call.id })}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Set New Wake-up Call */}
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Select Time</label>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(e) => setWakeUpTime(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white text-2xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  // Create date for tomorrow at selected time
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const [hours, minutes] = wakeUpTime.split(":");
                  tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                  createWakeUpCall.mutate({
                    hotelId: pairingStatus?.hotelId || 0,
                    roomNumber: pairingStatus?.roomNumber || "",
                    scheduledTime: tomorrow.toISOString(),
                    alarmType: "tv",
                  });
                }}
                disabled={createWakeUpCall.isPending}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
              >
                {createWakeUpCall.isPending ? "Scheduling..." : "Set Wake-up Call"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Info Dialog */}
      {showHotelInfo && hotelData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div 
            className="bg-slate-900 rounded-2xl p-8 max-w-lg w-full mx-4 border border-white/20"
            style={{ background: `linear-gradient(to bottom right, ${primaryColor}20, ${secondaryColor}10)` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Info className="w-6 h-6" />
                Hotel Information
              </h2>
              <button
                onClick={() => setShowHotelInfo(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Hotel Logo & Name */}
              <div className="flex items-center gap-4">
                {hotelData.logoUrl ? (
                  <img src={hotelData.logoUrl} alt={hotelData.hotelName} className="w-16 h-16 object-contain rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                    <Home className="w-8 h-8 text-white/50" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{hotelData.hotelName}</h3>
                  {hotelData.city && (
                    <p className="text-white/60 text-sm">{hotelData.city}, {hotelData.country}</p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                {hotelData.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-white/60 mt-0.5" />
                    <span className="text-white/80 text-sm">{hotelData.address}</span>
                  </div>
                )}
                {hotelData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-white/60" />
                    <span className="text-white/80 text-sm">{hotelData.phone}</span>
                  </div>
                )}
                {hotelData.email && (
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-white/60" />
                    <span className="text-white/80 text-sm">{hotelData.email}</span>
                  </div>
                )}
              </div>

              {/* WiFi Info */}
              {hotelData.wifiSSID && (
                <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300 font-medium">WiFi Access</span>
                  </div>
                  <div className="text-white/80 text-sm">
                    <p>Network: <span className="text-white font-mono">{hotelData.wifiSSID}</span></p>
                    {hotelData.wifiPassword && (
                      <p>Password: <span className="text-white font-mono">{hotelData.wifiPassword}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Support */}
              {(hotelData.supportPhone || hotelData.supportEmail) && (
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-medium">Need Assistance?</span>
                  </div>
                  <div className="text-white/80 text-sm">
                    {hotelData.supportPhone && <p>Front Desk: {hotelData.supportPhone}</p>}
                    {hotelData.supportEmail && <p>Email: {hotelData.supportEmail}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Dialog */}
      {showLanguageDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div 
            className="bg-slate-900 rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/20"
            style={{ background: `linear-gradient(to bottom right, ${primaryColor}20, ${secondaryColor}10)` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Language</h2>
              <button
                onClick={() => setShowLanguageDialog(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { code: "en", name: "English", flag: "🇺🇸" },
                { code: "th", name: "ไทย", flag: "🇹🇭" },
                { code: "zh", name: "中文", flag: "🇨🇳" },
                { code: "ja", name: "日本語", flag: "🇯🇵" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageDialog(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    language === lang.code
                      ? "bg-white/20 border-2 border-white/40"
                      : "bg-white/5 hover:bg-white/10 border-2 border-transparent"
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="text-white font-medium text-lg">{lang.name}</span>
                  {language === lang.code && (
                    <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
