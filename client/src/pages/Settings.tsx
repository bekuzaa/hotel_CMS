import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Save, Users, Settings as SettingsIcon, Database } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"system" | "users" | "localization">("system");
  const [systemSettings, setSystemSettings] = useState({
    hotelName: "Hotel TV System",
    defaultLanguage: "th",
    timezone: "Asia/Bangkok",
    maintenanceMode: false,
  });

  const systemConfig = trpc.settings.getSystemConfig.useQuery();
  const systemStatus = trpc.settings.getSystemStatus.useQuery();
  const usersList = trpc.settings.listUsers.useQuery({ limit: 20, offset: 0 });
  const localizationSettings = trpc.settings.getLocalizationSettings.useQuery();

  const updateConfig = trpc.settings.updateSystemConfig.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      systemConfig.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
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

  const handleSaveSystemSettings = () => {
    updateConfig.mutate({
      configKey: "hotelName",
      configValue: systemSettings.hotelName,
      configType: "string",
      description: "Hotel name displayed in the system",
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-600 mt-1">Manage system configuration, users, and localization</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "system"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <SettingsIcon className="w-4 h-4 inline mr-2" />
            System Settings
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab("localization")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "localization"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Localization
          </button>
        </div>

        {/* System Settings Tab */}
        {activeTab === "system" && (
          <div className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                {systemStatus.isLoading ? (
                  <div className="text-slate-600">Loading...</div>
                ) : systemStatus.data ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        systemStatus.data.status === "healthy"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {systemStatus.data.status === "healthy" ? "✓ Healthy" : "✗ Error"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Database</span>
                      <span className="text-slate-900 font-medium">{systemStatus.data.database}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Last Check</span>
                      <span className="text-slate-900 font-medium">
                        {new Date(systemStatus.data.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hotel Name
                    </label>
                    <Input
                      value={systemSettings.hotelName}
                      onChange={(e) => setSystemSettings({ ...systemSettings, hotelName: e.target.value })}
                      placeholder="Enter hotel name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Default Language
                      </label>
                      <select
                        value={systemSettings.defaultLanguage}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultLanguage: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      >
                        <option value="th">ไทย (Thai)</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Timezone
                      </label>
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      >
                        <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium text-slate-700">
                      Enable Maintenance Mode
                    </label>
                  </div>
                  <Button onClick={handleSaveSystemSettings} disabled={updateConfig.isPending} className="gap-2">
                    <Save className="w-4 h-4" />
                    {updateConfig.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {usersList.isLoading ? (
                <div className="text-center py-8 text-slate-600">Loading users...</div>
              ) : usersList.data && usersList.data.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Last Signed In</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.data.data.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{user.name}</td>
                          <td className="py-3 px-4 text-slate-600">{user.email}</td>
                          <td className="py-3 px-4">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole.mutate({ userId: user.id, role: e.target.value as any })}
                              className="px-2 py-1 border border-slate-300 rounded-md text-sm"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                              <option value="user">User</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-sm">
                            {new Date(user.lastSignedIn).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600">No users found</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Localization Tab */}
        {activeTab === "localization" && (
          <Card>
            <CardHeader>
              <CardTitle>Localization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {localizationSettings.isLoading ? (
                <div className="text-center py-8 text-slate-600">Loading...</div>
              ) : localizationSettings.data ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-900 mb-3">Supported Languages</h3>
                    <div className="space-y-2">
                      {localizationSettings.data.supportedLanguages.map((lang) => (
                        <div key={lang.code} className="flex items-center justify-between p-3 border border-slate-200 rounded-md">
                          <div>
                            <div className="font-medium text-slate-900">{lang.name}</div>
                            <div className="text-sm text-slate-600">{lang.nativeName}</div>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {lang.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-2">Default Language</h3>
                    <p className="text-slate-600">
                      Current default: <span className="font-medium">{localizationSettings.data.defaultLanguage}</span>
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </CMSDashboardLayout>
  );
}
