import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Rooms() {
  const { user } = useAuth();
  const hotelId = user?.hotelId;
  const isSuperAdmin = user?.role === "superAdmin";
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: "",
    floor: "",
    roomType: "Standard",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const roomsList = trpc.rooms.list.useQuery({
    hotelId,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  }, { enabled: !!hotelId || isSuperAdmin });

  const createRoom = trpc.rooms.create.useMutation({
    onSuccess: () => {
      toast.success("Room created successfully");
      setFormData({ roomNumber: "", floor: "", roomType: "Standard" });
      setIsAddingNew(false);
      roomsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteRoom = trpc.rooms.delete.useMutation({
    onSuccess: () => {
      toast.success("Room deleted successfully");
      roomsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber) {
      toast.error("Please enter room number");
      return;
    }
    if (!hotelId && !isSuperAdmin) {
      toast.error("No hotel assigned");
      return;
    }
    createRoom.mutate({
      hotelId: hotelId!,
      roomNumber: formData.roomNumber,
      floor: formData.floor ? parseInt(formData.floor) : undefined,
      roomType: formData.roomType,
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Rooms Management</h2>
            <p className="text-slate-600 mt-1">Manage hotel rooms and guest assignments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
            <Button onClick={() => setIsAddingNew(!isAddingNew)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
          </div>
        </div>

        {/* Add New Room Form */}
        {isAddingNew && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Add New Room</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Room Number *
                    </label>
                    <Input
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g., 101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Floor
                    </label>
                    <Input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Room Type
                    </label>
                    <select
                      value={formData.roomType}
                      onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option>Standard</option>
                      <option>Deluxe</option>
                      <option>Suite</option>
                      <option>Presidential</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRoom.isPending}>
                    {createRoom.isPending ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rooms List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Rooms List ({roomsList.data?.total || 0} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomsList.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading rooms...</div>
            ) : roomsList.data && roomsList.data.data.length > 0 ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Room Number</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Floor</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsList.data.data.map((room) => (
                        <tr key={room.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{room.roomNumber}</td>
                          <td className="py-3 px-4 text-slate-600">{room.floor || "-"}</td>
                          <td className="py-3 px-4 text-slate-600">{room.roomType || "-"}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              room.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {room.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRoom.mutate({ id: room.id })}
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
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, roomsList.data.total)} of {roomsList.data.total}
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
                      disabled={currentPage * itemsPerPage >= (roomsList.data?.total || 0)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">No rooms yet. Add one to get started!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
