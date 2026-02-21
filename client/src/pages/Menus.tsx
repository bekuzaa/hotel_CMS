import CMSDashboardLayout from "@/components/CMSDashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function Menus() {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    category: "Food",
    contentType: "url" as "url" | "image" | "text" | "video",
    contentValue: "",
    iconUrl: "",
  });

  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const currentHotel = trpc.hotels.getCurrentHotel.useQuery(undefined, { enabled: false });
  const hotelsList = trpc.hotels.getAll.useQuery();
  
  const hotelId = selectedHotelId || currentHotel.data?.id;
  const menusList = trpc.menuItems.list.useQuery(
    hotelId ? { hotelId } : { hotelId: 0 },
    { enabled: !!hotelId }
  );

  const createMenu = trpc.menuItems.create.useMutation({
    onSuccess: () => {
      toast.success("Menu item created successfully");
      setFormData({
        name: "",
        nameEn: "",
        category: "Food",
        contentType: "url" as "url" | "image" | "text" | "video",
        contentValue: "",
        iconUrl: "",
      });
      setIsAddingNew(false);
      menusList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMenu = trpc.menuItems.delete.useMutation({
    onSuccess: () => {
      toast.success("Menu item deleted successfully");
      menusList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nameEn) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!hotelId) {
      toast.error("Please select a hotel");
      return;
    }
    createMenu.mutate({
      hotelId,
      ...formData,
      contentType: formData.contentType as "url" | "image" | "text" | "video",
    });
  };

  return (
    <CMSDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Menu Items</h2>
            <p className="text-slate-600 mt-1">Manage menu items displayed on TV screens</p>
          </div>
          <Button onClick={() => setIsAddingNew(!isAddingNew)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Menu Item
          </Button>
        </div>

        {/* Add New Menu Form */}
        {isAddingNew && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Add New Menu Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Menu Name (Thai) *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ชื่อเมนู"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Menu Name (English) *
                    </label>
                    <Input
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Menu Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option>Food</option>
                      <option>Hotel Guide</option>
                      <option>Entertainment</option>
                      <option>Services</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Content Type
                    </label>
                    <select
                      value={formData.contentType}
                      onChange={(e) => setFormData({ ...formData, contentType: e.target.value as "url" | "image" | "text" | "video" })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option value="url">URL</option>
                      <option value="image">Image</option>
                      <option value="text">Text</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Content Value
                    </label>
                    <Input
                      value={formData.contentValue}
                      onChange={(e) => setFormData({ ...formData, contentValue: e.target.value })}
                      placeholder="URL or content"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Icon URL
                    </label>
                    <Input
                      type="url"
                      value={formData.iconUrl}
                      onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMenu.isPending}>
                    {createMenu.isPending ? "Creating..." : "Create Menu Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Menu Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Menu Items List</CardTitle>
          </CardHeader>
          <CardContent>
            {menusList.isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading menu items...</div>
            ) : menusList.data && menusList.data.length > 0 ? (
              <div className="space-y-3">
                {menusList.data.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                    {item.iconUrl && (
                      <img src={item.iconUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-600">{item.nameEn}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                        {item.contentType}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMenu.mutate({ id: item.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">No menu items yet. Add one to get started!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </CMSDashboardLayout>
  );
}
