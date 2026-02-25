import { useState, useEffect } from "react";
import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Clock, Trash2, CheckCircle, XCircle, Loader2, AlarmClock, Calendar } from "lucide-react";

export default function WakeUpCalls() {
  const { user } = useAuth();
  const hotelId = user?.hotelId || 1;

  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Get wake-up calls
  const { data: calls, isLoading, refetch } = trpc.wakeUpCalls.list.useQuery(
    { hotelId, status: statusFilter === "all" ? undefined : statusFilter }
  );

  // Get stats
  const { data: stats } = trpc.wakeUpCalls.getStats.useQuery({ hotelId });

  // Update status mutation
  const updateCall = trpc.wakeUpCalls.update.useMutation({
    onSuccess: () => {
      toast.success("Wake-up call updated");
      refetch();
    },
    onError: () => toast.error("Failed to update wake-up call"),
  });

  // Delete mutation
  const deleteCall = trpc.wakeUpCalls.delete.useMutation({
    onSuccess: () => {
      toast.success("Wake-up call deleted");
      refetch();
    },
    onError: () => toast.error("Failed to delete wake-up call"),
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
      snoozed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    return (
      <Badge variant="outline" className={styles[status] || styles.pending}>
        {status}
      </Badge>
    );
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wake-up Calls</h1>
            <p className="text-muted-foreground">
              Manage guest wake-up call requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {stats?.pending || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {stats?.completed || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats?.today || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {["all", "pending", "completed", "cancelled", "snoozed"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calls List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlarmClock className="w-5 h-5" />
              Wake-up Calls
            </CardTitle>
            <CardDescription>
              {calls?.length || 0} calls found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : calls && calls.length > 0 ? (
              <div className="space-y-4">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-lg">
                        <Clock className="w-6 h-6 text-yellow-500" />
                        <span className="text-sm font-bold text-yellow-500">
                          {new Date(call.scheduledTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Room {call.roomNumber}</span>
                          {getStatusBadge(call.status)}
                          {call.recurring && (
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-400">
                              Recurring
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(call.scheduledTime)}
                        </div>
                        {call.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Note: {call.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {call.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCall.mutate({ id: call.id, status: "completed" })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCall.mutate({ id: call.id, status: "cancelled" })}
                          >
                            <XCircle className="w-4 h-4 mr-1 text-red-500" />
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this wake-up call?")) {
                            deleteCall.mutate({ id: call.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No wake-up calls found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
