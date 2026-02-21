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
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TVChannels() {
  const { user } = useAuth();
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    streamUrl: "",
    thumbnailUrl: "",
    category: "TV",
    description: "",
    descriptionEn: "",
  });

  // Get hotels list for Super Admin
  const hotelsList = trpc.hotels.getAll.useQuery(undefined, {
    enabled: user?.role === "superAdmin",
  });

  // Get current hotel for Hotel Admin
  const currentHotel = trpc.hotels.getCurrentHotel.useQuery(undefined, {
    enabled: user?.role === "hotelAdmin",
  });

  // Set default hotel ID
  const hotelId =
    user?.role === "hotelAdmin"
      ? currentHotel.data?.id
      : selectedHotelId;

  const channelsList = trpc.tvChannels.list.useQuery(
    hotelId ? { hotelId } : { hotelId: 0 },
    { enabled: !!hotelId }
  );

  const createChannel = trpc.tvChannels.create.useMutation({
    onSuccess: () => {
      toast.success("Channel created successfully");
      setFormData({
        name: "",
        nameEn: "",
        streamUrl: "",
        thumbnailUrl: "",
        category: "TV",
        description: "",
        descriptionEn: "",
      });
      setIsAddingNew(false);
      channelsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteChannel = trpc.tvChannels.delete.useMutation({
    onSuccess: () => {
      toast.success("Channel deleted successfully");
      channelsList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nameEn || !formData.streamUrl) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!hotelId) {
      toast.error("Please select a hotel");
      return;
    }
    createChannel.mutate({
      ...formData,
      hotelId,
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">TV Channels</h2>
            <p className="text-slate-600 mt-1">Manage your TV channels and streaming sources</p>
          </div>
          <Button onClick={() => setIsAddingNew(!isAddingNew)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Channel
          </Button>
        </div>

        {/* Hotel Selector for Super Admin */}
        {user?.role === "superAdmin" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
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

        {/* Add New Channel Form */}
        {isAddingNew && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Add New Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Channel Name (Thai) *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ชื่อช่องรายการ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Channel Name (English) *
                    </label>
                    <Input
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Channel Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Stream URL *
                    </label>
                    <Input
                      value={formData.streamUrl}
                      onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                      placeholder="https://example.com/stream"
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Thumbnail URL
                    </label>
                    <Input
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      placeholder="https://example.com/thumb.jpg"
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TV">TV</SelectItem>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                        <SelectItem value="Netflix">Netflix</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description (Thai)
                    </label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="รายละเอียด"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description (English)
                  </label>
                  <Input
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    placeholder="Description"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createChannel.isPending}>
                    {createChannel.isPending ? "Creating..." : "Create Channel"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingNew(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Channels List */}
        {channelsList.isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-500">Loading channels...</p>
            </CardContent>
          </Card>
        ) : channelsList.data?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-500">No channels found. Create your first channel!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {channelsList.data?.map((channel) => (
              <Card key={channel.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{channel.name}</h3>
                      <p className="text-sm text-slate-600">{channel.nameEn}</p>
                      <p className="text-sm text-slate-500 mt-2">{channel.streamUrl}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {channel.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Edit functionality
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure?")) {
                            deleteChannel.mutate({ id: channel.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CMSDashboardLayout>
  );
}
