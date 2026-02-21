import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Trash2, Edit2, Shield, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function UserManagement() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superAdmin";
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const usersList = trpc.settings.listUsers.useQuery({
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  });

  // Get hotels for assignment (superAdmin only)
  const hotelsList = trpc.settings.getHotelsForAssignment.useQuery(undefined, {
    enabled: isSuperAdmin,
  });

  const updateUserRole = trpc.settings.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      usersList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const assignHotelToUser = trpc.settings.assignHotelToUser.useMutation({
    onSuccess: () => {
      toast.success("Hotel assigned successfully");
      usersList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUser = trpc.settings.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      usersList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superAdmin":
        return "bg-purple-100 text-purple-800";
      case "hotelAdmin":
        return "bg-orange-100 text-orange-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-600 mt-1">Manage system users and their roles</p>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Users ({usersList.data?.total || 0} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersList.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading users...</div>
            ) : usersList.data && usersList.data.data.length > 0 ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Role</th>
                        {isSuperAdmin && (
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Hotel</th>
                        )}
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Last Signed In</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.data.data.map((userItem) => (
                        <tr key={userItem.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{userItem.name || "N/A"}</td>
                          <td className="py-3 px-4 text-slate-600">{userItem.email || "N/A"}</td>
                          <td className="py-3 px-4">
                            <select
                              value={userItem.role}
                              onChange={(e) =>
                                updateUserRole.mutate({
                                  userId: userItem.id,
                                  role: e.target.value as any,
                                  hotelId: userItem.hotelId || undefined,
                                })
                              }
                              className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleBadgeColor(
                                userItem.role
                              )}`}
                            >
                              {isSuperAdmin && <option value="superAdmin">Super Admin</option>}
                              {isSuperAdmin && <option value="hotelAdmin">Hotel Admin</option>}
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                              <option value="user">User</option>
                            </select>
                          </td>
                          {isSuperAdmin && (
                            <td className="py-3 px-4">
                              <select
                                value={userItem.hotelId || ""}
                                onChange={(e) =>
                                  assignHotelToUser.mutate({
                                    userId: userItem.id,
                                    hotelId: e.target.value ? parseInt(e.target.value) : null,
                                  })
                                }
                                className="px-2 py-1 rounded text-xs border border-slate-300 bg-white"
                              >
                                <option value="">No Hotel</option>
                                {hotelsList.data?.map((hotel) => (
                                  <option key={hotel.id} value={hotel.id}>
                                    {hotel.hotelName}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userItem.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {userItem.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-sm">
                            {new Date(userItem.lastSignedIn).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUser.mutate({ userId: userItem.id })}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, usersList.data.total)} of {usersList.data.total}
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
                      disabled={currentPage * itemsPerPage >= (usersList.data?.total || 0)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">No users found</div>
            )}
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isSuperAdmin && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-1">Super Admin</h3>
                  <p className="text-sm text-purple-800">Full system access, can manage all hotels and subscriptions</p>
                </div>
              )}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-orange-900 mb-1">Hotel Admin</h3>
                <p className="text-sm text-orange-800">Manages a single hotel, can configure all hotel settings</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-1">Admin</h3>
                <p className="text-sm text-red-800">Full access to hotel features and settings</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-1">Manager</h3>
                <p className="text-sm text-blue-800">Can manage content, rooms, and guests</p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-1">Staff</h3>
                <p className="text-sm text-green-800">Can view and manage guest information</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-1">User</h3>
                <p className="text-sm text-gray-800">Read-only access to system information</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
