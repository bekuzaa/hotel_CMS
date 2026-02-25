import { useState, useEffect, useRef } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Broom,
  Wrench,
  Shirt,
  AlarmClock,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Eye,
  Edit,
  Trash2,
  Coffee,
  Wine,
  Sparkles,
} from "lucide-react";

const REQUEST_TYPES = [
  { value: "room_service", label: "Room Service", icon: UtensilsCrossed, color: "bg-orange-500" },
  { value: "housekeeping", label: "Housekeeping", icon: Broom, color: "bg-blue-500" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "bg-yellow-500" },
  { value: "laundry", label: "Laundry", icon: Shirt, color: "bg-purple-500" },
  { value: "wake_up_call", label: "Wake-up Call", icon: AlarmClock, color: "bg-green-500" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "bg-gray-500" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const MENU_CATEGORIES = [
  { value: "food", label: "Food", icon: Coffee },
  { value: "beverage", label: "Beverages", icon: Wine },
  { value: "amenities", label: "Amenities", icon: Sparkles },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

export default function GuestServices() {
  const { user } = useAuth();
  const hotelId = user?.hotelId || 1;
  const [activeTab, setActiveTab] = useState("requests");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMenuItemDialog, setShowMenuItemDialog] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Menu item form
  const [menuItemForm, setMenuItemForm] = useState({
    category: "food",
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
  });

  // Queries
  const { data: requests, refetch: refetchRequests } = trpc.guestServices.listRequests.useQuery(
    { hotelId, status: statusFilter === "all" ? undefined : statusFilter as any },
    { enabled: !!hotelId }
  );

  const { data: stats } = trpc.guestServices.getRequestStats.useQuery(
    { hotelId },
    { enabled: !!hotelId }
  );

  const { data: menuItems, refetch: refetchMenuItems } = trpc.guestServices.listMenuItems.useQuery(
    { hotelId },
    { enabled: !!hotelId }
  );

  // Mutations
  const updateRequestMutation = trpc.guestServices.updateRequest.useMutation({
    onSuccess: () => {
      toast.success("Request updated");
      refetchRequests();
      setShowDetailsDialog(false);
    },
    onError: () => toast.error("Failed to update request"),
  });

  const createMenuItemMutation = trpc.guestServices.createMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Menu item created");
      refetchMenuItems();
      setShowMenuItemDialog(false);
      resetMenuItemForm();
    },
    onError: () => toast.error("Failed to create menu item"),
  });

  const updateMenuItemMutation = trpc.guestServices.updateMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Menu item updated");
      refetchMenuItems();
      setShowMenuItemDialog(false);
      setEditingMenuItem(null);
    },
    onError: () => toast.error("Failed to update menu item"),
  });

  const deleteMenuItemMutation = trpc.guestServices.deleteMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Menu item deleted");
      refetchMenuItems();
    },
    onError: () => toast.error("Failed to delete menu item"),
  });

  // WebSocket for real-time notifications
  useEffect(() => {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws?type=client&hotelId=${hotelId}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("[GuestServices] WebSocket connected");
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_service_request") {
          toast.info(`New ${message.payload.requestType.replace("_", " ")} request from Room ${message.payload.roomNumber}`, {
            action: {
              label: "View",
              onClick: () => refetchRequests(),
            },
          });
          refetchRequests();
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [hotelId]);

  const resetMenuItemForm = () => {
    setMenuItemForm({
      category: "food",
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
    });
  };

  const handleUpdateStatus = (id: number, status: string) => {
    updateRequestMutation.mutate({ id, status: status as any });
  };

  const handleCreateMenuItem = () => {
    createMenuItemMutation.mutate({
      hotelId,
      ...menuItemForm,
      price: Number(menuItemForm.price),
    } as any);
  };

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItem(item);
    setMenuItemForm({
      category: item.category,
      name: item.name,
      description: item.description || "",
      price: item.price,
      imageUrl: item.imageUrl || "",
    });
    setShowMenuItemDialog(true);
  };

  const handleSaveMenuItem = () => {
    if (editingMenuItem) {
      updateMenuItemMutation.mutate({
        id: editingMenuItem.id,
        ...menuItemForm,
        price: Number(menuItemForm.price),
      } as any);
    } else {
      handleCreateMenuItem();
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Guest Services</h1>
            <p className="text-muted-foreground">
              Manage room service, housekeeping, and other guest requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.cancelled || 0}</p>
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="menu">Room Service Menu</TabsTrigger>
          </TabsList>

          {/* Service Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests?.map((request) => {
                      const typeInfo = REQUEST_TYPES.find((t) => t.value === request.requestType);
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.roomNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {typeInfo && (
                                <div className={`p-1 rounded ${typeInfo.color}`}>
                                  <typeInfo.icon className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <span>{typeInfo?.label || request.requestType}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {request.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={PRIORITY_COLORS[request.priority || "normal"]}>
                              {request.priority || "normal"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={STATUS_COLORS[request.status || "pending"]}>
                              {request.status || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(request.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {request.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(request.id, "in_progress")}
                                >
                                  <Loader2 className="w-4 h-4" />
                                </Button>
                              )}
                              {request.status === "in_progress" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(request.id, "completed")}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!requests || requests.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No service requests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Room Service Menu Tab */}
          <TabsContent value="menu" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingMenuItem(null);
                  resetMenuItemForm();
                  setShowMenuItemDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </div>

            {MENU_CATEGORIES.map((category) => {
              const categoryItems = menuItems?.filter((item) => item.category === category.value);
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <Card key={category.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="w-5 h-5" />
                      {category.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.description || "-"}</TableCell>
                            <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMenuItem(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMenuItemMutation.mutate({ id: item.id })}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}

            {(!menuItems || menuItems.length === 0) && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No menu items configured. Add items for room service ordering.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Request Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Room</Label>
                    <p className="font-medium">{selectedRequest.roomNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Guest</Label>
                    <p className="font-medium">{selectedRequest.guestName || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium capitalize">{selectedRequest.requestType.replace("_", " ")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <Badge className={PRIORITY_COLORS[selectedRequest.priority || "normal"]}>
                      {selectedRequest.priority || "normal"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedRequest.description || "-"}</p>
                </div>
                {selectedRequest.items && (
                  <div>
                    <Label className="text-muted-foreground">Items Ordered</Label>
                    <div className="mt-2 space-y-1">
                      {JSON.parse(selectedRequest.items).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name} x{item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(value) => {
                      setSelectedRequest({ ...selectedRequest, status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <Textarea
                    placeholder="Add staff notes..."
                    value={selectedRequest.notes || ""}
                    onChange={(e) => setSelectedRequest({ ...selectedRequest, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateRequestMutation.mutate({
                    id: selectedRequest.id,
                    status: selectedRequest.status,
                    notes: selectedRequest.notes,
                  });
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Menu Item Dialog */}
        <Dialog open={showMenuItemDialog} onOpenChange={setShowMenuItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={menuItemForm.category}
                  onValueChange={(value) => setMenuItemForm({ ...menuItemForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MENU_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={menuItemForm.name}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={menuItemForm.description}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                  placeholder="Item description"
                />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={menuItemForm.price}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={menuItemForm.imageUrl}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMenuItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMenuItem}>
                {editingMenuItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CMSDashboardLayout>
  );
}
