import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function GuestInfo() {
  const { user } = useAuth();
  const hotelId = user?.hotelId;
  const isSuperAdmin = user?.role === "superAdmin";
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    roomId: "",
    guestName: "",
    wifiPassword: "",
    wifiSsid: "",
    welcomeMessage: "",
    welcomeMessageEn: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const guestsList = trpc.guestInfo.list.useQuery({
    hotelId,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  }, { enabled: !!hotelId || isSuperAdmin });

  const createGuest = trpc.guestInfo.create.useMutation({
    onSuccess: () => {
      toast.success("Guest information created successfully");
      setFormData({
        roomId: "",
        guestName: "",
        wifiPassword: "",
        wifiSsid: "",
        welcomeMessage: "",
        welcomeMessageEn: "",
      });
      setIsAddingNew(false);
      guestsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteGuest = trpc.guestInfo.delete.useMutation({
    onSuccess: () => {
      toast.success("Guest information deleted successfully");
      guestsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomId || !formData.guestName) {
      toast.error("Please fill in required fields");
      return;
    }
    if (!hotelId && !isSuperAdmin) {
      toast.error("No hotel assigned");
      return;
    }
    createGuest.mutate({
      hotelId: hotelId!,
      roomId: parseInt(formData.roomId),
      guestName: formData.guestName,
      wifiPassword: formData.wifiPassword || undefined,
      wifiSsid: formData.wifiSsid || undefined,
      welcomeMessage: formData.welcomeMessage || undefined,
      welcomeMessageEn: formData.welcomeMessageEn || undefined,
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Guest Information</h2>
            <p className="text-slate-600 mt-1">Manage guest check-ins and welcome messages</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
            <Button onClick={() => setIsAddingNew(!isAddingNew)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Guest
            </Button>
          </div>
        </div>

        {/* Add New Guest Form */}
        {isAddingNew && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Add Guest Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Room ID *
                    </label>
                    <Input
                      type="number"
                      value={formData.roomId}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      placeholder="Room ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Guest Name *
                    </label>
                    <Input
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      placeholder="Guest name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WiFi SSID
                    </label>
                    <Input
                      value={formData.wifiSsid}
                      onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                      placeholder="WiFi network name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WiFi Password
                    </label>
                    <Input
                      value={formData.wifiPassword}
                      onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                      placeholder="WiFi password"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Welcome Message (Thai)
                    </label>
                    <textarea
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                      placeholder="ยินดีต้อนรับ..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Welcome Message (English)
                    </label>
                    <textarea
                      value={formData.welcomeMessageEn}
                      onChange={(e) => setFormData({ ...formData, welcomeMessageEn: e.target.value })}
                      placeholder="Welcome..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGuest.isPending}>
                    {createGuest.isPending ? "Creating..." : "Add Guest"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Guests List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Guests List ({guestsList.data?.total || 0} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {guestsList.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading guests...</div>
            ) : guestsList.data && guestsList.data.data.length > 0 ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Room ID</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Guest Name</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">WiFi SSID</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestsList.data.data.map((guest) => (
                        <tr key={guest.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{guest.roomId}</td>
                          <td className="py-3 px-4 text-slate-600">{guest.guestName}</td>
                          <td className="py-3 px-4 text-slate-600">{guest.wifiSsid || "-"}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              guest.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {guest.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteGuest.mutate({ id: guest.id })}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, guestsList.data.total)} of {guestsList.data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage * itemsPerPage >= (guestsList.data?.total || 0)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">No guests yet. Add one to get started!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
