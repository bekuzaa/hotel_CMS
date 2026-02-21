import { useState } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, CreditCard, Clock, AlertCircle, CheckCircle, Bell, Send, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const [isAssigning, setIsAssigning] = useState(false);
  const [reminderDays, setReminderDays] = useState(7);
  const [formData, setFormData] = useState({
    hotelId: 0,
    packageId: 0,
    startDate: new Date().toISOString().split("T")[0],
    autoRenew: false,
    notes: "",
  });

  // Get hotels list
  const hotelsList = trpc.hotels.getAll.useQuery(undefined, {
    enabled: user?.role === "superAdmin",
  });

  // Get packages list
  const packagesList = trpc.subscriptions.listPackages.useQuery(undefined, {
    enabled: user?.role === "superAdmin",
  });

  // Get hotel subscriptions
  const subscriptionsList = trpc.subscriptions.listHotelSubscriptions.useQuery(
    { limit: 50, offset: 0 },
    { enabled: user?.role === "superAdmin" }
  );

  // Get expiring subscriptions
  const expiringSubscriptions = trpc.subscriptions.getExpiringSubscriptions.useQuery(
    { daysThreshold: reminderDays },
    { enabled: user?.role === "superAdmin" }
  );

  const assignSubscription = trpc.subscriptions.assignSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription assigned successfully");
      setIsAssigning(false);
      subscriptionsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const renewSubscription = trpc.subscriptions.renewSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription renewed successfully");
      subscriptionsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const disableSubscription = trpc.subscriptions.disableSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription disabled successfully");
      subscriptionsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendRenewalReminder = trpc.subscriptions.sendRenewalReminder.useMutation({
    onSuccess: (data) => {
      toast.success(`Reminder sent to ${data.recipientCount} recipients`);
      expiringSubscriptions.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const batchSendReminders = trpc.subscriptions.batchSendReminders.useMutation({
    onSuccess: (data) => {
      toast.success(`Sent ${data.totalSent} reminders`);
      expiringSubscriptions.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hotelId || !formData.packageId) {
      toast.error("Please select hotel and package");
      return;
    }
    assignSubscription.mutate({
      hotelId: formData.hotelId,
      packageId: formData.packageId,
      startDate: new Date(formData.startDate),
      autoRenew: formData.autoRenew,
      notes: formData.notes || undefined,
    });
  };

  const handleRenew = (hotelId: number) => {
    if (confirm("Are you sure you want to renew this subscription?")) {
      renewSubscription.mutate({ hotelId });
    }
  };

  const handleDisable = (hotelId: number) => {
    if (confirm("Are you sure you want to disable this subscription?")) {
      disableSubscription.mutate({ hotelId });
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const getDaysRemaining = (expiryDate: Date | string | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getSubscriptionStatus = (sub: any) => {
    if (!sub.subscription.isActive) {
      return { status: "disabled", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
    const daysRemaining = getDaysRemaining(sub.subscription.expiryDate);
    if (daysRemaining === null) {
      return { status: "lifetime", color: "bg-purple-100 text-purple-800", icon: CheckCircle };
    }
    if (daysRemaining < 0) {
      return { status: "expired", color: "bg-red-100 text-red-800", icon: AlertCircle };
    }
    if (daysRemaining <= 7) {
      return { status: "expiring", color: "bg-yellow-100 text-yellow-800", icon: Clock };
    }
    return { status: "active", color: "bg-green-100 text-green-800", icon: CheckCircle };
  };

  // Only Super Admin can access this page
  if (user?.role !== "superAdmin") {
    return (
      <CMSDashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-slate-600">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
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
            <h2 className="text-3xl font-bold text-slate-900">Subscription Management</h2>
            <p className="text-slate-600 mt-1">Manage hotel subscriptions and packages</p>
          </div>
          <Button onClick={() => setIsAssigning(!isAssigning)} className="gap-2">
            <Plus className="w-4 h-4" />
            {isAssigning ? "Cancel" : "Assign Subscription"}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  {subscriptionsList.data?.data?.length || 0}
                </div>
                <p className="text-slate-600 mt-1">Total Subscriptions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {subscriptionsList.data?.data?.filter((s: any) => getSubscriptionStatus(s).status === "active").length || 0}
                </div>
                <p className="text-slate-600 mt-1">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {subscriptionsList.data?.data?.filter((s: any) => getSubscriptionStatus(s).status === "expiring").length || 0}
                </div>
                <p className="text-slate-600 mt-1">Expiring Soon</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {subscriptionsList.data?.data?.filter((s: any) => ["expired", "disabled"].includes(getSubscriptionStatus(s).status)).length || 0}
                </div>
                <p className="text-slate-600 mt-1">Expired/Disabled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Renewal Reminders Section */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-yellow-600" />
                Renewal Reminders
              </CardTitle>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Expiring within:</label>
                <Select
                  value={reminderDays.toString()}
                  onValueChange={(value) => setReminderDays(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => batchSendReminders.mutate({ daysThreshold: reminderDays })}
                  disabled={batchSendReminders.isPending || !expiringSubscriptions.data?.length}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {batchSendReminders.isPending ? "Sending..." : "Send All Reminders"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expiringSubscriptions.isLoading ? (
              <div className="text-center py-4 text-slate-600">Loading expiring subscriptions...</div>
            ) : expiringSubscriptions.data && expiringSubscriptions.data.length > 0 ? (
              <div className="space-y-3">
                {expiringSubscriptions.data.map((item: any) => (
                  <div key={item.subscription.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{item.hotel?.hotelName}</div>
                        <div className="text-sm text-slate-600">
                          Package: {item.package?.packageName} • 
                          Expires: {formatDate(item.subscription.expiryDate)} • 
                          <span className="text-yellow-700 font-medium ml-1">
                            {item.daysRemaining} days left
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendRenewalReminder.mutate({ hotelId: item.hotel.id })}
                      disabled={sendRenewalReminder.isPending}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Reminder
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                No subscriptions expiring within {reminderDays} days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Subscription Form */}
        {isAssigning && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Assign Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hotel *
                    </label>
                    <Select
                      value={formData.hotelId?.toString() || ""}
                      onValueChange={(value) => setFormData({ ...formData, hotelId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel" />
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Package *
                    </label>
                    <Select
                      value={formData.packageId?.toString() || ""}
                      onValueChange={(value) => setFormData({ ...formData, packageId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select package" />
                      </SelectTrigger>
                      <SelectContent>
                        {packagesList.data?.map((pkg: any) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {pkg.packageName} ({pkg.durationDays ? `${pkg.durationDays} days` : "Lifetime"})
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notes
                    </label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={formData.autoRenew}
                    onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="autoRenew" className="text-sm text-slate-700">
                    Enable auto-renewal
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAssigning(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={assignSubscription.isPending}>
                    {assignSubscription.isPending ? "Assigning..." : "Assign Subscription"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Subscriptions List */}
        <Card>
          <CardHeader>
            <CardTitle>Hotel Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionsList.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading subscriptions...</div>
            ) : subscriptionsList.data?.data && subscriptionsList.data.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Hotel</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Package</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Expiry Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionsList.data.data.map((sub: any) => {
                      const { status, color, icon: StatusIcon } = getSubscriptionStatus(sub);
                      const daysRemaining = getDaysRemaining(sub.subscription.expiryDate);
                      
                      return (
                        <tr key={sub.subscription.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {sub.hotel?.hotelName || "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {sub.package?.packageName || "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDate(sub.subscription.startDate)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDate(sub.subscription.expiryDate)}
                            {daysRemaining !== null && daysRemaining > 0 && (
                              <span className="ml-2 text-xs text-slate-500">
                                ({daysRemaining} days left)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRenew(sub.subscription.hotelId)}
                              title="Renew"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisable(sub.subscription.hotelId)}
                              title="Disable"
                            >
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No subscriptions yet. Assign one to get started!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
