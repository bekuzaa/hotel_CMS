import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function HotelsManagement() {
  const { user } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any>(null);
  const [formData, setFormData] = useState({
    hotelName: "",
    hotelCode: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    wifiSSID: "",
    wifiPassword: "",
    supportPhone: "",
    supportEmail: "",
    totalRooms: 0,
  });

  const hotelsList = trpc.hotels.getAll.useQuery(undefined, {
    enabled: user?.role === "superAdmin",
  });

  const createHotel = trpc.hotels.create.useMutation({
    onSuccess: () => {
      toast.success("Hotel created successfully");
      resetForm();
      hotelsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateHotel = trpc.hotels.update.useMutation({
    onSuccess: () => {
      toast.success("Hotel updated successfully");
      resetForm();
      hotelsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteHotel = trpc.hotels.delete.useMutation({
    onSuccess: () => {
      toast.success("Hotel deleted successfully");
      hotelsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      hotelName: "",
      hotelCode: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      wifiSSID: "",
      wifiPassword: "",
      supportPhone: "",
      supportEmail: "",
      totalRooms: 0,
    });
    setIsAddingNew(false);
    setEditingHotel(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hotelName || !formData.hotelCode) {
      toast.error("Please fill in hotel name and code");
      return;
    }

    if (editingHotel) {
      updateHotel.mutate({
        id: editingHotel.id,
        ...formData,
      });
    } else {
      createHotel.mutate(formData);
    }
  };

  const handleEdit = (hotel: any) => {
    setEditingHotel(hotel);
    setFormData({
      hotelName: hotel.hotelName,
      hotelCode: hotel.hotelCode,
      address: hotel.address || "",
      city: hotel.city || "",
      country: hotel.country || "",
      phone: hotel.phone || "",
      email: hotel.email || "",
      wifiSSID: hotel.wifiSSID || "",
      wifiPassword: hotel.wifiPassword || "",
      supportPhone: hotel.supportPhone || "",
      supportEmail: hotel.supportEmail || "",
      totalRooms: hotel.totalRooms || 0,
    });
    setIsAddingNew(true);
  };

  const handleDelete = (hotel: any) => {
    if (confirm(`Are you sure you want to delete "${hotel.hotelName}"?`)) {
      deleteHotel.mutate({ id: hotel.id });
    }
  };

  // Only Super Admin can access this page
  if (user?.role !== "superAdmin") {
    return (
      <CMSDashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-slate-600">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Only Super Admins can access this page.</p>
            </div>
          </CardContent>
        </Card>
      </CMSDashboardLayout>
    );
  }

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Hotels Management</h2>
            <p className="text-slate-600 mt-1">Manage hotels in the system</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsAddingNew(!isAddingNew);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {isAddingNew ? "Cancel" : "Add Hotel"}
          </Button>
        </div>

        {/* Add/Edit Hotel Form */}
        {isAddingNew && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>{editingHotel ? "Edit Hotel" : "Add New Hotel"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hotel Name *
                    </label>
                    <Input
                      value={formData.hotelName}
                      onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                      placeholder="Grand Hotel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hotel Code *
                    </label>
                    <Input
                      value={formData.hotelCode}
                      onChange={(e) => setFormData({ ...formData, hotelCode: e.target.value })}
                      placeholder="GH001"
                      disabled={!!editingHotel}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Address
                    </label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bangkok"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Country
                    </label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Thailand"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+66 2 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@hotel.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WiFi SSID
                    </label>
                    <Input
                      value={formData.wifiSSID}
                      onChange={(e) => setFormData({ ...formData, wifiSSID: e.target.value })}
                      placeholder="HotelGuest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WiFi Password
                    </label>
                    <Input
                      value={formData.wifiPassword}
                      onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                      placeholder="password123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Support Phone
                    </label>
                    <Input
                      value={formData.supportPhone}
                      onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                      placeholder="+66 2 123 4568"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Support Email
                    </label>
                    <Input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                      placeholder="support@hotel.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Total Rooms
                    </label>
                    <Input
                      type="number"
                      value={formData.totalRooms}
                      onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) || 0 })}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createHotel.isPending || updateHotel.isPending}
                  >
                    {createHotel.isPending || updateHotel.isPending
                      ? "Saving..."
                      : editingHotel
                      ? "Update Hotel"
                      : "Create Hotel"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Hotels List */}
        <Card>
          <CardHeader>
            <CardTitle>Hotels ({hotelsList.data?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {hotelsList.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading hotels...</div>
            ) : hotelsList.data && hotelsList.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Hotel Name</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">City</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Rooms</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotelsList.data.map((hotel: any) => (
                      <tr key={hotel.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">{hotel.hotelName}</td>
                        <td className="py-3 px-4 text-slate-600">{hotel.hotelCode}</td>
                        <td className="py-3 px-4 text-slate-600">{hotel.city || "-"}</td>
                        <td className="py-3 px-4 text-slate-600">{hotel.totalRooms || 0}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              hotel.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {hotel.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(hotel)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(hotel)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No hotels yet. Add one to get started!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
